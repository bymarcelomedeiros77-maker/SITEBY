import { useState, useCallback } from 'react';
import { vestiAPI } from '../services/vestiAPI';

export const useVestiAPI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const request = useCallback(async <T>(apiCall: () => Promise<T>) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiCall();
            return result;
        } catch (err: any) {
            setError(err.message || 'Erro desconhecido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getClients = useCallback(() => request(vestiAPI.getClients), [request]);
    const getProducts = useCallback(() => request(vestiAPI.getProducts), [request]);

    return {
        loading,
        error,
        getClients,
        getProducts
    };
};
