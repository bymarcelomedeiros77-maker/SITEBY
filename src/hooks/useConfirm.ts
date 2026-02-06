import { useState } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
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

    const confirm = (options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                ...options,
                onConfirm: () => {
                    resolve(true);
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                }
            });

            // Handle cancel
            const handleCancel = () => {
                resolve(false);
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            };

            // Store cancel handler
            (setConfirmState as any).cancel = handleCancel;
        });
    };

    const closeDialog = () => {
        if ((setConfirmState as any).cancel) {
            (setConfirmState as any).cancel();
        } else {
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
    };

    return {
        confirm,
        confirmState,
        closeDialog
    };
};
