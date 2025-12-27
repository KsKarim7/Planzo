import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  generateReport,
  getProjectReports,
  downloadReport,
  emailWeeklySummary,
  deleteReport
} from '../controllers/reportController.js';

const router = express.Router();

// Report routes
router.post('/projects/:projectId/reports', verifyToken, generateReport);
router.get('/projects/:projectId/reports', verifyToken, getProjectReports);
router.get('/reports/:reportId/download', verifyToken, downloadReport);
router.post('/projects/:projectId/email-summary', verifyToken, emailWeeklySummary);
router.delete('/reports/:reportId', verifyToken, deleteReport);

export default router; 