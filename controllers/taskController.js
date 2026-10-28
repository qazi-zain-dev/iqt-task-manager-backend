const mongoose = require('mongoose');
const Task = require('../models/Task');
const { getDbStatus } = require('../config/db');

let memoryStore = [
  {
    _id: '65f01a011000000000000001',
    title: 'Complete Full-Stack Application Setup',
    description: 'Build modern React frontend with Tailwind CSS and Node.js REST API with MongoDB.',
    completed: true,
    status: 'completed',
    priority: 'high',
    category: 'Development',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    tags: ['react', 'node', 'mongodb'],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: '65f01a011000000000000002',
    title: 'Integrate Public Open-Meteo & GitHub Weather APIs',
    description: 'Fetch real-time weather forecasts to empower weather-aware task scheduling and planning.',
    completed: false,
    status: 'in-progress',
    priority: 'urgent',
    category: 'Development',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    tags: ['api', 'integration', 'weather'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: '65f01a011000000000000003',
    title: 'Design Premium Glassmorphism UI Components',
    description: 'Style task cards, filter bar, modals, and responsive mobile layout with sleek dark/light aesthetics.',
    completed: false,
    status: 'pending',
    priority: 'medium',
    category: 'Design',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    tags: ['ui', 'ux', 'tailwind'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: '65f01a011000000000000004',
    title: 'Prepare Comprehensive README & API Documentation',
    description: 'Include setup steps, MongoDB schema, endpoints, screenshots, and live demo guide.',
    completed: false,
    status: 'pending',
    priority: 'low',
    category: 'Work',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    tags: ['docs', 'submission'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const shouldUseMongo = () => getDbStatus().connected;

exports.getTasks = async (req, res) => {
  try {
    const { search, status, priority, category, sortBy } = req.query;

    if (shouldUseMongo()) {
      const query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (status && status !== 'all') {
        if (status === 'completed') query.completed = true;
        else if (status === 'pending') query.completed = false;
        else query.status = status;
      }

      if (priority && priority !== 'all') {
        query.priority = priority;
      }

      if (category && category !== 'all') {
        query.category = category;
      }

      let sortOption = { createdAt: -1 };
      if (sortBy === 'oldest') sortOption = { createdAt: 1 };
      if (sortBy === 'dueDate') sortOption = { dueDate: 1 };
      if (sortBy === 'priority') sortOption = { priority: -1 };
      if (sortBy === 'title') sortOption = { title: 1 };

      const tasks = await Task.find(query).sort(sortOption);

      return res.status(200).json({
        success: true,
        count: tasks.length,
        dataSource: 'MongoDB',
        data: tasks,
      });
    }

    let filtered = [...memoryStore];

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          (t.description && t.description.toLowerCase().includes(term))
      );
    }

    if (status && status !== 'all') {
      if (status === 'completed') filtered = filtered.filter((t) => t.completed);
      else if (status === 'pending') filtered = filtered.filter((t) => !t.completed);
      else filtered = filtered.filter((t) => t.status === status);
    }

    if (priority && priority !== 'all') {
      filtered = filtered.filter((t) => t.priority === priority);
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((t) => t.category === category);
    }

    if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'dueDate') {
      filtered.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      dataSource: 'InMemoryFallback',
      data: filtered,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks',
      error: error.message,
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (shouldUseMongo()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid task ID format' });
      }
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      return res.status(200).json({ success: true, data: task });
    }

    const task = memoryStore.find((t) => t._id === id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, tags, status, completed } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    const isCompleted = completed === true || status === 'completed';
    const computedStatus = isCompleted ? 'completed' : status || 'pending';

    if (shouldUseMongo()) {
      const task = await Task.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        priority: priority || 'medium',
        category: category || 'General',
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: Array.isArray(tags) ? tags : [],
        completed: isCompleted,
        status: computedStatus,
      });

      return res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    }

    const newTask = {
      _id: new mongoose.Types.ObjectId().toString(),
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'medium',
      category: category || 'General',
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      tags: Array.isArray(tags) ? tags : [],
      completed: isCompleted,
      status: computedStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryStore.unshift(newTask);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create task',
      error: error.message,
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, category, dueDate, tags, status, completed } = req.body;

    if (shouldUseMongo()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid task ID format' });
      }

      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      if (title !== undefined) task.title = title.trim();
      if (description !== undefined) task.description = description.trim();
      if (priority !== undefined) task.priority = priority;
      if (category !== undefined) task.category = category;
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
      if (tags !== undefined) task.tags = Array.isArray(tags) ? tags : task.tags;

      if (completed !== undefined) {
        task.completed = completed;
        task.status = completed ? 'completed' : 'pending';
      } else if (status !== undefined) {
        task.status = status;
        task.completed = status === 'completed';
      }

      const updatedTask = await task.save();

      return res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask,
      });
    }

    const index = memoryStore.findIndex((t) => t._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const current = memoryStore[index];
    const isCompleted =
      completed !== undefined
        ? completed
        : status !== undefined
        ? status === 'completed'
        : current.completed;

    const newStatus =
      status !== undefined
        ? status
        : completed !== undefined
        ? completed
          ? 'completed'
          : 'pending'
        : current.status;

    const updatedTask = {
      ...current,
      title: title !== undefined ? title.trim() : current.title,
      description: description !== undefined ? description.trim() : current.description,
      priority: priority !== undefined ? priority : current.priority,
      category: category !== undefined ? category : current.category,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate).toISOString() : null) : current.dueDate,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : current.tags) : current.tags,
      completed: isCompleted,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    memoryStore[index] = updatedTask;

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update task',
      error: error.message,
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (shouldUseMongo()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid task ID format' });
      }

      const task = await Task.findByIdAndDelete(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
        data: { id },
      });
    }

    const index = memoryStore.findIndex((t) => t._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    memoryStore.splice(index, 1);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message,
    });
  }
};

exports.toggleTaskCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    if (shouldUseMongo()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid task ID format' });
      }

      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      task.completed = !task.completed;
      task.status = task.completed ? 'completed' : 'pending';
      const updated = await task.save();

      return res.status(200).json({
        success: true,
        message: `Task marked as ${updated.completed ? 'completed' : 'pending'}`,
        data: updated,
      });
    }

    const index = memoryStore.findIndex((t) => t._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = memoryStore[index];
    task.completed = !task.completed;
    task.status = task.completed ? 'completed' : 'pending';
    task.updatedAt = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: `Task marked as ${task.completed ? 'completed' : 'pending'}`,
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
