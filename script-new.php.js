const API_BASE = '/api';

const PAYSTACK_CONFIG = {
  publicKey: 'pk_live_6eb14b33b61826828aba18a32aa3f12da1c074e1',
  currency: 'GHS'
};

let currentUser = null;
let currentToken = null;
let bundles = [];
let currentUID = null;
let paymentProcessing = false;
let activeSelection = null;

function getApiToken() {
  return localStorage.getItem('authToken');
}

function setApiToken(token) {
  localStorage.setItem('authToken', token);
  currentToken = token;
}

function clearApiToken() {
  localStorage.removeItem('authToken');
  currentToken = null;
}

async function apiCall(endpoint, method = 'GET', data = null) {
  const token = getApiToken();
  const url = new URL(endpoint, window.location.origin);
  
  if (token && method === 'GET') {
    url.searchParams.append('token', token);
  }
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (method !== 'GET' && data) {
    options.body = JSON.stringify({ ...data, token });
  }
  
  try {
    const response = await fetch(url.toString(), options);
    const result = await response.json();
    
    if (response.status === 401) {
      clearApiToken();
      currentUser = null;
      window.location.reload();
      return null;
    }
    
    return result;
  } catch (error) {
    console.error('API Error:', error);
    return { error: error.message };
  }
}

async function registerUser(email, password, name) {
  const response = await apiCall(`${API_BASE}/auth.php?action=register`, 'POST', {
    email, password, name
  });
  
  if (response.success) {
    setApiToken(response.token);
    currentUser = response.user;
    currentUID = response.user.user_id;
    localStorage.setItem('userEmail', email);
    return true;
  } else {
    alert(response.error || 'Registration failed');
    return false;
  }
}

async function loginUser(email, password) {
  const response = await apiCall(`${API_BASE}/auth.php?action=login`, 'POST', {
    email, password
  });
  
  if (response.success) {
    setApiToken(response.token);
    currentUser = response.user;
    currentUID = response.user.user_id;
    localStorage.setItem('userEmail', email);
    return true;
  } else {
    alert(response.error || 'Login failed');
    return false;
  }
}

async function logoutUser() {
  const token = getApiToken();
  if (token) {
    await apiCall(`${API_BASE}/auth.php?action=logout`, 'POST', { token });
  }
  
  clearApiToken();
  currentUser = null;
  currentUID = null;
  window.location.reload();
}

async function loadUserProfile() {
  if (!currentToken) return;
  
  const response = await apiCall(`${API_BASE}/user.php?action=profile`, 'GET');
  
  if (response.success) {
    currentUser = response.user;
    currentUID = response.user.user_id;
    
    const welcomeCard = document.getElementById('welcomeCard');
    const welcomeUsername = document.getElementById('welcomeUsername');
    const balanceHeader = document.getElementById('balanceHeader');
    const balanceSmall = document.getElementById('balanceSmall');
    
    if (welcomeCard && welcomeUsername) {
      welcomeUsername.textContent = response.user.name || response.user.email;
      welcomeCard.style.display = 'block';
    }
    
    if (balanceHeader) balanceHeader.textContent = response.user.balance.toFixed(2);
    if (balanceSmall) balanceSmall.textContent = response.user.balance.toFixed(2);
  }
}

async function loadTransactions() {
  const transactionsList = document.getElementById('transactionsList');
  if (!transactionsList) return;
  
  const response = await apiCall(`${API_BASE}/transactions.php?action=list&limit=10`, 'GET');
  
  if (!response.success || !response.transactions || response.transactions.length === 0) {
    transactionsList.innerHTML = '<p class="muted" style="text-align: center; padding: 2rem;">No transactions yet</p>';
    return;
  }
  
  transactionsList.innerHTML = response.transactions.map(txn => `
    <div class="transaction-item">
      <div class="txn-header">
        <div class="txn-type">${txn.type === 'wallet_topup' ? '💳 Wallet Top-up' : '📦 Refund'}</div>
        <div class="txn-date">${new Date(txn.created_at).toLocaleDateString()}</div>
      </div>
      <div class="txn-details">
        <div class="txn-amount">GHS ${parseFloat(txn.amount).toFixed(2)}</div>
        <div class="txn-status ${txn.status}">${txn.status === 'completed' ? '✓ Completed' : txn.status === 'pending' ? '⏳ Pending' : '✗ Failed'}</div>
      </div>
      ${txn.reference ? `<div class="txn-ref muted small">Ref: ${txn.reference}</div>` : ''}
    </div>
  `).join('');
}

