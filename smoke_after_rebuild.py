import requests

base = 'https://fahem.pages.dev'
questions = requests.get(base + '/api/questions', timeout=20).json().get('questions', [])
assert questions and len(questions) == 80
assert all('correct_answer' not in q for q in questions)
login = requests.post(base + '/api/auth', json={'email': 'krm909909@hotmail.com', 'password': '00000000', 'name': 'كرم'}, headers={'X-Fahem-Debug': '1'}, timeout=20)
print('questions', len(questions), 'public_answer_leak', any('correct_answer' in q for q in questions), 'login_status', login.status_code, 'login_body', login.text[:180])
if login.status_code == 200:
    cookies = login.cookies
    print('admin_messages_status', requests.get(base + '/api/contact', cookies=cookies, timeout=20).status_code)
