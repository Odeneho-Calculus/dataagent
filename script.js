const firebaseConfig = {
  apiKey: "AIzaSyB3tiRGkbivshcU9S47DWxM7RtvQ9c5CB0",
  authDomain: "highestdatahub.firebaseapp.com",
  databaseURL: "https://highestdatahub-default-rtdb.firebaseio.com",
  projectId: "highestdatahub",
  storageBucket: "highestdatahub.firebasestorage.app",
  messagingSenderId: "701655732378",
  appId: "1:701655732378:web:1012fd0f67d67fa1f5cf23",
  measurementId: "G-T5VKNKVDPS"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

const PAYSTACK_CONFIG = {
  publicKey: 'pk_live_6eb14b33b61826828aba18a32aa3f12da1c074e1',
  currency: 'GHS'
};

let currentUser = null;
let bundles = [];
let currentUID = null;
let paymentProcessing = false;
let activeSelection = null;

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
}

function closeCheckout() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  activeSelection = null;
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
        { gb: 1, price: 4 },
        { gb: 2, price: 7.90 },
        { gb: 3, price: 11.80 },
        { gb: 4, price: 15.20 },
        { gb: 5, price: 19 },
        { gb: 6, price: 23 },
        { gb: 7, price: 26.5 },
        { gb: 8, price: 31 },
        { gb: 9, price: 34.70 },
        { gb: 10, price: 39 },
        { gb: 12, price: 45.5 },
        { gb: 15, price: 57 },
        { gb: 20, price: 76 },
        { gb: 25, price: 94 },
        { gb: 30, price: 114 },
        { gb: 40, price: 150 },
        { gb: 50, price: 188 },
        { gb: 100, price: 378 }
      ]
    },
    {
      id: 'airteltigo',
      network: 'Airteltigo Bigtime',
      emoji: '⚡',
      packages: [
        { gb: 30, price: 77 },
        { gb: 40, price: 95 },
        { gb: 50, price: 115 },
        { gb: 60, price: 150 },
        { gb: 80, price: 185 },
        { gb: 100, price: 220 },
        { gb: 200, price: 425 },
        { gb: 500, price: 1150 }
      ]
    }
  ];
}

function renderBundles(bundleList) {
  const networksList = document.getElementById('networksList');
  if (!networksList) return;
  networksList.innerHTML = '';
  
  bundleList.forEach(bundle => {
    const section = document.createElement('div');
    section.className = 'network-section';
    
    const title = document.createElement('div');
    title.className = 'network-title';
    
    const badge = document.createElement('div');
    badge.className = 'network-badge';
    
    const emoji = document.createElement('span');
    emoji.className = 'network-emoji';
    emoji.textContent = bundle.emoji;
    
    const name = document.createElement('span');
    name.className = 'network-name';
    name.textContent = bundle.network;
    
    badge.appendChild(emoji);
    badge.appendChild(name);
    title.appendChild(badge);
    section.appendChild(title);
    
    const container = document.createElement('div');
    container.className = 'bundle-controls';
    
    const select = document.createElement('select');
    select.className = 'bundle-select';
    
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = `Select ${bundle.network} package...`;
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
    
    bundle.packages.forEach(pkg => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ gb: pkg.gb, price: pkg.price });
      option.textContent = `${pkg.gb}GB - GHS ${pkg.price.toFixed(2)}`;
      select.appendChild(option);
    });
    
    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn primary bundle-buy-btn';
    buyBtn.textContent = 'Buy';
    buyBtn.addEventListener('click', () => {
      if (select.value) {
        const pkg = JSON.parse(select.value);
        activeSelection = { network: bundle.network, gb: pkg.gb, price: pkg.price };
        openCheckout(activeSelection);
      }
    });
    
    container.appendChild(select);
    container.appendChild(buyBtn);
    section.appendChild(container);
    networksList.appendChild(section);
  });
}

function validPhone(v) {
  if (!v) return false;
  const d = v.replace(/\D/g, '');
  return d.length >= 8 && d.length <= 14;
}



