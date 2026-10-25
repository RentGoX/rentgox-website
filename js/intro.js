/*!
 * RentGoX — intro splash + brand animation
 * Same feel as the app login screen: logo pops in (elastic scale + fade),
 * "RENTGOX" letters reveal one by one, subtitle fades in, then the splash
 * fades away. The header logo + name also animate once.
 *
 * USE: add ONE line inside <head> of the page (index.html):
 *      <script src="js/intro.js"></script>
 */
(function () {
  'use strict';

  var KEY = 'rentgox_intro_seen';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  var showIntro = !seen && !reduce;

  var FALLBACK_LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs>' +
    '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#222D4A"/>' +
    '<stop offset="1" stop-color="#D65430"/></linearGradient></defs>' +
    '<rect x="1" y="1" width="38" height="38" rx="11" fill="url(#g)"/>' +
    '<path d="M12 27V14.5h6.4c3 0 5 1.7 5 4.4 0 1.9-1 3.3-2.7 4l3.3 4.1h-3.5l-2.9-3.6h-2.5V27H12zm3.1-6.2h3c1.4 0 2.2-.7 2.2-1.9s-.8-1.9-2.2-1.9h-3v3.8z" fill="#fff"/></svg>'
  );

  /* ───────────────────────── CSS ───────────────────────── */
  var css = [
    /* lock scroll while splash is visible */
    'html.rgx-lock{overflow:hidden!important}',

    /* splash overlay (dark gradient like the app login screen) */
    '#rgx-intro{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;',
    'background:linear-gradient(160deg,#071626 0%,#081626 55%,#06111E 100%);overflow:hidden;',
    'transition:opacity .7s ease,transform .7s ease,visibility .7s}',
    '#rgx-intro.rgx-out{opacity:0;transform:scale(1.04);visibility:hidden;pointer-events:none}',

    /* faint cyan rings behind the logo */
    '#rgx-intro .rgx-ring{position:absolute;left:50%;top:50%;border-radius:50%;border:1px solid rgba(0,188,212,.10);',
    'transform:translate(-50%,-50%) scale(.6);opacity:0;animation:rgxRing 2.6s cubic-bezier(.16,1,.3,1) forwards}',
    '#rgx-intro .rgx-ring.r1{width:300px;height:300px;animation-delay:.05s}',
    '#rgx-intro .rgx-ring.r2{width:480px;height:480px;animation-delay:.2s}',
    '#rgx-intro .rgx-ring.r3{width:700px;height:700px;animation-delay:.35s}',
    '@keyframes rgxRing{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}',
    '35%{opacity:1}100%{opacity:.55;transform:translate(-50%,-50%) scale(1)}}',

    '#rgx-intro .rgx-center{position:relative;display:flex;flex-direction:column;align-items:center;padding:24px;text-align:center}',

    /* logo: scale .8 -> 1 with elastic overshoot + fade (same as the app) */
    '#rgx-intro .rgx-logo-wrap{position:relative;width:112px;height:112px;display:grid;place-items:center;margin-bottom:18px}',
    '#rgx-intro .rgx-logo{position:relative;z-index:2;width:100%;height:100%;object-fit:contain;border-radius:24px;',
    'opacity:0;transform:scale(.8);animation:rgxLogoIn .95s cubic-bezier(.34,1.56,.64,1) .1s forwards}',
    '@keyframes rgxLogoIn{0%{opacity:0;transform:scale(.8)}40%{opacity:1}100%{opacity:1;transform:scale(1)}}',
    '#rgx-intro .rgx-glow{position:absolute;inset:-14px;border-radius:50%;z-index:1;',
    'background:radial-gradient(circle,rgba(0,188,212,.40) 0%,rgba(0,188,212,0) 68%);',
    'opacity:0;animation:rgxGlow 2.4s ease-in-out .3s infinite}',
    '@keyframes rgxGlow{0%,100%{opacity:.25;transform:scale(.92)}50%{opacity:.85;transform:scale(1.08)}}',

    /* "RENTGOX" letters: slide up + fade one by one, spacing expands */
    '#rgx-intro .rgx-name{display:flex;justify-content:center;font-family:"Fraunces",Georgia,serif;font-weight:800;',
    'font-size:clamp(34px,9vw,60px);line-height:1.1;color:#00BCD4;letter-spacing:.5em;',
    'text-shadow:0 0 22px rgba(0,188,212,.45);animation:rgxSpace 1.5s cubic-bezier(.16,1,.3,1) .45s forwards}',
    '@keyframes rgxSpace{from{letter-spacing:.5em}to{letter-spacing:.14em}}',
    '#rgx-intro .rgx-l{display:inline-block;opacity:0;transform:translateY(22px) scale(.85);',
    'animation:rgxLetter .6s cubic-bezier(.34,1.56,.64,1) forwards;animation-delay:calc(.55s + var(--i)*75ms)}',
    '@keyframes rgxLetter{to{opacity:1;transform:none}}',
    '#rgx-intro .rgx-l.x{color:#D65430;text-shadow:0 0 22px rgba(214,84,48,.55)}',

    '#rgx-intro .rgx-sub{margin-top:12px;color:#9aa7b4;font:400 15px/1.4 "Inter",system-ui,sans-serif;letter-spacing:.04em;',
    'opacity:0;transform:translateY(8px);animation:rgxSub .8s ease 1.55s forwards}',
    '@keyframes rgxSub{to{opacity:1;transform:none}}',

    /* thin loading line */
    '#rgx-intro .rgx-bar{margin-top:28px;width:140px;height:3px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;',
    'opacity:0;animation:rgxSub .5s ease .6s forwards}',
    '#rgx-intro .rgx-bar i{display:block;height:100%;width:0;border-radius:3px;background:linear-gradient(90deg,#00BCD4,#D65430);',
    'animation:rgxBar 2.1s cubic-bezier(.4,0,.2,1) .6s forwards}',
    '@keyframes rgxBar{to{width:100%}}',

    '#rgx-intro .rgx-skip{position:absolute;right:16px;bottom:16px;border:1px solid rgba(255,255,255,.22);background:transparent;',
    'color:#cbd5e1;font:500 12px/1 "Inter",system-ui,sans-serif;padding:8px 14px;border-radius:999px;cursor:pointer;opacity:.8}',
    '#rgx-intro .rgx-skip:hover{opacity:1;border-color:#00BCD4;color:#fff}',

    /* ── header brand animation (logo pop + letters stagger) ── */
    '.brand-anim .brand-mark{display:inline-flex;animation:rgxPop .95s cubic-bezier(.34,1.56,.64,1) both}',
    '@keyframes rgxPop{0%{opacity:0;transform:scale(.55) rotate(-14deg)}60%{opacity:1}100%{opacity:1;transform:none}}',
    '.brand-anim .bl{display:inline-block;opacity:0;transform:translateY(10px) scale(.9);',
    'animation:rgxLetter .55s cubic-bezier(.34,1.56,.64,1) forwards;animation-delay:calc(.25s + var(--i)*70ms)}',
    '.brand-anim .brand-x{display:inline-block}',
    '.brand-anim .brand-x .bl{animation-name:rgxLetterX}',
    '@keyframes rgxLetterX{0%{opacity:0;transform:translateY(10px) scale(.6) rotate(-20deg)}',
    '70%{opacity:1;transform:scale(1.35) rotate(6deg)}100%{opacity:1;transform:none}}',
    '.brand:hover .brand-mark{animation:rgxWiggle .6s ease}',
    '@keyframes rgxWiggle{0%,100%{transform:none}25%{transform:rotate(-8deg) scale(1.06)}75%{transform:rotate(8deg) scale(1.06)}}',

    '@media (prefers-reduced-motion:reduce){',
    '#rgx-intro,#rgx-intro *{animation:none!important;transition:none!important}',
    '.brand-anim .brand-mark,.brand-anim .bl{animation:none!important;opacity:1!important;transform:none!important}}'
  ].join('');

  var st = document.createElement('style');
  st.id = 'rgx-intro-css';
  st.appendChild(document.createTextNode(css));
  (document.head || document.documentElement).appendChild(st);

  /* ───────────────────────── Header brand animation ───────────────────────── */
  var brandDone = false;
  function playBrand() {
    if (brandDone) return;
    var brand = document.querySelector('.site-header .brand') || document.querySelector('.brand');
    if (!brand) return;
    brandDone = true;
    var name = brand.querySelector('.brand-name');
    if (name && !name.getAttribute('data-split')) {
      name.setAttribute('data-split', '1');
      var i = 0;
      var nodes = Array.prototype.slice.call(name.childNodes);
      nodes.forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.nodeValue.split('').forEach(function (ch) {
            var s = document.createElement('span');
            s.className = 'bl';
            s.style.setProperty('--i', i++);
            s.textContent = ch;
            frag.appendChild(s);
          });
          name.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          var txt = n.textContent;
          n.textContent = '';
          txt.split('').forEach(function (ch) {
            var s = document.createElement('span');
            s.className = 'bl';
            s.style.setProperty('--i', i++);
            s.textContent = ch;
            n.appendChild(s);
          });
        }
      });
    }
    brand.classList.add('brand-anim');
  }

  function playBrandWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', playBrand);
    } else {
      playBrand();
    }
  }

  /* ───────────────────────── Intro splash ───────────────────────── */
  if (!showIntro) {
    playBrandWhenReady();
    return;
  }

  try { sessionStorage.setItem(KEY, '1'); } catch (e) {}

  var root = document.documentElement;
  root.classList.add('rgx-lock');

  var letters = 'RENTGOX'.split('').map(function (ch, i) {
    return '<span class="rgx-l' + (ch === 'X' ? ' x' : '') + '" style="--i:' + i + '">' + ch + '</span>';
  }).join('');

  var ov = document.createElement('div');
  ov.id = 'rgx-intro';
  ov.setAttribute('role', 'status');
  ov.setAttribute('aria-label', 'Loading RentGoX');
  ov.innerHTML =
    '<div class="rgx-ring r1"></div><div class="rgx-ring r2"></div><div class="rgx-ring r3"></div>' +
    '<div class="rgx-center">' +
      '<div class="rgx-logo-wrap"><span class="rgx-glow"></span>' +
        '<img class="rgx-logo" src="assets/images/logo.png" alt="RentGoX logo"></div>' +
      '<div class="rgx-name" aria-hidden="true">' + letters + '</div>' +
      '<div class="rgx-sub">Welcome to RentGoX</div>' +
      '<div class="rgx-bar"><i></i></div>' +
    '</div>' +
    '<button class="rgx-skip" type="button">Skip</button>';

  /* append to <html> so it shows before <body> is parsed (no flash) */
  root.appendChild(ov);

  var logo = ov.querySelector('.rgx-logo');
  logo.addEventListener('error', function () {
    if (logo.src !== FALLBACK_LOGO) logo.src = FALLBACK_LOGO;
  });

  var closed = false;
  function closeIntro() {
    if (closed) return;
    closed = true;
    ov.classList.add('rgx-out');
    root.classList.remove('rgx-lock');
    setTimeout(playBrand, 250);
    setTimeout(function () {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }, 800);
  }

  ov.querySelector('.rgx-skip').addEventListener('click', closeIntro);
  ov.addEventListener('click', closeIntro);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeIntro();
  });

  /* total ≈ 2.9 s, hard fail-safe at 4.5 s */
  setTimeout(closeIntro, 2900);
  setTimeout(closeIntro, 4500);
  window.addEventListener('pageshow', function (e) { if (e.persisted) closeIntro(); });
})();
