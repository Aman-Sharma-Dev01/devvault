import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables - check both backend/ and root directories
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import { connectDB } from './config/db.js';



async function startServer() {
  await connectDB();
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.use(express.static("public"));

  // Body parser middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth and Project Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ 
      message: err.message || 'An unexpected server error occurred',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  });

  // In production, serve the frontend build
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), '..', 'frontend', 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static asset serving configured.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DevVault backend running on http://0.0.0.0:${PORT}`);
    console.log(`   Local workspace time: ${new Date().toISOString()}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
