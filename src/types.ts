export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  password?: string;
}

export enum FaccaoStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO'
}

/**
 * Facção (Supplier/Partner)
 * Represents a manufacturing partner in the production network
 */
export interface Faccao {
  id: string;
  name: string;
  phone: string;
  observations: string;
  status: FaccaoStatus;
  createdAt: string; // ISO Date - Registration/activation date
}

export enum CorteStatus {
  ENVIADO = 'ENVIADO',
  RECEBIDO = 'RECEBIDO',
  PENDENTE = 'PENDENTE' // Partially received or issue
}

export interface TamanhoQuantidade {
  tamanho: string; // P, M, G, GG
  quantidade: number;
}

export interface ItemCorte {
  cor: string;
  grade: TamanhoQuantidade[];
  quantidadeTotalCor: number;
}

export interface Corte {
  id: string;
  referencia: string;
  faccaoId: string;
  dataEnvio: string; // ISO Date
  dataPrevistaRecebimento: string; // ISO Date - Calculated based on send date
  dataRecebimento?: string; // ISO Date
  status: CorteStatus;

  // Detalhes do envio (Agora suporta múltiplas cores)
  itens: ItemCorte[];

  qtdTotalEnviada: number;
  observacoesEnvio?: string;

  // Detalhes do recebimento
  qtdTotalRecebida: number;
  qtdTotalDefeitos: number;
  defeitosPorTipo: Record<string, number>; // { "Mancha": 2, "Furo": 1, "Novo Defeito Manual": 5 }
  observacoesRecebimento?: string;
}

export interface DefectType {
  id: string;
  name: string;
  category: string; // Nova propriedade
}

export interface Meta {
  id: string;
  name: string;
  maxDefectPercentage: number; // e.g., 5 for 5%
  isActive: boolean;
}

export interface LogEntry {
  id: string;
  entityId: string; // ID da Facção ou Corte
  entityType: 'FACCAO' | 'CORTE';
  action: 'CRIACAO' | 'EDICAO' | 'STATUS' | 'EXCLUSAO';
  details: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalFaccoes: number;
  cortesEnviados: number;
  cortesRecebidos: number;
  pecasRecebidas: number;
  pecasDefeito: number;
  percentualGeralDefeito: number;
  faccoesNaMeta: number;
  faccoesForaMeta: number;
}