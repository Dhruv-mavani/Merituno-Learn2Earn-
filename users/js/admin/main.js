// users/admin-main.js

console.log('=== ADMIN MAIN.JS LOADED ===');

// Global admin state
let adminState = {
    currentUser: null,
    currentSection: 'dashboard-overview'
};

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Starting Admin Dashboard');
    
    // Force show dashboard and hide modals
    emergencyShowDashboard();
    
    // Initialize the dashboard
    initAdminDashboard();
});

// EMERGENCY FUNCTION: Force show dashboard and make everything clickable
function emergencyShowDashboard() {
    console.log('🔧 Running emergency dashboard setup...');
    
    // Force show dashboard overview
    const dashboardOverview = document.getElementById('dashboard-overview');
    if (dashboardOverview) {
        dashboardOverview.style.display = 'block';
        console.log('✅ Dashboard overview shown');
    }
    
    // Force hide all modals and forms
    const hiddenElements = document.querySelectorAll('.modal, #create-module-form, #edit-module-modal');
    hiddenElements.forEach(el => {
        el.style.display = 'none';
    });
    console.log('✅ All modals hidden');
    
    // Make all buttons and clickable elements visible and clickable
    const clickableElements = document.querySelectorAll('button, .sidebar-nav-item, .profile-toggle, .cta-button, .secondary-button');
    clickableElements.forEach(el => {
        el.style.display = '';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
    });
    console.log('✅ All clickable elements activated');
    
    // Ensure body is scrollable and normal
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.pointerEvents = 'auto';
}

// Initialize the admin dashboard
function initAdminDashboard() {
    console.log('🔐 Initializing admin dashboard...');
    
    // Check authentication state
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log('✅ Admin user signed in:', user.email);
                adminState.currentUser = user;
                
                // User is signed in, display their name
                displayUserName(user);
                
                // Load all counts
                loadDashboardCounts();
                
                // Set up event listeners WITH RETRY
                setTimeout(() => {
                    setupEventListeners();
                }, 100);
                
            } else {
                console.log('❌ No user signed in, redirecting to login...');
                window.location.href = '../login/index.html';
            }
        });
    } else {
        console.log('⚠️ Firebase not loaded, proceeding without auth');
        // Continue without auth for testing
        displayUserName({ displayName: 'Test Admin' });
        loadDashboardCounts();
        setTimeout(() => {
            setupEventListeners();
        }, 100);
    }
}

// Display the user's name
function displayUserName(user) {
    console.log('👤 Displaying user name:', user.displayName);
    
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${user.displayName || 'Admin'}`;
    }
    
    const profileName = document.getElementById('profile-name');
    if (profileName) {
        const displayName = user.displayName || 'Admin User';
        const firstLetter = displayName.charAt(0).toUpperCase();
        profileName.textContent = firstLetter;
    }
    
    // Set up logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚪 Logout clicked');
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signOut().then(() => {
                    window.location.href = '../login/index.html';
                });
            } else {
                alert('Logout clicked (Firebase not available)');
            }
        });
    }
}

// Load all dashboard counts
function loadDashboardCounts() {
    console.log('📊 Loading dashboard counts...');
    
    // Mock data for demonstration
    const mockData = {
        users: 125,
        active: 42,
        candidates: 85,
        employers: 40,
        jobs: 8,
        freelance: 12,
        learning: 15
    };
    
    document.getElementById('user-count').textContent = mockData.users;
    document.getElementById('active-count').textContent = mockData.active;
    document.getElementById('Candidate-count').textContent = mockData.candidates;
    document.getElementById('employer-count').textContent = mockData.employers;
    document.getElementById('sidebar-user-count').textContent = mockData.users;
    document.getElementById('sidebar-job-count').textContent = mockData.jobs;
    document.getElementById('sidebar-freelance-count').textContent = mockData.freelance;
    document.getElementById('sidebar-learning-count').textContent = mockData.learning;
    
    console.log('✅ Dashboard counts loaded');
}

// Set up event listeners - COMPREHENSIVE VERSION
function setupEventListeners() {
    console.log('🎯 Setting up event listeners...');
    
    // Setup sidebar navigation
    setupSidebarNavigation();
    
    // Setup profile dropdown
    setupProfileDropdown();
    
    // Setup all buttons
    setupAllButtons();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup modal close functionality - ADD THIS LINE
    setupModalClose();
    
    console.log('✅ Event listeners setup complete');
}
// Inside users/js/admin/main.js

function setupSidebarNavigation() {
    console.log('📁 Setting up sidebar navigation...');
    
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
    
    sidebarItems.forEach((item, index) => {
        // CRITICAL FIX: The user's original code uses cloning, which is safe for removing old listeners.
        // We ensure the new item gets the listener.
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add new click listener
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const sectionId = this.getAttribute('data-section');
            
            // 1. Show the corresponding content section
            showSection(sectionId);
        });
        
        // Ensure initial active state is handled (run once after setup)
        if (index === 0) {
             setInitialActiveState();
        }
    });
}

// Set initial active state
function setInitialActiveState() {
    const dashboardItem = document.querySelector('.sidebar-nav-item[data-section="dashboard-overview"]');
    const allItems = document.querySelectorAll('.sidebar-nav-item');
    
    // Remove active from all items first
    allItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active to dashboard overview
    if (dashboardItem) {
        dashboardItem.classList.add('active');
        console.log('✅ Set initial active state: dashboard-overview');
    }
}

// Setup profile dropdown
function setupProfileDropdown() {
    console.log('👤 Setting up profile dropdown...');
    
    const profileToggle = document.getElementById('profile-toggle');
    const dropdown = document.getElementById('profile-dropdown');
    
    if (profileToggle && dropdown) {
        profileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📋 Profile toggle clicked');
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.profile-panel')) {
                dropdown.classList.remove('show');
            }
        });
    }
}

// Setup all buttons
function setupAllButtons() {
    console.log('🔘 Setting up all buttons...');
    
    // Refresh buttons
    setupRefreshButton('button[onclick*="fetchAllUsers"]', 'Users', fetchAllUsers);
    setupRefreshButton('button[onclick*="fetchAllJobs"]', 'Jobs', fetchAllJobs);
    setupRefreshButton('button[onclick*="fetchAllFreelanceTasks"]', 'Freelance', fetchAllFreelanceTasks);
    
    // Create module button
    const createModuleBtn = document.querySelector('.cta-button');
    if (createModuleBtn && createModuleBtn.textContent.includes('Create New Module')) {
        createModuleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📝 Create module button clicked');
            document.getElementById('create-module-form').style.display = 'block';
        });
    }
    
    // Hero buttons
    const heroButtons = document.querySelectorAll('.hero-buttons button');
    heroButtons.forEach((btn, index) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🎯 Hero button ${index} clicked:`, this.textContent);
            
            if (this.textContent.includes('View All Users')) {
                showSection('user-management');
            } else if (this.textContent.includes('Manage User Roles')) {
                alert('User role management would open here');
            } else if (this.textContent.includes('System Settings')) {
                alert('System settings would open here');
            }
        });
    });
}

