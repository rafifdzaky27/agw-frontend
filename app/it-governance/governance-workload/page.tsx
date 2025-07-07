"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";

// Define Task interface
interface Task {
  id: string;
  namaTugas: string;
  catatan: string;
  tanggal: string;
  pic: string;
  status: 'not yet' | 'on progress' | 'done';
  tag: string;
}

export default function GovernanceTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Get API URL from environment variable
  const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";
  const API_BASE_URL = `${BACKEND_IP}/api`;

  // Filter tasks based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(task => 
        task.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.namaTugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.catatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.pic.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTasks(filtered);
    }
  }, [tasks, searchTerm]);

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
        const sortedData = data.sort((a: Task, b: Task) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
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
  const handlePost = useCallback(async (task: Omit<Task, 'id'>) => {
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
      setTasks((prev: Task[]) => [...prev, newTask]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to save data", error);
    }
  }, [API_BASE_URL]);

  // Function to update existing governance task
  const handleSave = useCallback(async (task: Task) => {
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
      setTasks((prev: Task[]) =>
        prev.map((item) => (item.id === task.id ? updatedTask : item))
      );
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to update data", error);
    }
  }, [API_BASE_URL]);

  // Function to delete governance task
  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/governance-tasks/${id}`, { 
        method: "DELETE" 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setTasks((prev: Task[]) => prev.filter((item) => item.id !== id));
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to delete data", error);
    }
  }, [API_BASE_URL]);

  // Function to show governance task details
  const handleShow = useCallback((id: string) => {
    const task = tasks.find((item) => item.id === id);
    setCurrentTask(task || null);
    setShowDialog(true);
  }, [tasks]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dibatalkan jika kartu dilepas di luar kolom
    if (!destination) {
      return;
    }

    const task = filteredTasks.find(t => t.id === draggableId);

    // Jika kartu dipindahkan ke kolom baru, perbarui statusnya
    if (task && destination.droppableId !== source.droppableId) {
      const newStatus = destination.droppableId as Task['status'];
      const updatedTask = { ...task, status: newStatus };

      // Perbarui UI secara optimis
      setTasks(prev =>
        prev.map(t => (t.id === draggableId ? updatedTask : t))
      );

      // Simpan perubahan ke backend
      handleSave(updatedTask);
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  // Get badge color based on status
  const getBadgeClass = (status: Task['status']): string => {
    switch(status) {
      case 'done':
        return 'bg-green-900 text-green-200';
      case 'on progress':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  // Get border color based on status
  const getBorderColor = (status: Task['status']): string => {
    switch(status) {
      case 'done':
        return '#10b981'; // green-500
      case 'on progress':
        return '#f59e0b'; // amber-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Get status display text
  const getStatusText = (status: Task['status']): string => {
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold flex-1 text-center">Governance Tasks</h1>
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

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks by tag, name, notes, or person in charge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg 
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading governance tasks...</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Not Started Column */}
                <Droppable droppableId="not yet">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                    >
                      <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Not Started</h2>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredTasks
                          .filter(task => task.status === 'not yet')
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-md cursor-pointer ${snapshot.isDragging ? 'shadow-2xl' : 'hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-lg'}`}
                                  style={{ ...provided.draggableProps.style, borderLeft: `4px solid ${getBorderColor(task.status)}` }}
                                  onClick={() => handleShow(task.id)}
                                >
                                  <div className="font-semibold mb-2">{task.namaTugas}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.catatan}</div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(task.tanggal)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{task.pic}</div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {filteredTasks.filter(task => task.status === 'not yet').length === 0 && (
                          <div className="text-center py-4 text-gray-500">No tasks</div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
                
                {/* In Progress Column */}
                <Droppable droppableId="on progress">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                    >
                      <h2 className="text-lg font-semibold mb-4 text-yellow-600 dark:text-yellow-300">In Progress</h2>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredTasks
                          .filter(task => task.status === 'on progress')
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-md cursor-pointer ${snapshot.isDragging ? 'shadow-2xl' : 'hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-lg'}`}
                                  style={{ ...provided.draggableProps.style, borderLeft: `4px solid ${getBorderColor(task.status)}` }}
                                  onClick={() => handleShow(task.id)}
                                >
                                  <div className="font-semibold mb-2">{task.namaTugas}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.catatan}</div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(task.tanggal)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{task.pic}</div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {filteredTasks.filter(task => task.status === 'on progress').length === 0 && (
                          <div className="text-center py-4 text-gray-500">No tasks</div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
                
                {/* Done Column */}
                <Droppable droppableId="done">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                    >
                      <h2 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-300">Done</h2>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredTasks
                          .filter(task => task.status === 'done')
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-md cursor-pointer ${snapshot.isDragging ? 'shadow-2xl' : 'hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-lg'}`}
                                  style={{ ...provided.draggableProps.style, borderLeft: `4px solid ${getBorderColor(task.status)}` }}
                                  onClick={() => handleShow(task.id)}
                                >
                                  <div className="font-semibold mb-2">{task.namaTugas}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.catatan}</div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(task.tanggal)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{task.pic}</div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {filteredTasks.filter(task => task.status === 'done').length === 0 && (
                          <div className="text-center py-4 text-gray-500">No tasks</div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            </DragDropContext>
          )}
          
          {showDialog && currentTask && (
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
interface TaskDialogProps {
  task: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
  getBadgeClass: (status: Task['status']) => string;
  getStatusText: (status: Task['status']) => string;
}

function TaskDialog({ task, onClose, onSave, onDelete, formatDate, getBadgeClass, getStatusText }: TaskDialogProps) {
  const [formState, setFormState] = useState({
    id: task.id || "",
    namaTugas: task.namaTugas || "",
    catatan: task.catatan || "",
    tanggal: task.tanggal || "",
    pic: task.pic || "",
    status: task.status || "not yet",
    tag: task.tag || "",
  });

  const [isEdit, setIsEdit] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // State for confirmation modal
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  // Function to open confirmation modal
  const handleSaveClick = () => {
    setIsConfirmationOpen(true);
  };

  // Function to confirm save after modal confirmation
  const confirmSave = () => {
    onSave(formState);
    setIsConfirmationOpen(false);
  };

  const cancelSave = () => {
    setIsConfirmationOpen(false);
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
              <span className={`px-2 py-1 text-sm font-bold rounded-full ${getBadgeClass(formState.status)}`}>
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

          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Tag</div>
            {!isEdit ? (
              <div>
                {formState.tag ? (
                  <span className="inline-block bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md border border-blue-700 dark:border-blue-400 hover:shadow-lg transition-shadow duration-200">
                    {formState.tag}
                  </span>
                ) : (
                  <span className="text-gray-500">No tag</span>
                )}
              </div>
            ) : (
              <input
                name="tag"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                placeholder="Enter tag"
                value={formState.tag}
                onChange={handleChange}
              />
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
                onClick={handleSaveClick}
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
                onClick={handleDeleteClick}
              >
                Delete
              </button>
            </>
          )}

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
        </div>
      </div>
    </div>
  );
}

// Task Create Dialog Component
interface TaskCreateDialogProps {
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'>) => void;
}

function TaskCreateDialog({ onClose, onSave }: TaskCreateDialogProps) {
  const [formState, setFormState] = useState({
    namaTugas: "",
    catatan: "",
    tanggal: "",
    status: "not yet" as const,
    pic: "",
    tag: ""
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // State for confirmation modal
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Function to open confirmation modal
  const handleSaveClick = () => {
    setIsConfirmationOpen(true);
  };

  // Function to confirm save after modal confirmation
  const confirmSave = () => {
    onSave(formState);
    setIsConfirmationOpen(false);
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

          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Tag</div>
            <input
              name="tag"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter tag (e.g., urgent, review, compliance)"
              value={formState.tag}
              onChange={handleChange}
            />
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
            onClick={handleSaveClick}
          >
            Save
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          {/* Confirmation Modal for TaskCreateDialog */}
          <ConfirmationModal
            isOpen={isConfirmationOpen}
            onConfirm={confirmSave}
            onCancel={() => setIsConfirmationOpen(false)}
            message="Are you sure you want to create this task?"
          />
        </div>
      </div>
    </div>
  );
}
