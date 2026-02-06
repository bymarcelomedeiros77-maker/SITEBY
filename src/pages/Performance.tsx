import React from 'react';
import { useApp } from '../context/AppContext';
import { CorteStatus, FaccaoStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const Performance = () => {
    const { faccoes, cortes, metas } = useApp();
    const activeMeta = metas.find(m => m.isActive) || { maxDefectPercentage: 5 };

    // Calculate stats for each active Faccao
    const performanceData = faccoes
        .filter(f => f.status === FaccaoStatus.ATIVO)
        .map(f => {
            const myCortes = cortes.filter(c => c.faccaoId === f.id && c.status === CorteStatus.RECEBIDO);
            const totalReceived = myCortes.reduce((a, b) => a + b.qtdTotalRecebida, 0);
            const totalDefects = myCortes.reduce((a, b) => a + b.qtdTotalDefeitos, 0);
            const percentage = totalReceived > 0 ? (totalDefects / totalReceived) * 100 : 0;

            return {
                id: f.id,
                name: f.name,
                totalReceived,
                totalDefects,
                percentage: parseFloat(percentage.toFixed(2)),
                isWithinGoal: percentage <= activeMeta.maxDefectPercentage
            };
        })
        .sort((a, b) => a.percentage - b.percentage); // Sort by best quality (lowest defect %)

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Performance e Qualidade</h2>
                <p className="text-brand-cyan font-mono text-xs mt-1 tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} className="animate-pulse" /> ANÁLISE DE DESEMPENHO POR FACÇÃO
                </p>
            </div>

            {/* Meta Banner - Compacto */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="tech-card p-4 flex justify-between items-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan to-transparent"></div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-cyan/10 rounded-lg border border-brand-cyan/30">
                        <Target className="text-brand-cyan" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Meta Atual</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Máx. defeitos/lote</p>
                    </div>
                </div>
                <div className="text-4xl font-bold text-brand-cyan">
                    {activeMeta.maxDefectPercentage}%
                </div>
            </motion.div>

            {/* Chart - Mais Compacto */}
            <div className="tech-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                    <TrendingUp className="text-brand-cyan" size={18} />
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">Ranking de Qualidade</h3>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">(Menor % = Melhor)</span>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <XAxis type="number" domain={[0, 'auto']} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                            <Tooltip
                                formatter={(value: number) => [`${value}%`, "Defeitos"]}
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderColor: '#334155',
                                    color: '#f8fafc',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={16}>
                                {performanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.isWithinGoal ? '#10b981' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Grid - Cards Menores */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 }
                    }
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {performanceData.map(p => (
                    <motion.div
                        key={p.id}
                        variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`tech-card p-4 cursor-pointer relative overflow-hidden`}
                    >
                        {/* Top border */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${p.isWithinGoal ? 'bg-green-500' : 'bg-red-500'}`}></div>

                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-white text-sm truncate pr-2">{p.name}</h4>
                            {p.isWithinGoal ? (
                                <Trophy className="text-green-500 flex-shrink-0" size={16} />
                            ) : (
                                <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="space-y-2 mb-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-mono uppercase">Recebido</span>
                                <span className="font-bold text-white">{p.totalReceived}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-mono uppercase">Defeitos</span>
                                <span className="font-bold text-slate-300">{p.totalDefects}</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-800 mb-3"></div>

                        {/* Main Metric */}
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Taxa</span>
                            <span className={`text-2xl font-bold ${p.isWithinGoal ? 'text-green-500' : 'text-red-500'}`}>
                                {p.percentage}%
                            </span>
                        </div>

                        {/* Status Badge */}
                        <div className="text-center">
                            {p.isWithinGoal ? (
                                <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-green-500/30">
                                    ✓ Na Meta
                                </span>
                            ) : (
                                <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/30">
                                    ✗ Fora da Meta
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};
