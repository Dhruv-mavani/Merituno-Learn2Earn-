// employer-wallet.js


function setupTopUpListener(userId) {
    const topUpForm = document.getElementById('topup-form');
    if (topUpForm) {
        topUpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processTopUp(userId);
        });
    }
}

function loadWalletData(userId) {
    const balanceElement = document.getElementById('wallet-balance');
    const transactionsList = document.getElementById('transactions-list');
    
    if (balanceElement) {
        balanceElement.textContent = 'Loading...';
    }
    
    if (transactionsList) {
        transactionsList.innerHTML = '<div class="loading">Loading transactions...</div>';
    }

    const db = firebase.firestore();
    
    // Get wallet balance
    db.collection('wallets').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const walletData = doc.data();
                updateBalanceDisplay(walletData.balance);
            } else {
                // Create wallet if it doesn't exist
                db.collection('wallets').doc(userId).set({
                    balance: 0,
                    currency: 'USD',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    updateBalanceDisplay(0);
                });
            }
        })
        .catch((error) => {
            console.error('Error getting wallet: ', error);
            if (balanceElement) balanceElement.textContent = 'Error';
        });
    
    // Get transaction history
    db.collection('transactions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get()
        .then((querySnapshot) => {
            if (transactionsList) {
                transactionsList.innerHTML = ''; // Clear loading state
                
                if (querySnapshot.empty) {
                    transactionsList.innerHTML = '<div class="no-transactions">No transactions yet.</div>';
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const transaction = doc.data();
                    transaction.id = doc.id;
                    const transactionItem = createTransactionItem(transaction);
                    transactionsList.appendChild(transactionItem);
                });
            }
        })
        .catch((error) => {
            console.error('Error getting transactions: ', error);
            if (transactionsList) {
                transactionsList.innerHTML = '<div class="error">Error loading transactions.</div>';
            }
        });
}

function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('wallet-balance');
    if (balanceElement) {
        balanceElement.textContent = `$${balance.toFixed(2)}`;
    }
}

function createTransactionItem(transaction) {
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';
    
    // Format date
    const transactionDate = transaction.createdAt ? transaction.createdAt.toDate().toLocaleString() : 'Date not available';
    
    // Determine transaction type class and sign
    let amountClass = '';
    let amountSign = '';
    
    if (transaction.type === 'topup') {
        amountClass = 'transaction-credit';
        amountSign = '+';
    } else if (transaction.type === 'payment') {
        amountClass = 'transaction-debit';
        amountSign = '-';
    } else if (transaction.type === 'refund') {
        amountClass = 'transaction-credit';
        amountSign = '+';
    }
    
    transactionItem.innerHTML = `
        <div class="transaction-main">
            <div class="transaction-info">
                <div class="transaction-description">${transaction.description || 'No description'}</div>
                <div class="transaction-date">${transactionDate}</div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountSign}$${transaction.amount.toFixed(2)}
            </div>
        </div>
        <div class="transaction-status">
            Status: <span class="status-${transaction.status}">${transaction.status}</span>
        </div>
    `;
    
    return transactionItem;
}

