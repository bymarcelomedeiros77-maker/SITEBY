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
        <div className="min-h-screen bg-white font-sans flex flex-row overflow-hidden">
            {/* Left Side: Login Form */}
            <div className="w-full lg:w-[480px] flex flex-col p-8 lg:p-16 relative z-10 bg-white">
                <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                    {/* Brand/Logo */}
                    <div className="mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 mb-2"
                        >
                            <img src={logo} alt="Logo" className="h-14 w-14 rounded-xl shadow-lg border border-slate-100" />
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                                    BY MARCELO <span className="text-brand-cyan">MEDEIROS</span>
                                </h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Intelligence OS
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Bem-vindo(a)</h2>
                        <p className="text-slate-500 text-sm mb-10 font-medium">Insira suas credenciais para acessar o terminal.</p>
                    </motion.div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 ml-1">E-mail de Acesso</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-cyan transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-cyan focus:bg-white transition-all text-sm font-semibold shadow-sm"
                                    placeholder="usuario@sistema.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-slate-700">Senha</label>
                                <button type="button" className="text-xs text-brand-cyan hover:underline font-bold transition-colors">Esqueci minha senha</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-cyan transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-cyan focus:bg-white transition-all text-sm font-semibold shadow-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-xl text-xs font-bold"
                            >
                                <div className="flex items-center gap-2">
                                    <Fingerprint size={16} />
                                    <span>{error}</span>
                                </div>
                            </motion.div>
                        )}

                        <div className="flex items-center gap-2 px-1">
                            <input type="checkbox" id="remember" className="rounded border-slate-300 text-brand-cyan focus:ring-brand-cyan h-4 w-4" />
                            <label htmlFor="remember" className="text-xs text-slate-500 font-medium cursor-pointer">Lembrar senha neste dispositivo</label>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest bg-brand-cyan text-white shadow-xl shadow-brand-cyan/20 hover:shadow-brand-cyan/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 active:bg-brand-cyan/90 border-b-4 border-black/10"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Autenticando...</span>
                                </>
                            ) : (
                                <>Entrar no Sistema <ChevronRight size={18} /></>
                            )}
                        </motion.button>

                        <div className="pt-8 flex justify-center gap-10">
                            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setRole('ADMIN')}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${role === 'ADMIN' ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan scale-110' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-40 group-hover:opacity-100'}`}>
                                    <User size={20} />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${role === 'ADMIN' ? 'text-slate-900' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}>Admin</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setRole('USER')}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${role === 'USER' ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan scale-110' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-40 group-hover:opacity-100'}`}>
                                    <User size={20} />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${role === 'USER' ? 'text-slate-900' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}>Usuário</span>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="mt-8 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100 pt-8">
                    <span>v. 2.6.0 (stable)</span>
                    <div className="flex items-center gap-2 opacity-60">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Server Secured</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Hero Section with Animated Background */}
            <div className="hidden lg:flex flex-1 relative bg-slate-950 items-center justify-center overflow-hidden">
                {/* Animated Background Orbs */}
                <div className="absolute inset-0 z-0 bg-[#020617]">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            x: [0, 100, 0],
                            y: [0, 50, 0],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            x: [0, -80, 0],
                            y: [0, -60, 0],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-indigo-900/40 rounded-full blur-[120px]"
                    />
                    <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 p-20 w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="max-w-2xl"
                    >
                        {/* Decorative Tag style like Dapic */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full mb-8 text-white text-xs font-black tracking-[0.3em] uppercase"
                        >
                            <span className="w-2 h-2 rounded-full bg-brand-cyan shadow-[0_0_10px_rgba(34,211,238,1)]"></span>
                            Inovação & Estilo
                        </motion.div>

                        <h2 className="text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter mb-8 drop-shadow-2xl">
                            TECNOLOGIA EM CADA <span className="text-brand-cyan">PONTO</span> DA SUA CONFECÇÃO!
                        </h2>

                        <div className="flex flex-col gap-6">
                            <p className="text-white/70 text-lg lg:text-xl font-medium max-w-lg leading-relaxed border-l-4 border-brand-cyan pl-6">
                                Inteligência aplicada que impulsiona seus resultados e profissionaliza sua produção têxtil.
                            </p>

                            <div className="flex gap-4 mt-8 opacity-40">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-1 w-12 bg-white rounded-full"></div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom branding like the reference */}
                <div className="absolute bottom-10 right-10 text-white/30 text-[10px] font-black tracking-widest uppercase z-10">
                    Desenvolvido por <span className="text-white hover:text-brand-cyan cursor-pointer transition-colors">By Marcelo Medeiros © 2026</span>
                </div>
            </div>
        </div>
    );
};