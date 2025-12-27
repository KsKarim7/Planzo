import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entityType: {
    type: String,
    enum: ['Task', 'Project', 'Comment', 'Attachment', 'User', 'Team'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    enum: ['Created', 'Updated', 'Deleted', 'Assigned', 'Completed', 'Commented'],
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  }
}, {
  timestamps: true
});

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema); 