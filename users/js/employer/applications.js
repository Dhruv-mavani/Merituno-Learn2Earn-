// employer-applications.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the applications section
    if (document.getElementById('applications')) {
        initializeApplicationsModule();
    }
});

function initializeApplicationsModule() {
    // Load applications when the page is ready
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            loadEmployerApplications(user.uid);
            setupApplicationsFilter();
        }
    });
}

function setupApplicationsFilter() {
    const filterSelect = document.getElementById('applications-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const status = this.value;
            filterApplications(status);
        });
    }
}

function loadEmployerApplications(employerId) {
    const applicationsList = document.getElementById('applications-list');
    if (!applicationsList) return;

    // Show loading state
    applicationsList.innerHTML = '<div class="loading">Loading applications...</div>';

    const db = firebase.firestore();
    
    // Get BOTH job and freelance applications
    Promise.all([
        // Job applications from 'applications' collection
        db.collection('applications')
            .where('employerId', '==', employerId)
            .orderBy('appliedDate', 'desc')
            .get(),
            
        // Freelance applications from 'freelanceApplications' collection  
        db.collection('freelanceApplications')
            .where('employerId', '==', employerId)
            .orderBy('appliedDate', 'desc')
            .get()
    ])
    .then(([jobAppsSnapshot, freelanceAppsSnapshot]) => {
        applicationsList.innerHTML = '';
        
        const allApplications = [];
        
        // Process job applications
        jobAppsSnapshot.forEach(doc => {
            const application = doc.data();
            application.id = doc.id;
            application.type = 'job';
            allApplications.push(application);
        });
        
        // Process freelance applications  
        freelanceAppsSnapshot.forEach(doc => {
            const application = doc.data();
            application.id = doc.id;
            application.type = 'freelance';
            // Map fields to match your display
            application.message = application.proposal || 'No proposal provided';
            application.xpLevel = application.candidateStarLevel || 'Not specified';
            application.skills = []; // You can get skills from candidate profile if needed
            allApplications.push(application);
        });
        
        if (allApplications.length === 0) {
            applicationsList.innerHTML = '<div class="no-applications">No applications found.</div>';
            return;
        }
        
        // Sort by date (newest first)
        allApplications.sort((a, b) => {
            const dateA = a.appliedDate ? a.appliedDate.toDate() : new Date(0);
            const dateB = b.appliedDate ? b.appliedDate.toDate() : new Date(0);
            return dateB - dateA;
        });
        
        // Display applications
        allApplications.forEach(application => {
            const applicationCard = createApplicationCard(application);
            applicationsList.appendChild(applicationCard);
        });
    })
    .catch((error) => {
        console.error('Error getting applications: ', error);
        applicationsList.innerHTML = '<div class="error">Error loading applications. Please try again.</div>';
    });
}

