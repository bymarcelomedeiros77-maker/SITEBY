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
        <div className="min-h-screen bg-[#050511] font-sans flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none"></div>

            {/* Ambient Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

            <div className="relative w-full max-w-[400px] z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-3xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden"
                >
                    {/* Top Lighting Effect */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <div className="text-center mb-10 flex flex-col items-center relative">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative mb-6 group"
                        >
                            <div className="absolute inset-0 bg-brand-cyan/20 rounded-full blur-xl group-hover:bg-brand-cyan/30 transition-colors duration-500"></div>
                            <img
                                src={logo}
                                alt="Logo By Marcelo Medeiros"
                                className="h-24 w-24 rounded-full relative z-10 shadow-2xl border border-white/10"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h1 className="text-xl font-bold text-white tracking-[0.2em] mb-2 font-display">
                                BY MARCELO <span className="text-brand-cyan">MEDEIROS</span>
                            </h1>
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-brand-cyan animate-pulse"></span>
                                <p className="text-brand-cyan/60 text-[10px] font-mono tracking-[0.3em] uppercase">
                                    System Intelligence
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1">Acesso / E-mail</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-cyan transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-cyan/50 focus:bg-slate-900/80 transition-all text-xs font-medium"
                                    placeholder="exemplo@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between ml-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Credencial</label>
                                <button type="button" className="text-[9px] text-slate-600 hover:text-brand-cyan transition-colors uppercase tracking-wider">Esqueceu?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-cyan transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-cyan/50 focus:bg-slate-900/80 transition-all text-xs font-mono tracking-widest"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] text-center font-mono uppercase tracking-wider">
                                {error}
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden group bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoading ? 'Processando...' : <>Iniciar Sistema <ChevronRight size={14} /></>}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.button>

                        {/* Hidden Role Switcher for Demo Purposes */}
                        <div className="pt-6 flex justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <button onClick={() => setRole('ADMIN')} className={`w-2 h-2 rounded-full ${role === 'ADMIN' ? 'bg-brand-cyan' : 'bg-slate-800'}`} title="Admin"></button>
                            <button onClick={() => setRole('USER')} className={`w-2 h-2 rounded-full ${role === 'USER' ? 'bg-brand-cyan' : 'bg-slate-800'}`} title="User"></button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800/50 flex justify-between items-center text-[9px] text-slate-600 font-mono uppercase tracking-wider">
                        <span>v. 2.5.1 (stable)</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Server Online</span>
                        </div>
                    </div>
                </motion.div>

                <p className="text-center text-[9px] text-slate-700 font-mono mt-8 uppercase tracking-[0.2em]">
                    Secure Connection // Encrypted 256-bit
                </p>
            </div>
        </div>
    );
};