function processTopUp(userId) {
    const amountInput = document.getElementById('topup-amount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const db = firebase.firestore();
    const batch = db.batch();
    
    // Get wallet reference
    const walletRef = db.collection('wallets').doc(userId);
    
    // Create transaction reference
    const transactionRef = db.collection('transactions').doc();
    
    db.runTransaction((transaction) => {
        return transaction.get(walletRef).then((walletDoc) => {
            if (!walletDoc.exists) {
                throw new Error('Wallet does not exist');
            }
            
            const currentBalance = walletDoc.data().balance || 0;
            const newBalance = currentBalance + amount;
            
            // Update wallet balance
            transaction.update(walletRef, {
                balance: newBalance,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Add transaction record
            transaction.set(transactionRef, {
                userId: userId,
                type: 'topup',
                amount: amount,
                description: `Wallet top-up of $${amount.toFixed(2)}`,
                status: 'completed',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return newBalance;
        });
    })
    .then((newBalance) => {
        alert(`Successfully added $${amount.toFixed(2)} to your wallet!`);
        updateBalanceDisplay(newBalance);
        document.getElementById('topup-form').reset();
        loadWalletData(userId); // Reload transactions
    })
    .catch((error) => {
        console.error('Transaction failed: ', error);
        alert('Error processing top-up. Please try again.');
    });
}

// Function to process payment when employer accepts a candidate
function processPayment(employerId, candidateId, amount, jobTitle, entityId, entityType) {
    const db = firebase.firestore();
    
    return db.runTransaction((transaction) => {
        // References to employer and candidate wallets
        const employerWalletRef = db.collection('wallets').doc(employerId);
        const candidateWalletRef = db.collection('wallets').doc(candidateId);
        
        // References for transaction records
        const employerTransactionRef = db.collection('transactions').doc();
        const candidateTransactionRef = db.collection('transactions').doc();
        
        return transaction.get(employerWalletRef).then((employerWalletDoc) => {
            if (!employerWalletDoc.exists) {
                throw new Error('Employer wallet does not exist');
            }
            
            const employerBalance = employerWalletDoc.data().balance || 0;
            
            // Check if employer has sufficient balance
            if (employerBalance < amount) {
                throw new Error('Insufficient balance');
            }
            
            // Get candidate wallet (create if doesn't exist)
            return transaction.get(candidateWalletRef).then((candidateWalletDoc) => {
                const candidateBalance = candidateWalletDoc.exists ? (candidateWalletDoc.data().balance || 0) : 0;
                
                // Update employer wallet (deduct amount)
                transaction.update(employerWalletRef, {
                    balance: employerBalance - amount,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Update candidate wallet (add amount)
                if (candidateWalletDoc.exists) {
                    transaction.update(candidateWalletRef, {
                        balance: candidateBalance + amount,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    transaction.set(candidateWalletRef, {
                        balance: amount,
                        currency: 'USD',
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                // Create employer transaction record (debit)
                transaction.set(employerTransactionRef, {
                    userId: employerId,
                    type: 'payment',
                    amount: amount,
                    description: `Payment for ${entityType}: ${jobTitle}`,
                    status: 'completed',
                    relatedEntity: entityId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Create candidate transaction record (credit)
                transaction.set(candidateTransactionRef, {
                    userId: candidateId,
                    type: 'payment',
                    amount: amount,
                    description: `Payment received for ${entityType}: ${jobTitle}`,
                    status: 'completed',
                    relatedEntity: entityId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return true;
            });
        });
    })
    .then(() => {
        console.log('Payment processed successfully');
        return true;
    })
    .catch((error) => {
        console.error('Payment processing failed: ', error);
        throw error;
    });
}

// Make function available globally for other modules


// Function to update wallet display from other modules
function updateWalletDisplay() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            loadWalletData(user.uid);
        }
    });
}

// Add this to your wallet.js file - makes it compatible with employer main.js

function initEmployerWalletSection(user, employerData) {
    console.log('💰 Initializing employer wallet section (from wallet.js)');
    
    // Load wallet data immediately
    loadWalletData(user.uid);
    
    // Set up top-up listener
    setupTopUpListener(user.uid);
}

// Add this after your existing functions
function setupSendMoneyListener(userId) {
    const sendMoneyForm = document.getElementById('send-money-form');
    if (!sendMoneyForm) {
        console.error('❌ Send money form not found');
        return;
    }

    sendMoneyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        processSendMoney(userId);
    });
}

function processSendMoney(employerId) {
    const recipientEmail = document.getElementById('recipient-email').value;
    const amount = parseFloat(document.getElementById('send-amount').value);
    const description = document.getElementById('send-description').value || 'Payment from employer';

    if (!recipientEmail || !amount || amount <= 0) {
        alert('Please fill in all fields with valid values');
        return;
    }

    if (amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
    }

    console.log('💰 Processing send money:', { recipientEmail, amount, description });

    // Show loading state
    const submitBtn = document.querySelector('#send-money-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    const db = firebase.firestore();

    // First, find the member by email
    db.collection('users')
        .where('email', '==', recipientEmail)
        .where('role', '==', 'member')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                throw new Error('No member found with this email address');
            }

            const memberDoc = querySnapshot.docs[0];
            const memberId = memberDoc.id;
            const memberData = memberDoc.data();

            console.log('✅ Member found:', memberData.name || memberData.email);

            // Process the payment
            return processPaymentToMember(employerId, memberId, amount, description, memberData);
        })
        .then(() => {
            alert(`Successfully sent $${amount.toFixed(2)} to ${recipientEmail}!`);
            document.getElementById('send-money-form').reset();
            loadWalletData(employerId); // Reload wallet data
        })
        .catch((error) => {
            console.error('❌ Error sending money:', error);
            alert(`Error: ${error.message}`);
        })
        .finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

function processPaymentToMember(employerId, memberId, amount, description, memberData) {
    const db = firebase.firestore();

    return db.runTransaction((transaction) => {
        // References to wallets
        const employerWalletRef = db.collection('wallets').doc(employerId);
        const memberWalletRef = db.collection('wallets').doc(memberId);

        // References for transaction records
        const employerTransactionRef = db.collection('transactions').doc();
        const memberTransactionRef = db.collection('transactions').doc();

        return transaction.get(employerWalletRef).then((employerWalletDoc) => {
            if (!employerWalletDoc.exists) {
                throw new Error('Your wallet does not exist');
            }

            const employerBalance = employerWalletDoc.data().balance || 0;

            // Check if employer has sufficient balance
            if (employerBalance < amount) {
                throw new Error(`Insufficient balance. You have $${employerBalance.toFixed(2)} but trying to send $${amount.toFixed(2)}`);
            }

            // Get member wallet (create if doesn't exist)
            return transaction.get(memberWalletRef).then((memberWalletDoc) => {
                const memberBalance = memberWalletDoc.exists ? (memberWalletDoc.data().balance || 0) : 0;

                // Update employer wallet (deduct amount)
                transaction.update(employerWalletRef, {
                    balance: employerBalance - amount,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Update member wallet (add amount)
                if (memberWalletDoc.exists) {
                    transaction.update(memberWalletRef, {
                        balance: memberBalance + amount,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    transaction.set(memberWalletRef, {
                        balance: amount,
                        currency: 'USD',
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }

                // Create employer transaction record (debit)
                transaction.set(employerTransactionRef, {
                    userId: employerId,
                    type: 'payment_sent',
                    amount: amount,
                    description: `Payment to ${memberData.name || memberData.email}: ${description}`,
                    status: 'completed',
                    recipientId: memberId,
                    recipientEmail: memberData.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Create member transaction record (credit)
                transaction.set(memberTransactionRef, {
                    userId: memberId,
                    type: 'payment_received',
                    amount: amount,
                    description: `Payment from employer: ${description}`,
                    status: 'completed',
                    senderId: employerId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                return true;
            });
        });
    });
}

// Update the init function to include send money listener
function initEmployerWalletSection(user, employerData) {
    console.log('💰 Initializing employer wallet section (from wallet.js)');
    
    // Load wallet data immediately
    loadWalletData(user.uid);
    
    // Set up both listeners
    setupTopUpListener(user.uid);
    setupSendMoneyListener(user.uid);
}
// Make sure it's available globally
window.initEmployerWalletSection = initEmployerWalletSection;
window.loadWalletData = loadWalletData;
window.processTopUp = processTopUp;
window.processPayment = processPayment;
window.processSendMoney = processSendMoney;