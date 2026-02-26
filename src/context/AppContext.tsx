import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { debounce } from '../utils/performance';
import {
  User, Faccao, Corte, DefectType, Meta, UserRole, CorteStatus, FaccaoStatus, LogEntry,
  Cliente, Produto, Cor, Tamanho, Sku, Pedido, MovimentacaoEstoque, OrdemProducao, StatusProducao, Devolucao,
  FichaTecnica, FichaTipo, RegraConsumo, Colecao, CompraCampanha, FinancialEntry, Supplier
} from '../types';
import { Toast, ToastType } from '../components/ToastNotification';
import { supabase } from '../services/supabase';
import { comparePassword } from '../utils/hashUtils';
import { mapSupabaseResponse, mapToSupabase } from '../utils/dataMappers';
import { StockSyncService } from '../services/stockSyncService';
import { useConfirm, ConfirmOptions } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { backupService, SystemBackup } from '../services/backupService';

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;

  // Existing
  faccoes: Faccao[];
  cortes: Corte[];
  defectTypes: DefectType[];
  metas: Meta[];
  logs: LogEntry[];
  allUsers: User[];

  // Stock Module
  clientes: Cliente[];
  produtos: Produto[];
  cores: Cor[];
  tamanhos: Tamanho[];
  skus: Sku[];
  pedidos: Pedido[];
  producao: OrdemProducao[];
  devolucoes: Devolucao[];
  movimentacoes: MovimentacaoEstoque[];
  // Fichas & Regras
  fichas: FichaTecnica[];
  regrasConsumo: RegraConsumo[];

  // Melhorias Webpic
  isStockLoading: boolean;
  colecoes: Colecao[];
  comprasCampanha: CompraCampanha[];
  financialEntries: FinancialEntry[];
  suppliers: Supplier[];

  // Cliente Actions
  addCliente: (cliente: Omit<Cliente, 'id'>) => Promise<any>;
  updateCliente: (cliente: Cliente) => Promise<void>;

  // Actions
  fetchUsers: () => Promise<void>;
  addPedido: (pedido: Omit<Pedido, 'id' | 'numero' | 'cliente'>) => Promise<boolean>;
  updatePedidoStatus: (pedidoId: string, newStatus: Pedido['status']) => Promise<boolean>;
  addOrdemProducao: (op: Omit<OrdemProducao, 'id' | 'numero' | 'dataCriacao'>) => Promise<boolean>;
  updateStatusProducao: (opId: string, newStatus: StatusProducao) => Promise<boolean>;
  adjustStock: (skuId: string, quantidade: number, tipo: string, observacao?: string, skipRefresh?: boolean) => Promise<boolean>;
  addDevolucao: (devolucao: Omit<Devolucao, 'id' | 'numero' | 'dataDevolucao' | 'status'>, itens: { skuId: string, quantidade: number }[]) => Promise<boolean>;
  addFicha: (ficha: Omit<FichaTecnica, 'id' | 'dataCriacao'>) => Promise<FichaTecnica | null>;
  deleteFicha: (id: string) => Promise<boolean>;

  // Regras de Consumo Actions
  addRegraConsumo: (regra: Omit<RegraConsumo, 'id' | 'createdAt'>) => Promise<boolean>;
  updateRegraConsumo: (regra: RegraConsumo) => Promise<boolean>;
  deleteRegraConsumo: (id: string) => Promise<boolean>;

  // Danger Zone
  resetStock: () => Promise<boolean>;
  deleteProduto: (id: string) => Promise<boolean>;
  syncCorteToStock: (corteId: string) => Promise<{ success: boolean; message: string }>;

  // Backup & Restore
  backupSystem: () => Promise<SystemBackup | null>;
  restoreSystem: (backup: SystemBackup) => Promise<boolean>;

  // Toast System
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;

  // Global Confirm Dialog
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Existing State
  const [faccoes, setFaccoes] = useState<Faccao[]>([]);
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [defectTypes, setDefectTypes] = useState<DefectType[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Stock Module State
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [producao, setProducao] = useState<OrdemProducao[]>([]);
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [regrasConsumo, setRegrasConsumo] = useState<RegraConsumo[]>([]);

  const [fichas, setFichas] = useState<FichaTecnica[]>([]);

  // Melhorias Webpic State
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [colecoes, setColecoes] = useState<Colecao[]>([]);
  const [comprasCampanha, setComprasCampanha] = useState<CompraCampanha[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Toast System
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Confirm System
  const { confirm, confirmState, closeDialog } = useConfirm();

  const addToast = (type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, type, message, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const stockService = new StockSyncService(supabase);

  // Cache system for better performance
  const cacheRef = React.useRef({
    timestamp: 0,
    stockTimestamp: 0,
    TTL: 30000 // 30 seconds
  });

  // Presence Heartbeat
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
    };

    updatePresence(); // Initial call
    const interval = setInterval(updatePresence, 60000); // Every minute

    return () => clearInterval(interval);
  }, [user]);

  // Load User from Local Storage on mount and fetch initial data
  useEffect(() => {
    const initializeApp = async () => {
      // Set a safety timeout to force loading to false after 5 seconds
      const safetyTimeout = setTimeout(() => {
        console.warn("Safety timeout triggered: Forcing app load.");
        setIsLoading(false);
      }, 5000);

      try {
        const storedUser = localStorage.getItem('by_marcelo_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          // 1. Fetch Essentials (High Priority)
          try {
            await fetchData(); // Faccoes, Cortes, etc.
            setIsLoading(false); // <--- UNBLOCK UI HERE
          } catch (e) {
            console.error("Essential fetch failed:", e);
          }

          // 2. Fetch Stock (Background)
          try {
            fetchStockData();
          } catch (e) {
            console.error("Stock background fetch failed:", e);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
      } finally {
        clearTimeout(safetyTimeout);
      }
    };

    initializeApp();
  }, []);

  // Security Check: Force logout if user is deactivated
  // Polls database every 4 seconds to ensure immediate lockout
  useEffect(() => {
    if (!user) return;

    const checkUserStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('active, role')
          .eq('id', user.id)
          .single();

        if (error || !data) return;

        // If active equals false (explicitly), force logout
        if (data.active === false) {
          console.warn("User deactivated by admin. Forcing logout.");
          addToast('error', 'Sua conta foi desativada pelo administrador.');
          logout();
        }

        // Optional: Also check if role changed and update it? 
        // For now, focusing on active status.
      } catch (err) {
        console.error("Security check failed", err);
      }
    };

    const intervalId = setInterval(checkUserStatus, 60000); // Check every 60 seconds

    // Initial check
    checkUserStatus();

    return () => clearInterval(intervalId);
  }, [user]);

  const fetchDataAll = async () => {
    // Parallel fetch for manual refreshes
    await Promise.all([
      fetchData(),
      fetchStockData()
    ]);
  };

  // Fetch Data from Supabase (Optimized with Parallel Queries)
  const fetchData = async () => {
    console.time('fetchData');

    // Parallel fetch for all core data
    const [
      { data: faccoesData },
      { data: cortesData },
      { data: defectsData },
      { data: metasData },
      { data: logsData },
      { data: usersData }
    ] = await Promise.all([
      supabase.from('faccoes').select('*').order('name', { ascending: true }),
      supabase.from('cortes').select('*').order('data_envio', { ascending: false }),
      supabase.from('defect_types').select('*').order('name'),
      supabase.from('metas').select('*'),
      supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(50),
      supabase.from('users').select('*').order('name')
    ]);

    if (faccoesData) setFaccoes(mapSupabaseResponse<Faccao[]>(faccoesData));
    if (cortesData) {
      const cortesComItens = cortesData.map((c: any) => ({ ...c, itens: c.itens || [] }));
      setCortes(mapSupabaseResponse<Corte[]>(cortesComItens));
    }
    if (defectsData) setDefectTypes(defectsData as DefectType[]);
    if (metasData) setMetas(mapSupabaseResponse<Meta[]>(metasData));
    if (logsData) setLogs(mapSupabaseResponse<LogEntry[]>(logsData));
    if (usersData) setAllUsers(usersData as User[]);

    cacheRef.current.timestamp = Date.now();
    console.timeEnd('fetchData');
  };

  // Fetch Stock Data (Optimized)
  const fetchStockData = async () => {
    console.time('fetchStockData');
    setIsStockLoading(true);
    try {
      // Parallelize all data fetches
      // Parallelize all data fetches with allSettled to prevent total failure
      const results = await Promise.allSettled([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('produtos').select('*').order('referencia'),
        supabase.from('cores').select('*').order('nome'),
        supabase.from('tamanhos').select('*').order('ordem'),
        supabase.from('skus').select('*'),
        supabase.from('regras_consumo').select('*'),
        supabase.from('fichas_tecnicas').select('*'),
        supabase.from('movimentacoes_estoque').select('*').order('data_movimentacao', { ascending: false }).limit(200),
        // Heavy Data
        supabase.from('pedidos').select('*').order('data_pedido', { ascending: false }).limit(200),
        supabase.from('pedido_itens').select('*'),
        supabase.from('ordens_producao').select('*').order('data_criacao', { ascending: false }).limit(200),
        supabase.from('devolucoes').select('*').order('data_devolucao', { ascending: false }).limit(100),
        supabase.from('devolucao_itens').select('*'),
        // Novas Tabelas Webpic
        supabase.from('colecoes').select('*').order('nome'),
        supabase.from('compras_campanha').select('*'),
        supabase.from('financial_entries').select('*').order('data', { ascending: false }),
        supabase.from('suppliers').select('*').order('nome')
      ]);

      const getResult = (index: number) => {
        const result = results[index];
        if (result.status === 'fulfilled' && result.value.data) {
          return result.value.data;
        }
        if (result.status === 'rejected') {
          console.error(`Fetch error at index ${index}:`, result.reason);
        }
        return null;
      };

      const clientesData = getResult(0);
      const produtosData = getResult(1);
      const coresData = getResult(2);
      const tamanhosData = getResult(3);
      const skusData = getResult(4);
      const regrasData = getResult(5);
      const fichasData = getResult(6);
      const movsData = getResult(7);
      const pedidosData = getResult(8);
      const pedidoItensData = getResult(9);
      const producaoData = getResult(10);
      const devolucoesData = getResult(11);
      const devolucaoItensData = getResult(12);

      // Process Basic Data
      let mappedClientes: Cliente[] = [];
      if (clientesData) {
        mappedClientes = clientesData.map((c: any) => ({
          ...c,
          dataNascimento: c.data_nascimento
        }));
        setClientes(mappedClientes);
      }
      if (produtosData) setProdutos(produtosData as Produto[]);
      if (coresData) setCores(coresData as Cor[]);
      if (tamanhosData) setTamanhos(tamanhosData as Tamanho[]);

      // Process SKUs & Create Map
      let mappedSkus: Sku[] = [];
      if (skusData && produtosData && coresData && tamanhosData) {
        mappedSkus = skusData.map((s: any) => {
          const produto = produtosData.find((p: any) => p.id === s.produto_id);
          const cor = coresData.find((c: any) => c.id === s.cor_id);
          const tamanho = tamanhosData.find((t: any) => t.id === s.tamanho_id);

          return {
            id: s.id,
            produtoId: s.produto_id,
            corId: s.cor_id,
            tamanhoId: s.tamanho_id,
            saldoDisponivel: s.saldo_disponivel,
            saldoReservado: s.saldo_reservado,
            saldoFisico: s.saldo_fisico,
            estoqueMinimo: s.estoque_minimo,
            estoqueAlvo: s.estoque_alvo,
            produto,
            cor,
            tamanho
          };
        });
        setSkus(mappedSkus);
      }

      // Process Pedidos
      if (pedidosData && pedidoItensData) {
        const mappedPedidos = pedidosData.map((p: any) => {
          const cliente = mappedClientes.find(c => c.id === p.cliente_id);
          const itens = pedidoItensData
            .filter((i: any) => i.pedido_id === p.id)
            .map((i: any) => ({
              id: i.id,
              pedidoId: i.pedido_id,
              skuId: i.sku_id,
              quantidade: i.quantidade,
              sku: mappedSkus.find(s => s.id === i.sku_id)
            }));

          return {
            id: p.id,
            numero: p.numero,
            clienteId: p.cliente_id,
            dataPedido: p.data_pedido,
            status: p.status,
            statusPagamento: p.status_pagamento,
            observacao: p.observacao,
            itens,
            cliente
          };
        });
        setPedidos(mappedPedidos);
      }

      // Process Producao
      if (producaoData) {
        const mappedProducao = producaoData.map((p: any) => ({
          id: p.id,
          numero: p.numero,
          skuId: p.sku_id,
          quantidade: p.quantidade,
          status: p.status,
          dataCriacao: p.data_criacao,
          dataInicio: p.data_inicio,
          dataFim: p.data_fim,
          responsavel: p.responsavel,
          observacao: p.observacao,
          sku: mappedSkus.find(s => s.id === p.sku_id)
        }));
        setProducao(mappedProducao);
      }

      // Process Devolucoes
      if (devolucoesData && devolucaoItensData) {
        const mappedDevolucoes = devolucoesData.map((d: any) => {
          const itens = devolucaoItensData
            .filter((i: any) => i.devolucao_id === d.id)
            .map((i: any) => ({
              id: i.id,
              devolucaoId: i.devolucao_id,
              skuId: i.sku_id,
              quantidade: i.quantidade,
              sku: mappedSkus.find(s => s.id === i.sku_id)
            }));

          return {
            id: d.id,
            numero: d.numero,
            pedidoId: d.pedido_id,
            dataDevolucao: d.data_devolucao,
            status: d.status,
            motivo: d.motivo,
            observacao: d.observacao,
            usuarioId: d.usuario_id,
            // pedido: ... we could link parent pedido here if needed
            itens
          };
        });
        setDevolucoes(mappedDevolucoes);
      }

      if (regrasData) setRegrasConsumo(mapSupabaseResponse<RegraConsumo[]>(regrasData));
      if (fichasData) setFichas(mapSupabaseResponse<FichaTecnica[]>(fichasData));
      if (movsData) setMovimentacoes(mapSupabaseResponse<MovimentacaoEstoque[]>(movsData));

      // Set Webpic Data
      const colecoesData = getResult(13);
      const comprasCampanhaData = getResult(14);
      const financialData = getResult(15);
      const suppliersData = getResult(16);

      if (colecoesData) setColecoes(colecoesData as Colecao[]);
      if (comprasCampanhaData) setComprasCampanha(comprasCampanhaData as CompraCampanha[]);
      if (financialData) setFinancialEntries(financialData as FinancialEntry[]);
      if (suppliersData) setSuppliers(suppliersData as Supplier[]);

      cacheRef.current.stockTimestamp = Date.now();
      console.timeEnd('fetchStockData');
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setIsStockLoading(false);
    }
  };

  // Fetch heavy data on demand (lazy loading) - can be implemented later if needed
  // For now, we're not loading pedidos/producao/devolucoes on init to speed up app load

  // Login function    // Subscribe to realtime changes ONLY when user exists
  useEffect(() => {
    if (!user) return;

    // Create a debounced fetch function (waits 2000ms after last event)
    const debouncedFetch = debounce(() => {
      console.log('Debounced fetch triggered');
      fetchDataAll();
    }, 2000);

    // Subscribe to realtime changes
    const channels = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          // Ignore 'users' table updates to prevent loop with presence heartbeat
          if (payload.table === 'users') return;

          console.log('Change received!', payload);
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    }
  }, [user]);



  const login = async (email: string, password?: string) => {
    if (!password) return false;

    // Fetch user by email
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (data && data.password_hash) {
      // Use hashed password authentication
      const isValid = await comparePassword(password, data.password_hash);
      if (isValid) {
        // Check if active
        // Treat undefined/null as true for backward compatibility
        if (data.active === false) {
          addToast('error', 'Usuário desativado. Entre em contato com o administrador.');
          return false;
        }

        const { password_hash, ...userWithoutPassword } = data;
        setUser(userWithoutPassword as User);
        localStorage.setItem('by_marcelo_user', JSON.stringify(userWithoutPassword));
        return true;
      }
    } else {
      console.warn("Usuário sem hash de senha ou senha incorreta.");
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('by_marcelo_user');
  };

  const createLog = async (entityId: string, entityType: 'FACCAO' | 'CORTE', action: 'CRIACAO' | 'EDICAO' | 'STATUS', details: string) => {
    const newLog = {
      entity_id: entityId,
      entity_type: entityType,
      action,
      details,
      user_id: user?.id || 'sys',
      user_name: user?.name || 'Sistema',
      timestamp: new Date().toISOString()
    };

    await supabase.from('logs').insert(newLog);
    fetchData();
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) console.error('Error fetching users:', error);
    if (data) setAllUsers(data as User[]);
  };

  const addFaccao = async (faccao: Faccao) => {
    const { error } = await supabase.from('faccoes').insert({
      name: faccao.name,
      status: faccao.status,
      phone: faccao.phone || '',
      observations: faccao.observations || ''
    });

    if (!error) {
      setTimeout(fetchData, 200);
    }
  };

  const updateFaccao = async (faccao: Faccao) => {
    const { error } = await supabase.from('faccoes').update({
      name: faccao.name,
      status: faccao.status,
      phone: faccao.phone,
      observations: faccao.observations
    }).eq('id', faccao.id);

    if (!error) {
      createLog(faccao.id, 'FACCAO', 'EDICAO', `Facção ${faccao.name} atualizada.`);
      setTimeout(fetchData, 200);
    }
  };

  const deleteFaccao = async (id: string) => {
    const { error } = await supabase.from('faccoes').delete().eq('id', id);
    if (!error) {
      createLog(id, 'FACCAO', 'STATUS', 'Facção excluída.');
      setTimeout(fetchData, 200);
    }
  };

  const addCorte = async (corte: Corte) => {
    await supabase.from('cortes').insert({
      referencia: corte.referencia,
      faccao_id: corte.faccaoId,
      data_envio: corte.dataEnvio,
      data_prevista_recebimento: corte.dataPrevistaRecebimento,
      status: corte.status,
      qtd_total_enviada: corte.qtdTotalEnviada,
      qtd_total_recebida: 0,
      qtd_total_defeitos: 0,
      itens: corte.itens, // JSONB
      defeitos_por_tipo: {},
      valor_por_peca: corte.valor_por_peca || 0
    });
    createLog(corte.referencia, 'CORTE', 'CRIACAO', `Corte ${corte.referencia} enviado.`);
    setTimeout(fetchData, 200);
  };

  const updateCorte = async (corte: Corte) => {
    try {
      const oldCorte = cortes.find(c => c.id === corte.id);

      const { error } = await supabase.from('cortes').update({
        data_recebimento: corte.dataRecebimento,
        status: corte.status,
        qtd_total_recebida: corte.qtdTotalRecebida,
        qtd_total_defeitos: corte.qtdTotalDefeitos,
        observacoes_recebimento: corte.observacoesRecebimento,
        defeitos_por_tipo: corte.defeitosPorTipo,
        itens: corte.itens,
        valor_por_peca: corte.valor_por_peca
      }).eq('id', corte.id);

      if (error) throw error;

      // Handle Stock Integration via Service
      // 1. Sending to Stock (Received)
      if (corte.status === CorteStatus.RECEBIDO && oldCorte?.status !== CorteStatus.RECEBIDO) {
        await stockService.syncCorteToStock(
          corte,
          produtos,
          cores,
          tamanhos,
          skus,
          adjustStock,
          fetchDataAll
        );
      }
      // 2. Reverting from Stock (Undo Received)
      else if (oldCorte?.status === CorteStatus.RECEBIDO && corte.status !== CorteStatus.RECEBIDO) {
        await stockService.revertCorteSync(
          corte,
          produtos,
          cores,
          tamanhos,
          skus,
          adjustStock,
          fetchDataAll
        );
      } else {
        await fetchDataAll();
      }

      // Create detailed log entry with defect information
      let logDetails = `Corte ${corte.referencia} atualizado.`;

      if (corte.status === CorteStatus.RECEBIDO) {
        const pecasBoas = corte.qtdTotalRecebida - corte.qtdTotalDefeitos;

        if (corte.qtdTotalDefeitos > 0) {
          logDetails = `Corte ${corte.referencia} recebido: ${pecasBoas} peças boas adicionadas ao estoque de ${corte.qtdTotalRecebida} recebidas. ${corte.qtdTotalDefeitos} peças com defeito.`;

          if (Object.keys(corte.defeitosPorTipo).length > 0) {
            const defeitosDetalhes = Object.entries(corte.defeitosPorTipo)
              .map(([tipo, qtd]) => `${tipo}: ${qtd}`)
              .join(', ');
            logDetails += ` Defeitos: ${defeitosDetalhes}.`;
          }

          if (corte.observacoesRecebimento) {
            logDetails += ` Observações: ${corte.observacoesRecebimento}`;
          }
        } else {
          logDetails = `Corte ${corte.referencia} recebido: ${corte.qtdTotalRecebida} peças sem defeitos adicionadas ao estoque.`;
        }
      }

      createLog(corte.id, 'CORTE', 'EDICAO', logDetails);
    } catch (e) {
      console.error("Erro ao atualizar corte:", e);
    }
  };

  const deleteCorte = async (id: string) => {
    // Find the corte to get reference for log
    const corteToDelete = cortes.find(c => c.id === id);

    // Delete from database
    const { error } = await supabase.from('cortes').delete().eq('id', id);

    if (!error) {
      setCortes(cortes.filter(c => c.id !== id));
      createLog(
        id,
        'CORTE',
        'STATUS',
        `Corte ${corteToDelete?.referencia || id} excluído pelo admin.`
      );
    }
  };

  const addDefectType = async (name: string, category: string) => {
    await supabase.from('defect_types').insert({ name, category });
    setTimeout(fetchData, 200);
  };

  const updateMeta = async (meta: Meta) => {
    const { error } = await supabase.from('metas').update({
      max_defect_percentage: meta.maxDefectPercentage,
      is_active: meta.isActive
    }).eq('id', meta.id);

    if (!error) {
      setTimeout(fetchData, 200);
    }
  };

  const addCliente = async (cliente: Omit<Cliente, 'id'>) => {
    console.log("Adding client:", cliente);

    const { data, error } = await supabase.from('clientes').insert({
      nome: cliente.nome,
      email: cliente.email,
      cidade: cliente.cidade,
      contato: cliente.contato,
      cpf_cnpj: cliente.cpf_cnpj,
      instagram: cliente.instagram,
      data_nascimento: cliente.dataNascimento || null,
      status: cliente.status,
      categoria: cliente.categoria,
      cep: cliente.cep,
      endereco: cliente.endereco,
      numero: cliente.numero,
      complemento: cliente.complemento,
      bairro: cliente.bairro,
      estado: cliente.estado,
      tags: cliente.tags || [],
      observacoes: cliente.observacoes,
      notas_internas: cliente.notas_internas,
      lat: cliente.lat,
      lng: cliente.lng
    }).select();

    if (error) {
      console.error("Error adding client:", error);
      throw error;
    }
    await fetchStockData();
    return data;
  };

  const updateCliente = async (cliente: Cliente) => {
    console.log("Updating client:", cliente);
    const { error } = await supabase.from('clientes').update({
      nome: cliente.nome,
      email: cliente.email,
      cidade: cliente.cidade,
      contato: cliente.contato,
      cpf_cnpj: cliente.cpf_cnpj,
      instagram: cliente.instagram,
      data_nascimento: cliente.dataNascimento || null,
      status: cliente.status,
      categoria: cliente.categoria,
      cep: cliente.cep,
      endereco: cliente.endereco,
      numero: cliente.numero,
      complemento: cliente.complemento,
      bairro: cliente.bairro,
      estado: cliente.estado,
      observacoes: cliente.observacoes,
      notas_internas: cliente.notas_internas,
      tags: cliente.tags || [],
      lat: cliente.lat,
      lng: cliente.lng
    }).eq('id', cliente.id);

    if (error) {
      console.error("Error updating client:", error);
      throw error;
    }
    await fetchStockData();
  };

  const addProduto = async (produto: Omit<Produto, 'id'>) => {
    console.log("Adding produto:", produto);
    const { data, error } = await supabase.from('produtos').insert({
      referencia: produto.referencia,
      descricao: produto.descricao,
      categoria: produto.categoria,
      ativo: produto.ativo
    }).select();
    if (error) {
      console.error("Error adding produto:", error);
      throw error;
    }
    await fetchStockData();
    return data;
  };

  const updateProduto = async (produto: Produto) => {
    const { error } = await supabase.from('produtos').update({
      referencia: produto.referencia,
      descricao: produto.descricao,
      categoria: produto.categoria,
      ativo: produto.ativo
    }).eq('id', produto.id);

    if (error) {
      console.error("Error updating produto:", error);
      throw error;
    }
    await fetchStockData();
  };

  const addCor = async (nome: string, hex?: string) => {
    const { data, error } = await supabase.from('cores').insert({ nome, hex }).select();
    if (error) {
      console.error("Error adding cor:", error);
      throw error;
    }
    await fetchStockData();
    return data;
  };

  const updateCor = async (cor: Cor) => {
    const { error } = await supabase.from('cores').update({ nome: cor.nome, hex: cor.hex }).eq('id', cor.id);
    if (error) {
      console.error("Error updating cor:", error);
      throw error;
    }
    await fetchStockData();
  };

  const deleteCor = async (id: string) => {
    const { error } = await supabase.from('cores').delete().eq('id', id);
    if (error) {
      console.error("Error deleting cor:", error);
      throw error;
    }
    await fetchStockData();
  };

  const addTamanho = async (nome: string, ordem: number) => {
    const { data, error } = await supabase.from('tamanhos').insert({ nome, ordem }).select();
    if (error) {
      console.error("Error adding tamanho:", error);
      throw error;
    }
    await fetchStockData();
    return data;
  };

  const updateTamanho = async (tamanho: Tamanho) => {
    const { error } = await supabase.from('tamanhos').update({ nome: tamanho.nome, ordem: tamanho.ordem }).eq('id', tamanho.id);
    if (error) {
      console.error("Error updating tamanho:", error);
      throw error;
    }
    await fetchStockData();
  };

  const addSku = async (produtoId: string, corId: string, tamanhoId: string) => {
    try {
      // 1. Check DB first (skus state might be stale in loops)
      const { data: existing, error: checkError } = await supabase
        .from('skus')
        .select('id')
        .eq('produto_id', produtoId)
        .eq('cor_id', corId)
        .eq('tamanho_id', tamanhoId)
        .single();

      if (checkError) throw checkError;
      if (existing) {
        return existing.id;
      }

      // 2. Create if not exists
      const { data, error } = await supabase.from('skus').insert({
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
      console.error("Error creating SKU:", err);
      return null;
    }
  };

  const addFicha = async (ficha: Omit<FichaTecnica, 'id' | 'dataCriacao'>) => {
    const { data, error } = await supabase.from('fichas_tecnicas').insert({
      titulo: ficha.titulo,
      tipo: ficha.tipo,
      conteudo: ficha.conteudo,
      arquivo_data: ficha.arquivoData,
      link: ficha.link
    }).select().single();

    if (error) {
      console.error("Error adding ficha:", error);
      return null;
    }

    await fetchStockData();
    return {
      id: data.id,
      titulo: data.titulo,
      tipo: data.tipo,
      conteudo: data.conteudo,
      arquivoData: data.arquivo_data,
      link: data.link,
      dataCriacao: data.data_criacao
    };
  };

  const deleteFicha = async (id: string) => {
    const { error } = await supabase.from('fichas_tecnicas').delete().eq('id', id);
    if (error) {
      console.error("Error deleting ficha:", error);
      return false;
    }
    await fetchStockData();
    return true;
  };

  const adjustStock = async (skuId: string, quantidade: number, tipo: string, observacao?: string, skipRefresh: boolean = false) => {
    try {
      // 1. Get latest SKU balance directly from DB to avoid stale state in loops
      const { data: currentSku, error: fetchError } = await supabase
        .from('skus')
        .select('saldo_fisico, saldo_disponivel, saldo_reservado')
        .eq('id', skuId)
        .single();

      if (fetchError || !currentSku) throw new Error("SKU não encontrado ou erro ao buscar saldo atual");

      // 2. Insert Movement Log
      const { error: moveError } = await supabase.from('movimentacoes_estoque').insert({
        sku_id: skuId,
        tipo: tipo,
        quantidade: quantidade,
        observacao: observacao,
        usuario_id: user?.id
      });
      if (moveError) throw moveError;

      // 3. Update SKU Balance
      let newFisico = currentSku.saldo_fisico;
      let newDisponivel = currentSku.saldo_disponivel;
      let newReservado = currentSku.saldo_reservado;

      // Logic based on types.ts
      if (tipo === 'ENTRADA_COMPRA' || tipo === 'ENTRADA_PRODUCAO' || tipo === 'ENTRADA_DEVOLUCAO' || tipo === 'AJUSTE_POSITIVO') {
        newFisico += quantidade;
        newDisponivel += quantidade;
      }
      else if (tipo === 'SAIDA_VENDA') {
        newFisico -= quantidade;
        newDisponivel -= quantidade;
      }
      else if (tipo === 'SAIDA_EXPEDICAO') {
        newFisico -= quantidade;
        newReservado -= quantidade;
      }
      else if (tipo === 'AJUSTE_NEGATIVO') {
        newFisico -= quantidade;
        newDisponivel -= quantidade;
      }
      else if (tipo === 'RESERVA') {
        newDisponivel -= quantidade;
        newReservado += quantidade;
      }
      else if (tipo === 'LIBERACAO_RESERVA') {
        newDisponivel += quantidade;
        newReservado -= quantidade;
      }

      const { error: updateError } = await supabase.from('skus').update({
        saldo_fisico: newFisico,
        saldo_disponivel: newDisponivel,
        saldo_reservado: newReservado
      }).eq('id', skuId);

      if (updateError) throw updateError;

      // 4. Refresh Data ONLY if not skipped
      if (!skipRefresh) {
        await fetchStockData();
      }
      return true;
    } catch (error) {
      console.error("Erro ao ajustar estoque:", error);
      return false;
    }
  };

  const addPedido = async (pedido: Omit<Pedido, 'id' | 'numero' | 'cliente'>) => {
    let newOrderId: string | null = null;
    try {
      console.log("Iniciando addPedido:", pedido);
      // 1. Create Order
      const { data: newOrder, error: orderError } = await supabase.from('pedidos').insert({
        cliente_id: pedido.clienteId,
        data_pedido: pedido.dataPedido,
        status: pedido.status,
        status_pagamento: pedido.statusPagamento,
        observacao: pedido.observacao
      }).select().single();

      if (orderError) throw orderError;
      newOrderId = newOrder.id;

      console.log("Pedido criado:", newOrder);

      // 2. Create Items and Reserve Stock
      for (const item of pedido.itens) {
        // Add Item
        const { error: itemError } = await supabase.from('pedido_itens').insert({
          pedido_id: newOrder.id,
          sku_id: item.skuId,
          quantidade: item.quantidade
        });

        if (itemError) throw itemError;

        // Reserve Stock
        const success = await adjustStock(item.skuId, item.quantidade, 'RESERVA', `Reserva Pedido #${newOrder.numero}`, true);

        if (!success) {
          throw new Error(`Falha ao reservar estoque para o SKU ${item.skuId}. Pedido cancelado.`);
        }
      }

      await fetchStockData(); // Ensure fresh data
      return true;
    } catch (error: any) {
      console.error("Erro fatal em addPedido:", error);
      // Rollback attempt
      if (newOrderId) {
        console.warn("Rolling back order creation due to error...");
        await supabase.from('pedido_itens').delete().eq('pedido_id', newOrderId);
        await supabase.from('pedidos').delete().eq('id', newOrderId);
      }
      alert(`Erro ao criar pedido: ${error.message}`);
      return false;
    }
  };

  const updatePedidoStatus = async (pedidoId: string, newStatus: Pedido['status']) => {
    try {
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (!pedido) throw new Error("Pedido não encontrado");

      const oldStatus = pedido.status;

      // 1. Forward to EXPEDIDO (Deduct from Reserved & Physical)
      if (newStatus === 'EXPEDIDO' && oldStatus !== 'EXPEDIDO') {
        for (const item of pedido.itens) {
          await adjustStock(item.skuId, item.quantidade, 'SAIDA_EXPEDICAO', `Expedição Pedido #${pedido.numero}`, true);
        }
      }
      // 2. Reverse from EXPEDIDO (Add back to Reserved & Physical) -> e.g. accidental dispatch
      else if (oldStatus === 'EXPEDIDO' && newStatus !== 'EXPEDIDO') {
        for (const item of pedido.itens) {
          // "Undo" SAIDA_EXPEDICAO: We need to Add to Physical and Add to Reserved
          // We don't have a direct type for this, so we simulate:
          // 1. ENTRADA_DEVOLUCAO (Adds to Fisico and Disponivel)
          // 2. RESERVA (Moves Disponivel to Reservado)
          await adjustStock(item.skuId, item.quantidade, 'ENTRADA_DEVOLUCAO', `Estorno Expedição #${pedido.numero}`, true);
          await adjustStock(item.skuId, item.quantidade, 'RESERVA', `Re-reserva Estorno #${pedido.numero}`, true);
        }
      }

      // 3. To CANCELADO (Release Reservation)
      if (newStatus === 'CANCELADO' && oldStatus !== 'CANCELADO' && oldStatus !== 'EXPEDIDO') {
        for (const item of pedido.itens) {
          await adjustStock(item.skuId, item.quantidade, 'LIBERACAO_RESERVA', `Canc. Pedido #${pedido.numero}`, true);
        }
      }
      // 4. Reverse from CANCELADO (Re-reserve)
      else if (oldStatus === 'CANCELADO' && newStatus !== 'CANCELADO') {
        for (const item of pedido.itens) {
          await adjustStock(item.skuId, item.quantidade, 'RESERVA', `Reabertura Pedido #${pedido.numero}`, true);
        }
      }

      await supabase.from('pedidos').update({ status: newStatus }).eq('id', pedidoId);
      await fetchStockData();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const addOrdemProducao = async (op: Omit<OrdemProducao, 'id' | 'numero' | 'dataCriacao'>) => {
    try {
      const { error } = await supabase.from('ordens_producao').insert({
        sku_id: op.skuId,
        quantidade: op.quantidade,
        status: op.status,
        responsavel: op.responsavel || 'Sistema',
        observacao: op.observacao
      });
      if (error) throw error;
      await fetchStockData();
      return true;
    } catch (e) {
      console.error("Error adding producao:", e);
      throw e;
    }
  };

  const updateStatusProducao = async (opId: string, newStatus: StatusProducao) => {
    try {
      const op = producao.find(o => o.id === opId);
      if (!op) throw new Error("OP não encontrada");

      const oldStatus = op.status;

      const updates: any = { status: newStatus };
      if (newStatus === 'CORTE' && !op.dataInicio) updates.data_inicio = new Date().toISOString();
      if (newStatus === 'FINALIZADO') updates.data_fim = new Date().toISOString();

      const { error } = await supabase.from('ordens_producao').update(updates).eq('id', opId);
      if (error) throw error;

      // 1. Finished: Add to Stock
      if (newStatus === 'FINALIZADO' && oldStatus !== 'FINALIZADO') {
        await adjustStock(op.skuId, op.quantidade, 'ENTRADA_PRODUCAO', `OP #${op.numero}`);
      }
      // 2. Un-Finished: Remove from Stock (e.g. correction)
      else if (oldStatus === 'FINALIZADO' && newStatus !== 'FINALIZADO') {
        // We need to remove what we added.
        // 'AJUSTE_NEGATIVO' removes from Fisico and Disponivel.
        await adjustStock(op.skuId, op.quantidade, 'AJUSTE_NEGATIVO', `Estorno OP #${op.numero} (Reaberta)`);
      }

      await fetchStockData();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const addDevolucao = async (devolucao: Omit<Devolucao, 'id' | 'numero' | 'dataDevolucao' | 'status'>, itens: { skuId: string, quantidade: number }[]) => {
    try {
      // 1. Create Devolucao Header
      const { data: newDev, error: devError } = await supabase.from('devolucoes').insert({
        pedido_id: devolucao.pedidoId,
        motivo: devolucao.motivo,
        observacao: devolucao.observacao,
        status: 'CONCLUIDO', // Auto-approve for now
        usuario_id: user?.id
      }).select().single();

      if (devError) throw devError;

      // 2. Add Items & Update Stock
      for (const item of itens) {
        // Add Item
        await supabase.from('devolucao_itens').insert({
          devolucao_id: newDev.id,
          sku_id: item.skuId,
          quantidade: item.quantidade
        });

        // Update Stock (Increase Physical & Available)
        await adjustStock(item.skuId, item.quantidade, 'ENTRADA_DEVOLUCAO', `Devolução #${newDev.numero} (Ped #${devolucao.pedidoId})`, true);
      }
      await fetchStockData();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const resetStock = async () => {
    try {
      const confirmed = await confirm({
        title: 'Zerar Estoque',
        message: 'TEM CERTEZA ABSOLUTA? Isso apagará TODOS os pedidos, movimentações e zerará o estoque!',
        confirmText: 'Sim, Zerar Tudo',
        type: 'danger'
      });

      if (!confirmed) return false;

      // Delete transactional data in correct order (children first)
      await supabase.from('devolucao_itens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('devolucoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('pedido_itens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('pedidos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('movimentacoes_estoque').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('ordens_producao').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Reset SKU balances
      const { error } = await supabase.from('skus').update({
        saldo_fisico: 0,
        saldo_disponivel: 0,
        saldo_reservado: 0
      }).neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      await fetchDataAll();
      addToast('success', "Estoque zerado com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao zerar estoque:", error);
      addToast('error', "Erro ao zerar estoque. Verifique o console.");
      return false;
    }
  };

  const deleteProduto = async (id: string) => {
    try {
      if (!confirm("Tem certeza que deseja excluir este produto? Isso removerá todos os SKUs, Pedidos, Produções e Devoluções associados!")) return false;

      // 1. Get all SKUs for this product
      const { data: skusToDelete } = await supabase.from('skus').select('id').eq('produto_id', id);

      if (skusToDelete && skusToDelete.length > 0) {
        const skuIds = skusToDelete.map(s => s.id);

        console.log("Excluindo dependências para SKUs:", skuIds);

        // A. Delete Devolucao Itens
        await supabase.from('devolucao_itens').delete().in('sku_id', skuIds);

        // B. Delete Pedido Itens
        await supabase.from('pedido_itens').delete().in('sku_id', skuIds);

        // Note: We are NOT deleting the empty Order/Devolucao headers here. 
        // They will remain as empty records or need a separate cleanup job.
        // For 'Producao', the record itself Is linked to SKU.

        // C. Delete Ordens Producao
        await supabase.from('ordens_producao').delete().in('sku_id', skuIds);

        // D. Delete Movimentacoes
        await supabase.from('movimentacoes_estoque').delete().in('sku_id', skuIds);

        // E. Delete SKUs
        await supabase.from('skus').delete().in('id', skuIds);
      }

      // 2. Delete the Product
      const { error } = await supabase.from('produtos').delete().eq('id', id);

      if (error) {
        console.error("Erro ao excluir produto:", error);
        throw error;
      }

      await fetchDataAll();
      return true;
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto. Verifique o console.");
      return false;
    }
  };

  const saveUser = async (userData: Partial<User>) => {
    try {
      if (userData.id) {
        const { error } = await supabase.from('users').update(userData).eq('id', userData.id);
        if (error) throw error;
        createLog(userData.id, 'FACCAO' as any, 'EDICAO', `Usuário ${userData.name} atualizado.`);
      } else {
        const { error } = await supabase.from('users').insert({
          ...userData,
          active: true // Default active for new users
        });
        if (error) throw error;
        createLog('new_user', 'FACCAO' as any, 'CRIACAO', `Usuário ${userData.name} criado.`);
      }
      await fetchUsers();
      fetchDataAll();

      // Update current user state if editing self
      if (user && userData.id === user.id) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser as User);
        localStorage.setItem('by_marcelo_user', JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err);
      if (err.message && err.message.includes('users_email_key')) {
        addToast('error', 'Este email já está em uso por outro usuário.');
      } else {
        addToast('error', `Erro ao salvar usuário: ${err.message || "Verifique o console."}`);
      }
    }
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error("Erro ao excluir usuário:", error);
      addToast('error', "Erro ao excluir usuário.");
      return false;
    }
    createLog(id, 'FACCAO' as any, 'STATUS', `Usuário excluído.`);
    fetchDataAll();
    addToast('success', "Usuário excluído com sucesso.");
    return true;
  };

  const syncCorteToStock = async (corteId: string) => {
    const corte = cortes.find(c => c.id === corteId);
    if (!corte) return { success: false, message: 'Corte não encontrado.' };
    if (corte.status !== 'RECEBIDO') return { success: false, message: 'Corte não está com status RECEBIDO.' };
    return await stockService.syncCorteToStock(
      corte,
      produtos,
      cores,
      tamanhos,
      skus,
      adjustStock,
      fetchDataAll
    );
  };

  const addRegraConsumo = async (regra: Omit<RegraConsumo, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase.from('regras_consumo').insert({
        referencia: regra.referencia,
        tamanho_id: regra.tamanhoId || null,
        consumo_unitario: regra.consumoUnitario,
        tecido_nome: regra.tecidoNome,
        tecido_composicao: regra.tecidoComposicao,
        tecido_largura: regra.tecidoLargura,
        tecido_fornecedor: regra.tecidoFornecedor,
        tecido_custo: regra.tecidoCusto,
        acessorios: regra.acessorios,
        usuario_id: user?.id || null
      });
      if (error) {
        console.error("Error adding regra:", error);
        addToast('error', `Erro ao adicionar regra: ${error.message}`);
        return false;
      }
      await fetchStockData();
      addToast('success', 'Regra de consumo adicionada com sucesso!');
      return true;
    } catch (err: any) {
      console.error("Unexpected error adding regra:", err);
      addToast('error', `Erro inesperado: ${err.message}`);
      return false;
    }
  };

  const updateRegraConsumo = async (regra: RegraConsumo) => {
    try {
      const { error } = await supabase.from('regras_consumo').update({
        referencia: regra.referencia,
        tamanho_id: regra.tamanhoId || null,
        consumo_unitario: regra.consumoUnitario,
        tecido_nome: regra.tecidoNome,
        tecido_composicao: regra.tecidoComposicao,
        tecido_largura: regra.tecidoLargura,
        tecido_fornecedor: regra.tecidoFornecedor,
        tecido_custo: regra.tecidoCusto,
        acessorios: regra.acessorios
      }).eq('id', regra.id);
      if (error) {
        console.error("Error updating regra:", error);
        addToast('error', `Erro ao atualizar regra: ${error.message}`);
        return false;
      }
      await fetchStockData();
      addToast('success', 'Regra atualizada com sucesso!');
      return true;
    } catch (err: any) {
      console.error("Unexpected error updating regra:", err);
      addToast('error', `Erro inesperado: ${err.message}`);
      return false;
    }
  };

  const deleteRegraConsumo = async (id: string) => {
    try {
      const { error } = await supabase.from('regras_consumo').delete().eq('id', id);
      if (error) {
        console.error("Error deleting regra:", error);
        addToast('error', `Erro ao excluir regra: ${error.message}`);
        return false;
      }
      await fetchStockData();
      addToast('success', 'Regra excluída com sucesso!');
      return true;
    } catch (err: any) {
      console.error("Unexpected error deleting regra:", err);
      addToast('error', `Erro inesperado: ${err.message}`);
      return false;
    }
  };

  const addColecao = async (colecao: Omit<Colecao, 'id'>) => {
    const { error } = await supabase.from('colecoes').insert({
      nome: colecao.nome,
      data_inicio: colecao.dataInicio,
      data_termino: colecao.dataTermino,
      meta_vendas: colecao.meta_vendas
    });
    if (!error) fetchStockData();
  };

  const updateColecao = async (colecao: Colecao) => {
    const { error } = await supabase.from('colecoes').update({
      nome: colecao.nome,
      data_inicio: colecao.dataInicio,
      data_termino: colecao.dataTermino,
      meta_vendas: colecao.meta_vendas
    }).eq('id', colecao.id);
    if (!error) fetchStockData();
  };

  const deleteColecao = async (id: string) => {
    const { error } = await supabase.from('colecoes').delete().eq('id', id);
    if (!error) fetchStockData();
  };

  const backupSystem = async () => {
    try {
      const data = await backupService.createBackup();
      addToast('success', 'Backup gerado com sucesso!');
      return data;
    } catch (e) {
      console.error(e);
      addToast('error', 'Falha ao criar backup.');
      return null;
    }
  };

  const restoreSystem = async (backup: SystemBackup) => {
    try {
      await backupService.restoreBackup(backup);
      await fetchDataAll();
      addToast('success', 'Sistema restaurado com sucesso!');
      return true;
    } catch (e: any) {
      console.error(e);
      addToast('error', `Falha na restauração: ${e.message}`);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      faccoes,
      cortes,
      defectTypes,
      metas,
      logs,
      allUsers,
      clientes,
      produtos,
      cores,
      tamanhos,
      skus,
      pedidos,
      producao,
      devolucoes,
      movimentacoes,
      fichas,
      regrasConsumo,
      isStockLoading,
      colecoes,
      comprasCampanha,
      financialEntries,
      suppliers,
      addCliente,
      updateCliente,
      fetchUsers,
      addPedido,
      updatePedidoStatus,
      addOrdemProducao,
      updateStatusProducao,
      adjustStock,
      addDevolucao,
      addFicha,
      deleteFicha,
      addRegraConsumo,
      updateRegraConsumo,
      deleteRegraConsumo,
      addColecao,
      updateColecao,
      deleteColecao,
      resetStock,
      deleteProduto,
      syncCorteToStock,
      backupSystem,
      restoreSystem,
      toasts,
      addToast,
      removeToast,
      confirm
    }}>
      {children}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeDialog}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};