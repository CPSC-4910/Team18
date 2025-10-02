// App/backend/src/server.js
app.use((req, res, next) => {
  // Replace with your actual Amplify URL
  const allowedOrigins = [
    'http://localhost:3000',
    'https://your-amplify-app.amplifyapp.com' // Add your Amplify domain
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});