function showLoginPrompt(message = 'Please sign in to continue') {
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(2,6,23,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    backdrop-filter: blur(10px);
  `;
  
  alertDiv.innerHTML = `
    <div style="
      background: linear-gradient(135deg,rgba(255,255,255,0.12),rgba(0,217,255,0.08));
      border: 1.5px solid rgba(0,217,255,0.45);
      border-radius: 28px;
      padding: 2.5rem;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 30px 90px rgba(0,217,255,0.3);
      animation: slideIn 0.3s ease-out;
    ">
      <p style="
        font-size: 1.2rem;
        font-weight: 700;
        color: #00d9ff;
        margin: 0 0 1.5rem;
        line-height: 1.4;
      ">${message}</p>
      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <button onclick="this.closest('[style*=position]').remove()" style="
          flex: 1;
          padding: 0.8rem 1.2rem;
          border-radius: 12px;
          border: 1.5px solid rgba(0,217,255,0.35);
          background: rgba(0,217,255,0.12);
          color: #e0e9ff;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        " onmouseover="this.style.background='rgba(0,217,255,0.2)'; this.style.borderColor='rgba(0,217,255,0.6)';" onmouseout="this.style.background='rgba(0,217,255,0.12)'; this.style.borderColor='rgba(0,217,255,0.35)';">
          Cancel
        </button>
        <button onclick="window.location.href='auth.html'" style="
          flex: 1;
          padding: 0.8rem 1.2rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg,#00d9ff,#0099ff);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 12px 32px rgba(0,217,255,0.35);
        " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 18px 48px rgba(0,217,255,0.45)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 12px 32px rgba(0,217,255,0.35)';">
          Sign Up
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  alertDiv.addEventListener('click', (e) => {
    if (e.target === alertDiv) alertDiv.remove();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');
  const planLabel = document.getElementById('planLabel');
  const planAmount = document.getElementById('planAmount');
  const payAmount = document.getElementById('payAmount');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutStatus = document.getElementById('checkoutStatus');
  const balanceHeader = document.getElementById('balance-header');
  const balanceSmall = document.getElementById('balance-small');

  const logoutBtn = document.getElementById('logoutBtn');
  const authButtonsGroup = document.getElementById('authButtons');
  const topupBtn = document.getElementById('topupBtn');
  const walletModal = document.getElementById('walletModal');
  const loadAmount = document.getElementById('loadAmount');
  const payButton = document.getElementById('payButton');
  const walletStatus = document.getElementById('walletStatus');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const successCard = document.getElementById('successCard');
  const successUsername = document.getElementById('successUsername');
  const successCountdown = document.getElementById('successCountdown');

  function initializeBundles() {
    bundles = getDefaultBundles();
    renderBundles(bundles);
  }

  initializeBundles();

  checkAuthStatus();

  function checkAuthStatus() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUID = user.uid;
        currentUser = { id: user.uid, email: user.email };
        if (authButtonsGroup) authButtonsGroup.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (balanceHeader) balanceHeader.parentElement.style.display = 'flex';
        const topupBtn = document.getElementById('topupBtn');
        if (topupBtn) topupBtn.style.opacity = '1';
        loadUserData();
        loadTransactions();
        loadOrders();
        loadUserProfile();
      } else {
        currentUser = null;
        currentUID = null;
        if (authButtonsGroup) authButtonsGroup.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (balanceHeader) balanceHeader.parentElement.style.display = 'none';
        const welcomeCard = document.getElementById('welcomeCard');
        if (welcomeCard) welcomeCard.style.display = 'none';
        const topupBtn = document.getElementById('topupBtn');
        if (topupBtn) topupBtn.style.opacity = '0.6';
        const statBalance = document.getElementById('stat-balance');
        const statOrders = document.getElementById('stat-orders');
        const statSpent = document.getElementById('stat-spent');
        const statLast = document.getElementById('stat-last');
        const statLastDate = document.getElementById('stat-last-date');
        if (statBalance) statBalance.textContent = '0.00';
        if (statOrders) statOrders.textContent = '0';
        if (statSpent) statSpent.textContent = '0.00';
        if (statLast) statLast.textContent = '--';
        if (statLastDate) statLastDate.textContent = 'No purchases yet';
        const ordersList = document.getElementById('ordersList');
        const transactionsList = document.getElementById('transactionsList');
        if (ordersList) ordersList.innerHTML = '<p class="muted" style="text-align: center; padding: 2rem;">Sign in to view orders</p>';
        if (transactionsList) transactionsList.innerHTML = '<p class="muted" style="text-align: center; padding: 2rem;">Sign in to view transactions</p>';
      }
    });
  }

  async function loadUserData() {
    if (!currentUID) return;
    try {
      const snapshot = await db.ref('users/' + currentUID).once('value');
      const user = snapshot.val();
      
      if (user) {
        const balance = (user.balance || 0).toFixed(2);
        balanceHeader.textContent = balance;
        
        const statBalance = document.getElementById('stat-balance');
        if (statBalance) statBalance.textContent = balance;
        
        const purchasesSnap = await db.ref('purchases').orderByChild('user_id').equalTo(currentUID).once('value');
        const purchases = purchasesSnap.exists() ? Object.values(purchasesSnap.val()) : [];
        
        const statOrders = document.getElementById('stat-orders');
        if (statOrders) statOrders.textContent = purchases.length;
        
        const totalSpent = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
        const statSpent = document.getElementById('stat-spent');
        if (statSpent) statSpent.textContent = totalSpent.toFixed(2);
        
        if (purchases.length > 0) {
          const lastPurchase = purchases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          const statLast = document.getElementById('stat-last');
          const statLastDate = document.getElementById('stat-last-date');
          if (statLast) statLast.textContent = lastPurchase.network || '--';
          if (statLastDate) statLastDate.textContent = new Date(lastPurchase.createdAt).toLocaleDateString();
        }
      }
    } catch (err) {
      console.error('Load user error:', err);
      balanceHeader.textContent = '0.00';
    }
  }

  async function loadUserProfile() {
    if (!currentUID) return;
    try {
      const snapshot = await db.ref('users/' + currentUID).once('value');
      const user = snapshot.val();
      
      if (user && user.name) {
        const welcomeCard = document.getElementById('welcomeCard');
        const welcomeUsername = document.getElementById('welcomeUsername');
        
        if (welcomeCard && welcomeUsername) {
          welcomeUsername.textContent = user.name;
          welcomeCard.style.display = 'block';
        }
      }
    } catch (err) {
      console.error('Load user profile error:', err);
    }
  }

  async function loadTransactions() {
    try {
      const transactionsList = document.getElementById('transactionsList');
      if (!transactionsList) return;

      const txnSnap = await db.ref('transactions').orderByChild('user_id').equalTo(currentUID).once('value');
      
      if (!txnSnap.exists()) {
        transactionsList.innerHTML = '<p class="muted" style="text-align: center; padding: 2rem;">No transactions yet</p>';
        return;
      }

      const transactions = Object.values(txnSnap.val()).reverse();
      
      transactionsList.innerHTML = transactions.slice(0, 10).map(txn => `
        <div class="transaction-item">
          <div class="txn-header">
            <div class="txn-type">${txn.type === 'wallet_topup' ? '💳 Wallet Top-up' : '📦 Data Purchase'}</div>
            <div class="txn-date">${new Date(txn.createdAt).toLocaleDateString()}</div>
          </div>
          <div class="txn-details">
            <div class="txn-amount">GHS ${txn.amount ? txn.amount.toFixed(2) : '0.00'}</div>
            <div class="txn-status ${txn.status}">${txn.status === 'completed' ? '✓ Completed' : txn.status === 'pending' ? '⏳ Pending' : '✗ Failed'}</div>
          </div>
          ${txn.reference ? `<div class="txn-ref muted small">Ref: ${txn.reference}</div>` : ''}
        </div>
      `).join('');
    } catch (err) {
      console.error('Load transactions error:', err);
    }
  }

  async function loadOrders() {
    try {
      const ordersList = document.getElementById('ordersList');
      if (!ordersList) return;

      const purchasesSnap = await db.ref('purchases').orderByChild('user_id').equalTo(currentUID).once('value');
      
      if (!purchasesSnap.exists()) {
        ordersList.innerHTML = '<p class="muted" style="text-align: center; padding: 2rem;">No orders yet</p>';
        return;
      }

      const orders = Object.values(purchasesSnap.val()).reverse();
      
      ordersList.innerHTML = orders.slice(0, 8).map(order => {
        const date = new Date(order.createdAt);
        const timeAgo = getTimeAgo(date);
        return `
          <div class="order-item">
            <div class="order-main">
              <div class="order-network">📱 ${order.network} - ${order.gb}GB</div>
              <div class="order-info">
                <div class="order-phone">📞 ${order.recipient || 'Unknown'}</div>
                <div class="order-time">🕐 ${timeAgo}</div>
              </div>
            </div>
            <div class="order-status-badge ${order.status}">
              ${order.status === 'completed' ? '✓ Delivered' : '⏳ Processing'}
            </div>
            <div class="order-amount">GHS ${order.price ? order.price.toFixed(2) : '0.00'}</div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Load orders error:', err);
    }
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

  modalClose?.addEventListener('click', closeCheckout);
  modal?.addEventListener('click', (e) => { if(e.target===modal) closeCheckout(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeCheckout(); });

  logoutBtn?.addEventListener('click', async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.reload();
  });

  topupBtn?.addEventListener('click', () => {
    if (!currentUser) {
      showLoginPrompt('Please create an account to top up your wallet');
      return;
    }
    walletModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    walletStatus.textContent = '';
    loadAmount.value = '';
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      loadAmount.value = btn.dataset.amount;
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  payButton?.addEventListener('click', async e => {
    e.preventDefault();
    const amount = parseFloat(loadAmount.value);
    
    if (!amount || amount < 1) {
      walletStatus.textContent = 'Enter valid amount (minimum 1 GHS)';
      walletStatus.className = 'checkout-status error';
      return;
    }
    if (!currentUID) {
      walletStatus.textContent = 'Please login first';
      walletStatus.className = 'checkout-status error';
      return;
    }

    walletStatus.textContent = 'Opening payment gateway...';
    walletStatus.className = 'checkout-status';
    payButton.disabled = true;

    const reference = `REF-${currentUID}-${Date.now()}`;

    try {
      const config = {
        key: PAYSTACK_CONFIG.publicKey,
        email: auth.currentUser?.email || 'user@example.com',
        amount: Math.round(amount * 100),
        ref: reference,
        currency: 'GHS',
        onClose: () => {
          console.log('Modal closed, verifying payment...');
          walletStatus.textContent = 'Verifying payment...';
          verifyAndProcessPayment(reference, amount, null);
        },
        onSuccess: (response) => {
          console.log('Success callback triggered:', response);
          walletStatus.textContent = 'Processing payment...';
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
      walletStatus.textContent = 'Payment gateway error: ' + error.message;
      walletStatus.className = 'checkout-status error';
      payButton.disabled = false;
    }
  });

  async function verifyAndProcessPayment(reference, amount, paystackRef) {
    if (paymentProcessing) {
      console.log('Payment already processing, ignoring duplicate call');
      return;
    }

    paymentProcessing = true;

    try {
      const txnSnap = await db.ref('transactions').orderByChild('reference').equalTo(reference).once('value');
      
      if (txnSnap.exists()) {
        const existingTxn = Object.values(txnSnap.val())[0];
        console.log('Transaction already exists:', existingTxn);
        walletStatus.textContent = 'Payment already recorded! Reloading...';
        walletStatus.className = 'checkout-status';
        loadAmount.value = '';
        setTimeout(() => location.reload(), 1500);
        return;
      }

      const userSnapshot = await db.ref('users/' + currentUID).once('value');
      let user = userSnapshot.val();
      
      if (!user) {
        user = {
          email: auth.currentUser?.email,
          balance: 0,
          referral_code: 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          referral_earnings: 0,
          createdAt: new Date().toISOString()
        };
        await db.ref('users/' + currentUID).set(user);
      }

      const newBalance = (user.balance || 0) + amount;
      await db.ref('users/' + currentUID + '/balance').set(newBalance);

      await db.ref('transactions').push().set({
        user_id: currentUID,
        type: 'wallet_topup',
        amount: amount,
        reference: reference,
        paystack_reference: paystackRef || 'pending',
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      walletStatus.textContent = 'Payment successful! Reloading...';
      walletStatus.className = 'checkout-status';
      loadAmount.value = '';
      
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      console.error('Payment verification error:', err);
      walletStatus.textContent = 'Error: ' + (err.message || 'Payment processing failed');
      walletStatus.className = 'checkout-status error';
      payButton.disabled = false;
      paymentProcessing = false;
    }
  }

  checkoutForm?.addEventListener('submit', async e=>{
    e.preventDefault();
    if(!activeSelection || !currentUID) return;
    const recipient = document.getElementById('recipient').value.trim();
    if(!validPhone(recipient)) return checkoutStatus.textContent='Invalid recipient';

    const currentBalance = parseFloat(balanceHeader.textContent||'0')||0;
    if(currentBalance < activeSelection.price){
      return checkoutStatus.textContent = 'Insufficient balance';
    }

    checkoutStatus.textContent='Processing...';
    const submitBtn = checkoutForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const reference = 'PUR' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const purchaseRef = db.ref('purchases').push();
      
      await purchaseRef.set({
        user_id: currentUID,
        network: activeSelection.network,
        gb: activeSelection.gb,
        price: activeSelection.price,
        recipient,
        reference: reference.toUpperCase(),
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      const newBalance = currentBalance - activeSelection.price;
      await db.ref('users/' + currentUID + '/balance').set(newBalance);

      checkoutStatus.textContent = `Success • Ref ${reference}`;
      balanceHeader.textContent = newBalance.toFixed(2);
      if(balanceSmall) balanceSmall.textContent = newBalance.toFixed(2);
      loadTransactions();
      loadOrders();
      loadUserData();
      setTimeout(()=>{ submitBtn.disabled=false; closeCheckout(); checkoutForm.reset(); },900);
    } catch(e){
      console.error('Purchase error', e);
      checkoutStatus.textContent = e.message || 'Failed, try again';
      submitBtn.disabled=false;
    }
  });

  const year = document.getElementById('year');
  if(year) year.textContent = new Date().getFullYear();
  
  const yearFooter = document.getElementById('year-footer');
  if(yearFooter) yearFooter.textContent = new Date().getFullYear();
});
