import { Cliente } from '../types';

const VESTI_API_URL = 'http://localhost:3000/api/vesti';
// API Key and Company ID are now handled by the backend proxy for auth,
// but we still need COMPANY_ID for URL construction if the API endpoint requires it in the path.
const COMPANY_ID = import.meta.env.VITE_VESTI_COMPANY_ID || '0fa64946-e4e6-4f43-8f3d-337f3bb7ddea';

const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

export const vestiAPI = {
    getProducts: async () => {
        const response = await fetch(`${VESTI_API_URL}/v1/products/company/${COMPANY_ID}`, { headers });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },

    // ... helper methods for create, update, delete

    getClients: async () => {
        const startDate = encodeURIComponent('2020-01-01 00:00:00');
        const endDate = encodeURIComponent('2030-12-31 23:59:59');
        const url = `${VESTI_API_URL}/v1/customers/company/${COMPANY_ID}?start_date=${startDate}&end_date=${endDate}`;
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    }
};
