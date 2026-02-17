const https = require('https');

const COMPANY_ID = '0fa64946-e4e6-4f43-8f3d-337f3bb7ddea';
const API_KEY = '85z2hckXyE8tp59k';

const combos = [
    { name: "Original", headers: { 'Company-Id': COMPANY_ID, 'Api-Key': API_KEY } },
    { name: "Auth Bearer", headers: { 'Authorization': `Bearer ${API_KEY}`, 'Company-Id': COMPANY_ID } },
    { name: "Auth Basic", headers: { 'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`, 'Company-Id': COMPANY_ID } },
    { name: "X-API-KEY", headers: { 'X-API-KEY': API_KEY, 'Company-Id': COMPANY_ID } },
    { name: "apikey (lowercase)", headers: { 'apikey': API_KEY, 'Company-Id': COMPANY_ID } },
    { name: "apiKey (camelCase)", headers: { 'apiKey': API_KEY, 'Company-Id': COMPANY_ID } },
    { name: "Api-Token", headers: { 'Api-Token': API_KEY, 'Company-Id': COMPANY_ID } }
];

const fs = require('fs');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('verify_output.txt', msg + '\n');
}

function testCombo(combo) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'integracao.meuvesti.com',
            port: 443,
            path: `/api/v1/customers/company/${COMPANY_ID}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...combo.headers
            }
        };

        log(`Testing Combo: ${combo.name}`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                log(`[${combo.name}] Status: ${res.statusCode}`);
                log(`[${combo.name}] Body Peek: ${data.substring(0, 200)}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            log(`[${combo.name}] Error: ${e.message}`);
            resolve();
        });

        req.end();
    });
}

async function run() {
    for (const combo of combos) {
        await testCombo(combo);
    }
}

run();
