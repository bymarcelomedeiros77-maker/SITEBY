import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Search, Filter, Download, FileText, ChevronRight, Star, ShoppingBag, Users as UsersIcon, Clock, Calendar, CheckCircle2, XCircle, TrendingUp, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Purchases = () => {
    const { clientes, colecoes, comprasCampanha, addToast } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('ALL');
    const [purchaseFilter, setPurchaseFilter] = useState<'ALL' | 'COMPROU' | 'NAO_COMPROU'>('ALL');

    const filteredColecoes = useMemo(() => colecoes || [], [colecoes]);

    const tableData = useMemo(() => {
        if (!clientes) return [];

        let data = clientes.map(cliente => {
            const compras = (comprasCampanha || []).filter(c =>
                c.clienteId === cliente.id &&
                (selectedCollectionId === 'ALL' || c.colecaoId === selectedCollectionId)
            );

            const comprou = compras.length > 0;
            const totalPecas = compras.reduce((acc, curr) => acc + curr.quantidade, 0);
            const valorTotal = compras.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);
            const referencias = compras.map(c => c.referencia).join(', ');

            return {
                ...cliente,
                comprou,
                qtdCompras: compras.length,
                totalPecas,
                valorTotal,
                referencias,
                comprasDetalhes: compras
            };
        });

        if (purchaseFilter === 'COMPROU') data = data.filter(d => d.comprou);
        if (purchaseFilter === 'NAO_COMPROU') data = data.filter(d => !d.comprou);

        if (searchTerm) {
            data = data.filter(d =>
                d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.contato.includes(searchTerm)
            );
        }

        return data.sort((a, b) => b.valorTotal - a.valorTotal);
    }, [clientes, comprasCampanha, selectedCollectionId, purchaseFilter, searchTerm]);

    const stats = useMemo(() => {
        const compramCount = tableData.filter(d => d.comprou).length;
        const totalPecas = tableData.reduce((acc, curr) => acc + curr.totalPecas, 0);
        const totalValor = tableData.reduce((acc, curr) => acc + curr.valorTotal, 0);
        const calcAvg = compramCount > 0 ? (totalPecas / compramCount).toFixed(1) : '0';

        return {
            totalClientes: tableData.length,
            compraram: compramCount,
            naoCompraram: tableData.length - compramCount,
            totalPecas,
            totalValor,
            mediaPecas: calcAvg
        };
    }, [tableData]);

    const exportToExcel = () => {
        const collectionName = selectedCollectionId === 'ALL' ? 'Todas' : (colecoes.find(c => c.id === selectedCollectionId)?.nome || 'Colecao');
        const data = tableData.map(d => ({
            Cliente: d.nome,
            Status: d.comprou ? 'Comprou' : 'Não Comprou',
            'Qtd Itens': d.totalPecas,
            'Valor Total': d.valorTotal,
            Referências: d.referencias,
            Contato: d.contato,
            Cidade: d.cidade,
            Categoria: d.categoria
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Compras Realizadas");
        XLSX.writeFile(wb, `compras_colecao_${collectionName.replace(/\s+/g, '_')}.xlsx`);
        addToast('success', 'Excel exportado com sucesso!');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const collectionName = selectedCollectionId === 'ALL' ? 'Todas as Coleções' : (colecoes.find(c => c.id === selectedCollectionId)?.nome || 'Coleção');

        doc.setFontSize(18);
        doc.setTextColor(34, 211, 238); // Brand Cyan
        doc.text('Relatório de Compras por Coleção', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text(`Coleção: ${collectionName}`, 14, 28);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 34);

        const rows = tableData.map(d => [
            d.nome,
            d.comprou ? 'Comprou' : 'Não Comprou',
            d.totalPecas,
            d.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            d.contato,
            d.cidade
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Cliente', 'Status', 'Peças', 'Total', 'Contato', 'Cidade']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [34, 211, 238], textColor: [15, 23, 42] },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        doc.save(`Compras_${collectionName.replace(/\s+/g, '_')}.pdf`);
        addToast('success', 'PDF gerado com sucesso!');
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ShoppingCart className="text-brand-cyan" /> Compras Realizadas
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Análise de vendas e conversão por coleções/lançamentos.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors border border-slate-700 font-bold uppercase text-[10px] tracking-widest"
                    >
                        <Download size={16} />
                        <span>Exportar Excel</span>
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors border border-slate-700 font-bold uppercase text-[10px] tracking-widest"
                    >
                        <FileText size={16} />
                        <span>Download PDF</span>
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="T. Clientes" value={stats.totalClientes} icon={<UsersIcon size={20} />} color="text-slate-400" />
                <StatCard label="Compraram" value={stats.compraram} subValue={`${stats.totalClientes > 0 ? ((stats.compraram / stats.totalClientes) * 100).toFixed(0) : 0}%`} icon={<ShoppingBag size={20} />} color="text-brand-cyan" />
                <StatCard label="T. Peças" value={stats.totalPecas} subValue={`${stats.mediaPecas}/cli`} icon={<Package size={20} />} color="text-emerald-400" />
                <StatCard label="Valor Total" value={stats.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<TrendingUp size={20} />} color="text-indigo-400" />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/80 backdrop-blur-md">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou contato..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all placeholder:text-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800">
                    <button
                        onClick={() => setPurchaseFilter('ALL')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${purchaseFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setPurchaseFilter('COMPROU')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${purchaseFilter === 'COMPROU' ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Comprou
                    </button>
                    <button
                        onClick={() => setPurchaseFilter('NAO_COMPROU')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${purchaseFilter === 'NAO_COMPROU' ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Ausentes
                    </button>
                </div>

                <div className="flex gap-4">
                    <select
                        className="bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all appearance-none min-w-[180px]"
                        value={selectedCollectionId}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                    >
                        <option value="ALL">Todas as Coleções</option>
                        {filteredColecoes.map(c => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden bg-slate-900/20 rounded-[2rem] border border-slate-800/50 backdrop-blur-sm flex flex-col shadow-2xl">
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-950 z-20">
                            <tr className="border-b border-slate-800/50">
                                <th className="px-6 py-5 text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">Cliente</th>
                                <th className="px-6 py-5 text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">Status</th>
                                <th className="px-6 py-5 text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">Resumo Compras</th>
                                <th className="px-6 py-5 text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] text-right">Total Acumulado</th>
                                <th className="px-6 py-5 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {tableData.map((d) => (
                                <tr key={d.id} className="group hover:bg-slate-800/30 transition-all duration-300">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-200 group-hover:text-brand-cyan transition-colors">{d.nome}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-2">
                                            <Clock size={10} className="text-slate-700" />
                                            {d.contato}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {d.comprou ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20 uppercase tracking-widest">
                                                <CheckCircle2 size={12} /> Realizada
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/50 text-slate-500 text-[9px] font-bold border border-slate-800 uppercase tracking-widest">
                                                <XCircle size={12} /> Sem Compra
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-white font-mono text-xs font-bold">{d.totalPecas} <span className="text-[9px] text-slate-500 uppercase">Peças</span></div>
                                        <div className="text-[10px] text-slate-500 truncate max-w-[250px] mt-1 italic">{d.referencias || '—'}</div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="text-white font-bold font-mono group-hover:text-emerald-400 transition-colors">
                                            {d.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button className="p-2.5 text-slate-700 hover:text-brand-cyan hover:bg-brand-cyan/10 rounded-xl transition-all">
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, subValue, icon, color }: { label: string, value: any, subValue?: string, icon: any, color: string }) => (
    <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/80 backdrop-blur-md relative overflow-hidden group">
        <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-10 transition-opacity duration-700 group-hover:opacity-20 ${color.replace('text-', 'bg-')}`}></div>
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl bg-slate-950/50 border border-slate-800 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] ${color}`}>
                {icon}
            </div>
            {subValue && <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-800/50 px-2 py-1 rounded-lg">{subValue}</span>}
        </div>
        <div className="text-slate-500 text-[9px] uppercase font-bold tracking-[0.2em] mb-1">{label}</div>
        <div className="text-2xl font-black text-white tracking-tight font-mono">{value}</div>
    </div>
);
