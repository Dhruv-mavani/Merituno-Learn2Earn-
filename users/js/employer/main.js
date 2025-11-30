// employer-main.js

// Firebase references
let currentUser = null;
let employerData = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase (assuming auth.js already does this)
    // Check authentication state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in - SET currentUser HERE
            currentUser = user; // ADD THIS LINE
            loadEmployerData(user.uid);
            setupEventListeners();
            initializeRecentActivity();
        } else {
            // No user is signed in, redirect to login
            window.location.href = '../login/index.html';
        }
    });

    // Set up logout functionality for dropdown button
    document.getElementById('logout-dropdown-btn').addEventListener('click', function(e) {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
            window.location.href = '/login/index.html';
        });
    });
});

function setupRealTimeStats(userId) {
    const db = firebase.firestore();
    
    // Listen for job changes
    db.collection('jobs').where('employerId', '==', userId)
        .onSnapshot(() => {
            loadDashboardStats(userId);
        });
    
    // Listen for application changes
    db.collection('applications').where('employerId', '==', userId)
        .onSnapshot(() => {
            loadDashboardStats(userId);
        });
        
    db.collection('freelanceApplications').where('employerId', '==', userId)
        .onSnapshot(() => {
            loadDashboardStats(userId);
        });
}

function loadEmployerData(userId) {
    const employerRef = firebase.firestore().collection('employers').doc(userId);
    const user = firebase.auth().currentUser;
    
    employerRef.get().then((doc) => {
        if (doc.exists) {
            employerData = doc.data(); // SET THE GLOBAL VARIABLE HERE
            console.log('Employer Data:', employerData);
            
            // Update UI with employer data
            updateEmployerUI(employerData, user);
            
        } else {
            console.log('No employer document found, creating one...');
            
            // Create a proper employer document with all required fields
            const defaultData = {
                email: user.email,
                companyName: user.displayName || user.email.split('@')[0] || 'My Company',
                displayName: user.displayName || user.email.split('@')[0] || 'Employer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                profileCompleted: false
            };
            
            employerRef.set(defaultData).then(() => {
                console.log('New employer document created');
                // Reload with the new data
                loadEmployerData(userId);
            }).catch((error) => {
                console.error("Error creating employer document:", error);
                // Fallback to auth data
                employerData = {}; // SET EMPTY OBJECT AS FALLBACK
                updateEmployerUI({}, user);
            });
            
        }
    }).catch((error) => {
        console.error("Error getting employer document:", error);
        // Fallback to auth data
        employerData = {}; // SET EMPTY OBJECT AS FALLBACK
        updateEmployerUI({}, user);
    });

    setupRealTimeStats(userId);
}

// Helper function to update the UI
function updateEmployerUI(employerData, user) {
    const companyName = employerData.companyName || employerData.displayName || 'Employer';
    const userEmail = user.email;
    
    // Update welcome message and profile panel
    document.getElementById('welcome-message').textContent = `Welcome, ${companyName}`;
    document.getElementById('profile-name').textContent = companyName;
    document.getElementById('profile-email').textContent = userEmail;
    
    // Update company info section
    const companyDescription = document.getElementById('company-description');
    if (employerData.companyDescription) {
        companyDescription.textContent = employerData.companyDescription;
    } else {
        companyDescription.innerHTML = `No company description added yet. <a href="#" onclick="showEditProfileModal()">Complete your profile</a> to attract better candidates.`;
    }
    
    // Calculate and display profile completion
    calculateProfileCompletion(employerData);
    
    // Load dashboard stats
    loadDashboardStats(user.uid);
}

// Function to update company name (you can call this from a settings/profile page)
function updateCompanyName(newCompanyName) {
    const user = firebase.auth().currentUser;
    if (user) {
        const employerRef = firebase.firestore().collection('employers').doc(user.uid);
        
        employerRef.update({
            companyName: newCompanyName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Company name updated successfully');
            // Reload the data to reflect changes
            loadEmployerData(user.uid);
        }).catch((error) => {
            console.error('Error updating company name:', error);
        });
    }
}

function calculateProfileCompletion(employerData) {
    let completion = 0;
    const totalFields = 5; // Adjust based on your required fields
    
    if (employerData.companyName) completion++;
    if (employerData.companyDescription) completion++;
    if (employerData.industry) completion++;
    if (employerData.location) completion++;
    if (employerData.website) completion++;
    
    const completionPercentage = Math.round((completion / totalFields) * 100);
    document.getElementById('profile-completion').textContent = `${completionPercentage}% Complete`;
    
    // Update progress bar
    const progressBar = document.getElementById('completion-progress');
    progressBar.style.width = `${completionPercentage}%`;
    progressBar.setAttribute('aria-valuenow', completionPercentage);
}

