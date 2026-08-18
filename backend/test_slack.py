import requests

login = requests.post('http://localhost:8000/api/auth/login', json={'email': 'admin@netshield.ai', 'password': 'Admin@123'})
token = login.json().get('access_token', '')
headers = {'Authorization': 'Bearer ' + token}

gen = requests.post('http://localhost:8000/api/traffic/generate', json={'count': 20, 'anomaly_ratio': 0.8}, headers=headers)
print('Capture status:', gen.status_code)

score = requests.post('http://localhost:8000/api/anomaly/score', json={'limit': 20}, headers=headers)
print('Score status:', score.status_code)

results = score.json()
print('Results count:', len(results))
for r in results:
    print('Attack:', r['predicted_attack_type'], '| Risk:', r['risk_score'], '| Level:', r['risk_level'])
