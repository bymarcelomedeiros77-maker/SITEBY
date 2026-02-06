/**
 * Convert snake_case to camelCase
 */
const toCamelCase = (str: string): string => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase to snake_case
 */
const toSnakeCase = (str: string): string => {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Recursively transform object keys from snake_case to camelCase
 */
export const snakeToCamel = <T = any>(obj: any): T => {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => snakeToCamel(item)) as T;
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const newObj: any = {};
        for (const key in obj) {
            const camelKey = toCamelCase(key);
            newObj[camelKey] = snakeToCamel(obj[key]);
        }
        return newObj as T;
    }

    return obj;
};

/**
 * Recursively transform object keys from camelCase to snake_case
 */
export const camelToSnake = <T = any>(obj: any): T => {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => camelToSnake(item)) as T;
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const newObj: any = {};
        for (const key in obj) {
            const snakeKey = toSnakeCase(key);
            newObj[snakeKey] = camelToSnake(obj[key]);
        }
        return newObj as T;
    }

    return obj;
};

/**
 * Map Supabase response (snake_case) to TypeScript types (camelCase)
 */
export const mapSupabaseResponse = <T = any>(data: any): T => {
    return snakeToCamel<T>(data);
};

/**
 * Map TypeScript types (camelCase) to Supabase format (snake_case)
 */
export const mapToSupabase = <T = any>(data: any): T => {
    return camelToSnake<T>(data);
};