function loadDashboardStats(userId) {
    console.log('Loading dashboard stats for employer:', userId);
    
    const db = firebase.firestore();
    
    // Get all employer's jobs
    const jobsRef = db.collection('jobs').where('employerId', '==', userId);
    
    jobsRef.get().then((querySnapshot) => {
        let activeJobs = 0;
        let totalApplications = 0;
        let successfulHires = 0;
        
        console.log(`Found ${querySnapshot.size} jobs for this employer`);
        
        querySnapshot.forEach((doc) => {
            const jobData = doc.data();
            console.log('Job data:', jobData);
            
            // Count active jobs (status 'open')
            if (jobData.status === 'open') {
                activeJobs++;
            }
            
            // Count applications from job data
            if (jobData.applicationCount) {
                totalApplications += jobData.applicationCount;
            }
        });
        
        // Get applications count from applications collections
        const applicationsRef = db.collection('applications').where('employerId', '==', userId);
        const freelanceAppsRef = db.collection('freelanceApplications').where('employerId', '==', userId);
        
        Promise.all([
            applicationsRef.get(),
            freelanceAppsRef.get()
        ]).then(([jobAppsSnapshot, freelanceAppsSnapshot]) => {
            // Add applications from collections
            totalApplications += jobAppsSnapshot.size;
            totalApplications += freelanceAppsSnapshot.size;
            
            // Count successful hires (accepted applications)
            jobAppsSnapshot.forEach(doc => {
                if (doc.data().status === 'accepted') successfulHires++;
            });
            freelanceAppsSnapshot.forEach(doc => {
                if (doc.data().status === 'accepted') successfulHires++;
            });
            
            console.log('Final stats:', {
                activeJobs,
                totalApplications, 
                successfulHires
            });
            
            // Update the dashboard UI with CORRECT IDs
            updateDashboardStats(activeJobs, totalApplications, successfulHires);
            
        }).catch((error) => {
            console.error('Error loading applications:', error);
            // Still update with basic stats
            updateDashboardStats(activeJobs, totalApplications, successfulHires);
        });
        
    }).catch((error) => {
        console.error('Error loading jobs for stats:', error);
        // Set all stats to 0 if there's an error
        updateDashboardStats(0, 0, 0);
    });
}

function updateDashboardStats(activeJobs, applicationsReceived, successfulHires) {
    console.log('Updating dashboard stats:', { activeJobs, applicationsReceived, successfulHires });
    
    // Update active jobs - CORRECT ID
    const activeJobsElement = document.getElementById('active-jobs');
    if (activeJobsElement) {
        activeJobsElement.textContent = activeJobs;
        console.log('Set active jobs to:', activeJobs);
    } else {
        console.error('active-jobs element not found');
    }
    
    // Update applications received - CORRECT ID
    const applicationsElement = document.getElementById('applications-received');
    if (applicationsElement) {
        applicationsElement.textContent = applicationsReceived;
        console.log('Set applications received to:', applicationsReceived);
    } else {
        console.error('applications-received element not found');
    }
    
    // Update successful hires - CORRECT ID (it's "hires-count" in your HTML)
    const hiresElement = document.getElementById('hires-count');
    if (hiresElement) {
        hiresElement.textContent = successfulHires;
        console.log('Set successful hires to:', successfulHires);
    } else {
        console.error('hires-count element not found');
    }
    
    // Calculate satisfaction rate
    const satisfactionElement = document.getElementById('satisfaction-rate');
    if (satisfactionElement) {
        let satisfactionRate = 0;
        if (applicationsReceived > 0) {
            satisfactionRate = Math.round((successfulHires / applicationsReceived) * 100);
        }
        satisfactionElement.textContent = satisfactionRate + '%';
        console.log('Set satisfaction rate to:', satisfactionRate + '%');
    } else {
        console.error('satisfaction-rate element not found');
    }
}

// ========== RECENT ACTIVITY MANAGEMENT ==========

function initializeRecentActivity() {
    console.log('Initializing recent activity...');
    loadRecentActivities();
    setupActivityEventListeners();
}

function loadRecentActivities() {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) return;

    // Sample activities - in real app, you'd fetch from Firestore
    const activities = [
        {
            id: 1,
            type: 'applications',
            title: 'New Applications Received',
            description: '12 new applications received for your React Developer position',
            time: '2 hours ago',
            status: 'new',
            unread: true,
            actions: [
                { label: 'Review Applications', type: 'primary', action: 'reviewApplications' },
                { label: 'Mark as Read', type: 'secondary', action: 'markRead' }
            ]
        },
        {
            id: 2,
            type: 'projects',
            title: 'Project Completed',
            description: 'UI/UX design project marked as completed by John Doe',
            time: '5 hours ago',
            status: 'completed',
            unread: false,
            meta: [
                { icon: 'dollar-sign', text: '$1,250' },
                { icon: 'clock', text: '2 weeks' },
                { icon: 'star', text: '4.8/5' }
            ],
            actions: [
                { label: 'View Project', type: 'primary', action: 'viewProject' },
                { label: 'Leave Review', type: 'secondary', action: 'leaveReview' }
            ]
        },
        {
            id: 3,
            type: 'payments',
            title: 'Payment Processed',
            description: '$1,250 payment processed for completed website development',
            time: '1 day ago',
            status: 'paid',
            unread: false,
            meta: [
                { icon: 'receipt', text: 'Invoice #INV-2024-001' },
                { icon: 'user', text: 'Sarah Johnson' }
            ]
        },
        {
            id: 4,
            type: 'applications',
            title: 'Urgent: Position Closing Soon',
            description: 'Senior Frontend Developer position closes in 24 hours. 8 applications pending review.',
            time: '1 day ago',
            status: 'urgent',
            unread: true,
            actions: [
                { label: 'Review Now', type: 'primary', action: 'reviewApplications' },
                { label: 'Extend Deadline', type: 'warning', action: 'extendDeadline' }
            ]
        },
        {
            id: 5,
            type: 'projects',
            title: 'New Project Message',
            description: 'Mike Chen sent a new message regarding the E-commerce website project',
            time: '2 days ago',
            unread: false,
            message: "Hi, I've completed the initial design mockups. Would you like to schedule a review call?",
            actions: [
                { label: 'Reply', type: 'primary', action: 'replyMessage' },
                { label: 'View Project', type: 'secondary', action: 'viewProject' }
            ]
        }
    ];

    displayActivities(activities);
    updateUnreadCount();
}

