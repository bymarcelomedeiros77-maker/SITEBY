import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, TrendingUp, TrendingDown, Plus, X, ArrowUp, ArrowDown,
    Calendar, Trash2, CheckCircle, AlertTriangle, Activity, Filter, Download
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';

type TipoLancamento = 'ENTRADA' | 'SAIDA';
type Categoria = 'VENDA' | 'FACCAO' | 'INSUMO' | 'DESPESA' | 'OUTRO';

interface Lancamento {
    id: string;
    tipo: TipoLancamento;
    descricao: string;
    valor: number;
    categoria: Categoria;
    data: string;
    observacao?: string;
    created_at: string;
}

const CATEGORIAS: { value: Categoria; label: string; color: string }[] = [
    { value: 'VENDA', label: 'Venda', color: 'text-emerald-400' },
    { value: 'FACCAO', label: 'Pagamento de Facção', color: 'text-cyan-400' },
    { value: 'INSUMO', label: 'Insumos/Tecidos', color: 'text-amber-400' },
    { value: 'DESPESA', label: 'Despesa Geral', color: 'text-red-400' },
    { value: 'OUTRO', label: 'Outro', color: 'text-slate-400' },
];

const fmtMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (d: string) => {
    if (!d) return '-';
    const [y, m, day] = d.split('T')[0].split('-');
    return `${day}/${m}/${y}`;
};

