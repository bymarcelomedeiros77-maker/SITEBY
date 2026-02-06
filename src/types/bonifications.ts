/**
 * Bonification System Types
 * IMPORTANTE: Sistema em desenvolvimento - aguardando definição de regras de negócio
 */

export enum BonusType {
    META_ACHIEVEMENT = 'META_ACHIEVEMENT', // Bonificação por atingir meta de qualidade
    QUALITY_EXCELLENCE = 'QUALITY_EXCELLENCE', // Excelência em qualidade
    VOLUME_BONUS = 'VOLUME_BONUS' // Bônus por volume de produção
}

export enum BonusStatus {
    PENDING = 'PENDING', // Aguardando aprovação do admin
    APPROVED = 'APPROVED', // Aprovado pelo admin
    PAID = 'PAID', // Pago
    CANCELLED = 'CANCELLED' // Cancelado
}

export interface FaccaoBonification {
    id: string;
    faccaoId: string;
    bonusType: BonusType;
    amount?: number; // Valor do bônus (se monetário)
    description: string;
    earnedAt: string; // ISO Date
    status: BonusStatus;
    approvedBy?: string; // User ID do admin que aprovou
    approvedAt?: string; // ISO Date
    notes?: string;
}

/**
 * Configuração de Metas de Bonificação (para uso futuro no admin)
 * TODO: Implementar painel de configuração no admin
 */
export interface BonusConfiguration {
    id: string;
    name: string; // Nome da configuração de meta
    defectThreshold: number; // Percentual máximo de defeito para bônus
    minVolume?: number; // Volume mínimo de peças produzidas
    bonusAmount: number; // Valor do bônus
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
