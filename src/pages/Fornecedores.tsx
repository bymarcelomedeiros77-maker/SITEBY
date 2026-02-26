import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck, Plus, X, Trash2, Edit2, Phone, Mail, MapPin,
    Package, Star, Activity, Search, CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';

interface Fornecedor {
    id: string;
    nome: string;
    cnpj_cpf: string;
    contato: string;
    email: string;
    cidade: string;
    estado: string;
    produto: string;
    observacao: string;
    avaliacao: number;
    ativo: boolean;
    created_at: string;
}

const ESTADOS_BR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const Fornecedores = () => {
    const { addToast } = useApp();
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState<Fornecedor | null>(null);
    const [form, setForm] = useState({
        nome: '', cnpj_cpf: '', contato: '', email: '',
        cidade: '', estado: '', produto: '', observacao: '', avaliacao: 5
    });

    useEffect(() => {
        fetchFornecedores();
    }, []);

    const fetchFornecedores = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('nome', { ascending: true });
            if (error) throw error;
            setFornecedores(data || []);
        } catch (err) {
            console.error('Erro ao buscar fornecedores:', err);
            addToast('error' as any, 'Erro ao carregar fornecedores.');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (f?: Fornecedor) => {
        if (f) {
            setEditando(f);
            setForm({ nome: f.nome, cnpj_cpf: f.cnpj_cpf || '', contato: f.contato || '', email: f.email || '', cidade: f.cidade || '', estado: f.estado || '', produto: f.produto || '', observacao: f.observacao || '', avaliacao: f.avaliacao || 5 });
        } else {
            setEditando(null);
            setForm({ nome: '', cnpj_cpf: '', contato: '', email: '', cidade: '', estado: '', produto: '', observacao: '', avaliacao: 5 });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.nome.trim()) {
            addToast('error' as any, 'Nome do fornecedor é obrigatório.');
            return;
        }
        try {
            if (editando) {
                const { error } = await supabase.from('suppliers').update({ ...form, ativo: true }).eq('id', editando.id);
                if (error) throw error;
                addToast('success' as any, 'Fornecedor atualizado!');
            } else {
                const { error } = await supabase.from('suppliers').insert([{ ...form, ativo: true }]);
                if (error) throw error;
                addToast('success' as any, 'Fornecedor cadastrado!');
            }
            setShowModal(false);
            fetchFornecedores();
        } catch (err: any) {
            addToast('error' as any, 'Erro ao salvar: ' + (err?.message || 'Tente novamente.'));
        }
    };

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Excluir fornecedor "${nome}"?`)) return;
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) throw error;
            addToast('success' as any, 'Fornecedor removido.');
            setFornecedores(prev => prev.filter(f => f.id !== id));
        } catch {
            addToast('error' as any, 'Erro ao remover fornecedor.');
        }
    };

    const filtrados = fornecedores.filter(f =>
        f.nome.toLowerCase().includes(search.toLowerCase()) ||
        (f.produto || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.cidade || '').toLowerCase().includes(search.toLowerCase())
    );

    const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => onChange?.(s)}
                    className={`text-lg ${s <= value ? 'text-yellow-400' : 'text-slate-600'} ${onChange ? 'cursor-pointer hover:scale-125 transition-transform' : 'cursor-default'}`}>
                    ★
                </button>
            ))}
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Fornecedores</h2>
                    <p className="text-orange-400 font-mono text-xs mt-1 tracking-widest flex items-center gap-2">
                        <Activity size={12} className="animate-pulse" /> GESTÃO DE INSUMOS
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Busca */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nome, produto, cidade..."
                            className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white w-64 focus:border-orange-500 focus:outline-none placeholder-slate-600"
                        />
                    </div>
                    <button onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-400 transition-colors uppercase tracking-wider">
                        <Plus size={15} /> Novo Fornecedor
                    </button>
                </div>
            </div>

            {/* Stats rápido */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total', value: fornecedores.length, color: 'text-orange-400', border: 'from-orange-500' },
                    { label: 'Ativos', value: fornecedores.filter(f => f.ativo).length, color: 'text-emerald-400', border: 'from-emerald-500' },
                    { label: 'Avaliação Média', value: fornecedores.length > 0 ? (fornecedores.reduce((s, f) => s + (f.avaliacao || 3), 0) / fornecedores.length).toFixed(1) : '—', color: 'text-yellow-400', border: 'from-yellow-500' },
                ].map((kpi, i) => (
                    <div key={i} className="tech-card p-5 relative">
                        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${kpi.border} to-transparent`} />
                        <p className="text-xs font-mono uppercase text-slate-400 tracking-widest mb-1">{kpi.label}</p>
                        <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Grid de Fornecedores */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-slate-800/50 rounded-2xl animate-pulse" />)}
                </div>
            ) : filtrados.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-4 text-slate-500">
                    <Truck size={48} className="opacity-30" />
                    <p className="text-sm font-bold uppercase tracking-wider">{search ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}</p>
                    {!search && (
                        <button onClick={() => openModal()} className="text-orange-400 text-xs hover:underline">+ Cadastrar primeiro fornecedor</button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filtrados.map(f => (
                            <motion.div key={f.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="tech-card p-5 group hover:border-orange-500/30 transition-colors relative">
                                {/* Ativo badge */}
                                <div className="absolute top-3 right-3 flex items-center gap-1">
                                    <CheckCircle size={12} className={f.ativo ? 'text-emerald-400' : 'text-slate-600'} />
                                </div>

                                <div className="mb-3">
                                    <h3 className="text-base font-bold text-white uppercase leading-tight pr-6">{f.nome}</h3>
                                    {f.produto && (
                                        <span className="inline-block mt-1 text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded uppercase">
                                            {f.produto}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1.5 mb-4">
                                    {f.contato && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Phone size={11} className="text-slate-600 flex-shrink-0" /> {f.contato}
                                        </div>
                                    )}
                                    {f.email && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Mail size={11} className="text-slate-600 flex-shrink-0" /> {f.email}
                                        </div>
                                    )}
                                    {(f.cidade || f.estado) && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <MapPin size={11} className="text-slate-600 flex-shrink-0" /> {[f.cidade, f.estado].filter(Boolean).join(' — ')}
                                        </div>
                                    )}
                                    {f.cnpj_cpf && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                            <Package size={11} className="text-slate-600 flex-shrink-0" /> {f.cnpj_cpf}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                                    <StarRating value={f.avaliacao || 3} />
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(f)} className="text-slate-500 hover:text-orange-400 transition-colors p-1">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(f.id, f.nome)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {f.observacao && (
                                    <p className="mt-2 text-[10px] text-slate-500 italic border-t border-slate-800/50 pt-2">{f.observacao}</p>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl my-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                                    {editando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-lg"><X size={18} /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Nome / Razão Social *</label>
                                    <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                                        placeholder="Nome do fornecedor"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Produto Principal</label>
                                    <input value={form.produto} onChange={e => setForm(f => ({ ...f, produto: e.target.value }))}
                                        placeholder="Ex: Tecido, Aviamento, Etiqueta, Embalagem..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">CNPJ / CPF</label>
                                        <input value={form.cnpj_cpf} onChange={e => setForm(f => ({ ...f, cnpj_cpf: e.target.value }))}
                                            placeholder="00.000.000/0000-00"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Telefone</label>
                                        <input value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
                                            placeholder="(00) 00000-0000"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Email</label>
                                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="email@fornecedor.com"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Cidade</label>
                                        <input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                                            placeholder="Cidade"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Estado</label>
                                        <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none">
                                            <option value="">Selecione</option>
                                            {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Avaliação</label>
                                    <div className="flex gap-2 items-center">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button key={s} type="button" onClick={() => setForm(f => ({ ...f, avaliacao: s }))}
                                                className={`text-2xl transition-transform hover:scale-125 ${s <= form.avaliacao ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
                                        ))}
                                        <span className="text-slate-500 text-xs ml-1">{form.avaliacao}/5</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Observações</label>
                                    <textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                                        placeholder="Prazo de entrega, condições de pagamento..." rows={2}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600 resize-none" />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-slate-700 text-slate-400 rounded-xl font-bold uppercase text-sm hover:bg-slate-800 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleSave}
                                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold uppercase text-sm hover:bg-orange-400 transition-colors">
                                    {editando ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