async function loadOrders() {
  const ordersList = document.getElementById('ordersList');
  if (!ordersList) return;
  
  const response = await apiCall(`${API_BASE}/purchases.php?action=list&limit=8`, 'GET');
  
  if (!response.success || !response.purchases || response.purchases.length === 0) {
    ordersList.innerHTML = '<p class="muted" style="text-align: center; padding: 2rem;">No orders yet</p>';
    return;
  }
  
  ordersList.innerHTML = response.purchases.map(order => {
    const date = new Date(order.created_at);
    const timeAgo = getTimeAgo(date);
    return `
      <div class="order-item">
        <div class="order-main">
          <div class="order-network">📱 ${order.network} - ${order.gb}GB</div>
          <div class="order-info">
            <div class="order-phone">📞 ${order.recipient}</div>
            <div class="order-time">🕐 ${timeAgo}</div>
          </div>
        </div>
        <div class="order-status-badge ${order.status}">
          ${order.status === 'completed' ? '✓ Delivered' : '⏳ Processing'}
        </div>
        <div class="order-amount">GHS ${parseFloat(order.price).toFixed(2)}</div>
      </div>
    `;
  }).join('');
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getDefaultBundles() {
  return [
    {
      id: 'mtn',
      network: 'MTN',
      emoji: '🟡',
      packages: [
        { gb: 1, price: 4.60 },
        { gb: 2, price: 9.50 },
        { gb: 3, price: 14 },
        { gb: 4, price: 19.50 },
        { gb: 5, price: 23 },
        { gb: 6, price: 28 },
        { gb: 8, price: 35.50 },
        { gb: 10, price: 45 },
        { gb: 15, price: 62 },
        { gb: 20, price: 80 },
        { gb: 25, price: 100 },
        { gb: 30, price: 120 },
        { gb: 40, price: 160 },
        { gb: 50, price: 197 },
        { gb: 100, price: 393 }
      ]
    },
    {
      id: 'telecel',
      network: 'TELECEL',
      emoji: '🟠',
      packages: [
        { gb: 5, price: 22 },
        { gb: 10, price: 42 },
        { gb: 15, price: 57 },
        { gb: 20, price: 77 },
        { gb: 25, price: 95 },
        { gb: 30, price: 117 },
        { gb: 40, price: 147 },
        { gb: 50, price: 200 },
        { gb: 100, price: 358 }
      ]
    },
    {
      id: 'ishare',
      network: 'Airteltigo iShare',
      emoji: '🟣',
      packages: [
        { gb: 2, price: 7.50 },
        { gb: 5, price: 17 },
        { gb: 10, price: 32 },
        { gb: 15, price: 47 },
        { gb: 20, price: 62 },
        { gb: 25, price: 76 },
        { gb: 30, price: 90 },
        { gb: 40, price: 118 },
        { gb: 50, price: 145 }
      ]
    }
  ];
}

function validPhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}

function openCheckout(sel) {
  if (!currentUser) {
    showLoginPrompt('Please create an account to make a purchase');
    return;
  }
  const modal = document.getElementById('modal');
  const planLabel = document.getElementById('planLabel');
  const planAmount = document.getElementById('planAmount');
  const payAmount = document.getElementById('payAmount');
  const checkoutStatus = document.getElementById('checkoutStatus');
  if (!modal) return;
  planLabel.textContent = sel.network;
  planAmount.textContent = sel.gb + ' GB';
  payAmount.textContent = sel.price.toFixed(2);
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  if (checkoutStatus) checkoutStatus.textContent = '';
  activeSelection = sel;
}

function closeCheckout() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  activeSelection = null;
}

function showLoginPrompt(message) {
  const authTabs = document.querySelector('.auth-tabs');
  if (authTabs) {
    const loginTab = authTabs.querySelector('[data-tab="login"]');
    if (loginTab) loginTab.click();
  }
  alert(message);
}

document.addEventListener('DOMContentLoaded', async () => {
  const token = getApiToken();
  if (token) {
    currentToken = token;
    await loadUserProfile();
    await loadTransactions();
    await loadOrders();
  }
  
  bundles = getDefaultBundles();
  renderNetworks();
  
  setupAuthHandlers();
  setupCheckoutHandlers();
  setupWalletHandlers();
});