function createApplicationCard(application) {
    const applicationCard = document.createElement('div');
    applicationCard.className = 'application-card';
    applicationCard.dataset.id = application.id;
    applicationCard.dataset.status = application.status || 'pending';
    applicationCard.dataset.type = application.type || 'job';
    
    // Format date
    const appDate = application.appliedDate ? application.appliedDate.toDate().toLocaleDateString() : 'Date not available';
    
    // Status badge
    const statusClass = application.status === 'accepted' ? 'status-accepted' : 
                        application.status === 'rejected' ? 'status-rejected' : 'status-pending';
    
    applicationCard.innerHTML = `
        <div class="application-card-header">
            <div class="application-type">${application.type === 'job' ? 'Job Application' : 'Freelance Proposal'}</div>
            <span class="status-badge ${statusClass}">${application.status || 'pending'}</span>
        </div>
        <div class="application-card-body">
            <div class="candidate-info">
                <h3>${application.candidateName || 'Unknown Candidate'}</h3>
                <p class="candidate-email">${application.candidateEmail || 'No email provided'}</p>
                <p class="candidate-xp">Star Level: ${application.candidateStarLevel || 'Not specified'}</p>
            </div>
            
            <div class="application-details">
                <div class="detail-item">
                    <span class="detail-label">Position:</span>
                    <span class="detail-value">${application.jobTitle || application.taskTitle || 'Unknown'}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">${application.type === 'job' ? 'Cover Letter' : 'Proposal'}:</span>
                    <p class="application-message">${application.coverLetter || application.proposal || 'No message provided'}</p>
                </div>
                
                ${application.type === 'freelance' ? `
                <div class="detail-item">
                    <span class="detail-label">GitHub:</span>
                    <span class="detail-value">
                        ${application.githubUrl ? 
                            `<a href="${application.githubUrl}" target="_blank">View GitHub</a>` : 
                            'Not provided'}
                    </span>
                </div>
                ` : ''}
                
                <div class="detail-item">
                    <span class="detail-label">Resume:</span>
                    <span class="detail-value">
                        ${application.resumeUrl ? 
                            `<a href="${application.resumeUrl}" target="_blank">View Resume</a>` : 
                            'Not provided'}
                    </span>
                </div>
            </div>
        </div>
        <div class="application-card-footer">
            <div class="application-date">Applied on: ${appDate}</div>
            <div class="application-actions">
                ${application.status !== 'accepted' ? `
                <button class="btn-accept-application" 
                        data-application-id="${application.id}" 
                        data-application-type="${application.type}">
                    Accept
                </button>
                ` : ''}
                ${application.status !== 'rejected' ? `
                <button class="btn-reject-application" 
                        data-application-id="${application.id}" 
                        data-application-type="${application.type}">
                    Reject
                </button>
                ` : ''}
            </div>
        </div>
    `;

    // Add event listeners to buttons
    const acceptBtn = applicationCard.querySelector('.btn-accept-application');
    const rejectBtn = applicationCard.querySelector('.btn-reject-application');
    
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const applicationId = this.getAttribute('data-application-id');
            const applicationType = this.getAttribute('data-application-type');
            
            console.log("🔄 Accept button clicked:", {
                applicationId: applicationId,
                applicationType: applicationType
            });
            
            if (applicationId && applicationType) {
                acceptApplication(applicationId, applicationType);
            } else {
                alert('Error: Missing application data');
            }
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const applicationId = this.getAttribute('data-application-id');
            const applicationType = this.getAttribute('data-application-type');
            
            if (applicationId && applicationType) {
                rejectApplication(applicationId, applicationType);
            } else {
                alert('Error: Missing application data');
            }
        });
    }

    return applicationCard;
}

