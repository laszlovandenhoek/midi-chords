import { useState, useCallback, useEffect } from 'react';

const calculateViewSize = () => ({
    outerWidth: Math.floor(window.innerWidth - 10),
    outerHeight: Math.floor(Math.min((window.innerWidth - 10) / 4, window.innerHeight - 200))
});

export function useWindowSize() {
    const [viewSize, setViewSize] = useState(calculateViewSize());

    const onResize = useCallback(() => {
        setViewSize(calculateViewSize());
    }, []);

    useEffect(() => {
        window.addEventListener('resize', onResize, false);
        onResize();
        return () => window.removeEventListener('resize', onResize);
    }, [onResize]);

    return viewSize;
} 