import { useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/ToastNotification';

let toastIdCounter = 0;

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
        const id = `toast-${++toastIdCounter}`;
        const newToast: Toast = { id, type, message, duration };

        setToasts((prev) => [...prev, newToast]);

        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message: string, duration?: number) => {
        return addToast('success', message, duration);
    }, [addToast]);

    const showError = useCallback((message: string, duration?: number) => {
        return addToast('error', message, duration);
    }, [addToast]);

    const showWarning = useCallback((message: string, duration?: number) => {
        return addToast('warning', message, duration);
    }, [addToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        return addToast('info', message, duration);
    }, [addToast]);

    return {
        toasts,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
    };
};
