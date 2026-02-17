import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, User } from '../types';
import { X, Save, Camera, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resizeImage } from '../utils/imageUtils';



interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, saveUser, addToast } = useApp();
    const [editingUser, setEditingUser] = useState<Partial<User>>({});

    useEffect(() => {
        if (user && isOpen) {
            setEditingUser({ ...user, password: '' });
        }
    }, [user, isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveUser(editingUser);
            addToast('success', 'Perfil atualizado com sucesso!');
            onClose();
        } catch (error) {
            console.error(error);
            addToast('error', 'Erro ao atualizar perfil.');
        }
    };

    if (!isOpen || !user) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4 text-left">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-slate-700 w-full max-w-lg shadow-2xl relative rounded-lg overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Camera size={20} className="text-brand-cyan" /> Editar Meu Perfil
                            </h3>
                            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {/* Avatar Selection */}
                            <div>
                                <label className="block text-xs font-bold text-brand-cyan mb-3 uppercase tracking-wider">Foto de Perfil</label>
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
                                                            addToast('error', "Erro ao processar imagem.");
                                                        }
                                                    }
                                                }}
                                            />
                                        </label>
                                        <p className="text-[10px] text-slate-500">Recomendado: Imagem quadrada, max 1MB.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Nome</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded focus:border-brand-cyan focus:outline-none transition-colors"
                                        value={editingUser.name || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Email</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded focus:border-brand-cyan focus:outline-none transition-colors"
                                            value={editingUser.email || ''}
                                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Nova Senha</label>
                                        <input
                                            type="password"
                                            className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded focus:border-brand-cyan focus:outline-none placeholder-slate-600 transition-colors"
                                            placeholder="Manter atual"
                                            value={editingUser.password || ''}
                                            onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 bg-transparent border border-slate-700 text-slate-400 py-3 rounded font-bold uppercase tracking-wider hover:bg-slate-800 hover:text-white transition-colors text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-brand-cyan text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all text-xs flex items-center justify-center gap-2"
                                >
                                    <Save size={16} /> Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
