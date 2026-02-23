import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Lock, Mail, ChevronRight, User } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

export const Login = () => {
    const { login, user } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/modules');
        }
    }, [user, navigate]);

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
            navigate('/modules');
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
        <div className="min-h-screen bg-[#02020a] font-sans flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large animated blurred orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -30, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]"
                />
                <div className="absolute inset-0 bg-grid opacity-[0.05]"></div>

                {/* Floating Particles (Pseudo-elements or divs) */}
                <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.1, y: Math.random() * 1000, x: Math.random() * 1000 }}
                            animate={{
                                y: [null, Math.random() * -500],
                                opacity: [0.1, 0.3, 0.1]
                            }}
                            transition={{ duration: 10 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
                            className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                        />
                    ))}
                </div>
            </div>

            <div className="relative w-full max-w-[420px] z-10">
                {/* Card Glow Background */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative group bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
                >
                    {/* Border Lighting Effect */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

                    {/* Scanning Line Effect */}
                    <motion.div
                        initial={{ top: "-100%" }}
                        animate={{ top: "200%" }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-blue-400/5 to-transparent z-0 pointer-events-none"
                    />

                    <div className="text-center mb-10 flex flex-col items-center relative z-10">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="relative mb-8"
                        >
                            <div className="absolute -inset-4 bg-brand-cyan/20 rounded-full blur-2xl animate-pulse"></div>
                            <img
                                src={logo}
                                alt="Logo By Marcelo Medeiros"
                                className="h-28 w-28 rounded-full relative z-10 shadow-[0_0_30px_rgba(34,211,238,0.4)] border-2 border-white/20 p-1 bg-slate-900"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className="text-2xl font-black text-white tracking-[0.3em] mb-3 font-display">
                                BY MARCELO <span className="text-brand-cyan drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">MEDEIROS</span>
                            </h1>
                            <div className="flex items-center justify-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"></span>
                                <p className="text-brand-cyan/80 text-[11px] font-mono tracking-[0.4em] uppercase font-bold">
                                    Intelligence OS
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] ml-2">Protocolo de Acesso</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-brand-cyan transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-950/40 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-cyan/50 focus:bg-slate-900/60 transition-all text-xs font-semibold tracking-wide ring-offset-slate-900 focus:ring-2 focus:ring-brand-cyan/10"
                                    placeholder="USUÁRIO@SISTEMA.COM"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em]">Chave de Segurança</label>
                                <button type="button" className="text-[9px] text-slate-600 hover:text-brand-cyan transition-colors uppercase tracking-widest font-bold">Recuperar</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-brand-cyan transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-950/40 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-cyan/50 focus:bg-slate-900/60 transition-all text-xs font-mono tracking-[0.3em] ring-offset-slate-900 focus:ring-2 focus:ring-brand-cyan/10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/5 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] text-center font-bold uppercase tracking-widest leading-relaxed"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Fingerprint size={14} />
                                    <span>{error}</span>
                                </div>
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(59, 130, 246, 0.4)" }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Autenticando...</span>
                                    </>
                                ) : (
                                    <>Acessar Terminal <ChevronRight size={16} /></>
                                )}
                            </span>

                            {/* Button Shine effect */}
                            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] transition-all duration-1000 group-hover:left-[100%]"></div>
                        </motion.button>

                        <div className="pt-8 flex justify-center gap-4 group/roles">
                            <button
                                type="button"
                                onClick={() => setRole('ADMIN')}
                                className={`flex flex-col items-center gap-2 transition-all duration-500 ${role === 'ADMIN' ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-100 grayscale'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${role === 'ADMIN' ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                    <User size={14} />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('USER')}
                                className={`flex flex-col items-center gap-2 transition-all duration-500 ${role === 'USER' ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-100 grayscale'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${role === 'USER' ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                    <User size={14} />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest">Usuário</span>
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em]">
                        <div className="flex flex-col gap-1">
                            <span className="text-slate-600">Revision</span>
                            <span className="text-white/40">2.5.1-STABLE</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-950/50 px-3 py-1.5 rounded-full border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                            <span className="text-emerald-500 font-bold">Terminal Online</span>
                        </div>
                    </div>
                </motion.div>

                <div className="mt-10 flex flex-col items-center gap-4">
                    <p className="text-[9px] text-slate-700 font-mono uppercase tracking-[0.4em] text-center">
                        <span className="opacity-40">System Core secured by</span> <span className="text-brand-cyan/40">256-BIT QUANTUM ENCRYPTION</span>
                    </p>
                    <div className="flex gap-4 opacity-20">
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-slate-800"></div>
                        <Fingerprint size={12} className="text-slate-800" />
                        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-slate-800"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};