import requests, json
url='http://127.0.0.1:8000/upload/holdings-csv'
path='D:/wealthOS/WealthOS/data/sample_holdings.csv'
with open(path,'rb') as f:
    files={'file': ('sample_holdings.csv', f, 'text/csv')}
    r=requests.post(url, files=files)
    print('status', r.status_code)
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print(r.text)
