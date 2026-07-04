import { Router } from 'express';
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject, 
  revealCredential, 
  exportBackup, 
  importBackup, 
  getAnalytics, 
  getNotifications 
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Specialized endpoints (must go before dynamic parameter routes)
router.get('/analytics', protect, getAnalytics);
router.get('/notifications', protect, getNotifications);
router.get('/export', protect, exportBackup);
router.post('/import', protect, importBackup);
router.post('/credentials/reveal', protect, revealCredential);

// General CRUD endpoints
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

export default router;
