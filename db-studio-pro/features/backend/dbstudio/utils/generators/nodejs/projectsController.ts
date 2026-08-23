import JSZip from "jszip";

export function generateProjectsController(zip: JSZip) {
  zip.file("routers/projects.js", `const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.get('/projects', (req, res) => {
  global.db.all('SELECT * FROM sys_projects ORDER BY created_at DESC', [], (err, projects) => {
    if (err) return res.status(500).json({ error: 'Datenbankfehler: ' + err.message });
    
    global.db.all('SELECT * FROM sys_users', [], (errUsers, users) => {
      if (errUsers) return res.status(500).json({ error: 'Datenbankfehler: ' + errUsers.message });

      const result = projects.map(p => {
        let ownerUser = null;
        for (const u of users) {
          if (u.id === p.owner_id || u.email === p.owner_id || u.username === p.owner_id) {
            ownerUser = u;
            break;
          }
        }

        const ownerName = ownerUser ? ownerUser.username : (p.owner_id || 'Administrator');
        const cleanOwner = ownerName.toLowerCase().replace(/\\s+/g, '.').replace(/\\\\/g, '.');
        const ownerEmail = ownerUser ? ownerUser.email : (ownerName.includes('@') ? ownerName : \`\${cleanOwner}@firma.de\`);

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          status: 'AKTIV',
          isCloud: p.is_cloud === 1,
          dbType: p.db_type || 'SQLite',
          language: p.language || 'nodejs',
          owner: ownerName,
          ownerEmail: ownerEmail,
          created: p.last_modified || (new Date(p.created_at).getTime()),
          memberCount: 1,
          teamMembers: [
            {
              id: 'mem_owner',
              email: ownerEmail,
              name: ownerName,
              role: 'Projekt-Owner',
              status: 'AKTIV'
            }
          ]
        };
      });

      res.json(result);
    });
  });
});

router.get('/team/projects', (req, res) => {
  res.redirect('/api/projects');
});

router.get('/projects/:id', (req, res) => {
  const { id } = req.params;
  global.db.get('SELECT * FROM sys_projects WHERE id = ?', [id], (err, p) => {
    if (err) return res.status(500).json({ error: 'Datenbankfehler: ' + err.message });
    if (!p) return res.status(404).json({ error: 'Projekt nicht gefunden' });

    global.db.get('SELECT data_json FROM sys_project_payloads WHERE project_id = ?', [id], (errPayload, payload) => {
      let data = null;
      if (payload && payload.data_json) {
        try {
          data = JSON.parse(payload.data_json);
        } catch (e) {
          data = payload.data_json;
        }
      }

      global.db.all('SELECT * FROM sys_users', [], (errUsers, users) => {
        let ownerUser = null;
        if (!errUsers && users) {
          for (const u of users) {
            if (u.id === p.owner_id || u.email === p.owner_id || u.username === p.owner_id) {
              ownerUser = u;
              break;
            }
          }
        }

        const ownerName = ownerUser ? ownerUser.username : (p.owner_id || 'Administrator');
        const ownerEmail = ownerUser ? ownerUser.email : (ownerName.includes('@') ? ownerName : \`\${ownerName.toLowerCase()}@firma.de\`);

        res.json({
          id: p.id,
          name: p.name,
          description: p.description,
          dbType: p.db_type || 'SQLite',
          language: p.language || 'nodejs',
          isCloud: p.is_cloud === 1,
          owner: ownerName,
          ownerEmail: ownerEmail,
          created: p.last_modified || (new Date(p.created_at).getTime()),
          data
        });
      });
    });
  });
});

router.post('/projects', (req, res) => {
  const id = req.body.id || 'proj_' + crypto.randomBytes(8).toString('hex');
  const name = req.body.name || 'Neues Projekt';
  const description = req.body.description || '';
  const dbType = req.body.dbType || 'SQLite';
  const isCloud = req.body.isCloud === true ? 1 : 0;
  const ownerId = 'admin_usr_1';
  const lastModified = Date.now();

  global.db.get('SELECT id FROM sys_projects WHERE id = ?', [id], (err, exists) => {
    if (err) return res.status(500).json({ error: 'Datenbankfehler: ' + err.message });

    const handlePayload = () => {
      if (req.body.data !== undefined) {
        const dataJson = JSON.stringify(req.body.data);
        global.db.run(
          'INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET data_json = excluded.data_json',
          [id, dataJson],
          (errPayload) => {
            if (errPayload) return res.status(500).json({ error: 'Fehler beim Speichern der Payload: ' + errPayload.message });
            res.json({ success: true, id });
          }
        );
      } else {
        res.json({ success: true, id });
      }
    };

    if (exists) {
      global.db.run(
        'UPDATE sys_projects SET name = ?, description = ?, db_type = ?, is_cloud = ?, last_modified = ? WHERE id = ?',
        [name, description, dbType, isCloud, lastModified, id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: 'Fehler beim Updaten: ' + updateErr.message });
          handlePayload();
        }
      );
    } else {
      global.db.run(
        'INSERT INTO sys_projects (id, name, description, db_type, language, is_cloud, owner_id, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, description, dbType, 'nodejs', isCloud, ownerId, lastModified],
        (insertErr) => {
          if (insertErr) return res.status(500).json({ error: 'Fehler beim Erstellen: ' + insertErr.message });
          handlePayload();
        }
      );
    }
  });
});

module.exports = router;
`);
}
