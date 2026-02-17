const https = require('https');
const fs = require('fs');

const COMPANY_ID = '0fa64946-e4e6-4f43-8f3d-337f3bb7ddea';
const API_KEY = '85z2hckXyE8tp59k';

function log(msg) {
    console.log(msg);
    fs.appendFileSync('verify_output_final.txt', msg + '\n');
}

const options = {
    hostname: 'integracao.meuvesti.com',
    port: 443,
    path: `/api/v1/customers/company/${COMPANY_ID}?start_date=${encodeURIComponent('2020-01-01 00:00:00')}&end_date=${encodeURIComponent('2026-12-31 23:59:59')}`,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': API_KEY, // Confirmed working header
        'Company-Id': COMPANY_ID
    }
};

log(`Testing Final URL: https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        log(`STATUS: ${res.statusCode}`);
        if (res.statusCode === 200) {
            log('SUCCESS! Response Body Peek:');
            log(data.substring(0, 500));
            try {
                const json = JSON.parse(data);
                log('JSON Keys: ' + Object.keys(json).join(', '));
                if (json.items && json.items.length > 0) {
                    log('First Client Sample: ' + JSON.stringify(json.items[0], null, 2));
                }
            } catch (e) {
                log('Failed to parse JSON');
            }
        } else {
            log(`Error Body: ${data}`);
        }
    });
});

req.on('error', (e) => {
    log(`Borked: ${e.message}`);
});

req.end();
