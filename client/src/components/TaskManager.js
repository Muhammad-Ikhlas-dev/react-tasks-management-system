import React, { useState, useEffect } from 'react';
import './TaskManager.css';
import WeatherWidget from './WeatherWidget';

const getApiBaseUrl = () => {
  const rawUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const cleanUrl = rawUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/tasks') ? cleanUrl : `${cleanUrl}/tasks`;
};

const API_BASE_URL = getApiBaseUrl();

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  // Edit task state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('medium');

  // Filter & Search state
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Show temporary notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Fetch all tasks from Backend API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE_URL);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      showNotification('Failed to load tasks. Make sure backend server is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showNotification('Please enter a task title', 'error');
      return;
    }

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create task');
      }

      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setTitle('');
      setDescription('');
      setPriority('medium');
      showNotification('Task added successfully!');
    } catch (err) {
      console.error('Error adding task:', err);
      showNotification('Error creating task', 'error');
    }
  };

  // Start Editing
  const startEditing = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'medium');
  };

  // Cancel Editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditPriority('medium');
  };

  // Save Edit
  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) {
      showNotification('Task title cannot be empty', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update task');
      }

      const updated = await res.json();
      setTasks(tasks.map((t) => (t._id === id ? updated : t)));
      cancelEditing();
      showNotification('Task updated successfully!');
    } catch (err) {
      console.error('Error updating task:', err);
      showNotification('Error updating task', 'error');
    }
  };

  // Toggle Mark as Completed
  const handleToggleCompleted = async (task) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${task._id}/toggle`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        // Fallback to PUT if PATCH not available
        const fallbackRes = await fetch(`${API_BASE_URL}/${task._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: !task.completed }),
        });
        if (!fallbackRes.ok) throw new Error('Failed to toggle completion');
        const updated = await fallbackRes.json();
        setTasks(tasks.map((t) => (t._id === task._id ? updated : t)));
      } else {
        const updated = await res.json();
        setTasks(tasks.map((t) => (t._id === task._id ? updated : t)));
      }

      showNotification(
        task.completed ? 'Task marked as pending' : 'Task marked as completed!'
      );
    } catch (err) {
      console.error('Error toggling completion:', err);
      showNotification('Error updating task status', 'error');
    }
  };

  // Delete Task
  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(tasks.filter((t) => t._id !== id));
      showNotification('Task deleted successfully!');
    } catch (err) {
      console.error('Error deleting task:', err);
      showNotification('Error deleting task', 'error');
    }
  };

  // Filter & Search calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const filteredTasks = tasks.filter((task) => {
    // Filter by tab
    if (filter === 'completed' && !task.completed) return false;
    if (filter === 'pending' && task.completed) return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }
    return true;
  });

  return (
    <div className="task-manager-container">
      {/* Header */}
      <header className="tm-header">
        <h1 className="tm-title">TaskFlow Manager</h1>
        <p className="tm-subtitle">Full Stack Task Management & Weather Productivity System</p>
        <div className="tm-badges">
          <span className="badge-pill">
            <span className="badge-dot"></span> React 19 Client
          </span>
          <span className="badge-pill">
            <span className="badge-dot"></span>{' '}
            {API_BASE_URL.includes('vercel.app')
              ? 'Vercel Deployed API'
              : 'Express REST API'}
          </span>
          <span className="badge-pill">
            <span className="badge-dot"></span> MongoDB: task-assessments-db
          </span>
          <span className="badge-pill">
            <span className="badge-dot"></span> Open-Meteo Weather API
          </span>
        </div>
      </header>

      {/* Weather Integration */}
      <WeatherWidget />

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-banner notification-${notification.type}`}>
          <span>{notification.message}</span>
          <button
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Tasks</span>
          <span className="stat-value">{totalTasks}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <span className="stat-value pending">{pendingTasks}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value completed">{completedTasks}</span>
        </div>
      </section>

      {/* Add Task Form Card */}
      <section className="task-form-card">
        <h2 className="form-title">Create New Task</h2>
        <form onSubmit={handleAddTask}>
          <div className="form-group-title">
            <input
              type="text"
              className="input-primary"
              placeholder="What needs to be done? (e.g. Design landing page)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              className="input-description"
              placeholder="Optional description / details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <select
              className="select-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button type="submit" className="btn-add">
              + Add Task
            </button>
          </div>
        </form>
      </section>

      {/* Filters and Search Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({totalTasks})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingTasks})
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedTasks})
          </button>
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Task List */}
      <section>
        {loading ? (
          <div className="loading-box">
            <p>Loading tasks from database...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p className="empty-text">
              {searchQuery
                ? 'No tasks match your search.'
                : filter === 'completed'
                ? 'No completed tasks yet.'
                : filter === 'pending'
                ? 'No pending tasks! All caught up.'
                : 'No tasks found. Add your first task above!'}
            </p>
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`task-item ${task.completed ? 'completed-item' : ''}`}
              >
                {editingId === task._id ? (
                  // Inline Edit View
                  <div className="edit-box">
                    <input
                      type="text"
                      className="input-primary"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Task title"
                    />
                    <div className="form-row">
                      <input
                        type="text"
                        className="input-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                      />
                      <select
                        className="select-priority"
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                    <div className="edit-actions">
                      <button
                        className="btn-cancel"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-save"
                        onClick={() => handleSaveEdit(task._id)}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal View
                  <>
                    <div className="task-left">
                      <input
                        type="checkbox"
                        className="checkbox-custom"
                        checked={task.completed}
                        onChange={() => handleToggleCompleted(task)}
                        title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      />
                      <div className="task-info">
                        <div className="task-title-row">
                          <span
                            className={`task-title ${
                              task.completed ? 'completed-text' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                          <span
                            className={`badge-priority priority-${
                              task.priority || 'medium'
                            }`}
                          >
                            {task.priority || 'medium'}
                          </span>
                        </div>
                        {task.description && (
                          <p className="task-desc">{task.description}</p>
                        )}
                        <span className="task-meta">
                          {task.createdAt
                            ? new Date(task.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    </div>

                    <div className="task-actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => startEditing(task)}
                        title="Edit task"
                      >
                        Edit
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteTask(task._id)}
                        title="Delete task"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default TaskManager;
