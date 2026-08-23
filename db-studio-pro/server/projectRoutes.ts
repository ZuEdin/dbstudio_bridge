import { Router } from "express";
import { state } from "./state";

export const projectRouter = Router();

// Projects & Sync Endpoints
projectRouter.get("/projects", (req, res) => {
  if (state.serverProjectsStore.length > 0) {
    res.json(state.serverProjectsStore);
    return;
  }
  const teamProjWithData = state.teamProjects.find((p: any) => p.data && p.data.tables);
  if (teamProjWithData) {
    res.json([teamProjWithData]);
    return;
  }
  res.json([{
    id: "proj_default",
    name: "DB Studio Self-Host Server Project",
    data: {
      tables: [
        {
          id: "tbl_sys_users",
          name: "Users",
          fields: [
            { id: "f1", name: "Id", type: "INTEGER", isPrimaryKey: true, isAutoIncrement: true },
            { id: "f2", name: "Username", type: "VARCHAR", length: 50, allowNull: false },
            { id: "f3", name: "Email", type: "VARCHAR", length: 100 },
            { id: "f4", name: "Role", type: "VARCHAR", length: 20 }
          ],
          data: [
            { Id: 1, Username: "zuboedin", Email: "zuboedin@gmail.com", Role: "Administrator" },
            { Id: 2, Username: "smueller", Email: "sarah.web@firma.de", Role: "Developer" }
          ]
        }
      ],
      queries: [],
      relationships: []
    }
  }]);
});

projectRouter.get("/projects/:id", (req, res) => {
  const projId = req.params.id;
  const found = state.serverProjectsStore.find(p => p.id === projId || p.Id === projId);
  if (found) {
    res.json(found);
    return;
  }
  const teamProj = state.teamProjects.find((p: any) => p.id === projId);
  if (teamProj) {
    res.json(teamProj);
    return;
  }
  if (state.serverProjectsStore.length > 0) {
    res.json(state.serverProjectsStore[0]);
    return;
  }
  res.status(404).json({ error: "Projekt nicht gefunden" });
});

projectRouter.post("/projects", (req, res) => {
  const projectPayload = req.body;
  if (projectPayload) {
    const projId = projectPayload.id || "proj_default";
    const idx = state.serverProjectsStore.findIndex(p => p.id === projId);
    if (idx !== -1) {
      state.serverProjectsStore[idx] = projectPayload;
    } else {
      state.serverProjectsStore.push(projectPayload);
    }
  }
  res.json({ success: true, project: projectPayload });
});

projectRouter.post("/sync", (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Real Team Projects Management (Owner & Collaborators)
projectRouter.get("/team/projects", (req, res) => {
  res.json(state.teamProjects);
});

projectRouter.post("/team/projects", (req, res) => {
  const { name, description, ownerEmail, ownerName } = req.body;
  if (!name) {
    res.status(400).json({ error: "Projektname ist erforderlich." });
    return;
  }
  
  // Check role from header or body
  const requesterRole = req.headers["x-user-role"] || req.body.ownerRole;
  if (state.isAdConfigured && requesterRole && requesterRole !== "admin") {
    res.status(403).json({ error: "Aktion verweigert: Nur Administratoren dürfen neue Projekte anlegen." });
    return;
  }

  const owner = {
    email: ownerEmail || "owner@company.com",
    name: ownerName || (ownerEmail ? ownerEmail.split("@")[0] : "Projekt Owner"),
    role: "Owner"
  };

  const newProj = {
    id: "proj_" + Math.random().toString(36).substring(2, 9),
    name,
    description: description || "Echtes Team-Cloud-Projekt.",
    status: "AKTIV",
    isCloud: true,
    owner: owner.name,
    ownerEmail: owner.email,
    created: Date.now(),
    memberCount: 1,
    teamMembers: [
      {
        id: "mem_" + Math.random().toString(36).substring(2, 7),
        email: owner.email,
        name: owner.name,
        role: "Projekt-Owner",
        status: "AKTIV"
      }
    ]
  };
  state.teamProjects.push(newProj);
  res.status(201).json(newProj);
});

// Delete Team Cloud Project
projectRouter.delete("/team/projects/:id", (req, res) => {
  const { id } = req.params;
  const index = state.teamProjects.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    state.teamProjects.splice(index, 1);
    res.json({ success: true, message: "Projekt erfolgreich aus Cloud-Datenbank gelöscht." });
    return;
  }
  res.status(404).json({ error: "Projekt nicht gefunden." });
});

// Invite / Add Team Member to Cloud Project
projectRouter.post("/team/projects/:id/members", (req, res) => {
  const { id } = req.params;
  const { email, role, name } = req.body;

  const project = state.teamProjects.find((p: any) => p.id === id);
  if (!project) {
    res.status(404).json({ error: "Projekt nicht gefunden." });
    return;
  }

  if (!email) {
    res.status(400).json({ error: "E-Mail-Adresse erforderlich." });
    return;
  }

  if (!project.teamMembers) project.teamMembers = [];

  if (project.teamMembers.some((m: any) => m.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: "Diese E-Mail-Adresse ist bereits Mitglied in diesem Projekt." });
    return;
  }

  const newMember = {
    id: "mem_" + Math.random().toString(36).substring(2, 7),
    email,
    name: name || email.split("@")[0],
    role: role || "Entwickler",
    status: "AKTIV",
    joinedAt: Date.now()
  };

  project.teamMembers.push(newMember);
  project.memberCount = project.teamMembers.length;

  res.status(201).json({ success: true, member: newMember, project });
});

