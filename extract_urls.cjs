const fs = require('fs');

try {
    const rawData = fs.readFileSync('api_data.json', 'utf8');
    const data = JSON.parse(rawData);

    data.forEach(item => {
        const url = (item.url || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        if (url.includes('clientes') || title.includes('clientes')) {
            console.log(`${item.type} ${item.url} - ${item.title || 'No Title'}`);
        }
    });
} catch (error) {
    console.error('Error:', error.message);
}
