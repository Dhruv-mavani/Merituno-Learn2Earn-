// users/admin-wallet.js

// Initialize wallet overview
function initWalletOverview() {
    // Load wallet statistics
    loadWalletStatistics();
    
    // Load transaction logs
    loadTransactionLogs();
    
    // Set up event listeners
    setupWalletEventListeners();
}

// Load wallet statistics
function loadWalletStatistics() {
    // Show loading state
    document.getElementById('total-system-money').textContent = 'Loading...';
    document.getElementById('total-employer-spends').textContent = 'Loading...';
    document.getElementById('total-candidate-earnings').textContent = 'Loading...';
    
    // Get references to users collections
    const candidatesRef = firebase.firestore().collection('candidates');
    const employersRef = firebase.firestore().collection('employers');
    
    // Fetch all candidates and employers to calculate totals
    Promise.all([
        candidatesRef.get(),
        employersRef.get()
    ]).then(([candidatesSnapshot, employersSnapshot]) => {
        let totalSystemMoney = 0;
        let totalCandidateEarnings = 0;
        let totalEmployerSpends = 0;
        
        // Process candidates
        candidatesSnapshot.forEach(doc => {
            const candidateData = doc.data();
            const walletBalance = candidateData.walletBalance || 0;
            totalSystemMoney += walletBalance;
            totalCandidateEarnings += walletBalance;
        });
        
        // Process employers
        employersSnapshot.forEach(doc => {
            const employerData = doc.data();
            const walletBalance = employerData.walletBalance || 0;
            totalSystemMoney += walletBalance;
            // For employers, we consider their wallet balance as money they haven't spent yet
            // So their total spends would be their total deposits minus current balance
            const totalDeposits = employerData.totalDeposits || 0;
            totalEmployerSpends += (totalDeposits - walletBalance);
        });
        
        // Update UI with formatted currency
        document.getElementById('total-system-money').textContent = formatCurrency(totalSystemMoney);
        document.getElementById('total-employer-spends').textContent = formatCurrency(totalEmployerSpends);
        document.getElementById('total-candidate-earnings').textContent = formatCurrency(totalCandidateEarnings);
    }).catch(error => {
        console.error('Error loading wallet statistics:', error);
        document.getElementById('total-system-money').textContent = 'Error';
        document.getElementById('total-employer-spends').textContent = 'Error';
        document.getElementById('total-candidate-earnings').textContent = 'Error';
    });
}

// Load transaction logs
function loadTransactionLogs() {
    const transactionsContainer = document.getElementById('transactions-container');
    if (!transactionsContainer) return;
    
    // Show loading state
    transactionsContainer.innerHTML = '<div class="loading">Loading transactions...</div>';
    
    // Get reference to transactions collection
    const transactionsRef = firebase.firestore().collection('transactions');
    
    // Fetch all transactions, ordered by date (newest first)
    transactionsRef.orderBy('timestamp', 'desc').limit(50).get().then(transactionsSnapshot => {
        // Clear loading state
        transactionsContainer.innerHTML = '';
        
        if (transactionsSnapshot.empty) {
            transactionsContainer.innerHTML = '<div class="no-data">No transactions found.</div>';
            return;
        }
        
        // Process each transaction
        transactionsSnapshot.forEach(doc => {
            const transactionData = doc.data();
            addTransactionToList({
                id: doc.id,
                ...transactionData
            });
        });
    }).catch(error => {
        console.error('Error fetching transactions:', error);
        transactionsContainer.innerHTML = '<div class="error">Error loading transactions. Please try again.</div>';
    });
}

// Add a transaction to the list
function addTransactionToList(transaction) {
    const transactionsContainer = document.getElementById('transactions-container');
    if (!transactionsContainer) return;
    
    const transactionRow = document.createElement('tr');
    transactionRow.className = `transaction-row ${transaction.type}`;
    
    // Format timestamp
    const timestamp = transaction.timestamp ? transaction.timestamp.toDate() : new Date();
    const formattedDate = formatTransactionDate(timestamp);
    
    transactionRow.innerHTML = `
        <td>${formattedDate}</td>
        <td>${transaction.userId || 'N/A'}</td>
        <td>${transaction.userType || 'N/A'}</td>
        <td>${transaction.type ? transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) : 'N/A'}</td>
        <td class="amount ${transaction.type === 'credit' ? 'credit' : 'debit'}">
            ${transaction.type === 'credit' ? '+' : '-'}${formatCurrency(transaction.amount || 0)}
        </td>
        <td>${transaction.description || 'No description'}</td>
        <td>${transaction.adminId ? 'Admin Adjustment' : (transaction.processedBy || 'System')}</td>
    `;
    
    transactionsContainer.appendChild(transactionRow);
}

