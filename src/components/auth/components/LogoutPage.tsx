




import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/contexts/LanguageContext';
import { IMAGE_LINKS } from '@/config/imageLinks';

interface LogoutPageProps {
    onLoginAgain: () => void;
}

const LogoutPage: React.FC<LogoutPageProps> = ({ onLoginAgain }) => {
    const { t } = useTranslation();
    const [countdown, setCountdown] = useState(5);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (countdown <= 0) {
            onLoginAgain();
            return;
        }

        timerRef.current = setTimeout(() => {
            setCountdown(countdown - 1);
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [countdown, onLoginAgain]);
    
    const handleLoginAgainClick = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        onLoginAgain();
    };

    return (
        <div className="flex flex-col items-center justify-center text-center">
             <div className="w-full max-w-sm p-8 rounded-2xl shadow-2xl backdrop-blur-xl dark:backdrop-blur-sm bg-white/40 dark:bg-black/60 border border-white/30 dark:border-white/10 flex flex-col items-center">
                <Image
                  src={IMAGE_LINKS.branding.defaultAvatar}
                  alt="Toto Face"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-contain drop-shadow-2xl mb-4"
                />
                <h1 className="text-2xl font-bold text-[#004097] dark:text-white text-floating">{t('logoutSuccessTitle')}</h1>
                <p className="mt-2 text-[#004097]/90 dark:text-white/80 text-floating">{t('logoutSuccessMessage')}</p>
                
                <p className="mt-6 text-sm text-[#004097]/80 dark:text-white/80 text-floating">
                    {t('redirectingMessage', { countdown })}
                </p>

                <button
                    onClick={handleLoginAgainClick}
                    className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800"
                >
                    {t('loginAgain')}
                </button>
            </div>
        </div>
    );
};

export default LogoutPage;
