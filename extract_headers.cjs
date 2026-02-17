const fs = require('fs');

try {
    const rawData = fs.readFileSync('api_data.json', 'utf8');
    const data = JSON.parse(rawData);

    data.forEach(item => {
        if (item.header && item.header.fields && item.header.fields.Header) {
            console.log(`Endpoint: ${item.type} ${item.url}`);
            console.log('Headers:', item.header.fields.Header.map(h => `${h.field} (${h.type})`).join(', '));
            console.log('---');
        }
    });
} catch (error) {
    console.error('Error:', error.message);
}
