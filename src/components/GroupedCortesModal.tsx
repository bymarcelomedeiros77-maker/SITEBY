import React from 'react';
import { Corte, CorteStatus } from '../types';
import { X, Package, Calendar, AlertCircle, CheckCircle, Clock, ChevronRight, History, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GroupedCortesModalProps {
    isOpen: boolean;
    onClose: () => void;
    faccaoName: string;
    cortes: Corte[];
    onReceive: (corteId: string) => void;
    onViewHistory: (corteId: string) => void;
    onSyncStock: (corteId: string) => void;
}

export const GroupedCortesModal: React.FC<GroupedCortesModalProps> = ({
    isOpen,
    onClose,
    faccaoName,
    cortes,
    onReceive,
    onViewHistory,
    onSyncStock
}) => {
    if (!isOpen) return null;

    const renderStatus = (status: CorteStatus) => {
        switch (status) {
            case CorteStatus.ENVIADO: return <span className="text-blue-400 bg-blue-900/40 border border-blue-800 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono shadow-[0_0_5px_rgba(59,130,246,0.3)]">ENVIADO</span>;
            case CorteStatus.RECEBIDO: return <span className="text-nexus-green bg-green-900/40 border border-green-800 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono shadow-[0_0_5px_rgba(16,185,129,0.3)]">RECEBIDO</span>;
            default: return <span className="text-yellow-500 bg-yellow-900/40 border border-yellow-800 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono">PENDENTE</span>;
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                    className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl rounded-lg flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-700 bg-slate-950/50 flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Package className="text-nexus-cyan" /> {faccaoName}
                            </h2>
                            <p className="text-nexus-cyan text-xs font-mono mt-1">
                                {cortes.length} CORTES ENCONTRADOS
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-4">
                            {cortes.map((corte) => (
                                <div key={corte.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded hover:border-nexus-cyan transition-colors group">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">

                                        {/* Info Column */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between md:justify-start gap-3">
                                                <span className="text-nexus-cyan font-bold text-lg">REF: {corte.referencia}</span>
                                                {renderStatus(corte.status)}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs mt-2">
                                                <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                                    <span className="block text-slate-500 uppercase font-bold text-[10px]">Envio</span>
                                                    <span className="text-white font-mono">{new Date(corte.dataEnvio).toLocaleDateString()}</span>
                                                </div>
                                                <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                                    <span className="block text-slate-500 uppercase font-bold text-[10px]">Qtd Enviada</span>
                                                    <span className="text-white font-mono text-sm">{corte.qtdTotalEnviada}</span>
                                                </div>
                                                <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                                    <span className="block text-slate-500 uppercase font-bold text-[10px]">Qtd Recebida</span>
                                                    <span className={`font-mono text-sm ${corte.qtdTotalRecebida > 0 ? 'text-nexus-green' : 'text-slate-500'}`}>
                                                        {corte.qtdTotalRecebida || '-'}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                                    <span className="block text-slate-500 uppercase font-bold text-[10px]">Defeitos</span>
                                                    <span className={`font-mono text-sm ${corte.qtdTotalDefeitos > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                                        {corte.qtdTotalDefeitos || '-'}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                                    <span className="block text-slate-500 uppercase font-bold text-[10px]">Peças Boas</span>
                                                    <span className={`font-mono text-sm ${(corte.qtdTotalRecebida || 0) - (corte.qtdTotalDefeitos || 0) > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                                                        {(corte.qtdTotalRecebida || 0) - (corte.qtdTotalDefeitos || 0)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Cores e Grades:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {corte.itens.map((item, idx) => (
                                                        <span key={idx} className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[10px] text-slate-300">
                                                            {item.cor} ({item.quantidadeTotalCor})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Column */}
                                        <div className="flex md:flex-col items-center justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-4 mt-2 md:mt-0">
                                            {corte.status === CorteStatus.ENVIADO && (
                                                <button
                                                    onClick={() => onReceive(corte.id)}
                                                    className="w-full bg-nexus-cyan text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:bg-blue-400 transition-colors"
                                                >
                                                    Receber <ChevronRight size={14} />
                                                </button>
                                            )}
                                            {corte.status === CorteStatus.RECEBIDO && (
                                                <button
                                                    onClick={() => onSyncStock(corte.id)}
                                                    className="w-full text-amber-500 hover:text-amber-400 hover:bg-amber-950/30 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-amber-900/30 transition-colors"
                                                >
                                                    <RefreshCw size={14} /> Sync Estoque
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onViewHistory(corte.id)}
                                                className="w-full text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                                            >
                                                <History size={14} /> Histórico
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700 bg-slate-950/50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
