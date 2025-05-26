"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

export default function AuditFindings() {
  const { user } = useAuth();
  const [auditFindings, setAuditFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentFinding, setCurrentFinding] = useState(null);

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
        const sortedData = data.sort((a, b) => new Date(a.batasAkhirKomitmen) - new Date(b.batasAkhirKomitmen));
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
  const handlePost = useCallback(async (finding) => {
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
  const handleSave = useCallback(async (finding) => {
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
  const handleDelete = useCallback(async (id) => {
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
  const handleShow = useCallback((id) => {
    const finding = auditFindings.find((item) => item.id === id);
    setCurrentFinding(finding);
    setShowDialog(true);
  }, [auditFindings]);

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
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto p-6">
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
              <p className="text-gray-400">Loading audit findings...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {auditFindings.map((finding) => (
                <div 
                  key={finding.id}
                  className="bg-gray-800 rounded-lg p-4 shadow-lg hover:bg-gray-750 transition cursor-pointer"
                  onClick={() => handleShow(finding.id)}
                >
                  <div className="flex flex-col md:flex-row justify-between mb-2">
                    <div className="font-semibold text-lg">{finding.namaTemuan}</div>
                    <div className="text-gray-300">{formatDate(finding.batasAkhirKomitmen)}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                      </svg>
                      <span>{finding.kategoriAudit}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeClass(finding.status)}`}>
                      {getStatusText(finding.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                    </svg>
                    <span>{finding.pic}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && auditFindings.length === 0 && (
            <div className="text-center bg-gray-800 p-8 rounded-lg shadow-lg">
              <p className="text-gray-400">No audit findings available.</p>
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

// Finding Dialog Component
function FindingDialog({ finding, onClose, onSave, onDelete, formatDate, getBadgeClass, getStatusText }) {
  const [formState, setFormState] = useState({
    id: finding.id || "",
    kategoriAudit: finding.kategoriAudit || "",
    namaTemuan: finding.namaTemuan || "",
    penyebab: finding.penyebab || "",
    rekomendasi: finding.rekomendasi || "",
    komitmenTindakLanjut: finding.komitmenTindakLanjut || "",
    batasAkhirKomitmen: finding.batasAkhirKomitmen || "",
    pic: finding.pic || "",
    status: finding.status || "not yet",
  });

  const [isEdit, setIsEdit] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formState);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-11/12 lg:w-2/3 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          {!isEdit ? (
            <h3 className="text-xl font-bold text-white">{formState.kategoriAudit}</h3>
          ) : (
            <h3 className="text-xl font-bold text-white">Edit Audit Finding</h3>
          )}
          <button
            className="bg-gray-700 text-gray-300 p-2 rounded-full hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="font-bold text-gray-300 mb-1">Finding Name</div>
            {!isEdit ? (
              <div className="text-white">{formState.namaTemuan}</div>
            ) : (
              <input
                name="namaTemuan"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                value={formState.namaTemuan}
                onChange={handleChange}
              />
            )}
          </div>
          
          {isEdit && (
            <div>
              <div className="font-bold text-gray-300 mb-1">Audit Category</div>
              <input
                name="kategoriAudit"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                value={formState.kategoriAudit}
                onChange={handleChange}
              />
            </div>
          )}
          
          <div>
            <div className="font-bold text-gray-300 mb-1">Deadline</div>
            {!isEdit ? (
              <div className="text-white">{formatDate(formState.batasAkhirKomitmen)}</div>
            ) : (
              <input
                type="date"
                name="batasAkhirKomitmen"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                value={formState.batasAkhirKomitmen}
                onChange={handleChange}
              />
            )}
          </div>
          
          <div>
            <div className="font-bold text-gray-300 mb-1">Status</div>
            {!isEdit ? (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeClass(formState.status)}`}>
                {getStatusText(formState.status)}
              </span>
            ) : (
              <select
                name="status"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
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
            <div className="font-bold text-gray-300 mb-1">Root Cause</div>
            {!isEdit ? (
              <div className="text-white">{formState.penyebab}</div>
            ) : (
              <textarea
                name="penyebab"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                rows={4}
                value={formState.penyebab}
                onChange={handleChange}
              />
            )}
          </div>
          
          <div>
            <div className="font-bold text-gray-300 mb-1">Recommendation</div>
            {!isEdit ? (
              <div className="text-white">{formState.rekomendasi}</div>
            ) : (
              <textarea
                name="rekomendasi"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                rows={4}
                value={formState.rekomendasi}
                onChange={handleChange}
              />
            )}
          </div>
          
          <div>
            <div className="font-bold text-gray-300 mb-1">Action Plan</div>
            {!isEdit ? (
              <div className="text-white">{formState.komitmenTindakLanjut}</div>
            ) : (
              <textarea
                name="komitmenTindakLanjut"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                rows={4}
                value={formState.komitmenTindakLanjut}
                onChange={handleChange}
              />
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-300 mb-1">Person in Charge</div>
          {!isEdit ? (
            <div className="text-white">{formState.pic}</div>
          ) : (
            <input
              name="pic"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
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
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
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
                onClick={() => onDelete(finding.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Finding Create Dialog Component
function FindingCreateDialog({ onClose, onSave }) {
  const [formState, setFormState] = useState({
    kategoriAudit: "",
    namaTemuan: "",
    penyebab: "",
    rekomendasi: "",
    komitmenTindakLanjut: "",
    batasAkhirKomitmen: "",
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
      <div className="bg-gray-800 rounded-lg p-6 w-11/12 lg:w-2/3 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Add New Audit Finding</h3>
          <button
            className="bg-gray-700 text-gray-300 p-2 rounded-full hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="font-bold text-gray-300 mb-1">Finding Name</div>
            <input
              name="namaTemuan"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Enter finding name"
              value={formState.namaTemuan}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-300 mb-1">Audit Category</div>
            <input
              name="kategoriAudit"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Enter category"
              value={formState.kategoriAudit}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-300 mb-1">Deadline</div>
            <input
              type="date"
              name="batasAkhirKomitmen"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              value={formState.batasAkhirKomitmen}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-300 mb-1">Status</div>
            <select
              name="status"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
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
            <div className="font-bold text-gray-300 mb-1">Root Cause</div>
            <textarea
              name="penyebab"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Describe the root cause"
              rows={4}
              value={formState.penyebab}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-300 mb-1">Recommendation</div>
            <textarea
              name="rekomendasi"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Enter recommendations"
              rows={4}
              value={formState.rekomendasi}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-300 mb-1">Action Plan</div>
            <textarea
              name="komitmenTindakLanjut"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Describe the action plan"
              rows={4}
              value={formState.komitmenTindakLanjut}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-300 mb-1">Person in Charge</div>
          <input
            name="pic"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
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
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
