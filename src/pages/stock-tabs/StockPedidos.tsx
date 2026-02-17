import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
    ShoppingCart, Plus, Search, Filter, Calendar, User,
    CheckCircle, Clock, X, Trash2, ArrowRight, Package,
    RotateCcw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pedido, PedidoItem } from '../../types';

export const StockPedidos = () => {
    const { pedidos, clientes, produtos, cores, tamanhos, skus, addPedido, updatePedidoStatus, refreshStockData, addToast, confirm } = useApp();
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New Order State
    const [newOrderClient, setNewOrderClient] = useState('');
    const [newOrderObs, setNewOrderObs] = useState('');
    const [orderItems, setOrderItems] = useState<Partial<PedidoItem>[]>([]);

    // Searchable Client State
    const [searchTermClient, setSearchTermClient] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    // Item Adding State (Multi-variation)
    const [pendingVariations, setPendingVariations] = useState<{ corId: string; tamId: string; qty: number }[]>([
        { corId: '', tamId: '', qty: 1 }
    ]);
    const [selProd, setSelProd] = useState('');

    // Helpers
    const getSku = (p: string, c: string, t: string) => skus.find(s => s.produtoId === p && s.corId === c && s.tamanhoId === t);

    const handleAddItem = () => {
        if (!selProd || pendingVariations.length === 0) return;

        const newItems: Partial<PedidoItem>[] = [];

        for (const v of pendingVariations) {
            if (!v.corId || !v.tamId || v.qty <= 0) continue;
            const sku = getSku(selProd, v.corId, v.tamId);
            if (!sku) continue;

            // Check if already in cart (same SKU), sum quantity if so, or just add new
            // For simplicity and matching typical cart behavior, we just add another row or merge.
            // Let's just add new rows for now as requested.
            newItems.push({
                skuId: sku.id,
                quantidade: v.qty,
                sku: sku
            });
        }

        if (newItems.length === 0) {
            addToast('error', 'Selecione variações válidas e quantidades maiores que zero.');
            return;
        }

        setOrderItems(prev => [...prev, ...newItems]);

        // Reset variation selector but keep product?
        // Usually better to keep product if adding more, or reset both. 
        // User asked for "more color and size", suggesting they might stay on same product.
        setPendingVariations([{ corId: '', tamId: '', qty: 1 }]);
    };

    const addVariationRow = () => {
        setPendingVariations(prev => [...prev, { corId: '', tamId: '', qty: 1 }]);
    };

    const removeVariationRow = (index: number) => {
        if (pendingVariations.length === 1) {
            setPendingVariations([{ corId: '', tamId: '', qty: 1 }]);
            return;
        }
        setPendingVariations(prev => prev.filter((_, i) => i !== index));
    };

    const updateVariationRow = (index: number, field: 'corId' | 'tamId' | 'qty', value: any) => {
        setPendingVariations(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleRemoveItem = (index: number) => {
        setOrderItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreateOrder = async () => {
        if (!newOrderClient) {
            addToast('error', 'Por favor, selecione um cliente.');
            return;
        }
        if (orderItems.length === 0) {
            addToast('error', 'Adicione pelo menos um item ao pedido.');
            return;
        }

        try {
            const success = await addPedido({
                clienteId: newOrderClient,
                dataPedido: new Date().toISOString(),
                status: 'ABERTO',
                statusPagamento: 'PENDENTE',
                observacao: newOrderObs,
                itens: orderItems as PedidoItem[]
            });

            if (success) {
                setIsModalOpen(false);
                setNewOrderClient('');
                setSearchTermClient('');
                setNewOrderObs('');
                setOrderItems([]);
                addToast('success', 'Pedido criado com sucesso!');
            }
        } catch (error: any) {
            console.error("Erro ao criar pedido:", error);
            addToast('error', `Erro ao criar pedido: ${error.message || 'Verifique os dados e tente novamente.'}`);
        }
    };

    const handleChangeStatus = async (pedidoId: string, newStatus: Pedido['status']) => {
        const confirmed = await confirm({
            title: 'Alterar Status',
            message: `Deseja alterar o status para ${newStatus}?`,
            confirmText: 'Alterar',
            type: 'info'
        });

        if (confirmed) {
            const success = await updatePedidoStatus(pedidoId, newStatus);
            if (success) {
                addToast('success', `Status alterado para ${newStatus}`);
            } else {
                addToast('error', 'Erro ao alterar status. Tente novamente.');
            }
        }
    };

    const filteredClients = (clientes || []).filter(c =>
        (c.nome?.toLowerCase() || '').includes(searchTermClient.toLowerCase()) ||
        (c.cidade?.toLowerCase() || '').includes(searchTermClient.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar Pedido ou Cliente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan"
                        />
                    </div>
                    <button
                        onClick={async () => {
                            setIsManualRefreshing(true);
                            await refreshStockData();
                            setIsManualRefreshing(false);
                        }}
                        className={`text-slate-500 hover:text-white transition-all ${isManualRefreshing ? 'animate-spin' : ''}`}
                        title="Recarregar Dados"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
                <button
                    onClick={() => { console.log("Click Novo Pedido"); setIsModalOpen(true); }}
                    className="bg-brand-cyan text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                >
                    <Plus size={18} /> Novo Pedido
                </button>
            </div>

            {/* Orders List */}
            <div className="grid gap-4">
                {pedidos
                    .filter(pedido => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                            pedido.numero.toString().includes(searchLower) ||
                            (pedido.cliente?.nome || '').toLowerCase().includes(searchLower) ||
                            (pedido.cliente?.cidade || '').toLowerCase().includes(searchLower)
                        );
                    })
                    .length === 0 && (
                        <div className="text-center py-20 text-slate-600 bg-slate-950/30 rounded-xl border border-slate-800 border-dashed">
                            Nenhum pedido encontrado.
                        </div>
                    )}
                {pedidos
                    .filter(pedido => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                            pedido.numero.toString().includes(searchLower) ||
                            (pedido.cliente?.nome || '').toLowerCase().includes(searchLower) ||
                            (pedido.cliente?.cidade || '').toLowerCase().includes(searchLower)
                        );
                    })
                    .map(pedido => (
                        <motion.div
                            key={pedido.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xl font-bold text-white">#{pedido.numero}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${pedido.status === 'ABERTO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                                            pedido.status === 'SEPARANDO' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                                                pedido.status === 'EXPEDIDO' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                                                    'bg-red-500/10 text-red-400 border border-red-500/30'
                                            }`}>
                                            {pedido.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><User size={12} /> {pedido.cliente?.nome || 'Cliente Removido'}</span>
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(pedido.dataPedido).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {pedido.status === 'ABERTO' && (
                                        <button
                                            onClick={() => handleChangeStatus(pedido.id, 'SEPARANDO')}
                                            className="text-xs bg-slate-800 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                        >
                                            Separar
                                        </button>
                                    )}
                                    {pedido.status === 'SEPARANDO' && (
                                        <button
                                            onClick={() => handleChangeStatus(pedido.id, 'EXPEDIDO')}
                                            className="text-xs bg-slate-800 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                                        >
                                            Expedir
                                        </button>
                                    )}
                                    {(pedido.status === 'ABERTO' || pedido.status === 'SEPARANDO') && (
                                        <button
                                            onClick={() => handleChangeStatus(pedido.id, 'CANCELADO')}
                                            className="text-xs bg-slate-800 text-red-400 px-3 py-1 rounded hover:bg-red-900/30 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Items Summary */}
                            <div className="bg-slate-900/50 rounded-lg p-3 text-sm">
                                <table className="w-full text-left">
                                    <thead className="text-[10px] text-slate-500 uppercase">
                                        <tr>
                                            <th className="pb-2">Produto</th>
                                            <th className="pb-2 text-center">REF.</th>
                                            <th className="pb-2 text-right">Qtd</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-300">
                                        {pedido.itens.map((item, idx) => (
                                            <tr key={idx} className="border-t border-slate-800/50">
                                                <td className="py-2">{item.sku?.produto?.referencia} <span className="text-slate-500 text-xs">- {item.sku?.produto?.descricao}</span></td>
                                                <td className="py-2 text-center text-xs font-bold bg-slate-900 rounded px-1">
                                                    {item.sku?.cor?.nome} / {item.sku?.tamanho?.nome}
                                                </td>
                                                <td className="py-2 text-right font-bold text-white">{item.quantidade}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ))}
            </div>

            {/* Modal Novo Pedido */}
            <button
                onClick={() => { console.log("Abriu Modal Pedido"); setIsModalOpen(true); }}
                className="hidden" // Hidden button trigger fallback if needed, but we use the main button in header?
            ></button>
            {isModalOpen && createPortal(
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
                        className="bg-slate-950 border border-slate-800 w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <ShoppingCart size={20} className="text-brand-cyan" /> Novo Pedido
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                        </div>

                        {/* Data Warnings */}
                        {(clientes.length === 0 || skus.length === 0) && (
                            <div className="bg-amber-500/10 border-b border-amber-500/30 p-4 flex items-center gap-3 text-amber-500 text-sm">
                                <AlertCircle size={20} />
                                <div>
                                    <p className="font-bold">Atenção: Dados Faltantes</p>
                                    <p className="text-xs opacity-80">
                                        {clientes.length === 0 && skus.length === 0
                                            ? "Você precisa cadastrar Clientes e SKUs de Estoque antes de criar pedidos."
                                            : clientes.length === 0
                                                ? "Nenhum cliente cadastrado. Vá em 'Gestão de Clientes'."
                                                : "Nenhum SKU encontrado. Registre Entradas ou Produção primeiro."}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-1 overflow-hidden">
                            {/* Left: Order Details & Item Selection */}
                            <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-800 space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-brand-cyan uppercase tracking-wider">1. Dados do Cliente</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                                        <div className="relative">
                                            <div
                                                className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-3 cursor-text group focus-within:border-brand-cyan/50 transition-colors"
                                                onClick={() => setIsClientDropdownOpen(true)}
                                            >
                                                <Search size={16} className="text-slate-500 mr-2 group-focus-within:text-brand-cyan" />
                                                <input
                                                    className="bg-transparent border-none text-white text-sm w-full focus:outline-none placeholder:text-slate-600"
                                                    placeholder="Buscar Cliente (Nome ou Cidade)..."
                                                    value={searchTermClient}
                                                    onChange={(e) => {
                                                        setSearchTermClient(e.target.value);
                                                        setIsClientDropdownOpen(true);
                                                        if (!e.target.value) setNewOrderClient('');
                                                    }}
                                                    onFocus={() => setIsClientDropdownOpen(true)}
                                                />
                                                {searchTermClient && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setNewOrderClient('');
                                                            setSearchTermClient('');
                                                        }}
                                                        className="text-slate-600 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Dropdown List */}
                                            <AnimatePresence>
                                                {isClientDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[60]" onClick={() => setIsClientDropdownOpen(false)} />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[70] max-h-60 overflow-y-auto custom-scrollbar"
                                                        >
                                                            {filteredClients.length > 0 ? (
                                                                filteredClients.map(c => (
                                                                    <button
                                                                        key={c.id}
                                                                        className={`w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800/50 last:border-0 flex justify-between items-center group transition-colors ${newOrderClient === c.id ? 'bg-brand-cyan/10' : ''}`}
                                                                        onClick={() => {
                                                                            setNewOrderClient(c.id);
                                                                            setSearchTermClient(c.nome);
                                                                            setIsClientDropdownOpen(false);
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            <div className={`font-bold text-sm group-hover:text-brand-cyan transition-colors ${newOrderClient === c.id ? 'text-brand-cyan' : 'text-white'}`}>{c.nome}</div>
                                                                            <div className="text-[10px] text-slate-500 font-mono">{c.cidade}</div>
                                                                        </div>
                                                                        {newOrderClient === c.id && <CheckCircle size={14} className="text-brand-cyan" />}
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <div className="p-4 text-center text-slate-500 text-xs italic">
                                                                    Nenhum cliente encontrado.
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações</label>
                                        <textarea
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white h-20 resize-none focus:outline-none"
                                            value={newOrderObs}
                                            onChange={e => setNewOrderObs(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-800"></div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-brand-cyan uppercase tracking-wider">2. Adicionar Itens</h4>
                                        <button
                                            onClick={addVariationRow}
                                            disabled={!selProd}
                                            className="px-3 py-1 bg-slate-800 hover:bg-brand-cyan hover:text-slate-950 text-brand-cyan text-[10px] font-bold rounded-lg border border-brand-cyan/20 transition-all flex items-center gap-1 uppercase"
                                        >
                                            <Plus size={14} /> Cor / Tam
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Produto</label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none"
                                            value={selProd}
                                            onChange={e => {
                                                setSelProd(e.target.value);
                                                // Reset variations when product changes
                                                setPendingVariations([{ corId: '', tamId: '', qty: 1 }]);
                                            }}
                                        >
                                            <option value="">Selecione...</option>
                                            {produtos
                                                .filter(p => skus.some(s => s.produtoId === p.id && s.saldoDisponivel > 0))
                                                .map(p => <option key={p.id} value={p.id}>{p.referencia} - {p.descricao}</option>)
                                            }
                                        </select>
                                    </div>

                                    {/* Variation Rows */}
                                    <div className="space-y-3">
                                        {pendingVariations.map((v, idx) => (
                                            <div key={idx} className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 space-y-3 relative group/row">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">Variação {idx + 1}</span>
                                                    {pendingVariations.length > 1 && (
                                                        <button
                                                            onClick={() => removeVariationRow(idx)}
                                                            className="text-slate-600 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="col-span-1">
                                                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Cor</label>
                                                        <select
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none text-xs"
                                                            value={v.corId}
                                                            onChange={e => updateVariationRow(idx, 'corId', e.target.value)}
                                                            disabled={!selProd}
                                                        >
                                                            <option value="">Selecione...</option>
                                                            {cores
                                                                .filter(c => skus.some(s => s.produtoId === selProd && s.corId === c.id))
                                                                .map(c => <option key={c.id} value={c.id}>{c.nome}</option>)
                                                            }
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Tam.</label>
                                                        <select
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none text-xs"
                                                            value={v.tamId}
                                                            onChange={e => updateVariationRow(idx, 'tamId', e.target.value)}
                                                            disabled={!v.corId}
                                                        >
                                                            <option value="">Selecione...</option>
                                                            {tamanhos
                                                                .filter(t => skus.some(s => s.produtoId === selProd && s.corId === v.corId && s.tamanhoId === t.id))
                                                                .map(t => <option key={t.id} value={t.id}>{t.nome}</option>)
                                                            }
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Quantidade</label>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none font-bold text-sm"
                                                            value={v.qty}
                                                            onChange={e => updateVariationRow(idx, 'qty', Number(e.target.value))}
                                                            min={1}
                                                            disabled={!v.tamId}
                                                        />
                                                    </div>
                                                    {v.corId && v.tamId && (
                                                        <div className="text-[10px] text-brand-cyan self-end pb-2 font-mono">
                                                            Disp: {getSku(selProd, v.corId, v.tamId)?.saldoDisponivel || 0}
                                                        </div>
                                                    )}
                                                </div>

                                                {getSku(selProd, v.corId, v.tamId) && v.qty > (getSku(selProd, v.corId, v.tamId)?.saldoDisponivel || 0) && (
                                                    <div className="text-[10px] text-red-400 font-bold bg-red-500/10 p-2 rounded border border-red-500/20">
                                                        Saldo insuficiente!
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleAddItem}
                                        disabled={!selProd || pendingVariations.some(v => !v.corId || !v.tamId || v.qty <= 0)}
                                        className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-4 ${(!selProd || pendingVariations.some(v => !v.corId || !v.tamId || v.qty <= 0))
                                            ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                                            : 'bg-brand-cyan text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
                                            }`}
                                    >
                                        Adicionar ao Carrinho <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Right: Cart / Summary */}
                            <div className="w-1/2 flex flex-col bg-slate-900/50">
                                <div className="p-4 bg-slate-900 border-b border-slate-800 font-bold text-white uppercase tracking-wider text-sm flex justify-between">
                                    <span>Itens do Pedido</span>
                                    <span className="text-brand-cyan">{orderItems.length} Itens</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {orderItems.map((item, idx) => (
                                        <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center group">
                                            <div>
                                                <div className="font-bold text-white text-sm">{item.sku?.produto?.referencia}</div>
                                                <div className="text-xs text-slate-500 mb-1">{item.sku?.produto?.descricao}</div>
                                                <div className="inline-flex items-center gap-2 px-2 py-1 bg-slate-900 rounded text-[10px] text-slate-300 font-bold border border-slate-800">
                                                    <span>{item.sku?.cor?.nome}</span>
                                                    <span className="w-px h-3 bg-slate-700"></span>
                                                    <span>{item.sku?.tamanho?.nome}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-bold text-white">{item.quantidade}</span>
                                                <button
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-slate-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {orderItems.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                                            <ShoppingCart size={48} className="opacity-20" />
                                            <p>O carrinho está vazio.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 border-t border-slate-800 bg-slate-900">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-sm font-bold text-slate-400 uppercase">Total de Peças</span>
                                        <span className="text-3xl font-bold text-white">
                                            {orderItems.reduce((acc, curr) => acc + (curr.quantidade || 0), 0)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={!newOrderClient || orderItems.length === 0}
                                        className={`
                                                    w-full py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                                                    ${!newOrderClient || orderItems.length === 0
                                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                                : 'bg-green-500 hover:bg-green-400 text-slate-950 shadow-lg shadow-green-500/20'}
                                                `}
                                    >
                                        <CheckCircle size={20} /> Finalizar Pedido
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>,
                document.body
            )}
        </div>
    );
};
