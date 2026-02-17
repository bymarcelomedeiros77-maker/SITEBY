const https = require('https');

const API_KEY = '85z2hckXyE8tp59k';
const COMPANY_ID = '0fa64946-e4e6-4f43-8f3d-337f3bb7ddea';

const options1 = {
  hostname: 'integracao.meuvesti.com',
  path: `/api/v1/customers/company/${COMPANY_ID}?start_date=2020-01-01&end_date=2025-12-31`,
  method: 'GET',
  headers: {
    'apikey': API_KEY,
    'Company-Id': COMPANY_ID,
    'Accept': 'application/json'
  }
};

const options2 = {
  hostname: 'integracao.meuvesti.com',
  path: `/v1/customers/company/${COMPANY_ID}?start_date=2020-01-01&end_date=2025-12-31`,
  method: 'GET',
  headers: {
    'apikey': API_KEY,
    'Company-Id': COMPANY_ID,
    'Accept': 'application/json'
  }
};

function test(name, opts) {
  const req = https.request(opts, (res) => {
    console.log(`${name}: Status ${res.statusCode}`);
    let data = '';
    res.on('data', (d) => data += d);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log(`${name}: SUCCESS! Data length: ${data.length}`);
        } else {
            console.log(`${name}: Failed. Response: ${data.substring(0, 100)}...`);
        }
    });
  });
  req.on('error', (e) => {
    console.error(`${name}: Error ${e.message}`);
  });
  req.end();
}

console.log('Testing /api/v1/...');
test('WITH_API_PREFIX', options1);

console.log('Testing /v1/...');
test('WITHOUT_API_PREFIX', options2);
