// The URL determines the server-rendered language. Stored preferences never
// replace an explicitly requested language or hide a translation from crawlers.
(() => {
  try {
    const key = 'jasonwoodland.instant-locale';
    if (sessionStorage.getItem(key) === location.pathname) {
      document.documentElement.classList.add('locale-navigation');
      sessionStorage.removeItem(key);
    }
  } catch { /* Storage is optional. */ }
})();

// Hold the incoming entrance until the native outgoing fade has finished.
window.addEventListener('pagereveal', (event) => {
  if (document.documentElement.classList.contains('locale-navigation')) {
    event.viewTransition?.skipTransition();
    return;
  }
  const transitioning = event.viewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.style.setProperty('--page-enter-wait', transitioning ? '220ms' : '0ms');
});
