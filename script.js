// =====================================================
//  APORTE MATEMATICO — JavaScript
//  Recreación exacta del tema Odrin con pasarela PayPal
// =====================================================
var $ = window.jQuery || window.$;

// Configuración de la edición digital
var DIGITAL_BOOK_PRICE = '10.00'; // Precio en USD para la versión digital
var KASHTAG = '$aportematematico'; // Kashtag oficial para transferencias Kash
var STORAGE_KEY = 'aporte_matematico_digital_unlocked';
var paypalRendered = false;

// Enviar notificaciones por correo via Vercel Serverless
function sendEmailNotification(type, payloadData) {
  return fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: type, data: payloadData })
  }).catch(function(err) {
    console.error('Error enviando correo:', err);
  });
}

// Actualizar precio dinámicamente según idioma seleccionado
function updateDigitalPrice() {
  var langSelect = document.getElementById('digitalBookLangSelect');
  var badge = document.getElementById('digitalPriceBadge');
  if (langSelect && badge) {
    if (langSelect.value === 'all') {
      DIGITAL_BOOK_PRICE = '15.00';
      badge.textContent = '$15.00 USD';
    } else {
      DIGITAL_BOOK_PRICE = '10.00';
      badge.textContent = '$10.00 USD';
    }
  }
}

// Cambiar entre pestañas de pago (PayPal vs Kash)
function switchPaymentTab(tab) {
  var btnPaypal = document.getElementById('tabBtnPaypal');
  var btnKash = document.getElementById('tabBtnKash');
  var panePaypal = document.getElementById('panePaypal');
  var paneKash = document.getElementById('paneKash');

  if (tab === 'paypal') {
    if (btnPaypal) btnPaypal.classList.add('active');
    if (btnKash) btnKash.classList.remove('active');
    if (panePaypal) panePaypal.classList.add('active');
    if (paneKash) paneKash.classList.remove('active');
  } else {
    if (btnKash) btnKash.classList.add('active');
    if (btnPaypal) btnPaypal.classList.remove('active');
    if (paneKash) paneKash.classList.add('active');
    if (panePaypal) panePaypal.classList.remove('active');
  }
}

// Copiar Kashtag al portapapeles
function copyKashtag() {
  var tag = KASHTAG || '$aportematematico';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(tag).then(showCopyNotice);
  } else {
    var ta = document.createElement('textarea');
    ta.value = tag;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showCopyNotice();
  }
}

function showCopyNotice() {
  var notice = document.getElementById('copyNotice');
  if (notice) {
    notice.style.display = 'block';
    setTimeout(function() { notice.style.display = 'none'; }, 3000);
  }
}

// ---- Verificación de compra digital ----
function isDigitalBookPurchased(lang) {
  try {
    var val = localStorage.getItem(STORAGE_KEY);
    if (!val) return false;
    if (val === 'true' || val === 'all') return true;
    if (lang && val === lang) return true;
    if (!lang && (val === 'es' || val === 'en')) return true;
    return false;
  } catch (e) {
    return false;
  }
}

// Desbloquear libro digital y guardar en almacenamiento local
function unlockDigitalBook(purchaseData, langUnlocked) {
  var lang = langUnlocked || 'all';
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    if (purchaseData) {
      localStorage.setItem(STORAGE_KEY + '_data', JSON.stringify(purchaseData));
    }
  } catch (e) {
    console.error('No se pudo guardar el estado de compra:', e);
  }
  
  // Actualizar UI
  updateUnlockUI();
  
  // Cerrar modal de compra si está abierto
  closeDigitalPurchaseModal();
  
  // Abrir lector si no estaba abierto y refrescar página
  var startLang = (lang === 'en') ? 'en' : 'es';
  var reader = document.getElementById('book-container');
  if (reader && reader.classList.contains('showBook')) {
    switchBookLang(startLang);
    goToBookPage(currentBookPage);
  } else {
    openBookReader(startLang, 1);
  }

  // Notificación formal
  var langText = (lang === 'es') ? 'Español' : (lang === 'en') ? 'Inglés' : 'Español e Inglés';
  alert('¡Pago completado con éxito! Las 168 páginas completas del libro han sido desbloqueadas (' + langText + ').');
}

