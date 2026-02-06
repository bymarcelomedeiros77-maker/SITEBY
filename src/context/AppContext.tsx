import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Faccao, Corte, DefectType, Meta, UserRole, CorteStatus, FaccaoStatus, LogEntry } from '../types';
import { supabase } from '../services/supabase';
import { comparePassword } from '../utils/hashUtils';
import { mapSupabaseResponse, mapToSupabase } from '../utils/dataMappers';

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  faccoes: Faccao[];
  cortes: Corte[];
  defectTypes: DefectType[];
  metas: Meta[];
  logs: LogEntry[];
  allUsers: User[];
  fetchUsers: () => Promise<void>;
  saveUser: (userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addFaccao: (faccao: Faccao) => void;
  updateFaccao: (faccao: Faccao) => void;
  deleteFaccao: (id: string) => void;
  addCorte: (corte: Corte) => void;
  updateCorte: (corte: Corte) => void;
  deleteCorte: (id: string) => Promise<void>;
  addDefectType: (name: string, category: string) => void;
  updateMeta: (meta: Meta) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faccoes, setFaccoes] = useState<Faccao[]>([]);
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [defectTypes, setDefectTypes] = useState<DefectType[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

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
      try {
        const storedUser = localStorage.getItem('by_marcelo_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);

          // Fetch all data after user is restored
          // Faccoes
          const { data: faccoesData } = await supabase.from('faccoes').select('*').order('name', { ascending: true });
          if (faccoesData) setFaccoes(mapSupabaseResponse<Faccao[]>(faccoesData));

          // Cortes
          const { data: cortesData } = await supabase.from('cortes').select('*').order('data_envio', { ascending: false });
          if (cortesData) setCortes(mapSupabaseResponse<Corte[]>(cortesData));

          // Defect Types
          const { data: defectsData } = await supabase.from('defect_types').select('*').order('name');
          if (defectsData) setDefectTypes(defectsData as DefectType[]);

          // Metas
          const { data: metasData } = await supabase.from('metas').select('*');
          if (metasData) setMetas(mapSupabaseResponse<Meta[]>(metasData));

          // Logs
          const { data: logsData } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(50);
          if (logsData) setLogs(mapSupabaseResponse<LogEntry[]>(logsData));
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Fetch Data from Supabase (for realtime updates and login)
  const fetchData = async () => {
    // Faccoes
    const { data: faccoesData } = await supabase.from('faccoes').select('*').order('name', { ascending: true });
    if (faccoesData) setFaccoes(mapSupabaseResponse<Faccao[]>(faccoesData));

    // Cortes
    const { data: cortesData } = await supabase.from('cortes').select('*').order('data_envio', { ascending: false });
    if (cortesData) setCortes(mapSupabaseResponse<Corte[]>(cortesData));

    // Defect Types
    const { data: defectsData } = await supabase.from('defect_types').select('*').order('name');
    if (defectsData) setDefectTypes(defectsData as DefectType[]);

    // Metas
    const { data: metasData } = await supabase.from('metas').select('*');
    if (metasData) setMetas(mapSupabaseResponse<Meta[]>(metasData));

    // Logs (Optional FETCH)
    const { data: logsData } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(50);
    if (logsData) setLogs(mapSupabaseResponse<LogEntry[]>(logsData));
  };

  // Subscribe to realtime changes ONLY when user exists
  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime changes
    const channels = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Change received!', payload);
          fetchData();
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
        const { password_hash, ...userWithoutPassword } = data;
        setUser(userWithoutPassword as User);
        localStorage.setItem('by_marcelo_user', JSON.stringify(userWithoutPassword));
        return true;
      }
    } else if (data && data.password) {
      // Fallback to plain text (temporary, for migration period)
      if (data.password === password) {
        const { password: _, ...userWithoutPassword } = data;
        setUser(userWithoutPassword as User);
        localStorage.setItem('by_marcelo_user', JSON.stringify(userWithoutPassword));
        return true;
      }
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

  const addFaccao = async (faccao: Faccao) => {
    const { id, ...rest } = faccao; // Remove ID to let DB generate UUID or use provided ID if needed? 
    // Types normally use string IDs. We should let DB handle it BUT logic might expect ID. 
    // Let's pass the ID if it's not a temp one, or omit. 
    // Usually UUIDs are generated on client or server. Let's send without ID for auto-gen if empty, or with ID if UUID.

    // Simple: Send all data.
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
      defeitos_por_tipo: {}
    });
    createLog(corte.referencia, 'CORTE', 'CRIACAO', `Corte ${corte.referencia} enviado.`);
    setTimeout(fetchData, 200);
  };

  const updateCorte = async (corte: Corte) => {
    await supabase.from('cortes').update({
      data_recebimento: corte.dataRecebimento,
      status: corte.status,
      qtd_total_recebida: corte.qtdTotalRecebida,
      qtd_total_defeitos: corte.qtdTotalDefeitos,
      observacoes_recebimento: corte.observacoesRecebimento,
      defeitos_por_tipo: corte.defeitosPorTipo
    }).eq('id', corte.id);

    createLog(corte.id, 'CORTE', 'EDICAO', `Corte ${corte.referencia} atualizado.`);
  };

  const deleteCorte = async (id: string) => {
    // Find the corte to get reference for log
    const corteToDelete = cortes.find(c => c.id === id);

    // Delete from database
    const { error } = await supabase.from('cortes').delete().eq('id', id);

    if (!error) {
      // Update local state
      setCortes(cortes.filter(c => c.id !== id));

      // Create log
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
      return true;
    }
    return false;
  };

  return (
    <AppContext.Provider value={{
      user,
      login,
      logout,
      faccoes,
      cortes,
      defectTypes,
      metas,
      logs,
      addFaccao,
      updateFaccao,
      deleteFaccao,
      addCorte,
      updateCorte,
      deleteCorte,
      addDefectType,
      updateMeta,
      allUsers,
      fetchUsers: fetchData,
      saveUser: async (userData: Partial<User>) => {
        try {
          if (userData.id) {
            const { error } = await supabase.from('users').update(userData).eq('id', userData.id);
            if (error) throw error;
            createLog(userData.id, 'FACCAO' as any, 'EDICAO', `Usuário ${userData.name} atualizado.`);
          } else {
            const { error } = await supabase.from('users').insert(userData);
            if (error) throw error;
            createLog('new_user', 'FACCAO' as any, 'CRIACAO', `Usuário ${userData.name} criado.`);
          }
          fetchData();
        } catch (err) {
          console.error("Erro ao salvar usuário:", err);
          alert("Erro ao salvar usuário. Verifique o console ou se o email já existe.");
        }
      },
      deleteUser: async (id: string) => {
        await supabase.from('users').delete().eq('id', id);
        createLog(id, 'FACCAO' as any, 'STATUS', `Usuário excluído.`);
        fetchData();
      }
    }
    } >
      {children}
    </AppContext.Provider >
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};