import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, CorteStatus } from '../types';
import { formatDate } from '../utils/dateUtils';
import { Trash2, Download, History, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

export const Historico = () => {
    const { cortes, faccoes, user: currentUser, deleteCorte } = useApp();
    const { confirm, confirmState, closeDialog } = useConfirm();
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    const isAdmin = currentUser?.role === UserRole.ADMIN;

    // Filter cortes by date range
    const filteredCortes = useMemo(() => {
        let filtered = [...cortes];

        if (dataInicio) {
            filtered = filtered.filter(c =>
                new Date(c.dataEnvio) >= new Date(dataInicio)
            );
        }

        if (dataFim) {
            filtered = filtered.filter(c =>
                new Date(c.dataEnvio) <= new Date(dataFim)
            );
        }

        // Sort by send date (newest first)
        return filtered.sort((a, b) =>
            new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
        );
    }, [cortes, dataInicio, dataFim]);

    const getFaccaoName = (faccaoId: string) => {
        return faccoes.find(f => f.id === faccaoId)?.name || 'Desconhecida';
    };

    const handleDelete = async (corteId: string, referencia: string) => {
        const confirmed = await confirm({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir o corte "${referencia}" do histórico? Esta ação é irreversível.`,
            confirmText: 'Sim, Excluir',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            await deleteCorte(corteId);
        }
    };

    const exportToExcel = () => {
        const data = filteredCortes.map(corte => {
            const faccao = getFaccaoName(corte.faccaoId);
            const defectPercent = corte.qtdTotalRecebida > 0
                ? ((corte.qtdTotalDefeitos / corte.qtdTotalRecebida) * 100).toFixed(2)
                : '0';

            return {
                'Referência': corte.referencia,
                'Facção': faccao,
                'Data Envio': formatDate(corte.dataEnvio),
                'Data Prevista': corte.dataPrevistaRecebimento ? formatDate(corte.dataPrevistaRecebimento) : '-',
                'Data Recebimento': corte.dataRecebimento ? formatDate(corte.dataRecebimento) : '-',
                'Status': corte.status,
                'Qtd Enviada': corte.qtdTotalEnviada,
                'Qtd Recebida': corte.qtdTotalRecebida,
                'Defeitos': corte.qtdTotalDefeitos,
                '% Defeitos': `${defectPercent}%`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Histórico');

        const startLabel = dataInicio || 'Inicio';
        const endLabel = dataFim || 'Hoje';
        const filename = `Historico_${startLabel}_${endLabel}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-3xl font-bold text-white tracking-wide uppercase flex items-center gap-3">
                    <History size={32} className="text-brand-cyan" />
                    Histórico de Cortes
                </h2>
                <p className="text-brand-cyan font-mono text-xs mt-1 tracking-widest">
                    FILTRO POR PERÍODO • EXPORTAÇÃO EXCEL
                </p>
            </div>

            {/* Filters */}
            <div className="tech-card p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                            <Calendar size={14} className="inline mr-1" />
                            Data Início
                        </label>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-brand-cyan transition-colors font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                            <Calendar size={14} className="inline mr-1" />
                            Data Fim
                        </label>
                        <input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-brand-cyan transition-colors font-mono text-sm"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setDataInicio('');
                                setDataFim('');
                            }}
                            className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm uppercase tracking-wider"
                        >
                            Limpar Filtros
                        </button>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={exportToExcel}
                            disabled={filteredCortes.length === 0}
                            className="w-full px-4 py-2 bg-brand-cyan hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            Exportar Excel
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm font-mono text-slate-400">
                    <span>Total de registros:</span>
                    <span className="text-brand-cyan font-bold">{filteredCortes.length}</span>
                </div>
            </div>

            {/* Table */}
            <div className="tech-card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Ref</th>
                            <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Facção</th>
                            <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Envio</th>
                            <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Previsto</th>
                            <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Recebimento</th>
                            <th className="text-left p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="text-right p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Enviada</th>
                            <th className="text-right p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Recebida</th>
                            <th className="text-right p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Defeitos</th>
                            <th className="text-right p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">% Def</th>
                            {isAdmin && (
                                <th className="text-center p-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Ações</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCortes.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 11 : 10} className="text-center p-12 text-slate-500">
                                    <History size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="uppercase tracking-widest text-sm">
                                        Nenhum registro encontrado para o período selecionado
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filteredCortes.map((corte) => {
                                const defectPercent = corte.qtdTotalRecebida > 0
                                    ? ((corte.qtdTotalDefeitos / corte.qtdTotalRecebida) * 100).toFixed(2)
                                    : '0';

                                return (
                                    <tr
                                        key={corte.id}
                                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="p-4 font-mono text-white">{corte.referencia}</td>
                                        <td className="p-4 text-slate-300">{getFaccaoName(corte.faccaoId)}</td>
                                        <td className="p-4 font-mono text-slate-400 text-xs">{formatDate(corte.dataEnvio)}</td>
                                        <td className="p-4 font-mono text-slate-400 text-xs">
                                            {corte.dataPrevistaRecebimento ? formatDate(corte.dataPrevistaRecebimento) : '-'}
                                        </td>
                                        <td className="p-4 font-mono text-slate-400 text-xs">
                                            {corte.dataRecebimento ? formatDate(corte.dataRecebimento) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${corte.status === CorteStatus.RECEBIDO
                                                ? 'bg-green-900/50 text-green-400'
                                                : 'bg-yellow-900/50 text-yellow-400'
                                                }`}>
                                                {corte.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-white">{corte.qtdTotalEnviada}</td>
                                        <td className="p-4 text-right font-mono text-white">{corte.qtdTotalRecebida}</td>
                                        <td className="p-4 text-right font-mono text-red-400 font-bold">{corte.qtdTotalDefeitos}</td>
                                        <td className="p-4 text-right font-mono text-red-400 font-bold">{defectPercent}%</td>
                                        {isAdmin && (
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleDelete(corte.id, corte.referencia)}
                                                    className="text-red-400 hover:text-red-300 hover:scale-110 transition-all"
                                                    title="Excluir registro"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={closeDialog}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                type={confirmState.type}
            />
        </div>
    );
};
