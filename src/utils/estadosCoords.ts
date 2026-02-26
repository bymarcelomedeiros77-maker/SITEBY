// Coordenadas (x, y) de cada estado no ViewBox do SVG do Brasil (0 0 800 900)
// Representam o centróide aproximado de cada estado dentro do SVG

export interface EstadoCoord {
    sigla: string;
    nome: string;
    x: number;
    y: number;
}

export const ESTADOS_COORDS: Record<string, EstadoCoord> = {
    AC: { sigla: 'AC', nome: 'Acre', x: 85, y: 400 },
    AM: { sigla: 'AM', nome: 'Amazonas', x: 185, y: 290 },
    RR: { sigla: 'RR', nome: 'Roraima', x: 215, y: 160 },
    PA: { sigla: 'PA', nome: 'Pará', x: 335, y: 250 },
    AP: { sigla: 'AP', nome: 'Amapá', x: 385, y: 150 },
    TO: { sigla: 'TO', nome: 'Tocantins', x: 390, y: 380 },
    MA: { sigla: 'MA', nome: 'Maranhão', x: 440, y: 260 },
    PI: { sigla: 'PI', nome: 'Piauí', x: 490, y: 290 },
    CE: { sigla: 'CE', nome: 'Ceará', x: 545, y: 230 },
    RN: { sigla: 'RN', nome: 'Rio Grande do Norte', x: 598, y: 222 },
    PB: { sigla: 'PB', nome: 'Paraíba', x: 586, y: 248 },
    PE: { sigla: 'PE', nome: 'Pernambuco', x: 563, y: 272 },
    AL: { sigla: 'AL', nome: 'Alagoas', x: 578, y: 296 },
    SE: { sigla: 'SE', nome: 'Sergipe', x: 562, y: 320 },
    BA: { sigla: 'BA', nome: 'Bahia', x: 502, y: 370 },
    RO: { sigla: 'RO', nome: 'Rondônia', x: 180, y: 410 },
    MT: { sigla: 'MT', nome: 'Mato Grosso', x: 270, y: 410 },
    DF: { sigla: 'DF', nome: 'Distrito Federal', x: 400, y: 465 },
    GO: { sigla: 'GO', nome: 'Goiás', x: 370, y: 465 },
    MG: { sigla: 'MG', nome: 'Minas Gerais', x: 450, y: 490 },
    ES: { sigla: 'ES', nome: 'Espírito Santo', x: 510, y: 490 },
    RJ: { sigla: 'RJ', nome: 'Rio de Janeiro', x: 480, y: 530 },
    SP: { sigla: 'SP', nome: 'São Paulo', x: 420, y: 540 },
    MS: { sigla: 'MS', nome: 'Mato Grosso do Sul', x: 300, y: 520 },
    PR: { sigla: 'PR', nome: 'Paraná', x: 370, y: 580 },
    SC: { sigla: 'SC', nome: 'Santa Catarina', x: 390, y: 620 },
    RS: { sigla: 'RS', nome: 'Rio Grande do Sul', x: 355, y: 670 },
};

// Normaliza sigla de estado: aceita strings com espaço, acento ou variações
export function normalizarEstado(input: string): string {
    if (!input) return '';
    const cleaned = input.trim().toUpperCase();
    // Se já é sigla de 2 letras
    if (cleaned.length === 2 && ESTADOS_COORDS[cleaned]) return cleaned;

    const nomeParaSigla: Record<string, string> = {
        'ACRE': 'AC', 'AMAZONAS': 'AM', 'RORAIMA': 'RR', 'PARA': 'PA', 'PARÁ': 'PA',
        'AMAPA': 'AP', 'AMAPÁ': 'AP', 'TOCANTINS': 'TO', 'MARANHAO': 'MA', 'MARANHÃO': 'MA',
        'PIAUI': 'PI', 'PIAUÍ': 'PI', 'CEARA': 'CE', 'CEARÁ': 'CE',
        'RIO GRANDE DO NORTE': 'RN', 'PARAIBA': 'PB', 'PARAÍBA': 'PB',
        'PERNAMBUCO': 'PE', 'ALAGOAS': 'AL', 'SERGIPE': 'SE', 'BAHIA': 'BA',
        'RONDONIA': 'RO', 'RONDÔNIA': 'RO', 'MATO GROSSO': 'MT',
        'DISTRITO FEDERAL': 'DF', 'GOIAS': 'GO', 'GOIÁS': 'GO',
        'MINAS GERAIS': 'MG', 'ESPIRITO SANTO': 'ES', 'ESPÍRITO SANTO': 'ES',
        'RIO DE JANEIRO': 'RJ', 'SAO PAULO': 'SP', 'SÃO PAULO': 'SP',
        'MATO GROSSO DO SUL': 'MS', 'PARANA': 'PR', 'PARANÁ': 'PR',
        'SANTA CATARINA': 'SC', 'RIO GRANDE DO SUL': 'RS',
    };
    return nomeParaSigla[cleaned] || '';
}