function displayActivities(activities) {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) return;

    activityFeed.innerHTML = activities.map(activity => `
        <div class="activity-item" data-type="${activity.type}" data-id="${activity.id}" data-read="${!activity.unread}">
            <div class="activity-icon ${getIconClass(activity)}">
                <i class="fas ${getActivityIcon(activity)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-header">
                    <h3>${activity.title}</h3>
                    <span class="activity-time">${activity.time}</span>
                    ${activity.status ? `<span class="activity-badge ${activity.status}">${getStatusText(activity.status)}</span>` : ''}
                </div>
                <p>${activity.description}</p>
                ${activity.meta ? `
                <div class="activity-meta">
                    ${activity.meta.map(meta => `
                    <span class="meta-item"><i class="fas fa-${meta.icon}"></i> ${meta.text}</span>
                    `).join('')}
                </div>
                ` : ''}
                ${activity.message ? `
                <div class="message-preview">
                    "${activity.message}"
                </div>
                ` : ''}
                ${activity.actions ? `
                <div class="activity-actions">
                    ${activity.actions.map(action => `
                    <button class="btn-small ${action.type}" data-action="${action.action}" data-activity-id="${activity.id}">
                        ${action.label}
                    </button>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Add event listeners to activity buttons
    setupActivityButtonListeners();
}

function getActivityIcon(activity) {
    const icons = {
        applications: 'user-plus',
        projects: activity.status === 'completed' ? 'check-circle' : 'comments',
        payments: 'money-bill-wave',
        urgent: 'exclamation-circle'
    };
    return icons[activity.status] || icons[activity.type];
}

function getIconClass(activity) {
    if (activity.status === 'urgent') return 'urgent';
    if (activity.status === 'completed') return 'completed';
    if (activity.type === 'payments') return 'payment';
    return '';
}

function getStatusText(status) {
    const statusTexts = {
        new: 'New',
        completed: 'Completed',
        paid: 'Paid',
        urgent: 'Urgent'
    };
    return statusTexts[status] || status;
}

function setupActivityEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterActivities(this.dataset.filter);
        });
    });

    // Load more button
    const loadMoreBtn = document.getElementById('load-more-activities');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreActivities);
    }

    // Mark all as read button
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }
}

function setupActivityButtonListeners() {
    const actionButtons = document.querySelectorAll('.activity-actions .btn-small');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            const activityId = this.dataset.activityId;
            handleActivityAction(action, activityId);
        });
    });

    // Mark as read when clicking on activity items
    const activityItems = document.querySelectorAll('.activity-item[data-read="false"]');
    activityItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.activity-actions')) {
                markAsRead(this.dataset.id);
            }
        });
    });
}

function filterActivities(filter) {
    const activities = document.querySelectorAll('.activity-item');
    activities.forEach(activity => {
        if (filter === 'all' || activity.dataset.type === filter) {
            activity.style.display = 'flex';
        } else {
            activity.style.display = 'none';
        }
    });
}

function handleActivityAction(action, activityId) {
    console.log(`Action: ${action} for activity ${activityId}`);
    
    switch(action) {
        case 'reviewApplications':
            // Navigate to applications section
            showSection('applications');
            break;
        case 'markRead':
            markAsRead(activityId);
            break;
        case 'viewProject':
            // Navigate to freelance management
            showSection('freelance-management');
            break;
        case 'leaveReview':
            // Open review modal
            alert('Leave review functionality would open here');
            break;
        case 'extendDeadline':
            // Extend deadline functionality
            alert('Extend deadline functionality would open here');
            break;
        case 'replyMessage':
            // Open message reply
            alert('Message reply functionality would open here');
            break;
    }
}

function markAsRead(activityId) {
    const activityItem = document.querySelector(`.activity-item[data-id="${activityId}"]`);
    if (activityItem) {
        activityItem.dataset.read = 'true';
        activityItem.style.background = 'white';
        updateUnreadCount();
    }
}

function markAllAsRead() {
    const unreadActivities = document.querySelectorAll('.activity-item[data-read="false"]');
    unreadActivities.forEach(activity => {
        activity.dataset.read = 'true';
        activity.style.background = 'white';
    });
    updateUnreadCount();
}

function updateUnreadCount() {
    const unreadCount = document.querySelectorAll('.activity-item[data-read="false"]').length;
    const unreadCountElement = document.getElementById('unread-count');
    if (unreadCountElement) {
        unreadCountElement.textContent = unreadCount;
    }
}

function loadMoreActivities() {
    // Simulate loading more activities
    const loadMoreBtn = document.getElementById('load-more-activities');
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    loadMoreBtn.disabled = true;

    setTimeout(() => {
        // In real app, you'd fetch more data from Firestore
        alert('Loading more activities...');
        loadMoreBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Load More Activities';
        loadMoreBtn.disabled = false;
    }, 1000);
}

// ========== EVENT LISTENERS AND UI MANAGEMENT ==========

function setupEventListeners() {
    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show the corresponding section
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });
    
    // Show dashboard by default
    showSection('dashboard');
    
    // Toggle profile dropdown on click
    const profileToggle = document.getElementById('profile-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const dropdown = document.querySelector('.profile-dropdown');
            dropdown.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.querySelector('.profile-dropdown');
        const profilePanel = document.querySelector('.profile-panel');
        
        if (dropdown && profilePanel && !profilePanel.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // Close dropdown when clicking on logout
    const logoutDropdownBtn = document.getElementById('logout-dropdown-btn');
    if (logoutDropdownBtn) {
        logoutDropdownBtn.addEventListener('click', function() {
            const dropdown = document.querySelector('.profile-dropdown');
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        });
    }
}

function showSection(sectionId) {
    loadSection(sectionId);
}

// ========== SECTION MANAGEMENT FOR EMPLOYER ==========

function loadSection(section) {
    console.log('Loading employer section:', section);
    
    // Try different ID patterns
    let targetSection = document.getElementById(`${section}-section`);
    if (!targetSection) {
        // Try without -section suffix
        targetSection = document.getElementById(section);
    }
    if (!targetSection) {
        // Try with different naming convention
        targetSection = document.getElementById(`employer-${section}`);
    }
    
    if (!targetSection) {
        console.error(`Section '${section}' not found with any ID pattern`);
        
        // Find and show the first available section WITHOUT recursion
        const availableSections = document.querySelectorAll('.main-content-section, [class*="section"], [id*="section"]');
        if (availableSections.length > 0) {
            const firstSection = availableSections[0];
            console.log('Showing first available section:', firstSection.id);
            
            // Hide all sections
            availableSections.forEach(sec => {
                sec.style.display = 'none';
                sec.classList.remove('active');
            });
            
            // Show the first available section
            firstSection.style.display = 'block';
            firstSection.classList.add('active');
            
            // Get the section name from the ID
            const sectionName = firstSection.id.replace('-section', '').replace('employer-', '');
            console.log('Active section name:', sectionName);
            
            // Load modules for this section
            loadEmployerSectionModules(sectionName);
        } else {
            console.error('No sections available at all');
        }
        return; // STOP HERE - no recursion!
    }

    

    
    // Hide all sections first
    const sections = document.querySelectorAll('.main-content-section, [class*="section"], [id*="section"]');
    sections.forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });
    
    // Show the selected section
    targetSection.style.display = 'block';
    targetSection.classList.add('active');
    
    // Update active state in sidebar
    const navLinks = document.querySelectorAll('.nav-item[data-section]');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        }
    });
    
    // Load section-specific content
    loadEmployerSectionModules(section);
}

function loadEmployerSectionModules(section) {
    console.log('Loading modules for employer section:', section);
    
    // Get current user safely
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('No user found');
        return;
    }
    
    // Ensure employerData exists
    if (!employerData) {
        console.warn('employerData not loaded yet, loading now...');
        // Try to load employer data if it's not available
        loadEmployerData(user.uid);
        return;
    }
    
    switch(section) {
        case 'dashboard':
            console.log('Employer dashboard section loaded');
            break;
            
        case 'jobs':
            if (typeof initEmployerJobsSection === 'function') {
                console.log('Initializing employer jobs section');
                initEmployerJobsSection(user, employerData);
            } else {
                console.log('Jobs section loaded (no special initialization)');
            }
            break;
            
        case 'freelance':
            if (typeof initEmployerFreelanceSection === 'function') {
                console.log('Initializing employer freelance section');
                initEmployerFreelanceSection(user, employerData);
            } else {
                console.log('Freelance section loaded (no special initialization)');
            }
            break;
            
        case 'applications':
            if (typeof initEmployerApplicationsSection === 'function') {
                console.log('Initializing employer applications section');
                initEmployerApplicationsSection(user, employerData);
            } else {
                console.log('Applications section loaded (no special initialization)');
            }
            break;
            
        case 'chats':
            console.log('Initializing employer chats section');
            initEmployerChatsSection(user, employerData);
            break;
            
        case 'wallet':
            if (typeof initEmployerWalletSection === 'function') {
                console.log('Initializing employer wallet section');
                initEmployerWalletSection(user, employerData);
            } else {
                console.log('Wallet section loaded (no special initialization)');
            }
            break;
            
        case 'profile':
            console.log('Employer profile section loaded');
            break;
            
        case 'settings':
            console.log('Employer settings section loaded');
            break;
            
        default:
            console.warn('Unknown employer section:', section);
    }
}

// Placeholder functions for button clicks
function postJob() {
    showSection('job-management');
    // You would implement job posting UI in the job-management section
}

function manageJobs() {
    showSection('job-management');
    // You would implement job management UI
}

function browseCandidate() {
    showSection('applications');
    // You would implement candidate browsing UI
}

// Function to show edit profile modal
function showEditProfileModal() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Get current employer data
    const employerRef = firebase.firestore().collection('employers').doc(user.uid);
    employerRef.get().then((doc) => {
        if (doc.exists) {
            const employerData = doc.data();
            
            // Create modal HTML
            const modalHTML = `
                <div class="modal" id="editProfileModal" style="display: flex;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edit Company Profile</h3>
                            <button class="close-modal" onclick="closeEditProfileModal()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="editProfileForm">
                                <div class="form-group">
                                    <label for="edit-company-name">Company Name *</label>
                                    <input type="text" id="edit-company-name" class="form-control" 
                                           value="${employerData.companyName || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label for="edit-company-description">Company Description</label>
                                    <textarea id="edit-company-description" class="form-control" rows="4"
                                              placeholder="Describe your company...">${employerData.companyDescription || ''}</textarea>
                                </div>
                                <div class="form-group">
                                    <label for="edit-industry">Industry</label>
                                    <input type="text" id="edit-industry" class="form-control" 
                                           value="${employerData.industry || ''}" placeholder="e.g., Technology, Healthcare">
                                </div>
                                <div class="form-group">
                                    <label for="edit-location">Location</label>
                                    <input type="text" id="edit-location" class="form-control" 
                                           value="${employerData.location || ''}" placeholder="e.g., City, Country">
                                </div>
                                <div class="form-group">
                                    <label for="edit-website">Website</label>
                                    <input type="url" id="edit-website" class="form-control" 
                                           value="${employerData.website || ''}" placeholder="https://example.com">
                                </div>
                                <div class="form-actions">
                                    <button type="button" class="cancel-btn" onclick="closeEditProfileModal()">Cancel</button>
                                    <button type="submit" class="submit-btn">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Handle form submission
            document.getElementById('editProfileForm').addEventListener('submit', function(e) {
                e.preventDefault();
                saveProfileChanges(user.uid);
            });
        }
    });
}

