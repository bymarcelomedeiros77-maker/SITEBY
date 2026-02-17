import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Cliente, ClienteCategoria } from '../types';
import {
    Search, Download, Plus, Phone, Mail,
    MapPin, FileText, X, Save, Trophy,
    Star, Award, Medal, Users, ChevronRight, Tags,
    History, Info, Filter, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { vestiService } from '../services/vestiService';

export const Clients = () => {
    const { clientes, pedidos, devolucoes, addCliente, updateCliente, addToast } = useApp();

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | ClienteCategoria>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Cliente | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'address' | 'history' | 'notes'>('details');
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState('');

    // Stats Calculation & Filtering
    const processedClients = useMemo(() => {
        return (clientes || []).map(client => {
            const clientOrders = (pedidos || []).filter(p => p.clienteId === client.id);

            // In a real scenario, we'd sum up order values. 
            // Since we don't have prices in our current schema, we'll show count-based stats for now.
            const total = 0;

            // Find last order date
            const lastOrder = clientOrders.length > 0
                ? [...clientOrders].sort((a, b) => new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime())[0]
                : null;

            return {
                ...client,
                total_compras: total,
                contagem_pedidos: clientOrders.length,
                ultima_compra: lastOrder?.dataPedido
            };
        }).filter(c => {
            const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                c.contato.includes(searchTerm);
            const matchesCategory = selectedCategory === 'ALL' || c.categoria === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [clientes, pedidos, searchTerm, selectedCategory]);

    const handleOpenModal = (client?: Cliente) => {
        if (client) {
            setEditingClient({ ...client });
        } else {
            setEditingClient({
                id: '',
                nome: '',
                contato: '',
                cidade: '',
                categoria: 'BRONZE',
                status: 'ATIVO',
                tags: []
            } as any);
        }
        setActiveTab('details');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;

        try {
            if (editingClient.id) {
                await updateCliente(editingClient);
                addToast('success', "Cliente atualizado com sucesso!");
            } else {
                await addCliente(editingClient);
                addToast('success', "Cliente cadastrado com sucesso!");
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving client:", error);
            addToast('error', "Erro ao salvar cliente.");
        }
    };

    const handleImportVesti = async () => {
        setIsImporting(true);
        setImportMessage("Conectando ao Vesti...");

        try {
            await vestiService.syncClients((msg) => {
                setImportMessage(msg);
            });
            addToast('success', "Importação concluída com sucesso!");
            window.location.reload(); // Refresh to show new data
        } catch (error: any) {
            console.error("Erro na importação:", error);
            const msg = error.message || "Falha desconhecida";
            addToast('error', `Falha ao importar: ${msg}`);
        } finally {
            setIsImporting(false);
            setImportMessage("");
        }
    };

    const exportToExcel = () => {
        const data = processedClients.map(c => ({
            Nome: c.nome,
            Email: c.email || '-',
            Contato: c.contato,
            Categoria: c.categoria,
            Cidade: c.cidade,
            Status: c.status,
            'Qtd Pedidos': c.contagem_pedidos,
            'Última Compra': c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString() : '-'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");
        XLSX.writeFile(wb, "gestao_clientes.xlsx");
    };

    const downloadTemplate = () => {
        const templateData = [
            {
                Nome: "Exemplo Cliente",
                Email: "cliente@email.com",
                Contato: "11999999999",
                Cidade: "São Paulo",
                Categoria: "CLIENTE_NOVO",
                Status: "ATIVO" // ATIVO or INATIVO
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo Importacao");
        XLSX.writeFile(wb, "Modelo_Importacao_Clientes.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            let importedCount = 0;
            data.forEach((row: any) => {
                if (row.Nome && row.Contato) {
                    // Auto-create client
                    const newClient: Omit<Cliente, 'id'> = {
                        nome: row.Nome,
                        email: row.Email || '',
                        contato: String(row.Contato),
                        cidade: row.Cidade || '',
                        categoria: (row.Categoria as ClienteCategoria) || 'CLIENTE_NOVO',
                        status: (row.Status === 'INATIVO' ? 'INATIVO' : 'ATIVO'),
                        tags: [],
                        ultima_compra: null
                    };
                    addCliente(newClient);
                    importedCount++;
                }
            });
            addToast('success', `${importedCount} clientes importados com sucesso!`);
        };
        reader.readAsBinaryString(file);
    };

    const getCategoryStyles = (cat: ClienteCategoria) => {
        switch (cat) {
            case 'CLIENTE_NOVO': return { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', border: 'border-brand-cyan/30', icon: <Star size={14} /> };
            case 'DIAMANTE': return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: <Trophy size={14} /> };
            case 'OURO': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', icon: <Medal size={14} /> };
            case 'PRATA': return { bg: 'bg-slate-400/10', text: 'text-slate-300', border: 'border-slate-400/30', icon: <Award size={14} /> };
            case 'BRONZE': return { bg: 'bg-amber-700/10', text: 'text-amber-600', border: 'border-amber-700/30', icon: <Medal size={14} /> };
            case 'INATIVO_90': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', icon: <History size={14} /> };
            case 'INATIVO_8M': return { bg: 'bg-red-900/10', text: 'text-red-700', border: 'border-red-900/30', icon: <History size={14} /> };
            case 'NUNCA_COMPROU': return { bg: 'bg-slate-700/10', text: 'text-slate-500', border: 'border-slate-700/30', icon: <Users size={14} /> };
            default: return { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', icon: <Star size={14} /> };
        }
    };

    const categories: { id: ClienteCategoria | 'ALL', label: string, icon: any, color: string }[] = [
        { id: 'ALL', label: 'Todos', icon: Users, color: 'text-white' },
        { id: 'CLIENTE_NOVO', label: 'Cliente Novo', icon: Star, color: 'text-brand-cyan' },
        { id: 'DIAMANTE', label: 'Diamante', icon: Trophy, color: 'text-cyan-400' },
        { id: 'OURO', label: 'Ouro', icon: Award, color: 'text-amber-400' },
        { id: 'PRATA', label: 'Prata', icon: Medal, color: 'text-slate-300' },
        { id: 'BRONZE', label: 'Bronze', icon: Medal, color: 'text-amber-700' },
        { id: 'INATIVO_90', label: 'Inativo 90d', icon: History, color: 'text-slate-500' },
        { id: 'INATIVO_8M', label: 'Inativo 8m', icon: History, color: 'text-slate-600' },
        { id: 'NUNCA_COMPROU', label: 'Nunca Comprou', icon: Info, color: 'text-red-400' },
    ];

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Users className="text-brand-cyan" /> Gestão de Clientes
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gerencie perfis, categorias e histórico completo.</p>
                </div>
                <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer transition-colors border border-slate-700">
                        <div className="flex items-center gap-2">
                            <FileText size={18} />
                            <span className="text-sm font-bold uppercase">Importar Excel</span>
                        </div>
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={handleImportVesti}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary/20 text-brand-primary rounded-lg hover:bg-brand-primary/30 transition-colors disabled:opacity-50"
                    >
                        <RotateCcw size={18} className={isImporting ? "animate-spin" : ""} />
                        {isImporting ? importMessage || "Importando..." : "IMPORTAR VESTI"}
                    </button>
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-700"
                        title="Baixar Modelo de Importação"
                    >
                        <Download size={18} />
                    </button>

                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors border border-slate-700"
                    >
                        <Download size={18} />
                        <span className="text-sm font-bold uppercase">Exportar</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-slate-950 font-bold uppercase rounded-lg hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    >
                        <Plus size={18} />
                        <span>Novo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar cliente por nome, email ou contato..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-cyan transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Category Dropdown */}
                <div className="w-full md:w-64">
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-3 text-white appearance-none focus:outline-none focus:border-brand-cyan transition-colors"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <Filter size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8">
                {processedClients.map(client => (
                    <ClientCard
                        key={client.id}
                        client={client}
                        styles={getCategoryStyles(client.categoria as ClienteCategoria)}
                        onClick={() => handleOpenModal(client)}
                    />
                ))}
                {processedClients.length === 0 && (
                    <div className="col-span-full py-24 text-center flex flex-col items-center justify-center bg-slate-950/20 rounded-[2rem] border-2 border-dashed border-slate-800/50">
                        <Users className="text-slate-800 mb-6" size={64} />
                        <h3 className="text-slate-500 font-bold uppercase tracking-[0.2em] text-lg">Nenhum registro encontrado</h3>
                        <p className="text-slate-600 text-xs mt-3 max-w-sm">Refine sua busca ou utilize os filtros de categoria para visualizar outros clientes.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setIsModalOpen(false)}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative z-10"
                    >
                        {/* Modal Header */}
                        <div className="p-8 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-2xl font-bold border-2 ${editingClient?.id ? getCategoryStyles(editingClient.categoria).bg + ' ' + getCategoryStyles(editingClient.categoria).text + ' ' + getCategoryStyles(editingClient.categoria).border : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                    {editingClient?.nome?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">{editingClient?.nome || 'Novo Perfil de Cliente'}</h2>
                                    {editingClient?.categoria && (
                                        <div className={`mt-2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-bold uppercase border ${getCategoryStyles(editingClient.categoria).bg} ${getCategoryStyles(editingClient.categoria).text} ${getCategoryStyles(editingClient.categoria).border}`}>
                                            {getCategoryStyles(editingClient.categoria).icon} {editingClient.categoria}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-500 hover:text-white bg-slate-900 border border-slate-800 p-2.5 rounded-2xl transition-all hover:rotate-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-slate-800 bg-slate-900/10 px-4">
                            <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={<Info size={16} />} label="Detalhes" />
                            <TabButton active={activeTab === 'address'} onClick={() => setActiveTab('address')} icon={<MapPin size={16} />} label="Endereço" />
                            <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={16} />} label="Compras" />
                            <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<FileText size={16} />} label="Notas" />
                        </div>

                        {/* Modal Content */}
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            {activeTab === 'details' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Nome Completo</label>
                                        <input
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all"
                                            value={editingClient?.nome || ''}
                                            onChange={(e) => setEditingClient({ ...editingClient!, nome: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Endereço de Email</label>
                                        <input
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all"
                                            value={editingClient?.email || ''}
                                            onChange={(e) => setEditingClient({ ...editingClient!, email: e.target.value })}
                                            placeholder="exemplo@email.com"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Telefone / WhatsApp</label>
                                        <input
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all font-mono"
                                            value={editingClient?.contato || ''}
                                            onChange={(e) => setEditingClient({ ...editingClient!, contato: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Instagram</label>
                                            <div className="relative">
                                                <input
                                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 pl-10 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all"
                                                    value={editingClient?.instagram || ''}
                                                    onChange={(e) => setEditingClient({ ...editingClient!, instagram: e.target.value })}
                                                    placeholder="@usuario"
                                                />
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">@</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Nascimento</label>
                                            <input
                                                type="date"
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all"
                                                value={editingClient?.dataNascimento || ''}
                                                onChange={(e) => setEditingClient({ ...editingClient!, dataNascimento: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Categoria</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all appearance-none"
                                            value={editingClient?.categoria || 'BRONZE'}
                                            onChange={(e) => setEditingClient({ ...editingClient!, categoria: e.target.value as any })}
                                        >
                                            <option value="BRONZE">BRONZE (Iniciante)</option>
                                            <option value="PRATA">PRATA (Regular)</option>
                                            <option value="OURO">OURO (Fiel)</option>
                                            <option value="DIAMANTE">DIAMANTE (Exclusivo)</option>
                                            <option value="INATIVO_90">Inativo +90 dias</option>
                                            <option value="INATIVO_6M">Inativo +6 meses</option>
                                            <option value="NUNCA_COMPROU">Nunca Comprou</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Status da Conta</label>
                                        <div className="flex gap-6">
                                            <label className={`flex-1 flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all cursor-pointer ${editingClient?.status === 'ATIVO' ? 'bg-green-500/5 border-green-500/50' : 'bg-slate-900/20 border-slate-800'}`}>
                                                <input type="radio" className="hidden" name="status" checked={editingClient?.status === 'ATIVO'} onChange={() => setEditingClient({ ...editingClient!, status: 'ATIVO' })} />
                                                <div className={`w-3 h-3 rounded-full mb-2 ${editingClient?.status === 'ATIVO' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-slate-700'}`}></div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${editingClient?.status === 'ATIVO' ? 'text-green-500' : 'text-slate-500'}`}>Ativo</span>
                                            </label>
                                            <label className={`flex-1 flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all cursor-pointer ${editingClient?.status === 'INATIVO' ? 'bg-red-500/5 border-red-500/50' : 'bg-slate-900/20 border-slate-800'}`}>
                                                <input type="radio" className="hidden" name="status" checked={editingClient?.status === 'INATIVO'} onChange={() => setEditingClient({ ...editingClient!, status: 'INATIVO' })} />
                                                <div className={`w-3 h-3 rounded-full mb-2 ${editingClient?.status === 'INATIVO' ? 'bg-red-500' : 'bg-slate-700'}`}></div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${editingClient?.status === 'INATIVO' ? 'text-red-500' : 'text-slate-500'}`}>Inativo</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'address' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Rua, Número e Complemento</label>
                                        <input
                                            placeholder="Av. Paulista, 1000 - Apto 21"
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all shadow-inner"
                                            value={editingClient?.endereco || ''}
                                            onChange={(e) => setEditingClient({ ...editingClient!, endereco: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Cidade</label>
                                            <input
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all"
                                                value={editingClient?.cidade || ''}
                                                onChange={(e) => setEditingClient({ ...editingClient!, cidade: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Estado (UF)</label>
                                            <input
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all uppercase text-center font-mono"
                                                maxLength={2}
                                                value={editingClient?.estado || ''}
                                                onChange={(e) => setEditingClient({ ...editingClient!, estado: e.target.value })}
                                                placeholder="UF"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">CEP</label>
                                            <input
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all font-mono text-center"
                                                value={editingClient?.cep || ''}
                                                onChange={(e) => setEditingClient({ ...editingClient!, cep: e.target.value })}
                                                placeholder="00000-000"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Bairro</label>
                                        <input
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all"
                                            value={editingClient?.bairro || ''}
                                            onChange={(e) => setEditingClient({ ...editingClient!, bairro: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-white font-bold text-xs uppercase tracking-widest border-l-4 border-brand-cyan pl-3">Linha do Tempo</h3>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {(pedidos || []).filter(p => p.clienteId === editingClient?.id).length} ENTRADAS | {(devolucoes || []).filter(d => d.pedido?.clienteId === editingClient?.id || pedidos.find(p => p.id === d.pedidoId)?.clienteId === editingClient?.id).length} DEVOLUÇÕES
                                        </span>
                                    </div>

                                    {(() => {
                                        // 1. Get Client Orders
                                        const clientOrders = (pedidos || []).filter(p => p.clienteId === editingClient?.id).map(p => ({ ...p, type: 'PEDIDO' }));

                                        // 2. Get Client Returns (Check both nested pedido and lookup)
                                        const clientReturns = (devolucoes || []).filter(d => {
                                            if (d.pedido?.clienteId === editingClient?.id) return true;
                                            const parentOrder = pedidos.find(p => p.id === d.pedidoId);
                                            return parentOrder?.clienteId === editingClient?.id;
                                        }).map(d => ({ ...d, type: 'DEVOLUCAO' }));

                                        // 3. Merge & Sort
                                        const historyItems = [...clientOrders, ...clientReturns].sort((a: any, b: any) => {
                                            const dateA = new Date(a.type === 'PEDIDO' ? a.dataPedido : a.dataDevolucao).getTime();
                                            const dateB = new Date(b.type === 'PEDIDO' ? b.dataPedido : b.dataDevolucao).getTime();
                                            return dateB - dateA;
                                        });

                                        if (historyItems.length === 0) {
                                            return (
                                                <div className="py-24 text-center bg-slate-950/20 rounded-[2rem] border-2 border-dashed border-slate-800/50">
                                                    <History className="text-slate-800 mx-auto mb-6 opacity-50" size={48} />
                                                    <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">Nenhuma transação encontrada</p>
                                                    <p className="text-slate-700 text-[10px] mt-2 italic px-20">Este cliente ainda não realizou compras registradas.</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="space-y-4">
                                                {historyItems.map((item: any) => (
                                                    item.type === 'PEDIDO' ? (
                                                        // RENDER PEDIDO
                                                        <div key={`ped-${item.id}`} className="bg-slate-900/30 border border-slate-800/80 rounded-[1.5rem] p-5 flex flex-col gap-4 group hover:border-slate-700 transition-all">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 group-hover:text-brand-cyan transition-all group-hover:scale-110 shadow-inner">
                                                                        <History size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-white uppercase font-mono tracking-tight">Venda #{item.numero}</div>
                                                                        <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase">{new Date(item.dataPedido).toLocaleDateString()} — {item.status}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-xs font-bold text-brand-green font-mono uppercase">
                                                                        {item.itens?.reduce((acc: number, curr: any) => acc + curr.quantidade, 0) || 0} Peças
                                                                    </div>
                                                                    <div className="text-[9px] text-slate-600 uppercase mt-1">Status Sincronizado</div>
                                                                </div>
                                                            </div>

                                                            {/* Items List */}
                                                            {item.itens && item.itens.length > 0 && (
                                                                <div className="space-y-2 border-t border-slate-800/50 pt-4">
                                                                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2 font-mono">Peças do Pedido</div>
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {item.itens.map((i: any, idx: number) => (
                                                                            <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-950/40 p-2 rounded-lg border border-slate-800/30">
                                                                                <div className="flex gap-2 items-center">
                                                                                    <span className="text-brand-cyan font-bold font-mono">{i.sku?.produto?.referencia}</span>
                                                                                    <span className="text-slate-500">—</span>
                                                                                    <span className="text-slate-400 capitalize">{i.sku?.cor?.nome} / {i.sku?.tamanho?.nome}</span>
                                                                                </div>
                                                                                <div className="font-bold text-white font-mono">{i.quantidade} <span className="text-[9px] text-slate-600 uppercase">UN</span></div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // RENDER DEVOLUCAO
                                                        <div key={`dev-${item.id}`} className="bg-red-900/10 border border-red-500/20 rounded-[1.5rem] p-5 flex flex-col gap-4 group hover:border-red-500/40 transition-all">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-12 h-12 rounded-2xl bg-red-900/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-all shadow-inner">
                                                                        <RotateCcw size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
                                                                            Devolução #{item.numero}
                                                                            <span className="px-2 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30">ESTORNO</span>
                                                                        </div>
                                                                        <div className="text-[10px] text-red-400/70 font-mono mt-1 uppercase">
                                                                            {new Date(item.dataDevolucao).toLocaleDateString()} — Ref. Pedido #{item.pedido?.numero || '?'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-xs font-bold text-red-400 font-mono uppercase">
                                                                        -{item.itens?.reduce((acc: number, curr: any) => acc + curr.quantidade, 0) || 0} Peças
                                                                    </div>
                                                                    <div className="text-[9px] text-red-500/50 uppercase mt-1">Estoque Reposto</div>
                                                                </div>
                                                            </div>

                                                            {/* Motivo */}
                                                            {item.motivo && (
                                                                <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/30 text-[11px] text-red-200/80 italic">
                                                                    "{item.motivo}"
                                                                </div>
                                                            )}

                                                            {/* Items List */}
                                                            {item.itens && item.itens.length > 0 && (
                                                                <div className="space-y-2 border-t border-red-900/20 pt-4">
                                                                    <div className="text-[9px] font-bold text-red-800 uppercase tracking-widest mb-2 font-mono">Itens Devolvidos</div>
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {item.itens.map((i: any, idx: number) => (
                                                                            <div key={idx} className="flex items-center justify-between text-[11px] bg-red-950/20 p-2 rounded-lg border border-red-900/20">
                                                                                <div className="flex gap-2 items-center">
                                                                                    <span className="text-red-400 font-bold font-mono">{i.sku?.produto?.referencia}</span>
                                                                                    <span className="text-red-800">—</span>
                                                                                    <span className="text-red-300 capitalize">{i.sku?.cor?.nome} / {i.sku?.tamanho?.nome}</span>
                                                                                </div>
                                                                                <div className="font-bold text-white font-mono">{i.quantidade} <span className="text-[9px] text-red-500 uppercase">UN</span></div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-2">
                                            <Info size={12} className="text-brand-cyan" />
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Observações Gerais (Públicas)</label>
                                        </div>
                                        <textarea
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl px-6 py-5 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all h-32 resize-none shadow-inner"
                                            value={editingClient?.observacoes_vesti || ''}
                                            onChange={(e) => setEditingClient({ ...editingClient!, observacoes_vesti: e.target.value })}
                                            placeholder="Descreva preferências, histórico informal ou detalhes úteis..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-2">
                                            <Star size={12} className="text-amber-500" />
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Notas Estratégicas (Internas)</label>
                                        </div>
                                        <textarea
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl px-6 py-5 text-sm text-white focus:border-amber-500/50 outline-none transition-all h-32 resize-none shadow-inner"
                                            value={editingClient?.notas_internas || ''}
                                            onChange={(e) => setEditingClient({ ...editingClient!, notas_internas: e.target.value })}
                                            placeholder="Feedback da equipe, alertas ou sugestões de abordagem..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-2">
                                            <Tags size={12} className="text-slate-500" />
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Segmentação (Tags)</label>
                                        </div>
                                        <input
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:border-brand-cyan/50 outline-none transition-all shadow-inner"
                                            placeholder="Ex: VIP, ATACADO, REVENDA (Use vírgulas)"
                                            value={editingClient?.tags?.join(', ') || ''}
                                            onChange={(e) => setEditingClient({ ...editingClient!, tags: e.target.value.split(',').filter(t => t.trim()).map(t => t.trim()) })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Modal Actions */}
                            <div className="mt-12 flex items-center justify-end gap-4 pt-10 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-3 rounded-2xl border border-slate-800 text-slate-500 font-bold uppercase text-[10px] hover:bg-slate-900 hover:text-white transition-all tracking-widest"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-3 rounded-2xl bg-brand-cyan text-slate-950 font-bold uppercase text-[10px] hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-2 tracking-widest"
                                >
                                    <Save size={16} /> Salvar Perfil
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

        </div >
    );
};

const ClientCard = ({ client, styles, onClick }: { client: any; styles: any; onClick: () => void; key?: string }) => {
    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 cursor-pointer hover:border-slate-700 hover:bg-slate-900 transition-all shadow-2xl backdrop-blur-md overflow-hidden"
        >
            {/* Background Glow */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${styles.bg}`}></div>

            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border-2 transition-all duration-500 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] ${styles.bg} ${styles.text} ${styles.border}`}>
                    {client.nome.charAt(0)}
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-bold uppercase border bg-slate-950/80 backdrop-blur-sm transition-all shadow-md group-hover:scale-110 ${styles.text} ${styles.border}`}>
                    {styles.icon} {client.categoria}
                </div>
            </div>

            <h3 className="text-base font-bold text-white mb-2 truncate group-hover:text-brand-cyan transition-colors">{client.nome}</h3>

            <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-3 text-slate-500 text-xs transition-colors group-hover:text-slate-300">
                    <div className="p-1.5 rounded-lg bg-slate-900 group-hover:bg-brand-cyan/10 transition-colors">
                        <Phone size={12} className="group-hover:text-brand-cyan" />
                    </div>
                    <span className="font-mono tracking-tight">{client.contato}</span>
                </div>
                {client.email && (
                    <div className="flex items-center gap-3 text-slate-500 text-xs truncate transition-colors group-hover:text-slate-300">
                        <div className="p-1.5 rounded-lg bg-slate-900 group-hover:bg-brand-cyan/10 transition-colors">
                            <Mail size={12} className="group-hover:text-brand-cyan" />
                        </div>
                        <span className="truncate tracking-tight italic">{client.email}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-800/60 pt-4">
                <div className="bg-slate-950/30 p-2.5 rounded-xl">
                    <div className="text-[7px] uppercase font-bold text-slate-600 tracking-[0.2em] mb-1">Pedidos</div>
                    <div className="text-white font-bold text-xs font-mono tracking-tighter">{client.contagem_pedidos || 0} UNI</div>
                </div>
                <div className="bg-slate-950/30 p-2.5 rounded-xl text-right">
                    <div className="text-[7px] uppercase font-bold text-slate-600 tracking-[0.2em] mb-1">Última</div>
                    <div className="text-slate-300 font-bold text-xs font-mono tracking-tighter">
                        {client.ultima_compra ? new Date(client.ultima_compra).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/D'}
                    </div>
                </div>
            </div>

            <div className="absolute top-1/2 -right-4 -translate-y-1/2 text-brand-cyan opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:right-3">
                <ChevronRight size={24} />
            </div>
        </motion.div>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-3 py-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 relative ${active ? 'bg-brand-cyan/5 border-brand-cyan text-brand-cyan' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20'}`}
    >
        {icon}
        <span className="hidden lg:inline">{label}</span>
        {active && (
            <motion.div
                layoutId="tabGlow"
                className="absolute bottom-0 left-0 w-full h-[1px] bg-brand-cyan shadow-[0_0_15px_#3b82f6]"
            />
        )}
    </button>
);
