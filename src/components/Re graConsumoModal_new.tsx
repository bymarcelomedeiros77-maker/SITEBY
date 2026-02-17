import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RegraConsumo } from '../types';
import {
    Plus, X, Save, Tag, Box, Ruler, Package, DollarSign
} from 'lucide-react';

interface RegraConsumoModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: RegraConsumo | null;
    initialReferencia?: string;
}

export const RegraConsumoModal: React.FC<RegraConsumoModalProps> = ({
    isOpen,
    onClose,
    initialData,
    initialReferencia
}) => {
    const { tamanhos, addRegraConsumo, updateRegraConsumo } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [referencia, setReferencia] = useState('');
    const [tamanhoId, setTamanhoId] = useState('');
    const [consumoUnitario, setConsumoUnitario] = useState<number>(0);
    const [tecidoNome, setTecidoNome] = useState('');
    const [tecidoComposicao, setTecidoComposicao] = useState('');
    const [tecidoLargura, setTecidoLargura] = useState('');
    const [tecidoFornecedor, setTecidoFornecedor] = useState('');
    const [tecidoCusto, setTecidoCusto] = useState<number>(0);
    const [acessorios, setAcessorios] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setReferencia(initialData.referencia);
                setTamanhoId(initialData.tamanhoId || '');
                setConsumoUnitario(initialData.consumoUnitario);
                setTecidoNome(initialData.tecidoNome || '');
                setTecidoComposicao(initialData.tecidoComposicao || '');
                setTecidoLargura(initialData.tecidoLargura || '');
                setTecidoFornecedor(initialData.tecidoFornecedor || '');
                setTecidoCusto(initialData.tecidoCusto || 0);
                setAcessorios(initialData.acessorios || '');
            } else {
                resetForm();
                if (initialReferencia) {
                    setReferencia(initialReferencia);
                }
            }
        }
    }, [isOpen, initialData, initialReferencia]);

    const resetForm = () => {
        setReferencia('');
        setTamanhoId('');
        setConsumoUnitario(0);
        setTecidoNome('');
        setTecidoComposicao('');
        setTecidoLargura('');
        setTecidoFornecedor('');
        setTecidoCusto(0);
        setAcessorios('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!referencia || consumoUnitario <= 0) {
            alert("Preencha a referência e o consumo unitário.");
            return;
        }

        setIsLoading(true);
        try {
            const regraData = {
                referencia,
                tamanhoId: tamanhoId || undefined,
                consumoUnitario,
                tecidoNome,
                tecidoComposicao,
                tecidoLargura,
                tecidoFornecedor,
                tecidoCusto,
                acessorios
            };

            if (initialData) {
                await updateRegraConsumo({ ...initialData, ...regraData });
            } else {
                await addRegraConsumo(regraData);
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar regra.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <div
                className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-cyan/10 rounded-lg">
                            <Plus className="text-brand-cyan" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                            {initialData ? 'Editar Regra' : 'Nova Regra de Consumo'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Section 1 */}
                    <div>
                        <h3 className="text-[10px] font-bold text-brand-cyan uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-brand-cyan/30"></span> Identificação & Consumo
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Referência *</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="text"
                                        value={referencia}
                                        onChange={e => setReferencia(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-brand-cyan outline-none"
                                        placeholder="Ex: 77878"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Tamanho</label>
                                <div className="relative">
                                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <select
                                        value={tamanhoId}
                                        onChange={e => setTamanhoId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-brand-cyan outline-none appearance-none"
                                    >
                                        <option value="">Geral (Todos)</option>
                                        {tamanhos.map(t => (
                                            <option key={t.id} value={t.id}>{t.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Consumo Unitário (m) *</label>
                                <div className="relative">
                                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={consumoUnitario}
                                        onChange={e => setConsumoUnitario(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-2xl font-mono text-brand-cyan focus:border-brand-cyan outline-none"
                                        placeholder="Ex: 1.50"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-slate-600 italic">Inclua margem de quebra técnica.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div>
                        <h3 className="text-[10px] font-bold text-brand-cyan uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-brand-cyan/30"></span> Dados do Tecido
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Comercial</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="text"
                                        value={tecidoNome}
                                        onChange={e => setTecidoNome(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-brand-cyan outline-none"
                                        placeholder="Ex: Viscose Sarjada..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Composição</label>
                                <div className="relative">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="text"
                                        value={tecidoComposicao}
                                        onChange={e => setTecidoComposicao(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-brand-cyan outline-none"
                                        placeholder="Ex: 100% Algodão"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Largura</label>
                                <div className="relative">
                                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="text"
                                        value={tecidoLargura}
                                        onChange={e => setTecidoLargura(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-brand-cyan outline-none"
                                        placeholder="Ex: 1.40m"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Fornecedor Principal</label>
                                <div className="relative">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="text"
                                        value={tecidoFornecedor}
                                        onChange={e => setTecidoFornecedor(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-brand-cyan outline-none"
                                        placeholder="Nome do Fornecedor"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Custo Estimado (Metro)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tecidoCusto}
                                        onChange={e => setTecidoCusto(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-brand-cyan outline-none font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div>
                        <h3 className="text-[10px] font-bold text-brand-cyan uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-brand-cyan/30"></span> Acessórios, Aviamentos & Observações
                        </h3>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição Manual de Acessórios (Lista para Compras)</label>
                            <textarea
                                value={acessorios}
                                onChange={e => setAcessorios(e.target.value)}
                                rows={5}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-brand-cyan outline-none text-sm leading-relaxed"
                                placeholder="Ex:&#10;- 1 Zíper Invisível 15cm (Costas)&#10;- 2 Botões de Massa 18mm (Punhos)&#10;- Linha de Pesponte Cor 123"
                            />
                            <p className="text-[10px] text-slate-600">Use este campo para listar zíperes, botões, entretelas, etiquetas e outros aviamentos necessários.</p>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-slate-400 hover:text-white font-bold uppercase text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-8 py-3 bg-green-500 hover:bg-green-400 text-slate-950 rounded-xl font-bold uppercase text-xs flex items-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isLoading ? 'Salvando...' : 'Criar Regra'}
                    </button>
                </div>
            </div>
        </div>
}
