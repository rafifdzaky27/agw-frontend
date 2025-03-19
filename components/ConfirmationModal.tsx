// components/ConfirmationModal.tsx
import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa'; // Import Font Awesome

interface MigrationHistory {
    id: number;
    change_request_id: number;
    migration_date: string;
    status: string;
    pending_reason: string;
    recorded_at: string;
}

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message?: string;
}

interface PendingModalProps {
    isOpen: boolean;
    onConfirm: (selectedDate: string, pending_reason: string) => void;
    onCancel: () => void;
}

interface PreviousMigrationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    history?: MigrationHistory[]; // Accept migration history data
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, message = "Are you sure you want to proceed?" }) => {
    return (
        <div className={`fixed top-0 left-0 w-full h-full bg-gray-600 bg-opacity-50 overflow-y-auto flex items-start justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ paddingTop: '10vh' }}>
            <div className={`relative p-5 border w-96 shadow-lg rounded-md bg-white transition-transform duration-300 ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Confirmation</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500">{message}</p>
                </div>
                <div className="flex justify-center items-center px-4 py-3 mt-4"> {/* Centered buttons */}
                    <button
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

const PendingModal: React.FC<PendingModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [pendingReason, setPendingReason] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setSelectedDate('');
            setPendingReason('');
        }
    }, [isOpen]);

    return (
        <div className={`fixed top-0 left-0 w-full h-full bg-gray-600 bg-opacity-50 overflow-y-auto flex items-start justify-center transition-opacity duration-300 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ paddingTop: '10vh' }}>
            <div className={`relative p-5 border w-96 shadow-lg rounded-md bg-white transition-transform duration-300 ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Pending Request</h3>
                <div className="mt-2">
                    <label className="block text-sm text-gray-500">New Migration Date</label>
                    <input 
                        type="date" 
                        className="p-2 border rounded w-full mt-1" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        placeholder="Select a date"
                    />
                </div>
                <div className="mt-2">
                    <label className="block text-sm text-gray-500">Pending Reason</label>
                    <textarea
                        className="p-2 border rounded w-full mt-1"
                        placeholder="Enter pending reason"
                        value={pendingReason}
                        onChange={(e) => setPendingReason(e.target.value)}
                    />
                </div>
                <div className="flex justify-center items-center px-4 mt-4">
                    <button
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
                        onClick={() => onConfirm(selectedDate, pendingReason)}
                        disabled={!selectedDate || !pendingReason} // Prevent confirming without a date and reason
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

const PreviousMigrationsModal: React.FC<PreviousMigrationsModalProps> = ({ isOpen, onClose, history = [] }) => {
    // Sort history by recorded_at (latest first)
    const sortedHistory = [...history].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );

    return (
        <div
            className={`fixed top-0 left-0 w-full h-full bg-gray-600 bg-opacity-50 flex items-center justify-center transition-opacity duration-300 z-50 
                ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-h-[80vh] overflow-y-auto relative">
                {/* Left Arrow Button on Top Left */}
                <button
                    className="absolute top-3 left-3 text-white bg-red-500 p-2 rounded-full hover:bg-red-700 transition"
                    onClick={onClose}
                    title="Close"
                >
                    <FaArrowLeft className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold mb-4 text-center">Scheduled Migrations</h2>

                {/* Show Migration History */}
                {sortedHistory.length > 0 ? (
                    <ul className="space-y-2">
                        {sortedHistory.map((entry, index) => {
                            const isLatest = index === 0;
                            
                            // Determine status color and text
                            let statusColor = "text-gray-600";
                            let statusText = "⚪ Unknown";
                            if (entry.status === "success") {
                                statusColor = "text-green-600";
                                statusText = "🟢 Success";
                            } else if (entry.status === "failed") {
                                statusColor = "text-red-600";
                                statusText = "🔴 Failed";
                            } else if (entry.status === "pending") {
                                statusColor = "text-purple-600";
                                statusText = "🟣 Pending";
                            }

                            return (
                                <li
                                    key={entry.id}
                                    className={`p-4 border rounded-md bg-gray-100 relative ${
                                        isLatest ? 'border-2 border-blue-500' : ''
                                    }`}
                                >
                                    {isLatest && (
                                        <span className="absolute top-1 right-2 text-xs text-blue-500 font-semibold">
                                            Latest
                                        </span>
                                    )}
                                    <p className="text-md">
                                        <strong>Date:</strong>{' '}
                                        {new Date(entry.migration_date).toLocaleString()}
                                    </p>
                                    {/* Show status only for the latest migration */}
                                    {isLatest && (
                                        <p className={`text-md font-semibold ${statusColor}`}>
                                            Status: {statusText}
                                        </p>
                                    )}
                                    {/* Show Pending Reason for non-latest pending migrations */}
                                    {!isLatest && entry.status === "pending" && entry.pending_reason && (
                                        <p className="text-sm text-gray-500">
                                            <strong>Pending Reason:</strong> {entry.pending_reason}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        <strong>Recorded At:</strong>{' '}
                                        {new Date(entry.recorded_at).toLocaleString()}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center">No Migrations Scheduled.</p>
                )}
            </div>
        </div>
    );
};

export { ConfirmationModal, PendingModal, PreviousMigrationsModal };