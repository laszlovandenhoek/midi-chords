import { useEffect } from 'react';

export function useWakeLock() {

    useEffect(() => {

        let wakeLock = null;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                releaseWakeLock();
            } else {
                requestWakeLock();
            }
        };

        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.error(`Failed to request Wake Lock: ${err.name}, ${err.message}`);
                }
            } else {
                console.warn('Wake Lock API not supported');
            }
        };
    
        const releaseWakeLock = async () => {
            if (wakeLock !== null) {
                try {
                    await wakeLock.release();
                    wakeLock = null;
                } catch (err) {
                    console.error(`Failed to release Wake Lock: ${err.name}, ${err.message}`);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', requestWakeLock);
        window.addEventListener('blur', releaseWakeLock);
        requestWakeLock();

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', requestWakeLock);
            window.removeEventListener('blur', releaseWakeLock);
            releaseWakeLock();
        };
    }, []);

} 