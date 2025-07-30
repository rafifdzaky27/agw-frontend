"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot
} from '@hello-pangea/dnd';
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
  tags: string[];
}

// API Response types
interface ApiTask {
  id: number | string;
  nama_tugas?: string;
  namaTugas?: string;
  catatan: string;
  tanggal: string;
  pic: string;
  status: 'not yet' | 'on progress' | 'done';
  tag?: string;
  tags?: string[];
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

// CSV Export data type
interface ExportData {
  'No': number;
  'Nama Tugas': string;
  'Catatan': string;
  'Tanggal': string;
  'PIC': string;
  'Status': string;
  'Tags': string;
}

// Tag Input Component Props
interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Task Dialog Props
interface TaskDialogProps {
  task: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
  getBadgeClass: (status: Task['status']) => string;
  getStatusText: (status: Task['status']) => string;
}

// Task Create Dialog Props
interface TaskCreateDialogProps {
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'>) => void;
}

// Task Card Props - Using proper DnD types
interface TaskCardProps {
  task: Task;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

// Error type guard functions
function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string';
}

function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

// Tag Input Component
function TagInput({ tags, onChange, placeholder = "Add tags...", disabled = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = (): void => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChange([...tags, trimmedValue]);
      setInputValue("");
    }
  };

