import { Router } from "express";
import { state } from "./state";

export const authRouter = Router();

// Authentication & Session Endpoint (Real user authentication)
authRouter.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "E-Mail/Benutzername und Passwort sind erforderlich." });
    return;
  }
  const email = username.includes("@") ? username : `${username}@company.com`;
  
  // 1. Check Active Directory (mock domain check)
  const isDomainUser = email.endsWith('@firma.de') || email.endsWith('@firma.local');
  if (isDomainUser && state.isAdConfigured) {
    // AD Login successful
    const name = email.split("@")[0].replace(/[._]/g, ' ');
    const role = email.toLowerCase().includes("admin") ? "ADMIN" : "MEMBER";
    res.json({
      success: true,
      token: "jwt_ad_" + Buffer.from(email).toString("base64"),
      user: {
        id: "ad_" + Math.random().toString(36).substring(2, 9),
        username: email,
        name: name,
        email: email,
        role: role
      }
    });
    return;
  }

  // 2. Check Local Registered Users
  const localUser = state.registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (localUser) {
    res.json({
      success: true,
      token: "jwt_local_" + Buffer.from(email).toString("base64"),
      user: {
        id: localUser.id,
        username: localUser.email,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role
      }
    });
    return;
  }

  // 3. Fallback for the hardcoded admin if not registered (for demo resilience)
  if (email === "zuboedin@gmail.com") {
    res.json({
      success: true,
      token: "jwt_admin",
      user: {
        id: "usr_admin",
        username: email,
        name: "Zubeyr",
        email: email,
        role: "ADMIN"
      }
    });
    return;
  }

  res.status(401).json({ error: "Ungültige Anmeldedaten. Wenn Sie kein Domänenkonto haben, registrieren Sie sich bitte." });
});

authRouter.post("/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "E-Mail und Passwort sind erforderlich." });
    return;
  }
  if (state.registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: "Benutzer existiert bereits." });
    return;
  }

  const newUser = {
    id: "usr_" + Math.random().toString(36).substring(2, 9),
    email,
    password, // In a real app, hash this!
    name: name || email.split('@')[0],
    role: email.toLowerCase().includes("admin") ? "ADMIN" : "MEMBER"
  };

  state.registeredUsers.push(newUser);
  
  // Optionally add to team members if not AD
  if (!state.teamMembers.some(m => m.email === email)) {
     state.teamMembers.push({ email, role: newUser.role === "ADMIN" ? "Administrator" : "Entwickler", name: newUser.name, source: "Lokal" });
  }

  res.json({ success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
});

// Chat Endpoints
export const chatRouter = Router();

chatRouter.get("/messages", (req, res) => {
  res.json(state.chatMessages);
});

chatRouter.post("/messages", (req, res) => {
  const msg = req.body;
  msg.timestamp = Date.now();
  if (!msg.id) msg.id = Math.random().toString(36).substring(2, 9);
  state.chatMessages.push(msg);
  res.json(msg);
});

// Active Directory / LDAP Status Check
authRouter.get("/ldap-check", (req, res) => {
  res.json({
    isAdConfigured: state.isAdConfigured,
    serverAddress: "ldap://ads.firma.local:389",
    baseDn: "DC=firma,DC=local",
    users: state.teamMembers
  });
});

// Toggle AD Simulation
authRouter.post("/ldap-toggle", (req, res) => {
  state.isAdConfigured = !state.isAdConfigured;
  res.json({
    isAdConfigured: state.isAdConfigured,
    message: state.isAdConfigured ? "Active Directory Controller gekoppelt" : "Active Directory Offline"
  });
});

// Active Directory Users list & search and whoami endpoints
const mockAdUsers = [
  { username: "firma\\sarah.web", displayName: "Sarah Müller", email: "sarah.web@firma.de", department: "IT-Entwicklung", groups: ["firma\\entwickler", "firma\\mitarbeiter", "firma\\coder"] },
  { username: "firma\\tom.db", displayName: "Tom Schmidt", email: "tom.db@firma.de", department: "Datenbanken", groups: ["firma\\architekten", "firma\\mitarbeiter"] },
  { username: "firma\\zubeyr", displayName: "Zubeyr", email: "zuboedin@gmail.com", department: "Administration", groups: ["firma\\administratoren", "firma\\leitung"] },
  { username: "firma\\frank.weber", displayName: "Frank Weber", email: "frank.weber@firma.de", department: "Geschäftsführung", groups: ["firma\\leitung"] },
  { username: "firma\\julia.klein", displayName: "Julia Klein", email: "julia.klein@firma.de", department: "HR & Personal", groups: ["firma\\hr", "firma\\mitarbeiter"] }
];

export const adRouter = Router();

adRouter.get("/me", (req, res) => {
  if (!state.isAdConfigured) {
    res.status(503).json({ error: "Active Directory Controller nicht aktiv." });
    return;
  }
  // Return a real AD user based on current context (defaulting to Zubeyr)
  res.json(mockAdUsers[2]); 
});

adRouter.get("/whoami", (req, res) => {
  if (!state.isAdConfigured) {
    res.json({
      username: "local\\guest",
      userId: "guest_123",
      email: "guest@firma.de",
      isAuthenticated: false,
      roles: ["Guest"]
    });
    return;
  }
  // Return whoami user details with Roles matching the Claims Transformation
  res.json({
    username: "Zubeyr",
    displayName: "Edin Zubovic",
    email: "zuboedin@gmail.com",
    userId: "zuboedin@gmail.com",
    isAuthenticated: true,
    roles: ["Administrator", "Manager", "Developer", "User", "Guest"]
  });
});

adRouter.get("/search", (req, res) => {
  if (!state.isAdConfigured) {
    res.status(503).json({ error: "Active Directory Controller nicht aktiv." });
    return;
  }
  const query = (req.query.q || req.query.search || "").toString().toLowerCase();
  if (!query) {
    res.json(mockAdUsers); // Return all mock users if query is empty or for easy listing
    return;
  }
  const filtered = mockAdUsers.filter(u => 
    u.displayName.toLowerCase().includes(query) || 
    u.username.toLowerCase().includes(query) || 
    u.email.toLowerCase().includes(query)
  );
  res.json(filtered);
});

adRouter.get("/users", (req, res) => {
  if (!state.isAdConfigured) {
    res.status(503).json({ error: "Active Directory Controller nicht aktiv." });
    return;
  }
  res.json(mockAdUsers);
});
