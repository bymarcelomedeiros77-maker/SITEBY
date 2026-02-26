import React, { useMemo, useEffect, useState } from 'react';
import { Cliente, ClienteCategoria } from '../types';
import { CATEGORIA_CORES } from './MapaBrasil';
import { ESTADOS_COORDS, normalizarEstado } from '../utils/estadosCoords';
import {
    Users, Globe, TrendingUp, Activity, Zap,
    Trophy, Star, Medal, Award, History
} from 'lucide-react';

interface ClienteMapaDashboardProps {
    clientes: Cliente[];
    filtroCategoria: ClienteCategoria | 'ALL';
    onFiltroChange: (cat: ClienteCategoria | 'ALL') => void;
}

export const ClienteMapaDashboard: React.FC<ClienteMapaDashboardProps> = ({
    clientes, filtroCategoria, onFiltroChange
}) => {
    const [tick, setTick] = useState(0);
    const [streamItems, setStreamItems] = useState<Cliente[]>([]);

    // Ticker para efeito de "stream" de clientes
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
            if (clientes.length > 0) {
                const randomClient = clientes[Math.floor(Math.random() * clientes.length)];
                setStreamItems(prev => [randomClient, ...prev].slice(0, 6));
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [clientes]);

    // Stats por categoria
    const statsPorCategoria = useMemo(() => {
        const totais: Record<string, number> = {};
        clientes.forEach(c => {
            const cat = c.categoria || 'CLIENTE_NOVO';
            totais[cat] = (totais[cat] || 0) + 1;
        });
        return totais;
    }, [clientes]);

    // Top estados
    const topEstados = useMemo(() => {
        const mapa: Record<string, number> = {};
        clientes.forEach(c => {
            const sigla = normalizarEstado(c.estado || '');
            if (sigla) mapa[sigla] = (mapa[sigla] || 0) + 1;
        });
        return Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 7);
    }, [clientes]);

    const clientesAtivos = clientes.filter(c => c.status === 'ATIVO').length;
    const mapeados = clientes.filter(c => normalizarEstado(c.estado || '')).length;
    const categorias = Object.entries(CATEGORIA_CORES);

    return (
        <div className="flex flex-col gap-3 h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

            {/* ── Cabeçalho estilo Kaspersky ── */}
            <div
                className="rounded-xl p-4 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(109,40,217,0.25) 0%, rgba(59,130,246,0.1) 100%)',
                    border: '1px solid rgba(139,92,246,0.3)',
                }}
            >
                <div className="absolute top-0 right-0 bottom-0 w-20 opacity-10 pointer-events-none">
                    <div className="w-full h-full" style={{
                        background: 'repeating-linear-gradient(90deg, rgba(139,92,246,0.5) 0px, rgba(139,92,246,0.5) 1px, transparent 1px, transparent 8px)'
                    }} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                        <Globe size={16} className="text-violet-400" />
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <span className="text-[9px] font-bold text-violet-400 uppercase tracking-[0.25em]">Mapa de Clientes</span>
                    <span className="ml-auto text-[9px] font-mono text-slate-500">{new Date().toLocaleTimeString('pt-BR')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <div className="text-2xl font-black text-white font-mono">{clientes.length}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Total cadastros</div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-emerald-400 font-mono">{clientesAtivos}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Clientes ativos</div>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                    <Activity size={11} className="text-violet-400" />
                    <div className="flex-1 h-1 rounded-full bg-slate-800">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
                            style={{ width: `${clientes.length > 0 ? (mapeados / clientes.length) * 100 : 0}%` }}
                        />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">{mapeados} mapeados</span>
                </div>
            </div>

            {/* ── Filtro / Legenda por categoria ── */}
            <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(15,15,25,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div className="flex items-center gap-1.5 mb-3">
                    <Zap size={11} className="text-amber-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Filtrar por Categoria</span>
                </div>

                {/* Botão "Todos" */}
                <button
                    onClick={() => onFiltroChange('ALL')}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg mb-1.5 transition-all text-left ${filtroCategoria === 'ALL'
                            ? 'bg-white/10 border border-white/20'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                >
                    <div className="w-2 h-2 rounded-full bg-white" />
                    <span className="text-[10px] text-white font-semibold flex-1">Todos</span>
                    <span className="text-[9px] font-mono text-slate-500">{clientes.length}</span>
                </button>

                <div className="space-y-1">
                    {categorias.map(([cat, cor]) => {
                        const qtd = statsPorCategoria[cat] || 0;
                        if (qtd === 0) return null;
                        const isActive = filtroCategoria === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => onFiltroChange(isActive ? 'ALL' : cat as ClienteCategoria)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left border ${isActive
                                        ? 'border-opacity-50'
                                        : 'border-transparent hover:bg-white/5'
                                    }`}
                                style={isActive ? {
                                    background: `${cor.fill}15`,
                                    borderColor: `${cor.fill}40`,
                                } : {}}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: cor.fill }} />
                                    {isActive && (
                                        <div
                                            className="absolute inset-0 rounded-full animate-ping"
                                            style={{ background: cor.fill, opacity: 0.4 }}
                                        />
                                    )}
                                </div>
                                <span className="text-[10px] font-semibold flex-1 truncate" style={{ color: isActive ? cor.fill : '#94a3b8' }}>
                                    {cor.label}
                                </span>
                                <span className="text-[9px] font-mono font-bold" style={{ color: isActive ? cor.fill : '#475569' }}>
                                    {qtd}
                                </span>
                                {/* Barra de proporção */}
                                <div className="w-10 h-0.5 rounded-full bg-slate-800 flex-shrink-0">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${clientes.length > 0 ? (qtd / clientes.length) * 100 : 0}%`,
                                            background: cor.fill,
                                        }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Top Estados ── */}
            <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(15,15,25,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div className="flex items-center gap-1.5 mb-3">
                    <TrendingUp size={11} className="text-cyan-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Top Estados</span>
                </div>
                <div className="space-y-2">
                    {topEstados.length === 0 ? (
                        <div className="text-[10px] text-slate-600 text-center py-3">Nenhum dado de estado cadastrado</div>
                    ) : (
                        topEstados.map(([sigla, qtd], i) => {
                            const maxQtd = topEstados[0]?.[1] || 1;
                            return (
                                <div key={sigla} className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-slate-700 w-3">{i + 1}</span>
                                    <span className="text-[10px] font-bold text-slate-300 w-6 text-center font-mono">{sigla}</span>
                                    <div className="flex-1 h-1 rounded-full bg-slate-800">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${(qtd / maxQtd) * 100}%`,
                                                background: 'linear-gradient(90deg, #7c3aed, #22d3ee)',
                                            }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono text-cyan-400 font-bold w-5 text-right">{qtd}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Stream de atividade estilo Kaspersky ── */}
            <div
                className="rounded-xl p-3 flex-1"
                style={{ background: 'rgba(15,15,25,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Monitoramento Ativo</span>
                </div>
                <div className="space-y-2 overflow-hidden">
                    {streamItems.length === 0 ? (
                        <div className="text-[10px] text-slate-600 text-center py-3 font-mono">Aguardando dados...</div>
                    ) : streamItems.map((c, i) => {
                        const cor = CATEGORIA_CORES[c.categoria] || CATEGORIA_CORES.CLIENTE_NOVO;
                        return (
                            <div
                                key={`${c.id}-${i}`}
                                className="flex items-center gap-2 transition-all duration-500"
                                style={{ opacity: 1 - (i * 0.12) }}
                            >
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cor.fill }} />
                                <span className="text-[10px] text-slate-400 truncate flex-1 font-mono">{c.nome}</span>
                                <span className="text-[9px] flex-shrink-0" style={{ color: cor.fill }}>
                                    {c.cidade || c.estado || '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
