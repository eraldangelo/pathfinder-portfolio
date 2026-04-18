import { useEffect, useState } from 'react';

export const useAppReady = (isLoading: boolean) => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => setIsReady(true), 100);
            return () => clearTimeout(timer);
        }
        setIsReady(false);
    }, [isLoading]);

    return { isReady, setIsReady };
};