function setupAuthHandlers() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value;
      const password = document.getElementById('loginPassword')?.value;
      
      if (await loginUser(email, password)) {
        await loadUserProfile();
        await loadTransactions();
        await loadOrders();
        loginForm.reset();
        window.location.reload();
      }
    });
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signupEmail')?.value;
      const password = document.getElementById('signupPassword')?.value;
      const name = document.getElementById('signupName')?.value;
      
      if (await registerUser(email, password, name)) {
        signupForm.reset();
        window.location.reload();
      }
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }
}

function setupCheckoutHandlers() {
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutStatus = document.getElementById('checkoutStatus');
  const modalClose = document.getElementById('modalClose');
  const modal = document.getElementById('modal');
  
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!activeSelection || !currentUID) return;
      
      const recipient = document.getElementById('recipient')?.value.trim();
      if (!validPhone(recipient)) {
        checkoutStatus.textContent = 'Invalid recipient';
        return;
      }
      
      const balanceHeader = document.getElementById('balanceHeader');
      const currentBalance = parseFloat(balanceHeader?.textContent || '0') || 0;
      if (currentBalance < activeSelection.price) {
        checkoutStatus.textContent = 'Insufficient balance';
        return;
      }
      
      checkoutStatus.textContent = 'Processing...';
      const submitBtn = checkoutForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      
      try {
        const response = await apiCall(`${API_BASE}/purchases.php?action=create`, 'POST', {
          network: activeSelection.network,
          gb: activeSelection.gb,
          price: activeSelection.price,
          recipient
        });
        
        if (response.success) {
          checkoutStatus.textContent = `Success • Ref ${response.reference}`;
          checkoutStatus.className = 'checkout-status success';
          
          const newBalance = currentBalance - activeSelection.price;
          if (balanceHeader) balanceHeader.textContent = newBalance.toFixed(2);
          const balanceSmall = document.getElementById('balanceSmall');
          if (balanceSmall) balanceSmall.textContent = newBalance.toFixed(2);
          
          await loadTransactions();
          await loadOrders();
          
          setTimeout(() => {
            submitBtn.disabled = false;
            closeCheckout();
            checkoutForm.reset();
          }, 900);
        } else {
          checkoutStatus.textContent = response.error || 'Failed, try again';
          checkoutStatus.className = 'checkout-status error';
          submitBtn.disabled = false;
        }
      } catch (error) {
        console.error('Purchase error:', error);
        checkoutStatus.textContent = 'Failed, try again';
        checkoutStatus.className = 'checkout-status error';
        submitBtn.disabled = false;
      }
    });
  }
  
  if (modalClose) modalClose.addEventListener('click', closeCheckout);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCheckout();
    });
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCheckout();
  });
}

function setupWalletHandlers() {
  const topupBtn = document.getElementById('topupBtn');
  const walletModal = document.getElementById('walletModal');
  const walletForm = document.getElementById('walletForm');
  const payButton = document.getElementById('payButton');
  const loadAmount = document.getElementById('loadAmount');
  const walletStatus = document.getElementById('walletStatus');
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  if (topupBtn) {
    topupBtn.addEventListener('click', () => {
      if (!currentUser) {
        showLoginPrompt('Please create an account to top up your wallet');
        return;
      }
      if (walletModal) {
        walletModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
      if (walletStatus) walletStatus.textContent = '';
      if (loadAmount) loadAmount.value = '';
    });
  }
  
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (loadAmount) loadAmount.value = btn.dataset.amount;
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  if (payButton) {
    payButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const amount = parseFloat(loadAmount?.value || 0);
      
      if (!amount || amount < 1) {
        if (walletStatus) {
          walletStatus.textContent = 'Enter valid amount (minimum 1 GHS)';
          walletStatus.className = 'checkout-status error';
        }
        return;
      }
      
      if (!currentUID) {
        if (walletStatus) {
          walletStatus.textContent = 'Please login first';
          walletStatus.className = 'checkout-status error';
        }
        return;
      }
      
      if (walletStatus) {
        walletStatus.textContent = 'Opening payment gateway...';
        walletStatus.className = 'checkout-status';
      }
      payButton.disabled = true;
      
      const reference = `REF-${currentUID}-${Date.now()}`;
      
      try {
        const txnResponse = await apiCall(`${API_BASE}/transactions.php?action=create`, 'POST', {
          type: 'wallet_topup',
          amount: amount,
          reference: reference
        });
        
        if (!txnResponse.success) {
          if (walletStatus) {
            walletStatus.textContent = txnResponse.error || 'Failed to create transaction';
            walletStatus.className = 'checkout-status error';
          }
          payButton.disabled = false;
          return;
        }
        
        const config = {
          key: PAYSTACK_CONFIG.publicKey,
          email: currentUser.email,
          amount: Math.round(amount * 100),
          ref: reference,
          currency: PAYSTACK_CONFIG.currency,
          onClose: () => {
            console.log('Modal closed, verifying payment...');
            if (walletStatus) walletStatus.textContent = 'Verifying payment...';
            verifyAndProcessPayment(reference, amount, null);
          },
          onSuccess: (response) => {
            console.log('Success callback triggered:', response);
            if (walletStatus) walletStatus.textContent = 'Processing payment...';
            verifyAndProcessPayment(reference, amount, response.reference);
          }
        };
        
        console.log('Initializing Paystack');
        const handler = PaystackPop.setup(config);
        
        setTimeout(() => {
          handler.openIframe();
        }, 100);
      } catch (error) {
        console.error('Paystack error:', error);
        if (walletStatus) {
          walletStatus.textContent = 'Payment gateway error: ' + error.message;
          walletStatus.className = 'checkout-status error';
        }
        payButton.disabled = false;
      }
    });
  }
}

