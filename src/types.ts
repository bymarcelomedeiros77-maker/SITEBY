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
  active?: boolean; // Default true
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
  tamanho: string; // P, M, G
  quantidade: number;
}

export interface ItemCorte {
  cor: string;
  grade: TamanhoQuantidade[];
  quantidadeTotalCor: number;
  gradeRecebida?: TamanhoQuantidade[]; // Detailed quantities received for this specific color/size
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
  sincronizadoEm?: string; // ISO Date - When it was synced to stock
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

// --- MÓDULO ESTOQUE ---

export type ClienteCategoria = 'DIAMANTE' | 'OURO' | 'PRATA' | 'BRONZE' | 'INATIVO_90' | 'INATIVO_8M' | 'NUNCA_COMPROU' | 'CLIENTE_NOVO';

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  cpf_cnpj?: string; // CPF ou CNPJ
  contato: string;
  instagram?: string;
  dataNascimento?: string;
  cidade: string;
  estado?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  categoria: ClienteCategoria;
  status: 'ATIVO' | 'INATIVO';
  observacoes?: string;
  notas_internas?: string;
  tags?: string[];
  ultima_compra?: string;
  total_compras?: number;
  contagem_pedidos?: number;
  createdAt?: string;
}

export interface Produto {
  id: string;
  referencia: string;
  descricao: string;
  categoria?: string;
  ativo: boolean;
  createdAt?: string;
}

export interface Cor {
  id: string;
  nome: string;
  hex?: string;
}

export interface Tamanho {
  id: string;
  nome: string;
  ordem: number;
}

export interface Sku {
  id: string;
  produtoId: string;
  corId: string;
  tamanhoId: string;

  // Saldos
  saldoDisponivel: number;
  saldoReservado: number;
  saldoFisico: number;

  // Parâmetros
  estoqueMinimo: number;
  estoqueAlvo: number;

  // Joined fields (for easier UI access)
  produto?: Produto;
  cor?: Cor;
  tamanho?: Tamanho;
}

export type TipoMovimentacao =
  | 'ENTRADA_COMPRA'
  | 'ENTRADA_PRODUCAO'
  | 'ENTRADA_DEVOLUCAO'
  | 'SAIDA_VENDA'
  | 'SAIDA_EXPEDICAO' // Maybe duplicative of VENDA?
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'
  | 'RESERVA'
  | 'LIBERACAO_RESERVA';

export interface MovimentacaoEstoque {
  id: string;
  skuId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  dataMovimentacao: string;
  referenciaDocumento?: string;
  observacao?: string;
  usuarioId?: string;
}

export type PedidoStatus = 'ABERTO' | 'SEPARANDO' | 'EXPEDIDO' | 'CANCELADO';
export type PagamentoStatus = 'PENDENTE' | 'PAGO' | 'PARCIAL';

export interface PedidoItem {
  id?: string;
  pedidoId?: string;
  skuId: string;
  quantidade: number;

  // UI Helper
  sku?: Sku;
}

export type StatusProducao = 'PLANEJADO' | 'CORTE' | 'COSTURA' | 'ACABAMENTO' | 'FINALIZADO' | 'CANCELADO';

export interface OrdemProducao {
  id: string;
  numero: number;
  skuId: string;
  quantidade: number;
  status: StatusProducao;
  dataCriacao: string;
  dataInicio?: string;
  dataFim?: string;
  responsavel?: string;
  observacao?: string;
  sku?: Sku;
}

export interface Pedido {
  id: string;
  numero: number;
  clienteId: string;
  dataPedido: string;
  status: PedidoStatus;
  statusPagamento: PagamentoStatus;
  observacao?: string;
  itens: PedidoItem[];

  // Joined fields
  cliente?: Cliente;
}

export type StatusDevolucao = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CONCLUIDO';

export interface DevolucaoItem {
  id: string;
  devolucaoId: string;
  skuId: string;
  quantidade: number;
  sku?: Sku;
}

export interface Devolucao {
  id: string;
  numero: number;
  pedidoId: string;
  dataDevolucao: string;
  status: StatusDevolucao;
  motivo?: string;
  observacao?: string;
  usuarioId?: string;
  pedido?: Pedido;
  itens: DevolucaoItem[];
}

export type FichaTipo = 'FICHA_CORTE' | 'FICHA_TECNICA' | 'APONTAMENTO';

export interface FichaTecnica {
  id: string;
  titulo: string;
  tipo: FichaTipo;
  conteudo: any[]; // JSON array from Excel
  arquivoData?: string; // Base64 do arquivo original
  link?: string; // Link do Google Drive
  dataCriacao: string;
}

export interface RegraConsumo {
  id: string;
  referencia: string;
  tamanhoId?: string;
  consumoUnitario: number;
  tecidoNome?: string;
  tecidoComposicao?: string;
  tecidoLargura?: string;
  tecidoFornecedor?: string;
  tecidoCusto?: number;
  acessorios?: string;
  usuarioId?: string;
  createdAt: string;

  // Joined fields
  tamanho?: Tamanho;
}