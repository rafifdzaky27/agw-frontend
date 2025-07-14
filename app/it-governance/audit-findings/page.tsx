"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { FaFileExcel } from "react-icons/fa";

// Define interfaces for type safety
interface AuditFinding {
  id: string;
  kategoriAudit: string;
  namaTemuan: string;
  penyebab: string;
  rekomendasi: string;
  komitmenTindakLanjut: string;
  batasAkhirKomitmen: string;
  pic: string;
  status: 'not yet' | 'on progress' | 'done';
  progressPemenuhan: string;
}

export default function AuditFindings() {
  const { user } = useAuth();
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<AuditFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentFinding, setCurrentFinding] = useState<AuditFinding | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Get API URL from environment variable
  const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";
  const API_BASE_URL = `${BACKEND_IP}/api`;

  // Function to export audit findings to Excel
  const handleExportToExcel = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/findings/export/excel`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const { data, filename } = await response.json();
      
      // Create Excel file using a simple CSV approach
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename.replace('.xlsx', '.csv'));
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to export audit findings", error);
      alert("Failed to export audit findings. Please try again.");
    }
  }, [API_BASE_URL]);

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

  // Fetch data audit findings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/findings`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        // Sort by deadline
        const sortedData = data.sort((a: AuditFinding, b: AuditFinding) => 
          new Date(a.batasAkhirKomitmen).getTime() - new Date(b.batasAkhirKomitmen).getTime()
        );
        setAuditFindings(sortedData);
        setFilteredFindings(sortedData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [API_BASE_URL]);

  // Function to save new audit finding
  const handlePost = useCallback(async (finding: Partial<AuditFinding>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finding),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const newFinding = await response.json();
      setAuditFindings((prev) => {
        const updated = [...prev, newFinding];
        setFilteredFindings(updated.filter(finding => 
          searchTerm === '' ||
          finding.kategoriAudit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          finding.namaTemuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          finding.pic.toLowerCase().includes(searchTerm.toLowerCase())
        ));
        return updated;
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to save data", error);
    }
  }, [API_BASE_URL]);

  // Function to update existing audit finding
  const handleSave = useCallback(async (finding: AuditFinding) => {
    try {
      const response = await fetch(`${API_BASE_URL}/findings/${finding.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finding),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const updatedFinding = await response.json();
      setAuditFindings((prev) => {
        const updated = prev.map((item) => (item.id === finding.id ? updatedFinding : item));
        setFilteredFindings(updated.filter(finding => 
          searchTerm === '' ||
          finding.kategoriAudit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          finding.namaTemuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          finding.pic.toLowerCase().includes(searchTerm.toLowerCase())
        ));
        return updated;
      });
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to update data", error);
    }
  }, [API_BASE_URL]);

  // Function to delete audit finding
  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/findings/${id}`, { 
        method: "DELETE" 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setAuditFindings((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        setFilteredFindings(updated.filter(finding => 
          searchTerm === '' ||
          finding.kategoriAudit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          finding.namaTemuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          finding.pic.toLowerCase().includes(searchTerm.toLowerCase())
        ));
        return updated;
      });
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to delete data", error);
    }
  }, [API_BASE_URL]);

  // Function to show audit finding details
  const handleShow = useCallback((id: string) => {
    const finding = auditFindings.find((item) => item.id === id);
    setCurrentFinding(finding || null);
    setShowDialog(true);
  }, [auditFindings]);

  // Filter findings based on search term
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value === '') {
      setFilteredFindings(auditFindings);
    } else {
      const filtered = auditFindings.filter(finding => 
        finding.kategoriAudit.toLowerCase().includes(value.toLowerCase()) ||
        finding.namaTemuan.toLowerCase().includes(value.toLowerCase()) ||
        finding.pic.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredFindings(filtered);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    const finding = filteredFindings.find(f => f.id === draggableId);

    // If the card is moved to a new column, update its status
    if (finding && destination.droppableId !== source.droppableId) {
      const newStatus = destination.droppableId as AuditFinding['status'];
      const updatedFinding = { ...finding, status: newStatus };

      // Optimistically update the UI
      setAuditFindings(prev => {
        const updated = prev.map(f => (f.id === draggableId ? updatedFinding : f));
        setFilteredFindings(updated.filter(finding => 
          searchTerm === '' ||
          finding.kategoriAudit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          finding.namaTemuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          finding.pic.toLowerCase().includes(searchTerm.toLowerCase())
        ));
        return updated;
      });

      // Save the change to the backend
      handleSave(updatedFinding);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  // Get badge color based on status
  const getBadgeClass = (status: AuditFinding['status']) => {
    switch(status) {
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get status display text
  const getStatusText = (status: AuditFinding['status']) => {
    switch(status) {
      case 'done':
        return 'Done';
      case 'on progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  // Get border color based on status
  const getBorderColor = (status: AuditFinding['status']): string => {
    switch(status) {
      case 'done':
        return '#10b981'; // green-500
      case 'on progress':
        return '#f59e0b'; // amber-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Calculate priority based on deadline
  const calculatePriority = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'overdue';
    } else if (diffDays <= 30) {
      return 'urgent';
    } else if (diffDays <= 60) {
      return 'mediocre';
    } else {
      return 'safe';
    }
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority: string) => {
    switch(priority) {
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'mediocre':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get priority text
  const getPriorityText = (priority: string) => {
    switch(priority) {
      case 'overdue':
        return 'Overdue';
      case 'urgent':
        return 'Urgent';
      case 'mediocre':
        return 'Mediocre';
      case 'safe':
        return 'Safe';
      default:
        return 'Unknown';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Audit Findings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track and manage audit findings with priority-based board
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {auditFindings.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Findings
              </div>
            </div>
          </div>
          
          {/* Search Bar and Add Button */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search findings by category, name, or PIC..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            <button
              onClick={handleExportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <FaFileExcel className="text-sm" />
              Export Excel
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
              onClick={() => setShowCreateDialog(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Finding
            </button>
            </div>
          
          {loading ? (
            <div className="flex justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading audit findings...</p>
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
                        {filteredFindings
                          .filter(finding => finding.status === 'not yet')
                          .map((finding, index) => (
                            <Draggable key={finding.id} draggableId={finding.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-md cursor-pointer ${snapshot.isDragging ? 'shadow-2xl' : 'hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-lg'}`}
                                  style={{ ...provided.draggableProps.style, borderLeft: `4px solid ${getBorderColor(finding.status)}` }}
                                  onClick={() => handleShow(finding.id)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="font-semibold flex-1">{finding.kategoriAudit}</div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getPriorityBadgeClass(calculatePriority(finding.batasAkhirKomitmen))}`}>
                                      {getPriorityText(calculatePriority(finding.batasAkhirKomitmen))}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{finding.namaTemuan}</div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(finding.batasAkhirKomitmen)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{finding.pic}</div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {filteredFindings.filter(finding => finding.status === 'not yet').length === 0 && (
                          <div className="text-center py-4 text-gray-500">No findings</div>
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
                      className="bg-white dark:bg-gray-800 rounded-lg p-4"
                    >
                      <h2 className="text-lg font-semibold mb-4 text-yellow-600 dark:text-yellow-300">In Progress</h2>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredFindings
                          .filter(finding => finding.status === 'on progress')
                          .map((finding, index) => (
                            <Draggable key={finding.id} draggableId={finding.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-md cursor-pointer ${snapshot.isDragging ? 'shadow-2xl' : 'hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-lg'}`}
                                  style={{ ...provided.draggableProps.style, borderLeft: `4px solid ${getBorderColor(finding.status)}` }}
                                  onClick={() => handleShow(finding.id)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="font-semibold flex-1">{finding.kategoriAudit}</div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getPriorityBadgeClass(calculatePriority(finding.batasAkhirKomitmen))}`}>
                                      {getPriorityText(calculatePriority(finding.batasAkhirKomitmen))}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{finding.namaTemuan}</div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(finding.batasAkhirKomitmen)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{finding.pic}</div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {filteredFindings.filter(finding => finding.status === 'on progress').length === 0 && (
                          <div className="text-center py-4 text-gray-500">No findings</div>
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
                      className={`bg-white dark:bg-gray-800 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-green-100 dark:bg-green-900/50' : ''}`}
                    >
                      <h2 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-300">Done</h2>
                      <div className="space-y-3 min-h-[32rem]">
                        {filteredFindings
                          .filter(finding => finding.status === 'done')
                          .map((finding, index) => (
                            <Draggable key={finding.id} draggableId={finding.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-md cursor-pointer ${snapshot.isDragging ? 'shadow-2xl' : 'hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-lg'}`}
                                  style={{ ...provided.draggableProps.style, borderLeft: `4px solid ${getBorderColor(finding.status)}` }}
                                  onClick={() => handleShow(finding.id)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="font-semibold flex-1">{finding.kategoriAudit}</div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getPriorityBadgeClass(calculatePriority(finding.batasAkhirKomitmen))}`}>
                                      {getPriorityText(calculatePriority(finding.batasAkhirKomitmen))}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{finding.namaTemuan}</div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(finding.batasAkhirKomitmen)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{finding.pic}</div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {filteredFindings.filter(finding => finding.status === 'done').length === 0 && (
                          <div className="text-center py-4 text-gray-500">No findings</div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            </DragDropContext>
          )}
          
          {!loading && auditFindings.length === 0 && (
            <div className="text-center bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg mt-8">
              <p className="text-gray-500 dark:text-gray-400">No audit findings available.</p>
            </div>
          )}
          
          {showDialog && (
            <FindingDialog
              finding={currentFinding}
              onClose={() => setShowDialog(false)}
              onSave={handleSave}
              onDelete={handleDelete}
              formatDate={formatDate}
              getBadgeClass={getBadgeClass}
              getStatusText={getStatusText}
            />
          )}

          {showCreateDialog && (
            <FindingCreateDialog
              onClose={() => setShowCreateDialog(false)}
              onSave={handlePost}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Define props interface for FindingDialog
interface FindingDialogProps {
  finding: AuditFinding | null;
  onClose: () => void;
  onSave: (finding: AuditFinding) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
  getBadgeClass: (status: AuditFinding['status']) => string;
  getStatusText: (status: AuditFinding['status']) => string;
}

// Finding Dialog Component
function FindingDialog({ finding, onClose, onSave, onDelete, formatDate, getBadgeClass, getStatusText }: FindingDialogProps) {
  const [formState, setFormState] = useState<AuditFinding>({
    id: finding?.id || "",
    kategoriAudit: finding?.kategoriAudit || "",
    namaTemuan: finding?.namaTemuan || "",
    penyebab: finding?.penyebab || "",
    rekomendasi: finding?.rekomendasi || "",
    komitmenTindakLanjut: finding?.komitmenTindakLanjut || "",
    batasAkhirKomitmen: finding?.batasAkhirKomitmen || "",
    pic: finding?.pic || "",
    status: finding?.status || "not yet",
    progressPemenuhan: finding?.progressPemenuhan || "",
  });

  const [isEdit, setIsEdit] = useState(false);

  // State for confirmation modal
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Priority functions for dialog
  const calculatePriority = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'overdue';
    } else if (diffDays <= 30) {
      return 'urgent';
    } else if (diffDays <= 60) {
      return 'mediocre';
    } else {
      return 'safe';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch(priority) {
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'mediocre':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityText = (priority: string) => {
    switch(priority) {
      case 'overdue':
        return 'Overdue';
      case 'urgent':
        return 'Urgent';
      case 'mediocre':
        return 'Mediocre';
      case 'safe':
        return 'Safe';
      default:
        return 'Unknown';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

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
    if (finding) {
      onDelete(finding.id);
    }
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
            <h3 className="text-xl font-bold">{formState.kategoriAudit}</h3>
          ) : (
            <h3 className="text-xl font-bold">Edit Audit Finding</h3>
          )}
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Finding Name</div>
            {!isEdit ? (
              <div>{formState.namaTemuan}</div>
            ) : (
              <input
                name="namaTemuan"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                value={formState.namaTemuan}
                onChange={handleChange}
              />
            )}
          </div>
          
          {isEdit && (
            <div>
              <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Audit Category</div>
              <input
                name="kategoriAudit"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                value={formState.kategoriAudit}
                onChange={handleChange}
              />
            </div>
          )}
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Deadline</div>
            {!isEdit ? (
              <div>{formatDate(formState.batasAkhirKomitmen)}</div>
            ) : (
              <input
                type="date"
                name="batasAkhirKomitmen"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                value={formState.batasAkhirKomitmen}
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
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Priority</div>
            <span className={`px-5 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeClass(calculatePriority(formState.batasAkhirKomitmen))}`}>
              {getPriorityText(calculatePriority(formState.batasAkhirKomitmen))}
            </span>
          </div>
        </div>
        
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Root Cause</div>
            {!isEdit ? (
              <div>{formState.penyebab}</div>
            ) : (
              <textarea
                name="penyebab"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                rows={4}
                value={formState.penyebab}
                onChange={handleChange}
              />
            )}
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Recommendation</div>
            {!isEdit ? (
              <div>{formState.rekomendasi}</div>
            ) : (
              <textarea
                name="rekomendasi"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                rows={4}
                value={formState.rekomendasi}
                onChange={handleChange}
              />
            )}
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Action Plan</div>
            {!isEdit ? (
              <div>{formState.komitmenTindakLanjut}</div>
            ) : (
              <textarea
                name="komitmenTindakLanjut"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                rows={4}
                value={formState.komitmenTindakLanjut}
                onChange={handleChange}
              />
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Progress Pemenuhan</div>
            {!isEdit ? (
              <div>{formState.progressPemenuhan}</div>
            ) : (
              <textarea
                name="progressPemenuhan"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                rows={3}
                value={formState.progressPemenuhan}
                onChange={handleChange}
                placeholder="Describe fulfillment progress..."
              />
            )}
          </div>
          
          <div>
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

          {/* Confirmation Modal for FindingDialog */}
          <ConfirmationModal
            isOpen={isConfirmationOpen}
            onConfirm={confirmSave}
            onCancel={cancelSave}
            message="Are you sure you want to save changes to this audit finding?"
          />
           
          {/* Confirmation Modal for Delete */}
          <ConfirmationModal
            isOpen={isDeleteConfirmationOpen}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            message="Are you sure you want to delete this audit finding? This action cannot be undone."
          />
        </div>
      </div>
    </div>
  );
}

// Define props interface for FindingCreateDialog
interface FindingCreateDialogProps {
  onClose: () => void; 
  onSave: (finding: Partial<AuditFinding>) => void;
}

// Finding Create Dialog Component
function FindingCreateDialog({ onClose, onSave }: FindingCreateDialogProps) {
  const [formState, setFormState] = useState<Partial<AuditFinding>>({
    kategoriAudit: "",
    namaTemuan: "",
    penyebab: "",
    rekomendasi: "",
    komitmenTindakLanjut: "",
    batasAkhirKomitmen: "",
    status: "not yet" as const,
    pic: "",
    progressPemenuhan: ""
  });

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          <h3 className="text-xl font-bold">Add New Audit Finding</h3>
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Finding Name</div>
            <input
              name="namaTemuan"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter finding name"
              value={formState.namaTemuan}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Audit Category</div>
            <input
              name="kategoriAudit"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter category"
              value={formState.kategoriAudit}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Deadline</div>
            <input
              type="date"
              name="batasAkhirKomitmen"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.batasAkhirKomitmen}
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Root Cause</div>
            <textarea
              name="penyebab"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Describe the root cause"
              rows={4}
              value={formState.penyebab}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Recommendation</div>
            <textarea
              name="rekomendasi"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter recommendations"
              rows={4}
              value={formState.rekomendasi}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Action Plan</div>
            <textarea
              name="komitmenTindakLanjut"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Describe the action plan"
              rows={4}
              value={formState.komitmenTindakLanjut}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Progress Pemenuhan</div>
            <textarea
              name="progressPemenuhan"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              rows={3}
              placeholder="Describe fulfillment progress..."
              value={formState.progressPemenuhan}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Person in Charge</div>
            <input
              name="pic"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter person or team responsible"
              value={formState.pic}
              onChange={handleChange}
            />
          </div>
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
          {/* Confirmation Modal for FindingCreateDialog */}
          <ConfirmationModal
            isOpen={isConfirmationOpen}
            onConfirm={confirmSave}
            onCancel={() => setIsConfirmationOpen(false)}
            message="Are you sure you want to create this audit finding?"
          />
        </div>
      </div>
    </div>
  );
}
