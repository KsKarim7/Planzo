import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  phone: {
    type: Number,
    required: true
  },

  role: {
    type: String,
    enum: ['Manager', 'Member'],
    default: 'Member'
  },

  profileImage: {
    type: String,
    default: null
  },
  
  uniqueId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  dateOfBirth: {
    type: Date
  },

  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],

  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }]
}, {
  timestamps: true
});

// Generate a unique ID before saving if not provided
userSchema.pre('save', async function(next) {
  // Only generate uniqueId if it's not already set
  if (!this.uniqueId) {
    // Generate a unique ID with prefix UID- followed by random alphanumeric characters
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.uniqueId = `UID-${randomId}`;
    
    // Make sure the ID is not already used
    const existingUser = await mongoose.model('User').findOne({ uniqueId: this.uniqueId });
    if (existingUser) {
      // If collision occurs, try again
      return this.pre('save', next);
    }
  }
  next();
});

export const User = mongoose.model('User', userSchema);
