import { supabase } from './supabase';
import {
    User, Faccao, Corte, DefectType, Meta, LogEntry,
    Cliente, Produto, Cor, Tamanho, Sku, Pedido, MovimentacaoEstoque,
    OrdemProducao, Devolucao, FichaTecnica, RegraConsumo,
    PedidoItem, DevolucaoItem
} from '../types';

export interface SystemBackup {
    version: string;
    timestamp: string;
    data: {
        users: any[];
        faccoes: any[];
        cortes: any[];
        defectTypes: any[];
        metas: any[];
        logs: any[];
        clientes: any[];
        produtos: any[];
        cores: any[];
        tamanhos: any[];
        skus: any[];
        pedidos: any[];
        pedidoItens: any[];
        producao: any[]; // Table: ordens_producao
        devolucoes: any[];
        devolucaoItens: any[];
        movimentacoes: any[];
        fichas: any[];
        regrasConsumo: any[];
    };
}

export const backupService = {
    /**
     * Gera um objeto contendo todos os dados do sistema.
     */
    async createBackup(): Promise<SystemBackup> {
        try {
            // Helper para buscar todos os dados de uma tabela
            const fetchTable = async (table: string) => {
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw new Error(`Erro ao fazer backup de ${table}: ${error.message}`);
                return data || [];
            };

            // Executa fetches em paralelo para tabelas independentes, mas sequencial onde importa
            // Para simplificar e evitar timeout, vamos fazer em grupos ou tudo junto via Promise.all
            // Supabase pode limitar conexões, mas para essas tabelas deve ser ok.

            const [
                users, faccoes, cortes, defectTypes, metas, logs,
                clientes, produtos, cores, tamanhos, skus,
                pedidos, pedidoItens, producao,
                devolucoes, devolucaoItens, movimentacoes,
                fichas, regrasConsumo
            ] = await Promise.all([
                fetchTable('users'), // Perfis públicos
                fetchTable('faccoes'),
                fetchTable('cortes'),
                fetchTable('defect_types'),
                fetchTable('metas'),
                fetchTable('logs'),
                fetchTable('clientes'),
                fetchTable('produtos'),
                fetchTable('cores'),
                fetchTable('tamanhos'),
                fetchTable('skus'),
                fetchTable('pedidos'),
                fetchTable('pedido_itens'), // Precisamos garantir que pegamos os itens
                fetchTable('ordens_producao'),
                fetchTable('devolucoes'),
                fetchTable('devolucao_itens'),
                fetchTable('movimentacoes_estoque'),
                fetchTable('fichas_tecnicas'),
                fetchTable('regras_consumo')
            ]);

            return {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data: {
                    users, faccoes, cortes, defectTypes, metas, logs,
                    clientes, produtos, cores, tamanhos, skus,
                    pedidos, pedidoItens, producao,
                    devolucoes, devolucaoItens, movimentacoes,
                    fichas, regrasConsumo
                }
            };
        } catch (error: any) {
            console.error('Erro ao criar backup:', error);
            throw error;
        }
    },

    /**
     * Restaura o sistema a partir de um objeto de backup.
     * ATENÇÃO: Isso apaga os dados atuais (limpeza) antes de inserir.
     */
    async restoreBackup(backup: SystemBackup): Promise<void> {
        const { data } = backup;

        // Lista de tabelas em ordem de dependência (do mais dependente para o menos dependente) para DELEÇÃO
        // DevolucaoItens -> Devolucoes -> PedidoItens -> Pedidos -> Movimentacoes -> Producao -> Skus
        // Cortes -> Regras -> Fichas -> Metas -> DefectTypes -> Faccoes -> Tamanhos -> Cores -> Produtos -> Clientes -> Users

        // NOTA: Users não será deletado completamente para não quebrar a sessão atual, faremos upsert.
        // As outras tabelas serão limpas.

        const deleteTable = async (table: string) => {
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using neq id 0 is a hack to delete all if no where clause allowed without restriction, but supabase js allows delete without filter usually? No, it requires filter. neq id 0 works usually)
            // Melhor: .gt('id', '00000000-0000-0000-0000-000000000000') uuid min.
            // Ou .not('id', 'is', null) se 'id' não for null
            if (error) {
                console.warn(`Erro ao limpar tabela ${table}:`, error);
                // Não lançar erro imediatamente, tentar continuar? Não, integridade é chave.
                throw new Error(`Erro ao limpar tabela ${table}: ${error.message}`);
            }
        };

        // Validação básica
        if (!data.users || !data.produtos || !data.skus) {
            throw new Error("Arquivo de backup inválido ou incompleto.");
        }

        try {
            console.log("Iniciando restauração...");

            // 1. Limpeza (Ordem Reversa)
            // Nível 5
            await deleteTable('devolucao_itens');

            // Nível 4
            await deleteTable('devolucoes');
            await deleteTable('pedido_itens');

            // Nível 3
            // Movimentacoes pode estar ligado a SKUs, Users. 
            await deleteTable('movimentacoes_estoque');
            await deleteTable('ordens_producao'); // ou ordens_producao
            await deleteTable('pedidos');

            // Nível 2
            await deleteTable('skus');
            await deleteTable('cortes');
            await deleteTable('regras_consumo');

            // Nível 1 & Independentes
            await deleteTable('fichas_tecnicas');
            await deleteTable('metas');
            await deleteTable('defect_types');
            await deleteTable('faccoes'); // Cortes depende de faccoes
            await deleteTable('tamanhos');
            await deleteTable('cores');
            await deleteTable('produtos');
            await deleteTable('clientes');
            await deleteTable('logs');

            // Users: Não deletamos.

            // 2. Inserção (Ordem Direta)
            // Helper para inserir em lotes se necessário, mas aqui vamos tentar insert simples
            const insertTable = async (table: string, rows: any[]) => {
                if (!rows || rows.length === 0) return;
                // Remove properties that might cause issues if they don't exist in schema anymore?
                // Assuming strict schema match.
                const { error } = await supabase.from(table).upsert(rows); // Upsert is safer
                if (error) throw new Error(`Erro ao restaurar ${table}: ${error.message}`);
            };

            console.log("Limpou tudo. Inserindo...");

            // Nível 0: Users (Upsert)
            await insertTable('users', data.users);

            // Nível 1: Cadastros Básicos
            await insertTable('clientes', data.clientes);
            await insertTable('produtos', data.produtos);
            await insertTable('cores', data.cores);
            await insertTable('tamanhos', data.tamanhos);
            await insertTable('faccoes', data.faccoes);
            await insertTable('defect_types', data.defectTypes);
            await insertTable('metas', data.metas);
            await insertTable('logs', data.logs);

            // Nível 2: Dependentes de Nível 1
            await insertTable('fichas_tecnicas', data.fichas);
            await insertTable('regras_consumo', data.regrasConsumo);
            await insertTable('cortes', data.cortes);
            await insertTable('skus', data.skus);

            // Nível 3: Dependentes de Nível 2
            await insertTable('pedidos', data.pedidos);
            await insertTable('ordens_producao', data.producao); // Check table name
            await insertTable('movimentacoes_estoque', data.movimentacoes);

            // Nível 4: Itens
            await insertTable('pedido_itens', data.pedidoItens);
            await insertTable('devolucoes', data.devolucoes);

            // Nível 5
            await insertTable('devolucao_itens', data.devolucaoItens);

            console.log("Restauração concluída.");

        } catch (error: any) {
            console.error("Falha crítica na restauração:", error);
            throw error;
        }
    }
};
