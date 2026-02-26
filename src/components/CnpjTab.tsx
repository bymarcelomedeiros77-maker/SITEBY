import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, CheckCircle, XCircle, AlertCircle, Building2,
    MapPin, Users, Briefcase, Calendar, Phone, Mail,
    ClipboardCopy, RefreshCw, ArrowDownToLine
} from 'lucide-react';
import { Cliente } from '../types';

// ─── Tipos da BrasilAPI ───────────────────────────────────────────────────
interface CnpjData {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    descricao_situacao_cadastral: string;
    data_situacao_cadastral: string;
    data_inicio_atividade: string;
    descricao_tipo: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    ddd_telefone_1: string;
    email: string;
    cnae_fiscal_descricao: string;
    cnaes_secundarios: Array<{ descricao: string; codigo: number }>;
    qsa: Array<{ nome_socio: string; qualificacao_socio: string; }>;
    natureza_juridica: string;
    capital_social: number;
    lat?: number;
    lng?: number;
}

// ─── Utilitários ─────────────────────────────────────────────────────────
const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

const validarCnpj = (cnpj: string): boolean => {
    const c = cnpj.replace(/\D/g, '');
    if (c.length !== 14) return false;
    if (/^(\d)\1+$/.test(c)) return false;
    const calc = (mod: number) => {
        let sum = 0;
        let pos = mod - 7;
        for (let i = mod; i >= 1; i--) {
            sum += parseInt(c[mod - i]) * pos--;
            if (pos < 2) pos = 9;
        }
        const r = sum % 11;
        return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === parseInt(c[12]) && calc(13) === parseInt(c[13]);
};

const formatarCep = (cep: string) => cep?.replace(/^(\d{5})(\d{3})$/, '$1-$2') || '';
const formatarTel = (tel: string) => {
    const d = tel?.replace(/\D/g, '') || '';
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    return tel;
};

// ─── Componente ──────────────────────────────────────────────────────────
interface CnpjTabProps {
    editingClient?: Partial<Cliente> | null;
    setEditingClient?: (c: Partial<Cliente>) => void;
    onDataApplied?: (data: Partial<Cliente>) => void;
}

export const CnpjTab: React.FC<CnpjTabProps> = ({ editingClient, setEditingClient, onDataApplied }) => {
    const [cnpjInput, setCnpjInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CnpjData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [preenchido, setPreenchido] = useState(false);

    const handleConsultar = async () => {
        const digits = cnpjInput.replace(/\D/g, '');
        if (!validarCnpj(digits)) {
            setError('CNPJ inválido. Verifique os dígitos e tente novamente.');
            setData(null);
            return;
        }
        setLoading(true);
        setError(null);
        setData(null);
        setPreenchido(false);
        try {
            let res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
            if (!res.ok) {
                console.warn('BrasilAPI falhou ou bloqueou (CORS/RateLimit). Tentando fallback MinhaReceita...');
                res = await fetch(`https://minhareceita.org/${digits}`);
            }

            if (!res.ok) {
                if (res.status === 404) throw new Error('CNPJ não encontrado na Receita Federal.');
                throw new Error(`Erro: Serviço de Receita temporariamente indisponível.`);
            }
            const json: any = await res.json();

            // Busca Lat Lng exata
            try {
                const enderecoStr = `${json.logradouro}, ${json.numero}, ${json.municipio}, ${json.uf}, Brasil`;
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                if (apiKey) {
                    const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(enderecoStr)}&key=${apiKey}`);
                    const geoData = await geoRes.json();
                    if (geoData.status === 'OK' && geoData.results && geoData.results[0]) {
                        json.lat = geoData.results[0].geometry.location.lat;
                        json.lng = geoData.results[0].geometry.location.lng;
                    }
                }
            } catch (geoErr) {
                console.warn('Falha no Geocoding da rua (usará centro do Estado):', geoErr);
            }

            setData(json);
        } catch (e: any) {
            setError(e.message || 'Erro ao consultar. Tente novamente em instantes.');
        } finally {
            setLoading(false);
        }
    };

    const handlePreencherCadastro = () => {
        if (!data) return;
        const telefone = data.ddd_telefone_1 ? formatarTel(data.ddd_telefone_1) : (editingClient?.contato || '');

        const mappedData: Partial<Cliente> = {
            ...editingClient,
            nome: data.nome_fantasia || data.razao_social || '',
            email: data.email || editingClient?.email || '',
            contato: telefone,
            endereco: `${data.logradouro || ''}, ${data.numero || 'S/N'}${data.complemento ? ' - ' + data.complemento : ''}`,
            bairro: data.bairro || '',
            cidade: data.municipio || '',
            estado: data.uf || '',
            cep: data.cep ? formatarCep(data.cep) : '',
            cpf_cnpj: data.cnpj ? formatCnpj(data.cnpj) : '',
            lat: data.lat,
            lng: data.lng,
        };

        if (setEditingClient) setEditingClient(mappedData);
        if (onDataApplied) onDataApplied(mappedData);

        setPreenchido(true);
    };

    const situacaoAtiva = data?.descricao_situacao_cadastral?.toLowerCase() === 'ativa';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Cabeçalho explicativo */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20">
                <Building2 size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-xs font-bold text-violet-300 mb-0.5">Consulta de CNPJ — Receita Federal</p>
                    <p className="text-[11px] text-slate-500">
                        Insira o CNPJ para validar e importar automaticamente nome, endereço, sócios e atividade econômica.
                    </p>
                </div>
            </div>

            {/* Input de busca */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={cnpjInput}
                        onChange={e => {
                            setCnpjInput(formatCnpj(e.target.value));
                            setError(null);
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleConsultar()}
                        placeholder="00.000.000/0001-00"
                        maxLength={18}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white font-mono tracking-widest focus:border-violet-500/50 outline-none transition-all placeholder:text-slate-700"
                    />
                </div>
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConsultar}
                    disabled={loading || cnpjInput.replace(/\D/g, '').length < 14}
                    className="px-6 py-3.5 rounded-2xl bg-violet-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    {loading ? 'Consultando...' : 'Consultar'}
                </motion.button>
            </div>

            {/* Erro */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                    >
                        <XCircle size={16} className="flex-shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Resultado */}
            <AnimatePresence>
                {data && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {/* Badge situação + botão preencher */}
                        <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${situacaoAtiva
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border border-red-500/30 text-red-400'
                                }`}>
                                {situacaoAtiva
                                    ? <CheckCircle size={13} />
                                    : <AlertCircle size={13} />
                                }
                                {data.descricao_situacao_cadastral}
                            </div>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handlePreencherCadastro}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${preenchido
                                    ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                                    : 'bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20'
                                    }`}
                            >
                                {preenchido
                                    ? <><CheckCircle size={13} /> Dados Aplicados</>
                                    : <><ArrowDownToLine size={13} /> Preencher Cadastro</>
                                }
                            </motion.button>
                        </div>

                        {/* Dados principais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Identificação */}
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                                    <Building2 size={13} className="text-violet-400" />
                                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Identificação</span>
                                </div>
                                <InfoRow label="CNPJ" value={formatCnpj(data.cnpj)} mono />
                                <InfoRow label="Razão Social" value={data.razao_social} />
                                {data.nome_fantasia && <InfoRow label="Nome Fantasia" value={data.nome_fantasia} />}
                                <InfoRow label="Tipo" value={data.descricao_tipo} />
                                <InfoRow label="Natureza Jurídica" value={data.natureza_juridica} />
                                <InfoRow label="Porte" value={data.porte} />
                                {data.capital_social > 0 && (
                                    <InfoRow label="Capital Social"
                                        value={data.capital_social.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        mono
                                    />
                                )}
                                <InfoRow
                                    label="Abertura"
                                    icon={<Calendar size={10} />}
                                    value={data.data_inicio_atividade
                                        ? new Date(data.data_inicio_atividade).toLocaleDateString('pt-BR')
                                        : '—'}
                                    mono
                                />
                            </div>

                            {/* Contato & Endereço */}
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                                    <MapPin size={13} className="text-brand-cyan" />
                                    <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest">Endereço & Contato</span>
                                </div>
                                <InfoRow label="Logradouro" value={`${data.logradouro}, ${data.numero}${data.complemento ? ' — ' + data.complemento : ''}`} />
                                <InfoRow label="Bairro" value={data.bairro} />
                                <InfoRow label="Cidade" value={`${data.municipio} — ${data.uf}`} />
                                <InfoRow label="CEP" value={formatarCep(data.cep)} mono />
                                {data.ddd_telefone_1 && (
                                    <InfoRow label="Telefone" icon={<Phone size={10} />} value={formatarTel(data.ddd_telefone_1)} mono />
                                )}
                                {data.email && (
                                    <InfoRow label="E-mail" icon={<Mail size={10} />} value={data.email} />
                                )}
                            </div>
                        </div>

                        {/* Atividade econômica */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                                <Briefcase size={13} className="text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Atividade Econômica</span>
                            </div>
                            {data.cnae_fiscal_descricao && (
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Principal</span>
                                    <span className="text-xs text-white">{data.cnae_fiscal_descricao}</span>
                                </div>
                            )}
                            {data.cnaes_secundarios?.length > 0 && (
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Atividades Secundárias</span>
                                    <div className="space-y-1">
                                        {data.cnaes_secundarios.slice(0, 5).map((c, i) => (
                                            <div key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
                                                {c.descricao}
                                            </div>
                                        ))}
                                        {data.cnaes_secundarios.length > 5 && (
                                            <div className="text-[10px] text-slate-600">+{data.cnaes_secundarios.length - 5} atividades</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quadro Societário */}
                        {data.qsa?.length > 0 && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                                    <Users size={13} className="text-rose-400" />
                                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Quadro Societário</span>
                                </div>
                                <div className="space-y-2">
                                    {data.qsa.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {s.nome_socio?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-xs text-white font-medium">{s.nome_socio}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
                                                {s.qualificacao_socio}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Sub-componente linha de info ─────────────────────────────────────────
const InfoRow = ({ label, value, icon, mono }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean }) => (
    <div className="flex items-start gap-2">
        {icon && <span className="text-slate-500 mt-0.5">{icon}</span>}
        <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-0.5">{label}</div>
            <div className={`text-xs text-slate-300 break-words ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
        </div>
    </div>
);
