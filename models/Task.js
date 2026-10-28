const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['Work', 'Personal', 'Development', 'Design', 'General'],
      default: 'General',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.pre('save', function (next) {
  if (this.isModified('completed')) {
    if (this.completed && this.status !== 'completed') {
      this.status = 'completed';
    } else if (!this.completed && this.status === 'completed') {
      this.status = 'pending';
    }
  } else if (this.isModified('status')) {
    this.completed = this.status === 'completed';
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
