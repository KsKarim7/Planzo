import express from 'express';
import { getProjectActivityLogs, getEntityActivityLogs, getUserActivityLogs, filterActivityLogs } from '../controllers/activityLogController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Get activity logs for a project
router.get('/project/:projectId', getProjectActivityLogs);

// Get activity logs for a specific entity
router.get('/entity/:entityType/:entityId', getEntityActivityLogs);

// Get user activity logs
router.get('/user', getUserActivityLogs);

// Filter activity logs
router.get('/filter', filterActivityLogs);

export default router; 