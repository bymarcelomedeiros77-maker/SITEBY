import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

export const Login = () => {
    const { login, user } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        if (user) navigate('/modules');
    }, [user, navigate]);

    const [role, setRole] = useState<'ADMIN' | 'USER'>('ADMIN');

    useEffect(() => {
        if (role === 'ADMIN') {
            setEmail('bymarcelomedeiros77@gmail.com');
            setPassword('');
        } else {
            setEmail('elflavionsi@gmail.com');
            setPassword('');
        }
    }, [role]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const success = await login(email, password);
        if (success) {
            navigate('/modules');
        } else {
            setError('E-mail ou senha inválidos. Verifique e tente novamente.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden font-sans" style={{ background: '#ffffff' }}>

            {/* ── Painel esquerdo (formulário) ────────────────────────────── */}
            <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col justify-between bg-white px-10 py-10 relative z-10 shadow-2xl">

                {/* Logo */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="flex items-center gap-3 mb-10">
                        <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                        <div>
                            <div className="text-[13px] font-black text-slate-900 tracking-widest uppercase">BY MARCELO</div>
                            <div className="text-[11px] font-bold text-blue-500 tracking-[0.15em] uppercase">Medeiros</div>
                            <div className="text-[8px] text-slate-400 tracking-widest uppercase">Intelligence OS</div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 mb-1">Bem-vindo(a)</h1>
                    <p className="text-sm text-blue-500 mb-8">Insira suas credenciais para acessar o terminal.</p>

                    {/* Role selector */}
                    <div className="flex gap-2 mb-6 p-1 rounded-lg bg-slate-100 border border-slate-200">
                        {(['ADMIN', 'USER'] as const).map(r => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${role === r
                                    ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <User size={11} />
                                {r === 'ADMIN' ? 'Admin' : 'Usuário'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">E-mail de Acesso</label>
                            <div className="relative group">
                                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-9 pr-10 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 rounded-lg outline-none transition-all bg-white border border-slate-200 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                                    placeholder="usuario@sistema.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Senha</label>
                                <button type="button" className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold transition-colors">
                                    Esqueci minha senha
                                </button>
                            </div>
                            <div className="relative group">
                                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-9 pr-10 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 rounded-lg outline-none transition-all bg-white border border-slate-200 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-500 cursor-pointer"
                            />
                            <label htmlFor="rememberMe" className="text-[11px] text-slate-500 cursor-pointer select-none">
                                Lembrar senha neste dispositivo
                            </label>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-lg text-sm font-black uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                            style={{
                                background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
                                boxShadow: '0 4px 16px rgba(37,99,235,0.35)'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Autenticando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Entrar no Sistema</span>
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Quick access role icons */}
                    <div className="flex items-center gap-6 mt-8 pt-6 border-t border-slate-100">
                        {(['ADMIN', 'USER'] as const).map(r => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={`flex flex-col items-center gap-1 transition-all group ${role === r ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                            >
                                <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${role === r
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-200 bg-slate-50 group-hover:border-slate-300'
                                    }`}>
                                    <User size={18} className={role === r ? 'text-blue-500' : 'text-slate-400'} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                    {r}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-6">
                    <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">v.2.6.0 STABLE</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Server Secured</span>
                    </div>
                </div>
            </div>

            {/* ── Painel direito (hero) ────────────────────────────────────── */}
            <div
                className="hidden lg:flex flex-1 flex-col justify-center px-20 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(145deg, #0a0e2a 0%, #0d1033 40%, #091028 70%, #060818 100%)',
                }}
            >
                {/* Ambient orbs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 65%)', transform: 'translate(-50%, -50%)' }}
                    />
                    <motion.div
                        animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 65%)' }}
                    />
                    {/* Grid lines */}
                    <div
                        className="absolute inset-0 opacity-[0.05]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
                            backgroundSize: '60px 60px'
                        }}
                    />
                </div>

                {/* Hero content */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="relative z-10"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.3em]">Inovação & Estilo</span>
                    </div>

                    <h1 className="font-black leading-[0.9] tracking-tight text-white mb-8"
                        style={{ fontSize: 'clamp(3rem, 5vw, 5.5rem)' }}>
                        TECNOLOGIA EM<br />
                        CADA <span className="text-blue-400">PONTO</span> DA<br />
                        SUA CONFECÇÃO!
                    </h1>

                    {/* Divider bar */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-0.5 bg-blue-500 rounded-full" />
                        <div className="w-6 h-0.5 bg-blue-500/40 rounded-full" />
                        <div className="w-3 h-0.5 bg-blue-500/20 rounded-full" />
                    </div>

                    <p className="text-slate-400 text-base font-medium leading-relaxed max-w-lg"
                        style={{ borderLeft: '3px solid rgba(37,99,235,0.6)', paddingLeft: '1rem' }}>
                        Inteligência aplicada que impulsiona seus resultados e profissionaliza sua produção têxtil.
                    </p>
                </motion.div>

                {/* Bottom footer */}
                <div className="absolute bottom-8 left-20 right-20 flex items-center justify-between">
                    <span className="text-[9px] text-slate-700 font-mono tracking-widest uppercase">
                        Desenvolvido por <span className="text-slate-500">By Marcelo Medeiros</span> © 2026
                    </span>
                </div>
            </div>
        </div>
    );
};