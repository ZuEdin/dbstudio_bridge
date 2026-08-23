
import { Table, Relationship, Query, SelectQuery, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { generateSequelizeModels } from './nodejs/models';
import { generatePrismaSchema } from './nodejs/prisma';
import { generateTypeOrmModels } from './nodejs/typeorm';
import { generateDrizzleSchema } from './nodejs/drizzle';
import { toCamelCase, toPascalCase } from './common';

export const generateNodeJs = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;
  const integrations = config.integrations || { storage: { provider: 'local' }, sso: [], webhooks: [] };

  let dbDriverInfo = '"tedious": "^18.6.1"';
  if (config.dbType === DbType.MySQL) dbDriverInfo = '"mysql2": "^3.11.0"';
  else if (config.dbType === DbType.SQLite) dbDriverInfo = '"sqlite3": "^5.1.7"';
  else if (config.dbType === DbType.PostgreSQL) dbDriverInfo = '"pg": "^8.13.1", "pg-hstore": "^2.3.4"';

  // --- Dependencies ---
  let dependencies = `
    "express": "^4.21.2",
    "sequelize": "^6.37.5",
    "@prisma/client": "^5.10.0",
    "prisma": "^5.10.0",
    "cors": "^2.8.5",
    "node-cron": "^3.0.3",
    "axios": "^1.7.9",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.4.7",
    ${dbDriverInfo}`;

  if (config.whitelabel?.customNpmPackages) {
      const pkgs = config.whitelabel.customNpmPackages.split(',').map(s => s.trim()).filter(s => s.length > 0);
      for (const pkg of pkgs) {
          dependencies += `,\n    "${pkg}": "latest"`;
      }
  }

  if (integrations.sso.length > 0) {
      dependencies += `,\n    "passport": "^0.7.0",\n    "passport-google-oauth20": "^2.0.0"`; 
  }
  if (integrations.storage.provider === 's3') {
      dependencies += `,\n    "aws-sdk": "^2.1692.0",\n    "multer-s3": "^3.0.1"`;
  }

  files.push({ name: 'package.json', path: `${root}/package.json`, content: `{
  "name": "${config.projectName.toLowerCase()}",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {${dependencies}
  },
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}`, language: 'json' });

  // --- ENV Files ---
  const generateEnvContent = (conn: string, vars?: Record<string, string>) => {
      let dbName = 'my_db', user = 'user', pass = 'pass', host = 'localhost';
      let dialect = 'mysql';
      const dbTypeVal = config.dbType as any;
      if (dbTypeVal === DbType.PostgreSQL || dbTypeVal === 'PostgreSQL') dialect = 'postgres';
      else if (dbTypeVal === DbType.SQL || dbTypeVal === 'SQL') dialect = 'mssql';
      else if (dbTypeVal === DbType.NoSQL || dbTypeVal === 'NoSQL') dialect = 'mongodb';

      if (dbTypeVal === DbType.SQLite) {
          let baseEnv = `DB_DIALECT=sqlite\nDB_STORAGE=${conn.replace('Data Source=', '')}\nPORT=${config.port}`;
          if (vars) {
              Object.entries(vars).forEach(([k, v]) => {
                  baseEnv += `\n${k}=${v}`;
              });
          }
          return baseEnv;
      }
      
      const parts = conn.split(';');
      parts.forEach(p => {
          const [k, v] = p.split('=');
          if(!k || !v) return;
          const key = k.trim().toLowerCase();
          const val = v.trim();
          if (key.includes('database')) dbName = val;
          if (key.includes('server') || key.includes('host')) host = val;
          if (key.includes('user')) user = val;
          if (key.includes('password') || key.includes('pwd')) pass = val;
      });

      let baseEnv = `DB_HOST=${host}\nDB_USER=${user}\nDB_PASS=${pass}\nDB_NAME=${dbName}\nDB_DIALECT=${dialect}\nPORT=${config.port}`;
      if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
              baseEnv += `\n${k}=${v}`;
          });
      }
      return baseEnv;
  };

  // Base .env
  files.push({ name: '.env', path: `${root}/.env`, content: generateEnvContent(config.dbConnection), language: 'text' });

  if (config.environments) {
      config.environments.forEach(env => {
          const suffix = env.name === 'Production' ? 'production' : env.name === 'Staging' ? 'staging' : 'development';
          files.push({ 
              name: `.env.${suffix}`, 
              path: `${root}/.env.${suffix}`, 
              content: generateEnvContent(env.dbConnection || config.dbConnection, env.vars), 
              language: 'text' 
          });
      });
  }

  files.push({ name: 'models.js', path: `${root}/models.js`, content: generateSequelizeModels(tables, relationships, config), language: 'javascript' });
  
  files.push({ name: 'schema.prisma', path: `${root}/prisma/schema.prisma`, content: generatePrismaSchema(tables, relationships, config.dbType), language: 'text' });
  files.push({ name: 'entity.ts', path: `${root}/typeorm/entity.ts`, content: generateTypeOrmModels(tables, relationships, config.dbType), language: 'typescript' });
  files.push({ name: 'schema.ts', path: `${root}/drizzle/schema.ts`, content: generateDrizzleSchema(tables, relationships, config.dbType), language: 'typescript' });

  // --- Scheduler ---
  const schedulerJs = `const cron = require('node-cron');
const db = require('./models');

const initJobs = () => {
    console.log("Initializing Scheduler...");
    cron.schedule('* * * * *', async () => {
    });
};

module.exports = initJobs;`;
  files.push({ name: 'scheduler.js', path: `${root}/scheduler.js`, content: schedulerJs, language: 'javascript' });

  // --- Webhook Service ---
  const webhookJs = `const axios = require('axios');

const webhooks = ${JSON.stringify(integrations.webhooks, null, 2)};

const notify = async (event, payload) => {
    webhooks.forEach(hook => {
        if (hook.events.includes(event)) {
            axios.post(hook.url, { event, data: payload, timestamp: new Date() })
                .then(() => console.log('Webhook sent to', hook.url))
                .catch(err => console.error('Webhook failed:', err.message));
        }
    });
};

module.exports = { notify };`;
  files.push({ name: 'webhookService.js', path: `${root}/services/webhookService.js`, content: webhookJs, language: 'javascript' });

  // --- Storage Service ---
  let storageJs = `const multer = require('multer');\n`;
  if (integrations.storage.provider === 'local') {
      storageJs += `
const upload = multer({ dest: 'uploads/' });
module.exports = upload;`;
  } else if (integrations.storage.provider === 's3') {
      storageJs += `
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: '${integrations.storage.region || 'us-east-1'}'
});

const s3 = new AWS.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: '${integrations.storage.bucketName}',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname)
        }
    })
});
module.exports = upload;`;
  }
  files.push({ name: 'storageService.js', path: `${root}/services/storageService.js`, content: storageJs, language: 'javascript' });

  // --- CRUD Routes ---
  let routes = "";
  tables.forEach(t => {
      const modelName = toPascalCase(t.name);
      const routeName = toCamelCase(t.name);
      const searchableFields = t.fields.filter(f => f.type === 'VARCHAR' || f.type === 'TEXT').map(f => toCamelCase(f.name));

      const createdByField = t.fields.find(f => ['createdby', 'created_by', 'erstellt_von', 'erstelltvon', 'created_user', 'createduser'].includes(f.name.toLowerCase()));
      const modifiedByField = t.fields.find(f => ['modifiedby', 'modified_by', 'updatedby', 'updated_by', 'geaendert_von', 'bearbeitetvon', 'bearbeitet_von'].includes(f.name.toLowerCase()));
      const createdDateField = t.fields.find(f => ['createddate', 'created_date', 'createdat', 'created_at', 'erstellt_am', 'erstelltam'].includes(f.name.toLowerCase()));
      const modifiedDateField = t.fields.find(f => ['modifieddate', 'modified_date', 'updatedat', 'updated_at', 'geaendert_am', 'bearbeitet_am'].includes(f.name.toLowerCase()));

      const nowDefaultFields = t.fields.filter(f => {
          const isDateType = ['DATETIME', 'TIMESTAMP', 'DATE', 'TIME'].includes(f.type);
          const hasNowDefault = f.defaultValue && (
              f.defaultValue.toLowerCase().includes('now') ||
              f.defaultValue.toLowerCase().includes('current_timestamp') ||
              f.defaultValue.toLowerCase().includes('getdate')
          );
          return isDateType && hasNowDefault;
      });

      let postAuditCode = `        const payload = { ...req.body };
        const username = getLoggedInUser(req);
`;
      if (createdByField) postAuditCode += `        payload.${toCamelCase(createdByField.name)} = username;\n`;
      if (modifiedByField) postAuditCode += `        payload.${toCamelCase(modifiedByField.name)} = username;\n`;
      if (createdDateField) postAuditCode += `        payload.${toCamelCase(createdDateField.name)} = new Date();\n`;
      if (modifiedDateField) postAuditCode += `        payload.${toCamelCase(modifiedDateField.name)} = new Date();\n`;
      nowDefaultFields.forEach(df => {
          postAuditCode += `        if (!payload.${toCamelCase(df.name)}) payload.${toCamelCase(df.name)} = new Date();\n`;
      });

      let putAuditCode = `        const payload = { ...req.body };
        const username = getLoggedInUser(req);
`;
      if (createdByField) putAuditCode += `        payload.${toCamelCase(createdByField.name)} = existing.${toCamelCase(createdByField.name)};\n`;
      if (createdDateField) putAuditCode += `        payload.${toCamelCase(createdDateField.name)} = existing.${toCamelCase(createdDateField.name)};\n`;
      if (modifiedByField) putAuditCode += `        payload.${toCamelCase(modifiedByField.name)} = username;\n`;
      if (modifiedDateField) putAuditCode += `        payload.${toCamelCase(modifiedDateField.name)} = new Date();\n`;

      const likeOp = (config.dbType === DbType.PostgreSQL || !config.dbType) ? 'iLike' : 'like';

      routes += `
// ${modelName} Routes
app.get('/api/${routeName}', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        ${searchableFields.map(f => `{ ${f}: { [db.Sequelize.Op.${likeOp}]: \`%\${term}%\` } }`).join(',\n                        ')}
                    ]
                }));
            }
        }

        const { count, rows } = await db.${modelName}.findAndCountAll({ 
            where: whereClause,
            limit: limit,
            offset: offset,
            include: { all: true, nested: false } 
        });
        
        res.json({
            data: rows,
            total: count,
            page: page,
            pageSize: limit,
            totalPages: Math.ceil(count / limit)
        });
    } 
    catch (e) { console.error('Error fetching ${routeName}:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/${routeName}/:id', async (req, res) => {
    try { const item = await db.${modelName}.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching ${routeName} id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/${routeName}', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
${postAuditCode}
        const item = await db.${modelName}.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating ${routeName}:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/${routeName}/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.${modelName}.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
${putAuditCode}
        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating ${routeName}:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/${routeName}/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.${modelName}.findByPk(req.params.id);
        const deleted = await db.${modelName}.destroy({ 
            where: { [db.${modelName}.primaryKeyAttribute]: req.params.id },
            transaction: t
        });
        if (deleted) {
            await t.commit();
            webhooks.notify('delete', item); // Trigger Webhook
            res.json({ message: 'Deleted' }); 
        } else {
            await t.rollback();
            res.status(404).json({error: 'Not found'});
        }
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error deleting ${routeName}:', e); 
        res.status(500).json({ error: e.message }); 
    }
});`;
  });

  // --- Dynamic Query Endpoints ---
  let queryEndpoints = '';
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const selectQ = q as SelectQuery;
      const routeName = toCamelCase(q.name);
      const viewName = toPascalCase(q.name);
      
      // Generate Node.js parameter-based filtering code
      const filterStatements: string[] = [];

      // Generic filter for selectedId or id passed as URL params
      filterStatements.push(`        if (req.query.selectedId !== undefined && req.query.selectedId !== '' && req.query.selectedId !== 'undefined' && req.query.selectedId !== 'null') {
            whereClause += ' AND ("Id" = :selectedId OR "id" = :selectedId)';
            replacements['selectedId'] = req.query.selectedId;
        }
        if (req.query.id !== undefined && req.query.id !== '' && req.query.id !== 'undefined' && req.query.id !== 'null') {
            whereClause += ' AND ("Id" = :id OR "id" = :id)';
            replacements['id'] = req.query.id;
        }`);

      selectQ.columns?.forEach(c => {
          c.criteria?.forEach(cr => {
              if (cr && /(?:\[?Forms\]?!)/i.test(cr)) {
                  const formMatch = cr.match(/(?:\[?Forms\]?!\s*\[?([^!\]]+)\]?!\s*\[?([^!\]\s]+)\]?)/i);
                  if (formMatch && formMatch.length >= 3) {
                      const formName = formMatch[1].toLowerCase();
                      const fieldName = formMatch[2].toLowerCase();
                      const paramName = `form_${formName}_${fieldName}`;
                      const opMatch = cr.match(/^(=|like |>|<|>=|<=)/i);
                      const op = opMatch ? opMatch[0].toUpperCase().trim() : '=';
                      const colName = c.alias && c.alias.trim() !== '' ? c.alias : c.fieldName;
                      
                      let filterCode = '';
                      if (op === 'LIKE') {
                          filterCode = `            whereClause += ' AND "${colName}" LIKE :${paramName}';\n            replacements['${paramName}'] = \`%\${req.query.${paramName}}%\`;`;
                      } else {
                          filterCode = `            whereClause += ' AND "${colName}" ${op} :${paramName}';\n            replacements['${paramName}'] = req.query.${paramName};`;
                      }
                      
                      filterStatements.push(`        if (req.query.${paramName} !== undefined && req.query.${paramName} !== '' && req.query.${paramName} !== 'undefined' && req.query.${paramName} !== 'null') {\n${filterCode}\n        }`);
                  }
              }
          });
      });
      const nodeQueryFiltering = filterStatements.length > 0 ? filterStatements.join('\n') : `        // No active dynamic form filters on this query`;

      queryEndpoints += `
app.get('/api/queries/${routeName}', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        
        let whereClause = ' WHERE 1=1';
        const replacements = {};
        
        // Handle MS Access style form references passed as query parameters (e.g. ?form_FormName_FieldName=Value)
${nodeQueryFiltering}

        const results = await db.sequelize.query(\`SELECT * FROM "\${'${viewName}'}"\` + whereClause + \` LIMIT :limit OFFSET :offset\`, { 
            replacements: { ...replacements, limit, offset },
            type: db.Sequelize.QueryTypes.SELECT 
        });
        
        const countResult = await db.sequelize.query(\`SELECT COUNT(*) as count FROM "\${'${viewName}'}"\` + whereClause, { 
            replacements,
            type: db.Sequelize.QueryTypes.SELECT 
        });
        
        res.json({
            data: results.map(mapToCamelCase),
            total: countResult[0]?.count || 0,
            page: page,
            pageSize: limit,
            totalPages: Math.ceil((countResult[0]?.count || 0) / limit)
        });
    } catch (e) { 
        console.error('Error fetching query ${routeName}:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
`;
  });


  // --- Action Query Endpoints ---
  queries.filter(q => q.type !== 'SELECT').forEach(q => {
      const routeName = toCamelCase(q.name);
      
      if (q.type === 'DELETE') {
          const dq = q;
          const targetTable = tables.find(t => t.id === dq.targetTableId);
          if (!targetTable) return;
          
          let whereConditions = [];
          let defaultReplacements = {};
          
          (dq.criteria || []).forEach((c, idx) => {
              const field = targetTable.fields.find(f => f.id === c.fieldId);
              if (!field) return;
              const paramName = `param_${idx}`;
              
              if (c.operator === 'contains') {
                  whereConditions.push(`"${field.name}" LIKE :${paramName}`);
                  defaultReplacements[paramName] = `%${c.value}%`;
              } else {
                  whereConditions.push(`"${field.name}" ${c.operator} :${paramName}`);
                  defaultReplacements[paramName] = c.value;
              }
          });
          
          const whereSql = whereConditions.length > 0 ? `WHERE ` + whereConditions.join(' AND ') : '';
          
          queryEndpoints += `
app.post('/api/actions/${routeName}', async (req, res) => {
    try {
        const replacements = ${JSON.stringify(defaultReplacements)};
        Object.keys(req.body).forEach(k => { replacements[k] = req.body[k]; });
        
        await db.sequelize.query(\`DELETE FROM "\${\`${targetTable.name}\`}" ${whereSql}\`, { 
            replacements,
            type: db.Sequelize.QueryTypes.DELETE 
        });
        res.json({ success: true, message: "Action executed" });
    } catch (e) {
        console.error('Error executing action ${routeName}:', e);
        res.status(500).json({ error: e.message });
    }
});
`;
      } else if (q.type === 'UPDATE') {
          const uq = q;
          const targetTable = tables.find(t => t.id === uq.targetTableId);
          if (!targetTable) return;
          
          let setParts = [];
          let defaultReplacements = {};
          
          Object.entries(uq.updateMap || {}).forEach(([fieldId, val], idx) => {
              const field = targetTable.fields.find(f => f.id === fieldId);
              if (!field) return;
              
              if (String(val).includes(field.name)) {
                  // It's an expression like "Preis * 1.1"
                  setParts.push(`"${field.name}" = ${val}`);
              } else {
                  const paramName = `set_${idx}`;
                  setParts.push(`"${field.name}" = :${paramName}`);
                  defaultReplacements[paramName] = val;
              }
          });
          const setSql = setParts.length > 0 ? `SET ` + setParts.join(', ') : '';
          
          let whereConditions = [];
          (uq.criteria || []).forEach((c, idx) => {
              const field = targetTable.fields.find(f => f.id === c.fieldId);
              if (!field) return;
              const paramName = `param_${idx}`;
              
              if (c.operator === 'contains') {
                  whereConditions.push(`"${field.name}" LIKE :${paramName}`);
                  defaultReplacements[paramName] = `%${c.value}%`;
              } else {
                  whereConditions.push(`"${field.name}" ${c.operator} :${paramName}`);
                  defaultReplacements[paramName] = c.value;
              }
          });
          const whereSql = whereConditions.length > 0 ? `WHERE ` + whereConditions.join(' AND ') : '';
          
          if (!setSql) return; // Nothing to update
          
          queryEndpoints += `
app.post('/api/actions/${routeName}', async (req, res) => {
    try {
        const replacements = ${JSON.stringify(defaultReplacements)};
        Object.keys(req.body).forEach(k => { replacements[k] = req.body[k]; });
        
        await db.sequelize.query(\`UPDATE "\${\`${targetTable.name}\`}" ${setSql} ${whereSql}\`, { 
            replacements,
            type: db.Sequelize.QueryTypes.UPDATE 
        });
        res.json({ success: true, message: "Action executed" });
    } catch (e) {
        console.error('Error executing action ${routeName}:', e);
        res.status(500).json({ error: e.message });
    }
});
`;
      } else if (q.type === 'INSERT') {
          const iq = q;
          const sourceTable = tables.find(t => t.id === iq.sourceTableId);
          const targetTable = tables.find(t => t.id === iq.targetTableId);
          if (!sourceTable || !targetTable) return;
          
          let targetCols = [];
          let sourceCols = [];
          
          Object.entries(iq.fieldMapping || {}).forEach(([tId, sId]) => {
              const tField = targetTable.fields.find(f => f.id === tId);
              const sField = sourceTable.fields.find(f => f.id === sId);
              if (tField && sField) {
                  targetCols.push(`"${tField.name}"`);
                  sourceCols.push(`"${sField.name}"`);
              }
          });
          
          if (targetCols.length === 0) return;
          
          queryEndpoints += `
app.post('/api/actions/${routeName}', async (req, res) => {
    try {
        // APPEND QUERY (INSERT INTO ... SELECT ...)
        await db.sequelize.query(\`INSERT INTO "\${\`${targetTable.name}\`}" (${targetCols.join(', ')}) SELECT ${sourceCols.join(', ')} FROM "\${\`${sourceTable.name}\`}"\`, { 
            type: db.Sequelize.QueryTypes.INSERT 
        });
        res.json({ success: true, message: "Action executed" });
    } catch (e) {
        console.error('Error executing action ${routeName}:', e);
        res.status(500).json({ error: e.message });
    }
});
`;
      }
  });

  // --- Main Server ---
  const serverJs = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');
