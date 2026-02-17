import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { NewsTicker } from '../components/NewsTicker';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { CorteStatus, FaccaoStatus } from '../types';
import { Users, Scissors, CheckCircle, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { isFaccaoCritical, getCriticalThreshold } from '../utils/alertUtils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

export const Dashboard = () => {
  const { faccoes, cortes, metas } = useApp();
  const [filterPeriod, setFilterPeriod] = useState('all');

  // Logic to calculate metrics
  const metrics = useMemo(() => {
    const activeMeta = metas.find(m => m.isActive) || { maxDefectPercentage: 5 };
    const filteredCortes = cortes;

    const totalFaccoes = faccoes.filter(f => f.status === FaccaoStatus.ATIVO).length;
    const cortesEnviados = filteredCortes.length;
    const cortesRecebidos = filteredCortes.filter(c => c.status === CorteStatus.RECEBIDO).length;

    const pecasRecebidas = filteredCortes.reduce((acc, curr) => acc + (curr.qtdTotalRecebida || 0), 0);
    const pecasDefeito = filteredCortes.reduce((acc, curr) => acc + (curr.qtdTotalDefeitos || 0), 0);

    const percentualGeralDefeito = pecasRecebidas > 0
      ? parseFloat(((pecasDefeito / pecasRecebidas) * 100).toFixed(2))
      : 0;

    let naMeta = 0;
    let foraMeta = 0;
    const criticalFaccoes: Array<{ name: string; percent: number; received: number; defects: number }> = [];

    faccoes.forEach(faccao => {
      const faccaoCortes = filteredCortes.filter(c => c.faccaoId === faccao.id && c.status === CorteStatus.RECEBIDO);
      const fReceived = faccaoCortes.reduce((a, b) => a + b.qtdTotalRecebida, 0);
      const fDefects = faccaoCortes.reduce((a, b) => a + b.qtdTotalDefeitos, 0);
      const fPercent = fReceived > 0 ? (fDefects / fReceived) * 100 : 0;

      if (fReceived > 0) {
        if (fPercent <= activeMeta.maxDefectPercentage) naMeta++;
        else foraMeta++;

        // Check if faction is in critical state
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

    return {
      totalFaccoes,
      cortesEnviados,
      cortesRecebidos,
      pecasRecebidas,
      pecasDefeito,
      percentualGeralDefeito,
      naMeta,
      foraMeta,
      criticalFaccoes,
      criticalThreshold: getCriticalThreshold(activeMeta.maxDefectPercentage),
      maxDefectPercentage: activeMeta.maxDefectPercentage
    };
  }, [faccoes, cortes, metas, filterPeriod]);

  // Chart Data Prep
  const barData = faccoes.map(f => {
    const fCortes = cortes.filter(c => c.faccaoId === f.id && c.status === CorteStatus.RECEBIDO);
    return {
      name: f.name.split(' ')[0],
      Pecas: fCortes.reduce((a, b) => a + b.qtdTotalRecebida, 0),
      Defeitos: fCortes.reduce((a, b) => a + b.qtdTotalDefeitos, 0)
    };
  }).filter(d => d.Pecas > 0);

  const pieData = faccoes.map(f => {
    const fCortes = cortes.filter(c => c.faccaoId === f.id && c.status === CorteStatus.RECEBIDO);
    const defects = fCortes.reduce((a, b) => a + b.qtdTotalDefeitos, 0);
    return { name: f.name, value: defects };
  }).filter(d => d.value > 0);


  const StatCard = ({ title, value, sub, icon, colorClass, borderColor }: any) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative group tech-card corner-cut p-6 cursor-pointer`}
    >
      {/* Animated glowing top line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${borderColor} to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300`}>
        <div className={`h-full w-1/3 bg-gradient-to-r ${borderColor} to-transparent animate-shimmer`}></div>
      </div>

      {/* Background glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${borderColor.replace('from-', 'from-')} to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-lg`}></div>

      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-xs font-mono uppercase text-slate-400 mb-2 tracking-widest group-hover:text-slate-300 transition-colors">{title}</p>
          <motion.h3
            className="text-3xl font-bold text-white font-sans"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {value}
          </motion.h3>
          {sub && (
            <div className="flex items-center gap-1 mt-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full ${sub.includes('Recebidos') ? 'bg-indigo-500' : 'bg-slate-500'}`}
              ></motion.div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{sub}</p>
            </div>
          )}
        </div>
        <motion.div
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={`p-3 rounded-md bg-slate-950/50 border border-slate-800 ${colorClass} shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-shadow duration-300`}
        >
          {icon}
        </motion.div>
      </div>

      {/* Animated decorative corner */}
      <motion.div
        className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-slate-800 group-hover:border-brand-cyan/70 transition-all opacity-30"
        whileHover={{ width: 40, height: 40 }}
        transition={{ duration: 0.2 }}
      ></motion.div>
    </motion.div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* News Ticker */}
      <NewsTicker cortes={cortes} faccoes={faccoes} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Centro de Comando</h2>
          <p className="text-brand-cyan font-mono text-xs mt-1 tracking-widest flex items-center gap-2">
            <Activity size={12} className="animate-pulse" /> MONITORAMENTO EM TEMPO REAL
          </p>
        </div>

        <div className="relative">
          <select
            className="appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-none px-6 py-3 pr-10 focus:border-brand-cyan focus:outline-none hover:bg-slate-900 cursor-pointer clip-path-polygon"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="all">Todo o Período</option>
            <option value="month">Este Mês</option>
            <option value="week">Esta Semana</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-brand-cyan">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
          <StatCard
            title="Facções Ativas"
            value={metrics.totalFaccoes}
            icon={<Users size={24} />}
            colorClass="text-brand-cyan"
            borderColor="from-brand-cyan"
          />
        </motion.div>
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
          <StatCard
            title="Cortes Enviados"
            value={metrics.cortesEnviados}
            sub={`${metrics.cortesRecebidos} Concluídos`}
            icon={<Scissors size={24} />}
            colorClass="text-indigo-400"
            borderColor="from-indigo-500"
          />
        </motion.div>
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
          <StatCard
            title="Taxa de Defeito"
            value={`${metrics.percentualGeralDefeito}%`}
            sub={`${metrics.pecasDefeito} peças`}
            icon={<AlertTriangle size={24} className={metrics.percentualGeralDefeito > 0 ? "animate-pulse-alert" : ""} />}
            colorClass={metrics.percentualGeralDefeito > 5 ? "text-red-500" : "text-yellow-500"}
            borderColor={metrics.percentualGeralDefeito > 5 ? "from-red-500" : "from-yellow-500"}
          />
        </motion.div>
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
          <StatCard
            title="Performance"
            value={`${metrics.naMeta}/${metrics.naMeta + metrics.foraMeta}`}
            sub="Dentro da Meta"
            icon={<CheckCircle size={24} />}
            colorClass="text-brand-green"
            borderColor="from-brand-green"
          />
        </motion.div>
      </motion.div>

      {/* Critical Factions Alert Section */}
      {metrics.criticalFaccoes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-950/30 border-2 border-red-500/50 rounded-lg p-6 relative overflow-hidden"
        >
          {/* Pulsing glow effect */}
          <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-400 animate-pulse" />
              <div>
                <h3 className="text-xl font-bold text-red-400 uppercase tracking-wider">
                  ⚠️ ALERTA CRÍTICO: {metrics.criticalFaccoes.length} Facção{metrics.criticalFaccoes.length > 1 ? 'ões' : ''} em Situação de Risco
                </h3>
                <p className="text-xs text-red-300/80 font-mono mt-1">
                  Defeitos ≥ {metrics.criticalThreshold.toFixed(2)}% (80% da meta de {metrics.maxDefectPercentage}%)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.criticalFaccoes.map((faccao, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-red-500/30 p-4 relative group hover:border-red-500 transition-all"
                >
                  <div className="absolute top-2 right-2">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                      CRÍTICO
                    </span>
                  </div>

                  <h4 className="text-white font-bold mb-2 pr-16">{faccao.name}</h4>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Recebido:</span>
                      <span className="text-white">{faccao.received} pcs</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Defeitos:</span>
                      <span className="text-red-400 font-bold">{faccao.defects} pcs</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800 pt-2 mt-2">
                      <span className="text-slate-400">Taxa:</span>
                      <span className="text-red-400 font-bold text-lg">{faccao.percent}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto md:h-96">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 tech-card corner-cut-diagonal p-6 flex flex-col h-80 md:h-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-cyan" /> Volume vs Qualidade
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase"><div className="w-2 h-2 bg-indigo-500 rounded-none"></div> Produção</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase"><div className="w-2 h-2 bg-brand-pink rounded-none"></div> Defeitos</span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="Pecas" fill="#6366f1" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Defeitos" fill="#ec4899" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-1 tech-card p-6 flex flex-col h-80 md:h-auto">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
            Distribuição de Defeitos
          </h3>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-slate-800 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-900/50"></div>
              </div>
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: '#f8fafc' }}
                    formatter={(value) => <span style={{ color: '#f8fafc' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
                    // NO_DATA_AVAILABLE
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};