import { Project } from '../models/projectModel.js';
import { User } from '../models/userModel.js';
import { Team } from '../models/teamModel.js';
import mongoose from 'mongoose';

// Create a new project
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    console.log('Creating project with name:', name);
    console.log('Description:', description);
    console.log('User ID:', userId);

    if (!name) {
      console.log('Error: Project name is missing');
      return res.status(400).json({ message: "Project name is required" });
    }

    console.log('Creating new project document');
    const newProject = new Project({
      name,
      description: description || '',
      creator: userId,
      members: [{ user: userId, role: 'Owner' }]
    });

    console.log('New project document:', JSON.stringify(newProject));
    
    console.log('Saving project to database');
    await newProject.save();
    console.log('Project saved successfully with ID:', newProject._id);

    // Add project to user's projects
    console.log('Updating user document with project reference');
    const userUpdateResult = await User.findByIdAndUpdate(userId, {
      $push: { projects: newProject._id }
    }, { new: true });
    
    console.log('User update result:', userUpdateResult ? 'Success' : 'Failed');
    if (!userUpdateResult) {
      console.log('Warning: User document not found or not updated');
    }

    console.log('Project creation completed successfully');
    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: newProject
    });
  } catch (error) {
    console.error("Error creating project:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message
    });
  }
};

