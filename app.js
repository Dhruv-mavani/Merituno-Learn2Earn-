const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from all directories with proper configuration
app.use(express.static(path.join(__dirname)));

// Additional static paths for specific directories - FIXED PATHS
app.use('/login', express.static(path.join(__dirname, 'login')));
app.use('/home-page', express.static(path.join(__dirname, 'home-page')));
app.use('/users', express.static(path.join(__dirname, 'users')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// IMPORTANT: Add this to serve CSS files from users/css directory
app.use('/users/css', express.static(path.join(__dirname, 'users', 'css')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home-page', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login', 'index.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'login', 'signup.html'));
});

// Additional routes for other auth pages
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'login', 'forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'login', 'reset-password.html'));
});

// User dashboard routes
app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'users', 'admin-dashboard.html'));
});

app.get('/member-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'users', 'member-dashboard.html'));
});

app.get('/employer-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'users', 'employer-dashboard.html'));
});

// Debug route to check if CSS files are accessible
app.get('/debug-css', (req, res) => {
  res.json({
    'home-page/style.css': `http://localhost:${port}/home-page/style.css`,
    'users/css/users.css': `http://localhost:${port}/users/css/users.css`,
    'users/users.css': `http://localhost:${port}/users/users.css`
  });
});

// Catch-all route for SPA behavior
app.get('*', (req, res) => {
  res.status(404).send('Page not found');
});

// Start server
app.listen(port, () => {
  console.log(`Merituno app running at http://localhost:${port}`);
  console.log(`Debug CSS URLs: http://localhost:${port}/debug-css`);
});