// Function to close the edit profile modal
function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.remove();
    }
}

// Function to save profile changes
function saveProfileChanges(userId) {
    const formData = {
        companyName: document.getElementById('edit-company-name').value,
        companyDescription: document.getElementById('edit-company-description').value,
        industry: document.getElementById('edit-industry').value,
        location: document.getElementById('edit-location').value,
        website: document.getElementById('edit-website').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        profileCompleted: true
    };
    
    const employerRef = firebase.firestore().collection('employers').doc(userId);
    
    employerRef.update(formData).then(() => {
        console.log('Profile updated successfully');
        closeEditProfileModal();
        // Reload the page to show updated data
        loadEmployerData(userId);
    }).catch((error) => {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
    });
}

// Add to employer-main.js - Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
    
    // Close button
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.parentNode.removeChild(notification);
    });
}

// Employer Chat Functions
function initEmployerChats() {
    const user = firebase.auth().currentUser;
    if (user) {
        loadEmployerChats(user.uid);
    }
}

// Fixed employer chat loading function
async function loadEmployerChats(userId) {
    try {
        console.log("Loading employer chats for user:", userId);
        
        // Get chats where user is employer
        const employerChats = await firebase.firestore().collection('chats')
            .where('participants.employer', '==', userId)
            .get();

        console.log(`Found ${employerChats.docs.length} employer chats`);
        
        displayEmployerChatsList(employerChats.docs);
    } catch (error) {
        console.error('Error loading employer chats:', error);
        const chatsList = document.getElementById('chats-list');
        if (chatsList) {
            chatsList.innerHTML = '<p>Error loading chats: ' + error.message + '</p>';
        }
    }
}

