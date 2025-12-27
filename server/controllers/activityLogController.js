import { ActivityLog } from "../models/activityLogModel.js";
import { Project } from "../models/projectModel.js";

// Get activity logs for a project
export const getProjectActivityLogs = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has access to the project
    const isMember = project.members.some(member => member.user.equals(userId));
    if (!isMember) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get activity logs
    const logs = await ActivityLog.find({ projectId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalLogs = await ActivityLog.countDocuments({ projectId });

    res.status(200).json({
      logs,
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        pages: Math.ceil(totalLogs / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error: error.message });
  }
};

// Get activity logs for a specific entity (task, comment, etc.)
export const getEntityActivityLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const userId = req.user._id;

    // Validate entity type
    const validEntityTypes = ['Task', 'Project', 'Comment', 'Attachment', 'User', 'Team'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ message: "Invalid entity type" });
    }

    // Get activity logs
    const logs = await ActivityLog.find({ 
      entityType, 
      entityId 
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching entity activity logs", error: error.message });
  }
};

// Get user activity logs
export const getUserActivityLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get activity logs
    const logs = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalLogs = await ActivityLog.countDocuments({ userId });

    res.status(200).json({
      logs,
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        pages: Math.ceil(totalLogs / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user activity logs", error: error.message });
  }
};

// Filter activity logs
export const filterActivityLogs = async (req, res) => {
  try {
    const { projectId, entityType, action, startDate, endDate } = req.query;
    const userId = req.user._id;

    // Build query
    const query = {};

    if (projectId) {
      // Check if project exists and user has access
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const isMember = project.members.some(member => member.user.equals(userId));
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this project" });
      }

      query.projectId = projectId;
    }

    if (entityType) {
      query.entityType = entityType;
    }

    if (action) {
      query.action = action;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get filtered logs
    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error filtering activity logs", error: error.message });
  }
}; 