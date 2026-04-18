import React, { useEffect } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { modalOverlay } from '@/components/common/styles/ui';

interface ConfirmActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonText?: string;
    confirmButtonClassName?: string;
    cancelButtonText?: string;
    icon: React.ReactNode;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm,
    title,
    message,
    confirmButtonText,
    confirmButtonClassName,
    cancelButtonText,
    icon
}) => {
    const { t } = useTranslation();
    
    // This effect handles the 'Escape' key press to close the modal.
    // It runs whenever the `isOpen` prop changes.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        
        // The cleanup function removes the event listener when the modal closes or the component unmounts.
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const finalCancelButtonText = cancelButtonText || t('cancel');

    return (
        <div 
            className={`${modalOverlay} z-[60] p-4 ${isOpen ? 'flex items-center justify-center animate-fade-in' : 'hidden'}`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="action-modal-title"
            aria-hidden={!isOpen}
        >
            <div 
                className={`bg-gray-500/30 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100 animate-fade-in-scale' : 'scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {icon}

                <h2 id="action-modal-title" className="text-xl sm:text-2xl font-bold text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.4)'}}>
                    {title}
                </h2>

                <p className="mt-3 text-sm sm:text-base text-white/90" style={{textShadow: '0 1px 3px rgba(0,0,0,0.4)'}}>
                    {message}
                </p>

                <div className="mt-6 sm:mt-8">
                     {confirmButtonText ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <button 
                                onClick={onClose}
                                className="px-4 py-2.5 bg-gray-600/80 text-white text-sm font-semibold rounded-xl hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 focus:ring-offset-gray-900"
                            >
                                {finalCancelButtonText}
                            </button>
                            <button 
                                onClick={onConfirm}
                                className={`px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg ${confirmButtonClassName}`}
                            >
                                {confirmButtonText}
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <button 
                                onClick={onClose}
                                className="w-full sm:w-auto sm:min-w-[120px] px-4 py-2.5 bg-gray-600/80 text-white text-sm font-semibold rounded-xl hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 focus:ring-offset-gray-900"
                            >
                                {finalCancelButtonText}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.2s ease-out forwards;
                    animation-delay: 0.05s;
                }
            `}</style>
        </div>
    );
};

export default ConfirmActionModal;