function displayEmployerChatsList(chats) {
    const chatsList = document.getElementById('chats-list');
    if (!chatsList) {
        console.error('Chats list element not found');
        return;
    }
    
    if (chats.length === 0) {
        chatsList.innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p>No active chats yet. Chats will appear here when you accept applications.</p>
                </div>
            </div>
        `;
        return;
    }
    
    chatsList.innerHTML = chats.map(chatDoc => {
        const chat = chatDoc.data();
        
        // Get participant information
        const projectTitle = chat.project?.title || 'Project Discussion';
        const memberName = chat.participants?.memberName || 'Candidate';
            
        return `
            <div class="content-card chat-item" onclick="openChat('${chat.chatId}')">
                <div class="card-header">
                    <h3>${projectTitle}</h3>
                    <span class="card-stats">${memberName}</span>
                </div>
                <div class="card-content">
                    <p>Chat with ${memberName}</p>
                    <p>Last activity: ${formatDate(chat.lastActivity)}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Use the same chat functions as member (openChat, sendMessage, closeChat)
// They will work the same way

// Add this function to your employer main.js file
function formatDate(date) {
    if (!date) return 'Recently';
    try {
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        return dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        return 'Recently';
    }
}

// Also add formatTime function for chat timestamps
function formatTime(date) {
    if (!date) return 'Just now';
    try {
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diffMs = now - dateObj;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        // If message is in the future (server timestamp not yet processed)
        if (diffMs < 0) return 'Just now';
        
        // If less than 1 minute ago
        if (diffMins < 1) return 'Just now';
        
        // If less than 1 hour ago
        if (diffMins < 60) return `${diffMins}m ago`;
        
        // If less than 24 hours ago
        if (diffHours < 24) return `${diffHours}h ago`;
        
        // If today but more than 24 hours ago, show time
        if (dateObj.toDateString() === now.toDateString()) {
            return dateObj.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
        
        // Otherwise show date
        return dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    } catch (error) {
        return 'Just now';
    }
}

// ========== EMPLOYER CHAT SYSTEM FUNCTIONS ==========

let currentChatId = null;
let unsubscribeChat = null;

// Initialize employer chats section
function initEmployerChatsSection(user, userData) {
    console.log("Initializing Employer Chats Section");
    
    // Set up event listeners for chat functionality
    const sendButton = document.getElementById('send-message-btn');
    const messageInput = document.getElementById('message-input');
    
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Load employer chats
    loadEmployerChats(user.uid);
}

function updateChatHeader(chatData) {
    const chatTitle = document.getElementById('chat-title');
    const chatSubtitle = document.getElementById('chat-subtitle');
    
    if (!chatTitle || !chatSubtitle) {
        console.error('Chat header elements not found');
        return;
    }
    
    const projectTitle = chatData.project?.title || 'Project Discussion';
    const memberName = chatData.participants?.memberName || 'Candidate';
    
    console.log('Updating chat header with:', { projectTitle, memberName });
    
    // Update both elements
    chatTitle.textContent = projectTitle;
    chatSubtitle.textContent = `Chat with ${memberName}`;
}

// Load employer chats
async function loadEmployerChats(userId) {
    try {
        console.log("Loading employer chats for user:", userId);
        
        // Get chats where user is employer
        const employerChats = await firebase.firestore().collection('chats')
            .where('participants.employer', '==', userId)
            .get();

        console.log(`Found ${employerChats.docs.length} employer chats`);
        
        displayEmployerChatsList(employerChats.docs);
    } catch (error) {
        console.error('Error loading employer chats:', error);
        const chatsList = document.getElementById('chats-list');
        if (chatsList) {
            chatsList.innerHTML = '<p>Error loading chats: ' + error.message + '</p>';
        }
    }
}

function displayEmployerChatsList(chats) {
    const chatsList = document.getElementById('chats-list');
    if (!chatsList) {
        console.error('Chats list element not found');
        return;
    }
    
    if (chats.length === 0) {
        chatsList.innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p>No active chats yet. Chats will appear here when you accept applications.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Clear existing content first
    chatsList.innerHTML = '';
    
    chats.forEach(chatDoc => {
        const chat = chatDoc.data();
        const projectTitle = chat.project?.title || 'Project Discussion';
        const memberName = chat.participants?.memberName || 'Candidate';
        
        const chatItem = document.createElement('div');
        chatItem.className = 'content-card chat-item';
        chatItem.style.cursor = 'pointer';
        chatItem.onclick = () => openChat(chat.chatId);
        
        chatItem.innerHTML = `
            <div class="card-header">
                <h3>${projectTitle}</h3>
                <span class="card-stats">${memberName}</span>
            </div>
            <div class="card-content">
                <p><strong>Participant:</strong> ${memberName}</p>
                <p><strong>Last activity:</strong> ${formatDate(chat.lastActivity)}</p>
            </div>
        `;
        
        chatsList.appendChild(chatItem);
    });
}

// Open chat function for employer
async function openChat(chatId) {
    console.log("Employer opening chat:", chatId);
    currentChatId = chatId;
    
    const chatWindow = document.getElementById('chat-window');
    const chatsList = document.getElementById('chats-list');
    
    if (chatWindow) chatWindow.style.display = 'block';
    if (chatsList) chatsList.style.display = 'none';
    
    // Load chat data first to update header
    try {
        const chatDoc = await firebase.firestore().collection('chats').doc(chatId).get();
        if (chatDoc.exists) {
            const chatData = chatDoc.data();
            updateChatHeader(chatData);
        }
    } catch (error) {
        console.error('Error loading chat data for header:', error);
    }
    
    await loadChatMessages(chatId);
}

// Load chat messages
async function loadChatMessages(chatId) {
    try {
        // Ensure currentUser is available
        if (!currentUser) {
            console.error('currentUser is null, trying to get current user...');
            currentUser = firebase.auth().currentUser;
            
            if (!currentUser) {
                console.error('No user is signed in');
                return;
            }
        }
        
        console.log('Loading chat messages for user:', currentUser.uid);
        
        const chatDoc = await firebase.firestore().collection('chats').doc(chatId).get();
        if (chatDoc.exists) {
            const chatData = chatDoc.data();
            
            console.log('=== EMPLOYER CHAT STRUCTURE ===');
            console.log('Chat ID:', chatId);
            console.log('Participants:', chatData.participants);
            console.log('Current User UID:', currentUser.uid);
            console.log('Is employer participant?', chatData.participants?.employer === currentUser.uid);
            console.log('Your role in this chat: EMPLOYER');
            
            // Check if messages exist
            console.log('Number of messages:', chatData.messages?.length || 0);
            
            displayMessages(chatData.messages || []);
            
            if (unsubscribeChat) unsubscribeChat();
            unsubscribeChat = firebase.firestore().collection('chats').doc(chatId)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        console.log('Real-time update received');
                        displayMessages(doc.data().messages || []);
                    }
                });
        }
    } catch (error) {
        console.error('Error loading chat messages:', error);
    }
}

// Display messages with zigzag layout
// Display messages with zigzag layout
function displayMessages(messages) {
    const container = document.getElementById('messages-container');
    if (!container) {
        console.error('Messages container not found!');
        return;
    }
    
    // Ensure currentUser is available
    if (!currentUser) {
        currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error('No user signed in for message display');
            return;
        }
    }
    
    console.log('=== DISPLAY MESSAGES - EMPLOYER ===');
    console.log('Current User UID:', currentUser.uid);
    console.log('Number of messages:', messages.length);

    
    // Enhanced debugging for each message
    messages.forEach((msg, index) => {
        const isOwn = msg.sender === currentUser.uid;
        console.log(`Message ${index}:`, {
            content: msg.content?.substring(0, 50) + '...',
            sender: msg.sender,
            currentUser: currentUser.uid,
            isOwnMessage: isOwn,
            role: isOwn ? 'EMPLOYER (YOU)' : 'MEMBER'
        });
    });
    
    // Clear container first
    container.innerHTML = '';
    
    // Create a copy and sort messages by timestamp
    const sortedMessages = [...messages].sort((a, b) => {
        try {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
            return timeA.getTime() - timeB.getTime();
        } catch (error) {
            console.error('Error sorting messages:', error);
            return 0;
        }
    });
    
    // Add messages to container
    sortedMessages.forEach(msg => {
        const isOwnMessage = msg.sender === currentUser.uid;
        const messageClass = isOwnMessage ? 'own' : 'other';
        
        console.log(`Rendering: "${msg.content?.substring(0, 30)}..." as ${messageClass}`);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${messageClass}`;
        messageDiv.innerHTML = `
            <div class="message-content">${msg.content}</div>
            <div class="message-time">${formatTime(msg.timestamp)}</div>
        `;
        
        container.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Send message function for employer
// Send message function for employer
async function sendMessage() {
    // Ensure currentUser is available
    if (!currentUser) {
        currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error('No user signed in');
            return;
        }
    }
    
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message || !currentChatId) {
        return;
    }
    
    try {
        // Create the message object WITHOUT serverTimestamp in arrayUnion
        const newMessage = {
            id: Date.now().toString(),
            sender: currentUser.uid,
            content: message,
            type: 'text',
            timestamp: new Date(), // Use client timestamp temporarily
            read: false
        };

        // First, get the current chat document
        const chatDoc = await firebase.firestore().collection('chats').doc(currentChatId).get();
        
        if (chatDoc.exists) {
            const currentMessages = chatDoc.data().messages || [];
            
            // Add the new message to the array
            const updatedMessages = [...currentMessages, newMessage];
            
            // Update the document with the new messages array and server timestamp for lastActivity
            await firebase.firestore().collection('chats').doc(currentChatId).update({
                messages: updatedMessages,
                lastActivity: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            input.value = '';
            console.log('Message sent successfully');
        } else {
            console.error('Chat document does not exist');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message. Please try again.');
    }
}

// Close chat function for employer
function closeChat() {
    console.log("Employer closing chat");
    
    const chatWindow = document.getElementById('chat-window');
    const chatsList = document.getElementById('chats-list');
    
    if (chatWindow) chatWindow.style.display = 'none';
    if (chatsList) chatsList.style.display = 'block';
    
    if (unsubscribeChat) {
        unsubscribeChat();
        unsubscribeChat = null;
    }
    
    currentChatId = null;
}

function debugSections() {
    console.log('=== DEBUGGING SECTIONS ===');
    const sections = document.querySelectorAll('.main-content-section');
    console.log(`Found ${sections.length} sections:`);
    
    sections.forEach(section => {
        console.log(`- ${section.id} (display: ${section.style.display})`);
    });
    
    // Check what sections are expected
    const expectedSections = ['dashboard', 'jobs', 'freelance', 'applications', 'chats', 'wallet', 'profile', 'settings'];
    expectedSections.forEach(section => {
        const element = document.getElementById(`${section}-section`);
        console.log(`Looking for #${section}-section:`, element ? 'FOUND' : 'NOT FOUND');
    });
}
// ========== EMPLOYER WALLET FUNCTIONS ==========