// Format date for transaction display
function formatTransactionDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Set up event listeners for wallet management
function setupWalletEventListeners() {
    // Adjust balance form submission
    const adjustBalanceForm = document.getElementById('adjust-balance-form');
    if (adjustBalanceForm) {
        adjustBalanceForm.addEventListener('submit', handleAdjustBalance);
    }
    
    // User type change event
    const userTypeSelect = document.getElementById('user-type');
    if (userTypeSelect) {
        userTypeSelect.addEventListener('change', handleUserTypeChange);
    }
    
    // Refresh transactions button
    const refreshTransactionsBtn = document.getElementById('refresh-transactions');
    if (refreshTransactionsBtn) {
        refreshTransactionsBtn.addEventListener('click', loadTransactionLogs);
    }
    
    // Refresh stats button
    const refreshStatsBtn = document.getElementById('refresh-stats');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', loadWalletStatistics);
    }
}

// Handle user type change
function handleUserTypeChange() {
    const userType = document.getElementById('user-type').value;
    const userIdInput = document.getElementById('user-id');
    
    // Clear user ID when type changes
    userIdInput.value = '';
}

// Handle adjust balance form submission
function handleAdjustBalance(event) {
    event.preventDefault();
    
    const userType = document.getElementById('user-type').value;
    const userId = document.getElementById('user-id').value.trim();
    const adjustmentType = document.getElementById('adjustment-type').value;
    const amount = parseFloat(document.getElementById('adjustment-amount').value);
    const description = document.getElementById('adjustment-description').value.trim();
    
    // Validate inputs
    if (!userType || !userId) {
        alert('Please select user type and enter user ID.');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0.');
        return;
    }
    
    if (!description) {
        alert('Please provide a description for this adjustment.');
        return;
    }
    
    // Determine the collection based on user type
    const userCollection = userType === 'candidate' ? 'candidates' : 'employers';
    
    // Get user document
    const userRef = firebase.firestore().collection(userCollection).doc(userId);
    
    userRef.get().then(doc => {
        if (!doc.exists) {
            alert('User not found. Please check the user ID.');
            return;
        }
        
        const userData = doc.data();
        const currentBalance = userData.walletBalance || 0;
        let newBalance;
        
        // Calculate new balance based on adjustment type
        if (adjustmentType === 'add') {
            newBalance = currentBalance + amount;
        } else {
            newBalance = currentBalance - amount;
            
            // Check if balance would go negative
            if (newBalance < 0) {
                if (!confirm('This adjustment will result in a negative balance. Continue?')) {
                    return;
                }
            }
        }
        
        // Update user balance
        const updateData = {
            walletBalance: newBalance,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // For employers, also update total deposits if adding funds
        if (userType === 'employer' && adjustmentType === 'add') {
            updateData.totalDeposits = (userData.totalDeposits || 0) + amount;
        }
        
        // For candidates, update total earnings if adding funds
        if (userType === 'candidate' && adjustmentType === 'add') {
            updateData.totalEarnings = (userData.totalEarnings || 0) + amount;
        }
        
        userRef.update(updateData)
            .then(() => {
                // Create transaction record
                createTransactionRecord(
                    userId,
                    userType,
                    adjustmentType,
                    amount,
                    description
                );
                
                alert('Balance adjusted successfully!');
                document.getElementById('adjust-balance-form').reset();
            })
            .catch(error => {
                console.error('Error updating balance:', error);
                alert('Error adjusting balance. Please try again.');
            });
    }).catch(error => {
        console.error('Error fetching user:', error);
        alert('Error finding user. Please check the user ID and try again.');
    });
}

// Create transaction record
function createTransactionRecord(userId, userType, type, amount, description) {
    const transactionsRef = firebase.firestore().collection('transactions');
    const adminId = firebase.auth().currentUser.uid;
    
    const transactionData = {
        userId,
        userType,
        type,
        amount,
        description,
        adminId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        processedBy: `Admin: ${adminId}`
    };
    
    transactionsRef.add(transactionData)
        .then(() => {
            // Refresh transactions list and statistics
            loadTransactionLogs();
            loadWalletStatistics();
        })
        .catch(error => {
            console.error('Error creating transaction record:', error);
        });
}

// Initialize when the wallet overview section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Watch for when the wallet overview section becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const walletOverviewSection = document.getElementById('wallet-overview');
                if (walletOverviewSection && walletOverviewSection.style.display !== 'none') {
                    initWalletOverview();
                }
            }
        });
    });
    
    // Start observing the wallet overview section
    const walletOverviewSection = document.getElementById('wallet-overview');
    if (walletOverviewSection) {
        observer.observe(walletOverviewSection, { attributes: true });
    }
});