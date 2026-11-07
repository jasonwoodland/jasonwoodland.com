export function navigationTarget(event, currentURL) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = event.target?.closest?.('a[href]');
  if (!link || link.hasAttribute('download') || link.hasAttribute('data-locale-link')) return null;
  const target = link.getAttribute('target');
  if (target && target.toLowerCase() !== '_self') return null;
  let destination;
  try { destination = new URL(link.getAttribute('href'), currentURL); } catch { return null; }
  const current = new URL(currentURL);
  if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== current.origin) return null;
  if (destination.pathname === current.pathname && destination.search === current.search) return null;
  return destination;
}

export function initPageTransitions({ document: doc = document, window: win = window, beforeLeave = () => {} } = {}) {
  const nativeTransitions = typeof win.CSSViewTransitionRule !== 'undefined';
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const scale = (parseFloat(win.getComputedStyle?.(doc.documentElement).fontSize) || 16) / 16;
  let destination = null;
  let fading = false;
  let committed = false;
  let animations = [];
  let hint = null;
  let sequence = 0;

  function reset() {
    sequence++;
    for (const animation of animations) animation.cancel();
    animations = [];
    fading = false;
    committed = false;
    destination = null;
    hint?.remove();
    hint = null;
  }

  function navigate() {
    beforeLeave();
    committed = true;
    try {
      win.location.assign(destination.href);
    } catch {
      reset();
    }
  }

  async function leave(event) {
    const target = navigationTarget(event, win.location.href);
    if (!target) return;
    beforeLeave();
    if (nativeTransitions || motion.matches || typeof win.Element.prototype.animate !== 'function') return;
    event.preventDefault();
    destination = target;
    if (fading) {
      if (committed) navigate();
      return;
    }
    fading = true;
    const change = ++sequence;

    // Start warming the destination while the current content fades away.
    hint = doc.createElement('link');
    hint.rel = 'prefetch';
    hint.as = 'document';
    hint.href = target.href;
    doc.head.append(hint);
    try {
      for (const element of doc.querySelectorAll('main, .site-footer')) {
        animations.push(element.animate(
          [
            { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },
            { opacity: 0, filter: `blur(${8 * scale}px)`, transform: `translateY(${-14 * scale}px)` }
          ],
          { duration: 220, easing: 'cubic-bezier(.4, 0, .6, 1)', fill: 'forwards' }
        ));
      }
      await Promise.allSettled(animations.map((animation) => animation.finished));
    } catch { /* A failed animation must never stop navigation. */ }
    if (change !== sequence || !destination) return;
    navigate();
  }

  doc.addEventListener('click', leave);
  win.addEventListener('pageshow', reset);
  // Hold the final faded frame through navigation. Cancelling on pagehide (or
  // on a timer) can expose the old page again before the new document paints.
  win.addEventListener('pagehide', () => {
    sequence++;
    hint?.remove();
    hint = null;
  });
  win.navigation?.addEventListener('navigateerror', reset);
  motion.addEventListener('change', () => {
    if (motion.matches) for (const animation of animations) animation.cancel();
  });
  return { reset };
}