function initEmployerWalletSection(user, employerData) {
    console.log('Initializing employer wallet section...');
    
    // Load wallet data
    loadWalletData(user.uid);
    loadTransactionHistory(user.uid);
    
    // Set up event listeners
    setupWalletEventListeners();
}

function loadWalletData(userId) {
    console.log('Loading wallet data for employer:', userId);
    
    const db = firebase.firestore();
    
    // Get employer wallet data
    db.collection('employers').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const employerData = doc.data();
                const walletBalance = employerData.walletBalance || 0;
                
                console.log('Wallet balance:', walletBalance);
                
                // Update UI
                updateWalletBalance(walletBalance);
            } else {
                console.log('No employer document found');
                updateWalletBalance(0);
            }
        })
        .catch((error) => {
            console.error('Error loading wallet data:', error);
            updateWalletBalance(0);
        });
}

function updateWalletBalance(balance) {
    const balanceElement = document.getElementById('wallet-balance');
    if (balanceElement) {
        balanceElement.textContent = `$${balance.toFixed(2)}`;
        console.log('Updated wallet balance display:', balance);
    } else {
        console.error('Wallet balance element not found');
    }
}

function loadTransactionHistory(userId) {
    console.log('Loading transaction history for:', userId);
    
    const db = firebase.firestore();
    
    // Get transactions for this employer
    db.collection('transactions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            const transactionsList = document.getElementById('transactions-list');
            
            if (!transactionsList) {
                console.error('Transactions list element not found');
                return;
            }
            
            if (querySnapshot.empty) {
                transactionsList.innerHTML = `
                    <div class="no-transactions">
                        <p>No transactions yet</p>
                        <p class="small-text">Your transaction history will appear here</p>
                    </div>
                `;
                return;
            }
            
            let transactionsHTML = '';
            
            querySnapshot.forEach((doc) => {
                const transaction = doc.data();
                transactionsHTML += createTransactionHTML(transaction);
            });
            
            transactionsList.innerHTML = transactionsHTML;
            
        })
        .catch((error) => {
            console.error('Error loading transactions:', error);
            const transactionsList = document.getElementById('transactions-list');
            if (transactionsList) {
                transactionsList.innerHTML = '<p>Error loading transactions</p>';
            }
        });
}