// Actualizar elementos visuales de desbloqueo en la página y lector
function updateUnlockUI() {
  var isUnlocked = isDigitalBookPurchased();
  var hasEs = isDigitalBookPurchased('es');
  var hasEn = isDigitalBookPurchased('en');
  
  if (isUnlocked) {
    document.body.classList.add('book-unlocked');
  } else {
    document.body.classList.remove('book-unlocked');
  }

  // Badge en el lector
  var badge = document.getElementById('unlockedBadge');
  if (badge) {
    if (isUnlocked) badge.classList.add('show');
    else badge.classList.remove('show');
  }

  // Mostrar tarjeta de lectura en Hero
  var heroCard = document.getElementById('heroUnlockedCard');
  if (heroCard) {
    if (isUnlocked) heroCard.classList.add('show');
    else heroCard.classList.remove('show');
    
    var esLinks = document.getElementById('unlocked-es-links');
    var enLinks = document.getElementById('unlocked-en-links');
    if (esLinks) esLinks.style.display = hasEs ? 'flex' : 'none';
    if (enLinks) enLinks.style.display = hasEn ? 'flex' : 'none';
  }

  // Actualizar botones de la portada
  var btnDigital = document.getElementById('btn-comprar-digital');
  if (btnDigital) {
    if (isUnlocked) {
      btnDigital.querySelector('span').textContent = 'Leer Libro (Desbloqueado)';
      btnDigital.onclick = function() { openBookReader(hasEs ? 'es' : 'en', 1); };
    }
  }
}

// Algoritmo de validación de códigos de activación
function isValidActivationCode(code) {
  if (!code) return false;
  var c = code.trim().toUpperCase();

  // 1. Códigos maestros con prefijo controlado
  if (c.indexOf('BIENVE') === 0 || c.indexOf('APORTE') === 0) return true;
  if (c === 'LIBRO2026' || c === 'ACTIVAR100') return true;

  // 2. Formato oficial del generador: MAT-ES-XXXX-XXXX / MAT-EN-XXXX-XXXX / MAT-ALL-XXXX-XXXX
  if (/^MAT-(ES|EN|ALL)-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c)) return true;

  // 3. Formato legacy: MAT-XXXX-XXXX
  if (/^MAT-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c)) return true;

  // 4. ID de transacción real de PayPal (formato: 17-22 chars alfanuméricos uppercase, sin espacios)
  //    Ejemplo real: 6XG44893VE123456A   /   PAYID-XXXXXXXXXXXXXXX
  if (/^[A-Z0-9]{17,22}$/.test(c)) return true;
  if (/^PAYID-[A-Z0-9]{15,20}$/.test(c)) return true;

  // Cualquier otra cadena genérica es RECHAZADA
  return false;
}

// Restaurar compra manual o activar mediante código de WhatsApp / Kash
function restorePurchasePrompt() {
  var code = prompt('Ingresa tu Código de Activación (enviado por WhatsApp) o tu ID de transacción de PayPal:');
  if (code && code.trim().length > 0) {
    var cleanCode = code.trim().toUpperCase();
    if (isValidActivationCode(cleanCode)) {
      var langUnlocked = 'all';
      if (cleanCode.indexOf('MAT-ES-') === 0) langUnlocked = 'es';
      else if (cleanCode.indexOf('MAT-EN-') === 0) langUnlocked = 'en';
      else if (cleanCode.indexOf('MAT-ALL-') === 0) langUnlocked = 'all';

      unlockDigitalBook({
        id: cleanCode,
        type: 'ACTIVATION_CODE',
        date: new Date().toISOString()
      }, langUnlocked);
    } else {
      alert('El código ingresado no es válido. Por favor verifica que esté bien escrito o contáctanos por WhatsApp.');
    }
  }
}

// Modal de compra digital
function openDigitalPurchaseModal() {
  if (isDigitalBookPurchased()) {
    openBookReader();
    return;
  }
  var modal = document.getElementById('digitalPurchaseModal');
  if (modal) {
    modal.classList.add('open');
    initPayPalButtons();
  }
}

function closeDigitalPurchaseModal() {
  var modal = document.getElementById('digitalPurchaseModal');
  if (modal) modal.classList.remove('open');
}

