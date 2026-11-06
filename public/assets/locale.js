// The server renders the destination language; this only remembers the choice
// and suppresses page animations for an ordinary language-link click.
export function initLocaleSwitch({ document: doc = document, window: win = window } = {}) {
  const link = doc.querySelector('[data-locale-link]');
  let switching = false;

  link?.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    switching = true;
    doc.documentElement.classList.add('locale-navigation');
    try { win.localStorage.setItem('jasonwoodland.locale', link.dataset.localeLink); } catch { /* Storage is optional. */ }
    try {
      win.sessionStorage.setItem('jasonwoodland.instant-locale', new URL(link.href, win.location.href).pathname);
    } catch { /* The link still works without storage. */ }
  });
  win.addEventListener('pageswap', (event) => {
    if (switching) event.viewTransition?.skipTransition();
  });
  win.addEventListener('pageshow', () => { switching = false; });
}
