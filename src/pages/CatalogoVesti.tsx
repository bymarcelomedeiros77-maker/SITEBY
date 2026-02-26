import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    Package,
    Search,
    Plus,
    Trash2,
    Edit3,
    Image as ImageIcon,
    CheckCircle,
    XCircle,
    Filter,
    TrendingUp,
    DollarSign,
    Layers,
    ShoppingBag,
    Eye,
    Camera,
    Download,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCard = ({ produto, onEdit, onDelete, onView }: any) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imagens = (produto.imagens && produto.imagens.length > 0) ? produto.imagens : (produto.imagem ? [produto.imagem] : []);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            className={`tech-card group overflow-hidden flex flex-col h-full border-b-4 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${produto.ativo ? 'border-brand-cyan shadow-brand-cyan/5' : 'border-rose-500 shadow-rose-500/5'}`}
        >
            {/* Product Image Carousel */}
            <div className="aspect-square relative bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800/50">
                <AnimatePresence mode="wait">
                    {imagens.length > 0 ? (
                        <motion.img
                            key={currentImageIndex}
                            src={imagens[currentImageIndex]}
                            alt={`${produto.referencia} - ${currentImageIndex + 1}`}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-800 group-hover:text-slate-700 transition-colors">
                            <ImageIcon size={64} />
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">SEM_IMAGEM</span>
                        </div>
                    )}
                </AnimatePresence>

                {/* Carousel Navigation */}
                {imagens.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-slate-950/40 hover:bg-slate-950/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md z-10 border border-white/5"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-950/40 hover:bg-slate-950/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md z-10 border border-white/5"
                        >
                            <ChevronRight size={16} />
                        </button>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-slate-950/40 backdrop-blur-md rounded-full z-10 border border-white/5">
                            {imagens.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'bg-brand-cyan w-4' : 'bg-slate-500 w-1.5 hover:bg-slate-400'}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Overlay Feedback for Active Status */}
                {!produto.ativo && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-rose-500 text-white text-[8px] font-black uppercase rounded shadow-[0_0_15px_rgba(244,63,94,0.5)] z-30 animate-pulse">Inativo</div>
                )}
            </div>

            {/* Product Info & Actions */}
            <div className="p-5 flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-5">
                    <div className="flex-1">
                        <h4 className="text-[9px] font-mono text-brand-cyan uppercase tracking-[0.25em] mb-1 font-black opacity-70">{produto.referencia}</h4>
                        <h3 className="text-sm font-black text-white uppercase group-hover:text-brand-cyan transition-colors line-clamp-1 leading-tight">{produto.descricao || 'Produto sem descrição'}</h3>
                    </div>
                    <div className="ml-4 text-right">
                        <p className="text-xs font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">R$ {produto.valor ? produto.valor.toLocaleString() : '0,00'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-3">
                    <button
                        onClick={() => onEdit(produto)}
                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl transition-all text-[9.5px] font-black uppercase tracking-widest border border-slate-700/50 hover:border-slate-500/50 active:scale-95"
                    >
                        <Edit3 size={13} /> Editar
                    </button>
                    <button
                        onClick={() => onDelete(produto.id)}
                        className="flex items-center justify-center gap-2 bg-rose-500/5 hover:bg-rose-500/15 text-rose-500 py-2.5 rounded-xl transition-all text-[9.5px] font-black uppercase tracking-widest border border-rose-500/10 hover:border-rose-500/30 active:scale-95"
                    >
                        <Trash2 size={13} /> Excluir
                    </button>
                </div>

                <button
                    onClick={() => onView(produto)}
                    className="w-full flex items-center justify-center gap-2 bg-brand-cyan hover:bg-brand-cyan-light text-slate-950 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.15em] shadow-[0_4px_15px_rgba(0,255,242,0.2)] hover:shadow-[0_8px_25px_rgba(0,255,242,0.4)] active:scale-[0.98] group/btn"
                >
                    <Eye size={16} className="group-hover/btn:scale-125 transition-transform duration-300" /> Visualizar Produto
                </button>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500 font-mono tracking-wider">
                    <div className="flex gap-1.5 items-center">
                        <div className="flex gap-1">
                            {produto.cores?.length ? produto.cores.slice(0, 2).map((c: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800/50">{c}</span>
                            )) : <span className="opacity-30">SC</span>}
                        </div>
                        {produto.cores?.length > 2 && <span className="text-brand-cyan font-black">+</span>}
                    </div>
                    <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/50">CAT: <span className="text-slate-300">{produto.categoria || 'GERAL'}</span></span>
                </div>
            </div>
        </motion.div>
    );
};

