import { Report } from '../models/reportModel.js';
import { Project } from '../models/projectModel.js';
import { Task } from '../models/taskModel.js';
import { User } from '../models/userModel.js';
import { ActivityLog } from '../models/activityLogModel.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Generate a report
export const generateReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, parameters } = req.body;
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

    // Generate report based on type
    let reportData;
    let filename;
    let filePath;

    switch (type) {
      case 'Burn Down':
        reportData = await generateBurnDownReport(projectId, parameters);
        filename = `burndown_${projectId}_${Date.now()}.pdf`;
        filePath = path.join(reportsDir, filename);
        await createPDF(reportData, filePath);
        break;
      case 'Task Progress':
        reportData = await generateTaskProgressReport(projectId, parameters);
        filename = `task_progress_${projectId}_${Date.now()}.csv`;
        filePath = path.join(reportsDir, filename);
        await createCSV(reportData, filePath);
        break;
      case 'Team Performance':
        reportData = await generateTeamPerformanceReport(projectId, parameters);
        filename = `team_performance_${projectId}_${Date.now()}.pdf`;
        filePath = path.join(reportsDir, filename);
        await createPDF(reportData, filePath);
        break;
      case 'Time Tracking':
        reportData = await generateTimeTrackingReport(projectId, parameters);
        filename = `time_tracking_${projectId}_${Date.now()}.csv`;
        filePath = path.join(reportsDir, filename);
        await createCSV(reportData, filePath);
        break;
      default:
        return res.status(400).json({ message: "Invalid report type" });
    }

    // Create report record in database
    const relativePath = path.join('reports', filename);
    const report = new Report({
      projectId,
      type,
      generatedAt: new Date(),
      filePath: relativePath,
      createdBy: userId,
      parameters
    });

    await report.save();

    return res.status(201).json({
      success: true,
      message: "Report generated successfully",
      report: {
        id: report._id,
        type: report.type,
        generatedAt: report.generatedAt,
        filePath: relativePath
      }
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error.message
    });
  }
};

// Get all reports for a project
export const getProjectReports = async (req, res) => {
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

    // Get all reports for the project
    const reports = await Report.find({ projectId })
      .populate('createdBy', 'name email')
      .sort({ generatedAt: -1 });

    return res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("Error fetching project reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
      error: error.message
    });
  }
};

// Download a report
export const downloadReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    // Get the report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if project exists and user is a member
    const project = await Project.findById(report.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(member => member.user.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: "You don't have access to this report" });
    }

    // Get the file path
    const filePath = path.join(__dirname, '..', report.filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Report file not found" });
    }

    // Send the file
    res.download(filePath);
  } catch (error) {
    console.error("Error downloading report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download report",
      error: error.message
    });
  }
};

// Email weekly summary
export const emailWeeklySummary = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { recipients } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is a manager or owner
    const isManagerOrOwner = project.members.some(
      member => member.user.toString() === userId && 
      (member.role === 'Manager' || member.role === 'Owner')
    );

    if (!isManagerOrOwner) {
      return res.status(403).json({ 
        message: "Only project managers or owners can send weekly summaries" 
      });
    }

    // In a real implementation, this would send emails
    // For this example, we'll just return success

    return res.status(200).json({
      success: true,
      message: "Weekly summary emails sent successfully"
    });
  } catch (error) {
    console.error("Error sending weekly summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send weekly summary",
      error: error.message
    });
  }
};

// Delete a report
export const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    // Get the report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if project exists and user is a member
    const project = await Project.findById(report.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is a manager or owner
    const isManagerOrOwner = project.members.some(
      member => member.user.toString() === userId && 
      (member.role === 'Manager' || member.role === 'Owner')
    );

    if (!isManagerOrOwner) {
      return res.status(403).json({ 
        message: "Only project managers or owners can delete reports" 
      });
    }

    // Delete the file
    const filePath = path.join(__dirname, '..', report.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the report from database
    await Report.findByIdAndDelete(reportId);

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message
    });
  }
};

// Helper functions to generate reports

async function generateBurnDownReport(projectId, parameters) {
  // Get all tasks for the project
  const tasks = await Task.find({ project: projectId });
  
  // Calculate burn down data
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const todoTasks = tasks.filter(task => task.status === 'To Do').length;
  
  return {
    title: 'Burn Down Report',
    projectId,
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0,
    timestamp: new Date().toISOString(),
    parameters
  };
}

async function generateTaskProgressReport(projectId, parameters) {
  // Get all tasks for the project with assignee details
  const tasks = await Task.find({ project: projectId })
    .populate('assignee', 'name email')
    .lean();
  
  // Map tasks to CSV format
  const records = tasks.map(task => ({
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    assignee: task.assignee ? task.assignee.name : 'Unassigned',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date',
    completedAt: task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Not completed'
  }));
  
  return {
    header: [
      { id: 'id', title: 'ID' },
      { id: 'title', title: 'Title' },
      { id: 'description', title: 'Description' },
      { id: 'assignee', title: 'Assignee' },
      { id: 'status', title: 'Status' },
      { id: 'priority', title: 'Priority' },
      { id: 'dueDate', title: 'Due Date' },
      { id: 'completedAt', title: 'Completed At' }
    ],
    records
  };
}

