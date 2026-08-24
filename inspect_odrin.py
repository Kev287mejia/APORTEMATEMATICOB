import re
import os

with open('scraped_odrin.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'src=["\']([^"\']+\.js[^"\']*)["\']', html)
print('=== SCRIPTS ===')
for s in scripts:
    print(s)

styles = re.findall(r'href=["\']([^"\']+\.css[^"\']*)["\']', html)
print('\n=== STYLES ===')
for st in styles:
    print(st)

print('\n=== BOOK READER HTML SNIPPET ===')
match = re.search(r'(<div[^>]*class=["\'][^"\']*bb-[^"\']*["\'][^>]*>.*?</section>)', html, re.DOTALL)
if not match:
    match = re.search(r'(<div[^>]*id=["\']book[^"\']*["\'][^>]*>.*?</div>)', html, re.DOTALL)
if match:
    print(match.group(0)[:1500])
else:
    # search for bb-custom-wrapper or bookblock
    m2 = re.search(r'(<div[^>]*class="[^"]*bb-custom-wrapper[^"]*".*?</div>\s*</div>)', html, re.DOTALL)
    if m2:
        print(m2.group(0)[:1500])
    else:
        print("Searching for any 'bb-' classes...")
        for line in html.splitlines():
            if 'bb-' in line or 'book' in line.lower():
                print(line[:200])
