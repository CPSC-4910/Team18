// Load header/footer/pages dynamically
async function loadHTML(id, url) {
    const container = document.getElementById(id);
    const resp = await fetch(url);
    container.innerHTML = await resp.text();
  }
  
  // Initialize
  Promise.all([
    loadHTML('header', 'components/header.html'),
    loadHTML('footer', 'components/footer.html'),
    loadHTML('mainContent', 'pages/about.html')
  ]).then(setupListeners);
  
  function setupListeners() {
    const aboutView = document.getElementById('aboutView');
    const loginView = document.getElementById('loginView');
    const loginBtn  = document.getElementById('loginBtn');
    const aboutBtn  = document.getElementById('aboutBtn');
    const backBtn   = document.getElementById('backBtn');
    const form      = document.getElementById('loginForm');
    const formMsg   = document.getElementById('formMsg');
    const username  = document.getElementById('username');
    const password  = document.getElementById('password');
  
    function show(view) {
      [aboutView, loginView].forEach(v => v.classList.remove('active'));
      view.classList.add('active');
      if (view === loginView) {
        if (location.hash !== '#/login') history.pushState({ v: 'login' }, '', '#/login');
        setTimeout(() => username.focus(), 50);
      } else {
        if (location.hash !== '#/about') history.pushState({ v: 'about' }, '', '#/about');
      }
    }
  
    loginBtn.addEventListener('click', () => show(loginView));
    aboutBtn.addEventListener('click', () => show(aboutView));
    backBtn.addEventListener('click', () => show(aboutView));
  
    window.addEventListener('popstate', () => {
      if (location.hash === '#/login') show(loginView); else show(aboutView);
    });
  
    if (location.hash === '#/login') show(loginView); else show(aboutView);
  
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formMsg.textContent = '';
  
      const u = username.value.trim();
      const p = password.value.trim();
  
      if (!u || !p) {
        formMsg.textContent = 'Please enter both a username and a password.';
        formMsg.style.color = '#b91c1c';
        return;
      }
  
      formMsg.textContent = 'Signing in… (demo only)';
      formMsg.style.color = '#0b65d8';
  
      setTimeout(() => {
        formMsg.textContent = 'Success! (demo) Redirecting…';
        setTimeout(() => show(aboutView), 800);
      }, 700);
    });
  }
  