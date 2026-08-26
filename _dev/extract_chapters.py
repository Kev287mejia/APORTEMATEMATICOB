import re

with open('scraped_odrin.html', 'r', encoding='utf-8') as f:
    html = f.read()

items = re.findall(r'<div class="bb-item"[^>]*id="([^"]+)"[^>]*>(.*?)(?=(?:<div class="bb-item"|</div>\s*<nav>))', html, re.DOTALL)
print(f"Total bb-items extracted: {len(items)}")

for idx, (item_id, content) in enumerate(items):
    h = re.search(r'<h1 class="chapter-heading">(.*?)</h1>', content)
    title = h.group(1) if h else "Sin titulo"
    print(f"Item {idx+1} [id={item_id}]: {title} (Length: {len(content)} chars)")
