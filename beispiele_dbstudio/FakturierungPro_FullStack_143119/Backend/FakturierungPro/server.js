require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');
const initJobs = require('./scheduler');
const webhooks = require('./services/webhookService');
const upload = require('./services/storageService');


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


// Auth Routes
if (false) {
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

// Kunden Routes
app.get('/api/kunden', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        { kundenNr: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { firmenname: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { ansprechpartner: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { email: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { telefon: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { strasse: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { plz: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { ort: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { uStIdNr: { [db.Sequelize.Op.like]: `%${term}%` } }
                    ]
                }));
            }
        }

        const { count, rows } = await db.Kunden.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching kunden:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/kunden/:id', async (req, res) => {
    try { const item = await db.Kunden.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching kunden id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/kunden', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Kunden.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating kunden:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/kunden/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Kunden.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating kunden:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/kunden/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Kunden.findByPk(req.params.id);
        const deleted = await db.Kunden.destroy({ 
            where: { [db.Kunden.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting kunden:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Artikel Routes
app.get('/api/artikel', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        { artikelNr: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { bezeichnung: { [db.Sequelize.Op.like]: `%${term}%` } }
                    ]
                }));
            }
        }

        const { count, rows } = await db.Artikel.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching artikel:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/artikel/:id', async (req, res) => {
    try { const item = await db.Artikel.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching artikel id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/artikel', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Artikel.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating artikel:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/artikel/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Artikel.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating artikel:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/artikel/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Artikel.findByPk(req.params.id);
        const deleted = await db.Artikel.destroy({ 
            where: { [db.Artikel.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting artikel:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Angebote Routes
app.get('/api/angebote', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        { angebotsNr: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { bemerkung: { [db.Sequelize.Op.like]: `%${term}%` } }
                    ]
                }));
            }
        }

        const { count, rows } = await db.Angebote.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching angebote:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/angebote/:id', async (req, res) => {
    try { const item = await db.Angebote.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching angebote id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/angebote', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Angebote.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating angebote:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/angebote/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Angebote.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating angebote:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/angebote/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Angebote.findByPk(req.params.id);
        const deleted = await db.Angebote.destroy({ 
            where: { [db.Angebote.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting angebote:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Angebotspositionen Routes
app.get('/api/angebotspositionen', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        
                    ]
                }));
            }
        }

        const { count, rows } = await db.Angebotspositionen.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching angebotspositionen:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/angebotspositionen/:id', async (req, res) => {
    try { const item = await db.Angebotspositionen.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching angebotspositionen id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/angebotspositionen', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Angebotspositionen.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating angebotspositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/angebotspositionen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Angebotspositionen.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating angebotspositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/angebotspositionen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Angebotspositionen.findByPk(req.params.id);
        const deleted = await db.Angebotspositionen.destroy({ 
            where: { [db.Angebotspositionen.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting angebotspositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Auftraege Routes
app.get('/api/auftraege', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        { auftragsNr: { [db.Sequelize.Op.like]: `%${term}%` } }
                    ]
                }));
            }
        }

        const { count, rows } = await db.Auftraege.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching auftraege:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/auftraege/:id', async (req, res) => {
    try { const item = await db.Auftraege.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching auftraege id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/auftraege', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Auftraege.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating auftraege:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/auftraege/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Auftraege.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating auftraege:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/auftraege/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Auftraege.findByPk(req.params.id);
        const deleted = await db.Auftraege.destroy({ 
            where: { [db.Auftraege.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting auftraege:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Auftragspositionen Routes
app.get('/api/auftragspositionen', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        
                    ]
                }));
            }
        }

        const { count, rows } = await db.Auftragspositionen.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching auftragspositionen:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/auftragspositionen/:id', async (req, res) => {
    try { const item = await db.Auftragspositionen.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching auftragspositionen id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/auftragspositionen', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Auftragspositionen.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating auftragspositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/auftragspositionen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Auftragspositionen.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating auftragspositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/auftragspositionen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Auftragspositionen.findByPk(req.params.id);
        const deleted = await db.Auftragspositionen.destroy({ 
            where: { [db.Auftragspositionen.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting auftragspositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Rechnungen Routes
app.get('/api/rechnungen', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        { rechnungsNr: { [db.Sequelize.Op.like]: `%${term}%` } }
                    ]
                }));
            }
        }

        const { count, rows } = await db.Rechnungen.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching rechnungen:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/rechnungen/:id', async (req, res) => {
    try { const item = await db.Rechnungen.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching rechnungen id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/rechnungen', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Rechnungen.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating rechnungen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/rechnungen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Rechnungen.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating rechnungen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/rechnungen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Rechnungen.findByPk(req.params.id);
        const deleted = await db.Rechnungen.destroy({ 
            where: { [db.Rechnungen.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting rechnungen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Rechnungspositionen Routes
app.get('/api/rechnungspositionen', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        
                    ]
                }));
            }
        }

        const { count, rows } = await db.Rechnungspositionen.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching rechnungspositionen:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/rechnungspositionen/:id', async (req, res) => {
    try { const item = await db.Rechnungspositionen.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching rechnungspositionen id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/rechnungspositionen', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Rechnungspositionen.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating rechnungspositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/rechnungspositionen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Rechnungspositionen.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating rechnungspositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/rechnungspositionen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Rechnungspositionen.findByPk(req.params.id);
        const deleted = await db.Rechnungspositionen.destroy({ 
            where: { [db.Rechnungspositionen.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting rechnungspositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Mahnungen Routes
app.get('/api/mahnungen', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        { mahnungsNr: { [db.Sequelize.Op.like]: `%${term}%` } }
                    ]
                }));
            }
        }

        const { count, rows } = await db.Mahnungen.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching mahnungen:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/mahnungen/:id', async (req, res) => {
    try { const item = await db.Mahnungen.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching mahnungen id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/mahnungen', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Mahnungen.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating mahnungen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/mahnungen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Mahnungen.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating mahnungen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/mahnungen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Mahnungen.findByPk(req.params.id);
        const deleted = await db.Mahnungen.destroy({ 
            where: { [db.Mahnungen.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting mahnungen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Gutschriften Routes
app.get('/api/gutschriften', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        { gutschriftNr: { [db.Sequelize.Op.like]: `%${term}%` } },
                        { grund: { [db.Sequelize.Op.like]: `%${term}%` } }
                    ]
                }));
            }
        }

        const { count, rows } = await db.Gutschriften.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching gutschriften:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/gutschriften/:id', async (req, res) => {
    try { const item = await db.Gutschriften.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching gutschriften id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/gutschriften', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Gutschriften.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating gutschriften:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/gutschriften/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Gutschriften.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating gutschriften:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/gutschriften/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Gutschriften.findByPk(req.params.id);
        const deleted = await db.Gutschriften.destroy({ 
            where: { [db.Gutschriften.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting gutschriften:', e); 
        res.status(500).json({ error: e.message }); 
    }
});
// Gutschriftpositionen Routes
app.get('/api/gutschriftpositionen', async (req, res) => {
    try { 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        const whereClause = {};
        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                whereClause[db.Sequelize.Op.and] = searchTerms.map(term => ({
                    [db.Sequelize.Op.or]: [
                        
                    ]
                }));
            }
        }

        const { count, rows } = await db.Gutschriftpositionen.findAndCountAll({ 
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
    catch (e) { console.error('Error fetching gutschriftpositionen:', e); res.status(500).json({ error: e.message }); }
});

app.get('/api/gutschriftpositionen/:id', async (req, res) => {
    try { const item = await db.Gutschriftpositionen.findByPk(req.params.id, { include: { all: true } }); if(item) res.json(item); else res.status(404).json({error: 'Not found'}); } 
    catch (e) { console.error('Error fetching gutschriftpositionen id:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/gutschriftpositionen', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        const item = await db.Gutschriftpositionen.create(payload, { transaction: t }); 
        await t.commit();
        webhooks.notify('create', item); // Trigger Webhook
        res.status(201).json(item); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error creating gutschriftpositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.put('/api/gutschriftpositionen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const existing = await db.Gutschriftpositionen.findByPk(req.params.id, { transaction: t });
        if (!existing) {
            await t.rollback();
            return res.status(404).json({error: 'Not found'});
        }
        const payload = { ...req.body };
        const username = getLoggedInUser(req);

        await existing.update(payload, { transaction: t });
        await t.commit();
        webhooks.notify('update', existing); // Trigger Webhook
        res.json(existing); 
    } 
    catch (e) { 
        await t.rollback();
        console.error('Error updating gutschriftpositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/api/gutschriftpositionen/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try { 
        const item = await db.Gutschriftpositionen.findByPk(req.params.id);
        const deleted = await db.Gutschriftpositionen.destroy({ 
            where: { [db.Gutschriftpositionen.primaryKeyAttribute]: req.params.id },
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
        console.error('Error deleting gutschriftpositionen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});

app.get('/api/queries/offeneRechnungenMahnstufen', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * limit;
        
        let whereClause = ' WHERE 1=1';
        const replacements = {};
        
        // Handle MS Access style form references passed as query parameters (e.g. ?form_FormName_FieldName=Value)
        if (req.query.selectedId !== undefined && req.query.selectedId !== '' && req.query.selectedId !== 'undefined' && req.query.selectedId !== 'null') {
            whereClause += ' AND ("Id" = :selectedId OR "id" = :selectedId)';
            replacements['selectedId'] = req.query.selectedId;
        }
        if (req.query.id !== undefined && req.query.id !== '' && req.query.id !== 'undefined' && req.query.id !== 'null') {
            whereClause += ' AND ("Id" = :id OR "id" = :id)';
            replacements['id'] = req.query.id;
        }

        const results = await db.sequelize.query(`SELECT * FROM "${'OffeneRechnungenMahnstufen'}"` + whereClause + ` LIMIT :limit OFFSET :offset`, { 
            replacements: { ...replacements, limit, offset },
            type: db.Sequelize.QueryTypes.SELECT 
        });
        
        const countResult = await db.sequelize.query(`SELECT COUNT(*) as count FROM "${'OffeneRechnungenMahnstufen'}"` + whereClause, { 
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
        console.error('Error fetching query offeneRechnungenMahnstufen:', e); 
        res.status(500).json({ error: e.message }); 
    }
});


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

const PORT = process.env.PORT || 5000;

function startServer(portToUse) {
    const server = app.listen(portToUse, () => console.log(`Server running on port ${portToUse}`));
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`Port ${portToUse} is already in use. Retrying on port ${Number(portToUse) + 1}...`);
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
    });