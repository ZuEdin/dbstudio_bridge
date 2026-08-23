import JSZip from "jszip";

export function generateDataController(zip: JSZip) {
  zip.file("routers/data.js", `const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.get('/:tableName', (req, res) => {
  const { tableName } = req.params;
  const projectId = req.query.project_id || 'proj_default';

  global.db.all(
    'SELECT data_json FROM sys_table_data WHERE table_name = ? AND project_id = ?',
    [tableName, projectId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Datenbankfehler beim Laden der Daten: ' + err.message });

      const result = rows.map(r => {
        try {
          return JSON.parse(r.data_json);
        } catch (e) {
          return r.data_json;
        }
      });

      res.json(result);
    }
  );
});

router.post('/:tableName', (req, res) => {
  const { tableName } = req.params;
  const body = req.body;
  const projectId = body.project_id || 'proj_default';
  
  let recordId = body.id;
  if (!recordId) {
    recordId = 'rec_' + crypto.randomBytes(8).toString('hex');
    body.id = recordId;
  }

  const dataJson = JSON.stringify(body);

  global.db.run(
    'INSERT INTO sys_table_data (id, project_id, table_name, record_id, data_json) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP',
    [recordId, projectId, tableName, recordId, dataJson],
    (err) => {
      if (err) return res.status(500).json({ error: 'Datenbankfehler beim Speichern der Daten: ' + err.message });
      res.json({ success: true, id: recordId, data: body });
    }
  );
});

router.delete('/:tableName/:id', (req, res) => {
  const { tableName, id } = req.params;
  const projectId = req.query.project_id || 'proj_default';

  global.db.run(
    'DELETE FROM sys_table_data WHERE table_name = ? AND id = ? AND project_id = ?',
    [tableName, id, projectId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Datenbankfehler beim Löschen der Daten: ' + err.message });
      
      let deleted = this.changes;
      if (deleted === 0) {
        // Fallback checks on record_id
        global.db.run(
          'DELETE FROM sys_table_data WHERE table_name = ? AND record_id = ? AND project_id = ?',
          [tableName, id, projectId],
          function(errFallback) {
            if (errFallback) return res.status(500).json({ error: 'Datenbankfehler beim Löschen der Daten: ' + errFallback.message });
            res.json({ success: true, deleted: this.changes > 0 });
          }
        );
      } else {
        res.json({ success: true, deleted: true });
      }
    }
  );
});

module.exports = router;
`);
}
