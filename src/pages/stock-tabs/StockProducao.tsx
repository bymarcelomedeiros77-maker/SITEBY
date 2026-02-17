import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
    Scissors, Plus, Search, Filter, Calendar, User,
    CheckCircle, Clock, X, Trash2, ArrowRight, Package, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusProducao } from '../../types';

export const StockProducao = () => {
    const { producao, produtos, cores, tamanhos, skus, addOrdemProducao, updateStatusProducao, addSku, addToast, confirm } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New OP State
    const [selProd, setSelProd] = useState('');
    const [selCor, setSelCor] = useState('');
    const [selTam, setSelTam] = useState('');
    const [selQty, setSelQty] = useState('');
    const [obs, setObs] = useState('');
    const [loading, setLoading] = useState(false);

    // Helpers
    const getSku = (p: string, c: string, t: string) => skus.find(s => s.produtoId === p && s.corId === c && s.tamanhoId === t);

    const handleCreateOP = async (e: React.FormEvent) => {
        e.preventDefault();

        let skuId: string | undefined;
        const existingSku = getSku(selProd, selCor, selTam);

        if (existingSku) {
            skuId = existingSku.id;
        } else {
            // Try to create SKU on the fly
            try {
                const newId = await addSku(selProd, selCor, selTam);
                if (newId) skuId = newId;
            } catch (err) {
                console.error("Erro ao criar SKU automaticamente:", err);
            }
        }

        if (!skuId) {
            addToast('error', 'Não foi possível identificar ou criar o código SKU para esta combinação de Produto/Cor/Tamanho. Verifique os cadastros.');
            return;
        }

        setLoading(true);
        try {
            const success = await addOrdemProducao({
                skuId: skuId,
                quantidade: Number(selQty),
                status: 'PLANEJADO',
                responsavel: 'Interno',
                observacao: obs
            });

            if (success) {
                setIsModalOpen(false);
                setSelProd(''); setSelCor(''); setSelTam(''); setSelQty(''); setObs('');
                addToast('success', "Ordem de Produção criada com sucesso!");
            }
        } catch (error: any) {
            console.error("Erro ao criar OP:", error);
            addToast('error', `Erro ao criar OP: ${error.message || "Verifique os dados."}`);
        }
        setLoading(false);
    };

    const handleNextStatus = async (opId: string, currentStatus: StatusProducao) => {
        let next: StatusProducao | null = null;
        if (currentStatus === 'PLANEJADO') next = 'CORTE';
        else if (currentStatus === 'CORTE') next = 'COSTURA';
        else if (currentStatus === 'COSTURA') next = 'ACABAMENTO';
        else if (currentStatus === 'ACABAMENTO') next = 'FINALIZADO';

        const confirmed = await confirm({
            title: 'Avançar Produção',
            message: `Avançar status para ${next}?`,
            confirmText: 'Avançar',
            type: 'info'
        });

        if (next && confirmed) {
            const success = await updateStatusProducao(opId, next);
            if (success) addToast('success', `Status avançado para ${next}.`);
            else addToast('error', "Erro ao atualizar status.");
        }
    };

    const handleCancel = async (opId: string) => {
        const confirmed = await confirm({
            title: 'Cancelar OP',
            message: "Deseja cancelar esta OP?",
            confirmText: 'Sim, Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            const success = await updateStatusProducao(opId, 'CANCELADO');
            if (success) addToast('success', "OP cancelada com sucesso.");
            else addToast('error', "Erro ao cancelar OP.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar OP..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan"
                        />
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-cyan text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                >
                    <Plus size={18} /> Nova Ordem de Produção
                </button>
            </div>

            {/* Kanban / List View */}
            <div className="grid gap-4">
                {producao.map(op => (
                    <motion.div
                        key={op.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden group"
                    >
                        {/* Status Stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${op.status === 'PLANEJADO' ? 'bg-slate-600' :
                            op.status === 'CORTE' ? 'bg-orange-500' :
                                op.status === 'COSTURA' ? 'bg-pink-500' :
                                    op.status === 'ACABAMENTO' ? 'bg-purple-500' :
                                        op.status === 'FINALIZADO' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>

                        <div className="flex justify-between items-start pl-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xl font-bold text-white">OP #{op.numero}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${op.status === 'PLANEJADO' ? 'bg-slate-800 text-slate-400' :
                                        op.status === 'CORTE' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' :
                                            op.status === 'COSTURA' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' :
                                                op.status === 'ACABAMENTO' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                                                    op.status === 'FINALIZADO' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                                                        'bg-red-500/10 text-red-500'
                                        }`}>
                                        {op.status}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-300 font-bold mb-1">
                                    {op.sku?.produto?.referencia} - {op.sku?.produto?.descricao}
                                </div>
                                <div className="inline-flex items-center gap-2 px-2 py-1 bg-slate-900 rounded text-[10px] text-slate-400 border border-slate-800">
                                    <span>{op.sku?.cor?.nome}</span>
                                    <span className="w-px h-3 bg-slate-700"></span>
                                    <span>{op.sku?.tamanho?.nome}</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-2xl font-bold text-white mb-1">{op.quantidade} <span className="text-xs text-slate-500 font-normal">pçs</span></div>
                                <div className="text-xs text-slate-500">{new Date(op.dataCriacao).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Progress Bar (Visual) */}
                        <div className="mt-6 pl-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 mb-2">
                                <span className={op.status !== 'CANCELADO' ? 'text-brand-cyan' : ''}>Planejado</span>
                                <span className="mx-1">→</span>
                                <span className={['CORTE', 'COSTURA', 'ACABAMENTO', 'FINALIZADO'].includes(op.status) ? 'text-orange-500' : ''}>Corte</span>
                                <span className="mx-1">→</span>
                                <span className={['COSTURA', 'ACABAMENTO', 'FINALIZADO'].includes(op.status) ? 'text-pink-500' : ''}>Costura</span>
                                <span className="mx-1">→</span>
                                <span className={['ACABAMENTO', 'FINALIZADO'].includes(op.status) ? 'text-purple-500' : ''}>Acabamento</span>
                                <span className="mx-1">→</span>
                                <span className={op.status === 'FINALIZADO' ? 'text-green-500' : ''}>Estoque</span>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-800/50">
                                {op.status !== 'FINALIZADO' && op.status !== 'CANCELADO' && (
                                    <>
                                        <button
                                            onClick={() => handleCancel(op.id)}
                                            className="text-xs text-red-500 hover:bg-slate-900 px-3 py-2 rounded transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => handleNextStatus(op.id, op.status)}
                                            className="flex items-center gap-2 text-xs bg-brand-cyan text-slate-950 px-4 py-2 rounded-lg font-bold uppercase hover:bg-cyan-400 transition-colors"
                                        >
                                            Próxima Etapa <ArrowRight size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
                {producao.length === 0 && (
                    <div className="text-center py-20 text-slate-600">Nenhuma Ordem de Produção encontrada.</div>
                )}
            </div>

            {/* Modal Create OP */}
            <AnimatePresence>
                {isModalOpen && createPortal(
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
                            className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-bold text-white uppercase mb-6 flex items-center gap-2">
                                <Scissors className="text-brand-cyan" size={20} /> Nova OP
                            </h3>

                            <form onSubmit={handleCreateOP} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Produto</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none"
                                        value={selProd}
                                        onChange={e => setSelProd(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {produtos.map(p => <option key={p.id} value={p.id}>{p.referencia} - {p.descricao}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor</label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none"
                                            value={selCor}
                                            onChange={e => setSelCor(e.target.value)}
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {cores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tamanho</label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none"
                                            value={selTam}
                                            onChange={e => setSelTam(e.target.value)}
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {tamanhos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none font-mono"
                                        value={selQty}
                                        onChange={e => setSelQty(e.target.value)}
                                        required
                                        min="1"
                                    />
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
                                        {loading ? 'Criando...' : 'Criar OP'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    );
};
