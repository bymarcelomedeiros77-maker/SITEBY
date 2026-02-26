import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Users, ShoppingCart, Layers, ClipboardList,
    RotateCcw, Sliders, BarChart2, Plus, Search, Filter, History, Boxes
} from 'lucide-react';
import { StockEstoqueInicial } from './stock-tabs/StockEstoqueInicial';
// import { StockEntradas } from './stock-tabs/StockEntradas'; // Removed
import { StockPedidos } from './stock-tabs/StockPedidos';
import { StockProducao } from './stock-tabs/StockProducao';
import { StockDevolucoes } from './stock-tabs/StockDevolucoes';
import { StockAjustes } from './stock-tabs/StockAjustes';
import StockDashboard from './stock-tabs/StockDashboard';
import { StockMovimentacoes } from './stock-tabs/StockMovimentacoes';
import { StockList } from './stock-tabs/StockList';
import { StockCadastros } from './stock-tabs/StockCadastros';

export const StockControl = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' || 'J';
    const [activeTab, setActiveTab] = useState(tabParam);

    useEffect(() => {
        setSearchParams({ tab: activeTab });
    }, [activeTab, setSearchParams]);

    // Sync state if URL changes (e.g. back button)
    useEffect(() => {
        const currentTab = searchParams.get('tab') as 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' || 'J';
        setActiveTab(currentTab);
    }, [searchParams]);

    const tabs = [
        { id: 'H', label: 'Painel Geral', icon: <BarChart2 size={18} /> },
        { id: 'I', label: 'Histórico', icon: <History size={18} /> },
        { id: 'J', label: 'Estoque Detalhado', icon: <Boxes size={18} /> },
        { id: 'C', label: 'Cadastros (Produtos)', icon: <Layers size={18} /> },
        { id: 'B', label: 'Estoque Inicial', icon: <Package size={18} /> },
        { id: 'D', label: 'Pedidos', icon: <ShoppingCart size={18} /> },
        { id: 'E', label: 'Produção', icon: <ClipboardList size={18} /> },
        { id: 'F', label: 'Devoluções', icon: <RotateCcw size={18} /> },
        { id: 'G', label: 'Ajustes', icon: <Sliders size={18} /> },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider">Controle de Estoque</h1>
                    <p className="text-brand-cyan font-mono text-xs mt-1 tracking-widest flex items-center gap-2">
                        <Package size={12} className="animate-pulse" /> GESTÃO INTEGRADA DE SKUS
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
              flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider
              transition-all duration-300 min-w-max
              ${activeTab === tab.id
                                ? 'bg-brand-cyan text-slate-950 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                : 'bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-800'}
            `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden"
                    >
                        {/* Tab Content Render */}
                        {activeTab === 'H' && <StockDashboard />}
                        {activeTab === 'J' && <StockList />}
                        {activeTab === 'I' && <StockMovimentacoes />}
                        {activeTab === 'B' && <StockEstoqueInicial />}
                        {activeTab === 'C' && <StockCadastros />}
                        {activeTab === 'D' && <StockPedidos />}
                        {activeTab === 'E' && <StockProducao />}
                        {activeTab === 'F' && <StockDevolucoes />}
                        {activeTab === 'G' && <StockAjustes />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
