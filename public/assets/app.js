// CK Chat – lock zoom & app-like behavior (no design changes)
(function(){
  // Prevent pinch zoom (iOS)
  document.addEventListener('gesturestart', function(e){ e.preventDefault(); }, {passive:false});
  document.addEventListener('gesturechange', function(e){ e.preventDefault(); }, {passive:false});
  document.addEventListener('gestureend',  function(e){ e.preventDefault(); }, {passive:false});

  // Prevent double-tap zoom (iOS Safari)
  var lastTouch = 0;
  document.addEventListener('touchend', function(e){
    var now = Date.now();
    if (now - lastTouch <= 350) { e.preventDefault(); }
    lastTouch = now;
  }, {passive:false});

  // Prevent multi-touch pinch
  document.addEventListener('touchmove', function(e){
    if (e.touches && e.touches.length > 1) { e.preventDefault(); }
  }, {passive:false});

  // Desktop: prevent Ctrl+wheel zoom and Ctrl/Cmd +/-/0
  document.addEventListener('wheel', function(e){
    if (e.ctrlKey) e.preventDefault();
  }, {passive:false});
  document.addEventListener('keydown', function(e){
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
      e.preventDefault();
    }
  });

  // OTP resend countdown: auto-tick every second WITHOUT needing a page refresh.
  // PHP renders data-seconds-left on first load; we then run a 1s interval
  // until it hits 0 and unlock the button in place.
  function startOtpResendTimer(){
    var btn = document.querySelector('[data-resend-button]');
    if (!btn || btn.dataset.ckTimerStarted === '1') return;
    btn.dataset.ckTimerStarted = '1';
    var secondsLeft = parseInt(btn.getAttribute('data-seconds-left') || '0', 10);
    if (!(secondsLeft > 0)) {
      btn.disabled = false;
      btn.textContent = 'Resend code';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Resend in ' + secondsLeft + 's';
    var iv = window.setInterval(function(){
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        window.clearInterval(iv);
        btn.disabled = false;
        btn.textContent = 'Resend code';
        return;
      }
      btn.textContent = 'Resend in ' + secondsLeft + 's';
    }, 1000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startOtpResendTimer);
  } else {
    startOtpResendTimer();
  }
  // Re-run when restored from bfcache (back/forward navigation)
  window.addEventListener('pageshow', startOtpResendTimer);


  // Reliable scroll for desktop, laptop and mobile WebViews:
  // hide the side scrollbar line, but force wheel / middle-click / finger scroll to work.
  function enableReliableScroll(){
    if (window.__ckReliableScrollEnabled) return;
    window.__ckReliableScrollEnabled = true;

    var selector = '.chat-bg, .modal .card, .modal, .scroll, [data-scroll]';
    var touchState = null;
    var autoState = null;

    function injectNoScrollbarCss(){
      if (document.getElementById('ck-no-scrollbar-style')) return;
      var style = document.createElement('style');
      style.id = 'ck-no-scrollbar-style';
      style.textContent = '*{scrollbar-width:none!important;-ms-overflow-style:none!important}*::-webkit-scrollbar{width:0!important;height:0!important;display:none!important;background:transparent!important}html,body{overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:auto!important}.app{overflow:visible!important}.app.chat-shell{overflow:hidden!important}.app.chat-shell>.chat-bg,.modal,.modal .card,.scroll,[data-scroll]{overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior-y:auto!important}.app,.chat-bg,.modal,.modal .card,.scroll,[data-scroll]{-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important}';
      document.head.appendChild(style);
    }

    function isEditable(el){
      return !!(el && el.closest && el.closest('input, textarea, select, [contenteditable="true"]'));
    }

    function scrollRoot(){
      return document.scrollingElement || document.documentElement || document.body;
    }

    function isRoot(el){
      var root = scrollRoot();
      return el === root || el === document.documentElement || el === document.body;
    }

    function maxScrollY(el){
      if (!el) return 0;
      if (isRoot(el)) {
        var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        return Math.max(0, h - window.innerHeight);
      }
      return Math.max(0, el.scrollHeight - el.clientHeight);
    }

    function maxScrollX(el){
      if (!el) return 0;
      if (isRoot(el)) {
        var w = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
        return Math.max(0, w - window.innerWidth);
      }
      return Math.max(0, el.scrollWidth - el.clientWidth);
    }

    function getScrollTop(el){
      return isRoot(el) ? (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0) : el.scrollTop;
    }

    function getScrollLeft(el){
      return isRoot(el) ? (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0) : el.scrollLeft;
    }

    function setScroll(el, left, top){
      if (isRoot(el)) {
        window.scrollTo(Math.max(0, left), Math.max(0, top));
      } else {
        el.scrollLeft = Math.max(0, left);
        el.scrollTop = Math.max(0, top);
      }
    }

    function canScroll(el){
      return !!(el && (maxScrollY(el) > 1 || maxScrollX(el) > 1));
    }

    function scrollableFrom(target){
      var node = target && target.nodeType === 1 ? target : target && target.parentElement;

      while (node && node !== document.documentElement) {
        if (node.matches && node.matches(selector) && canScroll(node)) return node;
        node = node.parentElement;
      }

      var shell = target && target.closest && target.closest('.app.chat-shell');
      if (shell) {
        var chat = shell.querySelector('.chat-bg');
        if (canScroll(chat)) return chat;
      }

      var root = scrollRoot();
      return canScroll(root) ? root : document.documentElement;
    }

    function scrollByDelta(el, dx, dy){
      if (!el) return false;
      var beforeTop = getScrollTop(el);
      var beforeLeft = getScrollLeft(el);
      var nextTop = Math.max(0, Math.min(maxScrollY(el), beforeTop + dy));
      var nextLeft = Math.max(0, Math.min(maxScrollX(el), beforeLeft + dx));
      setScroll(el, nextLeft, nextTop);
      return getScrollTop(el) !== beforeTop || getScrollLeft(el) !== beforeLeft;
    }

    function lockScrollbarsOnly(){
      injectNoScrollbarCss();
      var nodes = document.querySelectorAll('html, body, .app, ' + selector + ', .filters');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].style.scrollbarWidth = 'none';
        nodes[i].style.msOverflowStyle = 'none';
      }
    }

    function scrollChatToBottomOnce(){
      var chat = document.querySelector('.app.chat-shell > .chat-bg');
      if (!chat || chat.dataset.ckInitialBottom === '1') return;
      chat.dataset.ckInitialBottom = '1';
      window.requestAnimationFrame(function(){ setScroll(chat, 0, maxScrollY(chat)); });
      window.setTimeout(function(){ setScroll(chat, 0, maxScrollY(chat)); }, 150);
    }

    lockScrollbarsOnly();
    scrollChatToBottomOnce();

    document.addEventListener('touchstart', function(e){
      if (!e.touches || e.touches.length !== 1 || isEditable(e.target)) { touchState = null; return; }
      var t = e.touches[0];
      touchState = { el: scrollableFrom(e.target), x: t.clientX, y: t.clientY };
    }, {passive:true});

    document.addEventListener('touchmove', function(e){
      if (!touchState || !e.touches || e.touches.length !== 1) return;
      var t = e.touches[0];
      var dx = t.clientX - touchState.x;
      var dy = t.clientY - touchState.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 2) return;

      if (scrollByDelta(touchState.el, -dx, -dy)) {
        touchState.x = t.clientX;
        touchState.y = t.clientY;
        e.preventDefault();
      }
    }, {passive:false});

    document.addEventListener('touchend', function(){ touchState = null; }, {passive:true});
    document.addEventListener('touchcancel', function(){ touchState = null; }, {passive:true});

    document.addEventListener('wheel', function(e){
      if (e.ctrlKey) return;
      var el = scrollableFrom(e.target);
      if (scrollByDelta(el, e.deltaX, e.deltaY)) e.preventDefault();
    }, {passive:false});

    document.addEventListener('keydown', function(e){
      if (isEditable(e.target)) return;
      var dy = 0;
      if (e.key === 'ArrowDown') dy = 48;
      else if (e.key === 'ArrowUp') dy = -48;
      else if (e.key === 'PageDown' || e.key === ' ') dy = Math.round(window.innerHeight * 0.82);
      else if (e.key === 'PageUp') dy = -Math.round(window.innerHeight * 0.82);
      else if (e.key === 'End') dy = 999999;
      else if (e.key === 'Home') dy = -999999;
      else return;

      var el = scrollableFrom(document.activeElement || document.body);
      if (scrollByDelta(el, 0, dy)) e.preventDefault();
    });

    function stopAutoScroll(){
      if (!autoState) return;
      window.cancelAnimationFrame(autoState.raf);
      document.body.style.cursor = autoState.cursor || '';
      autoState = null;
    }

    function autoScrollTick(){
      if (!autoState) return;
      var dy = autoState.y - autoState.startY;
      var dx = autoState.x - autoState.startX;
      if (Math.abs(dy) > 10 || Math.abs(dx) > 10) {
        scrollByDelta(autoState.el, dx * 0.08, dy * 0.08);
      }
      autoState.raf = window.requestAnimationFrame(autoScrollTick);
    }

    document.addEventListener('mousedown', function(e){
      if (e.button !== 1 || isEditable(e.target)) return;
      var el = scrollableFrom(e.target);
      if (!canScroll(el)) return;
      e.preventDefault();
      stopAutoScroll();
      autoState = {
        el: el,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        cursor: document.body.style.cursor,
        raf: 0
      };
      document.body.style.cursor = 'ns-resize';
      autoScrollTick();
    }, {passive:false});

    document.addEventListener('mousemove', function(e){
      if (!autoState) return;
      autoState.x = e.clientX;
      autoState.y = e.clientY;
    }, {passive:true});

    document.addEventListener('mouseup', function(e){
      if (e.button === 1) stopAutoScroll();
    }, {passive:true});

    document.addEventListener('auxclick', function(e){
      if (e.button === 1) e.preventDefault();
    }, {passive:false});

    window.addEventListener('blur', stopAutoScroll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableReliableScroll);
  } else {
    enableReliableScroll();
  }
  window.addEventListener('pageshow', enableReliableScroll);
})();

/* ---------- Incoming call auto-detect ---------- */
(function(){
  if (/\/call\.php(\?|$)/.test(location.pathname+location.search)) return;
  if (/\/(login|register|install|verify_request)\.php/.test(location.pathname)) return;
  var last = 0;
  function poll(){
    fetch('call.php?action=incoming&_='+Date.now(), {credentials:'same-origin'})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        if(j && j.ok && j.id && j.id !== last){
          last = j.id;
          location.href = 'call.php?id='+j.id+'&mode=incoming';
        }
      }).catch(function(){});
  }
  setInterval(poll, 3500);
  setTimeout(poll, 800);
})();
