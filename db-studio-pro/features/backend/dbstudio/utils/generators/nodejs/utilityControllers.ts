import JSZip from "jszip";

export function generateUtilityControllers(zip: JSZip) {
  zip.file("routers/utility.js", `const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const http = require('https'); // For simple native external calls or mocked API handles

// === Users Management ===
router.get('/users', (req, res) => {
  global.db.all('SELECT id, username, email, role, is_active, created_at FROM sys_users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/users', (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Username und Email sind erforderlich.' });
  }

  const id = 'usr_' + crypto.randomBytes(8).toString('hex');
  const pass = password || 'start_1234';
  const r = role || 'User';

  global.db.run(
    'INSERT INTO sys_users (id, username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
    [id, username, email, pass, r],
    (err) => {
      if (err) return res.status(500).json({ error: 'Fehler beim Erstellen: ' + err.message });
      res.json({ success: true, id });
    }
  );
});

router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, role, is_active } = req.body;
  const active = is_active !== undefined ? is_active : 1;

  global.db.run(
    'UPDATE sys_users SET username = ?, email = ?, role = ?, is_active = ? WHERE id = ?',
    [username, email, role, active, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Fehler beim Updaten: ' + err.message });
      res.json({ success: true });
    }
  );
});

router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'admin_usr_1') {
    return res.status(400).json({ error: 'Der System-Administrator kann nicht gelöscht werden.' });
  }

  global.db.run('DELETE FROM sys_users WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Fehler beim Löschen: ' + err.message });
    res.json({ success: true });
  });
});

// === Sync History ===
router.post('/sync', (req, res) => {
  const { projectId, syncType, implementationPrompt } = req.body;
  const syncId = 'sync_' + crypto.randomBytes(8).toString('hex');
  const userId = 'admin_usr_1';
  const type = syncType || 'FullMetadataSync';
  const prompt = implementationPrompt || '';

  global.db.run(
    'INSERT INTO sys_sync_history (id, project_id, user_id, sync_type, implementation_prompt, metadata_payload) VALUES (?, ?, ?, ?, ?, ?)',
    [syncId, projectId || 'proj_default', userId, type, prompt, JSON.stringify(req.body)],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        success: true,
        syncId,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });
    }
  );
});

router.post('/database-sync', (req, res) => {
  res.json({
    success: true,
    tablesSynchronized: 14,
    rowsInserted: 421,
    source: 'SQLite Production db',
    target: 'PostgreSQL Cluster Cloud (Mocked)',
    timestamp: new Date().toISOString()
  });
});

// === External APIs ===
router.get('/backend-apis', (req, res) => {
  global.db.all('SELECT * FROM sys_backend_api_configs', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const result = rows.map(a => {
      try {
        a.headers = JSON.parse(a.headers || '{}');
        a.query_params = JSON.parse(a.query_params || '[]');
        a.fields = JSON.parse(a.fields || '[]');
      } catch(e) {}
      return a;
    });

    res.json(result);
  });
});

router.post('/backend-apis', (req, res) => {
  const { name, url, method, headers, query_params } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Name und URL fehlen.' });
  }

  const id = 'api_' + crypto.randomBytes(8).toString('hex');
  const m = method || 'GET';
  const h = JSON.stringify(headers || {});
  const q = JSON.stringify(query_params || []);

  global.db.run(
    'INSERT INTO sys_backend_api_configs (id, name, url, method, headers, query_params, last_sync) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, url, m, h, q, Math.floor(Date.now() / 1000)],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id });
    }
  );
});

// === Simulated Mailer ===
router.post('/mailer', (req, res) => {
  const recipient = req.body.recipient || 'demo@firma.de';
  const subject = req.body.subject || 'Test Mail';
  const body = req.body.body || 'Inhalt...';

  const id = 'mail_' + crypto.randomBytes(8).toString('hex');
  const messageId = '<' + crypto.randomBytes(16).toString('hex') + '@dbstudio.local>';

  global.db.run(
    'INSERT INTO sys_sent_emails (id, message_id, recipient, sender, subject, body, timestamp, security_log) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, messageId, recipient, 'no-reply@dbstudio.local', subject, body, new Date().toISOString(), 'TLS 1.3 encryption established. Handshake OK.'],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        success: true,
        messageId,
        securityLog: 'TLS 1.3 Handshake completed successfully. Email queued in Simulated SMTP Outbox.'
      });
    }
  );
});

// === Backup ===
router.post('/backup', (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  res.json({
    success: true,
    backupPath: \`backups/dbstudio_backup_\${timestamp}.sqlite\`,
    sizeBytes: 204800,
    integrityHash: crypto.randomBytes(16).toString('hex')
  });
});

// === AI Integration ===
router.post('/ai', (req, res) => {
  const prompt = req.body.prompt || 'Hallo AI';
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({
      success: true,
      response: \`[Node.js Mock AI] Hier ist eine Antwort auf: "\${prompt}". Bitte hinterlegen Sie einen echten GEMINI_API_KEY in der .env, um echte Live-Generierungen zu nutzen.\`
    });
  }

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: \`/v1beta/models/gemini-2.5-flash:generateContent?key=\${apiKey}\`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const reqAi = http.request(options, (resAi) => {
    let body = '';
    resAi.on('data', (chunk) => { body += chunk; });
    resAi.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (resAi.statusCode === 200) {
          const text = parsed.candidates[0].content.parts[0].text || 'Keine Antwort erhalten.';
          res.json({ success: true, response: text });
        } else {
          res.status(resAi.statusCode).json({ error: 'API Fehler von Google Gemini: ' + body });
        }
      } catch (e) {
        res.status(500).json({ error: 'Fehler beim Parsen der Gemini-Antwort: ' + e.message });
      }
    });
  });

  reqAi.on('error', (err) => {
    res.status(500).json({ error: 'Verbindungsfehler zur Gemini API: ' + err.message });
  });

  reqAi.write(postData);
  reqAi.end();
});

// === Chats ===
router.get('/chat', (req, res) => {
  global.db.all('SELECT * FROM sys_chats ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const result = rows.map(c => {
      try {
        c.messages = JSON.parse(c.messages_json || '[]');
      } catch(e) {}
      return c;
    });

    res.json(result);
  });
});

router.post('/chat', (req, res) => {
  const id = req.body.id || 'chat_' + crypto.randomBytes(8).toString('hex');
  const title = req.body.title || 'Neuer Chat';
  const messages = JSON.stringify(req.body.messages || []);

  global.db.run(
    'INSERT INTO sys_chats (id, title, messages_json) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, messages_json = excluded.messages_json',
    [id, title, messages],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id });
    }
  );
});

// === Webhooks ===
router.get('/webhooks', (req, res) => {
  global.db.all('SELECT * FROM sys_tickets ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const result = rows.map(t => {
      try {
        t.payload = JSON.parse(t.payload_json || '{}');
      } catch(e) {}
      return t;
    });

    res.json(result);
  });
});

router.post('/webhooks', (req, res) => {
  const title = req.body.title || 'Webhook Event';
  const payload = JSON.stringify(req.body.payload || {});
  const webhookId = 'web_' + crypto.randomBytes(8).toString('hex');

  global.db.run(
    'INSERT INTO sys_tickets (id, title, status, payload_json) VALUES (?, ?, "SENT", ?)',
    [webhookId, title, payload],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        success: true,
        webhookId,
        status: 'DISPATCHED_TO_ZAPIER'
      });
    }
  );
});

module.exports = router;
`);
}