function createTransactionHTML(transaction) {
    const amount = transaction.amount || 0;
    const type = transaction.type || 'unknown';
    const description = transaction.description || 'Transaction';
    const timestamp = transaction.timestamp ? 
        transaction.timestamp.toDate().toLocaleDateString() : 'Recently';
    
    const amountClass = amount >= 0 ? 'positive' : 'negative';
    const sign = amount >= 0 ? '+' : '';
    
    return `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-description">${description}</div>
                <div class="transaction-date">${timestamp}</div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${sign}$${Math.abs(amount).toFixed(2)}
            </div>
        </div>
    `;
}

function setupWalletEventListeners() {
    // Top-up form submission
    const topupForm = document.getElementById('topup-form');
    if (topupForm) {
        topupForm.addEventListener('submit', handleTopup);
    }
}

function handleTopup(e) {
    e.preventDefault();
    
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in to add funds');
        return;
    }
    
    const amountInput = document.getElementById('topup-amount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    console.log('Processing top-up of:', amount);
    
    // Show loading state
    const submitBtn = topupForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    const db = firebase.firestore();
    const employerRef = db.collection('employers').doc(user.uid);
    
    // Get current balance and add the new amount
    employerRef.get().then((doc) => {
        const currentBalance = doc.exists ? (doc.data().walletBalance || 0) : 0;
        const newBalance = currentBalance + amount;
        
        // Update wallet balance
        return employerRef.update({
            walletBalance: newBalance,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    })
    .then(() => {
        // Add transaction record
        return db.collection('transactions').add({
            userId: user.uid,
            amount: amount,
            type: 'topup',
            description: 'Wallet top-up',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });
    })
    .then(() => {
        // Success
        console.log('Top-up successful');
        alert(`Successfully added $${amount.toFixed(2)} to your wallet!`);
        
        // Reset form
        topupForm.reset();
        
        // Reload wallet data
        loadWalletData(user.uid);
        loadTransactionHistory(user.uid);
        
    })
    .catch((error) => {
        console.error('Error processing top-up:', error);
        alert('Error processing top-up. Please try again.');
    })
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Run this in console to see what's available
window.debugSections = debugSections;

// Make functions available globally for HTML onclick
// Export functions for global access
window.loadSection = loadSection;
window.openChat = openChat;
window.closeChat = closeChat;
window.sendMessage = sendMessage;
window.showEditProfileModal = showEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.initEmployerWalletSection = initEmployerWalletSection;