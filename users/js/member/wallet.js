// candidate-wallet.js - Wallet module for Candidate Dashboard

// Global variables
let walletData = null;
let transactions = [];
let isUpdating = false; // Add this to prevent concurrent updates
let lastUpdateTime = 0; // Add this for debouncing
const UPDATE_DEBOUNCE_MS = 1000; // Wait 1 second between updates

// Initialize the wallet section
function initWalletSection(user, candidateData) {
    console.log("Initializing Wallet Section");
    
    // Load wallet data
    loadWalletData();
    
    // Set up event listeners for wallet section
    setupWalletEventListeners();
}

// Fetch wallet data from Firestore - WITH DEBOUNCING
async function loadWalletData(force = false) {
    const now = Date.now();
    
    // Prevent rapid successive calls
    if (!force && (isUpdating || (now - lastUpdateTime) < UPDATE_DEBOUNCE_MS)) {
        console.log('⏸️ Skipping wallet load - too soon after last update');
        return;
    }
    
    isUpdating = true;
    lastUpdateTime = now;
    
    try {
        const db = firebase.firestore();
        const currentUser = firebase.auth().currentUser;
        
        console.log('💰 Loading wallet data for:', currentUser.uid);
        
        // Get wallet data
        const walletDoc = await db.collection('wallets')
            .doc(currentUser.uid)
            .get();
            
        if (walletDoc.exists) {
            walletData = walletDoc.data();
            console.log('✅ Wallet data found:', walletData);
        } else {
            // Create wallet if it doesn't exist
            walletData = {
                balance: 0,
                currency: 'USD',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('wallets')
                .doc(currentUser.uid)
                .set(walletData);
            console.log('✅ New wallet created');
        }
        
        // Get user data for total earnings
        const userDoc = await db.collection('users')
            .doc(currentUser.uid)
            .get();
            
        if (userDoc.exists) {
            const userData = userDoc.data();
            // Merge user data with wallet data for totalEarnings
            walletData.totalEarnings = userData.totalEarnings || 0;
            walletData.totalWithdrawn = userData.totalWithdrawn || 0;
            console.log('✅ User data merged:', { 
                totalEarnings: walletData.totalEarnings,
                totalWithdrawn: walletData.totalWithdrawn 
            });
        }
        
        // Get transactions from TOP-LEVEL collection
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
            
        transactions = [];
        transactionsSnapshot.forEach(doc => {
            const transaction = {
                id: doc.id,
                ...doc.data()
            };
            
            // Convert to your expected format
            transactions.push({
                id: doc.id,
                date: transaction.createdAt,
                description: transaction.description,
                type: mapTransactionType(transaction.type),
                amount: transaction.amount,
                balance: transaction.balanceAfter || walletData.balance
            });
        });
        
        console.log(`✅ Loaded ${transactions.length} transactions`);
        
        // Display wallet data
        displayWalletData();
        
    } catch (error) {
        console.error("❌ Error loading wallet data:", error);
        const walletGrid = document.querySelector('#wallet-section .content-grid');
        if (walletGrid) {
            walletGrid.innerHTML = `
                <div class="content-card">
                    <div class="card-content">
                        <p class="error-message">Unable to load wallet data. Please try again later.</p>
                    </div>
                </div>
            `;
        }
    } finally {
        isUpdating = false;
    }
}

// Map transaction types from employer format to member format
function mapTransactionType(employerType) {
    const typeMap = {
        'payment_received': 'job_payment',
        'payment': 'job_payment', 
        'topup': 'bonus', // Employer top-ups show as bonuses
        'withdrawal': 'withdrawal',
        'refund': 'refund'
    };
    
    return typeMap[employerType] || employerType;
}

// Display wallet data - UPDATED
function displayWalletData() {
    const walletGrid = document.querySelector('#wallet-section .content-grid');
    
    if (!walletGrid) {
        console.error('❌ Wallet grid not found');
        return;
    }
    
    // Clear existing content (except the header)
    const header = document.querySelector('#wallet-section .section-header');
    walletGrid.innerHTML = '';
    if (header) {
        walletGrid.parentNode.insertBefore(header, walletGrid);
    }
    
    // Create balance card
    const balanceCard = createBalanceCard();
    walletGrid.appendChild(balanceCard);
    
    // Create transactions card
    const transactionsCard = createTransactionsCard();
    walletGrid.appendChild(transactionsCard);
    
    // Set up event listeners AFTER rendering
    setTimeout(() => {
        setupWalletEventListeners();
    }, 100);
    
    // Set up real-time listener for wallet updates
    setupWalletListener();
}

// Create balance card - FIXED VERSION
function createBalanceCard() {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">
                <i class="fas fa-wallet"></i>
            </div>
            <h3 class="card-title">Current Balance</h3>
        </div>
        <div class="card-content">
            <div class="balance-amount">
                <span class="currency">$</span>
                <span class="amount" id="wallet-balance">${walletData.balance?.toFixed(2) || '0.00'}</span>
            </div>
            <p>Available for withdrawal</p>
            
            <div class="wallet-stats">
                <div class="wallet-stat">
                    <div class="stat-label">Total Earnings</div>
                    <div class="stat-value">$${walletData.totalEarnings?.toFixed(2) || '0.00'}</div>
                </div>
                <div class="wallet-stat">
                    <div class="stat-label">Last Updated</div>
                    <div class="stat-value">${formatDate(walletData.lastUpdated)}</div>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <button class="card-action withdraw-btn" id="withdraw-funds">Withdraw Funds</button>
            <span class="card-stats" id="last-withdrawal">${getLastWithdrawalText()}</span>
        </div>
    `;
    
    return card;
}

// Create transactions card - FIXED VERSION
function createTransactionsCard() {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">
                <i class="fas fa-history"></i>
            </div>
            <h3 class="card-title">Transaction History</h3>
        </div>
        <div class="card-content">
            ${transactions.length > 0 ? createTransactionsTable() : `
                <div class="no-transactions">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions yet. Complete your first project to see transactions here.</p>
                </div>
            `}
        </div>
        <div class="card-footer">
            <button class="card-action export-btn" id="export-transactions">Export CSV</button>
            <span class="card-stats">${transactions.length} transactions</span>
        </div>
    `;
    
    return card;
}

// Create transactions table
function createTransactionsTable() {
    return `
        <div class="table-container">
            <table class="transactions-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th class="text-right">Amount</th>
                        <th class="text-right">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(transaction => `
                        <tr>
                            <td>${formatDate(transaction.date)}</td>
                            <td>${transaction.description || 'Transaction'}</td>
                            <td>
                                <span class="transaction-type ${transaction.type}">
                                    ${getTransactionTypeLabel(transaction.type)}
                                </span>
                            </td>
                            <td class="text-right ${transaction.amount >= 0 ? 'income' : 'expense'}">
                                ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                            </td>
                            <td class="text-right">$${transaction.balance?.toFixed(2) || '0.00'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Format date for display
function formatDate(date) {
    if (!date) return 'N/A';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get transaction type label
function getTransactionTypeLabel(type) {
    const typeLabels = {
        'job_payment': 'Job Payment',
        'freelance_payment': 'Freelance Payment',
        'withdrawal': 'Withdrawal',
        'refund': 'Refund',
        'bonus': 'Bonus'
    };
    
    return typeLabels[type] || type;
}

// Get last withdrawal text
function getLastWithdrawalText() {
    const withdrawal = transactions.find(t => t.type === 'withdrawal');
    if (withdrawal) {
        return `Last withdrawal: ${formatDate(withdrawal.date)}`;
    }
    return 'Last withdrawal: Never';
}

// Show withdrawal form - UPDATED MODAL VERSION
function showWithdrawalForm() {
    if (walletData.balance <= 0) {
        alert('Your balance is $0. You need earnings before you can withdraw.');
        return;
    }
    
    // Check if modal already exists
    const existingModal = document.querySelector('.modal.withdrawal-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal withdrawal-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Withdraw Funds</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="withdrawal-form">
                    <div class="form-group">
                        <label for="withdrawal-amount">Amount to Withdraw</label>
                        <div class="amount-input">
                            <span class="currency-symbol">$</span>
                            <input type="number" id="withdrawal-amount" 
                                   min="10" 
                                   max="${walletData.balance}" 
                                   step="0.01"
                                   value="${walletData.balance}" 
                                   required>
                        </div>
                        <small>Available: $${walletData.balance.toFixed(2)}</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="withdrawal-method">Withdrawal Method</label>
                        <select id="withdrawal-method" required>
                            <option value="">Select method</option>
                            <option value="paypal">PayPal</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="crypto">Cryptocurrency</option>
                        </select>
                    </div>
                    
                    <div id="method-details">
                        <!-- Dynamic content based on selected method -->
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Request Withdrawal</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners with cleanup
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('.cancel-btn').addEventListener('click', closeModal);
    
    // Update method details based on selection
    modal.querySelector('#withdrawal-method').addEventListener('change', (e) => {
        updateMethodDetails(e.target.value);
    });
    
    modal.querySelector('#withdrawal-form').addEventListener('submit', (e) => {
        e.preventDefault();
        requestWithdrawal();
        closeModal();
    });
    
    // Initialize method details
    updateMethodDetails(modal.querySelector('#withdrawal-method').value);
}

// Update method details in withdrawal form
function updateMethodDetails(method) {
    const detailsContainer = document.getElementById('method-details');
    
    switch(method) {
        case 'paypal':
            detailsContainer.innerHTML = `
                <div class="form-group">
                    <label for="paypal-email">PayPal Email</label>
                    <input type="email" id="paypal-email" required>
                </div>
            `;
            break;
            
        case 'bank_transfer':
            detailsContainer.innerHTML = `
                <div class="form-group">
                    <label for="bank-name">Bank Name</label>
                    <input type="text" id="bank-name" required>
                </div>
                <div class="form-group">
                    <label for="account-number">Account Number</label>
                    <input type="text" id="account-number" required>
                </div>
                <div class="form-group">
                    <label for="routing-number">Routing Number</label>
                    <input type="text" id="routing-number" required>
                </div>
            `;
            break;
            
        case 'crypto':
            detailsContainer.innerHTML = `
                <div class="form-group">
                    <label for="crypto-wallet">Wallet Address</label>
                    <input type="text" id="crypto-wallet" required>
                </div>
                <div class="form-group">
                    <label for="crypto-type">Cryptocurrency Type</label>
                    <select id="crypto-type" required>
                        <option value="bitcoin">Bitcoin</option>
                        <option value="ethereum">Ethereum</option>
                        <option value="usdt">USDT</option>
                    </select>
                </div>
            `;
            break;
            
        default:
            detailsContainer.innerHTML = '';
    }
}

// Request withdrawal - UPDATED VERSION
async function requestWithdrawal(modalElement = null) {
    try {
        console.log('💰 Starting withdrawal process...');
        
        // SAFELY get form elements - either from passed modal or document
        let amountInput, methodSelect;
        
        if (modalElement) {
            // Get elements from the modal that was passed
            amountInput = modalElement.querySelector('#withdrawal-amount');
            methodSelect = modalElement.querySelector('#withdrawal-method');
        } else {
            // Fallback to document search
            amountInput = document.getElementById('withdrawal-amount');
            methodSelect = document.getElementById('withdrawal-method');
        }
        
        console.log('Form elements found:', { 
            amountInput: !!amountInput, 
            methodSelect: !!methodSelect 
        });
        
        // Check if elements exist before accessing their values
        if (!amountInput || !methodSelect) {
            console.error('❌ Withdrawal form elements not found');
            alert('Withdrawal form is not properly loaded. Please open the withdrawal form again.');
            return;
        }
        
        const amount = parseFloat(amountInput.value);
        const method = methodSelect.value;
        
        console.log('💰 Processing withdrawal:', { amount, method });
        
        // Validate inputs
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid withdrawal amount.');
            return;
        }
        
        if (amount > walletData.balance) {
            alert('Withdrawal amount cannot exceed your available balance.');
            return;
        }
        
        if (amount < 10) {
            alert('Minimum withdrawal amount is $10.');
            return;
        }
        
        if (!method) {
            alert('Please select a withdrawal method.');
            return;
        }
        
        const db = firebase.firestore();
        const currentUser = firebase.auth().currentUser;
        
        // Use Firestore transaction for data consistency
        await db.runTransaction(async (transaction) => {
            // Get current wallet
            const walletRef = db.collection('wallets').doc(currentUser.uid);
            const walletDoc = await transaction.get(walletRef);
            
            if (!walletDoc.exists) {
                throw new Error('Wallet not found');
            }
            
            const currentBalance = walletDoc.data().balance || 0;
            
            if (currentBalance < amount) {
                throw new Error('Insufficient balance');
            }
            
            const newBalance = currentBalance - amount;
            
            // Get user data for total withdrawn
            const userRef = db.collection('users').doc(currentUser.uid);
            const userDoc = await transaction.get(userRef);
            const currentWithdrawn = userDoc.exists ? (userDoc.data().totalWithdrawn || 0) : 0;
            
            // Update wallet balance
            transaction.update(walletRef, {
                balance: newBalance,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update user's total withdrawn
            if (userDoc.exists) {
                transaction.update(userRef, {
                    totalWithdrawn: currentWithdrawn + amount,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            // Create transaction record
            const transactionRef = db.collection('transactions').doc();
            transaction.set(transactionRef, {
                userId: currentUser.uid,
                type: 'withdrawal',
                amount: -amount,
                description: `Withdrawal to ${method}`,
                status: 'pending',
                paymentMethod: method,
                balanceAfter: newBalance,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Create withdrawal request
            const withdrawalRef = db.collection('withdrawalRequests').doc();
            const withdrawalData = {
                amount: amount,
                method: method,
                status: 'pending',
                requestedDate: new Date(),
                candidateId: currentUser.uid,
                candidateName: candidateData?.name || 'Member',
                candidateEmail: candidateData?.email || currentUser.email
            };
            
            // SAFELY get method-specific details from the modal
            let paypalEmail, bankName, accountNumber, routingNumber, walletAddress, cryptoType;
            
            if (modalElement) {
                paypalEmail = modalElement.querySelector('#paypal-email');
                bankName = modalElement.querySelector('#bank-name');
                accountNumber = modalElement.querySelector('#account-number');
                routingNumber = modalElement.querySelector('#routing-number');
                walletAddress = modalElement.querySelector('#crypto-wallet');
                cryptoType = modalElement.querySelector('#crypto-type');
            } else {
                // Fallback to document search
                paypalEmail = document.getElementById('paypal-email');
                bankName = document.getElementById('bank-name');
                accountNumber = document.getElementById('account-number');
                routingNumber = document.getElementById('routing-number');
                walletAddress = document.getElementById('crypto-wallet');
                cryptoType = document.getElementById('crypto-type');
            }
            
            // Add method-specific details
            switch(method) {
                case 'paypal':
                    if (paypalEmail) withdrawalData.paypalEmail = paypalEmail.value;
                    break;
                case 'bank_transfer':
                    if (bankName) withdrawalData.bankName = bankName.value;
                    if (accountNumber) withdrawalData.accountNumber = accountNumber.value;
                    if (routingNumber) withdrawalData.routingNumber = routingNumber.value;
                    break;
                case 'crypto':
                    if (walletAddress) withdrawalData.walletAddress = walletAddress.value;
                    if (cryptoType) withdrawalData.cryptoType = cryptoType.value;
                    break;
            }
            
            transaction.set(withdrawalRef, withdrawalData);
            
            return { newBalance, totalWithdrawn: currentWithdrawn + amount };
        });
        
        // Close modal safely
        if (modalElement && modalElement.parentNode) {
            document.body.removeChild(modalElement);
        } else {
            // Fallback: try to find and close any withdrawal modal
            const modal = document.querySelector('.modal.withdrawal-modal');
            if (modal && modal.parentNode) {
                document.body.removeChild(modal);
            }
        }
        
        // Show success message
        showWithdrawalSuccess(amount);
        
        // Reload wallet data
        setTimeout(() => loadWalletData(true), 1000);
        
    } catch (error) {
        console.error("❌ Error requesting withdrawal:", error);
        alert(`Withdrawal failed: ${error.message}`);
    }
}

// Show withdrawal success message
function showWithdrawalSuccess(amount) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <h3>Withdrawal Requested!</h3>
            <p>Your withdrawal request for $${amount.toFixed(2)} has been submitted successfully.</p>
            <p>Please allow 3-5 business days for processing.</p>
            <button class="success-ok-btn">OK</button>
        </div>
    `;
    
    document.body.appendChild(successMsg);
    
    // Add event listener
    successMsg.querySelector('.success-ok-btn').addEventListener('click', () => {
        document.body.removeChild(successMsg);
    });
}

// Export transactions to CSV
function exportTransactions() {
    if (transactions.length === 0) return;
    
    // Create CSV content
    let csvContent = "Date,Description,Type,Amount,Balance\n";
    
    transactions.forEach(transaction => {
        const date = formatDate(transaction.date);
        const description = transaction.description || 'Transaction';
        const type = getTransactionTypeLabel(transaction.type);
        const amount = transaction.amount >= 0 ? `+$${transaction.amount.toFixed(2)}` : `-$${Math.abs(transaction.amount).toFixed(2)}`;
        const balance = `$${transaction.balance?.toFixed(2) || '0.00'}`;
        
        csvContent += `"${date}","${description}","${type}","${amount}","${balance}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `merituno-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Set up real-time listener for wallet updates - FIXED VERSION
// Set up real-time listener for wallet updates - STABLE VERSION
function setupWalletListener() {
    const db = firebase.firestore();
    const currentUser = firebase.auth().currentUser;
    
    console.log('👂 Setting up real-time wallet listener');
    
    // Clean up existing listeners first
    if (window.walletListeners) {
        window.walletListeners.forEach(unsubscribe => unsubscribe());
    }
    
    window.walletListeners = [];
    
    // 1. Wallet balance listener - MINIMAL UPDATES
    const walletUnsubscribe = db.collection('wallets')
        .doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const newData = doc.data();
                const oldBalance = walletData?.balance || 0;
                const newBalance = newData.balance || 0;
                
                // Only update if balance actually changed
                if (Math.abs(oldBalance - newBalance) > 0.001) {
                    console.log('💰 Balance changed:', newBalance);
                    walletData.balance = newBalance;
                    updateBalanceDisplay(); // Just update display, don't reload
                }
            }
        });
    window.walletListeners.push(walletUnsubscribe);
    
    // 2. User data listener - MINIMAL UPDATES  
    const userUnsubscribe = db.collection('users')
        .doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const oldEarnings = walletData.totalEarnings || 0;
                const newEarnings = userData.totalEarnings || 0;
                const oldWithdrawn = walletData.totalWithdrawn || 0;
                const newWithdrawn = userData.totalWithdrawn || 0;
                
                // Only update if values actually changed
                if (oldEarnings !== newEarnings || oldWithdrawn !== newWithdrawn) {
                    console.log('👤 User stats changed');
                    walletData.totalEarnings = newEarnings;
                    walletData.totalWithdrawn = newWithdrawn;
                    updateBalanceDisplay(); // Just update display
                }
            }
        });
    window.walletListeners.push(userUnsubscribe);
    
    // 3. Transactions listener - ONLY FOR NEW TRANSACTIONS
    let transactionTimer;
    const transactionsUnsubscribe = db.collection('transactions')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            const changes = snapshot.docChanges();
            
            // Only reload for actual new transactions, not just updates
            const hasNewTransactions = changes.some(change => 
                change.type === 'added' && change.doc.data().createdAt?.toDate() > new Date(Date.now() - 60000) // Last 60 seconds
            );
            
            if (hasNewTransactions) {
                console.log('📊 New transaction detected, reloading...');
                clearTimeout(transactionTimer);
                transactionTimer = setTimeout(() => {
                    loadWalletData(true);
                }, 1000);
            }
        });
    window.walletListeners.push(transactionsUnsubscribe);
}

// Update balance display
// Update balance display - IMPROVED VERSION
function updateBalanceDisplay() {
    console.log('🎨 Updating balance display only');
    
    // Update balance amount
    const balanceElement = document.getElementById('wallet-balance');
    if (balanceElement) {
        balanceElement.textContent = walletData.balance?.toFixed(2) || '0.00';
    }
    
    // Update total earnings in the stats (if the element exists)
    const earningsElement = document.querySelector('.wallet-stat .stat-value');
    if (earningsElement) {
        earningsElement.textContent = `$${walletData.totalEarnings?.toFixed(2) || '0.00'}`;
    }
    
    // Update last withdrawal text
    const lastWithdrawalElement = document.getElementById('last-withdrawal');
    if (lastWithdrawalElement) {
        lastWithdrawalElement.textContent = getLastWithdrawalText();
    }
    
    // Update candidateData for other modules
    if (candidateData) {
        candidateData.walletBalance = walletData.balance;
        candidateData.totalEarnings = walletData.totalEarnings;
    }
}

// Update transactions display
function updateTransactionsDisplay() {
    const transactionsCard = document.querySelector('#wallet-section .content-card:nth-child(2)');
    if (transactionsCard) {
        const newTable = createTransactionsTable();
        transactionsCard.querySelector('.card-content').innerHTML = newTable;
        
        // Update transactions count
        transactionsCard.querySelector('.card-stats').textContent = `${transactions.length} transactions`;
        
        // Re-add export button event listener
        const exportButton = transactionsCard.querySelector('#export-transactions');
        if (exportButton) {
            exportButton.addEventListener('click', exportTransactions);
        }
    }
}

// Set up event listeners for the wallet section
// Set up event listeners for the wallet section - FIXED VERSION
function setupWalletEventListeners() {
    console.log('🔗 Setting up wallet event listeners');
    
    // Use event delegation to avoid multiple listeners
    const walletGrid = document.querySelector('#wallet-section .content-grid');
    if (!walletGrid) return;
    
    // Remove any existing listeners first
    walletGrid.removeEventListener('click', handleWalletClick);
    
    // Add single event listener for the entire wallet section
    walletGrid.addEventListener('click', handleWalletClick);
}

// Handle all wallet clicks in one place
function handleWalletClick(event) {
    const target = event.target;
    
    // Handle withdraw button
    if (target.classList.contains('withdraw-btn') || target.closest('.withdraw-btn')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('💰 Withdraw button clicked');
        showWithdrawalForm();
        return;
    }
    
    // Handle export button
    if (target.classList.contains('export-btn') || target.closest('.export-btn')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('📊 Export button clicked');
        exportTransactions();
        return;
    }
}

// Clean up wallet listeners when leaving the section
function cleanupWalletListeners() {
    console.log('🧹 Cleaning up wallet listeners');
    
    if (window.walletListeners) {
        window.walletListeners.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.log('Error unsubscribing:', error);
            }
        });
        window.walletListeners = [];
    }
    
    // Also clean up any pending timeouts
    if (window.walletTimeouts) {
        window.walletTimeouts.forEach(timeout => clearTimeout(timeout));
        window.walletTimeouts = [];
    }
}

// SIMPLE CLEANUP - Add this to the BOTTOM of wallet.js

// Clean up when the page is unloaded (user leaves completely)
window.addEventListener('beforeunload', function() {
    if (typeof cleanupWalletListeners === 'function') {
        console.log('🧹 Cleaning up wallet listeners (page unload)');
        cleanupWalletListeners();
    }
});

// Call this when switching away from wallet section
window.cleanupWalletListeners = cleanupWalletListeners;