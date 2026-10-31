const express = require('express');
const {
  getAllTasks,
  getTaskById,
  addTask,
  updateTask,
  toggleTaskComplete,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

// REST API endpoints for /api/tasks
router.get('/', getAllTasks);
router.post('/', addTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.patch('/:id/toggle', toggleTaskComplete);
router.delete('/:id', deleteTask);

module.exports = router;
