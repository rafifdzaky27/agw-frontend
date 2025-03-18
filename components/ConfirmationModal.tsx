// components/ConfirmationModal.tsx
import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message?: string;
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

export default ConfirmationModal;