// users/admin-users.js

// Initialize user management
function initUserManagement() {
    // Fetch all users from Firestore
    fetchAllUsers();
    
    // Set up search functionality
    setupSearch();
}

// Fetch all users from Firestore
function fetchAllUsers() {
    const usersTable = document.getElementById('users-table-body');
    if (!usersTable) return;
    
    // Show loading state
    usersTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading users...</td></tr>';
    
    // Get references to both user collections
    const candidatesRef = firebase.firestore().collection('candidates');
    const employersRef = firebase.firestore().collection('employers');
    
    // Fetch all users (both candidates and employers)
    Promise.all([
        candidatesRef.get(),
        employersRef.get()
    ]).then(([candidatesSnapshot, employersSnapshot]) => {
        // Clear loading state
        usersTable.innerHTML = '';
        
        // Process candidates
        candidatesSnapshot.forEach(doc => {
            const userData = doc.data();
            addUserToTable({
                id: doc.id,
                name: userData.name || 'Unknown',
                email: userData.email || 'No email',
                role: 'Candidate',
                starLevel: userData.starLevel || 0,
                status: userData.status || 'Active',
                collection: 'candidates'
            });
        });
        
        // Process employers
        employersSnapshot.forEach(doc => {
            const userData = doc.data();
            addUserToTable({
                id: doc.id,
                name: userData.companyName || userData.name || 'Unknown',
                email: userData.email || 'No email',
                role: 'Employer',
                starLevel: userData.starLevel || 0,
                status: userData.status || 'Active',
                collection: 'employers'
            });
        });
        
        // If no users found
        if (candidatesSnapshot.empty && employersSnapshot.empty) {
            usersTable.innerHTML = '<tr><td colspan="6" class="text-center">No users found.</td></tr>';
        }
    }).catch(error => {
        console.error('Error fetching users:', error);
        usersTable.innerHTML = '<tr><td colspan="6" class="text-center error">Error loading users. Please try again.</td></tr>';
    });
}

// Add a user to the table - FIXED VERSION
function addUserToTable(user) {
    const usersTable = document.getElementById('users-table-body');
    if (!usersTable) return;
    
    // FIXED: Correct button logic
    const normalizedStatus = (user.status || 'Active').toLowerCase();
    const isActive = normalizedStatus === 'active';
    const buttonText = isActive ? 'Suspend' : 'Activate';
    const buttonClass = isActive ? 'btn-suspend' : 'btn-activate';
    const buttonFunction = isActive ? 'suspendUser' : 'activateUser';
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${'★'.repeat(user.starLevel)}${user.starLevel < 5 ? '☆'.repeat(5 - user.starLevel) : ''}</td>
        <td>
            <span class="status-badge ${isActive ? 'active' : 'suspended'}">${user.status}</span>
        </td>
        <td class="action-buttons">
            <button class="${buttonClass}" onclick="${buttonFunction}('${user.id}', '${user.collection}')">
                ${buttonText}
            </button>
        </td>
    `;
    
    usersTable.appendChild(row);
}

// Suspend a user
function suspendUser(userId, collection) {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    
    firebase.firestore().collection(collection).doc(userId).update({
        status: 'Suspended',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('User suspended successfully.');
        fetchAllUsers(); // Refresh the table
    }).catch(error => {
        console.error('Error suspending user:', error);
        alert('Error suspending user. Please try again.');
    });
}

// Activate a user
function activateUser(userId, collection) {
    if (!confirm('Are you sure you want to activate this user?')) return;
    
    firebase.firestore().collection(collection).doc(userId).update({
        status: 'Active',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('User activated successfully.');
        fetchAllUsers(); // Refresh the table
    }).catch(error => {
        console.error('Error activating user:', error);
        alert('Error activating user. Please try again.');
    });
}

// Set up search functionality
function setupSearch() {
    const searchInput = document.getElementById('user-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#users-table-body tr');
        
        rows.forEach(row => {
            const name = row.cells[0].textContent.toLowerCase();
            const email = row.cells[1].textContent.toLowerCase();
            const role = row.cells[2].textContent.toLowerCase();
            
            if (name.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Initialize when the user management section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Watch for when the user management section becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const userManagementSection = document.getElementById('user-management');
                if (userManagementSection && userManagementSection.style.display !== 'none') {
                    initUserManagement();
                }
            }
        });
    });
    
    // Start observing the user management section
    const userManagementSection = document.getElementById('user-management');
    if (userManagementSection) {
        observer.observe(userManagementSection, { attributes: true });
    }
});