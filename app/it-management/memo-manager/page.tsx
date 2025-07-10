"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import MemoModal from "./components/MemoModal";
import toast from "react-hot-toast";

// Define interfaces
interface Memo {
  id: string;
  jenis: "Memo" | "Surat";
  tanggal: string;
  nomor: string;
  kepada: string;
  cc: string;
  perihal: string;
  pembuat: string;
  createdAt: string;
  updatedAt: string;
}

export default function MemoManagerPage() {
  const { user, token } = useAuth();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Generate mock data
  const generateMockMemos = (): Memo[] => {
    const memos: Memo[] = [];
    const subjects = [
      "Permohonan Cuti Tahunan Karyawan Divisi IT untuk periode liburan akhir tahun",
      "Undangan Rapat Koordinasi Bulanan Tim Development dan Quality Assurance",
      "Pemberitahuan Perubahan Jadwal Maintenance Server dan Sistem Backup",
      "Laporan Kegiatan Bulanan Divisi IT dan Progress Project yang sedang berjalan",
      "Permohonan Izin Kegiatan Training External untuk Tim Technical Support",
      "Surat Tugas Dinas Luar Kota untuk Implementasi Sistem di Cabang Jakarta",
      "Pemberitahuan Kebijakan Baru Mengenai Work From Home dan Hybrid Working",
      "Undangan Pelatihan Karyawan tentang Cyber Security dan Data Protection",
      "Laporan Evaluasi Kinerja Triwulan dan Rekomendasi Improvement",
      "Permohonan Pengadaan Barang IT Hardware dan Software License",
      "Surat Peringatan Kedisiplinan terkait Keterlambatan dan Absensi",
      "Undangan Acara Perusahaan Annual Gathering dan Team Building Activity",
      "Pemberitahuan Libur Nasional dan Jadwal Operasional selama Hari Raya",
      "Laporan Keuangan Triwulan dan Budget Planning untuk Quarter berikutnya",
      "Permohonan Perpanjangan Kontrak Vendor IT Support dan Maintenance",
      "Surat Rekomendasi Karyawan untuk Program Sertifikasi Professional",
      "Pemberitahuan Mutasi Jabatan dan Restrukturisasi Organisasi",
      "Undangan Workshop Internal tentang Agile Development Methodology",
      "Laporan Audit Internal Sistem Keamanan dan Compliance Check",
      "Permohonan Bantuan Teknis untuk Troubleshooting Critical System Issue",
      "Surat Pengantar Dokumen Proposal Project dan Technical Specification",
      "Pemberitahuan Implementasi Sistem Baru dan Training Schedule",
      "Undangan Sosialisasi Program Corporate Social Responsibility",
      "Laporan Progres Proyek Digital Transformation dan Milestone Achievement",
      "Permohonan Anggaran Tambahan untuk Infrastructure Upgrade Project"
    ];

    const recipients = [
      "Direktur Utama PT. Teknologi Maju Indonesia",
      "Manager IT Development dan Infrastructure",
      "Kepala Divisi SDM dan General Affairs",
      "Supervisor Operasional dan Quality Control",
      "Team Leader Software Development",
      "Koordinator Proyek Digital Transformation",
      "Kepala Bagian Keuangan dan Accounting",
      "Manager Marketing dan Business Development",
      "Supervisor Quality Assurance dan Testing",
      "Kepala Unit Produksi dan Manufacturing",
      "Koordinator Training dan Human Development",
      "Manager Procurement dan Vendor Management",
      "Kepala Divisi Legal dan Compliance",
      "Supervisor Maintenance dan Technical Support",
      "Team Leader Customer Support dan Service",
      "Koordinator Logistik dan Supply Chain",
      "Manager Business Intelligence dan Analytics",
      "Kepala Bagian Internal Audit",
      "Supervisor Security dan Risk Management",
      "Koordinator Customer Relationship Management"
    ];

    const creators = [
      "Ahmad Rizki Rahman, S.Kom", "Sari Dewi Lestari, M.T", "Budi Santoso Wijaya, S.T",
      "Maya Sari Putri, S.Kom", "Eko Prasetyo Nugroho, M.Kom", "Linda Wijaya Sari, S.E",
      "Rizki Rahman Ahmad, S.T", "Dewi Lestari Sari, M.M", "Santoso Wijaya Budi, S.Kom",
      "Putri Maya Sari, S.T", "Nugroho Eko Prasetyo, M.T", "Sari Linda Wijaya, S.E"
    ];

    const ccList = [
      "Manager IT, Supervisor Operasional, Team Leader Development",
      "Kepala Divisi SDM, Koordinator Training",
      "Team Leader Development, Koordinator Proyek, Manager Marketing",
      "Manager Marketing, Supervisor Quality Control",
      "Supervisor Quality Control, Kepala Unit Produksi, Koordinator Training",
      "Koordinator Training, Manager Procurement",
      "Manager Procurement, Kepala Divisi Legal, Supervisor Maintenance",
      "Supervisor Maintenance, Team Leader Support",
      "Team Leader Support, Koordinator Logistik",
      "Koordinator Logistik, Manager Business Development, Kepala Bagian Audit",
      "", // Some empty CC
      "Kepala Bagian Audit, Supervisor Security"
    ];

    // Generate data chronologically with 10 Surat and 40 Memo spanning 2024-2025
    let memoCounter2024 = 1;
    let suratCounter2024 = 1;
    let memoCounter2025 = 1;
    let suratCounter2025 = 1;

    // Start from early 2024 and span to 2025
    const startDate = new Date(2024, 0, 15); // January 15, 2024
    const endDate = new Date(2025, 11, 15); // December 15, 2025
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    const totalDocs = 50;
    const suratCount = 10;
    const memoCount = 40;
    
    // Create array of document types in chronological order
    const docTypes: ("Memo" | "Surat")[] = [];
    
    // Distribute surat evenly throughout the timeline (every 5th document approximately)
    for (let i = 0; i < totalDocs; i++) {
      if (i > 0 && i % 5 === 0 && docTypes.filter(d => d === "Surat").length < suratCount) {
        docTypes.push("Surat");
      } else {
        docTypes.push("Memo");
      }
    }
    
    // Ensure we have exactly 10 Surat
    while (docTypes.filter(d => d === "Surat").length < suratCount) {
      const randomIndex = Math.floor(Math.random() * totalDocs);
      if (docTypes[randomIndex] === "Memo") {
        docTypes[randomIndex] = "Surat";
      }
    }
    
    // Generate documents chronologically
    for (let i = 0; i < totalDocs; i++) {
      // Calculate date spread across 2024-2025
      const dayOffset = Math.floor((i / totalDocs) * totalDays) + Math.floor(Math.random() * 7); // Add some randomness
      const createdDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const year = createdDate.getFullYear();
      const jenis = docTypes[i];
      
      let sequentialNumber: string;
      let nomor: string;
      
      if (jenis === "Memo") {
        if (year === 2024) {
          sequentialNumber = memoCounter2024.toString().padStart(5, '0');
          nomor = `${sequentialNumber}/ITE-IAE/M/2024`;
          memoCounter2024++;
        } else {
          sequentialNumber = memoCounter2025.toString().padStart(5, '0');
          nomor = `${sequentialNumber}/ITE-IAE/M/2025`;
          memoCounter2025++;
        }
      } else {
        if (year === 2024) {
          sequentialNumber = suratCounter2024.toString().padStart(5, '0');
          nomor = `${sequentialNumber}/ITE-IAG/2024`;
          suratCounter2024++;
        } else {
          sequentialNumber = suratCounter2025.toString().padStart(5, '0');
          nomor = `${sequentialNumber}/ITE-IAG/2025`;
          suratCounter2025++;
        }
      }

      memos.push({
        id: (i + 1).toString(),
        jenis: jenis,
        tanggal: createdDate.toISOString().split('T')[0],
        nomor: nomor,
        kepada: recipients[Math.floor(Math.random() * recipients.length)],
        cc: ccList[Math.floor(Math.random() * ccList.length)],
        perihal: subjects[Math.floor(Math.random() * subjects.length)],
        pembuat: creators[Math.floor(Math.random() * creators.length)],
        createdAt: createdDate.toISOString(),
        updatedAt: createdDate.toISOString()
      });
    }
    
    // Return sorted by document number (sequential order)
    return memos.sort((a, b) => {
      // Extract year and number from document number for proper sorting
      const extractNumberInfo = (nomor: string) => {
        const parts = nomor.split('/');
        const number = parseInt(parts[0]);
        const year = parseInt(parts[parts.length - 1]);
        return { year, number };
      };
      
      const aInfo = extractNumberInfo(a.nomor);
      const bInfo = extractNumberInfo(b.nomor);
      
      // Sort by year first, then by number
      if (aInfo.year !== bInfo.year) {
        return aInfo.year - bInfo.year; // 2024 first, then 2025
      }
      return aInfo.number - bInfo.number; // 00001, 00002, 00003...
    });
  };

  const mockMemos = generateMockMemos();

  useEffect(() => {
    fetchMemos();
  }, [token]);

  const fetchMemos = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setMemos(mockMemos);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError("Failed to fetch memos");
      setLoading(false);
      toast.error("Failed to load memos");
    }
  };

  // Filter memos based on search term
  const filteredMemos = useMemo(() => {
    if (!searchTerm) return memos;
    
    return memos.filter(memo =>
      memo.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.nomor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.kepada.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.pembuat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [memos, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredMemos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMemos = filteredMemos.slice(startIndex, endIndex);

  // Handle pagination
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

  // Handle copy nomor to clipboard
  const copyNomor = async (nomor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(nomor);
      toast.success(`Nomor ${nomor} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy nomor');
    }
  };

  const handleNewMemo = () => {
    setShowModal(true);
  };

  // Generate next number for new memo/letter
  const generateNextNumber = (jenis: "Memo" | "Surat", tanggal: string): string => {
    const inputYear = new Date(tanggal).getFullYear();
    const currentYearMemos = memos.filter(memo => 
      memo.jenis === jenis && 
      new Date(memo.tanggal).getFullYear() === inputYear
    );

    const nextSequential = currentYearMemos.length + 1;
    const sequentialNumber = nextSequential.toString().padStart(5, '0');

    if (jenis === "Memo") {
      return `${sequentialNumber}/ITE-IAE/M/${inputYear}`;
    } else {
      return `${sequentialNumber}/ITE-IAG/${inputYear}`;
    }
  };

  const handleSaveMemo = (memoData: Omit<Memo, 'id' | 'nomor' | 'pembuat' | 'createdAt' | 'updatedAt'>) => {
    const newMemo: Memo = {
      id: Date.now().toString(),
      ...memoData,
      nomor: generateNextNumber(memoData.jenis, memoData.tanggal),
      pembuat: user?.name || "Current User",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add new memo at the end (newest)
    setMemos(prev => [...prev, newMemo]);
    toast.success(`${memoData.jenis} "${memoData.perihal}" berhasil dibuat dengan nomor ${newMemo.nomor}`);
    setShowModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
          <Sidebar />
          <div className="flex-1 md:ml-60 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="max-w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Memo Manager
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Kelola memo dan surat dengan sistem penomoran otomatis
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
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleNewMemo}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaPlus className="text-sm" />
                    New
                  </button>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by subject, number, recipient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-56">
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
                        const isExpanded = expandedRows.has(memo.id);
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
                                memo.jenis === 'Memo' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {memo.jenis}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatDate(memo.tanggal)}
                            </td>
                            <td className="px-4 py-4 text-sm font-mono">
                              <span 
                                className="break-all cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                onClick={(e) => copyNomor(memo.nomor, e)}
                                title="Click to copy"
                              >
                                {memo.nomor}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                              <div className="max-w-56">
                                <div className={`break-words ${isExpanded ? '' : 'line-clamp-2'}`}>
                                  {memo.kepada}
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
                                {memo.perihal}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center justify-between max-w-48">
                                <div className="flex-1 min-w-0">
                                  <div className={`break-words ${isExpanded ? '' : 'line-clamp-2'}`}>
                                    {memo.pembuat}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => toggleRowExpansion(memo.id, e)}
                                  className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
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
        </div>

        {/* New Memo Modal */}
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
