"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { FaSearch, FaPlus, FaFileExcel} from "react-icons/fa";

// Define Task interface with multiple tags support
interface Task {
  id: string;
  namaTugas: string;
  catatan: string;
  tanggal: string;
  pic: string;
  status: 'not yet' | 'on progress' | 'done';
  tag?: string; // Keep for backward compatibility
  tags: string[]; // New multiple tags field
  createdAt?: string;
  updatedAt?: string;
}

// TagInput component props
interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

function TagInput({ tags, onChange, placeholder = "Add tags...", disabled = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
        setInputValue("");
      }
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-2 py-1 rounded-full"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 ml-1"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      )}
    </div>
  );
}

export default function ArchitectureTasks() {
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

  // CSV conversion function
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas, quotes, or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  // Export to Excel function
  const handleExportToExcel = useCallback(async () => {
    try {
      // Transform data for Excel export
      const excelData = tasks.map(task => ({
        'Task ID': task.id,
        'Task Name': task.namaTugas,
        'Notes': task.catatan,
        'Deadline': task.tanggal,
        'Person in Charge': task.pic,
        'Status': task.status,
        'Tags': Array.isArray(task.tags) ? task.tags.join(', ') : '',
        'Created At': task.createdAt,
        'Updated At': task.updatedAt
      }));
      
      const csvContent = convertToCSV(excelData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `it-architecture-tasks-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to export to Excel", error);
      alert("Failed to export to Excel. Please try again.");
    }
  }, [tasks]);

  // Filter tasks based on search term (including tags)
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(task => 
        task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        task.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.namaTugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.catatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.pic.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTasks(filtered);
    }
  }, [tasks, searchTerm]);

  // Fetch data for architecture tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/it-architecture-tasks`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure tags field exists for all tasks
        const processedData = data.map((task: any) => ({
          ...task,
          tags: task.tags || []
        }));
        
        // Sort by deadline
        const sortedData = processedData.sort((a: Task, b: Task) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
        setTasks(sortedData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load IT Architecture data", error);
        console.error("API URL:", `${API_BASE_URL}/it-architecture-tasks`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [API_BASE_URL]);

  // Function to save new architecture task
  const handlePost = useCallback(async (task: Omit<Task, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/it-architecture-tasks`, {
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

  // Function to update existing architecture task
  const handleSave = useCallback(async (task: Task) => {
    try {
      const response = await fetch(`${API_BASE_URL}/it-architecture-tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const updatedTask = await response.json();
      setTasks((prev: Task[]) => prev.map(t => t.id === task.id ? updatedTask : t));
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to update data", error);
    }
  }, [API_BASE_URL]);

  // Function to delete architecture task
  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/it-architecture-tasks/${id}`, { 
        method: "DELETE" 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setTasks((prev: Task[]) => prev.filter(task => task.id !== id));
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to delete data", error);
    }
  }, [API_BASE_URL]);

  // Function to show architecture task details
  const handleShow = (id: string) => {
    const task = tasks.find(task => task.id === id);
    if (task) {
      setCurrentTask(task);
      setShowDialog(true);
    }
  };

  // Drag and drop functionality
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const task = tasks.find(task => task.id === draggableId);
    if (!task) return;

    let newStatus: 'not yet' | 'on progress' | 'done';
    switch (destination.droppableId) {
      case 'not yet':
        newStatus = 'not yet';
        break;
      case 'on progress':
        newStatus = 'on progress';
        break;
      case 'done':
        newStatus = 'done';
        break;
      default:
        return;
    }

    const updatedTask = { ...task, status: newStatus };
    handleSave(updatedTask);
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'not yet': return '#6b7280';
      case 'on progress': return '#f59e0b';
      case 'done': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'not yet':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'on progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not yet': return 'Not Started';
      case 'on progress': return 'In Progress';
      case 'done': return 'Completed';
      default: return status;
    }
  };

  // Task Card Component
  const TaskCard = ({ task, provided, snapshot }: { task: Task, provided: any, snapshot: any }) => (
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
  );
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold flex-1 text-center">IT Architecture Tasks</h1>
          </div>

          {/* Search Bar and Export */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by name, notes, person in charge, or tags..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <FaFileExcel />
              Export to Excel
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <FaPlus />
              Add Task
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Not Started</h2>
                        <span className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 text-sm px-2 py-1 rounded-full">
                          {filteredTasks.filter(task => task.status === 'not yet').length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredTasks
                          .filter(task => task.status === 'not yet')
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <TaskCard task={task} provided={provided} snapshot={snapshot} />
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
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-yellow-600 dark:text-yellow-300">In Progress</h2>
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 text-sm px-2 py-1 rounded-full">
                          {filteredTasks.filter(task => task.status === 'not yet').length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredTasks
                          .filter(task => task.status === 'on progress')
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <TaskCard task={task} provided={provided} snapshot={snapshot} />
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
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-green-600 dark:text-green-300">Done</h2>
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-sm px-2 py-1 rounded-full">
                          {filteredTasks.filter(task => task.status === 'not yet').length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredTasks
                          .filter(task => task.status === 'done')
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <TaskCard task={task} provided={provided} snapshot={snapshot} />
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

          {/* Task Dialog */}
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

          {/* Create Task Dialog */}
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
  getBadgeClass: (status: string) => string;
  getStatusText: (status: string) => string;
}

function TaskDialog({ task, onClose, onSave, onDelete, formatDate, getBadgeClass, getStatusText }: TaskDialogProps) {
  const [formState, setFormState] = useState({
    id: task.id || "",
    namaTugas: task.namaTugas || "",
    catatan: task.catatan || "",
    tanggal: task.tanggal || "",
    pic: task.pic || "",
    status: task.status || "not yet",
    tags: task.tags || []
  });

  const [isEdit, setIsEdit] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagsChange = (newTags: string[]) => {
    setFormState(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  // State for confirmation modal
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  // Function to open confirmation modal
  const confirmSave = () => {
    setIsConfirmationOpen(true);
  };

  // Function to handle confirmed save
  const handleConfirmedSave = () => {
    onSave(formState as Task);
    setIsConfirmationOpen(false);
  };

  // Function to open delete confirmation modal
  const confirmDelete = () => {
    setIsDeleteConfirmationOpen(true);
  };

  // Function to handle confirmed delete
  const handleConfirmedDelete = () => {
    onDelete(task.id);
    setIsDeleteConfirmationOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 lg:w-2/3 max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">IT Architecture Task Details</h3>
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Task Name</label>
            {isEdit ? (
              <input
                type="text"
                name="namaTugas"
                value={formState.namaTugas}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">{task.namaTugas}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            {isEdit ? (
              <textarea
                name="catatan"
                value={formState.catatan}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">{task.catatan}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Deadline</label>
              {isEdit ? (
                <input
                  type="date"
                  name="tanggal"
                  value={formState.tanggal}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">{formatDate(task.tanggal)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Person in Charge</label>
              {isEdit ? (
                <input
                  type="text"
                  name="pic"
                  value={formState.pic}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">{task.pic}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            {isEdit ? (
              <select
                name="status"
                value={formState.status}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="not yet">Not Started</option>
                <option value="on progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            ) : (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(task.status)}`}>
                {getStatusText(task.status)}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            {isEdit ? (
              <TagInput
                tags={formState.tags}
                onChange={handleTagsChange}
                placeholder="Add tags (press Enter or comma to add)..."
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {task.tags && task.tags.length > 0 ? (
                  task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No tags</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          {isEdit ? (
            <>
              <button
                onClick={() => setIsEdit(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setIsEdit(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Edit
              </button>
            </>
          )}
        </div>

        {/* Confirmation Modal for Save */}
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleConfirmedSave}
          title="Confirm Save"
          message="Are you sure you want to save these changes?"
        />

        {/* Confirmation Modal for Delete */}
        <ConfirmationModal
          isOpen={isDeleteConfirmationOpen}
          onClose={() => setIsDeleteConfirmationOpen(false)}
          onConfirm={handleConfirmedDelete}
          title="Confirm Delete"
          message="Are you sure you want to delete this task? This action cannot be undone."
        />
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
    tags: [] as string[]
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormState((prev) => ({ ...prev, tags }));
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
        </div>

        {/* Tags Section */}
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Tags</div>
          <TagInput
            tags={formState.tags}
            onChange={handleTagsChange}
            placeholder="Add tags (press Enter or comma to add)"
          />
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Examples: urgent, review, compliance, security, documentation
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