async function verifyAndProcessPayment(reference, amount, paystackRef) {
  if (paymentProcessing) {
    console.log('Payment already processing, ignoring duplicate call');
    return;
  }
  
  paymentProcessing = true;
  
  try {
    const response = await apiCall(`${API_BASE}/transactions.php?action=verify`, 'POST', {
      reference: reference,
      paystack_reference: paystackRef || 'pending'
    });
    
    if (response.success) {
      const walletStatus = document.getElementById('walletStatus');
      const loadAmount = document.getElementById('loadAmount');
      if (walletStatus) {
        walletStatus.textContent = 'Payment successful! Reloading...';
        walletStatus.className = 'checkout-status success';
      }
      if (loadAmount) loadAmount.value = '';
      
      await loadUserProfile();
      await loadTransactions();
      
      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      const walletStatus = document.getElementById('walletStatus');
      if (walletStatus) {
        walletStatus.textContent = response.error || 'Payment verification failed';
        walletStatus.className = 'checkout-status error';
      }
      const payButton = document.getElementById('payButton');
      if (payButton) payButton.disabled = false;
      paymentProcessing = false;
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    const walletStatus = document.getElementById('walletStatus');
    if (walletStatus) {
      walletStatus.textContent = 'Error: ' + (err.message || 'Payment processing failed');
      walletStatus.className = 'checkout-status error';
    }
    const payButton = document.getElementById('payButton');
    if (payButton) payButton.disabled = false;
    paymentProcessing = false;
  }
}

function renderNetworks() {
  const networksList = document.getElementById('networksList');
  if (!networksList) return;
  
  networksList.innerHTML = bundles.map(network => `
    <div class="network-section">
      <div class="network-title">
        <div class="network-emoji">${network.emoji}</div>
        <span>${network.network}</span>
      </div>
      <div class="bundle-controls">
        <select class="bundle-select" id="select-${network.id}">
          <option value="">Select package</option>
          ${network.packages.map(pkg => `
            <option value='${JSON.stringify({ network: network.network, gb: pkg.gb, price: pkg.price })}'>${pkg.gb}GB - GHS ${pkg.price}</option>
          `).join('')}
        </select>
        <button class="bundle-buy-btn btn primary" onclick="selectBundle('${network.id}')">Buy</button>
      </div>
    </div>
  `).join('');
  
  bundles.forEach(network => {
    const select = document.getElementById(`select-${network.id}`);
    if (select) {
      select.addEventListener('change', (e) => {
        if (e.target.value) {
          activeSelection = JSON.parse(e.target.value);
        }
      });
    }
  });
}

function selectBundle(networkId) {
  if (!activeSelection) {
    alert('Please select a package');
    return;
  }
  openCheckout(activeSelection);
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const yearFooter = document.getElementById('year-footer');
if (yearFooter) yearFooter.textContent = new Date().getFullYear();
