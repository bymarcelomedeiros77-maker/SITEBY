import json

try:
    with open('api_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for item in data:
        if 'url' in item and 'clientes' in item.get('url', '').lower():
            print(f"{item['type']} {item['url']} - {item.get('title', 'No Title')}")
        elif 'title' in item and 'clientes' in item.get('title', '').lower():
             print(f"{item['type']} {item['url']} - {item.get('title', 'No Title')}")

except Exception as e:
    print(e)