// Setup individual refresh button
function setupRefreshButton(selector, name, handler) {
    const button = document.querySelector(selector);
    if (button) {
        // Replace the button to remove old listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🔄 ${name} refresh clicked`);
            if (typeof handler === 'function') {
                handler();
            }
        });
        
        console.log(`✅ ${name} refresh button setup`);
    }
}

// Setup form handlers
function setupFormHandlers() {
    console.log('📋 Setting up form handlers...');
    
    // Create module form
    const createForm = document.getElementById('create-module-form');
    if (createForm) {
        createForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📦 Create module form submitted');
            alert('Module creation would be processed here');
            this.style.display = 'none';
        });
    }
    
    // Cancel buttons
    const cancelButtons = document.querySelectorAll('.secondary-button');
    cancelButtons.forEach(btn => {
        if (btn.textContent.includes('Cancel')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('❌ Cancel button clicked');
                const form = this.closest('form');
                if (form) form.style.display = 'none';
            });
        }
    });
}

// Show section function
// Inside users/js/admin/main.js

function showSection(sectionId) {
    console.log(`🔄 Showing section: ${sectionId}`);
    
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        adminState.currentSection = sectionId;
        console.log(`✅ Section ${sectionId} displayed`);
        
        // CRITICAL: Update sidebar active state
        updateSidebarActiveState(sectionId);
        
        // Load section data (e.g., fetching users/jobs/modules)
        loadSectionData(sectionId);
    } else {
        console.log(`❌ Section ${sectionId} not found`);
    }
}

// Update sidebar active state
// Inside users/js/admin/main.js

function updateSidebarActiveState(sectionId) {
    const allSidebarItems = document.querySelectorAll('.sidebar-nav-item');
    
    // Remove active from all items
    allSidebarItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active to the correct item
    const targetItem = document.querySelector(`.sidebar-nav-item[data-section="${sectionId}"]`);
    if (targetItem) {
        targetItem.classList.add('active');
        console.log(`✅ Sidebar active state updated to: ${sectionId}`);
    }
}

// Load section data
function loadSectionData(sectionId) {
    console.log(`📂 Loading data for: ${sectionId}`);
    
    switch(sectionId) {
        case 'user-management':
            loadRealUsers();
            break;
        case 'learning-management':
            loadRealModules();
            break;
        case 'job-moderation':
            loadMockJobs();
            break;
        case 'freelance-moderation':
            loadMockFreelanceTasks();
            break;
        case 'wallet-overview':
            loadWalletData();
            break;
    }
}

// ===== REAL DATA FUNCTIONS =====

// Real wallet data functions
function loadWalletData() {
    console.log('💰 Loading REAL wallet data from Firestore...');
    loadRealWalletStats();
    loadRealTransactions();
}

// Real wallet stats from Firestore
function loadRealWalletStats() {
    console.log('💰 Loading REAL wallet stats from Firestore...');
    
    // Show loading state
    document.getElementById('total-system-money').textContent = 'Loading...';
    document.getElementById('total-employer-spends').textContent = 'Loading...';
    document.getElementById('total-candidate-earnings').textContent = 'Loading...';
    
    const db = firebase.firestore();
    
    // Get all candidates and employers to calculate totals
    Promise.all([
        db.collection('candidates').get(),
        db.collection('employers').get()
    ]).then(([candidatesSnapshot, employersSnapshot]) => {
        let totalSystemMoney = 0;
        let totalCandidateEarnings = 0;
        let totalEmployerSpends = 0;
        
        console.log(`📊 Found ${candidatesSnapshot.size} candidates and ${employersSnapshot.size} employers`);
        
        // Process candidates
        candidatesSnapshot.forEach(doc => {
            const candidateData = doc.data();
            const walletBalance = candidateData.walletBalance || 0;
            const totalEarnings = candidateData.totalEarnings || 0;
            
            totalSystemMoney += walletBalance;
            totalCandidateEarnings += totalEarnings;
            
            console.log(`👤 Candidate ${doc.id}: balance=$${walletBalance}, earnings=$${totalEarnings}`);
        });
        
        // Process employers
        employersSnapshot.forEach(doc => {
            const employerData = doc.data();
            const walletBalance = employerData.walletBalance || 0;
            const totalSpends = employerData.totalSpends || 0;
            
            totalSystemMoney += walletBalance;
            totalEmployerSpends += totalSpends;
            
            console.log(`🏢 Employer ${doc.id}: balance=$${walletBalance}, spends=$${totalSpends}`);
        });
        
        // Update the UI with real data
        document.getElementById('total-system-money').textContent = formatCurrency(totalSystemMoney);
        document.getElementById('total-employer-spends').textContent = formatCurrency(totalEmployerSpends);
        document.getElementById('total-candidate-earnings').textContent = formatCurrency(totalCandidateEarnings);
        
        console.log('✅ Real wallet stats loaded:', {
            totalSystemMoney,
            totalEmployerSpends, 
            totalCandidateEarnings
        });
        
    }).catch(error => {
        console.error('❌ Error loading wallet stats:', error);
        loadMockWalletStats();
    });
}

