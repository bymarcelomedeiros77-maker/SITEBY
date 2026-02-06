import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Scissors,
  Users,
  Layers,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Activity,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { label: 'Painel', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Cadastro de Facções', path: '/faccoes', icon: <Users size={20} /> },
    { label: 'Atividades', path: '/cortes', icon: <Scissors size={20} /> },
    { label: 'Metas', path: '/performance', icon: <BarChart3 size={20} /> },
  ];

  if (user?.role === UserRole.ADMIN) {
    menuItems.push({ label: 'Configurações', path: '/settings', icon: <Settings size={20} /> });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden font-sans text-slate-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/90 border-r border-slate-800 backdrop-blur-xl z-20 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 relative overflow-hidden group">
          {/* Glow effect */}
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-cyan shadow-[0_0_10px_#3b82f6]"></div>
          <div className="bg-slate-800 p-1.5 rounded border border-slate-700 group-hover:border-brand-cyan transition-colors">
            <img src={logo} alt="Logo" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wider text-white">BY MARCELO <span className="text-brand-cyan block text-sm">MEDEIROS</span></h1>
            <p className="text-[10px] text-brand-cyan uppercase tracking-[0.2em] mt-1">SISTEMA ATIVO</p>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-widest">Módulos Principais</p>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 border-l-2 ${isActive(item.path)
                  ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                {item.icon}
                <span className="font-medium tracking-wide">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img
                src={user?.avatar || "https://picsum.photos/100/100"}
                alt="User"
                className="w-10 h-10 rounded border border-slate-600 grayscale hover:grayscale-0 transition-all"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-brand-green rounded-full border-2 border-slate-900"></div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-200 truncate uppercase">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate font-mono">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded border border-transparent hover:border-red-500/30 transition-colors uppercase text-xs font-bold tracking-wider"
          >
            <LogOut size={16} />
            <span>Desconectar</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 z-50 flex items-center justify-between p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-white tracking-wider text-xs">BY MARCELO <span className="text-brand-cyan">MEDEIROS</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/95 z-40 pt-20 px-4 space-y-2 backdrop-blur-xl">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded border-l-2 ${isActive(item.path) ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan' : 'border-transparent text-slate-400'
                }`}
            >
              {item.icon}
              <span className="font-medium uppercase tracking-wide">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 w-full mt-8 border-t border-slate-800 pt-4 uppercase tracking-wider"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:p-8 p-4 pt-20 md:pt-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-7xl mx-auto min-h-[calc(100vh-4rem)] relative z-10"
          >
            {/* Top Bar Info (Optional aesthetic) */}
            <div className="hidden md:flex justify-between items-center mb-6 text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2"><Activity size={12} className="text-brand-green" /> SISTEMA SINCRONIZADO</span>
              <span>{new Date().toLocaleDateString()} // TERMINAL_01</span>
            </div>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};