// Inicializar botones de PayPal SDK
function initPayPalButtons() {
  if (paypalRendered) return;
  var container = document.getElementById('paypal-button-container');
  if (!container) return;

  if (typeof paypal !== 'undefined') {
    paypal.Buttons({
      style: {
        layout: 'vertical',
        color:  'gold',
        shape:  'rect',
        label:  'paypal'
      },
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            description: 'Libro Digital: Un Aporte Matemático en el Siglo 21',
            amount: {
              currency_code: 'USD',
              value: DIGITAL_BOOK_PRICE
            }
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          var langSelect = document.getElementById('digitalBookLangSelect');
          var selectedLang = langSelect ? langSelect.value : 'all';
          var payerName = (details.payer && details.payer.name) ? (details.payer.name.given_name + ' ' + (details.payer.name.surname || '')) : 'Comprador';
          var payerEmail = (details.payer) ? details.payer.email_address : '';
          
          // Enviar alerta de compra y correo de agradecimiento (Silencioso)
          sendEmailNotification('purchase', {
            customerName: payerName,
            customerEmail: payerEmail,
            language: selectedLang,
            price: DIGITAL_BOOK_PRICE,
            transactionId: details.id
          });

          unlockDigitalBook({
            id: details.id,
            payerName: payerName,
            payerEmail: payerEmail,
            status: details.status,
            date: new Date().toISOString()
          }, selectedLang);
        });
      },
      onError: function(err) {
        console.error('Detalle error PayPal:', err);
        // Si el usuario intenta pagarse a sí mismo o la cuenta está en revisión
        alert('Nota de PayPal: No es posible realizar un pago hacia tu misma cuenta personal o la cuenta requiere confirmar su correo en PayPal. Si eres el dueño de la cuenta, prueba con una cuenta o tarjeta distinta de un tercero.');
      }
    }).render('#paypal-button-container');

    paypalRendered = true;
  } else {
    container.innerHTML = '<p style="font-family: var(--font-ui); font-size: 0.8rem; color: #888; text-align: center;">Cargando pasarela de pago segura...</p>';
  }
}

