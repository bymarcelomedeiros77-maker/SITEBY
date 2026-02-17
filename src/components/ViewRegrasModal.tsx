import React from 'react';
import { RegraConsumo } from '../types';
import { useApp } from '../context/AppContext';
import { X, Edit2, Trash2, Ruler, Tag, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ViewRegrasModalProps {
    isOpen: boolean;
    onClose: () => void;
    referencia: string;
    regras: RegraConsumo[];
    onEdit: (regra: RegraConsumo) => void;
    onDelete: (id: string) => void;
}

export const ViewRegrasModal: React.FC<ViewRegrasModalProps> = ({
    isOpen,
    onClose,
    referencia,
    regras,
    onEdit,
    onDelete
}) => {
    const { confirm } = useApp();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                                Regras de Consumo - {referencia}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {regras.length} {regras.length === 1 ? 'regra cadastrada' : 'regras cadastradas'}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {regras.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Ruler className="text-slate-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-400 mb-2">Nenhuma regra cadastrada</h3>
                                <p className="text-sm text-slate-600">
                                    Adicione uma regra de consumo para esta referência.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {regras.map((regra) => (
                                    <motion.div
                                        key={regra.id}
                                        layout
                                        className="bg-slate-950 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-brand-cyan/10 rounded-lg">
                                                    <Ruler className="text-brand-cyan" size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">
                                                        {regra.tamanho ? `Tamanho ${regra.tamanho.nome}` : 'Geral (Todos os tamanhos)'}
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        Consumo: <span className="text-brand-cyan font-mono font-bold">{regra.consumoUnitario.toFixed(2)}m</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onEdit(regra)}
                                                    className="p-2 bg-slate-900 text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-all"
                                                    title="Editar regra"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const confirmed = await confirm({
                                                            title: 'Excluir Regra',
                                                            message: 'Deseja realmente excluir esta regra?',
                                                            confirmText: 'Excluir',
                                                            type: 'danger'
                                                        });

                                                        if (confirmed) {
                                                            onDelete(regra.id);
                                                        }
                                                    }}
                                                    className="p-2 bg-slate-900 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Excluir regra"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Fabric Details */}
                                        {(regra.tecidoNome || regra.tecidoComposicao || regra.tecidoLargura || regra.tecidoFornecedor || regra.tecidoCusto) && (
                                            <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Dados do Tecido</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {regra.tecidoNome && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-600 uppercase mb-1">Nome Comercial</p>
                                                            <p className="text-sm text-white">{regra.tecidoNome}</p>
                                                        </div>
                                                    )}
                                                    {regra.tecidoComposicao && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-600 uppercase mb-1">Composição</p>
                                                            <p className="text-sm text-white">{regra.tecidoComposicao}</p>
                                                        </div>
                                                    )}
                                                    {regra.tecidoLargura && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-600 uppercase mb-1">Largura</p>
                                                            <p className="text-sm text-white">{regra.tecidoLargura}</p>
                                                        </div>
                                                    )}
                                                    {regra.tecidoFornecedor && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-600 uppercase mb-1">Fornecedor</p>
                                                            <p className="text-sm text-white">{regra.tecidoFornecedor}</p>
                                                        </div>
                                                    )}
                                                    {regra.tecidoCusto && regra.tecidoCusto > 0 && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-600 uppercase mb-1">Custo/Metro</p>
                                                            <p className="text-sm text-green-500 font-mono">R$ {regra.tecidoCusto.toFixed(2)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Accessories */}
                                        {regra.acessorios && (
                                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Acessórios & Aviamentos</h4>
                                                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{regra.acessorios}</pre>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-800 flex justify-end bg-slate-900/50">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-slate-400 hover:text-white font-bold uppercase text-xs transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
