import { useState, useRef, useCallback } from 'react';

export interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export interface ConfirmState extends ConfirmOptions {
    isOpen: boolean;
    onConfirm: () => void;
}

export const useConfirm = () => {
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'danger',
        onConfirm: () => { }
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setConfirmState({
                isOpen: true,
                ...options,
                onConfirm: () => {
                    if (resolveRef.current) {
                        resolveRef.current(true);
                        resolveRef.current = null;
                    }
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                }
            });
        });
    }, []);

    const closeDialog = useCallback(() => {
        if (resolveRef.current) {
            resolveRef.current(false);
            resolveRef.current = null;
        }
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        confirm,
        confirmState,
        closeDialog
    };
};
