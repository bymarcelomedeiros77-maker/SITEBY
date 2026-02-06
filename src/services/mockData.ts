import { User, UserRole, Faccao, FaccaoStatus, Corte, CorteStatus, DefectType, Meta } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Marcelo Medeiros',
    email: 'bymarcelomedeiros77@gmail.com',
    role: UserRole.ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Marcelo+Medeiros&background=06b6d4&color=fff',
    password: 'CreenDen_@By1426'
  }
];

// Lista de Facções atualizada conforme solicitação (Lista Real)
export const MOCK_FACCOES: Faccao[] = [
  { id: '1', name: 'Flávia', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '2', name: 'Joelma', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '3', name: 'Gabrielly', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '4', name: 'Carla', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '5', name: 'Vitória', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '6', name: 'Clecia', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '7', name: 'Kelly', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '8', name: 'Giselly', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '9', name: 'Edvania', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '10', name: 'Mayra', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '11', name: 'Elaine', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '12', name: 'Daiane', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '13', name: 'Bruna', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '14', name: 'Aparecida', status: FaccaoStatus.ATIVO, phone: '', observations: '' },
  { id: '15', name: 'Dulce', status: FaccaoStatus.INATIVO, phone: '', observations: '' }
];

// Lista de Defeitos categorizada
export const MOCK_DEFECT_TYPES: DefectType[] = [
  // COSTURA
  { name: "Costura torta", category: "COSTURA" },
  { name: "Ponto estourado", category: "COSTURA" },
  { name: "Ponto folgado (interlock)", category: "COSTURA" },
  { name: "Costura aberta lateral", category: "COSTURA" },
  { name: "Costura solta no abanhado", category: "COSTURA" },
  { name: "Costura Solta cintura", category: "COSTURA" },
  { name: "Pico de costura na frente", category: "COSTURA" },
  { name: "Encontro de custuras (ziper)", category: "COSTURA" },

  // ACABAMENTO
  { name: "Acabamento da custura mal feito", category: "ACABAMENTO" },
  { name: "Abanhado", category: "ACABAMENTO" },
  { name: "Remate do ziper", category: "ACABAMENTO" },
  { name: "Recorte do bolso", category: "ACABAMENTO" },
  { name: "Presponto", category: "ACABAMENTO" },
  { name: "Presponto Elastico", category: "ACABAMENTO" },
  { name: "Foro sem Interlork", category: "ACABAMENTO" },
  { name: "Sem Foro", category: "ACABAMENTO" },
  { name: "Com cola para refazer", category: "ACABAMENTO" },

  // MEDIDAS E ESTRUTURA
  { name: "Tamanho fora do padrao", category: "MEDIDAS" },
  { name: "Lateral estourado (interlock)", category: "ESTRUTURA" },
  { name: "Cós estourado ou comido", category: "ESTRUTURA" },
  { name: "Frente estourado", category: "ESTRUTURA" },
  { name: "Prega no ziper (final)", category: "ESTRUTURA" },
  { name: "Ziper ondulado", category: "ESTRUTURA" },
  { name: "Prega na cintura", category: "ESTRUTURA" },
  { name: "Pregas", category: "ESTRUTURA" },
  { name: "Gola", category: "ESTRUTURA" },
  { name: "Defeito na Manga", category: "ESTRUTURA" },

  // COMPONENTES / TECIDO
  { name: "Mancha no tecido", category: "TECIDO" },
  { name: "Peça cortada (pelo)", category: "TECIDO" },
  { name: "Falha no tecido para refazer", category: "TECIDO" },
  { name: "Defeito no tecido", category: "TECIDO" },
  { name: "Tecidos misturados", category: "TECIDO" },
  { name: "Elastecs", category: "AVIAMENTOS" },
  { name: "Sem Elastico", category: "AVIAMENTOS" },

].map((item, index) => ({ id: (index + 1).toString(), name: item.name, category: item.category }));

export const MOCK_METAS: Meta[] = [
  { id: '1', name: 'Padrão 2024', maxDefectPercentage: 5, isActive: true }
];

export const MOCK_CORTES: Corte[] = [];