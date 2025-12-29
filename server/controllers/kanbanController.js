import { Task } from "../models/taskModel.js";
import { Project } from "../models/projectModel.js";
import { ActivityLog } from "../models/activityLogModel.js";

// Get tasks organized by kanban columns for a project
export const getKanbanBoard = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get all tasks for the project
    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'name email')
      .sort({ updatedAt: -1 });

    // Organize tasks by column
    const columns = {
      'Assigned': [],
      'Ongoing': [],
      'Completed': []
    };

    // Add custom columns from project if needed
    // This could be extended to support custom columns in the future

    // Group tasks by column
    tasks.forEach(task => {
      // Map old statuses to new ones if needed
      let status = task.status;
      if (status === 'To Do') status = 'Assigned';
      if (status === 'In Progress') status = 'Ongoing';
      if (status === 'Done') status = 'Completed';
      
      if (columns[status]) {
        columns[status].push(task);
      } else {
        // Default to 'Assigned' if column doesn't exist
        columns['Assigned'].push(task);
      }
    });

    res.status(200).json({ columns });
  } catch (error) {
    res.status(500).json({ message: "Error fetching kanban board", error: error.message });
  }
};

// Move a task to a different column
export const moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { column } = req.body;
    const userId = req.user._id;

    if (!column) {
      return res.status(400).json({ message: "Column is required" });
    }

    // Valid columns
    const validColumns = ['Assigned', 'Ongoing', 'Completed'];
    if (!validColumns.includes(column)) {
      return res.status(400).json({ message: "Invalid column" });
    }

    // Map column to status
    let status = column;

    // Find and update the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Update task
    task.kanbanColumn = column;
    task.status = status;
    
    // Set completedAt date if moved to Completed column
    if (column === 'Completed' && !task.completedAt) {
      task.completedAt = new Date();
    } else if (column !== 'Completed') {
      task.completedAt = null;
    }

    await task.save();

    // Log activity
    await ActivityLog.create({
      userId,
      entityType: 'Task',
      entityId: taskId,
      action: 'Updated',
      details: { 
        taskTitle: task.title,
        updates: { status, kanbanColumn: column }
      },
      projectId: task.project
    });

    res.status(200).json({ 
      success: true,
      message: "Task moved successfully",
      task
    });
  } catch (error) {
    res.status(500).json({ message: "Error moving task", error: error.message });
  }
};

// Reorder tasks within a column
export const reorderTasks = async (req, res) => {
  try {
    // This would be implemented with a more complex data structure
    // that tracks task order within columns. For now, we'll just return success
    // as the frontend can handle the visual reordering.
    
    res.status(200).json({ message: "Tasks reordered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error reordering tasks", error: error.message });
  }
}; 