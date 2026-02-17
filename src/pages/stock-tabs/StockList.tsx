import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Package, Search, Filter, X, Box, Trash2, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export const StockList = () => {
    const { produtos, skus, cores, tamanhos, deleteProduto } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProdutoId, setSelectedProdutoId] = useState<string | null>(null);

    // Group SKUs by Product
    const stockByProduct = useMemo(() => {
        const groups: Record<string, { produto: any, totalFisico: number, totalDisponivel: number, skus: any[] }> = {};

        skus.forEach(sku => {
            if (!sku.produtoId) return;

            if (!groups[sku.produtoId]) {
                const prod = produtos.find(p => p.id === sku.produtoId);
                if (prod) {
                    groups[sku.produtoId] = {
                        produto: prod,
                        totalFisico: 0,
                        totalDisponivel: 0,
                        skus: []
                    };
                }
            }

            if (groups[sku.produtoId]) {
                groups[sku.produtoId].totalFisico += (sku.saldoFisico || 0);
                groups[sku.produtoId].totalDisponivel += (sku.saldoDisponivel || 0);
                groups[sku.produtoId].skus.push(sku);
            }
        });

        // Add products with 0 stock (if they exist in products but no SKUs or 0 balance SKUs)
        produtos.forEach(prod => {
            if (!groups[prod.id]) {
                groups[prod.id] = {
                    produto: prod,
                    totalFisico: 0,
                    totalDisponivel: 0,
                    skus: []
                };
            }
        });

        return Object.values(groups).sort((a, b) => a.produto.referencia.localeCompare(b.produto.referencia));
    }, [produtos, skus]);

    const filteredStock = stockByProduct.filter(item =>
        item.produto.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportExcel = () => {
        const data: any[] = [];

        filteredStock.forEach(item => {
            if (item.skus.length > 0) {
                item.skus.forEach(sku => {
                    data.push({
                        'Referência': item.produto.referencia,
                        'Descrição': item.produto.descricao,
                        'Categoria': item.produto.categoria || '-',
                        'Cor': sku.cor?.nome || '-',
                        'Tamanho': sku.tamanho?.nome || '-',
                        'Saldo Físico': sku.saldoFisico || 0,
                        'Saldo Reservado': sku.saldoReservado || 0,
                        'Saldo Disponível': sku.saldoDisponivel || 0,
                        'Estoque Mínimo': sku.estoqueMinimo || 0,
                        'Status': item.produto.ativo ? 'Ativo' : 'Inativo'
                    });
                });
            } else {
                data.push({
                    'Referência': item.produto.referencia,
                    'Descrição': item.produto.descricao,
                    'Categoria': item.produto.categoria || '-',
                    'Cor': '-',
                    'Tamanho': '-',
                    'Saldo Físico': 0,
                    'Saldo Reservado': 0,
                    'Saldo Disponível': 0,
                    'Estoque Mínimo': 0,
                    'Status': item.produto.ativo ? 'Ativo' : 'Inativo'
                });
            }
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "EstoqueDetalhado");
        XLSX.writeFile(wb, `Estoque_Detalhado_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const selectedItem = useMemo(() => {
        if (!selectedProdutoId) return null;
        return stockByProduct.find(i => i.produto.id === selectedProdutoId);
    }, [selectedProdutoId, stockByProduct]);

    // Matrix for Modal (Rows: Colors, Cols: Sizes)
    const modalMatrix = useMemo(() => {
        if (!selectedItem) return null;

        // Get unique colors and sizes present in this product's SKUs
        // Actually, we should probably show ALL/Active colors and sizes to give a full grid, 
        // OR just the ones that have been registered as SKUs.
        // Let's show all registered SKUs.

        const relevantSkus = selectedItem.skus;
        const colorIds = Array.from(new Set(relevantSkus.map(s => s.corId)));
        const sizeIds = Array.from(new Set(relevantSkus.map(s => s.tamanhoId)));

        const productCores = cores.filter(c => colorIds.includes(c.id));
        const productTamanhos = tamanhos.filter(t => sizeIds.includes(t.id)).sort((a, b) => a.ordem - b.ordem);

        return {
            cores: productCores,
            tamanhos: productTamanhos,
            skus: relevantSkus
        };
    }, [selectedItem, cores, tamanhos]);

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Toolbar */}
            <div className="flex gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por referência ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan/50"
                    />
                </div>
                <button
                    onClick={handleExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold uppercase text-xs shadow-lg shadow-emerald-500/20"
                >
                    <FileSpreadsheet size={16} /> Exportar Excel
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {filteredStock.map((item) => (
                    <motion.div
                        layoutId={`card-${item.produto.id}`}
                        key={item.produto.id}
                        onClick={() => setSelectedProdutoId(item.produto.id)}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-brand-cyan/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] cursor-pointer transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                            <Box size={60} />
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); deleteProduto(item.produto.id); }}
                            className="absolute top-2 right-2 p-2 bg-slate-900/80 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all z-20"
                            title="Excluir Produto"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white font-mono tracking-wider">{item.produto.referencia}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.produto.ativo ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {item.produto.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1 mb-4 h-4">{item.produto.descricao}</p>

                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <div className="bg-slate-900/50 p-2 rounded-lg text-center border border-slate-800/50 group-hover:border-brand-cyan/20 transition-colors">
                                    <span className="text-[10px] text-slate-500 uppercase block">Físico</span>
                                    <span className="text-lg font-bold text-white">{item.totalFisico}</span>
                                </div>
                                <div className="bg-slate-900/50 p-2 rounded-lg text-center border border-slate-800/50 group-hover:border-brand-cyan/20 transition-colors">
                                    <span className="text-[10px] text-slate-500 uppercase block">Disponível</span>
                                    <span className="text-lg font-bold text-brand-cyan">{item.totalDisponivel}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal Detail - Using Portal to fix clipping */}
            {selectedItem && modalMatrix && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProdutoId(null)}>
                    <motion.div
                        layoutId={`card-${selectedItem.produto.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="bg-slate-950 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/50">
                            <div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-brand-cyan/20 p-3 rounded-xl text-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                        <Package size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-bold text-white font-mono tracking-tight">{selectedItem.produto.referencia}</h2>
                                            {selectedItem.produto.categoria && (
                                                <span className="bg-slate-800 text-brand-cyan text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-brand-cyan/20">
                                                    {selectedItem.produto.categoria}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 font-light">{selectedItem.produto.descricao}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 mt-6">
                                    <div className="bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Total Físico</span>
                                        <span className="text-2xl font-bold text-white">{selectedItem.totalFisico}</span>
                                    </div>
                                    <div className="bg-brand-cyan/10 px-4 py-2 rounded-lg border border-brand-cyan/20">
                                        <span className="text-[10px] text-brand-cyan uppercase font-bold tracking-wider block mb-1">Total Disponível</span>
                                        <span className="text-2xl font-bold text-brand-cyan">{selectedItem.totalDisponivel}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedProdutoId(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all bg-slate-900 border border-slate-800">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content - Matrix */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-nexus-dark/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Box size={14} className="text-brand-cyan" /> detatalhamento de grade operacional
                            </h3>

                            {modalMatrix.cores.length > 0 && modalMatrix.tamanhos.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
                                    <table className="w-full text-center border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900/80">
                                                <th className="p-4 text-left text-[10px] text-slate-400 uppercase font-bold tracking-widest min-w-[180px]">Cor / Tamanho</th>
                                                {modalMatrix.tamanhos.map(t => (
                                                    <th key={t.id} className="p-4 text-xs text-brand-cyan font-bold border-x border-slate-800/50 min-w-[70px] uppercase font-mono">{t.nome}</th>
                                                ))}
                                                <th className="p-4 text-[10px] text-slate-400 uppercase font-bold tracking-widest min-w-[100px] border-l border-slate-800">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {modalMatrix.cores.map(cor => {
                                                let totalCor = 0;
                                                return (
                                                    <tr key={cor.id} className="hover:bg-brand-cyan/5 transition-colors group">
                                                        <td className="p-4 text-left">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-5 h-5 rounded-full border-2 border-slate-700 shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform"
                                                                    style={{ backgroundColor: cor.hex || (cor.nome.toLowerCase() === 'preto' ? '#000' : cor.nome.toLowerCase() === 'branco' ? '#fff' : '#ccc') }}
                                                                ></div>
                                                                <span className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-brand-cyan transition-colors">{cor.nome}</span>
                                                            </div>
                                                        </td>
                                                        {modalMatrix.tamanhos.map(t => {
                                                            const sku = modalMatrix.skus.find(s => s.corId === cor.id && s.tamanhoId === t.id);
                                                            const qtd = sku ? sku.saldoFisico : 0;
                                                            totalCor += qtd;
                                                            return (
                                                                <td key={t.id} className="p-3 border-x border-slate-800/30">
                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <span className={`text-base font-bold font-mono ${qtd > 0 ? 'text-white' : 'text-slate-800'}`}>
                                                                            {qtd > 0 ? qtd : '0'}
                                                                        </span>
                                                                        {sku && sku.saldoReservado > 0 && (
                                                                            <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded mt-1" title="Reservado">
                                                                                RES: {sku.saldoReservado}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-4 font-bold text-brand-cyan bg-brand-cyan/5 text-lg font-mono border-l border-slate-800">{totalCor}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-600 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                                    <Box size={40} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-xs">Nenhum SKU gerado operacionalmente</p>
                                    <p className="text-[10px] mt-2 text-slate-700">Utilize os módulos de "Entradas" ou "Produção" para alimentar este inventário.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex justify-end gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            BY MARCELO MEDEIRORS • SISTEMA DE GESTÃO AUTOMATIZADO v2.0
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};
