"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { FaFileExcel, FaPlus,FaTrash, FaTimes, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";
import { auditFindingsApiService, AuditFinding } from "@/utils/auditFindingsApi";

export default function AuditFindings() {
  const { user, token, loading: authLoading } = useAuth();
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<AuditFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentFinding, setCurrentFinding] = useState<AuditFinding | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [findingToDelete, setFindingToDelete] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    root_cause: '',
    recommendation: '',
    commitment: '',
    commitment_date: '',
    person_in_charge: '',
    status: 'not started' as AuditFinding['status'],
    progress_pemenuhan: 'Not started'
  });

  // Status mapping for drag and drop (frontend droppableId to backend status)
  const mapStatusToBackend = (droppableId: string): AuditFinding['status'] => {
    switch (droppableId) {
      case 'not yet':
        return 'not started';
      case 'on progress':
        return 'in progress';
      case 'done':
        return 'done';
      default:
        return 'not started';
    }
  };

  // Export to Excel function
  const handleExportToExcel = useCallback(async () => {
    try {
      setIsExporting(true);
      await auditFindingsApiService.exportToExcel(auditFindings);
      toast.success("Audit findings exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export audit findings");
    } finally {
      setIsExporting(false);
    }
  }, [auditFindings]);

  // Fetch all audit findings
  const fetchAuditFindings = useCallback(async () => {
    if (!token) return;
    
    try {
      setError(null);
      const response = await auditFindingsApiService.getAllFindings(token);
      
      if (response.success && response.data) {
        setAuditFindings(response.data);
        setFilteredFindings(response.data);
      } else {
        setError(response.error || 'Failed to fetch audit findings');
        toast.error(response.error || 'Failed to fetch audit findings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit findings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create new finding
  const handleCreate = useCallback(async () => {
    if (!token) return;

    try {
      const findingData = {
        name: formData.name,
        category: formData.category,
        root_cause: formData.root_cause,
        recommendation: formData.recommendation,
        commitment: formData.commitment,
        commitment_date: formData.commitment_date,
        person_in_charge: formData.person_in_charge,
        status: formData.status,
        progress_pemenuhan: formData.progress_pemenuhan
      };

      const response = await auditFindingsApiService.createFinding(findingData, token);
      
      if (response.success && response.data) {
        setAuditFindings(prev => [...prev, response.data!]);
        setFilteredFindings(prev => [...prev, response.data!]);
        setShowCreateDialog(false);
        resetForm();
        toast.success("Audit finding created successfully!");
      } else {
        toast.error(response.error || 'Failed to create audit finding');
      }
    } catch (error) {
      console.error('Error creating finding:', error);
      toast.error('Failed to create audit finding');
    }
  }, [formData, token]);

  // Update existing finding
  const handleSave = useCallback(async (finding: AuditFinding) => {
    if (!token) return;

    try {
      const findingData = {
        name: finding.name,
        category: finding.category,
        root_cause: finding.root_cause,
        recommendation: finding.recommendation,
        commitment: finding.commitment,
        commitment_date: finding.commitment_date,
        person_in_charge: finding.person_in_charge,
        status: finding.status,
        progress_pemenuhan: finding.progress_pemenuhan
      };

      const response = await auditFindingsApiService.updateFinding(finding.id, findingData, token);
      
      if (response.success && response.data) {
        setAuditFindings(prev => prev.map(f => f.id === finding.id ? response.data! : f));
        setFilteredFindings(prev => prev.map(f => f.id === finding.id ? response.data! : f));
        toast.success("Audit finding updated successfully!");
      } else {
        toast.error(response.error || 'Failed to update audit finding');
        // Revert optimistic update if it failed
        fetchAuditFindings();
      }
    } catch (error) {
      console.error('Error updating finding:', error);
      toast.error('Failed to update audit finding');
      fetchAuditFindings();
    }
  }, [token, fetchAuditFindings]);

  // Delete finding
  const handleDelete = useCallback(async (id: string) => {
    if (!token) return;

    try {
      const response = await auditFindingsApiService.deleteFinding(id, token);
      
      if (response.success) {
        setAuditFindings(prev => prev.filter(f => f.id !== id));
        setFilteredFindings(prev => prev.filter(f => f.id !== id));
        toast.success("Audit finding deleted successfully!");
        
        // Close detail modal if the deleted item is currently being viewed
        if (currentFinding && currentFinding.id === id) {
          setShowDialog(false);
          setCurrentFinding(null);
        }
      } else {
        toast.error(response.error || 'Failed to delete audit finding');
      }
    } catch (error) {
      console.error('Error deleting finding:', error);
      toast.error('Failed to delete audit finding');
    } finally {
      setShowDeleteConfirm(false);
      setFindingToDelete(null);
    }
  }, [token, currentFinding]);

  // Show finding details
  const handleShow = useCallback((id: string | number) => {
    const finding = auditFindings.find((item) => item.id.toString() === id.toString());
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
        finding.category.toLowerCase().includes(value.toLowerCase()) ||
        finding.name.toLowerCase().includes(value.toLowerCase()) ||
        finding.person_in_charge.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredFindings(filtered);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      root_cause: '',
      recommendation: '',
      commitment: '',
      commitment_date: '',
      person_in_charge: '',
      status: 'not started',
      progress_pemenuhan: 'Not started'
    });
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Drag and drop handler
  const onDragEnd = (result: DropResult) => {
    console.log('🔄 Drag ended:', result);
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      console.log('❌ Dropped outside list');
      return;
    }

    console.log('📍 Source:', source.droppableId, 'Destination:', destination.droppableId);

    const finding = filteredFindings.find(f => f.id.toString() === draggableId);
    console.log('🔍 Found finding:', finding);

    // If the card is moved to a new column, update its status
    if (finding && destination.droppableId !== source.droppableId) {
      const newStatus = mapStatusToBackend(destination.droppableId);
      console.log('🔄 Updating status from', finding.status, 'to', newStatus);
      
      const updatedFinding = { ...finding, status: newStatus };

      // Optimistically update the UI
      setAuditFindings(prev => 
        prev.map(f => (f.id.toString() === draggableId ? updatedFinding : f))
      );
      
      // Also update filtered findings
      setFilteredFindings(prev => 
        prev.map(f => (f.id.toString() === draggableId ? updatedFinding : f))
      );

      // Save the change to the backend
      console.log('💾 Saving to backend...');
      handleSave(updatedFinding);
    } else {
      console.log('ℹ️ No status change needed');
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

  // Calculate priority based on commitment date
  const calculatePriority = (commitmentDate: string): 'high' | 'medium' | 'low' => {
    const today = new Date();
    const deadline = new Date(commitmentDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'high'; // Overdue
    if (diffDays <= 7) return 'high'; // Due within a week
    if (diffDays <= 30) return 'medium'; // Due within a month
    return 'low'; // Due later
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority: 'high' | 'medium' | 'low') => {
    switch(priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  // Get priority text
  const getPriorityText = (priority: 'high' | 'medium' | 'low') => {
    switch(priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      default:
        return 'Low';
    }
  };

  // Get badge color based on status
  const getBadgeClass = (status: AuditFinding['status']) => {
    switch(status) {
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in progress':
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
      case 'in progress':
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
      case 'in progress':
        return '#f59e0b'; // amber-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Effects
  useEffect(() => {
    if (!authLoading && token) {
      fetchAuditFindings();
    }
  }, [authLoading, token, fetchAuditFindings]);

  // Handle delete confirmation
  const confirmDelete = (id: string) => {
    setFindingToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (findingToDelete) {
      handleDelete(findingToDelete);
    }
  };

  const cancelDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setFindingToDelete(null);
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <ProtectedRoute allowedRoles={["it_governance", "master"]}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto w-full">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Audit Findings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
                  Track and manage audit findings with drag-and-drop status updates
                </p>
              </div>

              {/* Controls */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 max-w-md w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search findings..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleExportToExcel}
                    disabled={isExporting || auditFindings.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm lg:text-base flex-1 sm:flex-none justify-center"
                  >
                    <FaFileExcel className="w-4 h-4" />
                    <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export Excel'}</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                  
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm lg:text-base flex-1 sm:flex-none justify-center"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <FaPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Finding</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="flex justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Loading audit findings...</p>
                </div>
              ) : (
                /* Kanban Board */
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Not Started Column */}
                    <Droppable droppableId="not yet">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/50' : ''
                          }`}
                        >
                          <h2 className="text-base lg:text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                            Not Started ({filteredFindings.filter(f => f.status === 'not started').length})
                          </h2>
                          <div className="space-y-3 min-h-[20rem] lg:min-h-[32rem]">
                            {filteredFindings
                              .filter(finding => finding.status === 'not started')
                              .map((finding, index) => (
                                <Draggable key={finding.id} draggableId={finding.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-md cursor-pointer ${
                                        snapshot.isDragging ? 'shadow-2xl' : 'hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-lg'
                                      }`}
                                      style={{ 
                                        ...provided.draggableProps.style, 
                                        borderLeft: `4px solid ${getBorderColor(finding.status)}` 
                                      }}
                                      onClick={() => handleShow(finding.id)}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold flex-1 text-gray-900 dark:text-white">
                                          {finding.category}
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                                          getPriorityBadgeClass(calculatePriority(finding.commitment_date))
                                        }`}>
                                          {getPriorityText(calculatePriority(finding.commitment_date))}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                        {finding.name}
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {formatDate(finding.commitment_date)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {finding.person_in_charge}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {filteredFindings.filter(finding => finding.status === 'not started').length === 0 && (
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
                          className={`bg-white dark:bg-gray-800 rounded-lg p-4 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-yellow-100 dark:bg-yellow-900/50' : ''
                          }`}
                        >
                          <h2 className="text-lg font-semibold mb-4 text-yellow-600 dark:text-yellow-300">
                            In Progress ({filteredFindings.filter(f => f.status === 'in progress').length})
                          </h2>
                          <div className="space-y-3 min-h-[32rem]">
                            {filteredFindings
                              .filter(finding => finding.status === 'in progress')
                              .map((finding, index) => (
                                <Draggable key={finding.id} draggableId={finding.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-md cursor-pointer ${
                                        snapshot.isDragging ? 'shadow-2xl' : 'hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-lg'
                                      }`}
                                      style={{ 
                                        ...provided.draggableProps.style, 
                                        borderLeft: `4px solid ${getBorderColor(finding.status)}` 
                                      }}
                                      onClick={() => handleShow(finding.id)}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold flex-1 text-gray-900 dark:text-white">
                                          {finding.category}
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                                          getPriorityBadgeClass(calculatePriority(finding.commitment_date))
                                        }`}>
                                          {getPriorityText(calculatePriority(finding.commitment_date))}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                        {finding.name}
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {formatDate(finding.commitment_date)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {finding.person_in_charge}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {filteredFindings.filter(finding => finding.status === 'in progress').length === 0 && (
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
                          className={`bg-white dark:bg-gray-800 rounded-lg p-4 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-green-100 dark:bg-green-900/50' : ''
                          }`}
                        >
                          <h2 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-300">
                            Done ({filteredFindings.filter(f => f.status === 'done').length})
                          </h2>
                          <div className="space-y-3 min-h-[32rem]">
                            {filteredFindings
                              .filter(finding => finding.status === 'done')
                              .map((finding, index) => (
                                <Draggable key={finding.id} draggableId={finding.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-md cursor-pointer ${
                                        snapshot.isDragging ? 'shadow-2xl' : 'hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-lg'
                                      }`}
                                      style={{ 
                                        ...provided.draggableProps.style, 
                                        borderLeft: `4px solid ${getBorderColor(finding.status)}` 
                                      }}
                                      onClick={() => handleShow(finding.id)}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold flex-1 text-gray-900 dark:text-white">
                                          {finding.category}
                                        </div>
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                          ✓ Complete
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                        {finding.name}
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {formatDate(finding.commitment_date)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {finding.person_in_charge}
                                        </div>
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
            </div>
          </main>
        </div>
      </div>

      {/* Create Finding Modal */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Finding</h2>
                <button
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Finding Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Root Cause *
                  </label>
                  <textarea
                    name="root_cause"
                    value={formData.root_cause}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recommendation *
                  </label>
                  <textarea
                    name="recommendation"
                    value={formData.recommendation}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commitment *
                  </label>
                  <textarea
                    name="commitment"
                    value={formData.commitment}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Commitment Date *
                    </label>
                    <input
                      type="date"
                      name="commitment_date"
                      value={formData.commitment_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Person in Charge *
                    </label>
                    <input
                      type="text"
                      name="person_in_charge"
                      value={formData.person_in_charge}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="not started">Not Started</option>
                      <option value="in progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Progress
                    </label>
                    <input
                      type="text"
                      name="progress_pemenuhan"
                      value={formData.progress_pemenuhan}
                      onChange={handleInputChange}
                      placeholder="e.g., 50%, In progress, Almost done, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <FaSave className="w-4 h-4" />
                    Create Finding
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDialog && currentFinding && (
        <FindingDetailModal
          finding={currentFinding}
          onClose={() => setShowDialog(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          formatDate={formatDate}
          getBadgeClass={getBadgeClass}
          getStatusText={getStatusText}
          calculatePriority={calculatePriority}
          getPriorityBadgeClass={getPriorityBadgeClass}
          getPriorityText={getPriorityText}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onConfirm={handleDeleteConfirm}
          onCancel={cancelDeleteConfirm}
          title="Delete Finding"
          message="Are you sure you want to delete this audit finding? This action cannot be undone."
        />
      )}
    </ProtectedRoute>
  );
}

// Define props interface for FindingDetailModal
interface FindingDetailModalProps {
  finding: AuditFinding | null;
  onClose: () => void;
  onSave: (finding: AuditFinding) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
  getBadgeClass: (status: AuditFinding['status']) => string;
  getStatusText: (status: AuditFinding['status']) => string;
  calculatePriority: (commitmentDate: string) => 'high' | 'medium' | 'low';
  getPriorityBadgeClass: (priority: 'high' | 'medium' | 'low') => string;
  getPriorityText: (priority: 'high' | 'medium' | 'low') => string;
}

// Finding Detail Modal Component with Edit functionality
function FindingDetailModal({ 
  finding, 
  onClose, 
  onSave, 
  onDelete, 
  formatDate, 
  getBadgeClass, 
  getStatusText,
  calculatePriority,
  getPriorityBadgeClass,
  getPriorityText
}: FindingDetailModalProps) {
  const [formState, setFormState] = useState<AuditFinding>({
    id: finding?.id || "",
    name: finding?.name || "",
    category: finding?.category || "",
    root_cause: finding?.root_cause || "",
    recommendation: finding?.recommendation || "",
    commitment: finding?.commitment || "",
    commitment_date: finding?.commitment_date || "",
    person_in_charge: finding?.person_in_charge || "",
    status: finding?.status || "not started",
    progress_pemenuhan: finding?.progress_pemenuhan || "",
    created_at: finding?.created_at || "",
    updated_at: finding?.updated_at || ""
  });

  const [isEdit, setIsEdit] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

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

  // Function to open confirmation modal
  const handleSaveClick = () => {
    setIsConfirmationOpen(true);
  };

  // Function to confirm save after modal confirmation
  const confirmSave = () => {
    onSave(formState);
    setIsConfirmationOpen(false);
    setIsEdit(false);
  };

  const cancelSave = () => {
    setIsConfirmationOpen(false);
  };

  // Function to open delete confirmation modal
  const handleDeleteClick = () => {
    setIsDeleteConfirmationOpen(true);
  };

  // Function to confirm delete after modal confirmation
  const confirmModalDelete = () => {
    if (finding) {
      onDelete(finding.id);
      // Close the detail modal immediately after calling delete
      onClose();
    }
    setIsDeleteConfirmationOpen(false);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmationOpen(false);
  };

  const priority = calculatePriority(formState.commitment_date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            {!isEdit ? (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{formState.category}</h2>
            ) : (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Audit Finding</h2>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2">
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Finding Name</div>
                {!isEdit ? (
                  <div className="text-gray-900 dark:text-white">{formState.name}</div>
                ) : (
                  <input
                    name="name"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    value={formState.name}
                    onChange={handleChange}
                  />
                )}
              </div>

              {isEdit && (
                <div>
                  <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Category</div>
                  <input
                    name="category"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    value={formState.category}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Priority</div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityBadgeClass(priority)}`}>
                  {getPriorityText(priority)}
                </span>
              </div>

              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Commitment Date</div>
                {!isEdit ? (
                  <div className="text-gray-900 dark:text-white">{formatDate(formState.commitment_date)}</div>
                ) : (
                  <input
                    type="date"
                    name="commitment_date"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    value={formState.commitment_date}
                    onChange={handleChange}
                  />
                )}
              </div>
            </div>

            {/* Baris Baru untuk Status dan Person in Charge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Status</div>
                {!isEdit ? (
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getBadgeClass(formState.status)}`}>
                    {getStatusText(formState.status)}
                  </span>
                ) : (
                  <select
                    name="status"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    value={formState.status}
                    onChange={handleChange}
                  >
                    <option value="not started">Not Started</option>
                    <option value="in progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                )}
              </div>

              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Person in Charge</div>
                {!isEdit ? (
                  <div className="text-gray-900 dark:text-white">{formState.person_in_charge}</div>
                ) : (
                  <input
                    name="person_in_charge"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    value={formState.person_in_charge}
                    onChange={handleChange}
                  />
                )}
              </div>

              {/* Kolom ketiga kosong untuk alignment */}
              <div></div>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Root Cause</div>
                {!isEdit ? (
                  <div className="text-gray-900 dark:text-white whitespace-pre-wrap">{formState.root_cause}</div>
                ) : (
                  <textarea
                    name="root_cause"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    rows={4}
                    value={formState.root_cause}
                    onChange={handleChange}
                  />
                )}
              </div>

              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Recommendation</div>
                {!isEdit ? (
                  <div className="text-gray-900 dark:text-white whitespace-pre-wrap">{formState.recommendation}</div>
                ) : (
                  <textarea
                    name="recommendation"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    rows={4}
                    value={formState.recommendation}
                    onChange={handleChange}
                  />
                )}
              </div>

              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Commitment</div>
                {!isEdit ? (
                  <div className="text-gray-900 dark:text-white whitespace-pre-wrap">{formState.commitment}</div>
                ) : (
                  <textarea
                    name="commitment"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    rows={4}
                    value={formState.commitment}
                    onChange={handleChange}
                  />
                )}
              </div>
            </div>

            {/* Progress Section - Baris baru di bawah Details Section */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Progress</div>
                {!isEdit ? (
                  <div className="text-gray-900 dark:text-white">{formState.progress_pemenuhan}</div>
                ) : (
                  <textarea
                    name="progress_pemenuhan"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    rows={3}
                    value={formState.progress_pemenuhan}
                    onChange={handleChange}
                    placeholder="Describe fulfillment progress..."
                  />
                )}
              </div>
            </div>

            {/* Timestamps */}
            {!isEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div>
                  <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Created At</div>
                  <div className="text-gray-600 dark:text-gray-400">{formState.created_at ? formatDate(formState.created_at) : 'Unknown'}</div>
                </div>
                
                <div>
                  <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Last Updated</div>
                  <div className="text-gray-600 dark:text-gray-400">{formState.updated_at ? formatDate(formState.updated_at) : 'Unknown'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
            {isEdit ? (
              <>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  onClick={handleSaveClick}
                >
                  <FaSave className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  onClick={() => setIsEdit(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  onClick={() => setIsEdit(true)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  onClick={handleDeleteClick}
                >
                  <FaTrash className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Confirmation Modals */}
          <ConfirmationModal
            isOpen={isConfirmationOpen}
            onConfirm={confirmSave}
            onCancel={cancelSave}
            title="Save Changes"
            message="Are you sure you want to save changes to this audit finding?"
          />
           
          <ConfirmationModal
            isOpen={isDeleteConfirmationOpen}
            onConfirm={confirmModalDelete}
            onCancel={cancelDelete}
            title="Delete Finding"
            message="Are you sure you want to delete this audit finding? This action cannot be undone."
          />
        </div>
      </div>
    </div>
  );
}
