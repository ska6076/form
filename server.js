const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function initDB() {
    const client = await pool.connect();
    try {
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
        console.log('Database table ready');
    } catch (e) {
        console.log('Table already exists or error:', e.message);
    } finally {
        client.release();
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM messages');
        res.json({ ok: true, messagesCount: parseInt(result.rows[0].count) });
    } catch (e) {
        res.json({ ok: true, messagesCount: 0 });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
        res.json({ data: result.rows });
    } catch (e) {
        console.error(e);
        res.json({ data: [] });
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
        await pool.query(
            'INSERT INTO messages (id, name, email, subject, message, timestamp, read) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [msg.id, msg.name, msg.email, msg.subject, msg.message, msg.timestamp, msg.read]
        );
        console.log('[New] ' + msg.name + ' - ' + msg.subject);
        res.json({ ok: true, data: msg });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

app.patch('/api/messages/:id', async (req, res) => {
    try {
        if (req.body.read !== undefined) {
            await pool.query('UPDATE messages SET read = $1 WHERE id = $2', [req.body.read, req.params.id]);
        }
        const result = await pool.query('SELECT * FROM messages WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json({ ok: true, data: result.rows[0] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

app.patch('/api/messages/read-all', async (req, res) => {
    try {
        await pool.query('UPDATE messages SET read = TRUE');
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

app.delete('/api/messages/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
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
