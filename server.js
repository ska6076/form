const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const messages = [];

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

app.get('/api/messages', (req, res) => {
    res.json({ data: messages });
});

app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
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
    messages.unshift(msg);
    console.log('[New] ' + msg.name + ' - ' + msg.subject);
    res.json({ ok: true, data: msg });
});

app.patch('/api/messages/:id', (req, res) => {
    const msg = messages.find(m => m.id === req.params.id);
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (req.body.read !== undefined) msg.read = req.body.read;
    res.json({ ok: true, data: msg });
});

app.patch('/api/messages/read-all', (req, res) => {
    messages.forEach(m => m.read = true);
    res.json({ ok: true });
});

app.delete('/api/messages/:id', (req, res) => {
    const i = messages.findIndex(m => m.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Not found' });
    messages.splice(i, 1);
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log('');
    console.log('  SUCCESS! Server running at:');
    console.log('  http://localhost:3000');
    console.log('  http://localhost:3000/dashboard.html');
    console.log('');
});