const ViewProductModal = ({ produto, isOpen, onToggle }: { produto: any, isOpen: boolean, onToggle: () => void }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imagens = (produto?.imagens && produto.imagens.length > 0) ? produto.imagens : (produto?.imagem ? [produto.imagem] : []);

    if (!isOpen || !produto) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onToggle}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            ></motion.div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
                {/* Image Section */}
                <div className="w-full md:w-1/2 aspect-square relative bg-slate-950 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
                    <AnimatePresence mode="wait">
                        {imagens.length > 0 ? (
                            <motion.img
                                key={currentImageIndex}
                                src={imagens[currentImageIndex]}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <ImageIcon size={64} className="text-slate-800" />
                        )}
                    </AnimatePresence>

                    {imagens.length > 1 && (
                        <>
                            <button onClick={() => setCurrentImageIndex(p => (p - 1 + imagens.length) % imagens.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 text-white rounded-full transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => setCurrentImageIndex(p => (p + 1) % imagens.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 text-white rounded-full transition-all">
                                <ChevronRight size={20} />
                            </button>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                {imagens.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentImageIndex(i)}
                                        className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-brand-cyan w-6' : 'bg-slate-700'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Details Section */}
                <div className="flex-1 p-8 md:p-12 flex flex-col h-full overflow-y-auto">
                    <button onClick={onToggle} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                        <X size={28} />
                    </button>

                    <div className="mb-8">
                        <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-[0.3em] font-black">Detalhes do Produto</span>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mt-2">{produto.referencia}</h2>
                        <h3 className="text-xl text-slate-400 mt-1">{produto.descricao}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Preço Sugerido</p>
                            <p className="text-2xl font-black text-emerald-400">R$ {produto.valor?.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Categoria</p>
                            <p className="text-2xl font-black text-white">{produto.categoria || 'Geral'}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Cores Disponíveis</p>
                            <div className="flex flex-wrap gap-2">
                                {produto.cores?.length ? produto.cores.map((c: any, i: number) => (
                                    <span key={i} className="px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-white font-bold">{c}</span>
                                )) : 'Nenhuma cor cadastrada'}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Tamanhos Disponíveis</p>
                            <div className="flex flex-wrap gap-2">
                                {produto.tamanhos?.length ? produto.tamanhos.map((s: any, i: number) => (
                                    <span key={i} className="px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-bold">{s}</span>
                                )) : 'Nenhum tamanho cadastrado'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-10 flex items-center justify-between border-t border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${produto.ativo ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{produto.ativo ? 'Em Linha / Ativo' : 'Fora de Linha / Inativo'}</span>
                        </div>
                        <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest">Ref ID: {produto.id}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export const CatalogoVesti = () => {
    const { produtos, addProduto, updateProduto, deleteProduto, addToast, confirm } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduto, setEditingProduto] = useState<any>(null);
    const [viewingProduto, setViewingProduto] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // State for the modal form
    const [formData, setFormData] = useState({
        referencia: '',
        descricao: '',
        categoria: '',
        imagem: '',
        imagens: [] as string[],
        valor: 0,
        cores: [] as string[],
        tamanhos: [] as string[],
        ativo: true
    });

    const [newColor, setNewColor] = useState('');
    const [newSize, setNewSize] = useState('');

    const stats = useMemo(() => {
        return {
            total: produtos.length,
            ativos: produtos.filter(p => p.ativo).length,
            inativos: produtos.filter(p => !p.ativo).length,
            valorTotal: produtos.reduce((acc, p) => acc + (p.valor || 0), 0)
        };
    }, [produtos]);

    const filteredProdutos = useMemo(() => {
        return produtos.filter(p => {
            const matchSearch = p.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.descricao.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = filterStatus === 'ALL' ? true :
                filterStatus === 'ACTIVE' ? p.ativo : !p.ativo;
            return matchSearch && matchStatus;
        });
    }, [produtos, searchTerm, filterStatus]);

    const handleOpenModal = (produto?: any) => {
        if (produto) {
            setEditingProduto(produto);
            setFormData({
                referencia: produto.referencia,
                descricao: produto.descricao,
                categoria: produto.categoria || '',
                imagem: produto.imagem || '',
                imagens: produto.imagens || (produto.imagem ? [produto.imagem] : []),
                valor: produto.valor || 0,
                cores: produto.cores || [],
                tamanhos: produto.tamanhos || [],
                ativo: produto.ativo
            });
        } else {
            setEditingProduto(null);
            setFormData({
                referencia: '',
                descricao: '',
                categoria: '',
                imagem: '',
                imagens: [],
                valor: 0,
                cores: [],
                tamanhos: [],
                ativo: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduto) {
                await updateProduto({ ...formData, id: editingProduto.id } as any);
                addToast('success', 'Produto atualizado com sucesso!');
            } else {
                await addProduto(formData as any);
                addToast('success', 'Produto cadastrado com sucesso!');
            }
            setIsModalOpen(false);
        } catch (err: any) {
            console.error("Erro detalhado ao salvar produto:", err);
            const errorMsg = err.message || err.details || (typeof err === 'string' ? err : 'Erro desconhecido');
            addToast('error', `Erro ao salvar produto: ${errorMsg}`);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: 'Excluir Produto',
            message: 'Tem certeza que deseja excluir este produto do catálogo?',
            confirmText: 'Sim, Excluir',
            type: 'danger'
        });

        if (isConfirmed) {
            const success = await deleteProduto(id);
            if (success) {
                addToast('success', 'Produto removido do catálogo.');
            }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({
                        ...prev,
                        imagens: [...prev.imagens, reader.result as string],
                        // Use first image as main 'imagem' for compatibility if empty
                        imagem: prev.imagem || (reader.result as string)
                    }));
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => {
            const newImagens = prev.imagens.filter((_, i) => i !== index);
            return {
                ...prev,
                imagens: newImagens,
                imagem: newImagens[0] || ''
            };
        });
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-cyan/20 flex items-center justify-center border border-brand-cyan/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        <ShoppingBag className="text-brand-cyan" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                            Catálogo Vesti <span className="text-brand-cyan italic">✨</span>
                        </h1>
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">
                            Todas as referências ativas na plataforma Vesti
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
                >
                    <Plus size={18} /> Novo Produto
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total de Produtos', value: stats.total, icon: <Package size={20} />, color: 'emerald' },
                    { label: 'Produtos Ativos', value: stats.ativos, icon: <TrendingUp size={20} />, color: 'brand-cyan' },
                    { label: 'Inativos', value: stats.inativos, icon: <Trash2 size={20} />, color: 'rose' },
                    { label: 'Valor do Catálogo', value: `R$ ${stats.valorTotal.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'amber' },
                ].map((kpi, idx) => (
                    <div key={idx} className="tech-card p-6 flex items-center justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                            <h3 className="text-2xl font-black text-white">{kpi.value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl bg-slate-800 text-${kpi.color} border border-slate-700 group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${kpi.color}/5 rounded-full blur-2xl group-hover:bg-${kpi.color}/10 transition-all`}></div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="BUSCAR POR NOME OU SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-xs font-mono text-white focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/20 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                    {[
                        { id: 'ALL', label: 'Todos' },
                        { id: 'ACTIVE', label: 'Ativos' },
                        { id: 'INACTIVE', label: 'Inativos' }
                    ].map((status) => (
                        <button
                            key={status.id}
                            onClick={() => setFilterStatus(status.id as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterStatus === status.id
                                ? 'bg-brand-cyan text-slate-950 border-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                : 'bg-slate-950/50 text-slate-500 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredProdutos.map((produto) => (
                        <ProductCard
                            key={produto.id}
                            produto={produto}
                            onEdit={handleOpenModal}
                            onDelete={handleDelete}
                            onView={() => {
                                setViewingProduto(produto);
                                setIsViewModalOpen(true);
                            }}
                        />
                    ))}
                </AnimatePresence>

                {filteredProdutos.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                            <Package size={40} />
                        </div>
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm">Nenhum produto encontrado</h3>
                        <p className="text-slate-500 text-xs font-mono mt-2 uppercase tracking-widest">Tente ajustar seus filtros ou busca</p>
                    </div>
                )}
            </div>

            {/* Modal Cadastro/Edição */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        ></motion.div>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-cyan/20 rounded-xl text-brand-cyan">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                                            {editingProduto ? 'Editar Produto' : 'Cadastrar Produto'}
                                        </h2>
                                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
                                            CATALOGO_VESTI_MANAGEMENT_v1.0
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* Main Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Referência / SKU</label>
                                            <input
                                                required
                                                value={formData.referencia}
                                                onChange={e => setFormData({ ...formData, referencia: e.target.value.toUpperCase() })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-cyan outline-none transition-all uppercase"
                                                placeholder="EX: REF77516"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                                            <input
                                                required
                                                value={formData.descricao}
                                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-cyan outline-none transition-all"
                                                placeholder="EX: CALÇA JEANS SLIM"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor de Venda (R$)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.valor}
                                                onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-cyan outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Image Upload Area */}
                                    <div className="flex flex-col gap-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Galeria de Imagens</label>

                                        <div className="grid grid-cols-3 gap-2">
                                            {formData.imagens.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-xl bg-slate-950 border border-slate-800 overflow-hidden group">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="absolute top-1 right-1 p-1 bg-rose-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}

                                            {formData.imagens.length < 6 && (
                                                <div className="relative aspect-square rounded-xl bg-slate-950 border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden hover:border-brand-cyan transition-colors group cursor-pointer">
                                                    <div className="flex flex-col items-center gap-1 text-slate-700 group-hover:text-brand-cyan transition-colors">
                                                        <Plus size={20} />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">ADD</span>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleImageUpload}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {formData.imagens.length === 0 && (
                                            <p className="text-[8px] text-slate-600 font-mono uppercase tracking-[0.2em] text-center italic">
                                                Nenhuma imagem adicionada. (Mínimo 1 recomendada)
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Variations */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 inline-flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></div> Cores
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newColor}
                                                onChange={e => setNewColor(e.target.value.toUpperCase())}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), newColor && !formData.cores.includes(newColor) && (setFormData({ ...formData, cores: [...formData.cores, newColor] }), setNewColor('')))}
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                                                placeholder="ADD COR..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => newColor && !formData.cores.includes(newColor) && (setFormData({ ...formData, cores: [...formData.cores, newColor] }), setNewColor(''))}
                                                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.cores.map((c, i) => (
                                                <span key={i} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] text-slate-300 font-bold flex items-center gap-2 group">
                                                    {c}
                                                    <button type="button" onClick={() => setFormData({ ...formData, cores: formData.cores.filter(x => x !== c) })} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <XCircle size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 inline-flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Tamanhos
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newSize}
                                                onChange={e => setNewSize(e.target.value.toUpperCase())}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), newSize && !formData.tamanhos.includes(newSize) && (setFormData({ ...formData, tamanhos: [...formData.tamanhos, newSize] }), setNewSize('')))}
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                                                placeholder="ADD TAMANHO (P, M, G...)"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => newSize && !formData.tamanhos.includes(newSize) && (setFormData({ ...formData, tamanhos: [...formData.tamanhos, newSize] }), setNewSize(''))}
                                                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.tamanhos.map((s, i) => (
                                                <span key={i} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] text-slate-300 font-bold flex items-center gap-2 group">
                                                    {s}
                                                    <button type="button" onClick={() => setFormData({ ...formData, tamanhos: formData.tamanhos.filter(x => x !== s) })} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <XCircle size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${formData.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            }`}
                                    >
                                        {formData.ativo ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                        Status: {formData.ativo ? 'Ativo' : 'Inativo'}
                                    </button>
                                </div>
                            </form>

                            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-800 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-8 py-3 rounded-xl bg-brand-cyan text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_4px_15px_rgba(34,211,238,0.3)]"
                                >
                                    Salvar Produto
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Visualização */}
            <AnimatePresence>
                {isViewModalOpen && (
                    <ViewProductModal
                        produto={viewingProduto}
                        isOpen={isViewModalOpen}
                        onToggle={() => setIsViewModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
