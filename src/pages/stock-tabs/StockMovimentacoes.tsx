import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Search, Filter, Calendar, FileSpreadsheet, Layers, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { MovementHistoryModal } from '../../components/MovementHistoryModal';
import * as XLSX from 'xlsx';

export const StockMovimentacoes = () => {
    const { movimentacoes, skus, produtos } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedRef, setSelectedRef] = useState<string | null>(null);

    // Filter Logic
    const filteredMovs = useMemo(() => {
        return movimentacoes.filter(m => {
            const movDate = new Date(m.dataMovimentacao);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && movDate < start) return false;
            if (end) {
                end.setHours(23, 59, 59);
                if (movDate > end) return false;
            }

            if (searchTerm) {
                const sku = skus.find(s => s.id === m.skuId);
                const term = searchTerm.toLowerCase();
                const refMatch = sku?.produto?.referencia.toLowerCase().includes(term);
                const docMatch = m.referenciaDocumento?.toLowerCase().includes(term);
                if (!refMatch && !docMatch) return false;
            }

            return true;
        });
    }, [movimentacoes, skus, searchTerm, startDate, endDate]);

    // Grouping Logic
    const groupedByRef = useMemo(() => {
        const groups: Record<string, {
            referencia: string;
            descricao: string;
            totalEntradas: number;
            totalSaidas: number;
            saldoPeriodo: number;
            movs: typeof movimentacoes
        }> = {};

        filteredMovs.forEach(m => {
            const sku = skus.find(s => s.id === m.skuId);
            if (!sku || !sku.produto) return;

            const ref = sku.produto.referencia;

            if (!groups[ref]) {
                groups[ref] = {
                    referencia: ref,
                    descricao: sku.produto.descricao,
                    totalEntradas: 0,
                    totalSaidas: 0,
                    saldoPeriodo: 0,
                    movs: []
                };
            }

            groups[ref].movs.push(m);

            if (m.tipo.includes('ENTRADA') || (m.tipo === 'AJUSTE' && m.quantidade > 0)) {
                groups[ref].totalEntradas += m.quantidade;
                groups[ref].saldoPeriodo += m.quantidade;
            } else if (m.tipo.includes('SAIDA') || (m.tipo === 'AJUSTE' && m.quantidade < 0)) {
                groups[ref].totalSaidas += Math.abs(m.quantidade);
                groups[ref].saldoPeriodo -= Math.abs(m.quantidade);
            }
        });

        return Object.values(groups).sort((a, b) => b.movs.length - a.movs.length);
    }, [filteredMovs, skus]);

    // Export Logic (All Filtered Data)
    const handleExportGlobal = () => {
        const data = filteredMovs.map(m => {
            const sku = skus.find(s => s.id === m.skuId);
            return {
                'Data': new Date(m.dataMovimentacao).toLocaleDateString(),
                'Referência': sku?.produto?.referencia,
                'Produto': sku?.produto?.descricao,
                'Cor': sku?.cor?.nome,
                'Tamanho': sku?.tamanho?.nome,
                'Tipo': m.tipo,
                'Quantidade': m.quantidade,
                'Observação': m.observacao || '-'
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Relatorio_Geral");
        XLSX.writeFile(wb, `Relatorio_Movimentacoes_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <History className="text-brand-cyan" /> Histórico de Movimentações
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Visualize e audite todas as entradas e saídas do estoque.
                    </p>
                </div>
                <button
                    onClick={handleExportGlobal}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold uppercase text-sm transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <FileSpreadsheet size={18} /> Exportar Relatório
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Buscar</label>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-cyan transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por Referência ou Documento..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-cyan transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">De</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-cyan transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Até</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-cyan transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Grouped List */}
            <div className="grid gap-4">
                {groupedByRef.map((group) => (
                    <motion.div
                        key={group.referencia}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedRef(group.referencia)}
                        className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-5 hover:bg-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="text-brand-cyan" />
                        </div>

                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-brand-cyan">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        {group.referencia}
                                    </h3>
                                    <p className="text-slate-400 text-sm">{group.descricao}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {group.movs.length} movimentações no período
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-xs uppercase font-bold text-slate-500">Entradas</div>
                                    <div className="text-emerald-400 font-mono font-bold text-lg">+{group.totalEntradas}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs uppercase font-bold text-slate-500">Saídas</div>
                                    <div className="text-rose-400 font-mono font-bold text-lg">-{group.totalSaidas}</div>
                                </div>
                                <div className="text-right pl-6 border-l border-slate-800">
                                    <div className="text-xs uppercase font-bold text-slate-500">Saldo Período</div>
                                    <div className={`font-mono font-bold text-xl ${group.saldoPeriodo >= 0 ? 'text-brand-cyan' : 'text-amber-500'}`}>
                                        {group.saldoPeriodo > 0 ? '+' : ''}{group.saldoPeriodo}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {groupedByRef.length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                        Nenhuma movimentação encontrada para os filtros selecionados.
                    </div>
                )}
            </div>

            {/* Modal Detail */}
            {selectedRef && (
                <MovementHistoryModal
                    isOpen={!!selectedRef}
                    onClose={() => setSelectedRef(null)}
                    referencia={selectedRef}
                    descricao={groupedByRef.find(g => g.referencia === selectedRef)?.descricao || ''}
                    movimentacoes={groupedByRef.find(g => g.referencia === selectedRef)?.movs || []}
                    skus={skus}
                />
            )}
        </div>
    );
};
