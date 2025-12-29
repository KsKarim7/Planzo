import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask
} from '../controllers/taskController.js';

const router = express.Router();

// Task routes within projects
router.post('/projects/:projectId/tasks', verifyToken, createTask);
router.get('/projects/:projectId/tasks', verifyToken, getProjectTasks);
router.get('/projects/:projectId/tasks/:taskId', verifyToken, getTaskById);
router.patch('/projects/:projectId/tasks/:taskId', verifyToken, updateTask);
router.delete('/projects/:projectId/tasks/:taskId', verifyToken, deleteTask);

// Additional routes to match frontend API calls
router.get('/tasks/project/:projectId', verifyToken, getProjectTasks);

export default router; 