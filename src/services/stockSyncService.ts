import { SupabaseClient } from '@supabase/supabase-js';
import { Corte, Sku, Produto, Cor, Tamanho, CorteStatus } from '../types';

interface SyncResult {
    success: boolean;
    message: string;
    details?: string;
}

export class StockSyncService {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Sincroniza um Corte Recebido com o Estoque.
     * Cria Produtos, Cores, Tamanhos e SKUs se necessário.
     * Adiciona saldo aos SKUs.
     */
    async syncCorteToStock(
        corte: Corte,
        produtos: Produto[],
        cores: Cor[],
        tamanhos: Tamanho[],
        skus: Sku[],
        adjustStockFn: (skuId: string, qtd: number, tipo: string, obs: string, skipRefresh?: boolean) => Promise<boolean>,
        refreshDataFn: () => Promise<void>
    ): Promise<SyncResult> {
        try {
            console.log(`[StockSync] Iniciando sincronia do corte ${corte.referencia}...`);

            // 0. Verificações de Segurança
            if (corte.sincronizadoEm) {
                return { success: false, message: `Corte já sincronizado em ${new Date(corte.sincronizadoEm).toLocaleDateString()}.` };
            }

            // 1. Cálculo de Peças Boas
            const pecasBoasTotal = corte.qtdTotalRecebida - corte.qtdTotalDefeitos;
            if (pecasBoasTotal <= 0) {
                return { success: true, message: "Todas as peças são defeituosas. Nada a processar no estoque." };
            }

            const proporcaoBoas = pecasBoasTotal / corte.qtdTotalRecebida;

            // 2. Encontrar ou Criar Produto
            let produto = produtos.find(p => p.referencia.trim().toUpperCase() === corte.referencia.trim().toUpperCase());

            if (!produto) {
                console.log(`[StockSync] Produto ${corte.referencia} não encontrado. Criando...`);
                const newProdRef = corte.referencia.trim().toUpperCase();
                const { data: newProd, error: newProdError } = await this.supabase.from('produtos').insert({
                    referencia: newProdRef,
                    descricao: `Produto Importado (Ref: ${newProdRef})`,
                    categoria: 'GERAL'
                }).select().single();

                if (newProdError || !newProd) {
                    return { success: false, message: `Erro ao criar produto: ${newProdError?.message}` };
                }
                produto = newProd;
            }

            // 3. Planejamento da Distribuição
            let distributedCount = 0;
            const distributionPlan: { skuId: string, qtd: number, sizeName: string }[] = [];

            // Caches locais para evitar round-trips excessivos
            const localCores: Record<string, Cor> = {};
            const localTamanhos: Record<string, Tamanho> = {};

            for (const item of corte.itens) {
                const corNome = item.cor.trim();

                // Encontrar/Criar Cor
                let cor = cores.find(c => c.nome.trim().toLowerCase() === corNome.toLowerCase()) || localCores[corNome.toLowerCase()];

                if (!cor) {
                    // Verificar DB diretamente
                    const { data: existingCor } = await this.supabase.from('cores').select('*').ilike('nome', corNome).single();
                    if (existingCor) {
                        cor = existingCor;
                    } else {
                        // Criar Cor
                        const { data: newCor } = await this.supabase.from('cores').insert({ nome: corNome }).select().single();
                        if (newCor) {
                            cor = newCor;
                            localCores[corNome.toLowerCase()] = newCor;
                            // Devemos atualizar a lista local 'cores' se possível, mas aqui estamos num serviço
                        }
                    }
                }

                if (cor && item.gradeRecebida) {
                    for (const g of item.gradeRecebida) {
                        if (g.quantidade > 0) {
                            const tamNome = g.tamanho.trim();

                            // Encontrar/Criar Tamanho
                            let tamanho = tamanhos.find(t => t.nome.trim().toUpperCase() === tamNome.toUpperCase()) || localTamanhos[tamNome.toUpperCase()];

                            if (!tamanho) {
                                const { data: existingTam } = await this.supabase.from('tamanhos').select('*').ilike('nome', tamNome).single();
                                if (existingTam) {
                                    tamanho = existingTam;
                                } else {
                                    // Criar Tamanho
                                    const { data: newTam } = await this.supabase.from('tamanhos').insert({ nome: tamNome.toUpperCase(), ordem: 99 }).select().single();
                                    if (newTam) {
                                        tamanho = newTam;
                                        localTamanhos[tamNome.toUpperCase()] = newTam;
                                    }
                                }
                            }

                            if (tamanho && produto) {
                                // Encontrar/Criar SKU
                                const skuId = await this.findOrCreateSku(produto.id, cor.id, tamanho.id);

                                if (skuId) {
                                    // Lógica de Distribuição: Floor primeiro
                                    const qtdBoaProv = Math.floor(g.quantidade * proporcaoBoas);

                                    if (qtdBoaProv > 0) {
                                        distributionPlan.push({ skuId, qtd: qtdBoaProv, sizeName: g.tamanho });
                                        distributedCount += qtdBoaProv;
                                    } else if (pecasBoasTotal > 0 && g.quantidade > 0) {
                                        // Manter rastreio para distribuição de sobras
                                        distributionPlan.push({ skuId, qtd: 0, sizeName: g.tamanho });
                                    }
                                } else {
                                    console.error(`[StockSync] Falha ao obter/criar SKU para Ref ${corte.referencia}`);
                                }
                            }
                        }
                    }
                }
            }

            // 4. Distribuição das Sobras (Arredondamento)
            let remainder = pecasBoasTotal - distributedCount;

            if (remainder > 0 && distributionPlan.length > 0) {
                // Round-robin simples para sobras
                for (let i = 0; i < remainder; i++) {
                    const target = distributionPlan[i % distributionPlan.length];
                    target.qtd += 1;
                }
            }

            // 5. Execução (Atualização de Saldo)
            let totalAdded = 0;
            for (const plan of distributionPlan) {
                if (plan.qtd > 0) {
                    const success = await adjustStockFn(plan.skuId, plan.qtd, 'ENTRADA_PRODUCAO', `Sync Manual Corte ${corte.referencia}`, true);
                    if (success) totalAdded += plan.qtd;
                }
            }

            // 6. Marcar como Sincronizado
            const now = new Date().toISOString();
            const { error: syncError } = await this.supabase.from('cortes').update({ sincronizado_em: now }).eq('id', corte.id);

            if (syncError) {
                console.warn("[StockSync] Erro ao marcar sincronizado_em. Usando fallback.", syncError);
                const newObs = (corte.observacoesRecebimento || '') + ` [SYNCED:${now}]`;
                await this.supabase.from('cortes').update({ observacoes_recebimento: newObs }).eq('id', corte.id);
            }

            await refreshDataFn();
            return { success: true, message: `Sincronizado com sucesso! ${totalAdded} peças adicionadas.` };

        } catch (error: any) {
            console.error("[StockSync] Erro Fatal:", error);
            return { success: false, message: `Erro ao importar: ${error.message}` };
        }
    }

