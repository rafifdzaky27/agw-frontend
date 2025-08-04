"use client";

import { useState } from "react";
import { FaTimes, FaSave, FaCalendarAlt } from "react-icons/fa";
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
}

interface UpdatePaymentModalProps {
  term: PaymentTerm;
  projectType: 'internal development' | 'procurement' | 'non procurement';
  onSave: (term: PaymentTerm) => Promise<void>;
  onClose: () => void;
}

export default function UpdatePaymentModal({ term, projectType, onSave, onClose }: UpdatePaymentModalProps) {
  const [formData, setFormData] = useState({
    status: term.status,
    paymentDate: term.paymentDate || '',
    budget: term.budget || 'Capex',
    notes: term.notes || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic terminology based on project type
  const isNonProcurement = projectType === 'non procurement';
  const termLabel = isNonProcurement ? 'Bill' : 'Term';
  const actionLabel = isNonProcurement ? 'Billing' : 'Payment';
  const dateLabel = isNonProcurement ? 'Billing Date' : 'Payment Date';
  const statusLabel = isNonProcurement ? 'Billing Status' : 'Payment Status';

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

  const handleRadioChange = (value: 'Capex' | 'Opex') => {
    setFormData(prev => ({
      ...prev,
      budget: value
    }));
  };

  const validateForm = () => {
    if (!formData.status) {
      toast.error(`${statusLabel} is required`);
      return false;
    }
    
    if (formData.status === 'Sudah Dibayar' && !formData.paymentDate) {
      toast.error(`${dateLabel} is required when status is 'Sudah Dibayar'`);
      return false;
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
      const updatedTerm: PaymentTerm = {
        ...term,
        status: formData.status as PaymentTerm['status'],
        paymentDate: formData.status === 'Sudah Dibayar' ? formData.paymentDate : undefined,
        budget: formData.status === 'Sudah Dibayar' ? (formData.budget as 'Capex' | 'Opex') : undefined,
        notes: formData.notes.trim()
      };

      await onSave(updatedTerm);
      onClose();
      // Remove duplicate toast - parent component will handle success notification
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Update {actionLabel} Status
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {term.termin} - {formatCurrency(term.nominal)}
            </p>
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
            {/* Payment Term Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">{termLabel} Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">{termLabel}:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{term.termin}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{formatCurrency(term.nominal)}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500 dark:text-gray-400">{isNonProcurement ? 'Description:' : 'Requirements:'}</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{term.description}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {statusLabel} *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment/Billing Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {dateLabel} {formData.status === 'Sudah Dibayar' && '*'}
              </label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  disabled={formData.status !== 'Sudah Dibayar'}
                  className={`w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    formData.status !== 'Sudah Dibayar' ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                  }`}
                  required={formData.status === 'Sudah Dibayar'}
                />
              </div>
              {formData.status !== 'Sudah Dibayar' && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {dateLabel} is only required when status is "Sudah Dibayar"
                </p>
              )}
            </div>

            {/* Budget Type - Only show when status is 'Sudah Dibayar' */}
            {formData.status === 'Sudah Dibayar' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Budget Type *
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="budget"
                      value="Capex"
                      checked={formData.budget === 'Capex'}
                      onChange={() => handleRadioChange('Capex')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">Capex</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="budget"
                      value="Opex"
                      checked={formData.budget === 'Opex'}
                      onChange={() => handleRadioChange('Opex')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">Opex</span>
                  </label>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Add any additional notes or comments..."
              />
            </div>

            {/* Status Change Info */}
            {formData.status !== term.status && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Status Change
                    </h4>
                    <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      <p>Status will be changed from <strong>"{term.status}"</strong> to <strong>"{formData.status}"</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
