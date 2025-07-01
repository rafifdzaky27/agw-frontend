"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

export default function GovernanceTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  // Get API URL from environment variable
  const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";
  const API_BASE_URL = `${BACKEND_IP}/api`;

  // Fetch data for governance tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/governance-tasks`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Sort by deadline
        const sortedData = data.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
        setTasks(sortedData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [API_BASE_URL]);

  // Function to save new governance task
  const handlePost = useCallback(async (task) => {
    try {
      const response = await fetch(`${API_BASE_URL}/governance-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const newTask = await response.json();
      setTasks((prev) => [...prev, newTask]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to save data", error);
    }
  }, [API_BASE_URL]);

  // Function to update existing governance task
  const handleSave = useCallback(async (task) => {
    try {
      const response = await fetch(`${API_BASE_URL}/governance-tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const updatedTask = await response.json();
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? updatedTask : item))
      );
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to update data", error);
    }
  }, [API_BASE_URL]);

  // Function to delete governance task
  const handleDelete = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/governance-tasks/${id}`, { 
        method: "DELETE" 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setTasks((prev) => prev.filter((item) => item.id !== id));
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to delete data", error);
    }
  }, [API_BASE_URL]);

  // Function to show governance task details
  const handleShow = useCallback((id) => {
    const task = tasks.find((item) => item.id === id);
    setCurrentTask(task);
    setShowDialog(true);
  }, [tasks]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  // Get badge color based on status
  const getBadgeClass = (status) => {
    switch(status) {
      case 'done':
        return 'bg-green-900 text-green-200';
      case 'on progress':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch(status) {
      case 'done':
        return 'Done';
      case 'on progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-center">Governance Tasks</h1>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Task
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading governance tasks...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Not Started Column */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Not Started</h2>
                <div className="space-y-3">
                  {tasks
                    .filter(task => task.status === 'not yet')
                    .map(task => (
                      <div 
                        key={task.id}
                        className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer"
                        onClick={() => handleShow(task.id)}
                      >
                        <div className="font-semibold mb-2">{task.namaTugas}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.catatan}</div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(task.tanggal)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{task.pic}</div>
                        </div>
                      </div>
                    ))
                  }
                  {tasks.filter(task => task.status === 'not yet').length === 0 && (
                    <div className="text-center py-4 text-gray-500">No tasks</div>
                  )}
                </div>
              </div>
              
              {/* In Progress Column */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4 text-yellow-600 dark:text-yellow-300">In Progress</h2>
                <div className="space-y-3">
                  {tasks
                    .filter(task => task.status === 'on progress')
                    .map(task => (
                      <div 
                        key={task.id}
                        className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer"
                        onClick={() => handleShow(task.id)}
                      >
                        <div className="font-semibold mb-2">{task.namaTugas}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.catatan}</div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(task.tanggal)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{task.pic}</div>
                        </div>
                      </div>
                    ))
                  }
                  {tasks.filter(task => task.status === 'on progress').length === 0 && (
                    <div className="text-center py-4 text-gray-500">No tasks</div>
                  )}
                </div>
              </div>
              
              {/* Done Column */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-300">Done</h2>
                <div className="space-y-3">
                  {tasks
                    .filter(task => task.status === 'done')
                    .map(task => (
                      <div 
                        key={task.id}
                        className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer"
                        onClick={() => handleShow(task.id)}
                      >
                        <div className="font-semibold mb-2">{task.namaTugas}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.catatan}</div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(task.tanggal)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{task.pic}</div>
                        </div>
                      </div>
                    ))
                  }
                  {tasks.filter(task => task.status === 'done').length === 0 && (
                    <div className="text-center py-4 text-gray-500">No tasks</div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {showDialog && (
            <TaskDialog
              task={currentTask}
              onClose={() => setShowDialog(false)}
              onSave={handleSave}
              onDelete={handleDelete}
              formatDate={formatDate}
              getBadgeClass={getBadgeClass}
              getStatusText={getStatusText}
            />
          )}

          {showCreateDialog && (
            <TaskCreateDialog
              onClose={() => setShowCreateDialog(false)}
              onSave={handlePost}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Task Dialog Component
function TaskDialog({ task, onClose, onSave, onDelete, formatDate, getBadgeClass, getStatusText }) {
  const [formState, setFormState] = useState({
    id: task.id || "",
    namaTugas: task.namaTugas || "",
    catatan: task.catatan || "",
    tanggal: task.tanggal || "",
    pic: task.pic || "",
    status: task.status || "not yet",
  });

  const [isEdit, setIsEdit] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

<<<<<<< Updated upstream
  const handleSave = () => {
=======
  // State for confirmation modal
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  // Function to open confirmation modal
  const handleSaveClick = () => {
    setIsConfirmationOpen(true);
  };

  // Function to confirm save after modal confirmation
  const confirmSave = () => {
>>>>>>> Stashed changes
    onSave(formState);
  };

  // Function to open delete confirmation modal
  const handleDeleteClick = () => {
    setIsDeleteConfirmationOpen(true);
  };

  // Function to confirm delete after modal confirmation
  const confirmDelete = () => {
    onDelete(task.id);
    setIsDeleteConfirmationOpen(false);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmationOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 lg:w-2/3 max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-4">
          {!isEdit ? (
            <h3 className="text-xl font-bold">{formState.namaTugas}</h3>
          ) : (
            <h3 className="text-xl font-bold">Edit Task</h3>
          )}
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {isEdit && (
            <div>
              <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Task Name</div>
              <input
                name="namaTugas"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                value={formState.namaTugas}
                onChange={handleChange}
              />
            </div>
          )}
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Deadline</div>
            {!isEdit ? (
              <div>{formatDate(formState.tanggal)}</div>
            ) : (
              <input
                type="date"
                name="tanggal"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                value={formState.tanggal}
                onChange={handleChange}
              />
            )}
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Status</div>
            {!isEdit ? (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeClass(formState.status)}`}>
                {getStatusText(formState.status)}
              </span>
            ) : (
              <select
                name="status"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                value={formState.status}
                onChange={handleChange}
              >
                <option value="not yet">Not Started</option>
                <option value="on progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Notes</div>
          {!isEdit ? (
            <div>{formState.catatan}</div>
          ) : (
            <textarea
              name="catatan"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              rows={4}
              value={formState.catatan}
              onChange={handleChange}
            />
          )}
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Person in Charge</div>
          {!isEdit ? (
            <div>{formState.pic}</div>
          ) : (
            <input
              name="pic"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.pic}
              onChange={handleChange}
            />
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          {isEdit ? (
            <>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded"
                onClick={() => setIsEdit(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={() => setIsEdit(true)}
              >
                Edit
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={() => onDelete(task.id)}
                onClick={handleDeleteClick}
              >
                Delete
              </button>
            </>
          )}
<<<<<<< Updated upstream
=======

          {/* Confirmation Modal for Save */}
          <ConfirmationModal
            isOpen={isConfirmationOpen}
            onConfirm={confirmSave}
            onCancel={cancelSave}
            message="Are you sure you want to save changes to this task?"
          />
          
          {/* Confirmation Modal for Delete */}
          <ConfirmationModal
            isOpen={isDeleteConfirmationOpen}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            message="Are you sure you want to delete this task? This action cannot be undone."
          />
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  );
}

// Task Create Dialog Component
function TaskCreateDialog({ onClose, onSave }) {
  const [formState, setFormState] = useState({
    namaTugas: "",
    catatan: "",
    tanggal: "",
    status: "not yet",
    pic: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formState);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 lg:w-2/3 max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add New Task</h3>
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Task Name</div>
            <input
              name="namaTugas"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter task name"
              value={formState.namaTugas}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Deadline</div>
            <input
              type="date"
              name="tanggal"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.tanggal}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Status</div>
            <select
              name="status"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.status}
              onChange={handleChange}
            >
              <option value="not yet">Not Started</option>
              <option value="on progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Notes</div>
          <textarea
            name="catatan"
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
            placeholder="Enter task details"
            rows={4}
            value={formState.catatan}
            onChange={handleChange}
          />
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Person in Charge</div>
          <input
            name="pic"
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
            placeholder="Enter person or team responsible"
            value={formState.pic}
            onChange={handleChange}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
