# Contact Form App

A contact form with admin dashboard for receiving messages.

## Files

- `server.js` - Express server (Node.js)
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

1. Push code to GitHub
2. Create account at https://render.com
3. Create "New Web Service"
4. Connect GitHub repo
5. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Deploy

## Deploy to Vercel (Alternative)

```bash
npm i -g vercel
vercel
```

## Features

- Contact form with validation
- Server saves messages to file (messages.json)
- Dashboard shows all messages
- Mark as read/unread
- Delete messages
- Auto-sync every 3 seconds
