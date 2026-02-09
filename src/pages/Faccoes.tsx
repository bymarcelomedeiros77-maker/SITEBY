import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FaccaoStatus } from '../types';
import { Plus, Search, MapPin, Phone, Activity, History, X, Edit, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

export const Faccoes = () => {
  const { faccoes, logs, addFaccao, updateFaccao, deleteFaccao } = useApp();
  const { confirm, confirmState, closeDialog } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyFaccaoId, setHistoryFaccaoId] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    observations: '',
    status: FaccaoStatus.ATIVO,
    createdAt: new Date().toISOString()
  });

  const filteredFaccoes = faccoes.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      phone: '',
      observations: '',
      status: FaccaoStatus.ATIVO,
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faccao: any) => {
    setEditingId(faccao.id);
    setFormData({
      name: faccao.name,
      phone: faccao.phone,
      observations: faccao.observations,
      status: faccao.status,
      createdAt: faccao.createdAt || new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateFaccao({ id: editingId, ...formData });
    } else {
      addFaccao({ id: Date.now().toString(), ...formData });
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      phone: '',
      observations: '',
      status: FaccaoStatus.ATIVO,
      createdAt: new Date().toISOString()
    });
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a facção "${name}"? Esta ação é irreversível e todos os dados relacionados serão perdidos.`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (confirmed) {
      deleteFaccao(id);
    }
  };

  const toggleStatus = (id: string, currentStatus: FaccaoStatus) => {
    const faccao = faccoes.find(f => f.id === id);
    if (faccao) {
      updateFaccao({
        ...faccao,
        status: currentStatus === FaccaoStatus.ATIVO ? FaccaoStatus.INATIVO : FaccaoStatus.ATIVO
      });
    }
  };

  const openHistory = (id: string) => {
    setHistoryFaccaoId(id);
    setIsHistoryOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-wide uppercase">Rede de Facções</h2>
          <p className="text-brand-cyan font-mono text-xs mt-1 tracking-widest">STATUS: OPERACIONAL // BANCO DE DADOS: CONECTADO</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-brand-cyan text-black hover:bg-blue-400 px-6 py-2 flex items-center gap-2 transition-all font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.4)] clip-path-polygon"
          style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
        >
          <Plus size={20} />
          Nova Unidade
        </button>
      </div>

      {/* Search Bar - Tech Style */}
      <div className="flex items-center gap-4 max-w-md relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-brand-cyan" size={18} />
        </div>
        <input
          type="text"
          placeholder="LOCALIZAR PARCEIRO..."
          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-cyan font-mono text-sm tracking-wider shadow-inner"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredFaccoes.map((f) => (
          <div key={f.id} className="tech-card corner-cut group hover:bg-slate-900/80 transition-all duration-300">
            {/* Header Line */}
            <div className={`h-0.5 w-full ${f.status === FaccaoStatus.ATIVO ? 'bg-brand-green' : 'bg-red-600'}`}></div>

            <div className="p-3 relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="p-1 bg-slate-950/80 border border-slate-800 rounded-sm">
                  {f.status === FaccaoStatus.ATIVO ? <ShieldCheck className="text-brand-green" size={14} /> : <AlertTriangle className="text-red-500" size={14} />}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenEdit(f)} className="p-1 text-slate-500 hover:text-brand-cyan hover:bg-slate-950 rounded transition-colors" title="Editar">
                    <Edit size={12} />
                  </button>
                  <button onClick={() => handleDelete(f.id, f.name)} className="p-1 text-slate-500 hover:text-red-500 hover:bg-slate-950 rounded transition-colors" title="Excluir">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans truncate">{f.name}</h3>
                <div className="flex items-center justify-between mt-0.5">
                  <span className={`text-[9px] uppercase font-mono tracking-widest ${f.status === FaccaoStatus.ATIVO ? 'text-green-500' : 'text-red-500'}`}>
                    [{f.status}]
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">ID: {f.id.substring(0, 8)}...</span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 gap-px bg-slate-800 border border-slate-800 mb-2">
                <div className="bg-slate-900/90 p-1.5 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Phone size={10} /> Contato</span>
                  <span className="text-[10px] text-slate-300 font-mono">{f.phone || 'N/A'}</span>
                </div>
                <div className="bg-slate-900/90 p-1.5 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Activity size={10} /> Cadastro</span>
                  <span className="text-[10px] text-brand-cyan font-mono">{f.createdAt ? new Date(f.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                </div>
                <div className="bg-slate-900/90 p-1.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1 mb-0.5"><Activity size={10} /> Obs</span>
                  <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{f.observations || "Sem observações."}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800 border-dashed">
                <button onClick={() => openHistory(f.id)} className="text-[9px] text-slate-500 hover:text-brand-cyan flex items-center gap-1 font-mono uppercase tracking-wider transition-colors">
                  <History size={10} /> Logs
                </button>
                <button
                  onClick={() => toggleStatus(f.id, f.status)}
                  className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border transition-colors ${f.status === FaccaoStatus.ATIVO ? 'border-red-900 text-red-500 hover:bg-red-950' : 'border-green-900 text-green-500 hover:bg-green-950'}`}
                >
                  {f.status === FaccaoStatus.ATIVO ? 'DESATIVAR' : 'ATIVAR'}
                </button>
              </div>
            </div>
            {/* Background Texture */}
            <div className="absolute bottom-0 right-0 p-2 opacity-5 pointer-events-none">
              <MapPin size={60} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="tech-card w-full max-w-md p-0 shadow-[0_0_50px_rgba(59,130,246,0.15)] border-brand-cyan/30">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan to-transparent"></div>

            <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {editingId ? 'Editar Protocolo' : 'Novo Protocolo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-900/50">
              <div>
                <label className="block text-[10px] font-bold text-brand-cyan mb-1 uppercase tracking-wider">Identificação (Nome)</label>
                <input
                  required
                  type="text"
                  className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan font-mono text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Canal de Contato</label>
                <input
                  required
                  type="text"
                  placeholder="(00) 00000-0000"
                  className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-nexus-cyan mb-1 uppercase tracking-wider">Notas Operacionais</label>
                <textarea
                  className="w-full p-3 bg-slate-950 border border-slate-700 text-white focus:border-nexus-cyan focus:outline-none font-mono text-sm h-24 resize-none"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 uppercase text-xs font-bold tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-nexus-cyan text-black font-bold uppercase tracking-wider hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  Confirmar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="tech-card w-full max-w-lg p-0 max-h-[80vh] flex flex-col border-nexus-pink/30">
            <div className="absolute top-0 left-0 w-full h-1 bg-nexus-pink"></div>

            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History size={18} className="text-nexus-pink" /> LOGS DO SISTEMA
              </h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/50">
              {logs.filter(l => l.entityId === historyFaccaoId && l.entityType === 'FACCAO').length === 0 ? (
                <div className="text-center text-slate-600 py-8 font-mono border border-slate-800 border-dashed">
                  <AlertTriangle className="mx-auto mb-2 opacity-50" />
                  NENHUM REGISTRO ENCONTRADO
                </div>
              ) : (
                logs.filter(l => l.entityId === historyFaccaoId && l.entityType === 'FACCAO')
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map(log => (
                    <div key={log.id} className="border-l-2 border-slate-700 pl-4 py-1 relative group hover:border-nexus-pink transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-nexus-pink uppercase tracking-wider">{log.action}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 mb-1 font-mono">{log.details}</p>
                      <p className="text-[10px] text-slate-500 uppercase">USR: {log.userName}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
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
    </div>
  );
};