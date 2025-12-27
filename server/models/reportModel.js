import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  type: {
    type: String,
    enum: ['Burn Down', 'Task Progress', 'Team Performance', 'Time Tracking', 'Custom'],
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  filePath: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Additional data for generating reports
  parameters: {
    type: Object,
    default: {}
  },
  // For storing chart configurations
  chartConfig: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

export const Report = mongoose.model('Report', reportSchema); 