import os
import re

TARGET_DIRS = ['templates']

def process(fpath):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazar href="..." ignorando http, mailto, tel, #, o los que ya tienen {% static
    content = re.sub(r'href="(?!http|#|mailto:|tel:|{%)([^"]+)"', r'href="{% static \'\1\' %}"', content)
    
    # Reemplazar src="..." ignorando http, data:, o los que ya tienen {% static
    content = re.sub(r'src="(?!http|data:|{%)([^"]+)"', r'src="{% static \'\1\' %}"', content)
    
    if '{% load static %}' not in content:
        content = '{% load static %}\n' + content
        
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed static tags in {fpath}")

for d in TARGET_DIRS:
    for f in os.listdir(d):
        if f.endswith('.html'):
            process(os.path.join(d, f))
