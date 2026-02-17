import React from 'react';
import { Corte } from '../types';
import { X, Download, FileText, AlertCircle, Calendar, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils/dateUtils';

interface DefectReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    corte: Corte;
    faccaoName: string;
}

export const DefectReportModal: React.FC<DefectReportModalProps> = ({
    isOpen,
    onClose,
    corte,
    faccaoName
}) => {
    if (!isOpen) return null;

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        // 1. Resumo
        const summaryData = [
            ['Relatório de Defeitos - Controle de Qualidade'],
            ['Facção:', faccaoName],
            ['Referência:', corte.referencia],
            ['Data Recebimento:', formatDate(corte.dataRecebimento || '')],
            [''],
            ['Qtd Enviada:', corte.qtdTotalEnviada],
            ['Qtd Recebida:', corte.qtdTotalRecebida],
            ['Qtd Defeitos:', corte.qtdTotalDefeitos],
            ['% Defeitos:', `${((corte.qtdTotalDefeitos / corte.qtdTotalRecebida) * 100).toFixed(2)}%`],
            [''],
            ['Observações:', corte.observacoesRecebimento || 'Nenhuma observação registrada.']
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

        // 2. Detalhes dos Defeitos
        const defectData = Object.entries(corte.defeitosPorTipo || {}).map(([tipo, qtd]) => ({
            'Tipo de Defeito': tipo,
            'Quantidade': qtd,
            '% do Total Recebido': `${((Number(qtd) / corte.qtdTotalRecebida) * 100).toFixed(2)}%`
        }));
        const wsDefects = XLSX.utils.json_to_sheet(defectData);
        XLSX.utils.book_append_sheet(wb, wsDefects, 'Defeitos');

        // 3. Detalhes por Cor/Tamanho
        const gradeData: any[] = [];
        corte.itens.forEach(item => {
            item.gradeRecebida?.forEach((g, idx) => {
                const enviado = item.grade[idx].quantidade;
                const recebido = g.quantidade;
                // Assumindo que a diferença é defeito/falta se recebido < enviado
                // Mas o foco aqui é o que foi realmente recebido e conferido
                gradeData.push({
                    'Cor': item.cor,
                    'Tamanho': g.tamanho,
                    'Qtd Enviada': enviado,
                    'Qtd Recebida': recebido,
                    'Diferença': recebido - enviado
                });
            });
        });
        const wsGrade = XLSX.utils.json_to_sheet(gradeData);
        XLSX.utils.book_append_sheet(wb, wsGrade, 'Conferência Grade');

        XLSX.writeFile(wb, `Relatorio_Defeitos_${corte.referencia}_${faccaoName}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('Relatório de Controle de Qualidade', 14, 20);

        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);

        // Info Block
        doc.autoTable({
            startY: 35,
            head: [['Informações do Corte']],
            body: [
                [`Facção: ${faccaoName}`],
                [`Referência: ${corte.referencia}`],
                [`Data Envio: ${formatDate(corte.dataEnvio)}`],
                [`Data Recebimento: ${formatDate(corte.dataRecebimento || '')}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74] } // Green
        });

        // Summary Block
        doc.autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Métrica', 'Valor']],
            body: [
                ['Quantidade Enviada', corte.qtdTotalEnviada],
                ['Quantidade Recebida', corte.qtdTotalRecebida],
                ['Quantidade Aprovada', corte.qtdTotalRecebida - corte.qtdTotalDefeitos],
                ['Quantidade com Defeito', corte.qtdTotalDefeitos],
                ['Taxa de Defeito', `${((corte.qtdTotalDefeitos / corte.qtdTotalRecebida) * 100).toFixed(2)}%`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [41, 37, 36] } // Dark Slate
        });

        // Defects Table
        if (corte.defeitosPorTipo && Object.keys(corte.defeitosPorTipo).length > 0) {
            const defectRows = Object.entries(corte.defeitosPorTipo).map(([tipo, qtd]) => [
                tipo,
                qtd,
                `${((Number(qtd) / corte.qtdTotalRecebida) * 100).toFixed(2)}%`
            ]);

            doc.text('Detalhamento de Defeitos', 14, (doc as any).lastAutoTable.finalY + 15);

            doc.autoTable({
                startY: (doc as any).lastAutoTable.finalY + 20,
                head: [['Tipo de Defeito', 'Quantidade', '% do Total']],
                body: defectRows,
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] } // Red
            });
        }

        // Observations
        if (corte.observacoesRecebimento) {
            doc.text('Observações', 14, (doc as any).lastAutoTable.finalY + 15);
            doc.setFontSize(10);
            const splitText = doc.splitTextToSize(corte.observacoesRecebimento, 180);
            doc.text(splitText, 14, (doc as any).lastAutoTable.finalY + 22);
        }

        doc.save(`Relatorio_Defeitos_${corte.referencia}.pdf`);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                    className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl rounded-lg flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-700 bg-slate-950/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <AlertCircle className="text-red-500" /> Relatório de Defeitos
                            </h2>
                            <p className="text-slate-400 text-xs font-mono mt-1">
                                REF: <span className="text-nexus-cyan">{corte.referencia}</span> | {faccaoName}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-800/50 p-4 rounded border border-slate-700 text-center">
                                <span className="block text-slate-500 text-xs uppercase font-bold mb-1">Total Recebido</span>
                                <span className="text-2xl font-bold text-white font-mono">{corte.qtdTotalRecebida}</span>
                            </div>
                            <div className="bg-red-950/30 p-4 rounded border border-red-900/50 text-center">
                                <span className="block text-red-400 text-xs uppercase font-bold mb-1">Total Defeitos</span>
                                <span className="text-2xl font-bold text-red-400 font-mono">{corte.qtdTotalDefeitos}</span>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-300 uppercase mb-3 border-b border-slate-700 pb-2">
                            Detalhamento por Tipo
                        </h3>

                        {corte.defeitosPorTipo && Object.keys(corte.defeitosPorTipo).length > 0 ? (
                            <div className="space-y-2">
                                {Object.entries(corte.defeitosPorTipo)
                                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                                    .map(([tipo, qtd]) => (
                                        <div key={tipo} className="flex justify-between items-center bg-slate-800/30 p-3 rounded border border-slate-700 hover:border-red-500/30 transition-colors">
                                            <span className="text-sm text-slate-300 uppercase font-medium">{tipo}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-red-400 font-bold font-mono">{qtd} un</span>
                                                <span className="text-xs text-slate-500 w-12 text-right">
                                                    {((Number(qtd) / corte.qtdTotalRecebida) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic text-center py-4">Nenhum tipo de defeito especificado.</p>
                        )}

                        {corte.observacoesRecebimento && (
                            <div className="mt-6 bg-slate-950 p-4 rounded border border-slate-800">
                                <h4 className="text-xs font-bold text-nexus-cyan uppercase mb-2">Observações</h4>
                                <p className="text-sm text-slate-400 font-mono whitespace-pre-wrap">{corte.observacoesRecebimento}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-4 border-t border-slate-700 bg-slate-950/50 flex flex-col md:flex-row justify-end gap-3">
                        <button
                            onClick={handleExportExcel}
                            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg"
                        >
                            <FileText size={16} /> Baixar Excel
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg"
                        >
                            <Download size={16} /> Baixar PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
