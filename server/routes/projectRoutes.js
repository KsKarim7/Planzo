import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  addTeamToProject,
  removeTeamFromProject
} from '../controllers/projectController.js';

const router = express.Router();

// Project CRUD routes
router.post('/', verifyToken, createProject);
router.get('/', verifyToken, getUserProjects);
router.get('/:projectId', verifyToken, getProjectById);
router.put('/:projectId', verifyToken, updateProject);
router.delete('/:projectId', verifyToken, deleteProject);

// Project member management
router.post('/:projectId/members', verifyToken, addProjectMember);
router.delete('/:projectId/members/:memberId', verifyToken, removeProjectMember);

// Project team management
router.post('/:projectId/teams', verifyToken, addTeamToProject);
router.delete('/:projectId/teams/:teamId', verifyToken, removeTeamFromProject);

export default router; 