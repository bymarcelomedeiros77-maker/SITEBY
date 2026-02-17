import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Faccao, CorteStatus } from '../types';
import { ChevronDown, ChevronRight, Package, Calendar, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { isFaccaoCritical } from '../utils/alertUtils';
import { DefectReportModal } from '../components/DefectReportModal';
import { Corte } from '../types';

export const FaccoesReferencias = () => {
    const { faccoes, cortes, metas } = useApp();
    const [expandedFaccao, setExpandedFaccao] = useState<string | null>(null);
    const [modalFaccao, setModalFaccao] = useState<Faccao | null>(null);
    const [selectedCorteReport, setSelectedCorteReport] = useState<Corte | null>(null);

    // Group cortes by faction
    const faccaoData = useMemo(() => {
        const activeMeta = metas.find(m => m.isActive) || { maxDefectPercentage: 5 };

        return faccoes.map(faccao => {
            const faccaoCortes = cortes.filter(c => c.faccaoId === faccao.id);
            const referencias = [...new Set(faccaoCortes.map(c => c.referencia))];

            // Calculate defect rate
            const recebidos = faccaoCortes.filter(c => c.status === CorteStatus.RECEBIDO);
            const totalRecebido = recebidos.reduce((a, b) => a + b.qtdTotalRecebida, 0);
            const totalDefeitos = recebidos.reduce((a, b) => a + b.qtdTotalDefeitos, 0);
            const defectPercent = totalRecebido > 0 ? (totalDefeitos / totalRecebido) * 100 : 0;
            const isCritical = totalRecebido > 0 && isFaccaoCritical(defectPercent, activeMeta.maxDefectPercentage);

            return {
                faccao,
                totalCortes: faccaoCortes.length,
                referencias,
                cortesEnviados: faccaoCortes.filter(c => c.status === CorteStatus.ENVIADO).length,
                cortesRecebidos: faccaoCortes.filter(c => c.status === CorteStatus.RECEBIDO).length,
                cortes: faccaoCortes,
                defectPercent,
                isCritical
            };
        }).filter(fd => fd.totalCortes > 0); // Only show factions with cortes
    }, [faccoes, cortes, metas]);

    const handleFaccaoClick = (faccao: Faccao) => {
        setModalFaccao(faccao);
    };

    const toggleExpand = (faccaoId: string) => {
        setExpandedFaccao(expandedFaccao === faccaoId ? null : faccaoId);
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-3xl font-bold text-white tracking-wide uppercase">Facções por Referência</h2>
                <p className="text-brand-cyan font-mono text-xs mt-1 tracking-widest">VISUALIZAÇÃO: ORGANIZADA POR UNIDADE</p>
            </div>

            {faccaoData.length === 0 ? (
                <div className="tech-card p-12 text-center">
                    <Package className="mx-auto mb-4 opacity-50 text-slate-500" size={48} />
                    <p className="text-slate-500 uppercase tracking-widest text-sm">Nenhum corte registrado</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {faccaoData.map(({ faccao, totalCortes, referencias, cortesEnviados, cortesRecebidos, cortes: faccaoCortes, isCritical, defectPercent }) => (
                        <div key={faccao.id} className={`tech-card overflow-hidden ${isCritical ? 'border-2 border-red-500/50 shadow-lg shadow-red-500/20' : ''}`}>
                            {/* Critical Badge */}
                            {isCritical && (
                                <div className="bg-red-500/20 border-b border-red-500/30 px-6 py-2 flex items-center gap-2">
                                    <AlertTriangle className="text-red-400 animate-pulse" size={16} />
                                    <span className="text-red-400 text-xs font-bold uppercase tracking-wider">
                                        ⚠️ CRÍTICO: {defectPercent.toFixed(2)}% de defeitos
                                    </span>
                                </div>
                            )}

                            {/* Header */}
                            <div
                                className={`p-6 cursor-pointer hover:bg-slate-800/30 transition-colors flex items-center justify-between border-l-4 ${isCritical ? 'border-red-500' : 'border-brand-cyan'}`}
                                onClick={() => toggleExpand(faccao.id)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex-shrink-0">
                                        {expandedFaccao === faccao.id ? (
                                            <ChevronDown className={isCritical ? 'text-red-400' : 'text-brand-cyan'} size={24} />
                                        ) : (
                                            <ChevronRight className="text-slate-500" size={24} />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">{faccao.name}</h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-xs text-slate-400 font-mono">
                                                {referencias.length} Referência{referencias.length > 1 ? 's' : ''}
                                            </span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {totalCortes} Envio{totalCortes > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-400 font-mono">{cortesEnviados}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Enviados</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-400 font-mono">{cortesRecebidos}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Recebidos</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFaccaoClick(faccao);
                                        }}
                                        className="px-4 py-2 bg-brand-cyan text-black hover:bg-blue-400 uppercase text-xs font-bold transition-all shadow-lg"
                                    >
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedFaccao === faccao.id && (
                                <div className="p-6 pt-0 border-t border-slate-800">
                                    <div className="mt-4 space-y-2">
                                        <h4 className="text-sm font-bold text-brand-cyan uppercase tracking-wider mb-3">Referências Enviadas:</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {referencias.map(ref => {
                                                const refCortes = faccaoCortes.filter(c => c.referencia === ref);
                                                const allReceived = refCortes.every(c => c.status === CorteStatus.RECEBIDO);

                                                return (
                                                    <div
                                                        key={ref}
                                                        className={`p-3 border rounded ${allReceived ? 'bg-green-950/20 border-green-800/30' : 'bg-slate-900/50 border-slate-800'}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-mono text-sm text-white">{ref}</span>
                                                            {allReceived ? (
                                                                <CheckCircle className="text-green-400" size={16} />
                                                            ) : (
                                                                <Package className="text-blue-400" size={16} />
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 uppercase mt-1">
                                                            {refCortes.length} envio{refCortes.length > 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalFaccao && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="tech-card w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan to-transparent"></div>

                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-white uppercase tracking-wider">{modalFaccao.name}</h3>
                                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                    <Package size={14} />
                                    Histórico Completo de Cortes
                                </p>
                            </div>
                            <button
                                onClick={() => setModalFaccao(null)}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-6">
                                {cortes
                                    .filter(c => c.faccaoId === modalFaccao.id)
                                    .sort((a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime())
                                    .map(corte => (
                                        <div key={corte.id} className="border-l-4 border-slate-700 pl-4 py-2 hover:border-brand-cyan transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="text-lg font-bold text-white font-mono">{corte.referencia}</h4>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            Enviado: {formatDate(corte.dataEnvio)}
                                                        </span>
                                                        {corte.dataPrevistaRecebimento && (
                                                            <span className="text-xs text-blue-400 flex items-center gap-1">
                                                                📅 Previsto: {formatDate(corte.dataPrevistaRecebimento)}
                                                            </span>
                                                        )}
                                                        {corte.dataRecebimento && (
                                                            <span className="text-xs text-green-400 flex items-center gap-1">
                                                                <CheckCircle size={12} />
                                                                Recebido: {formatDate(corte.dataRecebimento)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    {corte.status === CorteStatus.ENVIADO && (
                                                        <span className="text-blue-400 bg-blue-900/40 border border-blue-800 px-3 py-1 text-[10px] font-bold tracking-wider uppercase">
                                                            ENVIADO
                                                        </span>
                                                    )}
                                                    {corte.status === CorteStatus.RECEBIDO && (
                                                        <span className="text-green-400 bg-green-900/40 border border-green-800 px-3 py-1 text-[10px] font-bold tracking-wider uppercase">
                                                            RECEBIDO
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 p-3 bg-slate-900/50 rounded">
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase">Qtd Enviada</div>
                                                    <div className="text-lg font-bold text-white font-mono">{corte.qtdTotalEnviada}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase">Qtd Recebida</div>
                                                    <div className="text-lg font-bold text-green-400 font-mono">{corte.qtdTotalRecebida || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase">Defeitos</div>
                                                    <div className={`text-lg font-bold font-mono ${corte.qtdTotalDefeitos > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                                                        {corte.qtdTotalDefeitos || '-'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase">Peças Boas</div>
                                                    <div className={`text-lg font-bold font-mono ${(corte.qtdTotalRecebida || 0) - (corte.qtdTotalDefeitos || 0) > 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                                                        {(corte.qtdTotalRecebida || 0) - (corte.qtdTotalDefeitos || 0)}
                                                    </div>
                                                </div>

                                                {/* Detalhamento de Defeitos */}
                                                {corte.qtdTotalDefeitos > 0 && corte.defeitosPorTipo && Object.keys(corte.defeitosPorTipo).length > 0 && (
                                                    <div className="mt-3 bg-red-950/30 border border-red-900/30 rounded p-3">
                                                        <div className="text-[10px] text-red-400 uppercase font-bold mb-2 flex items-center gap-2">
                                                            <AlertTriangle size={12} /> Relatório de Defeitos
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                            {Object.entries(corte.defeitosPorTipo).map(([tipo, qtd]) => (
                                                                <div key={tipo} className="flex justify-between items-center bg-black/20 p-2 rounded border border-red-900/10">
                                                                    <span className="text-[11px] text-slate-400 uppercase truncate pr-2" title={tipo}>{tipo}</span>
                                                                    <span className="font-mono text-red-400 font-bold text-xs">{qtd}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedCorteReport(corte)}
                                                            className="mt-3 w-full bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 text-red-400 text-[10px] font-bold uppercase py-2 rounded transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <AlertTriangle size={12} /> Ver Relatório Completo / Baixar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {corte.itens && corte.itens.length > 0 && (
                                                <div className="mt-3">
                                                    <div className="text-[10px] text-slate-500 uppercase mb-2">Cores Enviadas:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {corte.itens.map((item, idx) => (
                                                            <span key={idx} className="px-2 py-1 bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded">
                                                                {item.cor} ({item.quantidadeTotalCor})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Defect Report Modal */}
            {selectedCorteReport && modalFaccao && (
                <DefectReportModal
                    isOpen={!!selectedCorteReport}
                    onClose={() => setSelectedCorteReport(null)}
                    corte={selectedCorteReport}
                    faccaoName={modalFaccao.name}
                />
            )}
        </div>
    );
};
