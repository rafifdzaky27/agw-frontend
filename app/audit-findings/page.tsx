"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";

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
}

export default function AuditFindings() {
  const { user } = useAuth();
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentFinding, setCurrentFinding] = useState<AuditFinding | null>(null);

  // Get API URL from environment variable
  const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";
  const API_BASE_URL = `${BACKEND_IP}/api`;

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
      setAuditFindings((prev) => [...prev, newFinding]);
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
      setAuditFindings((prev) =>
        prev.map((item) => (item.id === finding.id ? updatedFinding : item))
      );
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
      
      setAuditFindings((prev) => prev.filter((item) => item.id !== id));
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

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    const finding = auditFindings.find(f => f.id === draggableId);

    // If the card is moved to a new column, update its status
    if (finding && destination.droppableId !== source.droppableId) {
      const newStatus = destination.droppableId as AuditFinding['status'];
      const updatedFinding = { ...finding, status: newStatus };

      // Optimistically update the UI
      setAuditFindings(prev =>
        prev.map(f => (f.id === draggableId ? updatedFinding : f))
      );

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-center">Audit Findings</h1>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
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
                      className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                    >
                      <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Not Started</h2>
                      <div className="space-y-3">
                        {auditFindings
                          .filter(finding => finding.status === 'not yet')
                          .map((finding, index) => (
                            <Draggable key={finding.id} draggableId={finding.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md transition cursor-pointer ${snapshot.isDragging ? 'shadow-xl scale-105' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                  onClick={() => handleShow(finding.id)}
                                >
                                  <div className="font-semibold mb-2">{finding.namaTemuan}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{finding.rekomendasi}</div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(finding.batasAkhirKomitmen)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{finding.pic}</div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {auditFindings.filter(finding => finding.status === 'not yet').length === 0 && (
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
                      className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-yellow-100 dark:bg-yellow-900/50' : ''}`}
                    >
                      <h2 className="text-lg font-semibold mb-4 text-yellow-600 dark:text-yellow-300">In Progress</h2>
                      <div className="space-y-3">
                        {auditFindings
                          .filter(finding => finding.status === 'on progress')
                          .map((finding, index) => (
                            <Draggable key={finding.id} draggableId={finding.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md transition cursor-pointer ${snapshot.isDragging ? 'shadow-xl scale-105' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                  onClick={() => handleShow(finding.id)}
                                >
                                  <div className="font-semibold mb-2">{finding.namaTemuan}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{finding.rekomendasi}</div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(finding.batasAkhirKomitmen)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{finding.pic}</div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {auditFindings.filter(finding => finding.status === 'on progress').length === 0 && (
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
                      className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-green-100 dark:bg-green-900/50' : ''}`}
                    >
                      <h2 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-300">Done</h2>
                      <div className="space-y-3">
                        {auditFindings
                          .filter(finding => finding.status === 'done')
                          .map((finding, index) => (
                            <Draggable key={finding.id} draggableId={finding.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md transition cursor-pointer ${snapshot.isDragging ? 'shadow-xl scale-105' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                  onClick={() => handleShow(finding.id)}
                                >
                                  <div className="font-semibold mb-2">{finding.namaTemuan}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{finding.rekomendasi}</div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(finding.batasAkhirKomitmen)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{finding.pic}</div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {auditFindings.filter(finding => finding.status === 'done').length === 0 && (
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
            <div className="text-center bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg">
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
  });

  const [isEdit, setIsEdit] = useState(false);

  // State for confirmation modal
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

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
                onClick={() => finding && onDelete(finding.id)}
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
    pic: ""
  });

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
