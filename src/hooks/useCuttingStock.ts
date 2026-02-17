import { useMemo, useState } from 'react';
import { Sku, OrdemProducao } from '../types';

interface UseCuttingStockProps {
    skus: Sku[];
    producao: OrdemProducao[];
}

export const useCuttingStock = ({ skus, producao }: UseCuttingStockProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'LOW' | 'OK'>('ALL');

    // --- Lógica de Agregação (Planejamento) ---
    const aggregatedStock = useMemo(() => {
        const refs = new Map<string, {
            referencia: string;
            totalDisponivel: number;
            totalMinimo: number;
            totalAlvo: number;
            itens: any[];
            status: 'LOW' | 'OK';
        }>();

        skus.forEach(sku => {
            const ref = sku.produto?.referencia || 'SEM REF';
            const existing = refs.get(ref) || {
                referencia: ref,
                totalDisponivel: 0,
                totalMinimo: 0,
                totalAlvo: 0,
                itens: [],
                status: 'OK'
            };

            existing.totalDisponivel += sku.saldoDisponivel;
            existing.totalMinimo += sku.estoqueMinimo;
            existing.totalAlvo += sku.estoqueAlvo;
            existing.itens.push(sku);

            if (existing.totalDisponivel < existing.totalMinimo) {
                existing.status = 'LOW';
            }

            refs.set(ref, existing);
        });

        return Array.from(refs.values());
    }, [skus]);

    const plannedOps = useMemo(() => {
        return producao.filter(op => op.status === 'PLANEJADO');
    }, [producao]);

    const filteredStock = useMemo(() => {
        return aggregatedStock.filter(s => {
            const matchesSearch = s.referencia.toLowerCase().includes(searchTerm.toLowerCase());
            if (filterType === 'LOW') return matchesSearch && s.status === 'LOW';
            if (filterType === 'OK') return matchesSearch && s.status === 'OK';
            return matchesSearch;
        });
    }, [aggregatedStock, searchTerm, filterType]);

    return {
        aggregatedStock,
        plannedOps,
        filteredStock,
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType
    };
};
