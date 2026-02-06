import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Lock, Mail, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

export const Login = () => {
    const { login } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [role, setRole] = useState<'ADMIN' | 'USER'>('ADMIN');

    // Auto-fill email based on selected role (passwords removed for security)
    useEffect(() => {
        if (role === 'ADMIN') {
            setEmail('bymarcelomedeiros77@gmail.com');
            setPassword('');
        } else {
            setEmail('elflavionsi@gmail.com');
            setPassword('');
        }
    }, [role]);

    const attemptLogin = async (emailToUse: string) => {
        setIsLoading(true);
        // Remove fake delay to ensure reliable state update
        const success = await login(emailToUse, password);
        if (success) {
            navigate('/dashboard');
        } else {
            setError('ACESSO NEGADO: Identidade ou senha inválida.');
            setIsLoading(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        attemptLogin(email);
    };

    return (
        <div className="min-h-screen bg-brand-dark text-slate-300 font-sans flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Grid & Effects */}
            <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-cyan/5 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-pink/5 rounded-full blur-[100px]"></div>

            <div className="relative w-full max-w-md">

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                >
                    {/* Top Glow Accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent opacity-50"></div>

                    <div className="text-center mb-8 mt-2 flex flex-col items-center">
                        <motion.img
                            src={logo}
                            alt="Logo By Marcelo Medeiros"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="h-24 w-auto mb-4"
                        />
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white tracking-[0.2em] mb-2 neon-text uppercase font-display"
                        >
                            BY MARCELO <span className="text-brand-cyan">MEDEIROS</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-brand-cyan/60 text-[10px] font-mono tracking-[0.3em] uppercase"
                        >
                            Controle de Facções // Profissional
                        </motion.p>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="flex bg-slate-950/50 p-1.5 rounded-xl mb-8 border border-slate-800/50 backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => setRole('ADMIN')}
                            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${role === 'ADMIN'
                                ? 'bg-brand-cyan text-slate-950 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Administrador
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('USER')}
                            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${role === 'USER'
                                ? 'bg-brand-green text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Operador
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold text-slate-500 tracking-[0.15em] ml-1">Identificação Digital</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-cyan transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/20 transition-all sm:text-xs font-mono"
                                    placeholder="IDENT_ID"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold text-slate-500 tracking-[0.15em] ml-1">Chave de Encriptação</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-cyan transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/20 transition-all sm:text-xs font-mono tracking-widest"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] text-center font-mono uppercase tracking-wider">
                                ERROR_ACCESS_DENIED: {error}
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-4 px-4 rounded-xl text-[10px] font-bold shadow-[0_10px_30px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] items-center gap-2 group transition-all duration-300"
                            style={{
                                background: 'linear-gradient(45deg, #2563eb, #3b82f6)',
                                color: '#fff'
                            }}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> PROCESSANDO...</span>
                            ) : (
                                <>ESTABELECER CONEXÃO <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col items-center gap-4">
                        <div className="flex gap-4">
                            <div className="w-1 h-1 bg-brand-cyan rounded-full animate-ping"></div>
                            <div className="w-1 h-1 bg-brand-cyan rounded-full animate-ping delay-75"></div>
                            <div className="w-1 h-1 bg-brand-cyan rounded-full animate-ping delay-150"></div>
                        </div>
                        <p className="text-[8px] text-slate-600 font-mono uppercase tracking-[0.3em]">BY MARCELO MEDEIROS // 2026</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};