// Remove Team Member from Cloud Project
projectRouter.delete("/team/projects/:id/members/:memberId", (req, res) => {
  const { id, memberId } = req.params;
  const project = state.teamProjects.find((p: any) => p.id === id);
  if (!project) {
    res.status(404).json({ error: "Projekt nicht gefunden." });
    return;
  }

  if (!project.teamMembers) {
    res.status(400).json({ error: "Keine Mitglieder in diesem Projekt." });
    return;
  }

  const index = project.teamMembers.findIndex((m: any) => m.id === memberId);
  if (index === -1) {
    res.status(404).json({ error: "Mitglied nicht gefunden." });
    return;
  }

  const removedMember = project.teamMembers.splice(index, 1)[0];
  project.memberCount = project.teamMembers.length;

  res.json({ success: true, message: "Mitglied erfolgreich entfernt.", removedMember, project });
});

// Team Members Global List
projectRouter.get("/team/members", (req, res) => {
  res.json(state.teamMembers);
});

// Create Team Member
projectRouter.post("/team/members", (req, res) => {
  const { email, role, name, source } = req.body;
  if (!email) {
    res.status(400).json({ error: "E-Mail-Adresse ist erforderlich." });
    return;
  }

  if (state.teamMembers.some((m: any) => m.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: "Ein Benutzer mit dieser E-Mail existiert bereits." });
    return;
  }

  const newMember = {
    email,
    role: role || "Entwickler",
    name: name || email.split("@")[0],
    source: source || "Lokal"
  };
  state.teamMembers.push(newMember);
  res.status(201).json(newMember);
});

// Update Team Member
projectRouter.put("/team/members/:email", (req, res) => {
  const { email } = req.params;
  const { role, name, source } = req.body;
  const member = state.teamMembers.find((m: any) => m.email.toLowerCase() === email.toLowerCase());
  if (!member) {
    res.status(404).json({ error: "Benutzer nicht gefunden." });
    return;
  }

  if (role) member.role = role;
  if (name) member.name = name;
  if (source) member.source = source;

  res.json(member);
});

// Delete Team Member
projectRouter.delete("/team/members/:email", (req, res) => {
  const { email } = req.params;
  const index = state.teamMembers.findIndex((m: any) => m.email.toLowerCase() === email.toLowerCase());
  if (index === -1) {
    res.status(404).json({ error: "Benutzer nicht gefunden." });
    return;
  }

  const deleted = state.teamMembers.splice(index, 1);
  res.json({ success: true, message: "Benutzer gelöscht.", member: deleted[0] });
});
