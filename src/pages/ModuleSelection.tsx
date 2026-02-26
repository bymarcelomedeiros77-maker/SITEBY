import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import {
    Package,
    Users,
    Scissors,
    FileText,
    UserCircle,
    LogOut,
    ChevronRight,
    LayoutGrid,
    ClipboardList,
    Trophy,
    Target,
    DollarSign,
    Truck
} from 'lucide-react';
import logo from '../assets/logo.png';

export const ModuleSelection = () => {
    const { user, logout } = useApp();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const modules = [
        {
            id: 'cortes',
            title: 'Controle de Cortes',
            subtitle: 'Produção & Processos',
            description: 'Gestão completa do fluxo de corte e envio para facções.',
            icon: <Scissors size={40} />,
            path: '/cortes',
            color: 'from-amber-500 to-orange-600',
            bgGlow: 'bg-orange-500/20',
            iconColor: 'text-orange-400'
        },
        {
            id: 'faccoes',
            title: 'Rede de Facções',
            subtitle: 'Parceiros Externos',
            description: 'Monitoramento detalhado de oficinas e facções parceiras.',
            icon: <Users size={40} />,
            path: '/faccoes',
            color: 'from-emerald-500 to-green-600',
            bgGlow: 'bg-emerald-500/20',
            iconColor: 'text-emerald-400'
        },
        {
            id: 'tech-packs',
            title: 'Fichas Técnicas',
            subtitle: 'Desenvolvimento',
            description: 'Especificações técnicas e modelagem de produtos.',
            icon: <FileText size={40} />,
            path: '/tech-packs',
            color: 'from-purple-500 to-fuchsia-600',
            bgGlow: 'bg-purple-500/20',
            iconColor: 'text-purple-400'
        },
        {
            id: 'clients',
            title: 'Gestão de Clientes',
            subtitle: 'CRM & Vendas',
            description: 'Histórico de pedidos e relacionamento com clientes.',
            icon: <UserCircle size={40} />,
            path: '/clients',
            color: 'from-rose-500 to-red-600',
            bgGlow: 'bg-rose-500/20',
            iconColor: 'text-rose-400'
        },
        {
            id: 'stock',
            title: 'Controle de Estoque',
            subtitle: 'Logística & Insumos',
            description: 'Gestão de inventário, compras e movimentações.',
            icon: <Package size={40} />,
            path: '/stock',
            color: 'from-blue-500 to-cyan-600',
            bgGlow: 'bg-blue-500/20',
            iconColor: 'text-blue-400'
        },

        {
            id: 'cutting-orders',
            title: 'Ordem de Cortes',
            subtitle: 'Planejamento',
            description: 'Central de pedidos de corte baseados em necessidade de estoque.',
            icon: <Scissors size={40} />,
            path: '/cutting-orders',
            color: 'from-amber-600 to-orange-700',
            bgGlow: 'bg-orange-600/20',
            iconColor: 'text-orange-500'
        },
        {
            id: 'financeiro',
            title: 'Financeiro',
            subtitle: 'Fluxo de Caixa',
            description: 'Controle de entradas, saídas e movimentações financeiras.',
            icon: <DollarSign size={40} />,
            path: '/financeiro',
            color: 'from-emerald-600 to-teal-700',
            bgGlow: 'bg-emerald-600/20',
            iconColor: 'text-emerald-500'
        },
        {
            id: 'fornecedores',
            title: 'Fornecedores',
            subtitle: 'Insumos',
            description: 'Gestão de fornecedores de tecidos, aviamentos e serviços.',
            icon: <Truck size={40} />,
            path: '/fornecedores',
            color: 'from-orange-600 to-amber-700',
            bgGlow: 'bg-orange-600/20',
            iconColor: 'text-orange-500'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const cardVariants = {
        hidden: { y: 50, opacity: 0 },
        show: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 20
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#050511] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-200">

            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
            </div>

            {/* Header Section */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-center mb-16 relative z-10 max-w-2xl mx-auto"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-4 mb-6 relative group cursor-default"
                >
                    <div className="absolute inset-0 bg-brand-cyan/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img src={logo} alt="Logo" className="w-16 h-16 rounded-full relative z-10 shadow-lg border border-white/10" />
                    <div className="text-left relative z-10">
                        <h1 className="text-2xl font-bold text-white tracking-[0.2em] font-display">
                            BY MARCELO <span className="text-brand-cyan">MEDEIROS</span>
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] text-slate-400 font-mono tracking-[0.3em] uppercase">
                                Bem-vindo, {user?.name?.split(' ')[0] || 'Gestor'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <p className="text-slate-400 text-lg font-light tracking-wide leading-relaxed">
                    Selecione o módulo operacional para iniciar suas atividades.
                </p>
            </motion.div>

            {/* Modules Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full relative z-10 px-4"
            >
                {modules.map((module) => (
                    <motion.div
                        key={module.id}
                        variants={cardVariants}
                        whileHover={{ y: -10, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(module.path)}
                        className="group relative overflow-hidden rounded-3xl p-1 cursor-pointer transition-all duration-300"
                    >
                        {/* Border Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}></div>

                        {/* Card Content */}
                        <div className="relative h-full bg-[#0a0a1a] rounded-[22px] p-8 flex flex-col justify-between border border-white/5 hover:border-transparent transition-colors duration-300 backdrop-blur-sm">

                            {/* Hover Glow Inside */}
                            <div className={`absolute inset-0 ${module.bgGlow} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[22px]`}></div>

                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`
                                        p-4 rounded-2xl bg-slate-900/50 border border-white/5 
                                        ${module.iconColor} group-hover:text-white group-hover:scale-110 transition-all duration-300
                                        shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)]
                                    `}>
                                        {module.icon}
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0 bg-gradient-to-br ${module.color}`}>
                                        <ChevronRight className="text-white" size={16} />
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <h3 className="text-xl font-bold text-white font-display tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                                        {module.title}
                                    </h3>
                                    <p className={`text-xs font-bold uppercase tracking-widest ${module.iconColor} opacity-70`}>
                                        {module.subtitle}
                                    </p>
                                </div>

                                <p className="text-sm text-slate-500 leading-relaxed font-light group-hover:text-slate-400 transition-colors">
                                    {module.description}
                                </p>
                            </div>

                            {/* Bottom Decor */}
                            <div className={`w-full h-1 rounded-full mt-6 bg-gradient-to-r ${module.color} opacity-20 group-hover:opacity-100 transform scale-x-0 group-hover:scale-x-100 transition-all duration-500 origin-left`}></div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Footer / Logout */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-16 flex items-center justify-center relative z-10"
            >
                <button
                    onClick={handleLogout}
                    className="group flex items-center gap-3 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                    <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Encerrar Sessão
                </button>
            </motion.div>

        </div>
    );
};
