/* The app's themes, on the site: <html data-theme> picks one (Minima, the
   default, needs none), remembered for the visitor's next page or visit.
   Loaded in <head>, so a page opens in the remembered theme straight away;
   on the home page it also builds the theme switch, swaps each
   screenshot (an <img data-shot>) for the same picture in the theme, and,
   straight away from it opening, steps through the themes by itself (every
   4 s) until the visitor touches the switch. */
(function () {
  var THEMES = ['Minima', 'Stick', 'Dew', 'Blush', 'Clara'];
  var root = document.documentElement;

  function saved() {
    try {
      var t = localStorage.getItem('innernet-theme');
      return THEMES.indexOf(t) >= 0 ? t : 'Minima';
    } catch (e) {
      return 'Minima';
    }
  }

  var current = saved();
  root.setAttribute('data-theme', current.toLowerCase());

  // The pictures' version: bumped (with the pages' ?v= on style.css and
  // theme.js) whenever they change, as the CDN and browsers keep the old.
  var VERSION = '20261020';

  function shot(img, theme) {
    return 'images/' + theme.toLowerCase() + '/' + img.getAttribute('data-shot') + '.webp?v=' + VERSION;
  }

  // Each screenshot: the theme's picture fades in over the one showing.
  function swapShots(theme) {
    var shots = document.querySelectorAll('img[data-shot]');
    Array.prototype.forEach.call(shots, function (img) {
      var box = img.parentNode;
      if (!box.classList.contains('shots')) {
        box = document.createElement('div');
        box.className = 'shots';
        img.parentNode.insertBefore(box, img);
        box.appendChild(img);
      }
      var src = shot(img, theme);
      if ((box.getAttribute('data-want') || img.getAttribute('src')) === src) return;
      box.setAttribute('data-want', src);
      // Each new picture fades in on top (a quick drag stacks several);
      // once in, the picture beneath takes its place and every one fading
      // in under it goes, unseen.
      var next = new Image();
      next.alt = '';
      next.setAttribute('aria-hidden', 'true');
      next.style.opacity = '0';
      next.onload = function () {
        // (Overtaken by a later theme while loading: never shown.)
        if (box.getAttribute('data-want') !== src) return;
        box.appendChild(next);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { next.style.opacity = '1'; });
        });
        setTimeout(function () {
          img.src = src;
          (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
            var kids = Array.prototype.slice.call(box.children);
            for (var k = 1; k <= kids.indexOf(next); k++) box.removeChild(kids[k]);
          });
        }, 400);
      };
      next.src = src;
    });
  }

  // [shown]: stepped to by the tour, not chosen, so not remembered.
  function use(theme, shown) {
    if (theme === current) return;
    current = theme;
    root.setAttribute('data-theme', theme.toLowerCase());
    if (!shown) {
      try { localStorage.setItem('innernet-theme', theme); } catch (e) {}
    }
    swapShots(theme);
    var sw = document.querySelector('.theme-switch');
    if (sw) mark(sw);
  }

  function mark(sw) {
    var at = THEMES.indexOf(current);
    sw.style.setProperty('--at', at);
    Array.prototype.forEach.call(sw.querySelectorAll('button'), function (b, i) {
      b.setAttribute('aria-checked', i === at ? 'true' : 'false');
      b.tabIndex = i === at ? 0 : -1;
    });
  }

  // The theme switch: a segment per theme, as the app's view switch; a
  // click picks one, a drag across them picks each one passed over.
  function build(sw) {
    sw.setAttribute('role', 'radiogroup');
    // (Every segment the same width, "and more…" too; on a phone it's
    // hidden, and the themes share the width: style.css's --count there.)
    sw.style.setProperty('--count', THEMES.length + 1);
    sw.style.setProperty('--themes', THEMES.length);
    var indicator = document.createElement('span');
    indicator.className = 'indicator';
    sw.appendChild(indicator);
    THEMES.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.textContent = t;
      sw.appendChild(b);
    });
    // Last, never chosen: there are many more themes, made by others.
    var more = document.createElement('span');
    more.className = 'more';
    more.textContent = 'and more…';
    more.title = 'Many more themes, made by the community';
    sw.appendChild(more);
    // The segment under a point: its index (THEMES.length for "and more…",
    // when it shows).
    function at(x) {
      var r = sw.getBoundingClientRect();
      var n = more.offsetParent ? THEMES.length + 1 : THEMES.length;
      var i = Math.floor((x - r.left - 2) / ((r.width - 4) / n));
      return Math.max(0, Math.min(n - 1, i));
    }
    function under(x) { return THEMES[Math.min(THEMES.length - 1, at(x))]; }
    var dragging = false;
    // The tour: the next theme straight away, then one every 4 s
    // (waiting while the tab's hidden); the switch touched, it stops for
    // good. Not for visitors who'd rather less moved.
    var STEP = 4000;
    var touring = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var tour = null;
    function next() {
      if (!touring || document.hidden) return;
      use(THEMES[(THEMES.indexOf(current) + 1) % THEMES.length], true);
    }
    function endTour() {
      touring = false;
      clearInterval(tour);
    }
    if (touring) {
      next();
      tour = setInterval(next, STEP);
    }
    sw.addEventListener('pointerdown', endTour, true);
    sw.addEventListener('keydown', endTour, true);
    sw.addEventListener('pointerdown', function (e) {
      // ("and more…" takes no press; a drag onto it stays on the last theme.)
      if (at(e.clientX) >= THEMES.length) return;
      dragging = true;
      try { sw.setPointerCapture(e.pointerId); } catch (err) {}
      use(under(e.clientX));
    });
    sw.addEventListener('pointermove', function (e) {
      if (dragging) use(under(e.clientX));
    });
    function stop() { dragging = false; }
    sw.addEventListener('pointerup', stop);
    sw.addEventListener('pointercancel', stop);
    // Arrow keys step through them, as in any radio group.
    sw.addEventListener('keydown', function (e) {
      var i = THEMES.indexOf(current);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = Math.min(THEMES.length - 1, i + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = Math.max(0, i - 1);
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = THEMES.length - 1;
      else return;
      e.preventDefault();
      use(THEMES[i]);
      sw.querySelectorAll('button')[i].focus();
    });
    mark(sw);
  }

  // The scroll cue (the home page): from 2 s after it opens, the chevron
  // under the wordmark encourages the visitor on and down into the sheet;
  // pressed (it takes them there, smooth unless they'd rather no motion),
  // it goes for good, and scrolls off with the hero otherwise.
  function cue() {
    var b = document.querySelector('.scroll-cue');
    if (!b) return;
    var pressed = false;
    function update() { b.classList.toggle('show', !pressed); }
    b.addEventListener('click', function () {
      pressed = true; update();
      var quiet = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      var sheet = document.querySelector('.sheet');
      if (sheet) sheet.scrollIntoView({ behavior: quiet ? 'auto' : 'smooth' });
      else window.scrollTo({ top: window.innerHeight, behavior: quiet ? 'auto' : 'smooth' });
    });
    setTimeout(update, 2000);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sw = document.querySelector('.theme-switch');
    if (sw) build(sw);
    cue();
    // The home page's display pins at its own height (style.css's .display).
    var display = document.querySelector('.display');
    if (display) {
      var measure = function () {
        display.style.setProperty('--display-h', display.offsetHeight + 'px');
      };
      measure();
      if (window.ResizeObserver) new ResizeObserver(measure).observe(display);
      else window.addEventListener('resize', measure);
    }
    // Opened in a remembered theme: its pictures straight away.
    Array.prototype.forEach.call(document.querySelectorAll('img[data-shot]'), function (img) {
      img.src = shot(img, current);
    });
  });
})();