  const removeTag = (index: number): void => {
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
export default function ArchitectureTasks() {
  const { token, loading: authLoading } = useAuth(); // Removed unused 'user' variable
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get API URL from environment variable
  const BACKEND_IP = process.env.NEXT_PUBLIC_WORKLOAD_SERVICE_URL || "http://localhost:5005";
  const API_BASE_URL = `${BACKEND_IP}/api`;

  // Test backend connection
  const testBackendConnection = useCallback(async (): Promise<void> => {
    try {
      console.log("🔍 Testing backend connection...");
      console.log("🔍 Backend URL:", BACKEND_IP);
      console.log("🔍 API Base URL:", API_BASE_URL);
      
      const response = await fetch(`${BACKEND_IP}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      console.log("🔍 Health check response status:", response.status);
      
      if (response.ok) {
        const healthData: HealthCheckResponse = await response.json();
        console.log("✅ Backend is healthy:", healthData);
      } else {
        console.error("❌ Backend health check failed:", response.status);
      }
    } catch (error) {
      console.error("❌ Backend connection test failed:", getErrorMessage(error));
    }
  }, [BACKEND_IP, API_BASE_URL]);

  // Test backend connection on component mount
  useEffect(() => {
    testBackendConnection();
  }, [testBackendConnection]);

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

  // Helper function to convert JSON to CSV
  const convertToCSV = (data: ExportData[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]) as (keyof ExportData)[];
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

  // Function to export tasks to Excel
  const handleExportToExcel = useCallback(async (): Promise<void> => {
    try {
      // Use existing tasks data for export
      const exportData: ExportData[] = tasks.map((task, index) => ({
        'No': index + 1,
        'Nama Tugas': task.namaTugas,
        'Catatan': task.catatan,
        'Tanggal': task.tanggal,
        'PIC': task.pic,
        'Status': task.status,
        'Tags': Array.isArray(task.tags) ? task.tags.join(', ') : ''
      }));
      
      // Create CSV content
      const csvContent = convertToCSV(exportData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.setAttribute('href', url);
        link.setAttribute('download', `it-architecture-tasks-${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to export tasks", getErrorMessage(error));
      alert("Failed to export tasks. Please try again.");
    }
  }, [tasks]);

  // Process API task data to frontend Task format
  const processApiTask = useCallback((apiTask: ApiTask): Task => {
    let finalTags: string[] = [];
    
    if (apiTask.tags && Array.isArray(apiTask.tags)) {
      finalTags = apiTask.tags;
    } else if (apiTask.tag && typeof apiTask.tag === 'string' && apiTask.tag.trim() !== '') {
      finalTags = apiTask.tag.split(', ').map(t => t.trim()).filter(Boolean);
    }
    
    return {
      id: String(apiTask.id),
      namaTugas: apiTask.nama_tugas || apiTask.namaTugas || '',
      catatan: apiTask.catatan || '',
      tanggal: apiTask.tanggal || '',
      pic: apiTask.pic || '',
      status: apiTask.status || 'not yet',
      tags: finalTags
    };
  }, []);
  // Fetch data for architecture tasks
  useEffect(() => {
    // Skip fetch if auth is still loading
    if (authLoading || !token) return;
    
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/it-architecture-tasks`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data: ApiTask[] = await response.json();
        console.log("✅ Raw API response:", data);
        
        // Process and convert API data to frontend format
        const processedData = data.map(processApiTask);
        console.log("✅ Processed data:", processedData);
        
        // Sort by deadline
        const sortedData = processedData.sort((a: Task, b: Task) => 
          new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
        );
        
        setTasks(sortedData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data", getErrorMessage(error));
        setLoading(false);
        alert(`Failed to load tasks: ${getErrorMessage(error)}`);
      }
    };
    
    fetchData();
  }, [API_BASE_URL, authLoading, token, processApiTask]);

  // Function to save new architecture task
  const handlePost = useCallback(async (task: Omit<Task, 'id'>): Promise<void> => {
    console.log("🔄 Starting task creation...");
    console.log("📊 Task data:", task);
    
    if (!token) {
      console.error("❌ No authentication token available");
      alert("Authentication required. Please login again.");
      return;
    }

    if (!task.namaTugas || !task.tanggal) {
      console.error("❌ Missing required fields");
      alert("Task name and deadline are required.");
      return;
    }

    if (authLoading) {
      console.log("⏳ Still loading, skipping request");
      return;
    }

    try {
      // Ensure date is in correct format (YYYY-MM-DD)
      let formattedDate = task.tanggal;
      if (task.tanggal && !task.tanggal.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(task.tanggal);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }
        formattedDate = date.toISOString().split('T')[0];
      }

      const payload = {
        nama_tugas: task.namaTugas.trim(),
        catatan: (task.catatan || "").trim(),
        tanggal: formattedDate,
        pic: (task.pic || "").trim(),
        status: task.status || "not yet",
        tag: Array.isArray(task.tags) ? task.tags.join(", ") : ""
      };

      console.log("📤 IT Architecture - Final payload being sent:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_BASE_URL}/it-architecture-tasks`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      console.log("📥 Response status:", response.status);
      
      if (response.status === 401) {
        alert("Authentication failed. Please login again.");
        return;
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          console.error("❌ Raw server error response:", errorText);
          
          try {
            const errorDetails: ApiErrorResponse = JSON.parse(errorText);
            if (errorDetails.error) {
              errorMessage = errorDetails.error;
            } else if (errorDetails.message) {
              errorMessage = errorDetails.message;
            }
          } catch {
            // If not JSON, use the text as is
            if (errorText) {
              errorMessage = errorText;
            }
          }
        } catch {
          // If can't read response, use default message
          errorMessage = 'Unable to read error response';
        }
        
        console.error("❌ Final error message:", errorMessage);
        throw new Error(errorMessage);
      }
      
      const responseText = await response.text();
      console.log("✅ IT Architecture - Raw response:", responseText);
      
      let newTask: ApiTask;
      try {
        newTask = JSON.parse(responseText);
        console.log("✅ IT Architecture - Parsed task:", newTask);
      } catch {
        throw new Error("Invalid response format from server");
      }
      
      // Process the new task
      const processedTask = processApiTask(newTask);
      console.log("✅ Processed task:", processedTask);
      
      setTasks((prev: Task[]) => [...prev, processedTask]);
      setShowCreateDialog(false);
      
    } catch (error) {
      console.error("❌ Complete error object:", error);
      alert(`Failed to create task: ${getErrorMessage(error)}`);
    }
  }, [API_BASE_URL, token, authLoading, processApiTask]);

  // Function to update existing architecture task
  const handleSave = useCallback(async (task: Task): Promise<void> => {
    console.log('🔄 Starting task update...');
    console.log('📊 Task data:', task);
    
    if (!token) {
      console.error('❌ No authentication token available');
      alert('Authentication required. Please login again.');
      return;
    }

    if (!task.id) {
      console.error('❌ Missing task ID');
      alert('Task ID is required for update.');
      return;
    }

    if (!task.namaTugas || !task.tanggal) {
      console.error('❌ Missing required fields');
      alert('Task name and deadline are required.');
      return;
    }

    if (authLoading) {
      console.log('⏳ Still loading, skipping request');
      return;
    }

    try {
      // Ensure date is in correct format (YYYY-MM-DD)
      let formattedDate = task.tanggal;
      if (task.tanggal && !task.tanggal.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(task.tanggal);
        formattedDate = date.toISOString().split('T')[0];
      }

      const payload = {
        nama_tugas: task.namaTugas.trim(),
        catatan: (task.catatan || "").trim(),
        tanggal: formattedDate,
        pic: (task.pic || "").trim(),
        status: task.status || "not yet",
        tag: Array.isArray(task.tags) ? task.tags.join(", ") : ""
      };

      console.log('📤 IT Architecture UPDATE - Payload being sent:', payload);

      const response = await fetch(`${API_BASE_URL}/it-architecture-tasks/${task.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      console.log('📥 Response status:', response.status);
      
      if (response.status === 401) {
        alert('Authentication failed. Please login again.');
        return;
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        
        try {
          const errorText = await response.text();
          console.error('❌ Server error response:', errorText);
          
          try {
            const errorJson: ApiErrorResponse = JSON.parse(errorText);
            if (errorJson.error) {
              errorMessage = errorJson.error;
            } else if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch {
            // If not JSON, use the text as is
            if (errorText) {
              errorMessage = errorText;
            }
          }
        } catch {
          // If can't read response, use default message
        }
        
        throw new Error(errorMessage);
      }
      
      const updatedTask: ApiTask = await response.json();
      console.log('✅ Task updated successfully:', updatedTask);
      
      const processedTask = processApiTask(updatedTask);
      
      setTasks((prev: Task[]) =>
        prev.map((item) => (String(item.id) === String(task.id) ? processedTask : item))
      );
      setShowDialog(false);
      
    } catch (error) {
      console.error("❌ Failed to update task:", getErrorMessage(error));
      alert(`Failed to save task: ${getErrorMessage(error)}`);
    }
  }, [API_BASE_URL, token, authLoading, processApiTask]);

  // Function to delete architecture task
  const handleDelete = useCallback(async (id: string): Promise<void> => {
    console.log("🔄 Starting task deletion...");
    console.log("📊 Task ID:", id);
    
    if (!token) {
      console.error("❌ No authentication token available");
      alert("Authentication required. Please login again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/it-architecture-tasks/${id}`, { 
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      console.log("📥 Delete response status:", response.status);
      
      if (response.status === 401) {
        alert("Authentication failed. Please login again.");
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error:", errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      console.log("✅ Task deleted successfully");
      
      setTasks((prev: Task[]) => prev.filter((item) => item.id !== id));
      setShowDialog(false);
      
      alert("Task deleted successfully!");
      
    } catch (error) {
      console.error("❌ Failed to delete task:", getErrorMessage(error));
      alert(`Failed to delete task: ${getErrorMessage(error)}`);
    }
  }, [API_BASE_URL, token]);

  // Function to show architecture task details
  const handleShow = useCallback((id: string): void => {
    const task = tasks.find((item) => item.id === id);
    setCurrentTask(task || null);
    setShowDialog(true);
  }, [tasks]);

  const onDragEnd = useCallback((result: DropResult): void => {
    const { source, destination, draggableId } = result;

    // Cancelled if card is dropped outside column
    if (!destination) {
      return;
    }

    const task = filteredTasks.find(t => t.id === draggableId);

    // If card is moved to new column, update its status
    if (task && destination.droppableId !== source.droppableId) {
      const newStatus = destination.droppableId as Task['status'];
      const updatedTask = { ...task, status: newStatus };

      // Update UI optimistically
      setTasks(prev =>
        prev.map(t => (t.id === draggableId ? updatedTask : t))
      );
      
      // Save changes to backend
      handleSave(updatedTask);
    }
  }, [filteredTasks, handleSave]);
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

  // Task Card Component - Using proper DnD types
  const TaskCard = ({ task, provided, snapshot }: TaskCardProps) => (
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                IT Architecture Tasks
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage IT architecture tasks with drag-and-drop board
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {tasks.length}
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <p className="text-gray-500 dark:text-gray-400">Loading architecture tasks...</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Not Started Column */}
                <Droppable droppableId="not yet">
                  {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
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
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
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
                  {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-yellow-600 dark:text-yellow-300">In Progress</h2>
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 text-sm px-2 py-1 rounded-full">
                          {filteredTasks.filter(task => task.status === 'on progress').length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredTasks
                          .filter(task => task.status === 'on progress')
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
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
                  {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-green-600 dark:text-green-300">Done</h2>
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-sm px-2 py-1 rounded-full">
                          {filteredTasks.filter(task => task.status === 'done').length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredTasks
                          .filter(task => task.status === 'done')
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
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
function TaskDialog({ task, onClose, onSave, onDelete, formatDate, getBadgeClass, getStatusText }: TaskDialogProps) {
  const [formState, setFormState] = useState<Task>({
    id: task.id || "",
    namaTugas: task.namaTugas || "",
    catatan: task.catatan || "",
    tanggal: task.tanggal || "",
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (tags: string[]): void => {
    setFormState((prev) => ({ ...prev, tags }));
  };

  // State for confirmation modal
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  // Function to open confirmation modal
  const handleSaveClick = (): void => {
    setIsConfirmationOpen(true);
  };

  // Function to confirm save after modal confirmation
  const confirmSave = (): void => {
    onSave(formState);
    setIsConfirmationOpen(false);
  };

  const cancelSave = (): void => {
    setIsConfirmationOpen(false);
  };

  // Function to open delete confirmation modal
  const handleDeleteClick = (): void => {
    setIsDeleteConfirmationOpen(true);
  };

  // Function to confirm delete after modal confirmation
  const confirmDelete = (): void => {
    onDelete(task.id);
    setIsDeleteConfirmationOpen(false);
  };

  const cancelDelete = (): void => {
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
                <option value="done">Done</option>
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
                onClick={handleSaveClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDeleteClick}
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

          {/* Confirmation Modal for Save */}
          <ConfirmationModal
            isOpen={isConfirmationOpen}
            onConfirm={confirmSave}
            onCancel={cancelSave}
            title="Confirm Save"
            message="Are you sure you want to save changes to this task?"
          />

          {/* Confirmation Modal for Delete */}
          <ConfirmationModal
            isOpen={isDeleteConfirmationOpen}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            title="Confirm Delete"
            message="Are you sure you want to delete this task? This action cannot be undone."
          />
        </div>
      </div>
    </div>
  );
}

// Task Create Dialog Component
function TaskCreateDialog({ onClose, onSave }: TaskCreateDialogProps) {
  const [formState, setFormState] = useState<Omit<Task, 'id'>>({
    namaTugas: "",
    catatan: "",
    tanggal: "",
    status: "not yet" as const,
    pic: "",
    tags: []
  });

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (tags: string[]): void => {
    setFormState((prev) => ({ ...prev, tags }));
  };

  // State for confirmation modal
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Function to open confirmation modal
  const handleSaveClick = (): void => {
    setIsConfirmationOpen(true);
  };

  // Function to confirm save after modal confirmation
  const confirmSave = (): void => {
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
            Examples: design, infrastructure, security, cloud, integration
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
            title="Confirm Create"
            message="Are you sure you want to create this task?"
          />
        </div>
      </div>
    </div>
  );
}
