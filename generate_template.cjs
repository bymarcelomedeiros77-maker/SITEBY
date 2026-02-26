const XLSX = require('xlsx');
const path = require('path');

const data = [
    {
        "NOME": "Cliente Exemplo",
        "TELEFONE": "11999999999",
        "CIDADE": "São Paulo",
        "INSTAGRAM": "@exemplo",
        "CNPJ - CPF": "000.000.000-00",
        "EMAIL": "cliente@exemplo.com",
        "DATA DE NASC.": "01/01/1990",
        "OBSERVAÇÃO": "Cliente vip",
        "CLIENTES NOVO": "DIAMANTE"
    },
    {
        "NOME": "Maria Silva",
        "TELEFONE": "21988888888",
        "CIDADE": "Rio de Janeiro",
        "INSTAGRAM": "@mariasilva",
        "CNPJ - CPF": "111.111.111-11",
        "EMAIL": "maria@email.com",
        "DATA DE NASC.": "15/05/1985",
        "OBSERVAÇÃO": "",
        "CLIENTES NOVO": "VAREJO"
    }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Clientes");

const outputPath = path.join(__dirname, 'modelo_importacao.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`Modelo criado com sucesso em: ${outputPath}`);