const initJobs = require('./scheduler');
const webhooks = require('./services/webhookService');
const upload = require('./services/storageService');
${integrations.sso.length > 0 ? "const passport = require('passport');" : ""}

const app = express();

const getLoggedInUser = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token.startsWith('dummy-jwt-token-for-')) {
            return token.replace('dummy-jwt-token-for-', '');
        }
        if (token.startsWith('dummy-jwt-token-sso-')) {
            return token.replace('dummy-jwt-token-sso-', '') + ' User';
        }
        return token;
    }
    return 'System';
};

// Map database row keys to camelCase while preserving original and lowercase keys for maximum compatibility
const mapToCamelCase = (row) => {
    if (!row) return row;
    const mapped = { ...row };
    for (let key in row) {
        mapped[key.toLowerCase()] = row[key];
        let clean = key.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
                       .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue');
        clean = clean.replace(/[_-]/g, ' ');
        clean = clean.replace(/[^a-zA-Z0-9 ]/g, '');
        let pascal = clean.split(' ').filter(w => w.length > 0).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        if (pascal) {
            mapped[pascal.charAt(0).toLowerCase() + pascal.slice(1)] = row[key];
        }
    }
    return mapped;
};

// Enable CORS with Credentials support (fixes Status 0 errors in fetch)
app.use(cors({
    origin: true, // Reflect request origin
    credentials: true 
}));

