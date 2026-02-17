import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FichaTecnica, FichaTipo } from '../types';
import {
    FileText, Link as LinkIcon, ExternalLink, Trash2, Plus,
    Search, ChevronRight, Share2, CornerUpRight, Scissors, ClipboardList, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TechPacks = () => {
    const { fichas, addFicha, deleteFicha, addToast, confirm } = useApp();
    const [selectedFicha, setSelectedFicha] = useState<FichaTecnica | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFichaTitle, setNewFichaTitle] = useState('');
    const [newFichaType, setNewFichaType] = useState<FichaTipo>('FICHA_CORTE');
    const [newFichaLink, setNewFichaLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const filteredFichas = fichas.filter(f =>
        f.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddFicha = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFichaTitle || !newFichaLink) {
            addToast('error', "Preencha o título e o link.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await addFicha({
                titulo: newFichaTitle,
                tipo: newFichaType,
                conteudo: [], // Legacy compat
                link: newFichaLink
            });

            if (result) {
                setIsModalOpen(false);
                setNewFichaTitle('');
                setNewFichaLink('');
                addToast('success', "Ficha cadastrada!");
            } else {
                addToast('error', "Erro ao cadastrar ficha.");
            }
        } catch (error) {
            console.error(error);
            addToast('error', "Erro ao cadastrar.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: 'Excluir Ficha',
            message: 'Tem certeza que deseja excluir esta ficha técnica?',
            confirmText: 'Sim, Excluir',
            type: 'danger'
        });

        if (confirmed) {
            const success = await deleteFicha(id);
            if (success) {
                if (selectedFicha?.id === id) setSelectedFicha(null);
                addToast('success', 'Ficha técnica excluída com sucesso.')
            } else {
                addToast('error', 'Erro ao excluir ficha técnica.')
            }
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Fichas Técnicas & Links</h1>
                    <p className="text-slate-500 text-sm">Centralize os links do Google Drive para acesso rápido.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-slate-950 rounded-lg font-bold uppercase hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                >
                    <Plus size={18} /> Novo Link
                </button>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar List */}
                <div className="w-1/3 min-w-[300px] flex flex-col gap-4 bg-slate-900/30 border border-slate-800 rounded-2xl p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar fichas..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-brand-cyan/50 outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {filteredFichas.map(ficha => (
                            <div
                                key={ficha.id}
                                onClick={() => setSelectedFicha(ficha)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all group relative ${selectedFicha?.id === ficha.id
                                    ? 'bg-brand-cyan/10 border-brand-cyan/50'
                                    : 'bg-slate-950/50 border-slate-800 hover:border-brand-cyan/30'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${ficha.tipo === 'FICHA_CORTE' ? 'bg-purple-500/20 text-purple-400' :
                                            ficha.tipo === 'FICHA_TECNICA' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {ficha.tipo === 'FICHA_CORTE' && <Scissors size={18} />}
                                            {ficha.tipo === 'FICHA_TECNICA' && <FileText size={18} />}
                                            {ficha.tipo === 'APONTAMENTO' && <ClipboardList size={18} />}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm ${selectedFicha?.id === ficha.id ? 'text-brand-cyan' : 'text-slate-200'}`}>
                                                {ficha.titulo}
                                            </h3>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                {ficha.tipo.replace('FICHA_', '')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(ficha.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Preview Area */}
                <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-slate-950 to-slate-950 pointer-events-none"></div>

                    {selectedFicha ? (
                        <div className="text-center space-y-8 z-10 max-w-lg w-full">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="space-y-4"
                            >
                                <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center ${selectedFicha.tipo === 'FICHA_CORTE' ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]' :
                                    selectedFicha.tipo === 'FICHA_TECNICA' ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]' :
                                        'bg-amber-500/20 text-amber-400 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]'
                                    }`}>
                                    {selectedFicha.tipo === 'FICHA_CORTE' && <Scissors size={48} />}
                                    {selectedFicha.tipo === 'FICHA_TECNICA' && <FileText size={48} />}
                                    {selectedFicha.tipo === 'APONTAMENTO' && <ClipboardList size={48} />}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedFicha.titulo}</h2>
                                    <span className="px-3 py-1 bg-slate-900 rounded-full text-xs font-mono text-slate-400 border border-slate-800 uppercase">
                                        {selectedFicha.tipo}
                                    </span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {selectedFicha.link ? (
                                    <a
                                        href={selectedFicha.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative flex items-center justify-center gap-3 w-full py-4 bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold text-lg uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-1"
                                    >
                                        <span>Acessar no Google Drive</span>
                                        <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </a>
                                ) : (
                                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                        Link não cadastrado para esta ficha.
                                    </div>
                                )}
                                <p className="mt-4 text-xs text-slate-600">
                                    O link será aberto em uma nova aba do navegador.
                                </p>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-600 space-y-4">
                            <Share2 size={64} className="mx-auto opacity-20" />
                            <p className="text-lg uppercase tracking-widest font-bold opacity-50">Selecione um item para acessar</p>
                            <p className="text-sm">Ou cadastre um novo link no botão acima</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Cadastro */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-slate-950 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-slate-900 rounded-full text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <LinkIcon size={24} className="text-brand-cyan" />
                                Novo Link
                            </h2>

                            <form onSubmit={handleAddFicha} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título / Referência</label>
                                    <input
                                        type="text"
                                        value={newFichaTitle}
                                        onChange={e => setNewFichaTitle(e.target.value)}
                                        placeholder="Ex: Camisa Social Slim"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-cyan/50 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo</label>
                                    <select
                                        value={newFichaType}
                                        onChange={e => setNewFichaType(e.target.value as FichaTipo)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-cyan/50 outline-none appearance-none"
                                    >
                                        <option value="FICHA_CORTE">Ficha de Corte</option>
                                        <option value="FICHA_TECNICA">Ficha Técnica</option>
                                        <option value="APONTAMENTO">Apontamento</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Link do Drive</label>
                                    <input
                                        type="url"
                                        value={newFichaLink}
                                        onChange={e => setNewFichaLink(e.target.value)}
                                        placeholder="https://drive.google.com/..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-cyan/50 outline-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full mt-6 py-3 bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold uppercase rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Salvando...' : 'Salvar Link'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
