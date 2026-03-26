/* ════════════════════════════════════════════════════════
   main.js  –  Marketo Organic Farm
   Two-slide layout: hero ↔ products
   JWT stored in localStorage, 30-min auto-logout, session timer
   ════════════════════════════════════════════════════════ */

const API_URL = window.location.origin;
let allProducts = [];
let logoutTimer = null;
let countdownInterval = null;

/* ══ JWT HELPERS ══════════════════════════════════════ */
function storeToken(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  localStorage.setItem('userToken', token);
  localStorage.setItem('userTokenExp', payload.exp * 1000);
  localStorage.setItem('userEmail', payload.sub);
}
function getToken()    { return localStorage.getItem('userToken'); }
function getTokenExp() { const e = localStorage.getItem('userTokenExp'); return e ? parseInt(e, 10) : null; }
function clearToken()  {
  ['userToken','userTokenExp','userEmail','userName'].forEach(k => localStorage.removeItem(k));
}
function isTokenValid() { const e = getTokenExp(); return e && Date.now() < e; }

/* ══ SLIDE HELPERS ════════════════════════════════════ */
function showHeroSlide() {
  document.getElementById('slideHero').classList.remove('hidden');
  document.getElementById('slideProducts').classList.add('hidden');
}

function showProductsSlide() {
  document.getElementById('slideHero').classList.add('hidden');
  // Re-trigger animation by removing and re-adding the class
  const s = document.getElementById('slideProducts');
  s.classList.remove('hidden');
  s.style.animation = 'none';
  s.offsetHeight; // reflow
  s.style.animation = '';
  fetchProducts();
}

/* ══ AUTH STATE ════════════════════════════════════════ */
function checkAuthState() {
  if (getToken() && isTokenValid()) {
    const name = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'User';
    setLoggedInUI(name);
    startLogoutTimer();
    showProductsSlide();
  } else {
    if (getToken()) { clearToken(); }
    setLoggedOutUI();
  }
}

function setLoggedInUI(name) {
  document.getElementById('guestNav').classList.add('hidden');
  document.getElementById('userNav').classList.remove('hidden');
  document.getElementById('userGreeting').textContent = `👋 Hello, ${name.split(' ')[0]}!`;
}

function setLoggedOutUI() {
  document.getElementById('guestNav').classList.remove('hidden');
  document.getElementById('userNav').classList.add('hidden');
  stopLogoutTimer();
  hideBanner();
  showHeroSlide();
}

/* ══ AUTO-LOGOUT TIMER ═════════════════════════════════ */
function startLogoutTimer() {
  stopLogoutTimer();
  const exp = getTokenExp();
  if (!exp) return;
  const remaining = exp - Date.now();
  if (remaining <= 0) { logout(); return; }

  const warnAt = remaining - 5 * 60 * 1000;
  if (warnAt > 0) setTimeout(() => { if (isTokenValid()) startCountdownBanner(); }, warnAt);
  else startCountdownBanner();

  logoutTimer = setTimeout(() => logout(true), remaining);
}

