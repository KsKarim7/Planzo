import { Task } from '../models/taskModel.js';
import { Project } from '../models/projectModel.js';
import { User } from '../models/userModel.js';
import { ActivityLog } from '../models/activityLogModel.js';
import mongoose from 'mongoose';

// Get all tasks for the current user
export const getAllUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all projects where the user is a member
    const userProjects = await Project.find({
      'members.user': userId
    }).select('_id name');

    // Find all tasks from these projects
    const tasks = await Task.find({
      project: { $in: userProjects.map(p => p._id) }
    })
      .populate('assignee', 'name email profileImage')
      .populate('project', 'name description')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message
    });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assigneeId, dueDate, priority, status, kanbanColumn } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(assigneeId)) {
      return res.status(400).json({ message: "Invalid project ID or assignee ID" });
    }

    if (!title || !dueDate) {
      return res.status(400).json({ message: "Title and due date are required" });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(member => member.user.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    // Check if assignee is a member of the project or a team in the project
    let isAssigneeMember = project.members.some(member => member.user.toString() === assigneeId);
    
    if (!isAssigneeMember && project.teams && project.teams.length > 0) {
      // Check if assignee is a member of any team in the project
      const teams = await Promise.all(
        project.teams.map(teamId => 
          mongoose.model('Team').findById(teamId).populate('members.user', 'name email')
        )
      );
      
      isAssigneeMember = teams.some(team => 
        team.members.some(member => member.user._id.toString() === assigneeId)
      );
    }

    if (!isAssigneeMember) {
      return res.status(400).json({ message: "Assignee must be a member of the project or a team in the project" });
    }

    const newTask = new Task({
      title,
      description: description || '',
      project: projectId,
      assignee: assigneeId,
      creator: userId,
      dueDate,
      priority: priority || 'Medium',
      status: status || 'To Do',
      kanbanColumn: kanbanColumn || status || 'To Do'
    });

    await newTask.save();

    // Add task to project's tasks array
    project.tasks.push(newTask._id);
    await project.save();

    // Populate assignee details
    const populatedTask = await Task.findById(newTask._id)
      .populate('assignee', 'name email profileImage');

    // Log the activity
    await ActivityLog.create({
      userId,
      entityType: 'Task',
      entityId: newTask._id,
      action: 'Created',
      details: { 
        taskTitle: title,
        assigneeId 
      },
      projectId
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populatedTask
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message
    });
  }
};

// Get all tasks for a project
export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(member => member.user.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    // Get all tasks for the project
    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'name email profileImage')
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message
    });
  }
};

// Get a single task
export const getTaskById = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid project ID or task ID" });
    }

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(member => member.user.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    // Get the task
    const task = await Task.findOne({ _id: taskId, project: projectId })
      .populate('assignee', 'name email profileImage')
      .populate('creator', 'name email');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch task",
      error: error.message
    });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { title, description, assigneeId, dueDate, priority, status, kanbanColumn } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid project ID or task ID" });
    }

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(member => member.user.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    // Get the task
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user is the creator or assignee of the task, or a project manager/owner
    const isCreator = task.creator.toString() === userId;
    const isAssignee = task.assignee.toString() === userId;
    const isManagerOrOwner = project.members.some(
      member => member.user.toString() === userId && 
      (member.role === 'Manager' || member.role === 'Owner')
    );

    if (!isCreator && !isAssignee && !isManagerOrOwner) {
      return res.status(403).json({ 
        message: "You don't have permission to update this task" 
      });
    }

    // If assigneeId is provided, check if the new assignee is a member of the project
    if (assigneeId && mongoose.Types.ObjectId.isValid(assigneeId)) {
      let isAssigneeMember = project.members.some(member => member.user.toString() === assigneeId);
      
      if (!isAssigneeMember && project.teams && project.teams.length > 0) {
        // Check if assignee is a member of any team in the project
        const teams = await Promise.all(
          project.teams.map(teamId => 
            mongoose.model('Team').findById(teamId).populate('members.user', 'name email')
          )
        );
        
        isAssigneeMember = teams.some(team => 
          team.members.some(member => member.user._id.toString() === assigneeId)
        );
      }

      if (!isAssigneeMember) {
        return res.status(400).json({ 
          message: "Assignee must be a member of the project or a team in the project" 
        });
      }
    }

    // Update task fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assigneeId && mongoose.Types.ObjectId.isValid(assigneeId)) task.assignee = assigneeId;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (kanbanColumn) task.kanbanColumn = kanbanColumn;

    await task.save();

    // Populate assignee details
    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email profileImage')
      .populate('creator', 'name email');

    // Log the activity
    await ActivityLog.create({
      userId,
      entityType: 'Task',
      entityId: task._id,
      action: 'Updated',
      details: { 
        taskTitle: task.title,
        updates: req.body 
      },
      projectId
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message
    });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid project ID or task ID" });
    }

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is a manager or owner of the project
    const isManagerOrOwner = project.members.some(
      member => member.user.toString() === userId && 
      (member.role === 'Manager' || member.role === 'Owner')
    );

    if (!isManagerOrOwner) {
      return res.status(403).json({ 
        message: "Only project managers or owners can delete tasks" 
      });
    }

    // Get and delete the task
    const task = await Task.findOneAndDelete({ _id: taskId, project: projectId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Remove task from project's tasks array
    project.tasks = project.tasks.filter(id => id.toString() !== taskId);
    await project.save();

    // Log the activity
    await ActivityLog.create({
      userId,
      entityType: 'Task',
      entityId: taskId,
      action: 'Deleted',
      details: { 
        taskTitle: task.title
      },
      projectId
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message
    });
  }
}; 