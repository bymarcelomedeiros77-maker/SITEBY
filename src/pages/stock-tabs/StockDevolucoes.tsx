import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
    RotateCcw, Plus, Search, Filter, ArrowRight, Package, CheckCircle, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StockDevolucoes = () => {
    const { devolucoes, pedidos, addDevolucao, addToast } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Return State
    const [selPedidoId, setSelPedidoId] = useState('');
    const [selectedItems, setSelectedItems] = useState<{ skuId: string, quantidade: number, max: number, nome: string }[]>([]);
    const [motivo, setMotivo] = useState('');
    const [obs, setObs] = useState('');
    const [loading, setLoading] = useState(false);

    // Filtered Orders (Only Expedido)
    const expedidoOrders = pedidos.filter(p => p.status === 'EXPEDIDO' || p.status === 'FINALIZADO'); // Assuming finalized logic might exist later

    const handleSelectPedido = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pid = e.target.value;
        setSelPedidoId(pid);
        setSelectedItems([]); // Reset items

        if (pid) {
            const pedido = pedidos.find(p => p.id === pid);
            if (pedido) {
                // Initialize with 0 quantity but list all items
                const initialItems = pedido.itens.map(i => ({
                    skuId: i.skuId,
                    quantidade: 0,
                    max: i.quantidade,
                    nome: `${i.sku?.produto?.referencia} - ${i.sku?.cor?.nome} - ${i.sku?.tamanho?.nome}`
                }));
                setSelectedItems(initialItems);
            }
        }
    };

    const handleItemQtyChange = (skuId: string, q: number) => {
        setSelectedItems(prev => prev.map(i =>
            i.skuId === skuId ? { ...i, quantidade: Math.min(q, i.max) } : i
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const itemsToReturn = selectedItems.filter(i => i.quantidade > 0);
        if (itemsToReturn.length === 0) {
            addToast('error', "Selecione pelo menos um item para devolver.");
            return;
        }

        setLoading(true);
        try {
            const success = await addDevolucao(
                { pedidoId: selPedidoId, motivo, observacao: obs },
                itemsToReturn.map(i => ({ skuId: i.skuId, quantidade: i.quantidade }))
            );

            if (success) {
                setIsModalOpen(false);
                setSelPedidoId(''); setSelectedItems([]); setMotivo(''); setObs('');
                addToast('success', "Devolução registrada com sucesso!");
            }
        } catch (error: any) {
            console.error("Erro ao registrar devolução:", error);
            addToast('error', `Erro ao registrar devolução: ${error.message || "Verifique os dados."}`);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <RotateCcw className="text-brand-cyan" /> Devoluções
                </h2>
                <button
                    onClick={() => { console.log("Click Nova Devolucao"); setIsModalOpen(true); }}
                    className="bg-brand-cyan text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                >
                    <Plus size={18} /> Nova Devolução
                </button>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {devolucoes.map(dev => (
                    <motion.div
                        key={dev.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg font-bold text-white">Devolução #{dev.numero}</span>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 uppercase font-bold">{dev.status}</span>
                                </div>
                                <div className="text-sm text-slate-400">
                                    Ref. Pedido #{dev.pedido?.numero} • {new Date(dev.dataDevolucao).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                                Motivo: <span className="text-white">{dev.motivo}</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-3">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">Itens Devolvidos</div>
                            <div className="space-y-1">
                                {dev.itens.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-slate-300">
                                            {item.sku?.produto?.referencia} {item.sku?.produto?.descricao}
                                            <span className="text-slate-500 mx-1">|</span>
                                            {item.sku?.cor?.nome} - {item.sku?.tamanho?.nome}
                                        </span>
                                        <span className="text-white font-mono">{item.quantidade} pçs</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
                {devolucoes.length === 0 && (
                    <div className="text-center py-20 text-slate-600">Nenhuma devolução registrada.</div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && createPortal(
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <h3 className="text-xl font-bold text-white uppercase mb-6 flex items-center gap-2">
                            <RotateCcw className="text-brand-cyan" size={20} /> Registrar Devolução
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selecione o Pedido (Expedido)</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none"
                                    value={selPedidoId}
                                    onChange={handleSelectPedido}
                                    required
                                >
                                    <option value="">Selecione um pedido...</option>
                                    {expedidoOrders.map(p => (
                                        <option key={p.id} value={p.id}>
                                            Pedido #{p.numero} - {p.cliente?.nome} ({new Date(p.dataPedido).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selPedidoId && (
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Selecione os itens e quantidades</label>
                                    <div className="space-y-3">
                                        {selectedItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-slate-300 flex-1">{item.nome}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">Max: {item.max}</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.max}
                                                        className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-right focus:border-brand-cyan outline-none"
                                                        value={item.quantidade}
                                                        onChange={e => handleItemQtyChange(item.skuId, Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none"
                                    value={motivo}
                                    onChange={e => setMotivo(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Defeito">Defeito</option>
                                    <option value="Tamanho Incorreto">Tamanho Incorreto</option>
                                    <option value="Arrependimento">Arrependimento</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none h-20 resize-none"
                                    value={obs}
                                    onChange={e => setObs(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold uppercase hover:bg-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-brand-cyan text-slate-950 py-3 rounded-lg font-bold uppercase hover:bg-cyan-400"
                                >
                                    {loading ? 'Processando...' : 'Confirmar Devolução'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>,
                document.body
            )}

        </div >
    );
};