function stopLogoutTimer() {
  if (logoutTimer)       { clearTimeout(logoutTimer); logoutTimer = null; }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

function startCountdownBanner() {
  document.getElementById('sessionBanner').classList.remove('hidden');
  countdownInterval = setInterval(() => {
    const secs = Math.max(0, Math.floor((getTokenExp() - Date.now()) / 1000));
    const m = Math.floor(secs / 60), s = String(secs % 60).padStart(2, '0');
    document.getElementById('sessionCountdown').textContent = `${m}:${s}`;
    if (secs <= 0) clearInterval(countdownInterval);
  }, 1000);
}

function hideBanner() {
  document.getElementById('sessionBanner').classList.add('hidden');
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

function refreshSession() { logout(); openModal('loginModal'); }

/* ══ LOGOUT ════════════════════════════════════════════ */
function logout(expired = false) {
  clearToken();
  setLoggedOutUI();
  if (expired) showToast('Session expired. Please log in again.', 'info');
}

/* ══ MODAL HELPERS ═════════════════════════════════════ */
function openModal(id) {
  const m = document.getElementById(id);
  m.style.display = 'flex';
  requestAnimationFrame(() => m.classList.add('active'));
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const m = document.getElementById(id);
  m.classList.remove('active');
  setTimeout(() => { m.style.display = 'none'; }, 300);
  document.body.style.overflow = '';
  clearFormError(id);
}

function switchModal(fromId, toId) { closeModal(fromId); setTimeout(() => openModal(toId), 320); }
function handleOverlayClick(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

function clearFormError(modalId) {
  const errId = modalId === 'loginModal' ? 'loginError' : 'signupError';
  const el = document.getElementById(errId);
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

function showFormError(errId, msg) {
  const el = document.getElementById(errId);
  el.textContent = msg; el.classList.remove('hidden');
}

function togglePwd(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else                          { inp.type = 'password'; btn.textContent = '👁'; }
}

/* ══ HANDLE LOGIN ══════════════════════════════════════ */
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginSubmitBtn');
  btn.textContent = 'Logging in…'; btn.disabled = true;

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { showFormError('loginError', data.detail || 'Login failed'); return; }

    storeToken(data.access_token);
    const meRes = await fetch(`${API_URL}/user/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (meRes.ok) {
      const me = await meRes.json();
      localStorage.setItem('userName', me.name);
      setLoggedInUI(me.name);
    } else { setLoggedInUI(email); }

    closeModal('loginModal');
    document.getElementById('loginForm').reset();
    startLogoutTimer();
    showProductsSlide();
    showToast('Welcome back! 🌿', 'success');
  } catch {
    showFormError('loginError', 'Network error – is the server running?');
  } finally {
    btn.textContent = 'Login'; btn.disabled = false;
  }
}

/* ══ HANDLE SIGN-UP ════════════════════════════════════ */
async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signupSubmitBtn');
  btn.textContent = 'Creating…'; btn.disabled = true;

  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const phone    = document.getElementById('signupPhone').value.trim();
  const password = document.getElementById('signupPassword').value;

  try {
    const res = await fetch(`${API_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) { showFormError('signupError', data.detail || 'Registration failed'); return; }

    storeToken(data.access_token);
    localStorage.setItem('userName', name);
    setLoggedInUI(name);
    closeModal('signupModal');
    document.getElementById('signupForm').reset();
    startLogoutTimer();
    showProductsSlide();
    showToast(`Welcome, ${name.split(' ')[0]}! 🌾`, 'success');
  } catch {
    showFormError('signupError', 'Network error – is the server running?');
  } finally {
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
}

/* ══ TOAST NOTIFICATION ════════════════════════════════ */
function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  t.style.cssText = `
    position:fixed; top:80px; right:20px; z-index:9999;
    background:${type === 'success' ? '#1b4d1e' : '#1e3a5f'};
    border:1px solid ${type === 'success' ? '#4caf50' : '#3b82f6'};
    color:#f0f7ec; padding:12px 20px; border-radius:12px;
    font-family:'Outfit',sans-serif; font-size:.92rem; font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,.4); max-width:300px;
    animation:toastIn .3s ease;
  `;
  const style = document.createElement('style');
  style.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}`;
  document.head.appendChild(style);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

/* ══ PRODUCTS ══════════════════════════════════════════ */
async function fetchProducts() {
  const loader     = document.getElementById('loader');
  const grid       = document.getElementById('productsGrid');
  const noProducts = document.getElementById('noProducts');

  loader.classList.remove('hidden');
  grid.classList.add('hidden');
  noProducts.classList.add('hidden');

  try {
    const response = await fetch(`${API_URL}/products`);
    allProducts = await response.json();
    renderProducts(allProducts);
  } catch {
    noProducts.innerText = 'Error loading products. Is the server running?';
    noProducts.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
  }
}

function renderProducts(products) {
  const grid       = document.getElementById('productsGrid');
  const noProducts = document.getElementById('noProducts');
  grid.innerHTML = '';

  if (products.length === 0) {
    grid.classList.add('hidden'); noProducts.classList.remove('hidden'); return;
  }
  grid.classList.remove('hidden'); noProducts.classList.add('hidden');

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const imgUrl = p.image_url
      ? `${API_URL}${p.image_url}`
      : 'https://placehold.co/300x250/0d2010/a3b899?text=No+Image';
    card.innerHTML = `
      <img src="${imgUrl}" alt="${p.name}" class="product-image" loading="lazy">
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description || 'No description available.'}</p>
        <div class="product-footer">
          <span class="product-price">₹${p.price.toFixed(2)}</span>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function filterProducts(query) {
  const q = query.toLowerCase();
  renderProducts(allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description && p.description.toLowerCase().includes(q))
  ));
}

/* ══ KEYBOARD ESC ══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') ['loginModal','signupModal'].forEach(id => {
    if (document.getElementById(id).classList.contains('active')) closeModal(id);
  });
});

/* ══ INIT ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  document.getElementById('searchInput').addEventListener('input', e => filterProducts(e.target.value));
});
