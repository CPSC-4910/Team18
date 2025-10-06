// App/backend/src/server.js
import express from "express";
import { initializeDatabase } from "./config/database.js";
import authRouter from "./routes/auth.js";

const app = express();

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL // Will be set in App Runner
  ].filter(Boolean);

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

// Health check (doesn't require DB)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection with secrets
    await initializeDatabase();
    
    // Mount routes after DB is ready
    app.use(authRouter);
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();