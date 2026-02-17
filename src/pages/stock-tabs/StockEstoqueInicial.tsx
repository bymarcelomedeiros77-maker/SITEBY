import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Search, Save, AlertTriangle, Package, Ruler, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StockEstoqueInicial = () => {
    const { produtos, cores, tamanhos, skus, adjustStock, refreshStockData, addSku, addToast } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStocks, setEditingStocks] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(false);
    const [selectedProdutoId, setSelectedProdutoId] = useState<string | null>(null);

    // Filter available options based on selection
    const filteredProducts = useMemo(() => {
        return produtos.filter(p =>
            p.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [produtos, searchTerm]);

    const getSku = (prodId: string, corId: string, tamId: string) => {
        return skus.find(s => s.produtoId === prodId && s.corId === corId && s.tamanhoId === tamId);
    };

    const getKey = (prodId: string, corId: string, tamId: string) => `${prodId}:${corId}:${tamId}`;

    const handleStockChange = (prodId: string, corId: string, tamId: string, value: string) => {
        setEditingStocks(prev => ({
            ...prev,
            [getKey(prodId, corId, tamId)]: Number(value)
        }));
    };

    const handleSave = async (prodId: string, corId: string, tamId: string) => {
        const key = getKey(prodId, corId, tamId);
        const newBalance = editingStocks[key];
        const sku = getSku(prodId, corId, tamId);
        const currentBalance = sku ? sku.saldoFisico : 0;

        if (newBalance === undefined || newBalance === currentBalance) return;

        setLoading(true);

        try {
            let skuId = sku?.id;

            // If SKU doesn't exist, create it
            if (!skuId) {
                // If attempting to set 0 to 0 (effectively), ignore (though strict check above handles it)
                if (newBalance === 0) {
                    setLoading(false);
                    return;
                }
                const newId = await addSku(prodId, corId, tamId);
                if (newId) skuId = newId;
                else throw new Error("Falha ao criar SKU");
            }

            const delta = newBalance - currentBalance;
            if (delta !== 0) {
                const type = delta > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO';
                await adjustStock(skuId, Math.abs(delta), type, 'Definição de Estoque Inicial');
            }

            // Cleanup
            setEditingStocks(prev => {
                const newState = { ...prev };
                delete newState[key];
                return newState;
            });
        } catch (error) {
            console.error(error);
            addToast('error', "Erro ao salvar estoque.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">Estoque Inicial</h3>
                    <p className="text-sm text-slate-400 max-w-2xl">
                        Defina o saldo físico atual para cada combinação de referência, cor e tamanho.
                        <br />
                        <span className="text-brand-cyan text-xs">Nota: Isso gerará um registro de ajuste de estoque.</span>
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar Referência..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan"
                    />
                </div>
            </div>

            <div className="grid gap-8">
                {Object.entries(
                    filteredProducts.reduce((acc, prod) => {
                        const cat = prod.categoria || 'Sem Categoria'
                        if (!acc[cat]) acc[cat] = []
                        acc[cat].push(prod)
                        return acc
                    }, {} as Record<string, any[]>)
                ).map(([category, categoryProducts]: [string, any[]]) => (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center gap-3 border-l-4 border-brand-cyan pl-4 py-1 bg-slate-900/40 rounded-r-lg">
                            <h4 className="text-lg font-bold text-white uppercase tracking-widest">{category}</h4>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                                {categoryProducts.length} {categoryProducts.length === 1 ? 'REF.' : 'REFS.'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryProducts.map(prod => (
                                <motion.div
                                    key={prod.id}
                                    layoutId={`prod-${prod.id}`}
                                    onClick={() => setSelectedProdutoId(prod.id)}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-brand-cyan/50 hover:bg-slate-900 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-800 p-3 rounded-lg text-brand-cyan group-hover:bg-brand-cyan group-hover:text-slate-950 transition-colors">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg group-hover:text-brand-cyan transition-colors">{prod.referencia}</h4>
                                            <p className="text-xs text-slate-500 uppercase truncate max-w-[200px]">{prod.descricao}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 text-slate-600">
                        Nenhum produto encontrado. Cadastre produtos na aba "Cadastros" primeiro.
                    </div>
                )}
            </div>

            {/* Matrix Modal - Detailed Reference Grade */}
            <AnimatePresence>
                {selectedProdutoId && createPortal(
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProdutoId(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } }}
                            className="bg-slate-950 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl relative flex flex-col max-h-[95vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/50 rounded-t-2xl">
                                <div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-brand-cyan/20 p-3 rounded-xl text-brand-cyan">
                                            <Package size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-widest">
                                                    {produtos.find(p => p.id === selectedProdutoId)?.referencia}
                                                </h2>
                                                <span className="bg-slate-800 text-brand-cyan text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-brand-cyan/20">
                                                    Estoque Inicial
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 font-light mt-1">
                                                {produtos.find(p => p.id === selectedProdutoId)?.descricao}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedProdutoId(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all bg-slate-900 border border-slate-800">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content - Matrix */}
                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="mb-6 flex items-center justify-between text-xs text-slate-500 uppercase font-bold tracking-[0.2em]">
                                    <span className="flex items-center gap-2"><Ruler size={14} className="text-brand-cyan" /> Definição de grade física inicial</span>
                                    <span className="text-brand-cyan animate-pulse">Salva automaticamente ao sair do campo</span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
                                    <table className="w-full text-center border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900/50">
                                                <th className="p-4 text-left text-[10px] text-slate-400 uppercase font-bold tracking-widest min-w-[180px]">Cor / Tamanho</th>
                                                {tamanhos.map(t => (
                                                    <th key={t.id} className="p-4 text-xs text-white font-bold border-x border-slate-800/20 min-w-[80px] uppercase font-mono">{t.nome}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {cores.map(cor => (
                                                <tr key={cor.id} className="hover:bg-brand-cyan/5 transition-colors group">
                                                    <td className="p-4 text-left">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                                                                style={{ backgroundColor: cor.hex || (cor.nome.toLowerCase() === 'preto' ? '#000' : cor.nome.toLowerCase() === 'branco' ? '#fff' : '#ccc') }}
                                                            ></div>
                                                            <span className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-brand-cyan transition-colors">{cor.nome}</span>
                                                        </div>
                                                    </td>
                                                    {tamanhos.map(tam => {
                                                        const sku = getSku(selectedProdutoId!, cor.id, tam.id);
                                                        const currentVal = sku ? sku.saldoFisico : 0;
                                                        const key = getKey(selectedProdutoId!, cor.id, tam.id);
                                                        const editVal = editingStocks[key] !== undefined ? editingStocks[key] : currentVal;
                                                        const isModified = editingStocks[key] !== undefined && editingStocks[key] !== currentVal;

                                                        return (
                                                            <td key={tam.id} className="p-2 border-x border-slate-800/10">
                                                                <div className="relative flex justify-center">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className={`
                                                                            w-24 text-center bg-slate-950/50 border rounded-lg py-3 px-2 text-lg font-mono text-white
                                                                            focus:ring-1 focus:outline-none transition-all
                                                                            ${isModified ? 'border-yellow-500 ring-yellow-500/30' : 'border-slate-800 focus:border-brand-cyan focus:ring-brand-cyan/20'}
                                                                        `}
                                                                        value={editVal}
                                                                        onChange={(e) => handleStockChange(selectedProdutoId!, cor.id, tam.id, e.target.value)}
                                                                        onBlur={() => isModified && handleSave(selectedProdutoId!, cor.id, tam.id)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') handleSave(selectedProdutoId!, cor.id, tam.id);
                                                                        }}
                                                                        disabled={loading}
                                                                        placeholder="0"
                                                                    />
                                                                    {isModified && (
                                                                        <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-yellow-500 text-slate-950 rounded-full shadow-lg animate-bounce">
                                                                            <Save size={10} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900/30 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest px-8">
                                <div>Grade: {tamanhos.length} Tam. | Cores: {cores.length}</div>
                                <div>GESTÃO DE ESTOQUE ESTRATÉGICO v2.1</div>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    );
};
