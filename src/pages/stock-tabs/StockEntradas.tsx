import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Save, Package, ArrowRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StockEntradas = () => {
    const { produtos, cores, tamanhos, skus, adjustStock, addSku, cortes, movimentacoes, syncCorteToStock, confirm } = useApp();
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState('');
    const [docRef, setDocRef] = useState('');
    const [obs, setObs] = useState('');
    const [loading, setLoading] = useState(false);

    // Notification state replacing 'success' boolean and alerts
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Helper to find SKU
    const currentSku = skus.find(s =>
        s.produtoId === selectedProduct &&
        s.corId === selectedColor &&
        s.tamanhoId === selectedSize
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !selectedColor || !selectedSize || !quantity) return;

        setLoading(true);
        try {
            // Check if SKU exists
            let skuId = currentSku?.id;

            if (!skuId) {
                // Auto-create SKU
                const newSkuId = await addSku(selectedProduct, selectedColor, selectedSize);
                if (newSkuId) {
                    skuId = newSkuId;
                } else {
                    setNotification({ message: "Erro ao criar SKU automaticamente. Tente novamente.", type: 'error' });
                    setLoading(false);
                    return;
                }
            }

            const success = await adjustStock(
                skuId,
                Number(quantity),
                'ENTRADA_COMPRA',
                `Entrada Manual. Doc: ${docRef}. Obs: ${obs}`
            );

            if (success) {
                setQuantity('');
                setDocRef('');
                setObs('');
                setNotification({ message: "Entrada Registrada com Sucesso!", type: 'success' });
                setTimeout(() => setNotification(null), 3000);
            }
        } catch (error) {
            console.error(error);
            setNotification({ message: "Erro ao realizar entrada.", type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">Nova Entrada de Estoque</h3>
                <p className="text-sm text-slate-400">
                    Registre a entrada de mercadorias por Compra ou Produção Interna.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 space-y-6">

                        {/* Product Selection */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Produto / Referência</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-cyan focus:outline-none"
                                    value={selectedProduct}
                                    onChange={e => setSelectedProduct(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione um Produto...</option>
                                    {produtos.map(p => (
                                        <option key={p.id} value={p.id}>{p.referencia} - {p.descricao}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-cyan focus:outline-none"
                                        value={selectedColor}
                                        onChange={e => setSelectedColor(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {cores.map(c => (
                                            <option key={c.id} value={c.id}>{c.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tamanho</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-cyan focus:outline-none"
                                        value={selectedSize}
                                        onChange={e => setSelectedSize(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {tamanhos.map(t => (
                                            <option key={t.id} value={t.id}>{t.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-800 my-4"></div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-cyan focus:outline-none font-mono text-lg"
                                    placeholder="0"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº Documento / NF (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-cyan focus:outline-none"
                                    placeholder="Ex: NF-1234"
                                    value={docRef}
                                    onChange={e => setDocRef(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações</label>
                            <textarea
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-cyan focus:outline-none h-20 resize-none"
                                placeholder="Detalhes adicionais..."
                                value={obs}
                                onChange={e => setObs(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                                w-full py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                                ${loading
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-green-500 hover:bg-green-400 text-slate-950 shadow-lg shadow-green-500/20'}
                            `}
                        >
                            {loading ? 'Processando...' : (
                                <>
                                    <Plus size={20} /> Confirmar Entrada
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Import from Cuts */}
                <div className="md:col-span-1">
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 h-full flex flex-col">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Package size={16} className="text-brand-cyan" /> Recebimentos de Facção
                        </h4>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                            {(() => {
                                // Filter cuts that are RECEIVED
                                const receivedCortes = cortes.filter(c => c.status === 'RECEBIDO').sort((a, b) => new Date(b.dataRecebimento || '').getTime() - new Date(a.dataRecebimento || '').getTime());

                                return receivedCortes.length > 0 ? (
                                    receivedCortes.map(corte => {
                                        // Check if already synced (Legacy check OR New field check)
                                        const isLegacySynced = movimentacoes.some(m => m.observacao?.includes(corte.referencia) && m.tipo === 'ENTRADA_PRODUCAO');
                                        const isSynced = !!corte.sincronizadoEm || (corte.observacoesRecebimento || '').includes('[SYNCED') || isLegacySynced;

                                        // Parse date
                                        let syncDate = corte.sincronizadoEm ? new Date(corte.sincronizadoEm).toLocaleDateString() : null;
                                        if (!syncDate && (corte.observacoesRecebimento || '').includes('[SYNCED')) {
                                            const match = corte.observacoesRecebimento?.match(/\[SYNCED:(.*?)\]/);
                                            if (match && match[1]) syncDate = new Date(match[1]).toLocaleDateString();
                                        }

                                        return (
                                            <div key={corte.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 group hover:border-slate-700 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-white font-bold block">{corte.referencia}</span>
                                                        <span className="text-[10px] text-slate-500 uppercase">Recebido: {new Date(corte.dataRecebimento || '').toLocaleDateString()}</span>
                                                    </div>
                                                    {isSynced ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 mb-1">
                                                                Sincronizado
                                                            </span>
                                                            {syncDate && <span className="text-[9px] text-slate-500">{syncDate}</span>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                            Pendente
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-xs text-slate-400 mb-3">
                                                    Qtd items: <span className="text-white font-mono">{corte.qtdTotalRecebida}</span>
                                                </div>

                                                {!isSynced && (
                                                    <button
                                                        onClick={async () => {
                                                            const confirmed = await confirm({
                                                                title: 'Importar Estoque',
                                                                message: `Deseja importar o estoque do corte ${corte.referencia}?`,
                                                                confirmText: 'Importar',
                                                                type: 'info'
                                                            });
                                                            if (confirmed) {
                                                                setLoading(true);
                                                                const result = await syncCorteToStock(corte.id);
                                                                setLoading(false);

                                                                setNotification({
                                                                    message: result.message,
                                                                    type: result.success ? 'success' : 'error'
                                                                });

                                                                // Clear notification after 4s
                                                                setTimeout(() => setNotification(null), 4000);
                                                            }
                                                        }}
                                                        className="w-full bg-slate-800 hover:bg-brand-cyan hover:text-slate-950 text-white text-xs py-2 rounded transition-colors font-bold uppercase flex items-center justify-center gap-1"
                                                    >
                                                        <ArrowRight size={12} /> Importar Estoque
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10 text-slate-600 text-xs italic">
                                        Nenhum corte recebido encontrado.
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-bold z-50 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-slate-950'
                            }`}
                    >
                        <CheckCircle size={24} />
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
