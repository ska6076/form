# Contact Form App

A contact form with admin dashboard for receiving messages. Uses PostgreSQL database for persistent storage.

## Files

- `server.js` - Express server with PostgreSQL
- `public/index.html` - Contact form
- `public/dashboard.html` - Admin dashboard
- `package.json` - Dependencies

## Local Development

```bash
npm install
npm start
```

- Form: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard.html

## Deploy to Render.com

### 1. Create PostgreSQL Database
1. Go to https://render.com
2. Create "New PostgreSQL"
3. Note the Internal Database URL (starts with postgres://)

### 2. Create Web Service
1. Create "New Web Service"
2. Connect your GitHub repo
3. Add Environment Variable:
   - Key: `DATABASE_URL`
   - Value: (paste the PostgreSQL internal URL)
4. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Deploy

## Features

- Contact form with validation
- PostgreSQL database for persistent messages
- Dashboard shows all messages
- Mark as read/unread
- Delete messages
- Auto-sync every 3 seconds

## URLs

After deployment:
- Form: `https://your-app.onrender.com`
- Dashboard: `https://your-app.onrender.com/dashboard.html`
