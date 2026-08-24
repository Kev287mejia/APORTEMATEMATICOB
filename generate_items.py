import re

def main():
    # Read current index.html
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Build 168 bb-item elements
    items = []
    for i in range(1, 169):
        loading = 'loading="eager"' if i <= 4 else 'loading="lazy"'
        item = f'''        <!-- PÁGINA {i} -->
        <div class="bb-item" id="item{i}" data-page="{i}">
          <div class="book-content book-page-content-wrapper">
            <div class="book-3d-page-frame">
              <img class="book-3d-page-img" src="LIBROS/paginas_es/page_{i}.jpg" data-src-es="LIBROS/paginas_es/page_{i}.jpg" data-src-en="LIBROS/paginas_en/page_{i}.jpg" alt="Página {i} de 168" {loading} ondragstart="return false;" />
              <div class="book-3d-page-number">Página {i} de 168</div>
            </div>
          </div>
        </div>'''
        items.append(item)
    
    items_block = '\n'.join(items)

    # TOC HTML with actual page targets
    toc_html = '''      <h3>Índice de Capítulos (168 Págs)</h3>
      <ul id="menu-toc" class="menu-toc">
        <li class="menu-toc-current"><a href="#item1" onclick="jumpTo3DPage(1); return false;">Pág 1: Portada</a></li>
        <li><a href="#item7" onclick="jumpTo3DPage(7); return false;">Pág 7: Resumen de la Obra</a></li>
        <li><a href="#item11" onclick="jumpTo3DPage(11); return false;">Pág 11: Cap. I - Algo que se dice de las Matemáticas</a></li>
        <li><a href="#item27" onclick="jumpTo3DPage(27); return false;">Pág 27: Cap. II - Vida y Obra de Pitágoras</a></li>
        <li><a href="#item43" onclick="jumpTo3DPage(43); return false;">Pág 43: Cap. III - Teorema de Pitágoras</a></li>
        <li><a href="#item57" onclick="jumpTo3DPage(57); return false;">Pág 57: Cap. IV - Conceptos Geométricos</a></li>
        <li><a href="#item75" onclick="jumpTo3DPage(75); return false;">Pág 75: Cap. V - Suma de Dos Cuadrados</a></li>
        <li><a href="#item93" onclick="jumpTo3DPage(93); return false;">Pág 93: Cap. VI - Fórmulas Bienve1 y Bienve2</a></li>
        <li><a href="#item115" onclick="jumpTo3DPage(115); return false;">Pág 115: Cap. VII - Ejemplos de Factorización</a></li>
        <li><a href="#item147" onclick="jumpTo3DPage(147); return false;">Pág 147: Cap. VIII - Conclusiones y Legado</a></li>
        <li><a href="#item165" onclick="jumpTo3DPage(165); return false;">Pág 165: Bibliografía y Contraportada</a></li>
      </ul>'''

    # Top bar HTML
    top_bar_html = '''    <!-- Reader Top Bar -->
    <div class="reader-top-bar" id="readerTopBar">
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="menu-button" id="tblcontents" style="position:static; margin:0; padding:4px 10px; font-size:13px;" title="Abrir Índice">
          <i class="icon-search">&#9776;</i> <span>Índice</span>
        </span>
        
        <div class="reader-mode-tabs" style="margin-left:8px;">
          <button type="button" class="reader-mode-btn active" id="btnModeEs" onclick="switchBookLang('es');">
            🇪🇸 Español (168 Págs)
          </button>
          <button type="button" class="reader-mode-btn" id="btnModeEn" onclick="switchBookLang('en');">
            🇺🇸 English (168 Pages)
          </button>
        </div>
      </div>

      <!-- Quick Chapter & Page Navigation -->
      <div style="display:flex; align-items:center; gap:10px;">
        <select id="book3dChapterSelect" class="physical-chapter-select" onchange="jumpTo3DPage(parseInt(this.value))">
          <option value="1">Pág 1: Portada</option>
          <option value="7">Pág 7: Resumen de la Obra</option>
          <option value="11">Pág 11: Cap. I - Algo que se dice de las Matemáticas</option>
          <option value="27">Pág 27: Cap. II - Vida y Obra de Pitágoras</option>
          <option value="43">Pág 43: Cap. III - Teorema de Pitágoras</option>
          <option value="57">Pág 57: Cap. IV - Conceptos Geométricos</option>
          <option value="75">Pág 75: Cap. V - Suma de Dos Cuadrados</option>
          <option value="93">Pág 93: Cap. VI - Fórmulas Bienve1 y Bienve2</option>
          <option value="115">Pág 115: Cap. VII - Ejemplos de Factorización</option>
          <option value="147">Pág 147: Cap. VIII - Conclusiones y Legado</option>
          <option value="165">Pág 165: Bibliografía y Contraportada</option>
        </select>

        <div style="display:flex; align-items:center; gap:5px; color:#faab9f; font-family:'Josefin Sans',sans-serif; font-size:13px; font-weight:700;">
          <span>Pág</span>
          <input type="number" id="book3dPageInput" min="1" max="168" value="1" onchange="jumpTo3DPage(parseInt(this.value))" onkeydown="if(event.key==='Enter') jumpTo3DPage(parseInt(this.value))" style="width:50px; text-align:center; background:#2c3035; color:#fff; border:1px solid #d38d45; border-radius:4px; padding:3px 4px; font-size:13px; font-weight:700;" />
          <span>de 168</span>
        </div>

        <!-- Zoom Controls -->
        <button type="button" class="physical-btn" onclick="zoomIn3DPage()" title="Acercar">+</button>
        <button type="button" class="physical-btn" onclick="zoomOut3DPage()" title="Alejar">-</button>
      </div>

      <div style="display:flex; align-items:center; gap:12px;">
        <div class="unlocked-badge" id="unlockedBadge">Edición Completa Desbloqueada</div>
        <button type="button" class="btn btn-color" id="btnUnlockBookTop" onclick="openDigitalPurchaseModal()" style="display:none; padding:4px 12px; font-size:12px;">🔑 Desbloquear</button>
        <span class="bb-nav-close" onclick="closeBookReader()" title="Cerrar lector" style="position:static; margin:0;">
          <i class="close-icon-color">&#10005;</i>
        </span>
      </div>
    </div>'''

    # Replace top bar
    html = re.sub(r'<!-- Reader Top Bar -->.*?<!-- TOC Menu Panel', top_bar_html + '\n\n    <!-- TOC Menu Panel', html, flags=re.DOTALL)

    # Replace menu-panel
    html = re.sub(r'<div class="menu-panel" id="menu-panel">.*?</div>\s*<!-- BookBlock 3D Wrapper', '<div class="menu-panel" id="menu-panel">\n' + toc_html + '\n    </div>\n\n    <!-- BookBlock 3D Wrapper', html, flags=re.DOTALL)

    # Replace bb-bookblock content
    bb_block = f'<div id="bb-bookblock" class="bb-bookblock">\n{items_block}\n      </div><!-- end bb-bookblock -->'
    html = re.sub(r'<div id="bb-bookblock" class="bb-bookblock">.*?</div><!-- end bb-bookblock -->', bb_block, html, flags=re.DOTALL)

    # Remove the redundant physicalBookWrapper since all 168 pages are now directly inside the 3D BookBlock engine!
    html = re.sub(r'<!-- PHYSICAL BOOK READER \(168 Pages HD\) -->.*?<!-- DIGITAL PURCHASE & UNLOCK MODAL', '<!-- DIGITAL PURCHASE & UNLOCK MODAL', html, flags=re.DOTALL)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print('index.html updated successfully with 168 3D BookBlock pages!')

if __name__ == '__main__':
    main()