// ---- Scroll Animations (WOW.js / animate.css) ----
function initScrollAnimations() {
  var els = document.querySelectorAll('.is-wow');
  if (!els.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = el.dataset.wowDelay || '0s';
      var cls = '';
      if (el.classList.contains('fadeInUp'))   cls = 'fadeInUp';
      else if (el.classList.contains('fadeIn')) cls = 'fadeIn';
      else if (el.classList.contains('fadeInDown')) cls = 'fadeInDown';
      else cls = 'fadeIn';
      el.style.animationDelay = delay;
      el.classList.add('animated', cls);
      observer.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  els.forEach(function(el) { observer.observe(el); });
}

// =====================================================
//  PURE CSS3 3D PAGE-FLIP DIGITAL BOOK READER ENGINE
// =====================================================
var TOTAL_BOOK_PAGES = 168;
var SAMPLE_LIMIT = 15;          // Páginas de muestra gratuita antes del paywall
var currentBookPage = 1;
var currentBookLang = 'es';
var isFlipping = false;

function getPageFolder(lang) {
  return (lang === 'en') ? 'LIBROS/paginas_en' : 'LIBROS/paginas_es';
}

function updatePageCounter(pageNum) {
  var el = document.getElementById('flipPageCounter');
  if (el) el.textContent = 'Página ' + pageNum + ' / ' + TOTAL_BOOK_PAGES;
}

function checkDRM(pageNum) {
  var overlay = document.getElementById('physicalLockOverlay');
  if (!overlay) return;
  if (pageNum > SAMPLE_LIMIT && !isDigitalBookPurchased(currentBookLang)) {
    overlay.classList.add('show');
  } else {
    overlay.classList.remove('show');
  }
}

var pageFlipInstance = null;

function initOrUpdatePageFlip(lang) {
  var bookEl = document.getElementById('stPageFlipBook');
  if (!bookEl) return;
  
  if (pageFlipInstance) {
    pageFlipInstance.destroy();
    pageFlipInstance = null;
  }
  
  var folder = getPageFolder(lang);
  var html = '';
  for (var i = 1; i <= TOTAL_BOOK_PAGES; i++) {
    var isCover = (i === 1 || i === TOTAL_BOOK_PAGES) ? ' --cover' : '';
    html += '<div class="st-page' + isCover + '"><img src="' + folder + '/page_' + i + '.jpg" alt="Página ' + i + '" loading="lazy"></div>';
  }
  bookEl.innerHTML = html;
  bookEl.style.display = 'block';

  pageFlipInstance = new St.PageFlip(bookEl, {
    width: 922,
    height: 1178,
    size: "stretch",
    minWidth: 300,
    maxWidth: 2000,
    minHeight: 400,
    maxHeight: 2500,
    showCover: true,
    maxShadowOpacity: 0.5,
    drawShadow: true,
    flippingTime: 1000,
    usePortrait: true,
    useMouseEvents: true,
    swipeDistance: 30
  });

  pageFlipInstance.loadFromHTML(document.querySelectorAll('.st-page'));

  pageFlipInstance.on('flip', function(e) {
    var newPage = e.data + 1; // e.data is 0-indexed
    currentBookPage = newPage;
    updatePageCounter(newPage);
    syncTOC(newPage);
    
    if (newPage > SAMPLE_LIMIT && !isDigitalBookPurchased(currentBookLang)) {
      checkDRM(newPage);
      setTimeout(function() { pageFlipInstance.flip(SAMPLE_LIMIT - 1); }, 10);
    } else {
      checkDRM(newPage);
    }
  });
}

function showPageInstant(pageNum, lang) {
  currentBookPage = pageNum;
  if (!pageFlipInstance) {
    initOrUpdatePageFlip(lang);
  }
  pageFlipInstance.flip(pageNum - 1);
  updatePageCounter(pageNum);
  syncTOC(pageNum);
  checkDRM(pageNum);
}

function nextBookPage() {
  if (pageFlipInstance) pageFlipInstance.flipNext();
}

function prevBookPage() {
  if (pageFlipInstance) pageFlipInstance.flipPrev();
}

function goToBookPage(pageNum) {
  pageNum = parseInt(pageNum, 10);
  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (pageNum > TOTAL_BOOK_PAGES) pageNum = TOTAL_BOOK_PAGES;
  showPageInstant(pageNum, currentBookLang);
  closeBookMenu();
}

function switchBookLang(lang) {
  currentBookLang = (lang === 'en') ? 'en' : 'es';
  var btnEs = document.getElementById('btnModeEs');
  var btnEn = document.getElementById('btnModeEn');
  if (btnEs && btnEn) {
    btnEs.classList.toggle('active', currentBookLang === 'es');
    btnEn.classList.toggle('active', currentBookLang === 'en');
  }
  initOrUpdatePageFlip(currentBookLang);
  pageFlipInstance.flip(currentBookPage - 1);
}

function openBookReader(lang, page) {
  var container = document.getElementById('book-container');
  if (!container) return;

  container.classList.add('showBook');
  document.body.classList.add('body--disabled');
  updateUnlockUI();

  if (lang) {
    currentBookLang = (lang === 'en') ? 'en' : 'es';
    var btnEs = document.getElementById('btnModeEs');
    var btnEn = document.getElementById('btnModeEn');
    if (btnEs && btnEn) {
      btnEs.classList.toggle('active', currentBookLang === 'es');
      btnEn.classList.toggle('active', currentBookLang === 'en');
    }
  }

  var startPage = page ? parseInt(page, 10) : currentBookPage;
  if (isNaN(startPage) || startPage < 1) startPage = 1;
  
  if (!pageFlipInstance) {
    initOrUpdatePageFlip(currentBookLang);
  }
  
  pageFlipInstance.flip(startPage - 1);
  updatePageCounter(startPage);
  syncTOC(startPage);
  checkDRM(startPage);
}

function closeBookReader() {
  var container = document.getElementById('book-container');
  if (!container) return;
  container.classList.remove('showBook');
  container.classList.remove('slideRight');
  document.body.classList.remove('body--disabled');
}

function toggleBookMenu() {
  var container = document.getElementById('book-container');
  if (!container) return;
  container.classList.toggle('slideRight');
}

function closeBookMenu() {
  var container = document.getElementById('book-container');
  if (!container) return;
  container.classList.remove('slideRight');
}

function syncTOC(pageNum) {
  var items = document.querySelectorAll('#menu-toc li');
  if (!items || !items.length) return;
  var chapterPages = [1, 7, 11, 27, 43, 57, 75, 93, 115, 147, 165];
  var targetIdx = 0;
  for (var j = 0; j < chapterPages.length; j++) {
    if (chapterPages[j] <= pageNum) targetIdx = j;
  }
  items.forEach(function(li, i) {
    li.classList.toggle('menu-toc-current', i === targetIdx);
  });
}

// Keyboard directional arrows — native, no jQuery needed
document.addEventListener('keydown', function(e) {
  var container = document.getElementById('book-container');
  if (!container || !container.classList.contains('showBook')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextBookPage(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prevBookPage(); }
  if (e.key === 'Escape') closeBookReader();
});



// =====================================================
//  INIT
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
  initScrollAnimations();
  updateUnlockUI();

  // Auto-open reader if URL contains read-book (identical to https://aportematematico.com/?&read-book=9)
  if (window.location.search.indexOf('read-book') !== -1) {
    setTimeout(function() {
      openBookReader('es', 1);
    }, 100);
  }

  // Close modal on backdrop click
  var modalBackdrop = document.getElementById('digitalPurchaseModal');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function(e) {
      if (e.target === modalBackdrop) closeDigitalPurchaseModal();
    });
  }

  // Modal close on Escape
  document.addEventListener('keydown', function(e) {
    var modal = document.getElementById('digitalPurchaseModal');
    if (modal && modal.classList.contains('open') && e.key === 'Escape') {
      closeDigitalPurchaseModal();
    }
  });

  // Swipe support for mobile on the flipViewport
  var swipeStartX = 0;
  var swipeTarget = document.getElementById('physicalBookWrapper') || document.body;
  swipeTarget.addEventListener('touchstart', function(e) {
    swipeStartX = e.touches[0].clientX;
  }, { passive: true });
  swipeTarget.addEventListener('touchend', function(e) {
    var diff = swipeStartX - e.changedTouches[0].clientX;
    var container = document.getElementById('book-container');
    if (!container || !container.classList.contains('showBook')) return;
    if (Math.abs(diff) > 60) {
      if (diff > 0) nextBookPage();
      else prevBookPage();
    }
  }, { passive: true });

  // =====================================================
  //  ESCUDO DE SEGURIDAD & ANTIPIRATERÍA (Lectura Protegida)
  // =====================================================
  function isInputField(target) {
    if (!target) return false;
    var tag = (target.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA';
  }

  // 1. Bloquear clic derecho (menú contextual) en ventana completa
  window.addEventListener('contextmenu', function(e) {
    if (!isInputField(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 2. Bloquear inicio de selección con mouse/táctil
  window.addEventListener('selectstart', function(e) {
    if (!isInputField(e.target)) {
      e.preventDefault();
      return false;
    }
  }, true);

  // 3. Deseleccionar inmediatamente cualquier texto resaltado
  document.addEventListener('selectionchange', function() {
    var active = document.activeElement;
    if (isInputField(active)) return;
    var sel = window.getSelection ? window.getSelection() : null;
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      sel.removeAllRanges();
    }
  });

  // 4. Bloquear copia y vaciar portapapeles
  window.addEventListener('copy', function(e) {
    if (!isInputField(e.target)) {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '');
      }
      return false;
    }
  }, true);

  window.addEventListener('cut', function(e) {
    if (!isInputField(e.target)) {
      e.preventDefault();
      return false;
    }
  }, true);

  window.addEventListener('dragstart', function(e) {
    if (!isInputField(e.target)) {
      e.preventDefault();
      return false;
    }
  }, true);

  // 5. Bloquear atajos de teclado para guardar, imprimir, copiar e inspeccionar
  window.addEventListener('keydown', function(e) {
    var key = e.key || '';
    var code = e.keyCode || 0;
    var ctrlOrCmd = e.ctrlKey || e.metaKey;

    if (isInputField(e.target)) return;

    // Bloquear Ctrl+S (Guardar página / archivo)
    if (ctrlOrCmd && (key === 's' || key === 'S' || code === 83)) {
      e.preventDefault();
      return false;
    }
    // Bloquear Ctrl+P (Imprimir o exportar a PDF)
    if (ctrlOrCmd && (key === 'p' || key === 'P' || code === 80)) {
      e.preventDefault();
      return false;
    }
    // Bloquear Ctrl+C / Ctrl+X / Ctrl+A (Copiar / Cortar / Seleccionar todo)
    if (ctrlOrCmd && (key === 'c' || key === 'C' || key === 'x' || key === 'X' || key === 'a' || key === 'A' || code === 67 || code === 88 || code === 65)) {
      e.preventDefault();
      return false;
    }
    // Bloquear Ctrl+U (Ver código fuente)
    if (ctrlOrCmd && (key === 'u' || key === 'U' || code === 85)) {
      e.preventDefault();
      return false;
    }
    // Bloquear F12 / Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (Herramientas de Desarrollador)
    if (code === 123 || (ctrlOrCmd && e.shiftKey && (key === 'I' || key === 'i' || key === 'J' || key === 'j' || key === 'C' || key === 'c' || code === 73 || code === 74 || code === 67))) {
      e.preventDefault();
      return false;
    }
    // Detección de tecla PrintScreen (Captura de pantalla)
    if (key === 'PrintScreen' || code === 44) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('');
      }
    }
  }, true);
});