async function generateTeamPerformanceReport(projectId, parameters) {
  // Get all tasks for the project
  const tasks = await Task.find({ project: projectId })
    .populate('assignee', 'name email')
    .lean();
  
  // Group tasks by assignee
  const assigneePerformance = {};
  
  tasks.forEach(task => {
    const assigneeName = task.assignee ? task.assignee.name : 'Unassigned';
    const assigneeId = task.assignee ? task.assignee._id.toString() : 'unassigned';
    
    if (!assigneePerformance[assigneeId]) {
      assigneePerformance[assigneeId] = {
        name: assigneeName,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0
      };
    }
    
    assigneePerformance[assigneeId].totalTasks++;
    
    if (task.status === 'Done') {
      assigneePerformance[assigneeId].completedTasks++;
    } else if (task.status === 'In Progress') {
      assigneePerformance[assigneeId].inProgressTasks++;
    } else {
      assigneePerformance[assigneeId].todoTasks++;
    }
  });
  
  // Calculate completion percentages
  Object.keys(assigneePerformance).forEach(assigneeId => {
    const performance = assigneePerformance[assigneeId];
    performance.completionPercentage = performance.totalTasks > 0 
      ? (performance.completedTasks / performance.totalTasks * 100).toFixed(2) 
      : 0;
  });
  
  return {
    title: 'Team Performance Report',
    projectId,
    assigneePerformance: Object.values(assigneePerformance),
    timestamp: new Date().toISOString(),
    parameters
  };
}

async function generateTimeTrackingReport(projectId, parameters) {
  // Get all activity logs related to tasks in the project
  const activityLogs = await ActivityLog.find({ 
    projectId, 
    entityType: 'Task',
    action: { $in: ['Created', 'Updated', 'Deleted'] }
  }).populate('userId', 'name email')
    .sort({ createdAt: 1 })
    .lean();
  
  // Get all tasks in the project
  const tasks = await Task.find({ project: projectId })
    .populate('assignee', 'name email')
    .lean();
  
  // Map task IDs to titles for reference
  const taskMap = {};
  tasks.forEach(task => {
    taskMap[task._id.toString()] = task.title;
  });
  
  // Prepare records for CSV
  const records = activityLogs.map(log => ({
    date: new Date(log.createdAt).toLocaleDateString(),
    time: new Date(log.createdAt).toLocaleTimeString(),
    user: log.userId ? log.userId.name : 'Unknown',
    action: log.action,
    taskId: log.entityId,
    taskTitle: taskMap[log.entityId] || 'Unknown Task',
    details: JSON.stringify(log.details)
  }));
  
  return {
    header: [
      { id: 'date', title: 'Date' },
      { id: 'time', title: 'Time' },
      { id: 'user', title: 'User' },
      { id: 'action', title: 'Action' },
      { id: 'taskId', title: 'Task ID' },
      { id: 'taskTitle', title: 'Task Title' },
      { id: 'details', title: 'Details' }
    ],
    records
  };
}

// Helper functions to create files

async function createCSV(data, filePath) {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: data.header
  });
  
  await csvWriter.writeRecords(data.records);
}

async function createPDF(data, filePath) {
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  
  doc.pipe(stream);
  
  // Add title
  doc.fontSize(20).text(data.title, { align: 'center' });
  doc.moveDown(2);
  
  // Add timestamp
  doc.fontSize(12).text(`Generated on: ${new Date(data.timestamp).toLocaleString()}`, { align: 'right' });
  doc.moveDown(2);
  
  // For Burn Down Report
  if (data.totalTasks !== undefined) {
    doc.fontSize(16).text('Project Task Summary:');
    doc.moveDown();
    doc.fontSize(12).text(`Total Tasks: ${data.totalTasks}`);
    doc.text(`Completed Tasks: ${data.completedTasks}`);
    doc.text(`In Progress Tasks: ${data.inProgressTasks}`);
    doc.text(`To Do Tasks: ${data.todoTasks}`);
    doc.text(`Completion Percentage: ${data.completionPercentage}%`);
    doc.moveDown(2);
  }
  
  // For Team Performance Report
  if (data.assigneePerformance) {
    doc.fontSize(16).text('Team Member Performance:');
    doc.moveDown();
    
    data.assigneePerformance.forEach(performance => {
      doc.fontSize(14).text(performance.name);
      doc.fontSize(12).text(`Total Tasks: ${performance.totalTasks}`);
      doc.text(`Completed Tasks: ${performance.completedTasks}`);
      doc.text(`In Progress Tasks: ${performance.inProgressTasks}`);
      doc.text(`To Do Tasks: ${performance.todoTasks}`);
      doc.text(`Completion Percentage: ${performance.completionPercentage}%`);
      doc.moveDown();
    });
  }
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
} 