import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
    message: string;
    type: NotificationType;
    onClose: () => void;
}

export const Notification = ({ message, type, onClose }: NotificationProps) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-green-950/90 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]',
        error: 'bg-red-950/90 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        info: 'bg-blue-950/90 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
    };

    const icons = {
        success: <CheckCircle className="text-brand-green" size={24} />,
        error: <AlertCircle className="text-red-400" size={24} />,
        info: <Info className="text-brand-cyan" size={24} />
    };

    const titles = {
        success: 'SUCESSO',
        error: 'ERRO',
        info: 'INFORMAÇÃO'
    };

    return (
        <div className={`fixed top-6 right-6 z-[100] flex items-start gap-4 p-4 rounded-lg border border-l-4 min-w-[320px] max-w-[400px] animate-in slide-in-from-right fade-in duration-300 backdrop-blur-md ${styles[type]}`}>
            <div className="mt-0.5 shrink-0">{icons[type]}</div>
            <div className="flex-1">
                <p className={`font-bold text-xs uppercase tracking-widest mb-1 ${type === 'success' ? 'text-brand-green' : type === 'error' ? 'text-red-400' : 'text-brand-cyan'}`}>
                    {titles[type]}
                </p>
                <p className="text-sm font-medium leading-relaxed opacity-90">{message}</p>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors shrink-0">
                <X size={18} />
            </button>
        </div>
    );
};
