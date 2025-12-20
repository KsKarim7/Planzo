import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { 
  createTeamController, 
  getTeamController, 
  getJoinedTeamController,
  removeMemberController,
  addMemberController,
  assignRoleController,
  searchTeams
} from '../controllers/teamController.js';

export const teamRouter = Router();

teamRouter.post("/create", verifyToken, createTeamController);
teamRouter.get("/view/joined", verifyToken, getJoinedTeamController); // for getting mult teams
teamRouter.get("/view/:teamId", verifyToken, getTeamController); // for getting a team
teamRouter.delete("/remove/:teamId/:memberId", verifyToken, removeMemberController); // for rmving a memeber from team
teamRouter.post("/add/:teamId", verifyToken, addMemberController); // for adding a member
teamRouter.put("/assign-role/:teamId/:memberId", verifyToken, assignRoleController); // for managing role
teamRouter.get("/search", verifyToken, searchTeams); // for searching teams