// Load real transactions
function loadRealTransactions() {
    console.log('💰 Loading ONLY real payment transactions...');
    
    const container = document.getElementById('transactions-container');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="7" class="text-center">Loading real payment transactions...</td></tr>';
    
    const db = firebase.firestore();
    
    // ONLY look in your actual transactions collection
    db.collection('transactions')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get()
        .then(snapshot => {
            console.log(`📊 Found ${snapshot.size} transaction documents`);
            
            if (snapshot.empty) {
                container.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            <div style="padding: 40px; color: #666;">
                                <h3>No Transactions Yet</h3>
                                <p>Real transactions will appear here automatically when:</p>
                                <ul style="text-align: left; display: inline-block;">
                                    <li>Employers send money to members</li>
                                    <li>Members withdraw to PayPal</li>
                                    <li>Any wallet transfers occur</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // FILTER OUT any sample/test transactions
            const realTransactions = [];
            
            snapshot.forEach(doc => {
                const transaction = { id: doc.id, ...doc.data() };
                
                // ONLY include real user transactions (no samples)
                if (!transaction.userId?.includes('sample_') && 
                    !transaction.userId?.includes('test_') &&
                    !transaction.description?.includes('sample') &&
                    !transaction.description?.includes('test')) {
                    realTransactions.push(transaction);
                }
            });
            
            console.log(`✅ Displaying ${realTransactions.length} REAL transactions`);
            
            if (realTransactions.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            <div style="padding: 40px;">
                                <h3>No Real Payment Transactions</h3>
                                <p>The database has transactions, but they appear to be test data.</p>
                                <p>Real transactions will appear when real payments occur between employers and members.</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Display ONLY real transactions
            container.innerHTML = '';
            realTransactions.forEach(transaction => {
                addRealTransactionToTable(transaction);
            });
            
        })
        .catch(error => {
            console.error('❌ Error loading transactions:', error);
            container.innerHTML = '<tr><td colspan="7" class="text-center">Error loading transactions</td></tr>';
        });
}

// Add transaction to table
function addRealTransactionToTable(transaction) {
    const container = document.getElementById('transactions-container');
    if (!container) return;
    
    const row = document.createElement('tr');
    
    // TIMESTAMP HANDLING
    let displayDate = 'Date not set';
    
    if (transaction.timestamp) {
        try {
            let date;
            
            if (transaction.timestamp.toDate && typeof transaction.timestamp.toDate === 'function') {
                date = transaction.timestamp.toDate();
            } else if (transaction.timestamp.seconds) {
                date = new Date(transaction.timestamp.seconds * 1000);
            } else {
                date = new Date(transaction.timestamp);
            }
            
            if (date && !isNaN(date.getTime())) {
                displayDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (e) {
            console.warn('Error parsing timestamp:', e);
        }
    }

    // Determine amount and type
    const amount = parseFloat(transaction.amount) || 0;
    let amountClass = 'debit';
    let amountSign = '-';
    let transactionType = transaction.transactionType || transaction.type || 'Payment';

    // Determine if it's credit or debit
    if (transaction.type === 'credit' || 
        transaction.transactionType === 'credit' ||
        transaction.transactionType === 'deposit' ||
        transaction.transactionType === 'earning' ||
        transaction.transactionType === 'payment_received' ||
        amount > 0) {
        amountClass = 'credit';
        amountSign = '+';
    }

    // Get user info
    const userId = transaction.userId || transaction.userID || 'N/A';
    const userType = transaction.userType || 'User';

    // Create the table row
    row.innerHTML = `
        <td class="transaction-date">${displayDate}</td>
        <td class="user-name-cell" data-user-id="${userId}" data-user-type="${userType.toLowerCase()}">
            <div class="user-loading">Loading user...</div>
        </td>
        <td>${userType}</td>
        <td>${transactionType}</td>
        <td class="amount ${amountClass}">${amountSign}${formatCurrency(Math.abs(amount))}</td>
        <td>${transaction.description || transaction.reason || transaction.purpose || 'No description'}</td>
        <td>${transaction.processedBy || transaction.adminId || 'System'}</td>
    `;
    
    container.appendChild(row);
    
    // Load user name/email immediately
    loadUserName(userId, userType.toLowerCase(), row);
}

// Load user name from Firestore
function loadUserName(userId, userType, row) {
    if (!userId || userId === 'N/A') {
        updateUserNameCell(row, 'Unknown User', 'User not found');
        return;
    }
    
    const db = firebase.firestore();
    const collectionName = userType === 'candidate' ? 'candidates' : 'employers';
    
    db.collection(collectionName).doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Try multiple name fields, fallback to email
                const displayName = userData.displayName || 
                                  userData.name || 
                                  userData.fullName || 
                                  userData.companyName || 
                                  userData.username || 
                                  userData.email ||
                                  `User ${userId.substring(0, 8)}`;
                
                // Create tooltip with additional info
                let tooltip = `ID: ${userId}`;
                if (userData.email) tooltip += `\nEmail: ${userData.email}`;
                if (userData.name) tooltip += `\nName: ${userData.name}`;
                
                updateUserNameCell(row, displayName, tooltip);
                
            } else {
                // User not found in Firestore
                updateUserNameCell(row, `User ${userId.substring(0, 8)}`, `ID: ${userId} (Not found in database)`);
            }
        })
        .catch(error => {
            console.warn(`Could not load user ${userId}:`, error);
            updateUserNameCell(row, `User ${userId.substring(0, 8)}`, `ID: ${userId} (Error loading)`);
        });
}

// Helper function to update the user name cell
function updateUserNameCell(row, displayText, tooltip) {
    const nameCell = row.querySelector('.user-name-cell');
    if (nameCell) {
        nameCell.innerHTML = `<span title="${tooltip.replace(/"/g, '&quot;')}" style="cursor: help; border-bottom: 1px dotted #666;">${displayText}</span>`;
    }
}

function loadRealUsers() {
    console.log('👥 Loading REAL users from Firestore...');
    
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('❌ users-table-body not found');
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading users...</td></tr>';
    
    const db = firebase.firestore();
    
    Promise.all([
        db.collection('users').get(),
        db.collection('employers').get(),
        db.collection('candidates').get()
    ]).then(([usersSnapshot, employersSnapshot, candidatesSnapshot]) => {
        
        const allUsers = [];
        
        // Process users from 'users' collection
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            allUsers.push({
                id: doc.id,
                name: userData.username || userData.displayName || 'Unknown',
                email: userData.email || 'No email',
                type: userData.role || 'member',
                userData: userData,
                status: userData.status || 'active',
                collection: 'users'
            });
        });
        
        // Process employers
        employersSnapshot.forEach(doc => {
            const userData = doc.data();
            allUsers.push({
                id: doc.id,
                name: userData.companyName || userData.displayName || 'Unknown Company',
                email: userData.email || 'No email',
                type: 'employer',
                userData: userData,
                status: userData.status || 'active',
                collection: 'employers'
            });
        });
        
        // Process candidates
        candidatesSnapshot.forEach(doc => {
            const userData = doc.data();
            allUsers.push({
                id: doc.id,
                name: userData.name || userData.displayName || 'Unknown Candidate',
                email: userData.email || 'No email',
                type: 'candidate',
                userData: userData,
                status: userData.status || 'active',
                collection: 'candidates'
            });
        });
        
        console.log(`📊 Loaded ${allUsers.length} real users`);
        
        if (allUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
            return;
        }
        
        // Display users in table - COMPLETELY REPLACE THE HTML
        tbody.innerHTML = '';
        
        allUsers.forEach(user => {
            const row = document.createElement('tr');
            
            // FIXED: Case-insensitive status check
            const normalizedStatus = (user.status || 'active').toLowerCase();
            const isActive = normalizedStatus === 'active';
            const statusClass = isActive ? 'active' : 'suspended';
            const statusText = isActive ? 'Active' : 'Suspended';
            
            // CORRECT BUTTON LOGIC:
            const buttonText = isActive ? 'Suspend' : 'Activate';
            const buttonClass = isActive ? 'btn-suspend' : 'btn-activate';
            const buttonFunction = isActive ? 'suspendUser' : 'activateUser';
            
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.type}</td>
                <td>☆☆☆☆☆</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="${buttonClass}" onclick="${buttonFunction}('${user.id}', '${user.collection}')">
                        ${buttonText}
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
    }).catch(error => {
        console.error('❌ Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading users</td></tr>';
    });
}

// Calculate member rating based on real data
function calculateMemberRating(userData) {
    let rating = 3; // Default 3 stars
    
    // Calculate based on available data
    if (userData.skills && userData.skills.length > 0) {
        // More skills = higher rating
        const skillCount = userData.skills.length;
        if (skillCount >= 8) rating = 5;
        else if (skillCount >= 5) rating = 4;
        else if (skillCount >= 3) rating = 3;
        else if (skillCount >= 1) rating = 2;
        else rating = 1;
    }
    
    // Adjust based on earnings (if available)
    if (userData.totalEarnings > 1000) rating = Math.min(5, rating + 1);
    if (userData.totalWithdrawn > 500) rating = Math.min(5, rating + 1);
    
    // Adjust based on completed jobs (if available)
    if (userData.completedJobs > 10) rating = Math.min(5, rating + 1);
    if (userData.completedJobs > 5) rating = Math.min(5, rating + 1);
    
    return rating;
}

//Show useful metrics instead of stars
function getUserMetric(user, userType) {
    console.log('🔍 Getting metric for:', user.name, 'Type:', userType);
    
    if (userType === 'employer') {
        // For employers, show job count or something useful
        // We need to get the actual user data from Firestore
        const db = firebase.firestore();
        
        return db.collection('employers').doc(user.id).get()
            .then(doc => {
                if (doc.exists) {
                    const employerData = doc.data();
                    const jobCount = employerData.postedJobs || employerData.jobsCount || 0;
                    return jobCount > 0 ? `${jobCount} jobs` : 'No jobs';
                } else {
                    return 'No data';
                }
            })
            .catch(error => {
                console.error('Error getting employer data:', error);
                return 'Error';
            });
    } else {
        // For members, show stars based on performance
        const rating = calculateMemberRating(user);
        return Promise.resolve(convertRatingToStars(rating));
    }
}

// Helper function to convert numeric rating to stars
function convertRatingToStars(rating) {
    if (!rating || rating < 1) return '☆☆☆☆☆';
    
    const numRating = parseInt(rating) || 3;
    const fullStars = '★'.repeat(Math.min(5, Math.max(1, numRating)));
    const emptyStars = '☆'.repeat(5 - Math.min(5, Math.max(1, numRating)));
    return fullStars + emptyStars;
}

// Format currency helper function
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// ===== MOCK DATA FUNCTIONS =====

function loadMockModules() {
    console.log('📚 Loading learning modules...');
    const container = document.getElementById('modules-container');
    if (container) {
        container.innerHTML = `
            <div class="module-card">
                <div class="module-header">
                    <h3 class="module-title">JavaScript Basics</h3>
                    <span class="module-level">Level: Beginner</span>
                </div>
                <div class="module-details">
                    <p><strong>Description:</strong> Learn JavaScript fundamentals - variables, functions, and DOM manipulation</p>
                    <p><strong>Skills:</strong> JavaScript, Programming Basics</p>
                    <p><strong>XP Reward:</strong> 100 XP</p>
                    <p><strong>Star Requirement:</strong> ☆☆☆☆☆</p>
                </div>
                <div class="module-actions">
                    <button class="btn-edit-module" onclick="openEditModule('js-basics')">Edit</button>
                    <button class="btn-delete-module" onclick="deleteModule('js-basics')">Delete</button>
                </div>
            </div>
            <div class="module-card">
                <div class="module-header">
                    <h3 class="module-title">React Fundamentals</h3>
                    <span class="module-level">Level: Intermediate</span>
                </div>
                <div class="module-details">
                    <p><strong>Description:</strong> Learn React components, state, and props</p>
                    <p><strong>Skills:</strong> React.js, Frontend Development</p>
                    <p><strong>XP Reward:</strong> 200 XP</p>
                    <p><strong>Star Requirement:</strong> ★☆☆☆☆</p>
                </div>
                <div class="module-actions">
                    <button class="btn-edit-module" onclick="openEditModule('react-fundamentals')">Edit</button>
                    <button class="btn-delete-module" onclick="deleteModule('react-fundamentals')">Delete</button>
                </div>
            </div>
        `;
    }
}

function loadMockJobs() {
    console.log('💼 Loading mock jobs...');
    const container = document.getElementById('jobs-container');
    if (container) {
        container.innerHTML = `
            <div class="job-card">
                <div class="job-header">
                    <h3 class="job-title">Frontend Developer</h3>
                    <span class="job-status pending">Pending</span>
                </div>
                <div class="job-details">
                    <p><strong>Company:</strong> Tech Corp</p>
                </div>
                <div class="job-actions">
                    <button class="btn-approve" onclick="alert('Approve job')">Approve</button>
                    <button class="btn-delete" onclick="alert('Delete job')">Delete</button>
                </div>
            </div>
        `;
    }
}

function loadMockFreelanceTasks() {
    console.log('🔧 Loading mock freelance tasks...');
    const container = document.getElementById('freelance-container');
    if (container) {
        container.innerHTML = `
            <div class="freelance-card">
                <div class="freelance-header">
                    <h3 class="freelance-title">Website Design</h3>
                    <span class="freelance-status pending">Pending</span>
                </div>
                <div class="freelance-details">
                    <p><strong>Budget:</strong> $500</p>
                </div>
                <div class="freelance-actions">
                    <button class="btn-freelance-approve" onclick="alert('Approve task')">Approve</button>
                    <button class="btn-freelance-delete" onclick="alert('Delete task')">Delete</button>
                </div>
            </div>
        `;
    }
}

function loadMockWalletStats() {
    console.log('💰 Loading mock wallet stats...');
    
    // Update the main stats cards
    document.getElementById('total-system-money').textContent = '$15,250.00';
    document.getElementById('total-employer-spends').textContent = '$8,450.00';
    document.getElementById('total-candidate-earnings').textContent = '$6,800.00';
    
    console.log('✅ Wallet stats loaded');
}

function loadMockTransactions() {
    console.log('📊 Loading mock transactions...');
    const container = document.getElementById('transactions-container');
    if (container) {
        container.innerHTML = `
            <tr>
                <td>${new Date().toLocaleDateString()}</td>
                <td>user_001</td>
                <td>Candidate</td>
                <td>Job Payment</td>
                <td class="amount credit">+$250.00</td>
                <td>Completed website project</td>
                <td>System</td>
            </tr>
            <tr>
                <td>${new Date().toLocaleDateString()}</td>
                <td>employer_005</td>
                <td>Employer</td>
                <td>Deposit</td>
                <td class="amount debit">-$500.00</td>
                <td>Added funds to wallet</td>
                <td>Admin Adjustment</td>
            </tr>
            <tr>
                <td>${new Date().toLocaleDateString()}</td>
                <td>user_003</td>
                <td>Candidate</td>
                <td>Freelance Payment</td>
                <td class="amount credit">+$150.00</td>
                <td>Logo design project</td>
                <td>System</td>
            </tr>
        `;
    }
    console.log('✅ Transactions loaded');
}

// ===== USER MANAGEMENT FUNCTIONS =====

window.suspendUser = function(userId, collection) {
    console.log('⏸️ Suspending user:', userId, collection);
    
    const db = firebase.firestore();
    const userRef = db.collection(collection).doc(userId);
    
    if (confirm('Are you sure you want to suspend this user?')) {
        userRef.update({
            status: 'suspended',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('✅ User suspended');
            loadRealUsers(); // Refresh the list
        }).catch(error => {
            console.error('❌ Error suspending user:', error);
            alert('Error suspending user: ' + error.message);
        });
    }
};

window.activateUser = function(userId, collection) {
    console.log('▶️ Activating user:', userId, collection);
    
    const db = firebase.firestore();
    const userRef = db.collection(collection).doc(userId);
    
    if (confirm('Are you sure you want to activate this user?')) {
        userRef.update({
            status: 'active',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('✅ User activated');
            loadRealUsers(); // Refresh the list
        }).catch(error => {
            console.error('❌ Error activating user:', error);
            alert('Error activating user: ' + error.message);
        });
    }
};

// Job moderation functions
window.approveJob = function(jobId) {
    console.log('✅ Approve job:', jobId);
    if (confirm('Approve this job posting?')) {
        alert(`Job ${jobId} would be approved in Firestore.`);
        // Refresh job list
        if (typeof fetchAllJobs === 'function') {
            fetchAllJobs();
        }
    }
};

window.rejectJob = function(jobId) {
    console.log('❌ Reject job:', jobId);
    const reason = prompt('Please enter reason for rejection:');
    if (reason) {
        alert(`Job ${jobId} would be rejected with reason: ${reason}`);
        // Refresh job list
        if (typeof fetchAllJobs === 'function') {
            fetchAllJobs();
        }
    }
};

window.deleteJob = function(jobId) {
    console.log('🗑️ Delete job:', jobId);
    if (confirm('Permanently delete this job?')) {
        alert(`Job ${jobId} would be deleted from Firestore.`);
        // Refresh job list
        if (typeof fetchAllJobs === 'function') {
            fetchAllJobs();
        }
    }
};

// Freelance moderation functions
window.approveFreelanceTask = function(taskId) {
    console.log('✅ Approve freelance task:', taskId);
    if (confirm('Approve this freelance task?')) {
        alert(`Freelance task ${taskId} would be approved in Firestore.`);
        // Refresh task list
        if (typeof fetchAllFreelanceTasks === 'function') {
            fetchAllFreelanceTasks();
        }
    }
};

window.rejectFreelanceTask = function(taskId) {
    console.log('❌ Reject freelance task:', taskId);
    const reason = prompt('Please enter reason for rejection:');
    if (reason) {
        alert(`Freelance task ${taskId} would be rejected with reason: ${reason}`);
        // Refresh task list
        if (typeof fetchAllFreelanceTasks === 'function') {
            fetchAllFreelanceTasks();
        }
    }
};

window.deleteFreelanceTask = function(taskId) {
    console.log('🗑️ Delete freelance task:', taskId);
    if (confirm('Permanently delete this freelance task?')) {
        alert(`Freelance task ${taskId} would be deleted from Firestore.`);
        // Refresh task list
        if (typeof fetchAllFreelanceTasks === 'function') {
            fetchAllFreelanceTasks();
        }
    }
};

// Search functionality
window.searchUsers = function() {
    console.log('🔍 Search users');
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    alert(`Would search users for: ${searchTerm}`);
};

// ===== GLOBAL FUNCTIONS =====

// Global functions
window.fetchAllUsers = loadRealUsers;
window.fetchAllJobs = loadMockJobs;
window.fetchAllFreelanceTasks = loadMockFreelanceTasks;
window.fetchAllModules = loadRealModules;

// Wallet refresh functions
window.loadWalletStats = loadRealWalletStats;
window.loadTransactions = loadRealTransactions;

// Test function
window.testAdminDashboard = function() {
    console.log('=== 🧪 ADMIN DASHBOARD TEST ===');
    console.log('Current section:', adminState.currentSection);
    console.log('Sidebar items:', document.querySelectorAll('.sidebar-nav-item').length);
    console.log('All buttons:', document.querySelectorAll('button').length);
    
    // Test click on first sidebar item
    const firstItem = document.querySelector('.sidebar-nav-item');
    if (firstItem) {
        console.log('Testing click on:', firstItem.getAttribute('data-section'));
        firstItem.click();
    }
    
    alert('🧪 Test complete! Check console for details.');
};

// ===== GLOBAL FUNCTIONS FOR HTML ONCLICK ATTRIBUTES =====

// Functions for the hero buttons
window.manageRoles = function() {
    console.log('👥 Manage roles clicked');
    alert('User role management feature would open here');
};

window.systemSettings = function() {
    console.log('⚙️ System settings clicked');
    alert('System settings feature would open here');
};

window.viewUsers = function() {
    console.log('👤 View users clicked');
    showSection('user-management');
};

// Learning management functions
window.openCreateModule = function() {
    console.log('📝 Open create module form');
    document.getElementById('create-module-form').style.display = 'block';
};

window.closeCreateModule = function() {
    console.log('❌ Close create module form');
    document.getElementById('create-module-form').style.display = 'none';
};

window.openEditModule = function(moduleId) {
    console.log('✏️ Open edit module:', moduleId);
    
    const modal = document.getElementById('edit-module-modal');
    if (!modal) {
        console.error('❌ Edit modal not found');
        return;
    }
    
    // Reset and show the modal
    modal.style.display = 'flex';
    
    // Load module data into the form
    loadModuleDataForEdit(moduleId);
};

// Function to load module data into edit form
function loadModuleDataForEdit(moduleId) {
    console.log('📦 Loading module data for editing:', moduleId);
    
    const db = firebase.firestore();
    db.collection('learning_modules').doc(moduleId).get()
        .then(doc => {
            if (doc.exists) {
                const module = doc.data();
                
                // Fill the form with module data
                document.getElementById('edit-module-title').value = module.title || '';
                document.getElementById('edit-module-description').value = module.description || '';
                document.getElementById('edit-module-skills').value = module.skills ? module.skills.join(', ') : '';
                document.getElementById('edit-module-star-level').value = module.starLevelRequired || 1;
                document.getElementById('edit-module-xp-reward').value = module.xpReward || 100;
                
                // Load videos and questions
                loadEditVideos(module.videos || []);
                loadEditQuestions(module.quizQuestions || []);
                
            } else {
                alert('Module not found!');
                closeEditModal();
            }
        })
        .catch(error => {
            console.error('Error loading module:', error);
            alert('Error loading module data');
            closeEditModal();
        });
}

window.closeEditModal = function() {
    console.log('❌ Close edit modal');
    document.getElementById('edit-module-modal').style.display = 'none';
};

window.deleteModule = function(moduleId) {
    console.log('🗑️ Delete module:', moduleId);
    if (confirm('Are you sure you want to delete this module?')) {
        alert(`Module ${moduleId} would be deleted here.`);
    }
};

// Video and quiz management
window.addVideoLink = function() {
    console.log('🎥 Add video link');
    const container = document.getElementById('video-links-container');
    const div = document.createElement('div');
    div.className = 'video-link-container';
    div.innerHTML = `
        <input type="url" placeholder="YouTube URL">
        <button type="button" class="remove-video-link" onclick="this.parentElement.remove()">Remove</button>
    `;
    container.appendChild(div);
};

window.addQuizQuestion = function() {
    console.log ('❓ Add quiz question');
    const container = document.getElementById('quiz-questions-container');
    const div = document.createElement('div');
    div.className = 'quiz-question-container';
    div.innerHTML = `
        <input type="text" placeholder="Question">
        <input type="text" placeholder="Correct answer">
        <button type="button" class="remove-quiz-question" onclick="this.parentElement.remove()">Remove</button>
    `;
    container.appendChild(div);
};

// Form submissions
window.handleCreateModule = function(event) {
    event.preventDefault();
    console.log('📦 Handle create module form submission');
    
    const title = document.getElementById('module-title').value;
    const description = document.getElementById('module-description').value;
    
    if (!title || !description) {
        alert('Please fill in title and description');
        return;
    }
    
    alert(`Module "${title}" would be created here with Firestore.`);
    document.getElementById('create-module-form').style.display = 'none';
    event.target.reset();
};

window.handleEditModule = function(event) {
    event.preventDefault();
    console.log('📝 Handle edit module form submission');
    alert('Module would be updated here with Firestore.');
    document.getElementById('edit-module-modal').style.display = 'none';
};

// Wallet functions
window.handleAdjustBalance = function(event) {
    event.preventDefault();
    console.log('💰 Handle REAL adjust balance form submission');
    
    const userType = document.getElementById('user-type').value;
    const userId = document.getElementById('user-id').value.trim();
    const adjustmentType = document.getElementById('adjustment-type').value;
    const amount = parseFloat(document.getElementById('adjustment-amount').value);
    const description = document.getElementById('adjustment-description').value.trim();
    
    if (!userType || !userId || !amount || !description) {
        alert('Please fill in all fields');
        return;
    }
    
    if (amount <= 0) {
        alert('Please enter a positive amount');
        return;
    }
    
    const db = firebase.firestore();
    const collectionName = userType === 'candidate' ? 'candidates' : 'employers';
    
    console.log(`🔄 Adjusting balance for ${userType} ${userId}: ${adjustmentType} $${amount}`);
    
    // Get user document
    db.collection(collectionName).doc(userId).get()
        .then(doc => {
            if (!doc.exists) {
                alert('User not found. Please check the user ID.');
                throw new Error('User not found');
            }
            
            const userData = doc.data();
            const currentBalance = userData.walletBalance || 0;
            let newBalance;
            
            // Calculate new balance
            if (adjustmentType === 'add') {
                newBalance = currentBalance + amount;
            } else {
                newBalance = currentBalance - amount;
                if (newBalance < 0 && !confirm('This will result in a negative balance. Continue?')) {
                    throw new Error('User cancelled negative balance');
                }
            }
            
            // Update user balance
            const updateData = {
                walletBalance: newBalance,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Update total earnings/spends
            if (userType === 'candidate' && adjustmentType === 'add') {
                updateData.totalEarnings = (userData.totalEarnings || 0) + amount;
            } else if (userType === 'employer' && adjustmentType === 'add') {
                updateData.totalSpends = (userData.totalSpends || 0) + amount;
            }
            
            console.log(`📝 Updating ${userType} ${userId} balance: $${currentBalance} → $${newBalance}`);
            return db.collection(collectionName).doc(userId).update(updateData);
        })
        .then(() => {
            // Create transaction record
            const transactionData = {
                userId: userId,
                userType: userType,
                type: adjustmentType,
                amount: amount,
                description: `Admin adjustment: ${description}`,
                adminId: firebase.auth().currentUser.uid,
                processedBy: `Admin: ${firebase.auth().currentUser.displayName || firebase.auth().currentUser.uid}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            console.log('📋 Creating transaction record');
            return db.collection('transactions').add(transactionData);
        })
        .then(() => {
            alert('✅ Balance adjusted successfully!');
            event.target.reset();
            
            // Refresh wallet data
            setTimeout(() => {
                loadRealWalletStats();
                loadRealTransactions();
            }, 1000);
        })
        .catch(error => {
            console.error('❌ Error adjusting balance:', error);
            if (error.message !== 'User cancelled negative balance') {
                alert('Error adjusting balance: ' + error.message);
            }
        });
};

// Modal functions

window.closeEditModal = function() {
    console.log('❌ Closing edit modal');
    const modal = document.getElementById('edit-module-modal');
    if (modal) {
        modal.style.display = 'none';
        // Reset the form
        document.getElementById('edit-module-form').reset();
    }
};

// Force close all modals
window.forceCloseAllModals = function() {
    console.log('🚫 Force closing all modals');
    document.querySelectorAll('.modal, #create-module-form, #edit-module-modal').forEach(modal => {
        modal.style.display = 'none';
    });
};

// Set up modal close functionality
function setupModalClose() {
    console.log('🔧 Setting up modal close functionality');
    
    // Close modal when clicking X button
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        // Remove any existing listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Close button clicked');
            closeEditModal();
        });
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            console.log('🖱️ Clicked outside modal - closing');
            e.target.style.display = 'none';
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            console.log('⌨️ Escape key pressed - closing modals');
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}
window.forceCloseAllModals = function() {
    console.log('🚫 Force close all modals');
    document.querySelectorAll('.modal, #create-module-form').forEach(modal => {
        modal.style.display = 'none';
    });
};

// Debug function to see transaction data
window.debugTransactionData = function() {
    console.log('🔍 DEBUG: Checking transaction data structure...');
    
    const db = firebase.firestore();
    
    db.collection('transactions').limit(3).get()
        .then(snapshot => {
            console.log(`📋 Found ${snapshot.size} transactions in 'transactions' collection:`);
            
            if (snapshot.empty) {
                console.log('❌ No transactions found in "transactions" collection');
                return;
            }
            
            snapshot.forEach((doc, index) => {
                const data = doc.data();
                console.log(`\n--- Transaction ${index + 1} (${doc.id}) ---`);
                console.log('Full data:', data);
                console.log('Timestamp:', data.timestamp);
                console.log('Timestamp type:', typeof data.timestamp);
                
                if (data.timestamp) {
                    console.log('Timestamp properties:', Object.keys(data.timestamp));
                    
                    // Try to parse it
                    if (data.timestamp.toDate) {
                        console.log('✅ Has toDate() method');
                        try {
                            const date = data.timestamp.toDate();
                            console.log('✅ Converted to Date:', date);
                            console.log('✅ Formatted:', date.toLocaleString());
                        } catch (e) {
                            console.log('❌ Error calling toDate():', e);
                        }
                    }
                    
                    if (data.timestamp.seconds) {
                        console.log('✅ Has seconds property:', data.timestamp.seconds);
                        try {
                            const date = new Date(data.timestamp.seconds * 1000);
                            console.log('✅ Converted from seconds:', date);
                            console.log('✅ Formatted:', date.toLocaleString());
                        } catch (e) {
                            console.log('❌ Error converting from seconds:', e);
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.log('❌ Error accessing transactions collection:', error);
        });
};

// Test function to verify all functions are available
window.testAllFunctions = function() {
    console.log('=== 🧪 TESTING ALL FUNCTIONS ===');
    
    const functionsToTest = [
        'manageRoles', 'systemSettings', 'viewUsers',
        'openCreateModule', 'closeCreateModule', 'openEditModule',
        'closeEditModal', 'deleteModule', 'addVideoLink', 'addQuizQuestion',
        'handleCreateModule', 'handleEditModule', 'handleAdjustBalance',
        'suspendUser', 'activateUser', 'approveJob', 'rejectJob', 'deleteJob',
        'approveFreelanceTask', 'rejectFreelanceTask', 'deleteFreelanceTask',
        'searchUsers', 'fetchAllUsers', 'fetchAllJobs', 'fetchAllFreelanceTasks',
        'fetchAllModules', 'loadWalletStats', 'loadTransactions', 'forceCloseAllModals'
    ];
    
    let missingFunctions = [];
    
    functionsToTest.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            missingFunctions.push(funcName);
        }
    });
    
    if (missingFunctions.length === 0) {
        console.log('✅ ALL FUNCTIONS ARE AVAILABLE!');
        alert('🎉 All functions are properly defined! The admin dashboard should work now.');
    } else {
        console.log('❌ Missing functions:', missingFunctions);
        alert(`Missing ${missingFunctions.length} functions: ${missingFunctions.join(', ')}`);
    }
};

// Real module creation function
window.handleCreateModule = function(event) {
    event.preventDefault();
    console.log('📦 Creating new learning module...');
    
    const title = document.getElementById('module-title').value;
    const description = document.getElementById('module-description').value;
    const skills = document.getElementById('module-skills').value;
    const starLevel = document.getElementById('module-star-level').value;
    const xpReward = document.getElementById('module-xp-reward').value;
    
    if (!title || !description) {
        alert('Please fill in title and description');
        return;
    }
    
    const db = firebase.firestore();
    const moduleData = {
        title: title,
        description: description,
        skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
        starLevelRequired: parseInt(starLevel),
        xpReward: parseInt(xpReward),
        videos: getVideoLinks(),
        quizQuestions: getQuizQuestions(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: firebase.auth().currentUser.uid,
        status: 'active'
    };
    
    db.collection('learning_modules').add(moduleData)
        .then((docRef) => {
            console.log('✅ Module created with ID:', docRef.id);
            alert('Module created successfully!');
            document.getElementById('create-module-form').style.display = 'none';
            event.target.reset();
            loadRealModules(); // Refresh the module list
        })
        .catch(error => {
            console.error('❌ Error creating module:', error);
            alert('Error creating module: ' + error.message);
        });
};

// Helper functions for form data
function getVideoLinks() {
    const videoContainers = document.querySelectorAll('#video-links-container .video-link-container');
    const videos = [];
    videoContainers.forEach(container => {
        const input = container.querySelector('input[type="url"]');
        if (input && input.value) {
            videos.push(input.value);
        }
    });
    return videos;
}

function getQuizQuestions() {
    const questionContainers = document.querySelectorAll('#quiz-questions-container .quiz-question-container');
    const questions = [];
    questionContainers.forEach(container => {
        const questionInput = container.querySelector('input[type="text"]');
        const answerInput = container.querySelectorAll('input[type="text"]')[1];
        if (questionInput.value && answerInput.value) {
            questions.push({
                question: questionInput.value,
                correctAnswer: answerInput.value
            });
        }
    });
    return questions;
}

// Load real modules from Firestore
function loadRealModules() {
    console.log('📚 Loading real modules from Firestore...');
    const container = document.getElementById('modules-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Loading modules...</div>';
    
    const db = firebase.firestore();
    db.collection('learning_modules')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                container.innerHTML = '<div class="no-data">No modules created yet. Create your first module!</div>';
                return;
            }
            
            container.innerHTML = '';
            snapshot.forEach(doc => {
                const module = { id: doc.id, ...doc.data() };
                addModuleToDisplay(module, container);
            });
        })
        .catch(error => {
            console.error('Error loading modules:', error);
            container.innerHTML = '<div class="error">Error loading modules</div>';
        });
}

function addModuleToDisplay(module, container) {
    const moduleCard = document.createElement('div');
    moduleCard.className = 'module-card';
    
    // Handle missing or undefined fields safely
    const title = module.title || 'Untitled Module';
    const description = module.description || 'No description';
    const skills = module.skills || [];
    const starLevelRequired = module.starLevelRequired || 1;
    const xpReward = module.xpReward || 0;
    const quizQuestions = module.quizQuestions || [];
    const videos = module.videos || [];
    
    const starDisplay = '★'.repeat(starLevelRequired) + '☆'.repeat(5 - starLevelRequired);
    
    moduleCard.innerHTML = `
        <div class="module-header">
            <h3 class="module-title">${title}</h3>
            <span class="module-level">Level: ${getLevelName(starLevelRequired)}</span>
        </div>
        <div class="module-details">
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Skills:</strong> ${skills.length > 0 ? skills.join(', ') : 'No skills specified'}</p>
            <p><strong>XP Reward:</strong> ${xpReward} XP</p>
            <p><strong>Star Requirement:</strong> ${starDisplay}</p>
            <p><strong>Questions:</strong> ${quizQuestions.length}</p>
            <p><strong>Videos:</strong> ${videos.length}</p>
        </div>
        <div class="module-actions">
            <button class="btn-edit-module" onclick="openEditModule('${module.id}')">Edit</button>
            <button class="btn-delete-module" onclick="deleteModule('${module.id}')">Delete</button>
        </div>
    `;
    
    container.appendChild(moduleCard);
}

function getLevelName(starLevel) {
    const levels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return levels[starLevel - 1] || 'Unknown';
}

// DEBUG VERSION - Add this temporary function
function debugLoadRealUsers() {
    console.log('🔍 DEBUG: Loading users with detailed logging...');
    
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('❌ users-table-body not found');
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading users...</td></tr>';
    
    const db = firebase.firestore();
    
    Promise.all([
        db.collection('users').get(),
        db.collection('employers').get(),
        db.collection('candidates').get()
    ]).then(([usersSnapshot, employersSnapshot, candidatesSnapshot]) => {
        
        const allUsers = [];
        
        // Process employers
        employersSnapshot.forEach(doc => {
            const userData = doc.data();
            console.log('📋 EMPLOYER DATA:', {
                id: doc.id,
                name: userData.companyName,
                status: userData.status,
                email: userData.email
            });
            
            allUsers.push({
                id: doc.id,
                name: userData.companyName || userData.displayName || 'Unknown Company',
                email: userData.email || 'No email',
                type: 'employer',
                userData: userData,
                status: userData.status || 'active',
                collection: 'employers'
            });
        });
        
        console.log(`📊 Total users loaded: ${allUsers.length}`);
        
        if (allUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
            return;
        }
        
        // Display users in table
        tbody.innerHTML = '';
        
        allUsers.forEach(user => {
            console.log(`👤 Processing user: ${user.name}`, {
                status: user.status,
                id: user.id
            });
            
            const row = document.createElement('tr');
            row.id = `user-row-${user.id}`;
            
            // DEBUG THE LOGIC
            const isActive = user.status === 'active';
            const statusClass = isActive ? 'active' : 'suspended';
            const statusText = isActive ? 'Active' : 'Suspended';
            const buttonText = isActive ? 'Suspend' : 'Activate';
            const buttonClass = isActive ? 'btn-suspend' : 'btn-activate';
            
            console.log(`🔧 ${user.name}: status="${user.status}", isActive=${isActive}, buttonText="${buttonText}"`);
            
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.type}</td>
                <td>☆☆☆☆☆</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="${buttonClass}" onclick="suspendUser('${user.id}', '${user.collection}')">
                        ${buttonText}
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
    }).catch(error => {
        console.error('❌ Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading users</td></tr>';
    });
}

// Replace the current loadRealUsers with the debug version temporarily
window.loadRealUsers = debugLoadRealUsers;

console.log('✅ All global functions defined and ready!');