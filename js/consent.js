/*
 * First-party consent gate + banner for static happyhunterdigital sites.
 * No third-party request is made before the visitor clicks Accept.
 */
(function () {
  'use strict';

  var KEY = 'hh-cookie-consent';
  var EVENT = 'hh:consent-change';

  function normalise(value) {
    if (!value) return null;
    if (value === 'accepted' || value === 'declined') return value;
    if (value === 'true' || value === 'all') return 'accepted';
    if (value === 'false' || value === 'essential') return 'declined';
    try {
      var parsed = JSON.parse(value);
      var inner = parsed && (parsed.value || parsed.choice);
      if (inner === 'accepted' || inner === 'all' || inner === 'true') return 'accepted';
      if (inner === 'declined' || inner === 'essential' || inner === 'false') return 'declined';
    } catch (err) {
      /* not JSON */
    }
    return null;
  }

  function read() {
    try {
      var current = normalise(window.localStorage.getItem(KEY));
      if (current) return current;
      var legacy = ['hh_compliance_active', 't4c-cookie-consent', 'mmhfsp_cookie_consent', 'ludo-cookie-consent'];
      for (var i = 0; i < legacy.length; i++) {
        var migrated = normalise(window.localStorage.getItem(legacy[i]));
        if (migrated) return migrated;
      }
    } catch (err) {
      return null;
    }
    return null;
  }

  function activate() {
    if (read() !== 'accepted') return;
    var nodes = document.querySelectorAll('script[data-consent][type="text/plain"]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getAttribute('data-consent-loaded') === 'true') continue;
      var replacement = document.createElement('script');
      for (var j = 0; j < node.attributes.length; j++) {
        var attr = node.attributes[j];
        if (attr.name === 'type' || attr.name === 'data-consent' || attr.name === 'data-src' || attr.name === 'data-consent-loaded') continue;
        replacement.setAttribute(attr.name, attr.value);
      }
      var src = node.getAttribute('data-src');
      if (src) replacement.src = src;
      else replacement.text = node.textContent || '';
      replacement.setAttribute('data-consent-loaded', 'true');
      node.parentNode.replaceChild(replacement, node);
    }
  }

  function removeBanner() {
    var existing = document.getElementById('hh-cookie-banner');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }

  function renderBanner() {
    if (read() !== null || document.getElementById('hh-cookie-banner')) return;

    var wrap = document.createElement('div');
    wrap.id = 'hh-cookie-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-label', 'Cookie consent');
    wrap.style.cssText = [
      'position:fixed', 'left:16px', 'right:16px', 'bottom:16px', 'z-index:2147483647',
      'max-width:440px', 'margin-left:auto', 'background:#0a0a0a', 'color:#e5e5e5',
      'border:1px solid rgba(250,204,21,.35)', 'border-radius:14px', 'padding:20px',
      'box-shadow:0 20px 60px rgba(0,0,0,.6)', 'font-family:Inter,system-ui,sans-serif',
      'box-sizing:border-box'
    ].join(';');

    var title = document.createElement('p');
    title.textContent = 'We value your privacy';
    title.style.cssText = 'margin:0;font-size:14px;font-weight:700;color:#facc15';

    var copy = document.createElement('p');
    copy.textContent = 'Strictly necessary storage keeps this site working. Analytics and optional third-party scripts stay off until you accept.';
    copy.style.cssText = 'margin:6px 0 0;font-size:12px;line-height:1.6;color:#a3a3a3';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-top:16px';

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.textContent = 'Accept';
    accept.style.cssText = 'flex:1;background:#facc15;color:#000;border:0;border-radius:8px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer';

    var decline = document.createElement('button');
    decline.type = 'button';
    decline.textContent = 'Decline';
    decline.style.cssText = 'flex:1;background:transparent;color:#e5e5e5;border:1px solid #3f3f46;border-radius:8px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer';

    accept.addEventListener('click', function () { set('accepted'); });
    decline.addEventListener('click', function () { set('declined'); });

    row.appendChild(accept);
    row.appendChild(decline);
    wrap.appendChild(title);
    wrap.appendChild(copy);
    wrap.appendChild(row);
    document.body.appendChild(wrap);
  }

  function set(value) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ value: value, ts: Date.now() }));
    } catch (err) {
      /* storage blocked: choice applies to this page view */
    }
    removeBanner();
    var event = new CustomEvent(EVENT, { detail: value });
    window.dispatchEvent(event);
    document.dispatchEvent(event);
    if (value === 'accepted') activate();
  }

  window.HHConsent = {
    key: KEY,
    get: read,
    hasConsent: function () { return read() === 'accepted'; },
    set: set,
    accept: function () { set('accepted'); },
    decline: function () { set('declined'); },
    open: renderBanner,
    activate: activate
  };

  function init() {
    activate();
    renderBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('hh:open-consent', renderBanner);
})();
