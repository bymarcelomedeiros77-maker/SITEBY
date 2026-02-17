import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownLeft, ArrowUpRight, RefreshCcw, FileSpreadsheet, Calendar } from 'lucide-react';
import { MovimentacaoEstoque, Sku } from '../types';
import * as XLSX from 'xlsx';

interface MovementHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    referencia: string;
    descricao: string;
    movimentacoes: MovimentacaoEstoque[];
    skus: Sku[];
}

export const MovementHistoryModal: React.FC<MovementHistoryModalProps> = ({
    isOpen,
    onClose,
    referencia,
    descricao,
    movimentacoes,
    skus
}) => {
    // Sort logic: Most recent first
    const sortedMovs = [...movimentacoes].sort((a, b) =>
        new Date(b.dataMovimentacao).getTime() - new Date(a.dataMovimentacao).getTime()
    );

    // Helpers
    const getIcon = (tipo: string) => {
        if (tipo.includes('ENTRADA')) return <ArrowDownLeft className="text-emerald-500" size={16} />;
        if (tipo.includes('SAIDA')) return <ArrowUpRight className="text-rose-500" size={16} />;
        return <RefreshCcw className="text-amber-500" size={16} />;
    };

    const formatTipo = (tipo: string) => tipo.replace(/_/g, ' ');

    const handleExportExcel = () => {
        const data = sortedMovs.map(m => {
            const sku = skus.find(s => s.id === m.skuId);
            return {
                'Data/Hora': new Date(m.dataMovimentacao).toLocaleString(),
                'Tipo': formatTipo(m.tipo),
                'Referência': referencia,
                'Cor': sku?.cor?.nome || '-',
                'Tamanho': sku?.tamanho?.nome || '-',
                'Quantidade': m.quantidade,
                'Usuário': m.usuarioId || 'Sistema',
                'Documento': m.referenciaDocumento || '-',
                'Observação': m.observacao || '-'
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Movimentações");
        XLSX.writeFile(wb, `Historico_${referencia}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-slate-950 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/50 rounded-t-2xl">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="text-brand-cyan">#{referencia}</span>
                                <span className="text-slate-500 font-normal text-lg">— {descricao}</span>
                            </h2>
                            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                <Calendar size={14} /> Total de {movimentacoes.length} movimentações neste período
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-bold uppercase"
                            >
                                <FileSpreadsheet size={16} /> Exportar Excel
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-auto p-0">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 sticky top-0 z-10 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="p-4 border-b border-slate-800">Data</th>
                                    <th className="p-4 border-b border-slate-800">Tipo</th>
                                    <th className="p-4 border-b border-slate-800">SKU (Cor/Tam)</th>
                                    <th className="p-4 border-b border-slate-800 text-right">Qtd</th>
                                    <th className="p-4 border-b border-slate-800">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {sortedMovs.map(mov => {
                                    const sku = skus.find(s => s.id === mov.skuId);
                                    const isPositive = mov.quantidade > 0 && !mov.tipo.includes('SAIDA');

                                    return (
                                        <tr key={mov.id} className="hover:bg-slate-900/30 transition-colors">
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="font-bold text-white">
                                                    {new Date(mov.dataMovimentacao).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    {new Date(mov.dataMovimentacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${mov.tipo.includes('ENTRADA') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        mov.tipo.includes('SAIDA') ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    }`}>
                                                    {getIcon(mov.tipo)}
                                                    {formatTipo(mov.tipo)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sku?.cor?.hex || '#333' }}></span>
                                                    <span className="text-white font-medium">{sku?.cor?.nome}</span>
                                                    <span className="text-slate-600">/</span>
                                                    <span className="bg-slate-800 px-1.5 rounded text-white text-xs">{sku?.tamanho?.nome}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`text-lg font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}>
                                                    {isPositive ? '+' : ''}{mov.quantidade}
                                                </span>
                                            </td>
                                            <td className="p-4 max-w-[200px]">
                                                {mov.referenciaDocumento && (
                                                    <div className="text-xs text-brand-cyan mb-1 font-mono bg-brand-cyan/5 px-1 rounded inline-block">
                                                        Doc: {mov.referenciaDocumento}
                                                    </div>
                                                )}
                                                {mov.observacao && (
                                                    <div className="text-xs truncate" title={mov.observacao}>
                                                        {mov.observacao}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-800 bg-slate-900/30 rounded-b-2xl flex justify-between items-center text-xs text-slate-500">
                        <span>Mostrando {sortedMovs.length} registros</span>
                        <span>Dica: Use os filtros na tela principal para refinar este período.</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};
