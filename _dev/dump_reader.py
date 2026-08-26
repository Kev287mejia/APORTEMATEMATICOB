with open('scraped_odrin.html', 'r', encoding='utf-8') as f:
    html = f.read()

start = html.find('book-container')
if start != -1:
    end = html.find('</body>', start)
    snippet = html[start-20:end if end != -1 else start+10000]
    with open('reader_scraped_snippet.html', 'w', encoding='utf-8') as out:
        out.write(snippet)
    print(f"Written reader snippet ({len(snippet)} bytes)")
