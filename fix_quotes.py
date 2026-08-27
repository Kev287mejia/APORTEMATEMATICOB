import os

TARGET_DIRS = ['templates']

def process(fpath):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazar \' por '
    content = content.replace(r"\'", "'")
        
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed quotes in {fpath}")

for d in TARGET_DIRS:
    for f in os.listdir(d):
        if f.endswith('.html'):
            process(os.path.join(d, f))