    async revertCorteSync(
        corte: Corte,
        produtos: Produto[],
        cores: Cor[],
        tamanhos: Tamanho[],
        skus: Sku[],
        adjustStockFn: (skuId: string, qtd: number, tipo: string, obs: string, skipRefresh?: boolean) => Promise<boolean>,
        refreshDataFn: () => Promise<void>
    ): Promise<SyncResult> {
        try {
            console.log(`[StockSync] Estornando estoque do corte ${corte.referencia}...`);
            const produto = produtos.find(p => p.referencia.trim().toUpperCase() === corte.referencia.trim().toUpperCase());

            if (produto) {
                for (const item of corte.itens) {
                    const cor = cores.find(c => c.nome.trim().toLowerCase() === item.cor.trim().toLowerCase());
                    // Fallback: usa gradeRecebida se disponível, senão usa grade original
                    const gradeParaEstorno = item.gradeRecebida || item.grade || [];
                    if (cor && gradeParaEstorno.length > 0) {
                        for (const g of gradeParaEstorno) {
                            if (g.quantidade > 0) {
                                const tamanho = tamanhos.find(t => t.nome.trim().toUpperCase() === g.tamanho.trim().toUpperCase());
                                if (tamanho) {
                                    const sku = skus.find(s => s.produtoId === produto!.id && s.corId === cor!.id && s.tamanhoId === tamanho!.id);
                                    if (sku) {
                                        await adjustStockFn(sku.id, g.quantidade, 'AJUSTE_NEGATIVO', `Estorno Recebimento Corte ${corte.referencia}`, true);
                                    } else {
                                        console.warn(`[StockSync] SKU não encontrado para estorno: ${produto.referencia} ${cor.nome} ${tamanho.nome}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Remover flag de sincronizado
            await this.supabase.from('cortes').update({ sincronizado_em: null }).eq('id', corte.id);

            await refreshDataFn();
            return { success: true, message: "Estorno realizado com sucesso." };
        } catch (error: any) {
            console.error("[StockSync] Erro no Estorno:", error);
            return { success: false, message: `Erro ao estornar: ${error.message}` };
        }
    }

    /**
     * Auxiliar para garantir existência do SKU
     */
    private async findOrCreateSku(produtoId: string, corId: string, tamanhoId: string): Promise<string | null> {
        try {
            // 1. Check DB
            const { data: existing } = await this.supabase
                .from('skus')
                .select('id')
                .eq('produto_id', produtoId)
                .eq('cor_id', corId)
                .eq('tamanho_id', tamanhoId)
                .single();

            if (existing) return existing.id;

            // 2. Create
            const { data, error } = await this.supabase.from('skus').insert({
                produto_id: produtoId,
                cor_id: corId,
                tamanho_id: tamanhoId,
                saldo_disponivel: 0,
                saldo_reservado: 0,
                saldo_fisico: 0
            }).select().single();

            if (error) throw error;
            return data.id;
        } catch (err) {
            console.error("[StockSync] Erro SKU:", err);
            return null;
        }
    }
}
