import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NewsTicker } from '../components/NewsTicker';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { CorteStatus, FaccaoStatus, PedidoStatus } from '../types';
import {
  Users, Scissors, CheckCircle, AlertTriangle, Activity, TrendingUp, TrendingDown,
  ShoppingBag, UserPlus, UserMinus, Clock, MapPin, Calendar, Target, ArrowUp, ArrowDown, Minus, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '../components/Skeleton';
import { isFaccaoCritical, getCriticalThreshold } from '../utils/alertUtils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

// Formata número no padrão brasileiro
const fmtNum = (n: any) => {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('pt-BR');
};

// Formata data no padrão brasileiro
const fmtDate = (d: string | null | undefined) => {
  if (!d) return '-';
  try {
    const dateStr = d.split('T')[0];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return d;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  } catch (e) {
    return d;
  }
};

// Calcula intervalo de datas baseado no período selecionado
const getPeriodRange = (period: string): { start: Date | null, end: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return { start: today, end: new Date(today.getTime() + 86400000) };
  if (period === '7d') return { start: new Date(today.getTime() - 7 * 86400000), end: null };
  if (period === '30d') return { start: new Date(today.getTime() - 30 * 86400000), end: null };
  if (period === '3m') return { start: new Date(today.getTime() - 90 * 86400000), end: null };
  if (period === 'year') return { start: new Date(today.getFullYear(), 0, 1), end: null };
  return { start: null, end: null };
};

const getPrevPeriodRange = (period: string): { start: Date | null, end: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return { start: new Date(today.getTime() - 86400000), end: today };
  if (period === '7d') return { start: new Date(today.getTime() - 14 * 86400000), end: new Date(today.getTime() - 7 * 86400000) };
  if (period === '30d') return { start: new Date(today.getTime() - 60 * 86400000), end: new Date(today.getTime() - 30 * 86400000) };
  if (period === '3m') return { start: new Date(today.getTime() - 180 * 86400000), end: new Date(today.getTime() - 90 * 86400000) };
  if (period === 'year') return { start: new Date(today.getFullYear() - 1, 0, 1), end: new Date(today.getFullYear(), 0, 1) };
  return { start: null, end: null };
};

export const Dashboard = () => {
  const { faccoes, cortes, metas, clientes, pedidos, comprasCampanha, isStockLoading, user, addToast } = useApp();
  const [filterPeriod, setFilterPeriod] = useState('30d');
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Se estiver carregando inicialmente e não tiver dados, mostra o skeleton
  if (isStockLoading && faccoes.length === 0) {
    return (
      <div className="p-6 space-y-8 animate-in fade-in duration-700">
        <header className="flex justify-between items-end mb-8">
          <div className="space-y-1">
            <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-900 rounded animate-pulse mt-2" />
          </div>
        </header>
        <DashboardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900/50 rounded-3xl animate-pulse" />
          <div className="h-96 bg-slate-900/50 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Boas-vindas personalizadas ao logar
  const dailySummary = useMemo(() => {
    if (isStockLoading) return null;

    const atrasados = cortes.filter(c => {
      if (c.status === CorteStatus.RECEBIDO || !c.dataPrevistaRecebimento) return false;
      return new Date(c.dataPrevistaRecebimento) < new Date();
    }).length;

    const hoje = new Date().toISOString().split('T')[0];
    const paraHoje = cortes.filter(c =>
      c.status !== CorteStatus.RECEBIDO &&
      c.dataPrevistaRecebimento?.startsWith(hoje)
    ).length;

    const staleLimit = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const inativos = clientes.filter(c => {
      const ultimaCompra = [...pedidos.filter(p => p.clienteId === c.id), ...comprasCampanha.filter(cp => cp.clienteId === c.id)];
      const datas = ultimaCompra.map(x => new Date((x as any).dataPedido || (x as any).dataCompra).getTime()).filter(Boolean);
      return datas.length === 0 || Math.max(...datas) < staleLimit;
    }).length;

    return { atrasados, paraHoje, inativos };
  }, [cortes, clientes, pedidos, comprasCampanha, isStockLoading]);

  // Boas-vindas personalizadas ao logar (Toast legacy)
  useEffect(() => {
    if (!welcomeShown && user && dailySummary) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
      const firstName = user.name?.split(' ')[0] || user.name;

      setTimeout(() => {
        addToast('info' as any, `${greeting}, ${firstName}! O painel foi atualizado com o resumo do dia.`);
      }, 1500);
      setWelcomeShown(true);
    }
  }, [welcomeShown, user, dailySummary]);

  const periodRange = useMemo(() => getPeriodRange(filterPeriod), [filterPeriod]);
  const prevPeriodRange = useMemo(() => getPrevPeriodRange(filterPeriod), [filterPeriod]);

  const filterByPeriod = <T extends { dataEnvio?: string; dataPedido?: string; dataCompra?: string }>(
    items: T[], field: keyof T
  ): T[] => {
    if (!periodRange.start) return items;
    return items.filter(item => {
      const val = item[field] as string;
      if (!val) return false;
      const d = new Date(val);
      if (periodRange.start && d < periodRange.start) return false;
      if (periodRange.end && d >= periodRange.end) return false;
      return true;
    });
  };

  const filteredCortes = useMemo(() => filterByPeriod(cortes, 'dataEnvio'), [cortes, periodRange]);
  const filteredPedidos = useMemo(() => filterByPeriod(pedidos, 'dataPedido' as any), [pedidos, periodRange]);
  const filteredCompras = useMemo(() => filterByPeriod(comprasCampanha, 'dataCompra' as any), [comprasCampanha, periodRange]);

  const prevCortes = useMemo(() => {
    if (!prevPeriodRange.start) return cortes;
    return cortes.filter(c => {
      const d = new Date(c.dataEnvio);
      return d >= prevPeriodRange.start! && (!prevPeriodRange.end || d < prevPeriodRange.end);
    });
  }, [cortes, prevPeriodRange]);

  // Calcular tendência (%) comparando período atual vs anterior
  const calcTrend = (curr: number, prev: number): { value: number; up: boolean | null } => {
    if (prev === 0) return { value: 0, up: null };
    const diff = ((curr - prev) / prev) * 100;
    return { value: Math.abs(Math.round(diff)), up: diff >= 0 };
  };

  // Logic to calculate metrics
  const summary = useMemo(() => {
    const activeMeta = metas.find(m => m.isActive) || { maxDefectPercentage: 5 };

    const totalFaccoes = faccoes.filter(f => f.status === FaccaoStatus.ATIVO).length;
    const cortesEnviados = filteredCortes.length;
    const cortesRecebidos = filteredCortes.filter(c => c.status === CorteStatus.RECEBIDO).length;

    const pecasRecebidas = filteredCortes.reduce((acc, curr) => acc + (curr.qtdTotalRecebida || 0), 0);
    const pecasDefeito = filteredCortes.reduce((acc, curr) => acc + (curr.qtdTotalDefeitos || 0), 0);

    const percentualGeralDefeito = pecasRecebidas > 0
      ? parseFloat(((pecasDefeito / pecasRecebidas) * 100).toFixed(2))
      : 0;

    // Cortes atrasados
    const cortesAtrasados = cortes.filter(c => {
      if (c.status === CorteStatus.RECEBIDO || !c.dataPrevistaRecebimento) return false;
      return new Date(c.dataPrevistaRecebimento) < new Date();
    });

    let naMeta = 0;
    let foraMeta = 0;
    // Processamento de Dados por Facção (Com Score de Performance)
    const faccaoStats = faccoes.map(f => {
      const faccaoCortes = filteredCortes.filter(c => c.faccaoId === f.id);
      const recebidos = faccaoCortes.filter(c => c.status === 'RECEBIDO');

      const totalEnviado = faccaoCortes.reduce((acc, c) => acc + c.qtdTotalEnviada, 0);
      const totalRecebido = recebidos.reduce((acc, c) => acc + c.qtdTotalRecebida, 0);
      const totalDefeitos = recebidos.reduce((acc, c) => acc + c.qtdTotalDefeitos, 0);

      const defectRate = totalRecebido > 0 ? (totalDefeitos / totalRecebido) * 100 : 0;
      const meta = metas.find(m => m.isActive) || { maxDefectPercentage: 5 };

      // Algoritmo de Score Webpic (0-100)
      let score = 100;

      // Penalidade por Defeitos (acima da meta)
      if (defectRate > meta.maxDefectPercentage) {
        score -= (defectRate - meta.maxDefectPercentage) * 10;
      }

      // Penalidade por Atrasos
      const cortesAtrasados = faccaoCortes.filter(c =>
        c.status !== 'RECEBIDO' &&
        c.dataPrevistaRecebimento &&
        new Date(c.dataPrevistaRecebimento) < new Date()
      );
      score -= (cortesAtrasados.length * 5);

      // Bônus por Volume e Fidelidade (mínimo de envios)
      if (recebidos.length > 5) score += 5;

      return {
        id: f.id,
        nome: f.name,
        totalEnviado,
        totalRecebido,
        totalDefeitos,
        defectRate,
        score: Math.max(0, Math.min(100, score)),
        isCritical: isFaccaoCritical(defectRate, meta.maxDefectPercentage),
        totalCortes: faccaoCortes.length
      };
    });
    const criticalFaccoes: any[] = [];

    faccoes.forEach(faccao => {
      const faccaoCortes = cortes.filter(c => c.faccaoId === faccao.id && c.status === CorteStatus.RECEBIDO);
      const fReceived = faccaoCortes.reduce((a, b) => a + b.qtdTotalRecebida, 0);
      const fDefects = faccaoCortes.reduce((a, b) => a + b.qtdTotalDefeitos, 0);
      const fPercent = fReceived > 0 ? (fDefects / fReceived) * 100 : 0;

      if (fReceived > 0) {
        if (fPercent <= activeMeta.maxDefectPercentage) naMeta++;
        else foraMeta++;

        if (isFaccaoCritical(fPercent, activeMeta.maxDefectPercentage)) {
          criticalFaccoes.push({
            name: faccao.name,
            percent: parseFloat(fPercent.toFixed(2)),
            received: fReceived,
            defects: fDefects
          });
        }
      }
    });

    // --- CLIENT INSIGHTS ---
    const staleLimit = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const clientStats = clientes.map(c => {
      const clientPedidos = pedidos.filter(p => p.clienteId === c.id);
      const clientCampaign = comprasCampanha.filter(comp => comp.clienteId === c.id);
      const totalPieces = clientCampaign.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);
      const totalP = clientPedidos.length;
      const dates = [
        ...clientPedidos.map(p => p.dataPedido),
        ...clientCampaign.map(cp => cp.dataCompra)
      ].filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());

      return { ...c, totalItems: totalPieces + totalP, lastDate: dates[0] || null };
    });

    const topBuyers = [...clientStats]
      .filter(c => c.totalItems > 0)
      .sort((a, b) => b.totalItems - a.totalItems)
      .slice(0, 5);

    const inactiveOrNew = [...clientStats]
      .filter(c => c.totalItems === 0 || (c.lastDate && new Date(c.lastDate).getTime() < staleLimit))
      .sort((a, b) => {
        if (!a.lastDate) return -1;
        if (!b.lastDate) return 1;
        return new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime();
      })
      .slice(0, 5);

    const lastPedidos = [...pedidos]
      .sort((a, b) => new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime())
      .slice(0, 6);

    // Vendas por estado
    const vendasPorEstado: Record<string, number> = {};
    clientes.forEach(c => {
      if (c.estado && c.estado.trim()) {
        const estado = c.estado.trim().toUpperCase();
        vendasPorEstado[estado] = (vendasPorEstado[estado] || 0) + 1;
      }
    });
    const vendasEstadoData = Object.entries(vendasPorEstado)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([estado, total]) => ({ estado, total }));

    // Tendências vs período anterior
    const prevPecasRecebidas = prevCortes.reduce((acc, curr) => acc + (curr.qtdTotalRecebida || 0), 0);
    const prevPecasDefeito = prevCortes.reduce((acc, curr) => acc + (curr.qtdTotalDefeitos || 0), 0);
    const prevPercentualDefeito = prevPecasRecebidas > 0 ? (prevPecasDefeito / prevPecasRecebidas) * 100 : 0;

    const trendCortes = calcTrend(cortesEnviados, prevCortes.length);
    const trendPecas = calcTrend(pecasRecebidas, prevPecasRecebidas);
    const trendDefeitos = calcTrend(percentualGeralDefeito, prevPercentualDefeito);
    // Inverter lógica de up/down para defeitos (down is good)
    if (trendDefeitos.up !== null) trendDefeitos.up = !trendDefeitos.up;

    const prevFaccoes = faccoes.length; // Simplified for now
    const trendFaccoes = calcTrend(totalFaccoes, prevFaccoes);

    return {
      totalFaccoes, cortesEnviados, cortesRecebidos, pecasRecebidas, pecasDefeito,
      percentualGeralDefeito, naMeta, foraMeta, criticalFaccoes, topBuyers, inactiveOrNew, lastPedidos,
      criticalThreshold: getCriticalThreshold(activeMeta.maxDefectPercentage),
      maxDefectPercentage: activeMeta.maxDefectPercentage,
      cortesAtrasados, vendasEstadoData, trendCortes, trendPecas, trendDefeitos, trendFaccoes,
      totalClientes: clientes.length
    };
  }, [faccoes, filteredCortes, cortes, metas, clientes, pedidos, comprasCampanha, prevCortes]);

  // Gráfico de barras por facção (filtrado)
  const barData = faccoes.map(f => {
    const fCortes = filteredCortes.filter(c => c.faccaoId === f.id && c.status === CorteStatus.RECEBIDO);
    return {
      name: f.name.split(' ')[0],
      Entregue: fCortes.reduce((a, b) => a + b.qtdTotalRecebida, 0),
      Defeitos: fCortes.reduce((a, b) => a + b.qtdTotalDefeitos, 0)
    };
  }).filter(d => d.Entregue > 0);

  const pieData = faccoes.map(f => {
    const fCortes = filteredCortes.filter(c => c.faccaoId === f.id && c.status === CorteStatus.RECEBIDO);
    const defects = fCortes.reduce((a, b) => a + b.qtdTotalDefeitos, 0);
    return { name: f.name, value: defects };
  }).filter(d => d.value > 0);

  // Componente StatCard melhorado com tendência
  const StatCard = ({ title, value, sub, icon, colorClass, borderColor, trend }: any) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative group tech-card corner-cut p-6 cursor-pointer`}
    >
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${borderColor} to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${borderColor.replace('from-', 'from-')} to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-lg`} />

      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-4xl font-black ${colorClass} tracking-tighter`}>{value}</h3>
            {sub && <span className="text-xs text-slate-400 font-mono italic">{sub}</span>}
          </div>

          {trend && filterPeriod !== 'all' && (
            <div className={`flex items-center gap-1 mt-2 ${trend.up === null ? 'text-slate-500' : trend.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.up === null ? <Minus size={12} /> : trend.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span className="text-[10px] font-bold font-mono">
                {trend.up === null ? 'sem dados anteriores' : `${trend.value}% vs. período ant.`}
              </span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl tech-card bg-slate-900 border ${borderColor} group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-300`}>
          <div className={colorClass}>{icon}</div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute -bottom-2 -right-2 opacity-5 scale-150 rotate-12 group-hover:opacity-10 transition-opacity duration-500">
        {icon}
      </div>
    </motion.div>
  );

  const periodOptions = [
    { value: 'all', label: 'Todo Período' },
    { value: 'today', label: 'Hoje' },
    { value: '7d', label: '7 Dias' },
    { value: '30d', label: '30 Dias' },
    { value: '3m', label: '3 Meses' },
    { value: 'year', label: 'Este Ano' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-cyan/5 blur-3xl rounded-full" />
        <div className="relative">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
            Dashboard <span className="text-brand-cyan">Analytic</span>
          </h2>
          <div className="flex items-center gap-3">
            <p className="text-brand-cyan font-mono text-xs tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> SISTEMA ATIVO
            </p>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
              v2.0 // NEXUS_PROTOCOL
            </p>
          </div>
        </div>

        {/* Period Selectors */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1">
          {periodOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterPeriod(opt.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${filterPeriod === opt.value
                ? 'bg-brand-cyan text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Daily Summary Banner */}
      {dailySummary && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${dailySummary.atrasados > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Atrasos Críticos</p>
              <h4 className="text-white font-bold">{dailySummary.atrasados} Cortes</h4>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previstos Hoje</p>
              <h4 className="text-white font-bold">{dailySummary.paraHoje} Entregas</h4>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Leads/Inativos</p>
              <h4 className="text-white font-bold">{dailySummary.inativos} Atenção</h4>
            </div>
          </div>
        </motion.div>
      )}

      <NewsTicker />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Oficinas Ativas"
          value={summary.totalFaccoes}
          sub="unidades"
          icon={<Users size={24} />}
          colorClass="text-brand-cyan"
          borderColor="from-brand-cyan"
          trend={summary.trendFaccoes}
        />
        <StatCard
          title="Cortes Enviados"
          value={fmtNum(summary.cortesEnviados)}
          sub="ordens"
          icon={<Scissors size={24} />}
          colorClass="text-amber-400"
          borderColor="from-amber-400"
          trend={summary.trendCortes}
        />
        <StatCard
          title="Peças Recebidas"
          value={fmtNum(summary.pecasRecebidas)}
          sub="unidades"
          icon={<CheckCircle size={24} />}
          colorClass="text-emerald-400"
          borderColor="from-emerald-400"
          trend={summary.trendPecas}
        />
        <StatCard
          title="Taxa de Defeitos"
          value={`${summary.percentualGeralDefeito}%`}
          sub="geral"
          icon={<AlertTriangle size={24} />}
          colorClass={summary.percentualGeralDefeito > summary.maxDefectPercentage ? "text-red-400" : "text-emerald-400"}
          borderColor={summary.percentualGeralDefeito > summary.maxDefectPercentage ? "from-red-400" : "from-emerald-400"}
          trend={summary.trendDefeitos}
        />
      </div>

      {/* Alerta Cortes Atrasados */}
      <AnimatePresence>
        {summary.cortesAtrasados.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-400 uppercase">Atenção: Cortes Atrasados</h4>
                  <p className="text-xs text-slate-500">{summary.cortesAtrasados.length} ordem(ns) ultrapassou a data prevista de recebimento.</p>
                </div>
              </div>
              <a href="/cortes" className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors group-hover:scale-105">
                Verificar Entregas
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerta Facções Críticas */}
      {summary.criticalFaccoes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-950/30 border-2 border-red-500/50 rounded-lg p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-400 animate-pulse" />
              <div>
                <h3 className="text-xl font-bold text-red-400 uppercase tracking-wider">
                  ⚠️ ALERTA CRÍTICO: {summary.criticalFaccoes.length} Facção{summary.criticalFaccoes.length > 1 ? 'ões' : ''} em Situação de Risco
                </h3>
                <p className="text-xs text-red-300/80 font-mono mt-1">
                  Defeitos ≥ {summary.criticalThreshold.toFixed(2)}% (80% da meta de {summary.maxDefectPercentage}%)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.criticalFaccoes.map((faccao: any, idx: number) => (
                <div key={idx} className="bg-slate-950/80 border border-red-500/30 p-4 relative group hover:border-red-500 transition-all rounded-xl">
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded">CRÍTICO</span>
                    <div className="flex items-center gap-1.5 mt-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Score</span>
                      <span className="text-sm font-black text-red-400 font-mono">{faccao.score}</span>
                    </div>
                  </div>
                  <h4 className="text-white font-bold mb-2 pr-16">{faccao.name}</h4>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400"><span>Recebido:</span><span className="text-white">{fmtNum(faccao.received)} pcs</span></div>
                    <div className="flex justify-between text-slate-400"><span>Defeitos:</span><span className="text-red-400 font-bold">{fmtNum(faccao.defects)} pcs</span></div>
                    <div className="flex justify-between items-center border-t border-slate-800 pt-2 mt-2">
                      <span className="text-slate-400">Taxa Atual:</span>
                      <span className="text-red-400 font-bold text-lg">{faccao.percent}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Clientes Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Buyers */}
        <div className="tech-card p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserPlus size={20} className="text-brand-cyan" /> Maiores Clientes
            </h3>
            <span className="text-[10px] font-mono text-slate-500">RANKING_TOP_5</span>
          </div>
          <div className="space-y-3">
            {isStockLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />)
            ) : summary.topBuyers.length > 0 ? summary.topBuyers.map((client: any, idx: number) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-brand-cyan/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-yellow-500 text-slate-950' : idx === 1 ? 'bg-slate-400 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase">{client.nome}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{client.categoria} • {client.contato}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-brand-cyan font-bold text-sm">{fmtNum(client.totalItems)} itens</p>
                  <p className="text-[9px] text-slate-500 uppercase">Total Compras</p>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-slate-500 text-xs font-mono">Nenhum cliente com compras</div>
            )}
          </div>
        </div>

        {/* Inativos */}
        <div className="tech-card p-6 flex flex-col space-y-4 border-l-4 border-l-red-500/30">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserMinus size={20} className="text-slate-400" /> Oportunidades / Inativos
            </h3>
            <span className="text-[10px] font-mono text-red-400/70">RECOVERY_ACTION</span>
          </div>
          <div className="space-y-3">
            {isStockLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />)
            ) : summary.inactiveOrNew.length > 0 ? summary.inactiveOrNew.map((client: any) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-800/50 rounded-lg group hover:border-red-500/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Clock size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 uppercase">{client.nome}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {client.lastDate ? `Última compra: ${fmtDate(client.lastDate)}` : 'Nunca comprou'}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${!client.lastDate ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                  {!client.lastDate ? 'Lead Novo' : 'Inativo'}
                </span>
              </div>
            )) : (
              <div className="py-10 text-center text-slate-500 text-xs font-mono">Todos os clientes ativos!</div>
            )}
          </div>
        </div>
      </div>

      {/* Últimas Compras */}
      <div className="tech-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-cyan" /> Status das Últimas Compras
          </h3>
          <a href="/clients?view=PURCHASES" className="text-[10px] font-bold text-brand-cyan hover:underline uppercase tracking-widest">Ver Todas →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                <th className="pb-3 px-2">Pedido</th>
                <th className="pb-3 px-2">Cliente</th>
                <th className="pb-3 px-2">Data</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Itens</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-800/50">
              {isStockLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-4 px-2"><div className="h-8 bg-slate-800/50 rounded w-full" /></td>
                  </tr>
                ))
              ) : summary.lastPedidos.length > 0 ? summary.lastPedidos.map((pedido: any) => (
                <tr key={pedido.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-2 font-mono text-brand-cyan">#{pedido.numero}</td>
                  <td className="py-4 px-2">
                    <div className="font-bold text-slate-200 uppercase">{pedido.cliente?.nome || 'Cliente Removido'}</div>
                    <div className="text-[10px] text-slate-500">{pedido.cliente?.cidade}</div>
                  </td>
                  <td className="py-4 px-2 text-slate-400">{fmtDate(pedido.dataPedido)}</td>
                  <td className="py-4 px-2">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${pedido.status === 'EXPEDIDO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      pedido.status === 'SEPARANDO' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                      {pedido.status}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right font-mono text-slate-300">
                    {fmtNum(pedido.itens.reduce((acc: number, curr: any) => acc + curr.quantidade, 0))} pcs
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono uppercase tracking-[0.2em] text-[10px]">
                    Nenhum pedido recente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficos principais + Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 tech-card corner-cut-diagonal p-6 flex flex-col h-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-cyan" /> Volume vs Qualidade (Facções)
            </h3>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase"><div className="w-2 h-2 bg-indigo-500" /> Entregue</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase"><div className="w-2 h-2 bg-pink-500" /> Defeitos</span>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} itemStyle={{ color: '#f8fafc' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="Entregue" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Defeitos" fill="#ec4899" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clientes por Estado */}
        <div className="tech-card p-6 flex flex-col h-80">
          <h3 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-brand-cyan" /> Clientes por Estado
          </h3>
          {summary.vendasEstadoData.length > 0 ? (
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {summary.vendasEstadoData.map((item, idx) => (
                <div key={item.estado} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-slate-300">{item.estado}</span>
                    <span className="text-brand-cyan">{fmtNum(item.total)} cli</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.total / summary.totalClientes) * 100}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-brand-cyan to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-[10px] uppercase font-mono">
              Sem dados geográficos
            </div>
          )}
        </div>
      </div>

      {/* Tabela Detalhada de Cortes Atrasados (Nova Seção) */}
      {summary.cortesAtrasados.length > 0 && (
        <div className="tech-card p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={20} className="text-red-500" /> Detalhamento de Atrasos
            </h3>
            <span className="text-[10px] font-mono text-red-500/70">URGENCY_LIST</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                  <th className="pb-3 px-2">Ref/Lote</th>
                  <th className="pb-3 px-2">Oficina (Facção)</th>
                  <th className="pb-3 px-2">Data Prevista</th>
                  <th className="pb-3 px-2">Atraso</th>
                  <th className="pb-3 px-2 text-right">Qtd</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/50">
                {summary.cortesAtrasados.sort((a, b) => new Date(a.dataPrevistaRecebimento!).getTime() - new Date(b.dataPrevistaRecebimento!).getTime()).slice(0, 8).map((corte: any) => {
                  const diasAtraso = Math.floor((Date.now() - new Date(corte.dataPrevistaRecebimento!).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={corte.id} className="hover:bg-red-500/5 transition-colors group">
                      <td className="py-4 px-2 font-mono text-red-400 font-bold">{corte.referencia}</td>
                      <td className="py-4 px-2">
                        <div className="font-bold text-slate-200 uppercase">{faccoes.find(f => f.id === corte.faccaoId)?.name || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-2 text-slate-400">{fmtDate(corte.dataPrevistaRecebimento)}</td>
                      <td className="py-4 px-2">
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-[10px] font-black uppercase">
                          {diasAtraso} dias
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right font-mono text-slate-300">
                        {fmtNum(corte.quantidadeTotal)} pcs
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};