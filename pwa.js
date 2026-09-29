/* Dressa — enregistrement du service worker + bouton « Installer l'application » */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function (e) { console.warn('SW:', e); });
    });
  }

  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return;

  var deferred = null;
  function bar(text, actionLabel, action) {
    if (document.getElementById('pwaBar')) return;
    var b = document.createElement('div');
    b.id = 'pwaBar';
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;' +
      'background:#111;color:#fff;border:1px solid #C08D3F;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:10px;' +
      'font:500 .9rem system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:520px;margin:0 auto';
    b.innerHTML = '<span style="flex:1">' + text + '</span>';
    if (action) {
      var i = document.createElement('button');
      i.textContent = actionLabel;
      i.style.cssText = 'background:#C08D3F;color:#111;border:0;border-radius:8px;padding:8px 12px;font:700 .85rem system-ui;cursor:pointer';
      i.onclick = function () { b.remove(); action(); };
      b.appendChild(i);
    }
    var x = document.createElement('button');
    x.textContent = '✕'; x.setAttribute('aria-label', 'Fermer');
    x.style.cssText = 'background:none;border:0;color:#bbb;font-size:1rem;cursor:pointer;padding:4px';
    x.onclick = function () { b.remove(); try { sessionStorage.setItem('pwaDismissed', '1'); } catch (e) {} };
    b.appendChild(x);
    document.body.appendChild(b);
  }
  function dismissed() { try { return sessionStorage.getItem('pwaDismissed'); } catch (e) { return false; } }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    if (dismissed()) return;
    setTimeout(function () {
      bar('Installer Dressa sur votre écran d\'accueil', 'Installer', function () {
        deferred.prompt(); deferred = null;
      });
    }, 2500);
  });
  window.addEventListener('appinstalled', function () {
    var b = document.getElementById('pwaBar'); if (b) b.remove();
  });

  // iOS Safari : pas d'invite automatique, on explique le geste
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  if (ios && !dismissed()) {
    setTimeout(function () {
      bar('Pour installer : touchez <b>Partager</b> puis <b>Sur l\'écran d\'accueil</b>');
    }, 3000);
  }
})();
