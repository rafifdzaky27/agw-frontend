"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { FaFileExcel, FaPlus,FaTrash, FaTimes, FaSave, FaSearch, FaClipboardList, FaEdit } from "react-icons/fa";
import toast from "react-hot-toast";
import { auditFindingsApiService, AuditFinding } from "@/utils/auditFindingsApi";

export default function AuditFindings() {
  const { user, token, loading: authLoading } = useAuth();
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<AuditFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
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
    progress_pemenuhan: ''
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

  // Show edit dialog
  const handleEdit = useCallback((finding: AuditFinding) => {
    setFormData({
      name: finding.name,
      category: finding.category,
      root_cause: finding.root_cause,
      recommendation: finding.recommendation,
      commitment: finding.commitment,
      commitment_date: finding.commitment_date,
      person_in_charge: finding.person_in_charge,
      status: finding.status,
      progress_pemenuhan: finding.progress_pemenuhan
    });
    setCurrentFinding(finding);
    setShowDialog(false);
    setShowEditDialog(true);
  }, []);

  // Update existing finding from edit modal
  const handleUpdate = useCallback(async () => {
    if (!token || !currentFinding) return;

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

      const response = await auditFindingsApiService.updateFinding(currentFinding.id, findingData, token);
      
      if (response.success && response.data) {
        setAuditFindings(prev => prev.map(f => f.id === currentFinding.id ? response.data! : f));
        setFilteredFindings(prev => prev.map(f => f.id === currentFinding.id ? response.data! : f));
        setShowEditDialog(false);
        setCurrentFinding(null);
        resetForm();
        toast.success("Audit finding updated successfully!");
      } else {
        toast.error(response.error || 'Failed to update audit finding');
      }
    } catch (error) {
      console.error('Error updating finding:', error);
      toast.error('Failed to update audit finding');
    }
  }, [formData, token, currentFinding]);

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
      progress_pemenuhan: ''
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
        <div className="flex-1 md:ml-60 p-6">
          <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Audit Findings
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Track and manage audit findings with drag-and-drop status updates
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredFindings.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total Findings
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search findings by category, name, or person in charge..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleExportToExcel}
                  disabled={isExporting || auditFindings.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FaFileExcel className="text-sm" />
                  {isExporting ? 'Exporting...' : 'Export Excel'}
                </button>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FaPlus className="text-sm" />
                  Add Finding
                </button>
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
                /* Card Layout with Drag and Drop */
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Not Started Column */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                          Not Started
                        </h2>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm px-2 py-1 rounded-full">
                          {filteredFindings.filter(f => f.status === 'not started').length}
                        </span>
                      </div>
                      <Droppable droppableId="not yet">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-3 min-h-[400px] p-2 rounded-lg"
                          >
                            {filteredFindings
                              .filter(finding => finding.status === 'not started')
                              .map((finding, index) => (
                                <Draggable key={finding.id} draggableId={finding.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <FindingCard
                                      finding={finding}
                                      provided={provided}
                                      snapshot={snapshot}
                                      onClick={() => handleShow(finding.id)}
                                      formatDate={formatDate}
                                      calculatePriority={calculatePriority}
                                      getPriorityBadgeClass={getPriorityBadgeClass}
                                      getPriorityText={getPriorityText}
                                      getBorderColor={getBorderColor}
                                    />
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {filteredFindings.filter(finding => finding.status === 'not started').length === 0 && (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <FaClipboardList className="mx-auto text-3xl mb-2 opacity-50" />
                                <p>No findings yet</p>
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
                          {filteredFindings.filter(f => f.status === 'in progress').length}
                        </span>
                      </div>
                      <Droppable droppableId="on progress">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-3 min-h-[400px] p-2 rounded-lg"
                          >
                            {filteredFindings
                              .filter(finding => finding.status === 'in progress')
                              .map((finding, index) => (
                                <Draggable key={finding.id} draggableId={finding.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <FindingCard
                                      finding={finding}
                                      provided={provided}
                                      snapshot={snapshot}
                                      onClick={() => handleShow(finding.id)}
                                      formatDate={formatDate}
                                      calculatePriority={calculatePriority}
                                      getPriorityBadgeClass={getPriorityBadgeClass}
                                      getPriorityText={getPriorityText}
                                      getBorderColor={getBorderColor}
                                    />
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {filteredFindings.filter(finding => finding.status === 'in progress').length === 0 && (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <FaClipboardList className="mx-auto text-3xl mb-2 opacity-50" />
                                <p>No findings yet</p>
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
                          {filteredFindings.filter(f => f.status === 'done').length}
                        </span>
                      </div>
                      <Droppable droppableId="done">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-3 min-h-[400px] p-2 rounded-lg"
                          >
                            {filteredFindings
                              .filter(finding => finding.status === 'done')
                              .map((finding, index) => (
                                <Draggable key={finding.id} draggableId={finding.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <FindingCard
                                      finding={finding}
                                      provided={provided}
                                      snapshot={snapshot}
                                      onClick={() => handleShow(finding.id)}
                                      formatDate={formatDate}
                                      calculatePriority={calculatePriority}
                                      getPriorityBadgeClass={getPriorityBadgeClass}
                                      getPriorityText={getPriorityText}
                                      getBorderColor={getBorderColor}
                                      isDone={true}
                                    />
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {filteredFindings.filter(finding => finding.status === 'done').length === 0 && (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <FaClipboardList className="mx-auto text-3xl mb-2 opacity-50" />
                                <p>No findings yet</p>
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
        </div>
      </div>

      {/* Create Finding Modal */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Finding</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCreate}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Create finding"
                  >
                    <FaSave className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                  <button
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-hide">
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Finding Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="Enter finding name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="Enter category"
                      />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Finding Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Root Cause <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="root_cause"
                        value={formData.root_cause}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                        placeholder="Describe the root cause"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recommendation <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="recommendation"
                        value={formData.recommendation}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                        placeholder="Enter recommendation"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Commitment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="commitment"
                      value={formData.commitment}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                      placeholder="Enter commitment details"
                    />
                  </div>
                </div>

                {/* Assignment & Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Assignment & Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Commitment Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="commitment_date"
                        value={formData.commitment_date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Person in Charge <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="person_in_charge"
                        value={formData.person_in_charge}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="Enter person in charge"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="not started">Not Started</option>
                        <option value="in progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Progress Notes
                    </label>
                    <input
                      type="text"
                      name="progress_pemenuhan"
                      value={formData.progress_pemenuhan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="e.g., 50%, In progress, Almost done, etc."
                    />
                  </div>
                </div>
              </form>
            </div>


          </div>
        </div>
      )}

      {/* Edit Finding Modal */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Finding</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleUpdate}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Save changes"
                  >
                    <FaSave className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                  <button
                    onClick={() => {
                      setShowEditDialog(false);
                      setCurrentFinding(null);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-hide">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Finding Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="Enter finding name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="Enter category"
                      />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Finding Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Root Cause <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="root_cause"
                        value={formData.root_cause}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                        placeholder="Describe the root cause"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recommendation <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="recommendation"
                        value={formData.recommendation}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                        placeholder="Enter recommendation"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Commitment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="commitment"
                      value={formData.commitment}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                      placeholder="Enter commitment details"
                    />
                  </div>
                </div>

                {/* Assignment & Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Assignment & Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Commitment Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="commitment_date"
                        value={formData.commitment_date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Person in Charge <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="person_in_charge"
                        value={formData.person_in_charge}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="Enter person in charge"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="not started">Not Started</option>
                        <option value="in progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Progress Notes
                    </label>
                    <input
                      type="text"
                      name="progress_pemenuhan"
                      value={formData.progress_pemenuhan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="e.g., 50%, In progress, Almost done, etc."
                    />
                  </div>
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
          onEdit={handleEdit}
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

// Finding Card Component
interface FindingCardProps {
  finding: AuditFinding;
  provided: any;
  snapshot: any;
  onClick: () => void;
  formatDate: (dateString: string) => string;
  calculatePriority: (commitmentDate: string) => 'high' | 'medium' | 'low';
  getPriorityBadgeClass: (priority: 'high' | 'medium' | 'low') => string;
  getPriorityText: (priority: 'high' | 'medium' | 'low') => string;
  getBorderColor: (status: AuditFinding['status']) => string;
  isDone?: boolean;
}

function FindingCard({ 
  finding, 
  provided, 
  snapshot, 
  onClick, 
  formatDate, 
  calculatePriority, 
  getPriorityBadgeClass, 
  getPriorityText, 
  getBorderColor,
  isDone = false
}: FindingCardProps) {
  const priority = calculatePriority(finding.commitment_date);
  
  return (
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
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-5 line-clamp-2 flex-1">
          {finding.category}
        </h3>
        {isDone ? (
          <span className="px-2 py-1 text-xs font-semibold rounded-full ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex-shrink-0">
            ✓ Complete
          </span>
        ) : (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${
            getPriorityBadgeClass(priority)
          }`}>
            {getPriorityText(priority)}
          </span>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
          <div className="line-clamp-2 text-xs">
            {finding.name}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(finding.commitment_date)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-2">
            {finding.person_in_charge}
          </span>
        </div>
      </div>
    </div>
  );
}

// Define props interface for FindingDetailModal
interface FindingDetailModalProps {
  finding: AuditFinding | null;
  onClose: () => void;
  onSave: (finding: AuditFinding) => void;
  onDelete: (id: string) => void;
  onEdit: (finding: AuditFinding) => void;
  formatDate: (dateString: string) => string;
  getBadgeClass: (status: AuditFinding['status']) => string;
  getStatusText: (status: AuditFinding['status']) => string;
  calculatePriority: (commitmentDate: string) => 'high' | 'medium' | 'low';
  getPriorityBadgeClass: (priority: 'high' | 'medium' | 'low') => string;
  getPriorityText: (priority: 'high' | 'medium' | 'low') => string;
}

// Finding Detail Modal Component - Read-only view
function FindingDetailModal({ 
  finding, 
  onClose, 
  onSave, 
  onDelete, 
  onEdit,
  formatDate, 
  getBadgeClass, 
  getStatusText,
  calculatePriority,
  getPriorityBadgeClass,
  getPriorityText
}: FindingDetailModalProps) {
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  if (!finding) return null;

  const priority = calculatePriority(finding.commitment_date);

  const handleDeleteClick = () => {
    setIsDeleteConfirmationOpen(true);
  };

  const confirmModalDelete = () => {
    onDelete(finding.id);
    onClose();
    setIsDeleteConfirmationOpen(false);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmationOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Finding Details</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onEdit(finding);
                }}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Edit finding"
              >
                <FaEdit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete finding"
              >
                <FaTrash className="w-4 h-4" />
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
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityBadgeClass(priority)}`}>
                  {getPriorityText(priority)} Priority
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Finding Name</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{finding.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{finding.category}</div>
                </div>
              </div>
            </div>

            {/* Finding Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Finding Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Root Cause</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white whitespace-pre-wrap min-h-[100px]">{finding.root_cause}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recommendation</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white whitespace-pre-wrap min-h-[100px]">{finding.recommendation}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commitment</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white whitespace-pre-wrap">{finding.commitment}</div>
              </div>
            </div>

            {/* Assignment & Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Assignment & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commitment Date</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{formatDate(finding.commitment_date)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Person in Charge</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{finding.person_in_charge}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getBadgeClass(finding.status)}`}>
                      {getStatusText(finding.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Progress Notes</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{finding.progress_pemenuhan || 'No progress notes'}</div>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Audit Trail</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created At</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">{finding.created_at ? formatDate(finding.created_at) : 'Unknown'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Updated</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">{finding.updated_at ? formatDate(finding.updated_at) : 'Unknown'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmationOpen}
        onConfirm={confirmModalDelete}
        onCancel={cancelDelete}
        title="Delete Finding"
        message="Are you sure you want to delete this audit finding? This action cannot be undone."
      />
    </div>
  );
}
