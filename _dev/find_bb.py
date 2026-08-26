with open('scraped_odrin.html', 'r', encoding='utf-8') as f:
    html = f.read()

pos = 0
while True:
    idx = html.find('bb-bookblock', pos)
    if idx == -1:
        break
    print(f"\n--- OCCURRENCE AT {idx} ---")
    print(html[max(0, idx-80):min(len(html), idx+1500)])
    pos = idx + 12
