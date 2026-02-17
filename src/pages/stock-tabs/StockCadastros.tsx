import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { User, Package, Palette, Ruler, Plus, Trash2, Save, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StockCadastros = () => {
    const {
        produtos, cores, tamanhos,
        addProduto, updateProduto,
        addCor, updateCor, deleteCor,
        addTamanho, updateTamanho,
        addToast
    } = useApp();

    const [activeSection, setActiveSection] = useState<'produtos' | 'cores' | 'tamanhos'>('produtos');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form States
    const [formData, setFormData] = useState<any>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

    const handleOpenModal = (item?: any) => {
        if (item) {
            setFormData({ ...item });
            setEditingId(item.id);
        } else {
            setFormData({});
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (activeSection === 'produtos') {
                if (editingId) {
                    await updateProduto({ ...formData, id: editingId });
                } else {
                    await addProduto({
                        referencia: formData.referencia,
                        descricao: formData.descricao,
                        ativo: true
                    });
                }
            } else if (activeSection === 'cores') {
                if (editingId) {
                    await updateCor({ ...formData, id: editingId });
                } else {
                    await addCor(formData.nome, formData.hex);
                }
            } else if (activeSection === 'tamanhos') {
                if (editingId) {
                    await updateTamanho({ ...formData, id: editingId });
                } else {
                    await addTamanho(formData.nome, Number(formData.ordem));
                }
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Error saving:", error);
            addToast('error', `Erro ao salvar: ${error.message || "Verifique os dados e tente novamente."}`);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
                <SectionButton
                    active={activeSection === 'produtos'}
                    onClick={() => setActiveSection('produtos')}
                    icon={<Package size={16} />}
                    label="Produtos"
                />
                <SectionButton
                    active={activeSection === 'cores'}
                    onClick={() => setActiveSection('cores')}
                    icon={<Palette size={16} />}
                    label="Cores"
                />
                <SectionButton
                    active={activeSection === 'tamanhos'}
                    onClick={() => setActiveSection('tamanhos')}
                    icon={<Ruler size={16} />}
                    label="Tamanhos"
                />
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                    {activeSection === 'produtos' && 'Gestão de Referências'}
                    {activeSection === 'cores' && 'Catálogo de Cores'}
                    {activeSection === 'tamanhos' && 'Grade de Tamanhos'}
                </h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-brand-cyan text-slate-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                >
                    <Plus size={16} /> Novo {{
                        produtos: 'Produto',
                        cores: 'Cor',
                        tamanhos: 'Tamanho'
                    }[activeSection]}
                </button>
            </div>

            {/* List Content */}
            <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden flex-1 overflow-y-auto">
                {activeSection === 'produtos' && (
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-300 sticky top-0 z-10 shadow-sm shadow-black/50">
                            <tr>
                                <th className="p-4">Referência</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4 text-center">Ativo</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {produtos.map(p => (
                                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4 font-bold text-white font-mono">{p.referencia}</td>
                                    <td className="p-4">{p.descricao || '-'}</td>
                                    <td className="p-4 text-center">
                                        {p.ativo ? <span className="text-green-500 text-xs">Sim</span> : <span className="text-red-500 text-xs">Não</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleOpenModal(p)} className="text-slate-600 hover:text-brand-cyan transition-colors p-2 hover:bg-slate-800 rounded-lg">
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {produtos.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-600">Nenhum produto cadastrado.</td></tr>}
                        </tbody>
                    </table>
                )}

                {activeSection === 'cores' && (
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {cores.map(c => (
                            <div
                                key={c.id}
                                className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center relative group hover:border-brand-cyan/50 hover:bg-slate-800/80 transition-all"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmModal({
                                            isOpen: true,
                                            title: 'Excluir Cor',
                                            message: `Tem certeza que deseja excluir a cor "${c.nome}"? Esta ação não pode ser desfeita.`,
                                            onConfirm: () => {
                                                deleteCor(c.id);
                                                setConfirmModal(null);
                                            }
                                        });
                                    }}
                                    className="absolute top-1 right-1 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div
                                    onClick={() => handleOpenModal(c)}
                                    className="cursor-pointer"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full bg-slate-700 mx-auto mb-2 border border-slate-600 group-hover:scale-110 transition-transform shadow-lg"
                                        style={{ backgroundColor: c.hex || (c.nome.toLowerCase() === 'preto' ? '#000' : c.nome.toLowerCase() === 'branco' ? '#fff' : '') }}
                                    ></div>
                                    <span className="text-xs font-bold text-white uppercase">{c.nome}</span>
                                </div>
                            </div>
                        ))}
                        {cores.length === 0 && <div className="text-slate-600 col-span-full text-center py-8">Nenhuma cor cadastrada.</div>}
                    </div>
                )}

                {activeSection === 'tamanhos' && (
                    <div className="p-4 grid grid-cols-4 md:grid-cols-8 gap-4">
                        {tamanhos.map(t => (
                            <div
                                key={t.id}
                                onClick={() => handleOpenModal(t)}
                                className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center flex flex-col items-center justify-center h-20 hover:border-brand-cyan/50 hover:bg-slate-800/80 cursor-pointer transition-all group"
                            >
                                <span className="text-xl font-bold text-white font-display group-hover:scale-110 transition-transform">{t.nome}</span>
                                <span className="text-[10px] text-slate-600 mt-1">Ordem: {t.ordem}</span>
                            </div>
                        ))}
                        {tamanhos.length === 0 && <div className="text-slate-600 col-span-full text-center py-8">Nenhum tamanho cadastrado.</div>}
                    </div>
                )}
            </div>

            {/* Modal - Expanded & Grid Layout via Portal */}
            {isModalOpen && createPortal(
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-950 border border-slate-700 w-full max-w-4xl rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    {activeSection === 'produtos' && <Package className="text-brand-cyan" size={24} />}
                                    {activeSection === 'cores' && <Palette className="text-brand-cyan" size={24} />}
                                    {activeSection === 'tamanhos' && <Ruler className="text-brand-cyan" size={24} />}
                                    {editingId ? 'Editar' : 'Novo'} {{
                                        produtos: 'Produto',
                                        cores: 'Cor',
                                        tamanhos: 'Tamanho'
                                    }[activeSection]}
                                </h3>
                                <p className="text-slate-500 text-xs mt-1">Prencha os dados abaixo para {editingId ? 'atualizar' : 'cadastrar'} o registro.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {activeSection === 'produtos' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Input label="Referência" value={formData.referencia || ''} onChange={(e: any) => setFormData({ ...formData, referencia: e.target.value })} required placeholder="Ex: REF-001" autoFocus />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Input label="Descrição do Produto" value={formData.descricao || ''} onChange={(e: any) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Ex: CAMISETA BASIC COTTON" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Categoria / Linha"
                                            value={formData.categoria || ''}
                                            onChange={(e: any) => setFormData({ ...formData, categoria: e.target.value.toUpperCase() })}
                                            placeholder="Ex: MASCULINO, FEMININO, ACESSÓRIOS"
                                        />
                                    </div>
                                    <div className="md:col-span-2 mt-2">
                                        <label className="flex items-center gap-3 cursor-pointer bg-slate-900 border border-slate-800 p-4 rounded-lg hover:border-brand-cyan/30 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.ativo ?? true}
                                                onChange={(e: any) => setFormData({ ...formData, ativo: e.target.checked })}
                                                className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-brand-cyan focus:ring-brand-cyan/20"
                                            />
                                            <div>
                                                <span className="text-sm font-bold text-white block">Produto Ativo</span>
                                                <span className="text-xs text-slate-500 block">Produtos inativos não aparecerão para novas entradas ou pedidos.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'cores' && (
                                <div className="grid grid-cols-1 gap-4">
                                    <Input label="Nome da Cor" value={formData.nome || ''} onChange={(e: any) => setFormData({ ...formData, nome: e.target.value })} required placeholder="Ex: AZUL MARINHO" autoFocus />
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Cor Visual (Hex)</label>
                                        <div className="flex gap-2">
                                            <div className="w-10 h-10 rounded border border-slate-700 overflow-hidden">
                                                <input
                                                    type="color"
                                                    className="w-full h-full p-0 border-0 cursor-pointer"
                                                    value={formData.hex || '#000000'}
                                                    onChange={(e) => setFormData({ ...formData, hex: e.target.value })}
                                                />
                                            </div>
                                            <input
                                                className="flex-1 bg-slate-950/50 border border-slate-800 rounded-lg px-3 text-sm text-white font-mono uppercase"
                                                value={formData.hex || ''}
                                                onChange={(e) => setFormData({ ...formData, hex: e.target.value })}
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'tamanhos' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Sigla do Tamanho" value={formData.nome || ''} onChange={(e: any) => setFormData({ ...formData, nome: e.target.value })} required placeholder="Ex: P" autoFocus />
                                    <Input label="Ordem de Exibição" type="number" value={formData.ordem || ''} onChange={(e: any) => setFormData({ ...formData, ordem: e.target.value })} required placeholder="Ex: 10" />
                                    <p className="text-xs text-slate-500 col-span-2">A ordem define como os tamanhos são ordenados nas grades (menor para maior).</p>
                                </div>
                            )}

                            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-800 sticky bottom-0 bg-slate-950 pb-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-brand-cyan text-slate-950 rounded-lg text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                                    <Save size={18} /> {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>,
                document.body
            )}

            {/* Confirm Modal */}
            {confirmModal && confirmModal.isOpen && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl text-center"
                    >
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">{confirmModal.title}</h3>
                        <p className="text-slate-400 text-sm mb-8">{confirmModal.message}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 py-3 text-xs font-bold uppercase text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className="flex-1 py-3 bg-red-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                            >
                                Confirmar Exclusão
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};

const SectionButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${active
            ? 'bg-slate-800 text-white border border-slate-700 shadow-lg'
            : 'text-slate-500 hover:text-slate-300'
            }`}
    >
        {icon} {label}
    </button>
);

const Input = ({ label, ...props }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
        <input
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/20 transition-all font-mono placeholder:text-slate-700"
            {...props}
        />
    </div>
);
