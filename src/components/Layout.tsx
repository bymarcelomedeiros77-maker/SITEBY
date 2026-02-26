import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { CorteStatus } from '../types';
import {
  Scissors,
  Settings,
  LogOut,
  Menu,
  Package,
  FileText,
  Users,
  BarChart2,
  Bell,
  UserCog,
  DollarSign,
  Truck,
  ChevronRight,
  X,
  CheckSquare,
  Sparkles,
  ChevronLeft,
  Activity,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';
import { UserProfileModal } from './UserProfileModal';
import { CommandPalette } from './CommandPalette';

// Cor por módulo para ícones e indicator
const MODULE_COLORS: Record<string, { text: string; bg: string; glow: string; border: string }> = {
  'cutting-orders': { text: 'text-violet-400', bg: 'bg-violet-500/15', glow: 'shadow-violet-500/40', border: 'border-violet-500/30' },
  'cortes': { text: 'text-amber-400', bg: 'bg-amber-500/15', glow: 'shadow-amber-500/40', border: 'border-amber-500/30' },
  'stock': { text: 'text-cyan-400', bg: 'bg-cyan-500/15', glow: 'shadow-cyan-500/40', border: 'border-cyan-500/30' },
  'clients': { text: 'text-emerald-400', bg: 'bg-emerald-500/15', glow: 'shadow-emerald-500/40', border: 'border-emerald-500/30' },
  'faccoes': { text: 'text-purple-400', bg: 'bg-purple-500/15', glow: 'shadow-purple-500/40', border: 'border-purple-500/30' },
  'tech-packs': { text: 'text-teal-400', bg: 'bg-teal-500/15', glow: 'shadow-teal-500/40', border: 'border-teal-500/30' },
  'financeiro': { text: 'text-green-400', bg: 'bg-green-500/15', glow: 'shadow-green-500/40', border: 'border-green-500/30' },
  'fornecedores': { text: 'text-orange-400', bg: 'bg-orange-500/15', glow: 'shadow-orange-500/40', border: 'border-orange-500/30' },
  'settings': { text: 'text-slate-400', bg: 'bg-slate-500/15', glow: 'shadow-slate-500/40', border: 'border-slate-500/30' },
};

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout, cortes, clientes, pedidos, comprasCampanha } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  // Global Shortcut Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  React.useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  // Módulo atual para o header breadcrumb
  const currentModule = useMemo(() => {
    const allModules = [
      { id: 'cutting-orders', name: 'Ordem de Corte', path: '/cutting-orders' },
      { id: 'cortes', name: 'Controle de Corte', path: '/cortes' },
      { id: 'stock', name: 'Controle de Estoque', path: '/stock' },
      { id: 'clients', name: 'Gestão de Clientes', path: '/clients' },
      { id: 'faccoes', name: 'Rede de Facções', path: '/faccoes' },
      { id: 'tech-packs', name: 'Fichas Técnicas', path: '/tech-packs' },
      { id: 'financeiro', name: 'Financeiro', path: '/financeiro' },
      { id: 'fornecedores', name: 'Fornecedores', path: '/fornecedores' },
      { id: 'settings', name: 'Configurações', path: '/settings' },
      { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    ];
    return allModules.find(m => {
      if (m.path === '/dashboard') return location.pathname === '/dashboard';
      return location.pathname.startsWith(m.path);
    });
  }, [location.pathname]);

  const modules = useMemo(() => [
    {
      id: "cutting-orders",
      name: "Ordem de Corte",
      icon: <FileText size={18} />,
      path: "/cutting-orders",
    },
    {
      id: "cortes",
      name: "Controle de Corte",
      icon: <Scissors size={18} />,
      path: "/cortes",
      badge: cortes.filter(c => {
        if (c.status === CorteStatus.RECEBIDO || !c.dataPrevistaRecebimento) return false;
        return new Date(c.dataPrevistaRecebimento) < new Date();
      }).length
    },
    {
      id: "stock",
      name: "Controle de Estoque",
      icon: <Package size={18} />,
      path: "/stock",
    },
    {
      id: "clients",
      name: "Gestão de Clientes",
      icon: <Users size={18} />,
      path: "/clients",
      badge: clientes.filter(c => {
        const staleLimit = Date.now() - 90 * 24 * 60 * 60 * 1000;
        const ultimaCompra = [...pedidos.filter(p => p.clienteId === c.id), ...comprasCampanha.filter(cp => cp.clienteId === c.id)];
        const datas = ultimaCompra.map(x => new Date((x as any).dataPedido || (x as any).dataCompra).getTime()).filter(Boolean);
        return datas.length === 0 || Math.max(...datas) < staleLimit;
      }).length
    },
    {
      id: "faccoes",
      name: "Rede de Facções",
      icon: <UserCog size={18} />,
      path: "/faccoes",
    },
    {
      id: "tech-packs",
      name: "Fichas Técnicas",
      icon: <CheckSquare size={18} />,
      path: "/tech-packs",
    },
    {
      id: "financeiro",
      name: "Financeiro",
      icon: <DollarSign size={18} />,
      path: "/financeiro",
    },
    {
      id: "fornecedores",
      name: "Fornecedores",
      icon: <Truck size={18} />,
      path: "/fornecedores",
    },
    {
      id: "settings",
      name: "Configurações",
      icon: <Settings size={18} />,
      path: "/settings",
    }
  ], [cortes, clientes, pedidos, comprasCampanha]);

  const SidebarLink = ({ module }: { module: typeof modules[0] }) => {
    const active = isActive(module.path);
    const colors = MODULE_COLORS[module.id] || MODULE_COLORS['settings'];

    return (
      <Link
        to={module.path}
        className={`
          group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
          ${active
            ? `${colors.bg} ${colors.border} border`
            : 'border border-transparent text-slate-500 hover:text-slate-200 hover:bg-white/5'}
        `}
      >
        {/* Active left indicator */}
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${colors.text.replace('text-', 'bg-')} shadow-lg`}
            style={{ boxShadow: `0 0 8px currentColor` }}
          />
        )}

        {/* Icon box */}
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200
          ${active ? `${colors.bg} ${colors.text} shadow-lg ${colors.glow}` : 'bg-slate-800/80 text-slate-500 group-hover:bg-slate-700/80 group-hover:text-slate-300'}
        `}>
          {module.icon}
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 flex-1 overflow-hidden"
            >
              <span className={`text-xs font-semibold tracking-wide whitespace-nowrap truncate ${active ? colors.text : ''}`}>
                {module.name}
              </span>
              {module.badge != null && module.badge > 0 && (
                <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/30">
                  {module.badge > 99 ? '99+' : module.badge}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed badge */}
        {isCollapsed && module.badge != null && module.badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">
            {module.badge > 9 ? '9+' : module.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex text-slate-200 font-sans selection:bg-violet-500/30">

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-cyan-600/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-indigo-600/6 rounded-full blur-3xl" />
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col relative z-50 flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(10,10,18,0.99) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo / Brand */}
        <div className={`flex items-center gap-3 border-b border-white/[0.06] flex-shrink-0 ${isCollapsed ? 'p-4 justify-center' : 'p-5'}`}>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-violet-500/30 blur-xl rounded-full" />
            <img src={logo} alt="Logo" className="w-9 h-9 rounded-xl relative z-10 ring-1 ring-white/10 object-cover" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <h1 className="font-black text-[13px] tracking-[0.15em] text-white leading-none">BY MARCELO</h1>
                <div className="flex items-center gap-1 mt-1">
                  <Zap size={8} className="text-violet-400" />
                  <p className="text-[9px] text-violet-400/70 font-mono tracking-[0.2em] uppercase">Management</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: 'none' }}>
          {/* Section label */}
          {!isCollapsed && (
            <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.25em] px-3 pb-2">Módulos</p>
          )}
          {modules.filter(m => m.id !== 'settings').map((module) => (
            <SidebarLink key={module.id} module={module} />
          ))}

          {/* Divider + Settings */}
          <div className="pt-3 mt-3 border-t border-white/[0.05]">
            {!isCollapsed && (
              <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.25em] px-3 pb-2">Sistema</p>
            )}
            {modules.filter(m => m.id === 'settings').map((module) => (
              <SidebarLink key={module.id} module={module} />
            ))}
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-white/[0.05] space-y-1.5 flex-shrink-0">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-black text-white bg-gradient-to-br from-violet-600 to-indigo-700 ring-1 ring-white/10">
              {user?.name?.substring(0, 2)?.toUpperCase() || 'AD'}
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrador'}</p>
                <p className="text-[10px] text-slate-600 truncate font-mono">{user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</p>
              </motion.div>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-2.5 p-2.5 rounded-xl text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-semibold uppercase tracking-wider
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut size={14} />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-[72px] w-6 h-6 bg-slate-900 border border-slate-700/80 rounded-full flex items-center justify-center text-slate-400 hover:text-violet-400 hover:border-violet-500/50 shadow-lg z-50 transition-all duration-200"
        >
          <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={12} />
          </motion.div>
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">

        {/* Top Header */}
        <header
          className="h-14 flex-shrink-0 flex items-center justify-between px-6 z-40"
          style={{
            background: 'rgba(10,10,18,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Left: Mobile menu + Breadcrumb */}
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={22} />
            </button>

            {/* Breadcrumb */}
            {currentModule && (
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-slate-600 text-xs">Sistema</span>
                <ChevronRight size={12} className="text-slate-700" />
                <span className={`text-xs font-semibold ${MODULE_COLORS[currentModule.id]?.text || 'text-slate-300'}`}>
                  {currentModule.name}
                </span>
              </div>
            )}
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-3">
            {/* DB Status */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Online</span>
            </div>

            {/* Notif bell */}
            <button className="relative p-2 text-slate-500 hover:text-slate-200 transition-colors rounded-lg hover:bg-white/5">
              <Bell size={17} />
              {cortes.filter(c => !c.status || c.status === CorteStatus.ENVIADO).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
              )}
            </button>

            {/* User avatar (desktop) */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-xs font-black text-white bg-gradient-to-br from-violet-600 to-indigo-700 ring-1 ring-white/10 hover:ring-violet-400/50 transition-all"
            >
              {user?.name?.substring(0, 2)?.toUpperCase() || 'AD'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="absolute top-0 left-0 bottom-0 w-72 flex flex-col"
              style={{
                background: 'linear-gradient(180deg, rgba(15,15,25,0.99) 0%, rgba(10,10,18,1) 100%)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg ring-1 ring-white/10 object-cover" />
                  <div>
                    <h1 className="font-black text-xs tracking-[0.15em] text-white">BY MARCELO</h1>
                    <p className="text-[9px] text-violet-400/70 font-mono tracking-widest uppercase">Management</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {modules.map(module => {
                  const active = isActive(module.path);
                  const colors = MODULE_COLORS[module.id] || MODULE_COLORS['settings'];
                  return (
                    <Link
                      key={module.id}
                      to={module.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl transition-all border
                        ${active ? `${colors.bg} ${colors.border}` : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-white/5'}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? `${colors.bg} ${colors.text}` : 'bg-slate-800 text-slate-500'}`}>
                        {module.icon}
                      </div>
                      <span className={`text-xs font-semibold tracking-wide ${active ? colors.text : ''}`}>{module.name}</span>
                      {module.badge != null && module.badge > 0 && (
                        <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                          {module.badge > 99 ? '99+' : module.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-white/[0.05]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all font-semibold text-xs uppercase tracking-wider"
                >
                  <LogOut size={16} />
                  Sair do Sistema
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};