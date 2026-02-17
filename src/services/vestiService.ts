import { supabase } from './supabase';
import { Cliente } from '../types';

// USAR PROXY REVERSO (Configurado no Vite e Nginx)
// Isso faz o browser chamar o próprio domínio (/api/vesti), evitando CORS completamente.
// O Proxy no Vite transforma /api/vesti/v1/... em https://integracao.meuvesti.com/api/v1/...
const VESTI_API_URL = '/api/vesti/v1';

const COMPANY_ID = import.meta.env.VITE_VESTI_COMPANY_ID;
const API_KEY = import.meta.env.VITE_VESTI_API_KEY;

if (!COMPANY_ID || !API_KEY) {
    console.error("Vesti credentials missing in .env file");
}

interface VestiClient {
    id: string;
    name: string;
    document: string; // CPF/CNPJ
    email: string;
    phone: string;
    instagram: string;
    active: boolean;
    // Adicione outros campos conforme a resposta da API real
    address?: {
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        zip_code: string;
        complement: string;
    };
    // Às vezes vem plano (flat) dependendo da API, ajustar se necessário
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
}

export const vestiService = {
    // 1. Fetch Clients using Local Reverse Proxy
    getClients: async (): Promise<VestiClient[]> => {
        try {
            // Define um intervalo de datas amplo para pegar todos os clientes
            // Ajuste conforme a necessidade de negócio (ex: últimos 5 anos)
            const startDate = encodeURIComponent('2020-01-01 00:00:00');
            const endDate = encodeURIComponent('2030-12-31 23:59:59');

            const url = `${VESTI_API_URL}/customers/company/${COMPANY_ID}?start_date=${startDate}&end_date=${endDate}`;
            console.log(`[Vesti] Conectando via Proxy Local: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': API_KEY, // Header correto identificado: 'apikey'
                    'Company-Id': COMPANY_ID
                }
            });

            if (!response.ok) {
                const errText = await response.text().catch(() => response.statusText);
                console.error(`[Vesti] Erro API (${response.status}):`, errText);
                throw new Error(`Erro API Vesti (${response.status}): ${errText}`);
            }

            const json = await response.json();

            // A resposta bem sucedida tem o formato { response: [...] }
            if (json.response && Array.isArray(json.response)) {
                return json.response as VestiClient[];
            }

            // Fallback se a estrutura for diferente
            if (Array.isArray(json)) return json;
            if (json.items && Array.isArray(json.items)) return json.items;

            console.warn('[Vesti] Estrutura de resposta inesperada:', json);
            return [];

        } catch (error) {
            console.error('[Vesti] Falha crítica na conexão:', error);
            throw error;
        }
    },

    // 2. Sync Clients to Supabase
    syncClients: async (onProgress: (msg: string) => void): Promise<number> => {
        onProgress('Estabelecendo conexão segura com Vesti...');
        try {
            const vestiClients = await vestiService.getClients();

            onProgress(`Conexão estavel! ${vestiClients.length} clientes encontrados.`);
            let syncedCount = 0;

            for (const vClient of vestiClients) {
                // Map Vesti -> Supabase
                const clienteData: Partial<Cliente> = {
                    nome: vClient.name,
                    email: vClient.email,
                    contato: vClient.phone,
                    instagram: vClient.instagram,
                    cpf_cnpj: vClient.document,
                    // Mapeamento de endereço (se disponível na API)
                    endereco: vClient.address?.street || vClient.endereco,
                    numero: vClient.address?.number || vClient.numero,
                    complemento: vClient.address?.complement || '',
                    bairro: vClient.address?.neighborhood || vClient.bairro,
                    cidade: vClient.address?.city || vClient.cidade,
                    estado: vClient.address?.state || vClient.uf,
                    cep: vClient.address?.zip_code || vClient.cep,

                    vesti_id: vClient.id,
                    status: vClient.active ? 'ATIVO' : 'INATIVO',
                    categoria: 'BRONZE' // Default
                };

                // Remove undefined
                Object.keys(clienteData).forEach(key =>
                    (clienteData as any)[key] === undefined && delete (clienteData as any)[key]
                );

                // Upsert Logic
                let existingId = null;

                // 1. Vesti ID
                if (clienteData.vesti_id) {
                    const { data: existingByVesti } = await supabase
                        .from('clientes')
                        .select('id')
                        .eq('vesti_id', clienteData.vesti_id)
                        .single();
                    if (existingByVesti) existingId = existingByVesti.id;
                }

                // 2. Email (somente se não achou pelo ID)
                if (!existingId && clienteData.email) {
                    const { data: existingByEmail } = await supabase
                        .from('clientes')
                        .select('id')
                        .eq('email', clienteData.email)
                        .single();
                    if (existingByEmail) existingId = existingByEmail.id;
                }

                // 3. CPF/CNPJ (somente se não achou pelos outros)
                if (!existingId && clienteData.cpf_cnpj) {
                    const { data: existingByDoc } = await supabase
                        .from('clientes')
                        .select('id')
                        .eq('cpf_cnpj', clienteData.cpf_cnpj)
                        .single();
                    if (existingByDoc) existingId = existingByDoc.id;
                }

                if (existingId) {
                    await supabase.from('clientes').update(clienteData).eq('id', existingId);
                } else {
                    await supabase.from('clientes').insert(clienteData);
                }
                syncedCount++;
                if (syncedCount % 5 === 0) onProgress(`Processando: ${syncedCount}/${vestiClients.length} clientes...`);
            }

            return syncedCount;

        } catch (error) {
            console.error(error);
            throw error;
        }
    }
};
