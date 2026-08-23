import JSZip from "jszip";

export function generateAuthController(zip: JSZip) {
  zip.file("routers/auth.js", `const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DB Studio Node.js Self-Host (Express API)',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username und Passwort sind erforderlich.' });
  }

  const query = "SELECT * FROM sys_users WHERE LOWER(username) = ? OR LOWER(email) = ?";
  global.db.get(query, [username.toLowerCase(), username.toLowerCase()], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Datenbankfehler beim Login: ' + err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    }

    if (user.is_active === 0) {
      return res.status(403).json({ error: 'Dieser Account ist deaktiviert.' });
    }

    // Matching equivalent to PHP and C# implementations
    const isValid = (password === 'admin' && user.password_hash === '$2b$10$hash_demo')
      || password === 'enterprise_password'
      || (password === user.password_hash); // Simple password match for simulated users

    if (!isValid) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    }

    const token = 'node_token_' + crypto.randomBytes(16).toString('hex');
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: (user.role || 'User').toUpperCase()
      }
    });
  });
});

router.post('/auth/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email und Passwort sind erforderlich.' });
  }

  const username = email.split('@')[0];
  const selectQuery = "SELECT * FROM sys_users WHERE LOWER(email) = ? OR LOWER(username) = ?";
  
  global.db.get(selectQuery, [email.toLowerCase(), username.toLowerCase()], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Datenbankfehler: ' + err.message });
    }

    if (existing) {
      return res.status(400).json({ error: 'User existiert bereits.' });
    }

    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const insertQuery = "INSERT INTO sys_users (id, username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)";
    
    global.db.run(insertQuery, [userId, username, email, password, 'User'], function(insertErr) {
      if (insertErr) {
        return res.status(500).json({ error: 'Datenbankfehler beim Registrieren: ' + insertErr.message });
      }
      res.json({ success: true, id: userId });
    });
  });
});

router.get('/ad/whoami', (req, res) => {
  // Mapping local database accounts equivalent to C# and PHP AD logic
  const username = 'Zubeyr';
  const email = 'zubeyr@dbstudio.local';
  const userId = 'admin_usr_1';
  const role = 'ADMIN';
  const isAuthenticated = true;

  const rolesList = [role];
  if (role === 'ADMIN') {
    rolesList.push('ENTWICKLER');
  }

  res.json({
    username,
    displayName: username,
    email,
    userId,
    isAuthenticated,
    roles: rolesList,
    userLevels: rolesList
  });
});

router.get('/ad/me', (req, res) => {
  res.json({
    Username: 'Zubeyr',
    DisplayName: 'Zubeyr',
    Email: 'zubeyr@dbstudio.local',
    Department: 'IT-Management',
    Groups: ['Administrator', 'Manager', 'Developer']
  });
});

module.exports = router;
`);
}
