"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaSave, FaMoneyBillWave, FaCalendarAlt } from "react-icons/fa";
import toast from "react-hot-toast";

interface PaymentTerm {
  id: string;
  termin: string;
  nominal: number;
  description: string;
  status: 'Belum Dibayar' | 'Sudah Dibayar' | 'Checking Umum' | 'Menunggu Posting' | 'Sirkulir IT';
  paymentDate?: string;
  budget?: 'Capex' | 'Opex';
  notes?: string;
  // New fields for Non-Procurement Opex breakdown
  opexCabang?: number;
  opexPusat?: number;
}

interface AddEditBillModalProps {
  bill?: PaymentTerm | null; // Changed from undefined to null to match usage
  projectId: string;
  existingBillsCount: number;
  onSave: (billData: PaymentTerm) => void;
  onClose: () => void;
}

export default function AddEditBillModal({ bill, projectId, existingBillsCount, onSave, onClose }: AddEditBillModalProps) {
  const isEditMode = !!bill;
  
  const [formData, setFormData] = useState({
    billName: bill?.termin || `Bill ${existingBillsCount + 1}`,
    amount: bill?.nominal?.toString() || '',
    status: bill?.status || 'Belum Dibayar',
    paymentDate: bill?.paymentDate || '',
    notes: bill?.notes || '',
    opexCabang: bill?.opexCabang?.toString() || '',
    opexPusat: bill?.opexPusat?.toString() || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { value: 'Belum Dibayar', label: 'Belum Dibayar' },
    { value: 'Sirkulir IT', label: 'Sirkulir IT' },
    { value: 'Checking Umum', label: 'Checking Umum' },
    { value: 'Menunggu Posting', label: 'Menunggu Posting' },
    { value: 'Sudah Dibayar', label: 'Sudah Dibayar' }
    
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Auto-calculate total amount when Opex amounts change
  useEffect(() => {
    if (formData.status === 'Sudah Dibayar' && formData.opexCabang && formData.opexPusat) {
      const cabang = parseFloat(formData.opexCabang) || 0;
      const pusat = parseFloat(formData.opexPusat) || 0;
      const total = cabang + pusat;
      
      setFormData(prev => ({
        ...prev,
        amount: total.toString()
      }));
    }
  }, [formData.opexCabang, formData.opexPusat, formData.status]);

  const validateForm = () => {
    if (!formData.billName.trim()) {
      toast.error("Bill name is required");
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }
    
    if (formData.status === 'Sudah Dibayar') {
      if (!formData.paymentDate) {
        toast.error("Payment date is required when status is 'Sudah Dibayar'");
        return false;
      }
      
      if (!formData.opexCabang || parseFloat(formData.opexCabang) <= 0) {
        toast.error("Amount (Opex Cabang) is required when status is 'Sudah Dibayar'");
        return false;
      }
      
      if (!formData.opexPusat || parseFloat(formData.opexPusat) <= 0) {
        toast.error("Amount (Opex Pusat) is required when status is 'Sudah Dibayar'");
        return false;
      }

      // Validate that Opex amounts sum to total amount
      const cabang = parseFloat(formData.opexCabang);
      const pusat = parseFloat(formData.opexPusat);
      const total = parseFloat(formData.amount);
      
      if (Math.abs((cabang + pusat) - total) > 0.01) {
        toast.error("Opex Cabang + Opex Pusat must equal the total amount");
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const billData: PaymentTerm = {
        id: bill?.id || `bill_${projectId}_${Date.now()}`,
        termin: formData.billName.trim(),
        nominal: parseFloat(formData.amount),
        description: `Non-procurement billing: ${formData.billName}`,
        status: formData.status as PaymentTerm['status'],
        paymentDate: formData.status === 'Sudah Dibayar' ? formData.paymentDate : undefined,
        budget: 'Opex', // Fixed to Opex for Non-Procurement
        notes: formData.notes.trim(),
        opexCabang: formData.status === 'Sudah Dibayar' ? parseFloat(formData.opexCabang) : undefined,
        opexPusat: formData.status === 'Sudah Dibayar' ? parseFloat(formData.opexPusat) : undefined
      };

      onSave(billData);
    } catch (error) {
      console.error("Error saving bill:", error);
      toast.error("Failed to save bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return '';
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return amount;
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numericAmount);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FaMoneyBillWave className="text-green-600 dark:text-green-400" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Bill' : 'Add New Bill'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isEditMode ? `Editing: ${bill?.termin}` : `Creating: ${formData.billName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bill Information */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                {isEditMode ? 'Bill Information' : 'New Bill Information'}
              </h3>
              <div className="text-sm text-green-700 dark:text-green-300">
                <p><strong>Project Type:</strong> Non-Procurement</p>
                <p><strong>Budget Type:</strong> Opex (Fixed)</p>
                {!isEditMode && <p className="mt-2 text-xs">You can update the status and payment details after creating the bill.</p>}
              </div>
            </div>

            {/* Bill Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bill Name *
              </label>
              <input
                type="text"
                name="billName"
                value={formData.billName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter bill name (e.g., Bill 1, Development Milestone)"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  Rp
                </span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  readOnly={formData.status === 'Sudah Dibayar' && (formData.opexCabang || formData.opexPusat)}
                />
              </div>
              {formData.amount && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Preview: {formatCurrency(formData.amount)}
                </p>
              )}
              {formData.status === 'Sudah Dibayar' && (formData.opexCabang || formData.opexPusat) && (
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  Amount is auto-calculated from Opex breakdown below
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                required
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Date - Only when status is 'Sudah Dibayar' */}
            {formData.status === 'Sudah Dibayar' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Date *
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            )}

            {/* Budget Breakdown - Only when status is 'Sudah Dibayar' */}
            {formData.status === 'Sudah Dibayar' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Budget Breakdown (Opex)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount (Opex Cabang) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (Opex Cabang) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        name="opexCabang"
                        value={formData.opexCabang}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    {formData.opexCabang && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(formData.opexCabang)}
                      </p>
                    )}
                  </div>

                  {/* Amount (Opex Pusat) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (Opex Pusat) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        name="opexPusat"
                        value={formData.opexPusat}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    {formData.opexPusat && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(formData.opexPusat)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total Calculation */}
                {formData.opexCabang && formData.opexPusat && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency((parseFloat(formData.opexCabang) + parseFloat(formData.opexPusat)).toString())}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Add any additional notes or comments..."
              />
            </div>
          </form>
        </div>

        {/* Footer - Always visible */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave size={14} />
                {isEditMode ? 'Update Bill' : 'Create Bill'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
