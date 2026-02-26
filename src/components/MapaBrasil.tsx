import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
    APIProvider,
    Map,
    Marker,
    InfoWindow,
    useMap,
} from '@vis.gl/react-google-maps';
import { Cliente, ClienteCategoria } from '../types';
import { normalizarEstado } from '../utils/estadosCoords';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Users } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// ─── Coordenadas geográficas reais dos estados ────────────────────────────
const ESTADO_LAT_LNG: Record<string, { lat: number; lng: number; nome: string }> = {
    AC: { lat: -9.0238, lng: -70.812, nome: 'Acre' },
    AL: { lat: -9.5713, lng: -36.782, nome: 'Alagoas' },
    AM: { lat: -3.4168, lng: -65.856, nome: 'Amazonas' },
    AP: { lat: 1.4102, lng: -51.770, nome: 'Amapá' },
    BA: { lat: -12.5797, lng: -41.700, nome: 'Bahia' },
    CE: { lat: -5.4984, lng: -39.321, nome: 'Ceará' },
    DF: { lat: -15.7998, lng: -47.864, nome: 'Distrito Federal' },
    ES: { lat: -19.1834, lng: -40.308, nome: 'Espírito Santo' },
    GO: { lat: -15.827, lng: -49.836, nome: 'Goiás' },
    MA: { lat: -4.9609, lng: -45.274, nome: 'Maranhão' },
    MG: { lat: -18.512, lng: -44.555, nome: 'Minas Gerais' },
    MS: { lat: -20.7722, lng: -54.785, nome: 'Mato Grosso do Sul' },
    MT: { lat: -12.6819, lng: -56.921, nome: 'Mato Grosso' },
    PA: { lat: -3.4168, lng: -52.291, nome: 'Pará' },
    PB: { lat: -7.24, lng: -36.782, nome: 'Paraíba' },
    PE: { lat: -8.8137, lng: -36.954, nome: 'Pernambuco' },
    PI: { lat: -7.7183, lng: -42.728, nome: 'Piauí' },
    PR: { lat: -24.7654, lng: -51.485, nome: 'Paraná' },
    RJ: { lat: -22.9068, lng: -43.173, nome: 'Rio de Janeiro' },
    RN: { lat: -5.8127, lng: -36.201, nome: 'Rio Grande do Norte' },
    RO: { lat: -11.505, lng: -63.580, nome: 'Rondônia' },
    RR: { lat: 1.9891, lng: -61.333, nome: 'Roraima' },
    RS: { lat: -30.034, lng: -51.218, nome: 'Rio Grande do Sul' },
    SC: { lat: -27.595, lng: -48.548, nome: 'Santa Catarina' },
    SE: { lat: -10.947, lng: -37.073, nome: 'Sergipe' },
    SP: { lat: -23.5505, lng: -46.633, nome: 'São Paulo' },
    TO: { lat: -10.247, lng: -48.324, nome: 'Tocantins' },
};

// ─── Paleta por categoria ─────────────────────────────────────────────────
export const CATEGORIA_CORES: Record<string, { fill: string; bg: string; glow: string; border: string; label: string }> = {
    DIAMANTE: { fill: '#22d3ee', bg: '#083344', glow: 'rgba(34,211,238,0.8)', border: '#0891b2', label: 'Diamante' },
    OURO: { fill: '#f59e0b', bg: '#431407', glow: 'rgba(245,158,11,0.8)', border: '#b45309', label: 'Ouro' },
    PRATA: { fill: '#94a3b8', bg: '#1e293b', glow: 'rgba(148,163,184,0.7)', border: '#64748b', label: 'Prata' },
    BRONZE: { fill: '#cd7c2b', bg: '#1c0a00', glow: 'rgba(205,124,43,0.8)', border: '#92400e', label: 'Bronze' },
    CLIENTE_NOVO: { fill: '#a78bfa', bg: '#2e1065', glow: 'rgba(167,139,250,0.8)', border: '#7c3aed', label: 'Novo' },
    INATIVO_90: { fill: '#f87171', bg: '#450a0a', glow: 'rgba(248,113,113,0.7)', border: '#dc2626', label: 'Inativo 90d' },
    INATIVO_8M: { fill: '#ef4444', bg: '#450a0a', glow: 'rgba(239,68,68,0.7)', border: '#b91c1c', label: 'Inativo 8m' },
    NUNCA_COMPROU: { fill: '#6b7280', bg: '#111827', glow: 'rgba(107,114,128,0.6)', border: '#374151', label: 'Nunca comprou' },
};

// ─── Estilo do mapa – dark theme personalizado ────────────────────────────
const MAP_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#0a0e1a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e1a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#4a6fa5' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4a6fa5' }, { weight: 1.5 }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#2a3f5f' }, { weight: 0.8 }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1a3a5c' }] },
    { featureType: 'road', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111827' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
];

