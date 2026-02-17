import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import {
    Package,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Activity,
    Archive,
    CheckCircle,
    Clock
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area
} from 'recharts';

const StockDashboard = () => {
    const { skus, pedidos, producao, devolucoes } = useApp();

    // --- Metrics Calculations ---
    const metrics = useMemo(() => {
        const totalItensFisico = skus.reduce((acc, sku) => acc + (sku.saldoFisico || 0), 0);
        const totalItensDisponivel = skus.reduce((acc, sku) => acc + (sku.saldoDisponivel || 0), 0);
        const totalItensReservado = skus.reduce((acc, sku) => acc + (sku.saldoReservado || 0), 0);

        const skusEmAlerta = skus.filter(sku => (sku.saldoDisponivel || 0) <= 5);
        const listaAlertas = skusEmAlerta.map(sku => ({
            ref: sku.produto?.referencia,
            cor: sku.cor?.nome,
            tam: sku.tamanho?.nome,
            qtd: sku.saldoDisponivel
        }));

        // Recent Activity (Mocked logic or derived if we had dates in movements easily accessible here)
        // For now, let's just count Today's orders
        const today = new Date().toISOString().split('T')[0];
        const pedidosHoje = pedidos.filter(p => p.dataPedido.startsWith(today)).length;

        return {
            totalItensFisico,
            totalItensDisponivel,
            totalItensReservado,
            skusEmAlerta: skusEmAlerta.length,
            listaAlertas,
            pedidosHoje
        };
    }, [skus, pedidos]);

    // --- Chart Data Preparation ---

    // 1. Top 10 Products by Physical Stock
    const topProductsData = useMemo(() => {
        return [...skus]
            .sort((a, b) => b.saldoFisico - a.saldoFisico)
            .slice(0, 10)
            .map(sku => ({
                name: `${sku.produto?.referencia} - ${sku.cor?.nome} ${sku.tamanho?.nome}`,
                quantidade: sku.saldoFisico
            }));
    }, [skus]);

    // 2. Order Status Distribution
    const orderStatusData = useMemo(() => {
        const statusCounts = pedidos.reduce((acc, pedido) => {
            acc[pedido.status] = (acc[pedido.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(statusCounts).map(status => ({
            name: status,
            value: statusCounts[status]
        }));
    }, [pedidos]);

    const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];

    // 3. Production Status Distribution
    const productionStatusData = useMemo(() => {
        const statusCounts = producao.reduce((acc, op) => {
            acc[op.status] = (acc[op.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(statusCounts).map(status => ({
            name: status,
            value: statusCounts[status]
        }));
    }, [producao]);


    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Físico */}
                <div className="bg-slate-900/40 p-6 rounded-2xl shadow-lg border border-slate-800/60 flex items-center justify-between backdrop-blur-sm group hover:border-nexus-cyan/30 transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total em Estoque</p>
                        <h3 className="text-3xl font-bold text-white mt-1 font-mono">{metrics.totalItensFisico}</h3>
                        <span className="text-[10px] text-nexus-green flex items-center mt-2 font-bold uppercase tracking-wider">
                            <Package size={10} className="mr-1" /> Peças no Galpão
                        </span>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl text-nexus-cyan border border-slate-800 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        <Archive size={24} />
                    </div>
                </div>

                {/* Disponível vs Reservado */}
                <div className="bg-slate-900/40 p-6 rounded-2xl shadow-lg border border-slate-800/60 flex items-center justify-between backdrop-blur-sm group hover:border-emerald-500/30 transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Disponível / Reservado</p>
                        <div className="flex items-baseline gap-2 mt-1 font-mono">
                            <h3 className="text-3xl font-bold text-nexus-green">{metrics.totalItensDisponivel}</h3>
                            <span className="text-slate-600 text-lg">/</span>
                            <h3 className="text-xl font-bold text-amber-500">{metrics.totalItensReservado}</h3>
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center mt-2 font-bold uppercase tracking-wider">
                            <ShoppingCart size={10} className="mr-1" /> Fluxo Atual
                        </span>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl text-emerald-400 border border-slate-800 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <CheckCircle size={24} />
                    </div>
                </div>

                {/* Alertas de Estoque */}
                <div className="bg-slate-900/40 p-6 rounded-2xl shadow-lg border border-slate-800/60 flex items-center justify-between backdrop-blur-sm group hover:border-red-500/30 transition-all relative">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">REF. em Alerta</p>
                        <h3 className="text-3xl font-bold text-red-500 mt-1 font-mono">{metrics.skusEmAlerta}</h3>
                        <span className="text-[10px] text-red-400 flex items-center mt-2 font-bold uppercase tracking-wider">
                            <AlertTriangle size={10} className="mr-1" /> ≤ 5 Peças
                        </span>

                        {/* Alerta List (Show if many) */}
                        {metrics.listaAlertas.length > 0 && (
                            <div className="mt-3 space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
                                {metrics.listaAlertas.slice(0, 3).map((alerta, i) => (
                                    <p key={i} className="text-[10px] text-slate-400 font-medium">
                                        <span className="text-white">{alerta.ref}</span> ({alerta.cor} {alerta.tam}): <span className="text-red-400">{alerta.qtd}</span>
                                    </p>
                                ))}
                                {metrics.listaAlertas.length > 3 && (
                                    <p className="text-[9px] text-slate-600 italic">+ {metrics.listaAlertas.length - 3} outros...</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl text-red-500 border border-slate-800 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.1)] ml-4">
                        <Activity size={24} />
                    </div>
                </div>

                {/* Pedidos Hoje */}
                <div className="bg-slate-900/40 p-6 rounded-2xl shadow-lg border border-slate-800/60 flex items-center justify-between backdrop-blur-sm group hover:border-purple-500/30 transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pedidos Hoje</p>
                        <h3 className="text-3xl font-bold text-white mt-1 font-mono">{metrics.pedidosHoje}</h3>
                        <span className="text-[10px] text-slate-400 flex items-center mt-2 font-bold uppercase tracking-wider">
                            <Clock size={10} className="mr-1" /> Movimentação Diária
                        </span>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl text-purple-400 border border-slate-800 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Products Bar Chart */}
                <div className="bg-slate-900/40 p-6 rounded-2xl shadow-lg border border-slate-800/60 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center uppercase tracking-wider">
                        <TrendingUp className="mr-2 text-nexus-cyan" size={16} />
                        Top 10 Produtos (Volume Físico)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProductsData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e293b" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                />
                                <Bar dataKey="quantidade" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status Pie Chart */}
                <div className="bg-slate-900/40 p-6 rounded-2xl shadow-lg border border-slate-800/60 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center uppercase tracking-wider">
                            <ShoppingCart className="mr-2 text-emerald-500" size={16} />
                            Status dos Pedidos
                        </h3>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={orderStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {orderStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Production Status Chart */}
            <div className="bg-slate-900/40 p-6 rounded-2xl shadow-lg border border-slate-800/60 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white flex items-center uppercase tracking-wider">
                        <Activity className="mr-2 text-amber-500" size={16} />
                        Painel de Produção (Visão Geral)
                    </h3>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productionStatusData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
                            <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default StockDashboard;
