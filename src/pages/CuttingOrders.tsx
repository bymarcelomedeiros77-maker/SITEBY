import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RegraConsumo } from '../types';
import {
    Scissors, AlertCircle, CheckCircle2, Ruler,
    FileSpreadsheet, Download, Filter, Search,
    ArrowUpDown, ChevronRight, Package, Box, Plus, Eye,
    Brain, TextQuote, Info, Trash2, Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { RegraConsumoModal } from '../components/RegraConsumoModal';
import { ViewRegrasModal } from '../components/ViewRegrasModal';
import { useCuttingStock } from '../hooks/useCuttingStock';

export const CuttingOrders = () => {
    const { skus, producao, regrasConsumo, updateStatusProducao, deleteRegraConsumo, confirm } = useApp();

    // Tabs
    const [activeTab, setActiveTab] = useState<'PLANNING' | 'ENGINEERING'>('PLANNING');

    // Custom Hook for Planning Logic
    const {
        aggregatedStock,
        plannedOps,
        filteredStock,
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType
    } = useCuttingStock({ skus, producao });

    // Engineering State
    const [ruleSearchTerm, setRuleSearchTerm] = useState('');

    // Modals
    const [isRegraModalOpen, setIsRegraModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [selectedReferencia, setSelectedReferencia] = useState<string>('');
    const [editingRegra, setEditingRegra] = useState<RegraConsumo | undefined>(undefined);

    // --- Engineering Logic ---
    const filteredRegras = regrasConsumo.filter(r =>
        r.referencia.toLowerCase().includes(ruleSearchTerm.toLowerCase())
    );

    // --- Handlers ---
    const handleExportExcel = (ref: string) => {
        const stockData = aggregatedStock.find(s => s.referencia === ref);
        if (!stockData) return;

        const rules = regrasConsumo.filter(r => r.referencia === ref);

        const data = stockData.itens.map(sku => {
            const rule = rules.find(r => r.tamanhoId === sku.tamanhoId) || rules.find(r => !r.tamanhoId);
            const consumo = rule?.consumoUnitario || 0;
            const metaReposicao = (sku.estoqueAlvo - sku.saldoDisponivel);
            const qttToCut = metaReposicao > 0 ? metaReposicao : 0;

            return {
                'Referência': ref,
                'Cor': sku.cor?.nome || '-',
                'Tamanho': sku.tamanho?.nome || '-',
                'Estoque Atual': sku.saldoDisponivel,
                'Estoque Alvo': sku.estoqueAlvo,
                'Necessidade de Corte': qttToCut,
                'Consumo Unit. (m)': consumo,
                'Total Tecido (m)': (qttToCut * consumo).toFixed(2),
                'Tecido': rule?.tecidoNome || '-',
                'Acessórios': rule?.acessorios || '-'
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plano de Corte");
        XLSX.writeFile(wb, `Plano_Corte_${ref}.xlsx`);
    };

    const handleOpenRegraModal = (ref: string, regra?: RegraConsumo) => {
        setSelectedReferencia(ref);
        setEditingRegra(regra);
        setIsRegraModalOpen(true);
    };

    const handleCloseRegraModal = () => {
        setIsRegraModalOpen(false);
        setSelectedReferencia('');
        setEditingRegra(undefined);
    };

    const handleOpenViewModal = (ref: string) => {
        setSelectedReferencia(ref);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedReferencia('');
    };

    const handleEditRegra = (regra: RegraConsumo) => {
        setIsViewModalOpen(false);
        handleOpenRegraModal(regra.referencia, regra);
    };

    const handleDeleteRegra = async (id: string) => {
        const confirmed = await confirm({
            title: 'Excluir Regra',
            message: 'Deseja realmente excluir esta regra de consumo?',
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (confirmed) {
            await deleteRegraConsumo(id);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-cyan/20 rounded-2xl">
                            <Scissors className="text-brand-cyan" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white uppercase tracking-widest">Ordem de Cortes</h1>
                            <p className="text-slate-500 text-sm">Planejamento de estoque e engenharia de produto.</p>
                        </div>
                    </div>
                    {/* Global Actions can go here */}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('PLANNING')}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'PLANNING' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Planejamento de Corte
                    </button>
                    <button
                        onClick={() => setActiveTab('ENGINEERING')}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ENGINEERING' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Brain size={16} /> Cérebro de Consumo (Engenharia)
                    </button>
                </div>
            </header>

            {/* TAB CONTENT: PLANNING */}
            {activeTab === 'PLANNING' && (
                <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {plannedOps.length > 0 && (
                        <section className="bg-brand-cyan/10 border border-brand-cyan/30 rounded-3xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-cyan/20 rounded-full flex items-center justify-center text-brand-cyan animate-pulse">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-cyan uppercase text-xs">Atenção: Ordens de Produção Pendentes</h3>
                                    <p className="text-slate-400 text-[11px]">Você possui {plannedOps.length} ordens marcadas como 'PLANEJADO' no estoque guardando corte.</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan text-[10px] font-bold uppercase rounded-lg transition-all">
                                Ver Ordens
                            </button>
                        </section>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Filtros de Estoque</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setFilterType('ALL')}
                                        className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${filterType === 'ALL' ? 'bg-brand-cyan/10 border-brand-cyan/50 text-brand-cyan' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                    >
                                        <span className="text-xs font-bold uppercase">Geral</span>
                                        <span className="text-sm font-bold">{aggregatedStock.length}</span>
                                    </button>
                                    <button
                                        onClick={() => setFilterType('LOW')}
                                        className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${filterType === 'LOW' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                    >
                                        <span className="text-xs font-bold uppercase">Estoques Baixos</span>
                                        <span className="text-sm font-bold">{aggregatedStock.filter(s => s.status === 'LOW').length}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 opacity-5 -rotate-12 translate-x-4">
                                    <Scissors size={100} />
                                </div>
                                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4">Resumo da Central</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase mb-1">Tecido Necessário (Estimado)</p>
                                        <p className="text-xl font-bold text-white">450.5m</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase mb-1">Refs Para Reposição</p>
                                        <p className="text-xl font-bold text-white">{aggregatedStock.filter(s => s.status === 'LOW').length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-white uppercase">Status de Estoque por Referência</h2>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Ref..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-brand-cyan/50 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                                {filteredStock.map(refStock => {
                                    const rulesCount = regrasConsumo.filter(r => r.referencia === refStock.referencia).length;

                                    return (
                                        <div
                                            key={refStock.referencia}
                                            className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${refStock.status === 'LOW' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                                        {refStock.status === 'LOW' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-bold text-white">{refStock.referencia}</h3>
                                                            {refStock.status === 'LOW' && (
                                                                <span className="text-[10px] font-bold text-red-500 uppercase px-2 py-0.5 bg-red-500/10 rounded border border-red-500/20 animate-pulse">
                                                                    Abaixo do Mínimo
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                                                            {refStock.totalDisponivel} un. no estoque / Alvo: {refStock.totalAlvo} un.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right mr-4">
                                                        <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-1 flex items-center justify-end gap-1">
                                                            <Ruler size={10} /> Consumo
                                                        </p>
                                                        <p className={`text-xs font-bold ${rulesCount > 0 ? 'text-brand-cyan' : 'text-slate-600'}`}>
                                                            {rulesCount > 0 ? `${rulesCount} Regras` : 'Sem Regras'}
                                                        </p>
                                                    </div>

                                                    {rulesCount > 0 && (
                                                        <button
                                                            onClick={() => handleOpenViewModal(refStock.referencia)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-bold uppercase transition-all"
                                                        >
                                                            <Eye size={14} /> Visualizar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleExportExcel(refStock.referencia)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-bold uppercase transition-all"
                                                    >
                                                        <Download size={14} /> Gerar Plano
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mt-4 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${Math.min((refStock.totalDisponivel / refStock.totalAlvo) * 100, 100)}%` }}
                                                    className={`h-full transition-all duration-500 ${refStock.status === 'LOW' ? 'bg-red-500' : 'bg-green-500'}`}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: ENGINEERING (FORMER CONSUMPTION BRAIN) */}
            {activeTab === 'ENGINEERING' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Main Content */}
                    <div className="xl:col-span-2 flex flex-col gap-6 overflow-hidden">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-white uppercase">Regras & Fichas Técnicas</h2>
                                    <p className="text-xs text-slate-500">Gerencie o consumo, insumos e acessórios de cada referência</p>
                                </div>
                                <button
                                    onClick={() => handleOpenRegraModal('')}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-slate-950 rounded-lg font-bold uppercase text-xs hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/10"
                                >
                                    <Plus size={16} /> Nova Regra
                                </button>
                            </div>

                            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col flex-1">
                                <div className="p-4 border-b border-slate-800 relative">
                                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Procurar pela referência..."
                                        value={ruleSearchTerm}
                                        onChange={e => setRuleSearchTerm(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-brand-cyan/50 outline-none"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-slate-950 z-10">
                                            <tr className="border-b border-slate-800">
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Referência</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tamanho</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consumo (M)</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tecido Principal</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acessórios</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {filteredRegras.map(regra => (
                                                <tr key={regra.id} className="hover:bg-slate-900/40 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-white">{regra.referencia}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {regra.tamanho ? (
                                                            <span className="px-2 py-0.5 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 rounded text-[10px] font-bold">
                                                                {regra.tamanho.nome}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-600 text-[10px]">Todos</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs text-brand-cyan font-mono">
                                                            <Ruler size={12} />
                                                            {regra.consumoUnitario.toFixed(2)}m
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-slate-300">{regra.tecidoNome || '-'}</span>
                                                            <span className="text-[10px] text-slate-600">{regra.tecidoComposicao || ''}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${regra.acessorios ? 'text-green-500' : 'text-slate-600'}`}>
                                                            {regra.acessorios ? '✓ Cadastrado' : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleOpenViewModal(regra.referencia)}
                                                                className="p-2 bg-slate-900 text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-all"
                                                                title="Visualizar"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenRegraModal(regra.referencia, regra)}
                                                                className="p-2 bg-slate-900 text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-all"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRegra(regra.id)}
                                                                className="p-2 bg-slate-900 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Brain size={120} />
                            </div>
                            <h3 className="text-lg font-bold mb-2 uppercase">Ficha Técnica Dinâmica</h3>
                            <p className="text-sm text-indigo-100/80 leading-relaxed mb-4">
                                Os dados inseridos aqui (Fornecedor, Composição, Acessórios e Custos) alimentam automaticamente o dashboard de compras e o cálculo de custo por peça.
                            </p>
                            <div className="bg-indigo-900/40 rounded-2xl p-4 border border-indigo-400/20">
                                <div className="flex items-start gap-3">
                                    <Info size={18} className="text-indigo-200 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-indigo-100 uppercase mb-1">Dica do Sistema:</p>
                                        <p className="text-[11px] text-indigo-100/70">Não esqueça de adicionar os acessórios (botões, zíperes) para ter uma visão completa do produto.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <TextQuote size={14} /> Resumo de Cadastro
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-xl">
                                    <span className="text-xs text-slate-400 uppercase">Total Refs</span>
                                    <span className="text-lg font-bold text-brand-cyan">{new Set(regrasConsumo.map(r => r.referencia)).size}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-xl">
                                    <span className="text-xs text-slate-400 uppercase">Fornecedores</span>
                                    <span className="text-lg font-bold text-white">{new Set(regrasConsumo.filter(r => r.tecidoFornecedor).map(r => r.tecidoFornecedor)).size}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <RegraConsumoModal
                isOpen={isRegraModalOpen}
                onClose={handleCloseRegraModal}
                initialReferencia={selectedReferencia}
                initialData={editingRegra}
            />
            <ViewRegrasModal
                isOpen={isViewModalOpen}
                onClose={handleCloseViewModal}
                referencia={selectedReferencia}
                regras={regrasConsumo.filter(r => r.referencia === selectedReferencia)}
                onEdit={handleEditRegra}
                onDelete={handleDeleteRegra}
            />
        </div>
    );
};
