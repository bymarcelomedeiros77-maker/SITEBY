import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, User } from '../types';
import { Save, Shield, Trash2, Plus, Users, UserCog, Check, X, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AVATAR_PRESETS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Calista",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Dante",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1",
];

export const Settings = () => {
    const { user, defectTypes, metas, addDefectType, updateMeta, allUsers, saveUser, deleteUser } = useApp();
    const navigate = useNavigate();
    const [newDefect, setNewDefect] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [metaValue, setMetaValue] = useState(metas[0]?.maxDefectPercentage || 5);

    // User Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

    if (user?.role !== UserRole.ADMIN) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Shield size={48} className="mb-4 text-slate-300" />
                <h2 className="text-xl font-bold">Acesso Restrito</h2>
                <p>Apenas administradores podem acessar esta página.</p>
                <button onClick={() => navigate('/dashboard')} className="mt-4 text-blue-600 hover:underline">Voltar ao Dashboard</button>
            </div>
        );
    }

    const handleAddDefect = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDefect.trim() && newCategory.trim()) {
            addDefectType(newDefect, newCategory.toUpperCase());
            setNewDefect('');
            setNewCategory('');
        }
    };

    const handleUpdateMeta = async () => {
        if (metas.length > 0) {
            const success = await updateMeta({ ...metas[0], maxDefectPercentage: Number(metaValue) });
            if (success) {
                alert("Meta atualizada com sucesso!");
            } else {
                alert("Erro ao atualizar meta. Tente novamente.");
            }
        }
    };

    const isOnline = (lastSeen?: string) => {
        if (!lastSeen) return false;
        const diff = new Date().getTime() - new Date(lastSeen).getTime();
        return diff < 5 * 60 * 1000; // 5 minutes
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            await saveUser(editingUser);
            setIsUserModalOpen(false);
            setEditingUser(null);
        }
    };

    const openEditUser = (u: User) => {
        setEditingUser({ ...u, password: '' }); // Don't show password, allow reset
        setIsUserModalOpen(true);
    };

    const openNewUser = () => {
        setEditingUser({
            name: '',
            email: '',
            password: '',
            role: UserRole.USER,
            avatar: AVATAR_PRESETS[0]
        });
        setIsUserModalOpen(true);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Configurações do Sistema</h2>
                <p className="text-brand-cyan font-mono text-xs mt-1 tracking-widest">GERENCIE PARÂMETROS GLOBAIS</p>
            </div>

            {/* Metas Section */}
            <div className="tech-card p-6 rounded-none relative">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 uppercase tracking-wide">Meta de Qualidade</h3>
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Máximo de Defeitos (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full p-3 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-brand-cyan outline-none font-mono"
                            value={metaValue}
                            onChange={(e) => setMetaValue(Number(e.target.value))}
                        />
                    </div>
                    <button
                        onClick={handleUpdateMeta}
                        className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center gap-2 mb-[1px] uppercase text-xs font-bold tracking-wider"
                    >
                        <Save size={18} /> Salvar Meta
                    </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 font-mono border-l-2 border-slate-700 pl-3">PARAMETER_ID: Q_TARGET // REF_VALUE</p>
            </div>

            {/* Defect Types Section */}
            <div className="tech-card p-6 rounded-none relative">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 uppercase tracking-wide">Tipos de Defeitos</h3>

                <div className="mb-8">
                    <form onSubmit={handleAddDefect} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Nome do Defeito</label>
                            <input
                                type="text"
                                placeholder="EX: FURO NA MANGA"
                                className="w-full p-3 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-brand-cyan outline-none font-mono placeholder-slate-700"
                                value={newDefect}
                                onChange={(e) => setNewDefect(e.target.value)}
                                required
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Categoria</label>
                            <input
                                type="text"
                                placeholder="EX: COSTURA"
                                className="w-full p-3 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-brand-cyan outline-none uppercase font-mono placeholder-slate-700"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                required
                                list="categories"
                            />
                            <datalist id="categories">
                                <option value="COSTURA" />
                                <option value="ACABAMENTO" />
                                <option value="TECIDO" />
                                <option value="ESTRUTURA" />
                                <option value="AVIAMENTOS" />
                            </datalist>
                        </div>
                        <button type="submit" className="bg-brand-green text-black px-4 py-3 rounded hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-2">
                            <Plus size={18} />
                        </button>
                    </form>
                </div>

                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from(new Set(defectTypes.map(d => d.category))).map(cat => (
                        <div key={cat} className="mb-4">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 border-b border-slate-800 pb-1 flex justify-between">
                                <span>{cat}</span>
                                <span className="font-mono text-slate-700">ID_GRP: {String(cat).substring(0, 3)}</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {defectTypes.filter(d => d.category === cat).map(d => (
                                    <div key={d.id} className="flex justify-between items-center p-3 bg-slate-950/50 border border-slate-800 hover:border-brand-cyan/30 transition-colors rounded-sm text-sm group">
                                        <span className="text-slate-300 font-mono text-xs">{d.name}</span>
                                        <div className="w-1.5 h-1.5 bg-slate-800 rounded-full group-hover:bg-brand-cyan transition-colors"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Users - Updated Real Time */}
            <div className="tech-card p-6 rounded-none relative">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wide">
                    <Users size={20} className="text-brand-cyan" /> Gestão de Usuários
                </h3>

                <div className="grid gap-3">
                    {allUsers.map(u => {
                        const online = isOnline(u.last_seen);
                        return (
                            <div key={u.id} className={`p-4 border border-slate-800 transition-all group relative overflow-hidden ${online ? 'bg-slate-900/80 hover:border-brand-cyan/30' : 'bg-slate-950/50 opacity-80'
                                }`}>
                                <div className={`absolute left-0 top-0 w-1 h-full ${online ? 'bg-brand-cyan' : 'bg-slate-700'}`}></div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <img src={u.avatar || AVATAR_PRESETS[0]} alt="Avatar" className="w-10 h-10 rounded-md border border-slate-700 bg-slate-800" />
                                        <div>
                                            <p className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                                {u.name}
                                                {user?.id === u.id && <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-400">(Você)</span>}
                                            </p>
                                            <p className="text-xs text-slate-500 font-mono mt-1">{u.email} • {u.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase border ${online
                                            ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20'
                                            : 'bg-slate-800 text-slate-500 border-slate-700'
                                            }`}>
                                            {online ? 'Online' : 'Offline'}
                                        </span>
                                        <button onClick={() => openEditUser(u)} className="text-slate-400 hover:text-white transition-colors">
                                            <UserCog size={18} />
                                        </button>
                                        {user?.id !== u.id && (
                                            <button onClick={() => { if (confirm('Tem certeza?')) deleteUser(u.id); }} className="text-slate-600 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button onClick={openNewUser} className="mt-6 w-full py-3 border border-dashed border-slate-700 text-slate-500 hover:text-brand-cyan hover:border-brand-cyan/50 hover:bg-brand-cyan/5 transition-all uppercase text-xs font-bold tracking-widest flex items-center justify-center gap-2">
                    <Plus size={16} /> Adicionar Novo Usuário
                </button>
            </div>

            {/* Modal de Usuário */}
            <AnimatePresence>
                {isUserModalOpen && editingUser && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-700 w-full max-w-lg shadow-2xl relative"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                                    {editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}
                                </h3>
                                <button onClick={() => setIsUserModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase">Nome</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-brand-cyan focus:outline-none"
                                        value={editingUser.name}
                                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase">Email</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-brand-cyan focus:outline-none"
                                            value={editingUser.email}
                                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase">Cargo</label>
                                        <select
                                            className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-brand-cyan focus:outline-none"
                                            value={editingUser.role}
                                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                                        >
                                            <option value={UserRole.ADMIN}>ADMINISTRADOR</option>
                                            <option value={UserRole.USER}>OPERADOR</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase">
                                        {editingUser.id ? 'Nova Senha (Opcional)' : 'Senha'}
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-brand-cyan focus:outline-none placeholder-slate-700"
                                        placeholder={editingUser.id ? 'Deixe em branco para manter' : 'Create password'}
                                        required={!editingUser.id}
                                        value={editingUser.password}
                                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-brand-cyan mb-3 uppercase">Avatar</label>
                                    <div className="grid grid-cols-6 gap-2 mb-3">
                                        {AVATAR_PRESETS.map((avatarUrl) => (
                                            <div
                                                key={avatarUrl}
                                                onClick={() => setEditingUser({ ...editingUser, avatar: avatarUrl })}
                                                className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all ${editingUser.avatar === avatarUrl ? 'border-brand-cyan scale-110 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                            >
                                                <img src={avatarUrl} alt="Avatar" className="w-full h-full bg-slate-800" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Ou cole uma URL de imagem externa..."
                                            className="flex-1 p-2 bg-slate-950 border border-slate-700 text-xs text-white focus:border-brand-cyan focus:outline-none"
                                            value={editingUser.avatar}
                                            onChange={(e) => setEditingUser({ ...editingUser, avatar: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-brand-green text-black py-3 font-bold uppercase tracking-wider hover:bg-emerald-400 transition-colors"
                                    >
                                        Salvar Usuário
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};