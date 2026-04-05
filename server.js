const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

let pool = null;
let useDB = false;
let messages = [];

async function initDB() {
    if (!process.env.DATABASE_URL) {
        console.log('No DATABASE_URL - using in-memory storage');
        return false;
    }
    
    try {
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                timestamp VARCHAR(50) NOT NULL,
                read BOOLEAN DEFAULT FALSE
            )
        `);
        client.release();
        useDB = true;
        console.log('Database connected - using PostgreSQL');
        return true;
    } catch (e) {
        console.log('Database error:', e.message, '- using in-memory storage');
        return false;
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', async (req, res) => {
    try {
        if (useDB && pool) {
            const result = await pool.query('SELECT COUNT(*) FROM messages');
            res.json({ ok: true, messagesCount: parseInt(result.rows[0].count), mode: 'database' });
        } else {
            res.json({ ok: true, messagesCount: messages.length, mode: 'memory' });
        }
    } catch (e) {
        res.json({ ok: true, messagesCount: messages.length, mode: 'memory' });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        if (useDB && pool) {
            const result = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
            return res.json({ data: result.rows });
        }
        return res.json({ data: messages });
    } catch (e) {
        console.error(e);
        return res.json({ data: messages });
    }
});

app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    console.log('Received contact submission:', req.body);
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields required' });
    }
    const msg = {
        id: uuidv4(),
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        timestamp: new Date().toISOString(),
        read: false
    };
    
    try {
        if (useDB && pool) {
            await pool.query(
                'INSERT INTO messages (id, name, email, subject, message, timestamp, read) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [msg.id, msg.name, msg.email, msg.subject, msg.message, msg.timestamp, msg.read]
            );
        } else {
            messages.unshift(msg);
        }
        console.log('[New] ' + msg.name + ' - ' + msg.subject);
        return res.json({ ok: true, data: msg });
    } catch (e) {
        console.error(e);
        messages.unshift(msg);
        return res.json({ ok: true, data: msg });
    }
});

app.patch('/api/messages/:id', async (req, res) => {
    try {
        if (useDB && pool && req.body.read !== undefined) {
            await pool.query('UPDATE messages SET read = $1 WHERE id = $2', [req.body.read, req.params.id]);
        } else {
            const m = messages.find(m => m.id === req.params.id);
            if (m && req.body.read !== undefined) m.read = req.body.read;
        }
        const result = useDB && pool 
            ? await pool.query('SELECT * FROM messages WHERE id = $1', [req.params.id])
            : { rows: messages.filter(m => m.id === req.params.id) };
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.json({ ok: true, data: result.rows[0] });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Error updating message' });
    }
});

app.patch('/api/messages/read-all', async (req, res) => {
    try {
        if (useDB && pool) {
            await pool.query('UPDATE messages SET read = TRUE');
        } else {
            messages.forEach(m => m.read = true);
        }
        return res.json({ ok: true });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Error marking all read' });
    }
});

app.delete('/api/messages/:id', async (req, res) => {
    try {
        if (useDB && pool) {
            const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Not found' });
            }
        } else {
            const idx = messages.findIndex(m => m.id === req.params.id);
            if (idx === -1) {
                return res.status(404).json({ error: 'Not found' });
            }
            messages.splice(idx, 1);
        }
        return res.json({ ok: true });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Error deleting message' });
    }
});

app.listen(PORT, async () => {
    await initDB();
    console.log('');
    console.log('  SUCCESS! Server running at:');
    console.log('  http://localhost:' + PORT);
    console.log('  http://localhost:' + PORT + '/dashboard.html');
    console.log('');
});
