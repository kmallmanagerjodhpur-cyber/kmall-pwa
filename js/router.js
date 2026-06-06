// ─── SPA Router ───────────────────────────────────────────────────────────────
window.Router = (() => {
  const routes = {};
  let current = null;
  let stack = [];

  function register(name, handler) { routes[name] = handler; }

  function go(name, params = {}) {
    const user = Auth.current();
    if (name !== 'login' && !user) { go('login'); return; }
    if (current) stack.push(current);
    _render(name, params);
  }

  function back() {
    if (stack.length) _render(stack.pop());
    else go('dashboard');
  }

  function _render(name, params = {}) {
    current = name;
    const view = document.getElementById('view');
    if (!view) return;
    const handler = routes[name];
    if (!handler) { console.error('No route:', name); return; }
    view.innerHTML = '';
    handler(view, params);
    window.scrollTo(0,0);
  }

  // Active tab tracking
  function setTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
    if (btn) btn.classList.add('active');
  }

  return { register, go, back, setTab };
})();
