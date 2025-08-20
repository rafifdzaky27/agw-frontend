"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { FaSearch, FaPlus, FaFileExcel, FaClipboardList, FaTimes, FaEdit, FaSave, FaTrash } from "react-icons/fa";

// Define Task interface with multiple tags support
interface Task {
  id: string;
  namaTugas: string;
  catatan: string;
  tanggal: string;
  pic: string;
  status: 'not yet' | 'on progress' | 'done';
  tags: string[]; // Changed from 'tag: string' to 'tags: string[]'
}

// Tag Input Component
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
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChange([...tags, trimmedValue]);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags);
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded min-h-[42px] items-center">
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
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      )}
    </div>
  );
}

export default function GovernanceTasks() {
  const {user, token, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  


  // Get API URL from environment variable
  const BACKEND_IP = process.env.NEXT_PUBLIC_WORKLOAD_SERVICE_URL || "http://localhost:5005";
  const API_BASE_URL = `${BACKEND_IP}/api`;

  // Filter tasks based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(task => 
        task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        task.namaTugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.catatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.pic.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTasks(filtered);
    }
  }, [tasks, searchTerm]);

  // Function to export tasks to Excel
  const handleExportToExcel = useCallback(async () => {
    try {
      // Use existing tasks data for export
      const exportData = tasks.map((task, index) => ({
        'No': index + 1,
        'Nama Tugas': task.namaTugas,
        'Catatan': task.catatan,
        'Tanggal': task.tanggal,
        'PIC': task.pic,
        'Status': task.status,
        'Tags': Array.isArray(task.tags) ? task.tags.join(', ') : task.tags || ''
      }));
      
      // Create CSV content
      const csvContent = convertToCSV(exportData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.setAttribute('href', url);
        link.setAttribute('download', `governance-tasks-${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to export tasks", error);
      alert("Failed to export tasks. Please try again.");
    }
  }, [tasks]);

  // Helper function to convert JSON to CSV
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };


  // Fetch data for governance tasks
  useEffect(() => {
    // Skip fetch if auth is still loading
    if (loading) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/governance-tasks`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Convert single tag to tags array for backward compatibility
        const processedData = data.map((task: any) => ({
          ...task,
          namaTugas: (task as any).nama_tugas || task.namaTugas, // Transform snake_case to camelCase
          tags: task.tags || (task.tag ? task.tag.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [])
        }));
        
        // Sort by deadline
        const sortedData = processedData.sort((a: Task, b: Task) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
        setTasks(sortedData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [API_BASE_URL, loading, token]);

  // Function to save new governance task
  const handlePost = useCallback(async (task: Omit<Task, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/governance-tasks`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({
          nama_tugas: (task as any).namaTugas || (task as any).nama_tugas,
          catatan: task.catatan,
          tanggal: task.tanggal,
          pic: task.pic,
          status: task.status,
          tag: Array.isArray((task as any).tags) ? (task as any).tags.join(", ") : (task as any).tag || ""
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const newTask = await response.json();
      // Ensure tags is an array
      const processedTask = {
        ...newTask,
        namaTugas: newTask.nama_tugas || newTask.namaTugas, // Transform snake_case to camelCase
        tags: newTask.tags || (newTask.tag ? newTask.tag.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [])
      };
      setTasks((prev: Task[]) => [...prev, processedTask]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to save data", error);
    }
  }, [API_BASE_URL, token]);

  // Function to update existing governance task
  const handleSave = useCallback(async (task: Task) => {
    try {
      // Check if token exists
      if (!token) {
        alert("Authentication required. Please login again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/governance-tasks/${task.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_tugas: (task as any).namaTugas || (task as any).nama_tugas,
          catatan: task.catatan,
          tanggal: task.tanggal,
          pic: task.pic,
          status: task.status,
          tag: Array.isArray((task as any).tags) ? (task as any).tags.join(", ") : (task as any).tag || ""
        }),
      });
      
      if (response.status === 401) {
        alert("Session expired. Please login again.");
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const updatedTask = await response.json();
      // Ensure tags is an array
      const processedTask = {
        ...updatedTask,
        namaTugas: updatedTask.nama_tugas || updatedTask.namaTugas, // Transform snake_case to camelCase
        tags: updatedTask.tags || (updatedTask.tag ? updatedTask.tag.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [])
      };
      setTasks((prev: Task[]) =>
        prev.map((item) => (item.id === task.id ? processedTask : item))
      );
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to update data", error);
    }
  }, [API_BASE_URL, token]);

  // Function to delete governance task
  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/governance-tasks/${id}`, { 
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setTasks((prev: Task[]) => prev.filter((item) => item.id !== id));
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to delete data", error);
    }
  }, [API_BASE_URL, token]);

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

  // Task Card Component
  const TaskCard = ({ task, provided, snapshot, isDone = false }: { task: Task, provided: any, snapshot: any, isDone?: boolean }) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border ${
        snapshot.isDragging ? 'shadow-2xl border-blue-400' : 'border-gray-200 dark:border-gray-700'
      } h-32 flex flex-col relative`}
      style={{ 
        ...provided.draggableProps.style
      }}
      onClick={() => handleShow(task.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-5 line-clamp-2 flex-1">
          {task.namaTugas}
        </h3>
        {isDone && (
          <span className="px-2 py-1 text-xs font-semibold rounded-full ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex-shrink-0">
            ✓ Complete
          </span>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
          <div className="line-clamp-2 text-xs">
            {task.catatan}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(task.tanggal)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-2">
            {task.pic}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Governance Tasks
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage governance tasks with drag-and-drop board
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredTasks.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Tasks
                </div>
              </div>
            </div>
          {/* Search Bar */}
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
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={handleExportToExcel}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <FaFileExcel className="text-sm" />
                          Export Excel
                        </button>
                        <button
                          onClick={() => setShowCreateDialog(true)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <FaPlus className="text-sm" />
                          Add Task
                        </button>
                      </div>
          {loading ? (
            <div className="flex justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading governance tasks...</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Not Started Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                      Not Started
                    </h2>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm px-2 py-1 rounded-full">
                      {filteredTasks.filter(task => task.status === 'not yet').length}
                    </span>
                  </div>
                  <Droppable droppableId="not yet">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3 min-h-[400px] p-2 rounded-lg"
                      >
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
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <FaClipboardList className="mx-auto text-3xl mb-2 opacity-50" />
                            <p>No tasks yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
                
                {/* In Progress Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                      In Progress
                    </h2>
                    <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm px-2 py-1 rounded-full">
                      {filteredTasks.filter(task => task.status === 'on progress').length}
                    </span>
                  </div>
                  <Droppable droppableId="on progress">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3 min-h-[400px] p-2 rounded-lg"
                      >
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
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <FaClipboardList className="mx-auto text-3xl mb-2 opacity-50" />
                            <p>No tasks yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
                
                {/* Done Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
                      Done
                    </h2>
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm px-2 py-1 rounded-full">
                      {filteredTasks.filter(task => task.status === 'done').length}
                    </span>
                  </div>
                  <Droppable droppableId="done">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3 min-h-[400px] p-2 rounded-lg"
                      >
                        {filteredTasks
                          .filter(task => task.status === 'done')
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <TaskCard task={task} provided={provided} snapshot={snapshot} isDone={true} />
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {filteredTasks.filter(task => task.status === 'done').length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <FaClipboardList className="mx-auto text-3xl mb-2 opacity-50" />
                            <p>No tasks yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>
          )}
          </div>
          
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
  // Convert date to YYYY-MM-DD format for HTML date input
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const [formState, setFormState] = useState({
    id: task.id || "",
    namaTugas: task.namaTugas || "",
    catatan: task.catatan || "",
    tanggal: formatDateForInput(task.tanggal) || "",
    pic: task.pic || "",
    status: task.status || "not yet",
    tags: task.tags || [],
  });

  const [isEdit, setIsEdit] = useState(false);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormState((prev) => ({ ...prev, tags }));
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Task' : 'Task Details'}
            </h2>
            <div className="flex items-center gap-1">
              {isEdit ? (
                <>
                  <button
                    onClick={() => setIsEdit(false)}
                    className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <button
                    onClick={handleSaveClick}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Save changes"
                  >
                    <FaSave className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEdit(true)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit task"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete task"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-hide">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Name</label>
                  {isEdit ? (
                    <input
                      type="text"
                      name="namaTugas"
                      value={formState.namaTugas}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{task.namaTugas}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Person in Charge</label>
                  {isEdit ? (
                    <input
                      type="text"
                      name="pic"
                      value={formState.pic}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{task.pic}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline</label>
                  {isEdit ? (
                    <input
                      type="date"
                      name="tanggal"
                      value={formState.tanggal}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{formatDate(task.tanggal)}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  {isEdit ? (
                    <select
                      name="status"
                      value={formState.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    >
                      <option value="not yet">Not Started</option>
                      <option value="on progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Task Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                {isEdit ? (
                  <textarea
                    name="catatan"
                    value={formState.catatan}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white whitespace-pre-wrap">{task.catatan}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
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
          </div>
        </div>



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

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add New Task
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleSaveClick}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Create task"
              >
                <FaSave className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-hide">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="namaTugas"
                    value={formState.namaTugas}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter task name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Person in Charge <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="pic"
                    value={formState.pic}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter person or team responsible"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="tanggal"
                    value={formState.tanggal}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    required
                  >
                    <option value="not yet">Not Started</option>
                    <option value="on progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Task Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="catatan"
                  value={formState.catatan}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                  placeholder="Enter task details"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                <TagInput
                  tags={formState.tags}
                  onChange={handleTagsChange}
                  placeholder="Add tags (press Enter or comma to add)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Examples: urgent, review, compliance, security, documentation
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Confirmation Modal for TaskCreateDialog */}
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onConfirm={confirmSave}
          onCancel={() => setIsConfirmationOpen(false)}
          message="Are you sure you want to create this task?"
        />
      </div>
    </div>
  );
}
