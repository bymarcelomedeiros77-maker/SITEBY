import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Users, Scissors, LayoutDashboard, DollarSign, Truck, Package, X, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
    const navigate = useNavigate();
    const { clientes, cortes, modules } = useApp() as any;
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filtered results
    const results = useMemo(() => {
        if (!query.trim()) {
            return [
                { id: 'nav-dash', type: 'page', title: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
                { id: 'nav-cortes', type: 'page', title: 'Cortes & Produção', icon: <Scissors size={18} />, path: '/cortes' },
                { id: 'nav-clients', type: 'page', title: 'Clientes & CRM', icon: <Users size={18} />, path: '/clients' },
            ];
        }

        const normalizedQuery = query.toLowerCase();

        // 1. Navigation items
        const navResults = [
            { id: 'nav-dash', type: 'page', title: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
            { id: 'nav-cortes', type: 'page', title: 'Cortes & Produção', icon: <Scissors size={18} />, path: '/cortes' },
            { id: 'nav-clients', type: 'page', title: 'Clientes & CRM', icon: <Users size={18} />, path: '/clients' },
            { id: 'nav-fin', type: 'page', title: 'Financeiro', icon: <DollarSign size={18} />, path: '/financeiro' },
            { id: 'nav-forn', type: 'page', title: 'Fornecedores', icon: <Truck size={18} />, path: '/fornecedores' },
            { id: 'nav-orders', type: 'page', title: 'Central de Cortes', icon: <Package size={18} />, path: '/cutting-orders' },
        ].filter(n => n.title.toLowerCase().includes(normalizedQuery));

        // 2. Clients
        const clientResults = (clientes || [])
            .filter((c: any) => c.nome.toLowerCase().includes(normalizedQuery) || c.contato.includes(normalizedQuery))
            .slice(0, 5)
            .map((c: any) => ({
                id: `cli-${c.id}`,
                type: 'client',
                title: c.nome,
                subtitle: c.cidade,
                icon: <Users size={18} className="text-emerald-400" />,
                path: `/clients?id=${c.id}`
            }));

        // 3. Cortes
        const corteResults = (cortes || [])
            .filter((c: any) => c.referencia.toLowerCase().includes(normalizedQuery))
            .slice(0, 5)
            .map((c: any) => ({
                id: `corte-${c.id}`,
                type: 'corte',
                title: c.referencia,
                subtitle: `Lote: ${c.id.slice(0, 8)}`,
                icon: <Scissors size={18} className="text-amber-400" />,
                path: `/cortes?id=${c.id}`
            }));

        return [...navResults, ...clientResults, ...corteResults];
    }, [query, clientes, cortes]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const handleSelect = (item: any) => {
        navigate(item.path);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-6 py-4 border-b border-slate-800 bg-slate-950/20">
                            <Search className="text-slate-500 mr-4" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Busque por páginas, clientes ou referências..."
                                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-slate-600"
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-lg border border-slate-700">
                                <span className="text-[10px] font-mono font-bold text-slate-400">ESC</span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${index === selectedIndex ? 'bg-brand-cyan/10 border border-brand-cyan/20' : 'bg-transparent border border-transparent hover:bg-slate-800/50'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl ${index === selectedIndex ? 'bg-brand-cyan/20 text-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-slate-800 text-slate-400'}`}>
                                                    {item.icon}
                                                </div>
                                                <div className="text-left">
                                                    <div className={`text-sm font-bold ${index === selectedIndex ? 'text-white' : 'text-slate-300'}`}>
                                                        {item.title}
                                                    </div>
                                                    {item.subtitle && (
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                                                            {item.subtitle}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {index === selectedIndex && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-widest">Abrir</span>
                                                    <ChevronRight size={14} className="text-brand-cyan" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
                                    <div className="p-4 bg-slate-800/50 rounded-full border border-slate-800">
                                        <Search size={32} />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum resultado para "{query}"</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Tips */}
                        <div className="px-6 py-3 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="p-1 px-1.5 bg-slate-800 rounded border border-slate-700 text-[9px] font-mono text-slate-400">↑↓</span>
                                    <span className="text-[9px] text-slate-500 uppercase font-bold">Navegar</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="p-1 px-1.5 bg-slate-800 rounded border border-slate-700 text-[9px] font-mono text-slate-400">ENTER</span>
                                    <span className="text-[9px] text-slate-500 uppercase font-bold">Selecionar</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Command size={12} className="text-slate-600" />
                                <span className="text-[9px] text-slate-600 uppercase font-bold">Webpic Enterprise</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