app.use(express.json());

// Auth Setup
${integrations.sso.length > 0 ? `
app.use(passport.initialize());
` : ""}

// Auth Routes
if (${config.authConfig?.useUserLogin !== undefined ? config.authConfig?.useUserLogin : false}) {
app.post('/api/auth/login', (req, res) => {
    res.json({ token: "dummy-jwt-token-for-" + (req.body.username || 'user'), user: { username: req.body.username || 'user', role: 'Admin' } });
});

app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token.startsWith('dummy-jwt-token-for-')) {
            const username = token.replace('dummy-jwt-token-for-', '');
            return res.json({ user: { username, role: 'Admin' } });
        }
        if (token.startsWith('dummy-jwt-token-sso-')) {
            const username = token.replace('dummy-jwt-token-sso-', '') + ' User';
            return res.json({ user: { username, role: 'User' } });
        }
        return res.json({ user: { username: 'System', role: 'Admin' } });
    }
    return res.status(401).json({ error: 'Unauthorized' });
});
app.post('/api/auth/register', (req, res) => {
    res.status(201).json({ message: "User registered successfully" });
});
app.post('/api/auth/login-sso', (req, res) => {
    const provider = req.body.provider || 'unknown';
    res.json({ token: "dummy-jwt-token-sso-" + provider, user: { username: provider + ' User', role: 'User' } });
});
}

