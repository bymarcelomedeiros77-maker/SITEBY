import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, User } from '../types';
import { Save, Shield, Trash2, Plus, Users, UserCog, Check, X, Camera, DownloadCloud, UploadCloud, Power, Lock, Unlock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resizeImage } from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';



export const Settings = () => {
    const { user, defectTypes, metas, addDefectType, updateMeta, allUsers, saveUser, deleteUser, resetStock, addToast, confirm, backupSystem, restoreSystem } = useApp();
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

    const handleBackup = async () => {
        const data = await backupSystem();
        if (data) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                const confirmed = await confirm({
                    title: 'Restaurar Backup do Sistema',
                    message: 'ATENÇÃO CRÍTICA: Esta ação apagará TODOS os dados atuais do sistema (pedidos, produção, clientes, etc.) e os substituirá pelos dados do arquivo selecionado. Esta ação NÃO pode ser desfeita. Tem certeza absoluta?',
                    confirmText: 'SIM, RESTAURAR TUDO',
                    cancelText: 'Cancelar',
                    type: 'danger'
                });

                if (confirmed) {
                    await restoreSystem(json);
                }
            } catch (err) {
                console.error(err);
                addToast('error', 'Arquivo de backup inválido ou corrompido.');
            }
        };
        reader.readAsText(file);
        // Reset input to allow selecting same file again
        e.target.value = '';
    };

    const handleUpdateMeta = async () => {
        if (metas.length > 0) {
            const success = await updateMeta({ ...metas[0], maxDefectPercentage: Number(metaValue) });
            if (success) {
                addToast('success', "Meta atualizada com sucesso!");
            } else {
                addToast('error', "Erro ao atualizar meta. Tente novamente.");
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
            avatar: ''
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
                                        <img src={u.avatar || "https://ui-avatars.com/api/?name=" + u.name} alt="Avatar" className="w-10 h-10 rounded-md border border-slate-700 bg-slate-800 object-cover" />
                                        <div>
                                            <p className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                                {u.name}
                                                {user?.id === u.id && <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-400">(Você)</span>}
                                            </p>
                                            <p className="text-xs text-slate-500 font-mono mt-1">{u.email} • {u.role}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded ${online
                                                ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20'
                                                : 'bg-slate-800 text-slate-500 border-slate-700'
                                                }`}>
                                                {online ? 'Online' : 'Offline'}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded ${u.active !== false
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {u.active !== false ? 'ATIVO' : 'DESATIVADO'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Toggle Active Status */}
                                            {user?.id !== u.id && (
                                                <button
                                                    onClick={async () => {
                                                        const newStatus = u.active === false;
                                                        const action = newStatus ? 'Ativar' : 'Desativar';

                                                        const confirmed = await confirm({
                                                            title: `${action} Usuário`,
                                                            message: `Tem certeza que deseja ${action.toLowerCase()} o acesso de ${u.name}?`,
                                                            confirmText: action,
                                                            type: newStatus ? 'default' : 'danger'
                                                        });

                                                        if (confirmed) {
                                                            await saveUser({ id: u.id, active: newStatus });
                                                            addToast('success', `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso.`);
                                                        }
                                                    }}
                                                    className={`p-2 rounded transition-colors ${u.active !== false
                                                        ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                                                        : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                                                    title={u.active !== false ? "Desativar Usuário" : "Ativar Usuário"}
                                                >
                                                    {u.active !== false ? <Lock size={18} /> : <Unlock size={18} />}
                                                </button>
                                            )}

                                            <button onClick={() => openEditUser(u)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Editar">
                                                <UserCog size={18} />
                                            </button>

                                            {user?.id !== u.id && (
                                                <button onClick={async () => {
                                                    const confirmed = await confirm({
                                                        title: 'Excluir Usuário',
                                                        message: 'Tem certeza que deseja excluir este usuário?',
                                                        confirmText: 'Excluir',
                                                        type: 'danger'
                                                    });
                                                    if (confirmed) {
                                                        const success = await deleteUser(u.id);
                                                        if (!success) addToast('error', "Falha ao excluir usuário.");
                                                    }
                                                }} className="p-2 text-slate-600 hover:text-red-500 transition-colors" title="Excluir">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
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

            {/* Data Management Section */}
            < div className="tech-card p-6 rounded-none relative" >
                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wide">
                    <DownloadCloud size={20} className="text-brand-cyan" /> Backup e Restauração
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950/50 p-4 border border-slate-800 rounded">
                        <h4 className="font-bold text-white mb-2 uppercase text-sm">Exportar Dados</h4>
                        <p className="text-xs text-slate-500 mb-4 h-10">
                            Gere um arquivo JSON contendo todos os dados do sistema. Guarde este arquivo em local seguro.
                        </p>
                        <button
                            onClick={handleBackup}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-brand-cyan border border-slate-700 py-3 rounded flex items-center justify-center gap-2 uppercase text-xs font-bold tracking-wider transition-colors"
                        >
                            <DownloadCloud size={16} /> Baixar Backup
                        </button>
                    </div>

                    <div className="bg-slate-950/50 p-4 border border-slate-800 rounded">
                        <h4 className="font-bold text-white mb-2 uppercase text-sm">Restaurar Dados</h4>
                        <p className="text-xs text-slate-500 mb-4 h-10">
                            Restaure o sistema a partir de um arquivo de backup. <span className="text-red-400">Cuidado: Isso apaga os dados atuais.</span>
                        </p>
                        <label className="w-full bg-slate-800 hover:bg-slate-700 text-brand-cyan border border-slate-700 py-3 rounded flex items-center justify-center gap-2 uppercase text-xs font-bold tracking-wider transition-colors cursor-pointer">
                            <UploadCloud size={16} /> Selecionar Arquivo
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleRestore}
                            />
                        </label>
                    </div>
                </div>
            </div >

            {/* Danger Zone */}
            < div className="tech-card p-6 rounded-none relative border-red-500/20" >
                <h3 className="text-lg font-bold text-red-500 mb-6 border-b border-red-900/50 pb-2 flex items-center gap-2 uppercase tracking-wide">
                    <Shield size={20} className="text-red-500" /> Zona de Perigo
                </h3>

                <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider">Reiniciar Estoque</h4>
                        <p className="text-xs text-red-400 mt-1">
                            Atenção: Esta ação apagará TODOS os pedidos, ordens de produção e movimentações.<br />
                            O saldo de todos os produtos será zerado. Cadastros de produtos e clientes serão mantidos.
                        </p>
                    </div>
                    <button
                        onClick={() => resetStock()}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-lg shadow-red-900/20 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <Trash2 size={16} /> Zerar Sistema
                    </button>
                </div>
            </div >

            {/* Modal de Usuário */}
            <AnimatePresence>
                {
                    isUserModalOpen && editingUser && (
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
                                        <label className="block text-xs font-bold text-brand-cyan mb-3 uppercase">Foto de Perfil</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-md border border-slate-700 bg-slate-800 overflow-hidden relative group">
                                                {editingUser.avatar ? (
                                                    <img src={editingUser.avatar} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                        <Camera size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded border border-slate-700 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors w-fit mb-2">
                                                    <UploadCloud size={16} /> Escolher Foto
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                try {
                                                                    const resizedBase64 = await resizeImage(file, 300, 0.7);
                                                                    setEditingUser({ ...editingUser, avatar: resizedBase64 });
                                                                } catch (error) {
                                                                    console.error("Error resizing image:", error);
                                                                    alert("Erro ao processar imagem.");
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                <p className="text-[10px] text-slate-500">Recomendado: Imagem quadrada, max 1MB.</p>
                                            </div>
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
                    )
                }
            </AnimatePresence >
        </div >
    );
};