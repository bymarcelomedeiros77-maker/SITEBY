import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Sliders, Search, Save, AlertTriangle, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StockAjustes = () => {
    const { skus, adjustStock, user } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSku, setSelectedSku] = useState<any>(null);
    const [auditMode, setAuditMode] = useState<'DELTA' | 'ABSOLUTE'>('DELTA'); // For now only DELTA is supported by backend properly
    const [adjustmentValue, setAdjustmentValue] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const filteredSkus = skus.filter(s =>
        searchTerm && (
            s.produto?.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.produto?.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSku) return;

        setLoading(true);
        const qty = Number(adjustmentValue);

        // adjustStock takes (skuId, qty, type, obs). 
        // If qty is negative, it's a "loss/saida", if positive it's "gain/entrada/sobra".
        // But adjustStock expects type 'ENTRADA' | 'SAIDA'.
        // Let's map logic: 
        // If qty > 0 -> ENTRADA (Tipo AJUSTE maps to generic logic inside AppContext but let's be explicit)
        // Wait, AppContext logic:
        // if type === 'AJUSTE' -> newBalance += quantidade. So it supports signed constraint?
        // Let's check AppContext logic again.
        // "if (tipo === 'AJUSTE') { newBalance += quantidade; }"
        // So yes, AJUSTE type supports generic delta addition.

        const success = await adjustStock(
            selectedSku.id,
            qty,
            'AJUSTE',
            `Ajuste Manual: ${reason}`
        );

        if (success) {
            setSelectedSku(null);
            setAdjustmentValue('');
            setReason('');
            setSearchTerm('');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-white">
                <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="text-brand-cyan" /> Ajustes de Estoque
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search Column */}
                <div className="col-span-1 bg-slate-950/50 border border-slate-800 rounded-xl p-4 h-fit">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar Referência..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan"
                        />
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {searchTerm && filteredSkus.map(sku => (
                            <div
                                key={sku.id}
                                onClick={() => setSelectedSku(sku)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedSku?.id === sku.id
                                    ? 'bg-brand-cyan/20 border-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                    }`}
                            >
                                <div className="font-bold text-white text-sm">{sku.produto?.referencia}</div>
                                <div className="text-xs text-slate-400">{sku.produto?.descricao}</div>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-[10px] bg-slate-800 px-2 rounded text-slate-300">{sku.cor?.nome}</span>
                                    <span className="text-[10px] bg-slate-800 px-2 rounded text-slate-300">{sku.tamanho?.nome}</span>
                                </div>
                                <div className="mt-2 text-right text-xs text-brand-cyan font-mono">
                                    Saldo Físico: {sku.saldoFisico}
                                </div>
                            </div>
                        ))}
                        {searchTerm && filteredSkus.length === 0 && (
                            <div className="text-center text-slate-600 text-xs py-4">Nenhuma referência encontrada.</div>
                        )}
                        {!searchTerm && (
                            <div className="text-center text-slate-600 text-xs py-4">Digite para buscar...</div>
                        )}
                    </div>
                </div>

                {/* Adjustment Form */}
                <div className="col-span-2">
                    <AnimatePresence mode="wait">
                        {selectedSku ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <AlertTriangle size={100} className="text-brand-cyan" />
                                </div>

                                <h3 className="text-lg font-bold text-white mb-6">
                                    Ajustar Estoque: <span className="text-brand-cyan">{selectedSku.produto?.referencia}</span>
                                </h3>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="bg-slate-900 p-4 rounded-lg text-center border border-slate-800">
                                        <div className="text-xs text-slate-500 uppercase mb-1">Saldo Físico Atual</div>
                                        <div className="text-2xl font-mono text-white">{selectedSku.saldoFisico}</div>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-lg text-center border border-slate-800">
                                        <div className="text-xs text-slate-500 uppercase mb-1">Saldo Reservado</div>
                                        <div className="text-2xl font-mono text-white">{selectedSku.saldoReservado}</div>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-lg text-center border border-slate-800">
                                        <div className="text-xs text-slate-500 uppercase mb-1">Saldo Disponível</div>
                                        <div className="text-2xl font-mono text-white">{selectedSku.saldoDisponivel}</div>
                                    </div>
                                </div>

                                <form onSubmit={handleAdjust} className="space-y-6 relative z-10">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                            Quantidade do Ajuste (Delta)
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                placeholder="+10 ou -5"
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 text-xl text-white font-mono focus:border-brand-cyan outline-none"
                                                value={adjustmentValue}
                                                onChange={e => setAdjustmentValue(e.target.value)}
                                                required
                                            />
                                            <div className="text-xs text-slate-500 w-48">
                                                Use números positivos para adicionar (ex: sobra) ou negativos para remover (ex: perda/roubo).
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                            Motivo / Justificativa
                                        </label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none mb-2"
                                            value={reason}
                                            onChange={e => setReason(e.target.value)}
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Inventário (Contagem)">Inventário (Contagem)</option>
                                            <option value="Perda">Perda</option>
                                            <option value="Roubo/Extravio">Roubo/Extravio</option>
                                            <option value="Avaria">Avaria</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-brand-cyan text-slate-950 px-8 py-3 rounded-lg font-bold uppercase hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                                        >
                                            <Save size={18} /> {loading ? 'Salvando...' : 'Confirmar Ajuste'}
                                        </button>
                                    </div>
                                </form>

                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl p-10 bg-slate-950/30"
                            >
                                <Search size={48} className="mb-4 opacity-20" />
                                <p>Selecione uma referência ao lado para realizar ajuste.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
