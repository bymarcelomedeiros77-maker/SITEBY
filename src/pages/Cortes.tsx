import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Corte, CorteStatus, FaccaoStatus, TamanhoQuantidade, ItemCorte, DefectType, UserRole } from '../types';
import { Plus, Search, Filter, AlertCircle, CheckCircle, Package, ArrowRight, Save, Download, History, X, Trash2, Layers, ChevronRight, ArrowLeft, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Notification, NotificationType } from '../components/Notification';
import { calculateExpectedDelivery, formatDate } from '../utils/dateUtils';
import { FaccoesReferencias } from './FaccoesReferencias';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

export const Cortes = () => {
    const { faccoes, cortes, defectTypes, logs, addCorte, updateCorte, deleteCorte, user: currentUser } = useApp();
    const { confirm, confirmState, closeDialog } = useConfirm();
    const [activeTab, setActiveTab] = useState<'LIST' | 'SEND' | 'RECEIVE' | 'FACCOES_REF' | 'HISTORICO'>('LIST');
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // History Filters
    const [historyStartDate, setHistoryStartDate] = useState('');
    const [historyEndDate, setHistoryEndDate] = useState('');

    // Notifications
    const [notification, setNotification] = useState<{ message: string, type: NotificationType } | null>(null);

    // History Modal
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyCorteId, setHistoryCorteId] = useState<string | null>(null);

    // --- SEND FORM STATE ---
    interface TempItem {
        id: number;
        cor: string;
        grade: TamanhoQuantidade[];
    }

    const initialSendState = {
        referencia: '',
        faccaoId: '',
        dataEnvio: new Date().toISOString().split('T')[0],
        observacoes: ''
    };

    const [sendForm, setSendForm] = useState(initialSendState);

    // Calculate expected delivery date automatically
    const [dataPrevista, setDataPrevista] = useState(calculateExpectedDelivery(sendForm.dataEnvio));

    // Update expected delivery when send date changes
    useEffect(() => {
        if (sendForm.dataEnvio) {
            setDataPrevista(calculateExpectedDelivery(sendForm.dataEnvio));
        }
    }, [sendForm.dataEnvio]);

    const [sendItems, setSendItems] = useState<TempItem[]>([
        {
            id: Date.now(),
            cor: '',
            grade: [{ tamanho: 'P', quantidade: 0 }, { tamanho: 'M', quantidade: 0 }, { tamanho: 'G', quantidade: 0 }, { tamanho: 'GG', quantidade: 0 }]
        }
    ]);

    // --- RECEIVE FORM STATE ---
    interface ManualDefect {
        id: number;
        name: string;
        qty: number;
    }

    const [selectedCorteId, setSelectedCorteId] = useState<string>('');
    const [receiveForm, setReceiveForm] = useState({
        dataRecebimento: new Date().toISOString().split('T')[0],
        qtdRecebida: 0,
        observacoes: '',
        standardDefects: {} as Record<string, number>, // Type ID -> Count
    });
    const [manualDefects, setManualDefects] = useState<ManualDefect[]>([]);

    // Group defects by category
    const defectsByCategory = defectTypes.reduce((acc, defect) => {
        if (!acc[defect.category]) {
            acc[defect.category] = [];
        }
        acc[defect.category].push(defect);
        return acc;
    }, {} as Record<string, DefectType[]>);

    const [receiveDefectsBreakdown, setReceiveDefectsBreakdown] = useState<Record<string, number>>({});

    // Filtered Cortes for History Tab
    const filteredHistoryCortes = useMemo(() => {
        let filtered = [...cortes];

        if (historyStartDate) {
            filtered = filtered.filter(c =>
                new Date(c.dataEnvio) >= new Date(historyStartDate)
            );
        }

        if (historyEndDate) {
            filtered = filtered.filter(c =>
                new Date(c.dataEnvio) <= new Date(historyEndDate)
            );
        }

        // Sort by send date (newest first)
        return filtered.sort((a, b) =>
            new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
        );
    }, [cortes, historyStartDate, historyEndDate]);

    const handleDeleteCorte = async (corteId: string, referencia: string) => {
        const confirmed = await confirm({
            title: 'Confirmar Exclusão de Corte',
            message: `Tem certeza que deseja excluir o corte "${referencia}"? Todos os dados relacionados serão perdidos e esta ação não pode ser desfeita.`,
            confirmText: 'Sim, Excluir',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            await deleteCorte(corteId);
            setNotification({ message: `Corte ${referencia} excluído com sucesso!`, type: 'success' });
        }
    };

    const exportHistoryToExcel = () => {
        const data = filteredHistoryCortes.map(corte => {
            const faccao = faccoes.find(f => f.id === corte.faccaoId)?.name || 'Desconhecida';
            const defectPercent = corte.qtdTotalRecebida > 0
                ? ((corte.qtdTotalDefeitos / corte.qtdTotalRecebida) * 100).toFixed(2)
                : '0';

            return {
                'Referência': corte.referencia,
                'Facção': faccao,
                'Data Envio': formatDate(corte.dataEnvio),
                'Data Prevista': corte.dataPrevistaRecebimento ? formatDate(corte.dataPrevistaRecebimento) : '-',
                'Data Recebimento': corte.dataRecebimento ? formatDate(corte.dataRecebimento) : '-',
                'Status': corte.status,
                'Qtd Enviada': corte.qtdTotalEnviada,
                'Qtd Recebida': corte.qtdTotalRecebida,
                'Defeitos': corte.qtdTotalDefeitos,
                '% Defeitos': `${defectPercent}%`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Histórico');

        const startLabel = historyStartDate || 'Inicio';
        const endLabel = historyEndDate || 'Hoje';
        const filename = `Historico_${startLabel}_${endLabel}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const [activeDefectCategory, setActiveDefectCategory] = useState<string>('');

    // Set initial category when defects are loaded
    React.useEffect(() => {
        const categories = Object.keys(defectsByCategory);
        if (categories.length > 0 && !activeDefectCategory) {
            setActiveDefectCategory(categories[0]);
        }
    }, [defectTypes, activeDefectCategory]);

    // --- EXPORT FUNCTION ---
    const handleExport = () => {
        const data = filteredCortes.map(c => ({
            Referencia: c.referencia,
            Faccao: faccoes.find(f => f.id === c.faccaoId)?.name,
            Status: c.status,
            DataEnvio: c.dataEnvio,
            Enviado: c.qtdTotalEnviada,
            Recebido: c.qtdTotalRecebida || 0,
            Defeitos: c.qtdTotalDefeitos || 0
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cortes");
        XLSX.writeFile(wb, "cortes_bymarcelo.xlsx");
    };

    // --- SEND HANDLERS ---
    const addColorItem = () => {
        setSendItems([...sendItems, {
            id: Date.now(),
            cor: '',
            grade: [{ tamanho: 'P', quantidade: 0 }, { tamanho: 'M', quantidade: 0 }, { tamanho: 'G', quantidade: 0 }, { tamanho: 'GG', quantidade: 0 }]
        }]);
    };

    const removeColorItem = (id: number) => {
        if (sendItems.length > 1) {
            setSendItems(sendItems.filter(i => i.id !== id));
        }
    };

    const updateColorItem = (id: number, field: 'cor', value: string) => {
        setSendItems(sendItems.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const updateGradeItem = (itemId: number, tamanhoIdx: number, value: number) => {
        const newItems = [...sendItems];
        const itemIndex = newItems.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            newItems[itemIndex].grade[tamanhoIdx].quantidade = value;
            setSendItems(newItems);
        }
    };

    const handleSendSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!sendForm.referencia.trim()) {
            setNotification({ message: "Erro: A referência é obrigatória.", type: 'error' });
            return;
        }

        // Validation removed: User specifically requested to allow duplicate references
        // for same or different factions.
        // if (cortes.some(c => c.referencia.trim().toLowerCase() === sendForm.referencia.trim().toLowerCase())) { ... }

        const finalItens: ItemCorte[] = sendItems.map(i => ({
            cor: i.cor,
            grade: i.grade.map(g => ({ ...g, quantidade: Number(g.quantidade) })),
            quantidadeTotalCor: i.grade.reduce((a, b) => a + Number(b.quantidade), 0)
        }));

        const totalQtd = finalItens.reduce((a, b) => a + b.quantidadeTotalCor, 0);

        if (totalQtd === 0) {
            setNotification({ message: "A quantidade total deve ser maior que zero.", type: 'error' });
            return;
        }

        const newCorte: Corte = {
            id: Date.now().toString(),
            referencia: sendForm.referencia,
            faccaoId: sendForm.faccaoId,
            dataEnvio: sendForm.dataEnvio,
            dataPrevistaRecebimento: dataPrevista,
            status: CorteStatus.ENVIADO,
            itens: finalItens,
            qtdTotalEnviada: totalQtd,
            observacoesEnvio: sendForm.observacoes,
            qtdTotalRecebida: 0,
            qtdTotalDefeitos: 0,
            defeitosPorTipo: {}
        };

        addCorte(newCorte);
        setSendForm(initialSendState);
        setDataPrevista(calculateExpectedDelivery(new Date().toISOString().split('T')[0]));
        setSendItems([{
            id: Date.now(),
            cor: '',
            grade: [{ tamanho: 'P', quantidade: 0 }, { tamanho: 'M', quantidade: 0 }, { tamanho: 'G', quantidade: 0 }, { tamanho: 'GG', quantidade: 0 }]
        }]);
        setNotification({ message: "Corte enviado com sucesso!", type: 'success' });
        setActiveTab('LIST');
    };

    // --- RECEIVE HANDLERS ---
    const addManualDefect = () => {
        setManualDefects([...manualDefects, { id: Date.now(), name: '', qty: 0 }]);
    };

    const removeManualDefect = (id: number) => {
        setManualDefects(manualDefects.filter(d => d.id !== id));
    };

    const handleReceiveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const corte = cortes.find(c => c.id === selectedCorteId);
        if (!corte) return;

        const qtdRecebidaNum = Number(receiveForm.qtdRecebida);
        if (qtdRecebidaNum > corte.qtdTotalEnviada) {
            setNotification({ message: `Erro: A quantidade recebida (${qtdRecebidaNum}) não pode ser maior que a quantidade enviada (${corte.qtdTotalEnviada}).`, type: 'error' });
            return;
        }

        const combinedDefects: Record<string, number> = { ...receiveForm.standardDefects };
        manualDefects.forEach(d => {
            if (d.name.trim() && d.qty > 0) {
                combinedDefects[d.name] = (combinedDefects[d.name] || 0) + Number(d.qty);
            }
        });

        const totalDefeitos = Object.values(combinedDefects).reduce((a: number, b) => a + Number(b), 0) as number;

        if (totalDefeitos > qtdRecebidaNum) {
            setNotification({ message: "Erro: A quantidade de defeitos não pode ser maior que a quantidade recebida.", type: 'error' });
            return;
        }

        const updatedCorte: Corte = {
            ...corte,
            status: CorteStatus.RECEBIDO,
            dataRecebimento: receiveForm.dataRecebimento,
            qtdTotalRecebida: qtdRecebidaNum,
            qtdTotalDefeitos: totalDefeitos,
            defeitosPorTipo: combinedDefects,
            observacoesRecebimento: receiveForm.observacoes
        };

        updateCorte(updatedCorte);
        setSelectedCorteId('');
        setReceiveForm({
            dataRecebimento: new Date().toISOString().split('T')[0],
            qtdRecebida: 0,
            observacoes: '',
            standardDefects: {}
        });
        setManualDefects([]);
        setNotification({ message: "Recebimento registrado com sucesso!", type: 'success' });
        setActiveTab('LIST');
    };

    // --- RENDER HELPERS ---

    const renderStatus = (status: CorteStatus) => {
        switch (status) {
            case CorteStatus.ENVIADO: return <span className="text-blue-400 bg-blue-900/40 border border-blue-800 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono shadow-[0_0_5px_rgba(59,130,246,0.3)]">ENVIADO</span>;
            case CorteStatus.RECEBIDO: return <span className="text-nexus-green bg-green-900/40 border border-green-800 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono shadow-[0_0_5px_rgba(16,185,129,0.3)]">RECEBIDO</span>;
            default: return <span className="text-yellow-500 bg-yellow-900/40 border border-yellow-800 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono">PENDENTE</span>;
        }
    };

    const filteredCortes = cortes.filter(c => {
        const matchesSearch = c.referencia.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate = (!startDate || c.dataEnvio >= startDate) &&
            (!endDate || c.dataEnvio <= endDate);

        return matchesSearch && matchesDate;
    });

    const openHistory = (id: string) => {
        setHistoryCorteId(id);
        setIsHistoryOpen(true);
    };

    return (
        <div className="space-y-6">
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-wide uppercase">Controle de Cortes</h2>
                    <p className="text-nexus-cyan font-mono text-xs mt-1 tracking-widest">MÓDULO: CONTROLE DE CORTES // STATUS: ATIVO</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="bg-slate-900 border border-slate-700 text-slate-300 px-4 py-2 flex items-center gap-2 hover:bg-slate-800 hover:text-white transition-all uppercase text-xs font-bold tracking-wider hover:border-nexus-cyan">
                        <Download size={16} /> Exportar DB
                    </button>
                    <button
                        onClick={() => setActiveTab('SEND')}
                        className="bg-nexus-cyan text-black px-6 py-2 flex items-center gap-2 hover:bg-blue-400 transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)] uppercase text-xs font-bold tracking-wider clip-path-polygon"
                        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
                    >
                        <Plus size={16} />
                        Novo Envio
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 gap-1">
                {[
                    { id: 'LIST', label: 'Todos os Cortes' },
                    { id: 'SEND', label: 'Registrar Envio' },
                    { id: 'RECEIVE', label: 'Registrar Recebimento' },
                    { id: 'FACCOES_REF', label: 'Facções por Ref' },
                    { id: 'HISTORICO', label: 'Histórico' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-3 font-bold text-xs transition-all uppercase tracking-wider relative overflow-hidden group ${activeTab === tab.id ? 'text-nexus-cyan' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {/* Active Tab Indicator */}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-nexus-cyan shadow-[0_0_5px_#3b82f6]"></div>}

                        {/* Hover Background */}
                        <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>

                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* --- CONTENT: FACCOES_REF --- */}
            {activeTab === 'FACCOES_REF' && (
                <FaccoesReferencias />
            )}

            {/* --- CONTENT: LIST --- */}
            {activeTab === 'LIST' && (
                <>
                    {/* Filters Row */}
                    <div className="bg-slate-900/60 p-4 border-l-2 border-slate-700 mb-6 flex flex-col md:flex-row items-center gap-4 backdrop-blur-sm">
                        <div className="flex-1 flex items-center gap-2 w-full relative">
                            <Search className="text-slate-500 absolute left-3" size={18} />
                            <input
                                type="text"
                                placeholder="BUSCAR REFERÊNCIA..."
                                className="flex-1 bg-slate-950 border border-slate-800 pl-10 p-2 text-slate-200 focus:border-nexus-cyan focus:outline-none font-mono text-sm uppercase"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto bg-slate-950 p-2 border border-slate-800">
                            <span className="text-[10px] text-nexus-cyan font-bold uppercase tracking-wider">Período:</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-slate-400 text-xs focus:ring-0 outline-none font-mono uppercase"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-slate-600">-</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-slate-400 text-xs focus:ring-0 outline-none font-mono uppercase"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            {(startDate || endDate) && (
                                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-slate-500 hover:text-red-500">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="tech-card overflow-hidden bg-transparent border-0 shadow-none md:bg-slate-900/60 md:border md:border-slate-800 md:shadow-lg">

                        {/* MOBILE CARD VIEW */}
                        <div className="md:hidden space-y-4">
                            {filteredCortes.map(c => (
                                <div key={c.id} className="tech-card p-4 relative group border border-slate-800 bg-slate-900/80">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-nexus-cyan opacity-50 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="flex justify-between items-start mb-3 pl-3">
                                        <div>
                                            <span className="text-[10px] font-bold text-nexus-cyan uppercase tracking-wider block mb-1">REF: {c.referencia}</span>
                                            <h4 className="text-sm font-bold text-white uppercase">{faccoes.find(f => f.id === c.faccaoId)?.name}</h4>
                                        </div>
                                        {renderStatus(c.status)}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/50 mb-3 pl-3">
                                        <div className="text-center">
                                            <span className="block text-[9px] text-slate-500 uppercase font-bold">Envio</span>
                                            <span className="text-xs text-slate-300 font-mono">{new Date(c.dataEnvio).toLocaleDateString().split('/').slice(0, 2).join('/')}</span>
                                        </div>
                                        <div className="text-center border-x border-slate-800/50">
                                            <span className="block text-[9px] text-slate-500 uppercase font-bold">Qtd</span>
                                            <span className="text-xs text-white font-mono">{c.qtdTotalEnviada}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-[9px] text-slate-500 uppercase font-bold">Defeitos</span>
                                            <span className={`text-xs font-mono font-bold ${c.qtdTotalDefeitos > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                                                {c.qtdTotalDefeitos || '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pl-3">
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            {c.itens.length} Cores / {c.itens.reduce((acc, i) => acc + i.grade.length, 0)} Tamanhos
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => openHistory(c.id)}
                                                className="text-slate-500 hover:text-white p-2 bg-slate-950 rounded border border-slate-800"
                                            >
                                                <History size={16} />
                                            </button>
                                            {c.status === CorteStatus.ENVIADO && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedCorteId(c.id);
                                                        setActiveTab('RECEIVE');
                                                    }}
                                                    className="bg-nexus-cyan text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-blue-500/20"
                                                >
                                                    Receber
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredCortes.length === 0 && (
                                <div className="text-center py-10 border border-dashed border-slate-800 rounded bg-slate-900/50">
                                    <Package className="mx-auto mb-2 opacity-50 text-slate-500" size={32} />
                                    <p className="text-xs uppercase tracking-widest text-slate-500">Nenhum registro</p>
                                </div>
                            )}
                        </div>

                        {/* DESKTOP TABLE VIEW */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-nexus-cyan tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Ref.</th>
                                        <th className="px-6 py-4">Facção</th>
                                        <th className="px-6 py-4">Envio</th>
                                        <th className="px-6 py-4">Cores</th>
                                        <th className="px-6 py-4">Qtd. Enviada</th>
                                        <th className="px-6 py-4">Qtd. Recebida</th>
                                        <th className="px-6 py-4">Defeitos</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 font-mono">
                                    {filteredCortes.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group border-l-2 border-transparent hover:border-nexus-cyan">
                                            <td className="px-6 py-4 font-bold text-white">{c.referencia}</td>
                                            <td className="px-6 py-4 text-slate-300">{faccoes.find(f => f.id === c.faccaoId)?.name}</td>
                                            <td className="px-6 py-4">{new Date(c.dataEnvio).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {c.itens.map((i, idx) => (
                                                        <span key={idx} className="text-xs">{i.cor} ({i.quantidadeTotalCor})</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-white">{c.qtdTotalEnviada}</td>
                                            <td className="px-6 py-4">{c.qtdTotalRecebida > 0 ? <span className="text-nexus-green">{c.qtdTotalRecebida}</span> : '-'}</td>
                                            <td className="px-6 py-4">
                                                {c.qtdTotalDefeitos > 0 ? (
                                                    <span className="text-red-400 font-bold">{c.qtdTotalDefeitos}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">{renderStatus(c.status)}</td>
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                {c.status === CorteStatus.ENVIADO && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCorteId(c.id);
                                                            setActiveTab('RECEIVE');
                                                        }}
                                                        className="text-nexus-cyan hover:bg-nexus-cyan/10 px-2 py-1 rounded transition-colors text-xs uppercase font-bold flex items-center gap-1"
                                                    >
                                                        Receber <ChevronRight size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openHistory(c.id)}
                                                    className="text-slate-600 hover:text-white transition-colors p-1"
                                                    title="Ver Histórico"
                                                >
                                                    <History size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCortes.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center text-slate-600 border-dashed border-slate-800">
                                                <Package className="mx-auto mb-2 opacity-50" size={32} />
                                                <p className="text-xs uppercase tracking-widest">Nenhum registro localizado no banco de dados</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* --- CONTENT: SEND --- */}
            {activeTab === 'SEND' && (
                <div className="max-w-4xl mx-auto tech-card corner-cut p-8 relative overflow-hidden">

                    <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                            <Package className="text-nexus-cyan" /> Novo Envio de Corte
                        </h3>
                        <button
                            onClick={() => setActiveTab('LIST')}
                            className="text-slate-500 hover:text-nexus-cyan flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            <ArrowLeft size={16} /> Voltar
                        </button>
                    </div>

                    <form onSubmit={handleSendSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Referência</label>
                                <input required type="text" className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm"
                                    value={sendForm.referencia} onChange={e => setSendForm({ ...sendForm, referencia: e.target.value })} />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Facção</label>
                                <select required className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm"
                                    value={sendForm.faccaoId} onChange={e => setSendForm({ ...sendForm, faccaoId: e.target.value })}>
                                    <option value="">SELECIONE...</option>
                                    {faccoes.filter(f => f.status === FaccaoStatus.ATIVO).map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Data de Envio</label>
                                <input required type="date" className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm"
                                    value={sendForm.dataEnvio} onChange={e => setSendForm({ ...sendForm, dataEnvio: e.target.value })} />
                            </div>
                        </div>

                        {/* Expected Delivery Date Display */}
                        <div className="bg-blue-950/20 border border-blue-800/30 p-4 rounded">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-wider">📅 Data Prevista de Recebimento</label>
                                    <p className="text-lg font-bold text-white font-mono">{formatDate(dataPrevista)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase">Calculada Automaticamente</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {new Date(sendForm.dataEnvio).getDay() === 3 || new Date(sendForm.dataEnvio).getDay() === 4
                                            ? 'Envio em Qua/Qui → Próxima semana'
                                            : 'Prazo padrão: 7 dias'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                                <label className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide"><Layers size={16} className="text-nexus-cyan" /> Cores e Grades</label>
                                <button type="button" onClick={addColorItem} className="text-xs text-nexus-cyan hover:text-white font-bold uppercase flex items-center gap-1">
                                    <Plus size={14} /> Adicionar Cor
                                </button>
                            </div>

                            {sendItems.map((item, index) => (
                                <div key={item.id} className="bg-slate-900/50 p-4 border-l-2 border-slate-700 hover:border-nexus-cyan transition-colors relative group">
                                    <button type="button" onClick={() => removeColorItem(item.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                        <div className="md:col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cor</label>
                                            <input required type="text" placeholder="Ex: Azul Marinho" className="w-full p-2 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm"
                                                value={item.cor}
                                                onChange={(e) => updateColorItem(item.id, 'cor', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Grade (Qtd)</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {item.grade.map((g, gIdx) => (
                                                    <div key={gIdx} className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none">{g.tamanho}</span>
                                                        <input type="number" min="0" className="w-full pl-8 p-2 bg-slate-950 border border-slate-700 text-white text-right focus:border-nexus-cyan focus:outline-none font-mono text-sm"
                                                            value={g.quantidade}
                                                            onChange={(e) => updateGradeItem(item.id, gIdx, Number(e.target.value))}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-2 text-right text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                                Total Geral: <span className="text-nexus-cyan text-sm">{sendItems.reduce((acc, item) => acc + item.grade.reduce((a, b) => a + Number(b.quantidade), 0), 0)}</span> peças
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Observações</label>
                            <textarea className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm h-20 resize-none"
                                value={sendForm.observacoes} onChange={e => setSendForm({ ...sendForm, observacoes: e.target.value })} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button type="button" onClick={() => setActiveTab('LIST')} className="px-4 py-2 text-slate-500 hover:text-white hover:bg-slate-800 uppercase text-xs font-bold tracking-wider">Cancelar</button>
                            <button type="submit" className="px-6 py-2 bg-nexus-cyan text-black hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2 uppercase text-xs font-bold tracking-wider clip-path-polygon" style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}>
                                <Save size={16} /> Salvar Envio
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- CONTENT: RECEIVE --- */}
            {activeTab === 'RECEIVE' && (
                <div className="max-w-4xl mx-auto tech-card corner-cut p-8 relative overflow-hidden">

                    <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                            <CheckCircle className="text-nexus-green" /> Registrar Recebimento
                        </h3>
                        <button
                            onClick={() => setActiveTab('LIST')}
                            className="text-slate-500 hover:text-nexus-cyan flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            <ArrowLeft size={16} /> Voltar
                        </button>
                    </div>

                    <form onSubmit={handleReceiveSubmit} className="space-y-6">

                        <div>
                            <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Selecione o Corte Enviado</label>
                            <select required className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm"
                                value={selectedCorteId} onChange={e => setSelectedCorteId(e.target.value)}>
                                <option value="">SELECIONE...</option>
                                {cortes.filter(c => c.status === CorteStatus.ENVIADO).map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.referencia} - {faccoes.find(f => f.id === c.faccaoId)?.name} ({c.qtdTotalEnviada} un)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedCorteId && (
                            <>
                                {/* Info Display of Selected Corte */}
                                <div className="bg-slate-900/50 p-4 border-l-2 border-nexus-cyan">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Resumo do Envio</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {cortes.find(c => c.id === selectedCorteId)?.itens.map((item, idx) => (
                                            <div key={idx} className="bg-slate-950 p-2 border border-slate-800 text-xs">
                                                <span className="text-nexus-cyan font-bold block mb-1 uppercase">{item.cor}</span>
                                                <div className="flex gap-2 text-slate-400 font-mono">
                                                    {item.grade.map((g, gIdx) => (
                                                        <span key={gIdx}>{g.tamanho}: {g.quantidade}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Data Recebimento</label>
                                        <input required type="date" className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm"
                                            value={receiveForm.dataRecebimento} onChange={e => setReceiveForm({ ...receiveForm, dataRecebimento: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Total Recebido (Peças Boas + Defeitos)</label>
                                        <input required type="number" min="0" className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm"
                                            value={receiveForm.qtdRecebida} onChange={e => setReceiveForm({ ...receiveForm, qtdRecebida: Number(e.target.value) })} />
                                    </div>
                                </div>

                                <div className="bg-red-950/10 p-6 border border-red-900/30">
                                    <h4 className="font-bold text-red-400 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm"><AlertCircle size={16} /> Registro de Defeitos</h4>

                                    {/* Category Tabs */}
                                    <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-800 pb-2">
                                        {Object.keys(defectsByCategory).map(category => (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => setActiveDefectCategory(category)}
                                                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 ${activeDefectCategory === category
                                                    ? 'bg-nexus-cyan text-black shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                                    : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-700'
                                                    }`}
                                            >
                                                {category}
                                                {/* Badge for count */}
                                                {(() => {
                                                    const categoryDefects = defectsByCategory[category].map(d => d.name);
                                                    const totalInCat = categoryDefects.reduce((acc, name) => acc + (receiveForm.standardDefects[name] || 0), 0);
                                                    return totalInCat > 0 ? (
                                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeDefectCategory === category ? 'bg-black text-nexus-cyan' : 'bg-nexus-cyan text-black'}`}>
                                                            {totalInCat}
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Active Category Content */}
                                    {activeDefectCategory && defectsByCategory[activeDefectCategory] && (
                                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                            <h5 className="text-[10px] font-bold text-nexus-cyan uppercase tracking-widest border-b border-slate-800 pb-1 mb-3 hidden md:block">
                                                {activeDefectCategory}
                                            </h5>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {defectsByCategory[activeDefectCategory].map(d => (
                                                    <div key={d.id}>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase truncate" title={d.name}>{d.name}</label>
                                                        <input type="number" min="0" placeholder="0" className="w-full p-2 bg-slate-950 border border-slate-800 text-white focus:border-red-500 focus:outline-none font-mono text-sm"
                                                            value={receiveForm.standardDefects[d.name] || ''}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                setReceiveForm(prev => ({
                                                                    ...prev,
                                                                    standardDefects: {
                                                                        ...prev.standardDefects,
                                                                        [d.name]: val > 0 ? val : 0
                                                                        // We can keep it in state even if 0, or clean it up. Keeping it is fine.
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual Defects */}
                                    <div className="space-y-2 border-t border-red-900/30 pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-red-400 uppercase">Outros Defeitos (Não Listados)</span>
                                            <button type="button" onClick={addManualDefect} className="text-xs text-nexus-cyan hover:text-white flex items-center gap-1 font-bold uppercase">
                                                <Plus size={14} /> Adicionar Manualmente
                                            </button>
                                        </div>

                                        {manualDefects.map((def) => (
                                            <div key={def.id} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Nome do defeito (ex: Rasgo na manga)"
                                                    className="flex-1 p-2 bg-slate-950 border border-slate-800 text-white text-xs focus:border-red-500 focus:outline-none"
                                                    value={def.name}
                                                    onChange={(e) => setManualDefects(manualDefects.map(d => d.id === def.id ? { ...d, name: e.target.value } : d))}
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Qtd"
                                                    className="w-20 p-2 bg-slate-950 border border-slate-800 text-white text-xs focus:border-red-500 focus:outline-none text-center"
                                                    value={def.qty || ''}
                                                    onChange={(e) => setManualDefects(manualDefects.map(d => d.id === def.id ? { ...d, qty: Number(e.target.value) } : d))}
                                                />
                                                <button type="button" onClick={() => removeManualDefect(def.id)} className="text-slate-600 hover:text-red-500 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 text-right text-sm font-bold text-red-400 font-mono uppercase tracking-wider">
                                        Total Defeitos: {
                                            (Object.values(receiveForm.standardDefects) as number[]).reduce((a, b) => a + Number(b), 0) +
                                            manualDefects.reduce((a, b) => a + Number(b.qty), 0)
                                        }
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Observações do Recebimento</label>
                                    <textarea className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm h-20 resize-none"
                                        value={receiveForm.observacoes} onChange={e => setReceiveForm({ ...receiveForm, observacoes: e.target.value })} />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                    <button type="button" onClick={() => setActiveTab('LIST')} className="px-4 py-2 text-slate-500 hover:text-white hover:bg-slate-800 uppercase text-xs font-bold tracking-wider">Cancelar</button>
                                    <button type="submit" className="px-6 py-2 bg-nexus-green text-black hover:bg-green-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2 uppercase text-xs font-bold tracking-wider clip-path-polygon" style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}>
                                        <Save size={16} /> Finalizar Recebimento
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            )}

            {/* History Modal */}
            {isHistoryOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="tech-card w-full max-w-lg p-0 max-h-[80vh] flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-nexus-cyan"></div>
                        <div className="flex justify-between items-center p-4 bg-slate-950 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Histórico de Alterações</h3>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 p-4 custom-scrollbar bg-slate-900/50">
                            {logs.filter(l => l.entityId === historyCorteId && l.entityType === 'CORTE').length === 0 ? (
                                <p className="text-center text-slate-600 py-8 font-mono border border-dashed border-slate-800">NENHUM HISTÓRICO REGISTRADO.</p>
                            ) : (
                                logs.filter(l => l.entityId === historyCorteId && l.entityType === 'CORTE')
                                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map(log => (
                                        <div key={log.id} className="border-l-2 border-slate-700 pl-4 py-1 relative group">
                                            <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-slate-700 group-hover:bg-nexus-cyan transition-colors"></div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-bold text-nexus-cyan uppercase tracking-wider">{log.action}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-300 mb-1">{log.details}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">USR: {log.userName}</p>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTENT: HISTORICO --- */}
            {activeTab === 'HISTORICO' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="tech-card p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                                    <Calendar size={14} className="inline mr-1" />
                                    Data Início
                                </label>
                                <input
                                    type="date"
                                    value={historyStartDate}
                                    onChange={(e) => setHistoryStartDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-brand-cyan transition-colors font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                                    <Calendar size={14} className="inline mr-1" />
                                    Data Fim
                                </label>
                                <input
                                    type="date"
                                    value={historyEndDate}
                                    onChange={(e) => setHistoryEndDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-brand-cyan transition-colors font-mono text-sm"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setHistoryStartDate('');
                                        setHistoryEndDate('');
                                    }}
                                    className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm uppercase tracking-wider"
                                >
                                    Limpar Filtros
                                </button>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={exportHistoryToExcel}
                                    disabled={filteredHistoryCortes.length === 0}
                                    className="w-full px-4 py-2 bg-brand-cyan hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <Download size={16} />
                                    Exportar Excel
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-sm font-mono text-slate-400">
                            <span>Total de registros:</span>
                            <span className="text-brand-cyan font-bold">{filteredHistoryCortes.length}</span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="tech-card overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Ref</th>
                                    <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Facção</th>
                                    <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Envio</th>
                                    <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Previsto</th>
                                    <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Recebimento</th>
                                    <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-right p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Enviada</th>
                                    <th className="text-right p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Recebida</th>
                                    <th className="text-right p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Defeitos</th>
                                    <th className="text-right p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">% Def</th>
                                    {isAdmin && (
                                        <th className="text-center p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Ações</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistoryCortes.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdmin ? 11 : 10} className="text-center p-12 text-slate-500">
                                            <History size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="uppercase tracking-widest text-sm">
                                                Nenhum registro encontrado para o período selecionado
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistoryCortes.map((corte) => {
                                        const defectPercent = corte.qtdTotalRecebida > 0
                                            ? ((corte.qtdTotalDefeitos / corte.qtdTotalRecebida) * 100).toFixed(2)
                                            : '0';
                                        const faccaoName = faccoes.find(f => f.id === corte.faccaoId)?.name || 'Desconhecida';

                                        return (
                                            <tr
                                                key={corte.id}
                                                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td className="p-4 font-mono text-white">{corte.referencia}</td>
                                                <td className="p-4 text-slate-300">{faccaoName}</td>
                                                <td className="p-4 font-mono text-slate-400 text-xs">{formatDate(corte.dataEnvio)}</td>
                                                <td className="p-4 font-mono text-slate-400 text-xs">
                                                    {corte.dataPrevistaRecebimento ? formatDate(corte.dataPrevistaRecebimento) : '-'}
                                                </td>
                                                <td className="p-4 font-mono text-slate-400 text-xs">
                                                    {corte.dataRecebimento ? formatDate(corte.dataRecebimento) : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${corte.status === CorteStatus.RECEBIDO
                                                        ? 'bg-green-900/50 text-green-400'
                                                        : 'bg-yellow-900/50 text-yellow-400'
                                                        }`}>
                                                        {corte.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-mono text-white">{corte.qtdTotalEnviada}</td>
                                                <td className="p-4 text-right font-mono text-white">{corte.qtdTotalRecebida}</td>
                                                <td className="p-4 text-right font-mono text-red-400 font-bold">{corte.qtdTotalDefeitos}</td>
                                                <td className="p-4 text-right font-mono text-red-400 font-bold">{defectPercent}%</td>
                                                {isAdmin && (
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => handleDeleteCorte(corte.id, corte.referencia)}
                                                            className="text-red-400 hover:text-red-300 hover:scale-110 transition-all"
                                                            title="Excluir registro"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={closeDialog}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                type={confirmState.type}
            />
        </div>
    );
};