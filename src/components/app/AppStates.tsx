import React from 'react';
import LoginPage from '../auth/components/LoginPage';
import ForcePasswordResetModal from '../auth/modals/ForcePasswordResetModal';

export const AppLoadingState: React.FC = () => (
    <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
);

interface AppLoginStateProps {
    showPopup: (message: string) => void;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    isReady: boolean;
    authError: string | null;
    clearAuthError: () => void;
}

export const AppLoginState: React.FC<AppLoginStateProps> = ({
    showPopup,
    setIsLoading,
    isReady,
    authError,
    clearAuthError,
}) => (
    <div className="min-h-screen w-full bg-transparent text-gray-800 dark:text-gray-200 flex transition-colors duration-500 items-center justify-center">
        <LoginPage
            showPopup={showPopup}
            setIsLoading={setIsLoading}
            isReady={isReady}
            authError={authError}
            clearAuthError={clearAuthError}
        />
    </div>
);

interface AppForceResetStateProps {
    isOpen: boolean;
    onSave: (newPassword: string) => Promise<boolean>;
}

export const AppForceResetState: React.FC<AppForceResetStateProps> = ({ isOpen, onSave }) => (
    <div className="min-h-screen w-full bg-transparent text-gray-800 dark:text-gray-200 flex transition-colors duration-500 relative">
        <ForcePasswordResetModal isOpen={isOpen} onSave={onSave} />
    </div>
);
