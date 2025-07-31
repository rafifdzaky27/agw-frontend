"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaSearch, FaFileExcel, FaFileAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import * as XLSX from 'xlsx';
import MemoModal from "./components/MemoModal";
import toast from "react-hot-toast";
import { memoApiService, MemoApiResponse, ApiResponse } from "@/utils/memoApi";

// Use the API response interface directly
type Memo = MemoApiResponse;

export default function MemoManagerPage() {
  const { user, token } = useAuth();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "memo" | "surat">("");
  const [showModal, setShowModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchMemos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<MemoApiResponse[]> = await memoApiService.getAllMemos(token!);
      
      if (response.success && response.data) {
        // Sort by created_at descending (newest first)
        const sortedMemos = response.data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setMemos(sortedMemos);
      } else {
        throw new Error(response.error || 'Failed to fetch memos');
      }
    } catch (error) {
      console.error('Error fetching memos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load memos');
      toast.error('Failed to load memos');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchMemos();
    }
  }, [token, fetchMemos]);

  // Filter memos based on search term and type
  const filteredMemos = useMemo(() => {
    let filtered = memos;
    
    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(memo => memo.type === typeFilter);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(memo => 
        memo.memo_number.toLowerCase().includes(searchLower) ||
        memo.to.toLowerCase().includes(searchLower) ||
        memo.cc.toLowerCase().includes(searchLower) ||
        memo.reason.toLowerCase().includes(searchLower) ||
        memo.created_by.toLowerCase().includes(searchLower) ||
        memo.type.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [memos, searchTerm, typeFilter]);

  // Export function
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      if (filteredMemos.length === 0) {
        toast.error("No memos found to export");
        return;
      }
      
      // Create Excel data
      const excelData: Record<string, string | number>[] = [];
      
      filteredMemos.forEach((memo, index) => {
        excelData.push({
          "No": index + 1,
          "Type": memo.type === 'memo' ? 'Memo' : 'Surat',
          "Memo Number": memo.memo_number,
          "To": memo.to,
          "CC": memo.cc || '-',
          "Reason": memo.reason,
          "Created By": memo.created_by,
          "Created At": formatDate(memo.created_at)
        });
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 8 },   // Type
        { wch: 25 },  // Memo Number
        { wch: 30 },  // To
        { wch: 30 },  // CC
        { wch: 50 },  // Reason
        { wch: 20 },  // Created By
        { wch: 15 }   // Created At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Memo Data");

      // Generate filename with filter info and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const typeFilterText = typeFilter ? `_${typeFilter}` : '';
      const searchFilter = searchTerm ? `_Search_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `Memo_Manager${typeFilterText}${searchFilter}_${filteredMemos.length}_items_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message
      toast.success(`Successfully exported ${filteredMemos.length} memos to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export memos. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredMemos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMemos = filteredMemos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle row expansion
  const toggleRowExpansion = (memoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memoId)) {
        newSet.delete(memoId);
      } else {
        newSet.add(memoId);
      }
      return newSet;
    });
  };

  // Handle copy memo number to clipboard
  const copyMemoNumber = async (memoNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(memoNumber);
      toast.success(`Nomor ${memoNumber} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy memo number');
    }
  };

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const handleNewMemo = () => {
    setShowModal(true);
  };

  const handleSaveMemo = async (memoData: { type: "memo" | "surat"; to: string; cc?: string; reason: string }) => {
    try {
      console.log('=== CREATING NEW MEMO ===');
      console.log('Memo data:', memoData);
      
      // Add the current user's name as the creator
      const memoDataWithCreator = {
        ...memoData,
        created_by: user?.name || user?.username || 'Unknown User'
      };
      
      console.log('Memo data with creator:', memoDataWithCreator);
      
      const response: ApiResponse<MemoApiResponse> = await memoApiService.createMemo(memoDataWithCreator, token!);
      console.log('API Response:', response);
      
      if (response.success) {
        toast.success('Memo berhasil dibuat!');
        setShowModal(false);
        // Refresh the memos list
        await fetchMemos();
      } else {
        throw new Error(response.error || 'Failed to create memo');
      }
    } catch (error) {
      console.error('Error creating memo:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal membuat memo');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatType = (type: string) => {
    return type === 'memo' ? 'Memo' : 'Surat';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading memos...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        
        <div className="flex-1 md:ml-60 p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Memo Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola memo dan surat internal perusahaan
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {memos.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Documents
              </div>
            </div>
          </div>

              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Bar, Filter, Export and Add Button */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nomor, penerima, perihal, atau pembuat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "" | "memo" | "surat")}
                    className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white cursor-pointer"
                  >
                    <option value="">All Types</option>
                    <option value="memo">Memo</option>
                    <option value="surat">Surat</option>
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                </div>
                <button
                  onClick={handleExport}
                  disabled={isExporting || filteredMemos.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FaFileExcel className="text-sm" />
                  {isExporting ? 'Exporting...' : `Export (${filteredMemos.length})`}
                </button>
                <button
                  onClick={handleNewMemo}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FaPlus className="text-sm" />
                  New Memo
                </button>
              </div>

              {/* Enhanced Data Table - EXACT MATCH TO PAGE-LAMA.TSX */}
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                          No.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                          Jenis
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                          Nomor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-44">
                          Kepada
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                          CC
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Perihal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                          Pembuat
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentMemos.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                            {searchTerm ? 'No documents found matching your search.' : 'No documents available.'}
                          </td>
                        </tr>
                      ) : (
                        currentMemos.map((memo, index) => {
                          const isExpanded = expandedRows.has(memo.id.toString());
                          return (
                            <tr
                              key={memo.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {startIndex + index + 1}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  memo.type === 'memo' 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {formatType(memo.type)}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {formatDate(memo.created_at)}
                              </td>
                              <td className="px-4 py-4 text-sm font-mono">
                                <span 
                                  className="break-all cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                  onClick={(e) => copyMemoNumber(memo.memo_number, e)}
                                  title="Click to copy"
                                >
                                  {memo.memo_number}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                <div className="max-w-44">
                                  <div className={`break-words ${isExpanded ? '' : 'line-clamp-2'}`}>
                                    {memo.to}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                <div className="max-w-48">
                                  {memo.cc ? (
                                    <div className={`break-words ${isExpanded ? '' : 'line-clamp-2'}`}>
                                      {memo.cc}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                <div className={`break-words ${isExpanded ? '' : 'line-clamp-2'}`}>
                                  {memo.reason}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                <div className="flex items-center justify-between max-w-48">
                                  <div className="flex-1 min-w-0">
                                    <div className={`break-words ${isExpanded ? '' : 'line-clamp-2'}`}>
                                      {memo.created_by}
                                    </div>
                                  </div>
                                  <button
                                  onClick={(e) => toggleRowExpansion(memo.id.toString(), e)}
                                  className="ml-2 px-1 py-6 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors flex items-center justify-center"
                                >
                                  {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Showing {startIndex + 1} to {Math.min(endIndex, filteredMemos.length)} of {filteredMemos.length} documents
                          {memos.length !== filteredMemos.length && (
                            <span className="text-gray-500"> (filtered from {memos.length} total)</span>
                          )}
                        </div>
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 text-sm border rounded ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          {totalPages > 5 && currentPage < totalPages - 2 && (
                            <>
                              <span className="px-2 text-gray-500">...</span>
                              <button
                                onClick={() => handlePageChange(totalPages)}
                                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
        </div>

        {/* Modal */}
        {showModal && (
          <MemoModal
            onSave={handleSaveMemo}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