// FIXED: acceptApplication function (CORRECT VERSION)
async function acceptApplication(applicationId, applicationType) {
    try {
        console.log("🔵 Accepting application:", applicationId, applicationType);
        
        // VALIDATE applicationId first
        if (!applicationId || typeof applicationId !== 'string') {
            console.error("❌ Invalid applicationId:", applicationId);
            alert('Invalid application ID');
            return;
        }
        
        if (!applicationType || (applicationType !== 'job' && applicationType !== 'freelance')) {
            console.error("❌ Invalid applicationType:", applicationType);
            alert('Invalid application type');
            return;
        }
        
        const db = firebase.firestore();
        
        // Determine the correct collection
        const collectionName = applicationType === 'job' ? 'applications' : 'freelanceApplications';
        console.log("Using collection:", collectionName, "with ID:", applicationId);
        
        // Get application document reference
        let applicationRef;
        try {
            applicationRef = db.collection(collectionName).doc(applicationId);
            console.log("Application ref created:", applicationRef);
        } catch (refError) {
            console.error("❌ Error creating document reference:", refError);
            alert('Error creating document reference');
            return;
        }
        
        // First get the application data
        let applicationDoc;
        try {
            applicationDoc = await applicationRef.get();
            console.log("Application doc retrieved:", applicationDoc);
        } catch (getError) {
            console.error("❌ Error getting application document:", getError);
            alert('Error loading application data');
            return;
        }
        
        if (!applicationDoc.exists) {
            alert('Application not found!');
            return;
        }
        
        const application = applicationDoc.data();
        console.log("📄 Application data:", application);
        
        // Validate required fields in application data
        if (!application.employerId || !application.candidateId) {
            console.error("❌ Missing required fields in application:", {
                employerId: application.employerId,
                candidateId: application.candidateId
            });
            alert('Application data is incomplete');
            return;
        }
        
        // Update application status
        await applicationRef.update({
            status: 'accepted',
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("✅ Application status updated to accepted");

        // Create chat room
        const chatCreated = await createChatRoom(application, applicationType, applicationId);
        
        if (chatCreated) {
            alert('✅ Application accepted! Chat room created.');
            // Reload applications to update UI
            setTimeout(() => {
                loadEmployerApplications(application.employerId);
            }, 1000);
        } else {
            alert('⚠️ Application accepted but failed to create chat room.');
        }
        
    } catch (error) {
        console.error('❌ Error accepting application:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        alert('Error accepting application: ' + error.message);
    }
}

// FIXED: rejectApplication function
async function rejectApplication(applicationId, applicationType) {
    try {
        console.log("🔵 Rejecting application:", applicationId, applicationType);
        
        if (!applicationId || typeof applicationId !== 'string') {
            console.error("❌ Invalid applicationId:", applicationId);
            alert('Invalid application ID');
            return;
        }
        
        const db = firebase.firestore();
        const collectionName = applicationType === 'job' ? 'applications' : 'freelanceApplications';
        const applicationRef = db.collection(collectionName).doc(applicationId);
        
        // Get application to get employerId for reload
        const applicationDoc = await applicationRef.get();
        if (!applicationDoc.exists) {
            alert('Application not found!');
            return;
        }
        
        const application = applicationDoc.data();
        
        // Update application status
        await applicationRef.update({
            status: 'rejected',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Application rejected.');
        
        // Reload applications to reflect the new status
        setTimeout(() => {
            loadEmployerApplications(application.employerId);
        }, 1000);
        
    } catch (error) {
        console.error('Error rejecting application:', error);
        alert('Error rejecting application: ' + error.message);
    }
}

// FIXED: createChatRoom function
async function createChatRoom(application, applicationType, applicationId) {
    try {
        console.log("🔵 Creating chat room...");
        console.log("Application details:", {
            applicationId: applicationId,
            employerId: application.employerId,
            candidateId: application.candidateId,
            candidateName: application.candidateName,
            employerName: application.employerName,
            title: application.jobTitle || application.taskTitle
        });

        // Validate required fields
        if (!application.employerId || !application.candidateId) {
            console.error("❌ Missing required fields:", {
                employerId: application.employerId,
                candidateId: application.candidateId
            });
            return false;
        }

        const chatId = `${application.employerId}_${application.candidateId}_${applicationId}`;
        console.log("Generated chatId:", chatId);
        
        // Create welcome message FIRST with regular timestamp
        const welcomeMessage = {
            id: Date.now().toString(),
            sender: application.employerId,
            content: `Welcome! I've accepted your ${applicationType} application. Let's discuss the project details.`,
            type: 'text',
            timestamp: new Date(), // Use regular Date object, not FieldValue
            read: false
        };

        // Create chat data with the welcome message included
        const chatData = {
            chatId: chatId,
            participants: {
                employer: application.employerId,
                member: application.candidateId
            },
            project: {
                id: applicationId,
                type: applicationType,
                title: application.jobTitle || application.taskTitle || 'Project'
            },
            messages: [welcomeMessage], // Include the welcome message in initial array
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastActivity: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("📝 Chat data to create:", chatData);

        // Create the chat document with the initial message
        await firebase.firestore().collection('chats').doc(chatId).set(chatData);
        console.log("✅ Chat document created with welcome message");

        return true;
        
    } catch (error) {
        console.error('❌ Error creating chat room:', error);
        console.error('Chat creation error details:', {
            message: error.message,
            stack: error.stack
        });
        return false;
    }
}

function filterApplications(status) {
    const applications = document.querySelectorAll('.application-card');
    
    applications.forEach(app => {
        if (status === 'all' || app.dataset.status === status) {
            app.style.display = 'block';
        } else {
            app.style.display = 'none';
        }
    });
}

// Mock functions for email and payment processing (to be implemented fully later)
function sendAcceptanceEmail(application) {
    // This would integrate with your email service (SendGrid, Mailgun, etc.)
    console.log(`Sending acceptance email to: ${application.candidateEmail}`);
    // Implementation would go here
}

function sendRejectionEmail(application) {
    // This would integrate with your email service
    console.log(`Sending rejection email to: ${application.candidateEmail}`);
    // Implementation would go here
}

function processMockPayment(application) {
    // This would handle the wallet transactions
    console.log(`Processing mock payment for application: ${application.id}`);
}