// Get all projects for a user
export const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching projects for user ID:', userId);

    console.log('Finding user document and populating projects');
    const user = await User.findById(userId).populate({
      path: 'projects',
      populate: [
        {
          path: 'members.user',
          select: 'name email profileImage'
        },
        {
          path: 'teams',
          select: 'name description'
        },
        {
          path: 'tasks',
          select: 'title status priority dueDate'
        }
      ]
    });

    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Found user: ${user.name}, Email: ${user.email}`);
    console.log(`User has ${user.projects ? user.projects.length : 0} projects`);
    
    if (user.projects && user.projects.length > 0) {
      console.log('Project IDs:', user.projects.map(p => p._id));
    } else {
      console.log('User has no projects');
    }

    return res.status(200).json({
      success: true,
      projects: user.projects || []
    });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message
    });
  }
};

// Get a single project by ID
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(projectId)
      .populate({
        path: 'members.user',
        select: 'name email profileImage'
      })
      .populate({
        path: 'teams',
        populate: {
          path: 'members.user',
          select: 'name email profileImage'
        }
      })
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignee',
          select: 'name email profileImage'
        }
      });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(member => member.user._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    return res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message
    });
  }
};

// Update a project
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is the owner of the project
    const isOwner = project.members.some(
      member => member.user.toString() === userId && member.role === 'Owner'
    );

    if (!isOwner) {
      return res.status(403).json({ message: "Only the project owner can update project details" });
    }

    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: error.message
    });
  }
};

// Delete a project
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is the owner of the project
    const isOwner = project.members.some(
      member => member.user.toString() === userId && member.role === 'Owner'
    );

    if (!isOwner) {
      return res.status(403).json({ message: "Only the project owner can delete the project" });
    }

    // Remove project from all users' projects array
    for (const member of project.members) {
      await User.findByIdAndUpdate(member.user, {
        $pull: { projects: projectId }
      });
    }

    // Remove project from all teams' projects array
    for (const teamId of project.teams) {
      await Team.findByIdAndUpdate(teamId, {
        $pull: { projects: projectId }
      });
    }

    await Project.findByIdAndDelete(projectId);

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: error.message
    });
  }
};

// Add a member to a project
export const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;
    const currentUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid project ID or user ID" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if current user is the owner of the project
    const isOwner = project.members.some(
      member => member.user.toString() === currentUserId && member.role === 'Owner'
    );

    if (!isOwner) {
      return res.status(403).json({ message: "Only the project owner can add members" });
    }

    // Check if user is already a member
    const isMember = project.members.some(member => member.user.toString() === userId);
    if (isMember) {
      return res.status(400).json({ message: "User is already a member of this project" });
    }

    // Add user to project
    project.members.push({
      user: userId,
      role: role || 'Contributor'
    });

    await project.save();

    // Add project to user's projects
    await User.findByIdAndUpdate(userId, {
      $push: { projects: projectId }
    });

    return res.status(200).json({
      success: true,
      message: "Member added to project successfully",
      project
    });
  } catch (error) {
    console.error("Error adding member to project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add member to project",
      error: error.message
    });
  }
};

// Remove a member from a project
export const removeProjectMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const currentUserId = req.user.id;

    console.log(`Attempting to remove member ${memberId} from project ${projectId} by user ${currentUserId}`);

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      console.log('Invalid ObjectID format:', { projectId, memberId });
      return res.status(400).json({ message: "Invalid project ID or member ID" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      console.log(`Project not found with ID ${projectId}`);
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if current user is the owner of the project
    const isOwner = project.members.some(
      member => member.user.toString() === currentUserId && member.role === 'Owner'
    );

    console.log(`Request from user ${currentUserId}, isOwner: ${isOwner}`);

    if (!isOwner) {
      return res.status(403).json({ message: "Only the project owner can remove members" });
    }

    // Check if member is the owner
    const memberIsOwner = project.members.some(
      member => member.user.toString() === memberId && member.role === 'Owner'
    );

    if (memberIsOwner) {
      console.log(`Cannot remove owner from project`);
      return res.status(400).json({ message: "Cannot remove the project owner" });
    }

    // Check if the member exists in the project
    const memberExists = project.members.some(
      member => member.user.toString() === memberId
    );

    if (!memberExists) {
      console.log(`Member ${memberId} not found in project ${projectId}`);
      return res.status(404).json({ message: "Member not found in this project" });
    }

    console.log(`Member found in project. Removing...`);

    // Remove member from project
    project.members = project.members.filter(member => member.user.toString() !== memberId);
    await project.save();

    // Remove project from user's projects
    await User.findByIdAndUpdate(memberId, {
      $pull: { projects: projectId }
    });

    console.log(`Member ${memberId} successfully removed from project ${projectId}`);

    return res.status(200).json({
      success: true,
      message: "Member removed from project successfully",
      project
    });
  } catch (error) {
    console.error("Error removing member from project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove member from project",
      error: error.message
    });
  }
};

// Add a team to a project
export const addTeamToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { teamId } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: "Invalid project ID or team ID" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is the owner of the project
    const isOwner = project.members.some(
      member => member.user.toString() === userId && member.role === 'Owner'
    );

    if (!isOwner) {
      return res.status(403).json({ message: "Only the project owner can add teams" });
    }

    // Check if team is already in the project
    if (project.teams.includes(teamId)) {
      return res.status(400).json({ message: "Team is already part of this project" });
    }

    // Add team to project
    project.teams.push(teamId);
    await project.save();

    // Add project to team's projects
    team.projects.push(projectId);
    await team.save();

    return res.status(200).json({
      success: true,
      message: "Team added to project successfully",
      project
    });
  } catch (error) {
    console.error("Error adding team to project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add team to project",
      error: error.message
    });
  }
};

// Remove a team from a project
export const removeTeamFromProject = async (req, res) => {
  try {
    const { projectId, teamId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: "Invalid project ID or team ID" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is the owner of the project
    const isOwner = project.members.some(
      member => member.user.toString() === userId && member.role === 'Owner'
    );

    if (!isOwner) {
      return res.status(403).json({ message: "Only the project owner can remove teams" });
    }

    // Remove team from project
    project.teams = project.teams.filter(id => id.toString() !== teamId);
    await project.save();

    // Remove project from team's projects
    team.projects = team.projects.filter(id => id.toString() !== projectId);
    await team.save();

    return res.status(200).json({
      success: true,
      message: "Team removed from project successfully",
      project
    });
  } catch (error) {
    console.error("Error removing team from project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove team from project",
      error: error.message
    });
  }
}; 