interface TooltipInfo {
    lat: number;
    lng: number;
    clientes: Cliente[];
    estado: string;
}

interface MapaBrasilProps {
    clientes: Cliente[];
    filtroCategoria: ClienteCategoria | 'ALL';
    onFiltroChange: (cat: ClienteCategoria | 'ALL') => void;
}

// ─── Componente Interno: Marcadores e Efeitos ──────────────────────────────
const MapContent: React.FC<{ clientes: Cliente[] }> = ({ clientes }) => {
    const map = useMap();
    const [tooltip, setTooltip] = useState<{ lat: number; lng: number; cliente: Cliente } | null>(null);

    const clientesComCoords = useMemo(() => {
        return clientes.map(c => {
            if (c.lat != null && c.lng != null && !isNaN(c.lat) && !isNaN(c.lng)) {
                return {
                    ...c,
                    displayLat: c.lat,
                    displayLng: c.lng
                };
            }

            const sigla = normalizarEstado(c.estado || '') || normalizarEstado(c.cidade || '') || 'SP';
            const base = ESTADO_LAT_LNG[sigla] || ESTADO_LAT_LNG.SP;

            // Gerar offset estável baseado no ID do cliente para não "pular" entre renders
            let hash = 0;
            for (let i = 0; i < c.id.length; i++) { hash = c.id.charCodeAt(i) + ((hash << 5) - hash); }

            const offsetLat = ((hash % 100) / 100) * 1.5 - 0.75;
            const offsetLng = (((hash >> 8) % 100) / 100) * 1.5 - 0.75;

            return {
                ...c,
                displayLat: base.lat + offsetLat,
                displayLng: base.lng + offsetLng
            };
        });
    }, [clientes]);

    return (
        <>
            {clientesComCoords.map(cliente => {
                const cor = CATEGORIA_CORES[cliente.categoria] || CATEGORIA_CORES.CLIENTE_NOVO;
                const isDiamond = cliente.categoria === 'DIAMANTE';

                return (
                    <Marker
                        key={cliente.id}
                        position={{ lat: cliente.displayLat, lng: cliente.displayLng }}
                        onClick={() => setTooltip({ lat: cliente.displayLat, lng: cliente.displayLng, cliente })}
                        icon={{
                            path: window.google ? window.google.maps.SymbolPath.CIRCLE : 0,
                            fillColor: cor.fill,
                            fillOpacity: 1,
                            scale: isDiamond ? 7 : 5,
                            strokeColor: '#ffffff',
                            strokeWeight: 1.5,
                        }}
                    />
                );
            })}

            {/* Tooltip de Cliente Individual */}
            {tooltip && (
                <InfoWindow
                    position={{ lat: tooltip.lat, lng: tooltip.lng }}
                    onCloseClick={() => setTooltip(null)}
                    headerDisabled={true}
                    style={{
                        padding: 0,
                        margin: 0,
                    }}
                >
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 min-w-[200px] shadow-2xl">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-sm text-white leading-tight max-w-[150px] truncate">{tooltip.cliente.nome}</h4>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">{tooltip.cliente.cidade || 'N/A'} - {tooltip.cliente.estado || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold truncate max-w-[100px]`} style={{ background: CATEGORIA_CORES[tooltip.cliente.categoria]?.bg || '#111', color: CATEGORIA_CORES[tooltip.cliente.categoria]?.fill || '#fff', border: `1px solid ${CATEGORIA_CORES[tooltip.cliente.categoria]?.fill || '#333'}44` }}>
                                {CATEGORIA_CORES[tooltip.cliente.categoria]?.label || 'Sem Categoria'}
                            </div>
                            {(tooltip.cliente.total_compras || tooltip.cliente.total_compras === 0) ? (
                                <span className="text-[10px] text-emerald-400 font-mono">
                                    {Number(tooltip.cliente.total_compras).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </InfoWindow>
            )}
        </>
    );
};

export const MapaBrasil: React.FC<MapaBrasilProps> = ({ clientes, filtroCategoria, onFiltroChange }) => {

    const clientesFiltrados = useMemo(() => {
        if (filtroCategoria === 'ALL') return clientes;
        return clientes.filter(c => c.categoria === filtroCategoria);
    }, [clientes, filtroCategoria]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px', background: '#020408', borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <APIProvider apiKey={API_KEY} libraries={['marker', 'geometry']}>
                <Map
                    defaultCenter={{ lat: -15.7998, lng: -47.864 }}
                    defaultZoom={4.2}
                    gestureHandling="greedy"
                    disableDefaultUI={true}
                    styles={MAP_STYLES}
                    style={{ width: '100%', height: '100%' }}
                >
                    <MapContent clientes={clientesFiltrados} />
                </Map>
            </APIProvider>
        </div>
    );
};