export const Financeiro = () => {
    const { addToast } = useApp();
    const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoLancamento>('TODOS');
    const [filtroPeriodo, setFiltroPeriodo] = useState('30d');
    const [form, setForm] = useState({
        tipo: 'ENTRADA' as TipoLancamento,
        descricao: '',
        valor: '',
        categoria: 'VENDA' as Categoria,
        data: new Date().toISOString().split('T')[0],
        observacao: ''
    });

    useEffect(() => {
        fetchLancamentos();
    }, []);

    const fetchLancamentos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('financial_entries')
                .select('*')
                .order('data', { ascending: false });
            if (error) throw error;
            setLancamentos(data || []);
        } catch (err) {
            console.error('Erro ao buscar lançamentos:', err);
            addToast('error' as any, 'Erro ao carregar dados financeiros.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.descricao || !form.valor || !form.data) {
            addToast('error' as any, 'Preencha todos os campos obrigatórios.');
            return;
        }
        const valor = parseFloat(form.valor.replace(',', '.'));
        if (isNaN(valor) || valor <= 0) {
            addToast('error' as any, 'Valor inválido.');
            return;
        }

        try {
            const { error } = await supabase.from('financial_entries').insert([{
                tipo: form.tipo,
                descricao: form.descricao.trim(),
                valor,
                categoria: form.categoria,
                data: form.data,
                observacao: form.observacao.trim() || null
            }]);
            if (error) throw error;
            addToast('success' as any, 'Lançamento registrado com sucesso!');
            setShowModal(false);
            setForm({ tipo: 'ENTRADA', descricao: '', valor: '', categoria: 'VENDA', data: new Date().toISOString().split('T')[0], observacao: '' });
            fetchLancamentos();
        } catch (err: any) {
            addToast('error' as any, 'Erro ao salvar: ' + (err?.message || 'Tente novamente.'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Confirmar exclusão deste lançamento?')) return;
        try {
            const { error } = await supabase.from('financial_entries').delete().eq('id', id);
            if (error) throw error;
            addToast('success' as any, 'Lançamento removido.');
            setLancamentos(prev => prev.filter(l => l.id !== id));
        } catch {
            addToast('error' as any, 'Erro ao remover lançamento.');
        }
    };

    const periodoStart = useMemo(() => {
        const now = new Date();
        if (filtroPeriodo === '7d') return new Date(now.getTime() - 7 * 86400000);
        if (filtroPeriodo === '30d') return new Date(now.getTime() - 30 * 86400000);
        if (filtroPeriodo === '3m') return new Date(now.getTime() - 90 * 86400000);
        if (filtroPeriodo === 'year') return new Date(now.getFullYear(), 0, 1);
        return null;
    }, [filtroPeriodo]);

    const filtrados = useMemo(() => {
        return lancamentos.filter(l => {
            if (filtroTipo !== 'TODOS' && l.tipo !== filtroTipo) return false;
            if (periodoStart && new Date(l.data) < periodoStart) return false;
            return true;
        });
    }, [lancamentos, filtroTipo, periodoStart]);

    const summary = useMemo(() => {
        const entradas = filtrados.filter(l => l.tipo === 'ENTRADA').reduce((s, l) => s + l.valor, 0);
        const saidas = filtrados.filter(l => l.tipo === 'SAIDA').reduce((s, l) => s + l.valor, 0);
        const saldo = entradas - saidas;
        return { entradas, saidas, saldo };
    }, [filtrados]);

    // Dados para o gráfico de evolução do saldo
    const chartData = useMemo(() => {
        const sorted = [...filtrados].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        let saldo = 0;
        const byDay: Record<string, number> = {};
        sorted.forEach(l => {
            const day = l.data.split('T')[0];
            if (!byDay[day]) byDay[day] = 0;
            byDay[day] += l.tipo === 'ENTRADA' ? l.valor : -l.valor;
        });
        return Object.entries(byDay).map(([data, delta]) => {
            saldo += delta;
            return { data: fmtData(data), saldo };
        });
    }, [filtrados]);

    const catLabel = (cat: Categoria) => CATEGORIAS.find(c => c.value === cat)?.label || cat;
    const catColor = (cat: Categoria) => CATEGORIAS.find(c => c.value === cat)?.color || 'text-slate-400';

    return (
        <div className="space-y-8 pb-10">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Financeiro</h2>
                    <p className="text-green-400 font-mono text-xs mt-1 tracking-widest flex items-center gap-2">
                        <Activity size={12} className="animate-pulse" /> FLUXO DE CAIXA
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Período */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1">
                        {[{ v: '7d', l: '7d' }, { v: '30d', l: '30d' }, { v: '3m', l: '3m' }, { v: 'year', l: 'Ano' }, { v: 'all', l: 'Tudo' }].map(o => (
                            <button key={o.v} onClick={() => setFiltroPeriodo(o.v)}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${filtroPeriodo === o.v ? 'bg-green-500 text-slate-950' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
                                {o.l}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-green-400 transition-colors uppercase tracking-wider">
                        <Plus size={15} /> Novo Lançamento
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Entradas', value: summary.entradas, icon: <TrendingUp size={22} />, color: 'text-emerald-400', border: 'from-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                    { label: 'Total Saídas', value: summary.saidas, icon: <TrendingDown size={22} />, color: 'text-red-400', border: 'from-red-500', bg: 'bg-red-500/10 border-red-500/30' },
                    { label: 'Saldo do Período', value: summary.saldo, icon: summary.saldo >= 0 ? <ArrowUp size={22} /> : <ArrowDown size={22} />, color: summary.saldo >= 0 ? 'text-emerald-400' : 'text-red-400', border: summary.saldo >= 0 ? 'from-emerald-500' : 'from-red-500', bg: summary.saldo >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30' }
                ].map((kpi, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02, y: -3 }} className={`tech-card p-6 relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${kpi.border} to-transparent`} />
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-mono uppercase text-slate-400 tracking-widest mb-2">{kpi.label}</p>
                                <p className={`text-3xl font-bold ${kpi.color}`}>{fmtMoeda(kpi.value)}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${kpi.bg} border ${kpi.color}`}>{kpi.icon}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Gráfico de Saldo */}
            {chartData.length > 1 && (
                <div className="tech-card p-6 h-64">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-green-400" /> Evolução do Saldo
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="data" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                    formatter={(v: any) => [fmtMoeda(v), 'Saldo']}
                                />
                                <Area type="monotone" dataKey="saldo" stroke="#22c55e" strokeWidth={2} fill="url(#saldoGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Filtro e Lista */}
            <div className="tech-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <DollarSign size={16} className="text-green-400" /> Lançamentos
                        <span className="text-[10px] font-mono text-slate-500 ml-2">({filtrados.length})</span>
                    </h3>
                    {/* Filtro de tipo */}
                    <div className="flex gap-2">
                        {(['TODOS', 'ENTRADA', 'SAIDA'] as const).map(t => (
                            <button key={t} onClick={() => setFiltroTipo(t)}
                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg border transition-all ${filtroTipo === t
                                    ? t === 'ENTRADA' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                        : t === 'SAIDA' ? 'bg-red-500/20 border-red-500 text-red-400'
                                            : 'bg-slate-700 border-slate-600 text-white'
                                    : 'border-slate-700 text-slate-500 hover:text-white'}`}>
                                {t === 'TODOS' ? 'Todos' : t === 'ENTRADA' ? '↑ Entradas' : '↓ Saídas'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse" />)}
                    </div>
                ) : filtrados.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
                        <DollarSign size={40} className="opacity-30" />
                        <p className="text-sm font-bold uppercase tracking-wider">Nenhum lançamento encontrado</p>
                        <button onClick={() => setShowModal(true)} className="text-green-400 text-xs hover:underline">+ Adicionar primeiro lançamento</button>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                        {filtrados.map(l => (
                            <motion.div key={l.id} layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${l.tipo === 'ENTRADA' ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-red-950/20 border-red-500/20 hover:border-red-500/40'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${l.tipo === 'ENTRADA' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                        {l.tipo === 'ENTRADA' ? <ArrowUp size={16} className="text-emerald-400" /> : <ArrowDown size={16} className="text-red-400" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{l.descricao}</p>
                                        <p className={`text-[10px] font-mono ${catColor(l.categoria)}`}>{catLabel(l.categoria)} · {fmtData(l.data)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-bold text-base ${l.tipo === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {l.tipo === 'ENTRADA' ? '+' : '-'}{fmtMoeda(l.valor)}
                                    </span>
                                    <button onClick={() => handleDelete(l.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Novo Lançamento */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Novo Lançamento</h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-lg"><X size={18} /></button>
                            </div>

                            {/* Tipo */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                {(['ENTRADA', 'SAIDA'] as TipoLancamento[]).map(t => (
                                    <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
                                        className={`py-3 rounded-xl font-bold text-sm uppercase border transition-all ${form.tipo === t
                                            ? t === 'ENTRADA' ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-red-500 text-white border-red-500'
                                            : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                                        {t === 'ENTRADA' ? '↑ Entrada' : '↓ Saída'}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Descrição *</label>
                                    <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                                        placeholder="Ex: Pagamento Facção Silva, Venda cliente..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none placeholder-slate-600" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Valor (R$) *</label>
                                        <input value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                                            placeholder="0,00" type="text"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none placeholder-slate-600" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Data *</label>
                                        <input value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                                            type="date"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Categoria</label>
                                    <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Categoria }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none">
                                        {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Observação</label>
                                    <textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                                        placeholder="Observações opcionais..." rows={2}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none placeholder-slate-600 resize-none" />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-slate-700 text-slate-400 rounded-xl font-bold uppercase text-sm hover:bg-slate-800 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleSave}
                                    className="flex-1 py-3 bg-green-500 text-slate-950 rounded-xl font-bold uppercase text-sm hover:bg-green-400 transition-colors">
                                    Salvar Lançamento
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