// Routes
${routes}
${queryEndpoints}

// Inbound Webhooks & Event-Trigger Hub
const _inboundEvents = [];
app.get('/api/webhooks/inbound/channels', (req, res) => {
    res.json([
        { id: "stripe", name: "Stripe Payments & Invoices", provider: "Stripe", endpointPath: "/api/webhooks/inbound/stripe" },
        { id: "github", name: "GitHub Git Commits & PRs", provider: "GitHub", endpointPath: "/api/webhooks/inbound/github" },
        { id: "iot", name: "IoT Sensor & Telemetrie Hub", provider: "IoT Telemetry", endpointPath: "/api/webhooks/inbound/iot" },
        { id: "n8n", name: "n8n Automation Event Bridge", provider: "n8n", endpointPath: "/api/webhooks/inbound/n8n" },
        { id: "custom", name: "Custom JSON Webhook Endpoint", provider: "Generic", endpointPath: "/api/webhooks/inbound/custom" }
    ]);
});

app.get('/api/webhooks/inbound/events', (req, res) => {
    res.json(_inboundEvents);
});

app.post('/api/webhooks/inbound/:channel', (req, res) => {
    const channel = req.params.channel || 'generic';
    const ev = {
        id: "evt_" + Math.random().toString(36).substring(2, 9),
        channel: channel,
        provider: channel.toUpperCase(),
        signature: req.headers['stripe-signature'] || req.headers['x-hub-signature-256'] || req.headers['x-webhook-secret'] || null,
        timestamp: new Date().toISOString(),
        status: "PROCESSED",
        payload: req.body
    };
    _inboundEvents.unshift(ev);
    if (_inboundEvents.length > 100) _inboundEvents.pop();
    
    res.json({
        received: true,
        channel: channel,
        eventId: ev.id,
        status: "PROCESSED",
        timestamp: ev.timestamp
    });
});

// Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
    res.json({ file: req.file });
});

const PORT = process.env.PORT || ${config.port};

function startServer(portToUse) {
    const server = app.listen(portToUse, () => console.log(\`Server running on port \${portToUse}\`));
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(\`Port \${portToUse} is already in use. Retrying on port \${Number(portToUse) + 1}...\`);
            startServer(Number(portToUse) + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

// Sync Database and Start Server
db.sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database synced successfully.');
        initJobs(); // Start Scheduler
        startServer(PORT);
    })
    .catch(err => {
        console.error('Failed to sync database:', err);
    });`;

  files.push({ name: 'server.js', path: `${root}/server.js`, content: serverJs, language: 'javascript' });

  const readmeContent = `# ${config.projectName} (Node.js / Express)

Dieses Backend basiert auf **Node.js, Express und Sequelize**.

## 🚀 Schnellstart

### 1. Voraussetzungen
* **Node.js** (LTS v20+).
* Laufende Datenbank (${config.dbType}).

### 2. Installation
\`\`\`bash
npm install
\`\`\`

### 3. Konfiguration (.env)
Prüfen Sie die Datei \`.env\`.
${config.dbType === DbType.SQLite ? 'Für SQLite wird die Datei automatisch erstellt.' : 'Stellen Sie sicher, dass Host, User und Passwort stimmen.'}

### 4. Starten
\`\`\`bash
# Startet den Server (Node 20+ mit --watch Support)
npm run dev
\`\`\`

Die API läuft unter **http://localhost:${config.port}/api**.

## 🧩 Features
* **ORM:** Sequelize (Auto-Sync beim Start).
* **Uploads:** ${integrations.storage.provider}.
* **Webhooks:** ${integrations.webhooks.length} konfiguriert.
* **SSO:** ${integrations.sso.map(s => s.provider).join(', ') || 'Keine'}.
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
