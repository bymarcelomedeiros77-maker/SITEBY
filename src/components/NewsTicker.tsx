import React, { useMemo } from 'react';
import { Corte, Faccao, CorteStatus } from '../types';
import { AlertCircle } from 'lucide-react';
import { calculateDaysOverdue } from '../utils/dateUtils';
import { isFaccaoCritical } from '../utils/alertUtils';
import { useApp } from '../context/AppContext';

interface NewsTickerProps {
    cortes: Corte[];
    faccoes: Faccao[];
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ cortes, faccoes }) => {
    const { metas } = useApp();

    const alerts = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const activeMeta = metas.find(m => m.isActive) || { maxDefectPercentage: 5 };

        const allAlerts: { message: string; priority: 'critical' | 'warning' | 'normal' }[] = [];

        // Check for critical defect rates
        faccoes.forEach(faccao => {
            const faccaoCortes = cortes.filter(c => c.faccaoId === faccao.id && c.status === CorteStatus.RECEBIDO);
            const received = faccaoCortes.reduce((a, b) => a + b.qtdTotalRecebida, 0);
            const defects = faccaoCortes.reduce((a, b) => a + b.qtdTotalDefeitos, 0);
            const percent = received > 0 ? (defects / received) * 100 : 0;

            if (received > 0 && isFaccaoCritical(percent, activeMeta.maxDefectPercentage)) {
                allAlerts.push({
                    message: `🔴 CRÍTICO: Facção ${faccao.name} com ${percent.toFixed(2)}% de defeitos (meta: ${activeMeta.maxDefectPercentage}%)`,
                    priority: 'critical'
                });
            }
        });

        // Find factions with late deliveries based on expected delivery date
        cortes.forEach(corte => {
            if (corte.status === CorteStatus.ENVIADO && corte.dataPrevistaRecebimento) {
                const daysOverdue = calculateDaysOverdue(corte.dataPrevistaRecebimento);

                if (daysOverdue > 0) {
                    const faccao = faccoes.find(f => f.id === corte.faccaoId);
                    if (faccao) {
                        allAlerts.push({
                            message: `⚠️ ALERTA: Facção ${faccao.name} - Ref. ${corte.referencia} - ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} de atraso`,
                            priority: 'warning'
                        });
                    }
                }
            }
        });

        if (allAlerts.length === 0) {
            return [{ message: '🎯 Sistema operando normalmente • Todas as facções em dia', priority: 'normal' as const }];
        }

        // Sort: critical first, then warnings
        return allAlerts.sort((a, b) => {
            if (a.priority === 'critical' && b.priority !== 'critical') return -1;
            if (a.priority !== 'critical' && b.priority === 'critical') return 1;
            return 0;
        });
    }, [cortes, faccoes, metas]);

    const hasCritical = alerts.some(a => a.priority === 'critical');

    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white overflow-hidden py-3 mb-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 pl-4">
                    <AlertCircle size={20} className={hasCritical ? 'animate-pulse' : 'animate-pulse'} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap inline-block">
                        {alerts.map((alert, idx) => (
                            <span key={idx} className={`inline-block px-8 font-medium text-sm uppercase tracking-wide ${alert.priority === 'critical' ? 'font-bold' : ''}`}>
                                {alert.message}
                            </span>
                        ))}
                        {/* Duplicate for seamless loop */}
                        {alerts.map((alert, idx) => (
                            <span key={`dup-${idx}`} className={`inline-block px-8 font-medium text-sm uppercase tracking-wide ${alert.priority === 'critical' ? 'font-bold' : ''}`}>
                                {alert.message}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
