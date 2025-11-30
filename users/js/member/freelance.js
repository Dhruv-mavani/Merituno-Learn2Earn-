// candidate-freelance.js - Freelance Tasks module for Candidate Dashboard

// Global variables
let freelanceTasks = [];
let currentTask = null;
let myFreelanceApplications = [];

// Initialize the freelance section
function initFreelanceSection(user, candidateData) {
    console.log("Initializing Freelance Section");
    
    // Load freelance tasks
    loadFreelanceTasks();
    
    // Load my freelance applications
    loadMyFreelanceApplications(user.uid);
    
    // Set up event listeners for freelance section
    setupFreelanceEventListeners();
}

// Fetch freelance tasks from Firestore
async function loadFreelanceTasks() {
    try {
        const db = firebase.firestore();
        
        console.log("🔍 DEBUG: Checking freelance collection...");
        
        // First, check ALL tasks in freelance collection
        const allTasks = await db.collection('freelance').get();
        console.log(`📊 DEBUG: Total tasks in 'freelance' collection: ${allTasks.size}`);
        
        allTasks.forEach(doc => {
            const task = doc.data();
            console.log(`📄 Task: ${task.title || 'No Title'}`, {
                id: doc.id,
                status: task.status,
                isPublic: task.isPublic,
                employerName: task.employerName,
                hasRequiredFields: {
                    status: !!task.status,
                    isPublic: !!task.isPublic,
                    employerName: !!task.employerName
                }
            });
        });
        
        // Now try our query
        const tasksSnapshot = await db.collection('freelance')
            .where('status', '==', 'open')
            .where('isPublic', '==', true)
            .get();
        
        console.log(`🎯 Query found: ${tasksSnapshot.size} tasks`);
        
        freelanceTasks = [];
        tasksSnapshot.forEach(doc => {
            const taskData = doc.data();
            console.log(`✅ Including task: ${taskData.title}`);
            freelanceTasks.push({
                id: doc.id,
                ...taskData,
                client: taskData.employerName || 'Client',
                postedDate: taskData.createdAt,
                starLevelRequired: taskData.starRequirement || 1,
                budget: taskData.pay,
                clientId: taskData.employerId || '',
                budgetType: 'fixed'
            });
        });
        
        console.log(`🎉 Ready to display: ${freelanceTasks.length} freelance tasks`);
        displayFreelanceTasks();
        
    } catch (error) {
        console.error("Error loading freelance tasks:", error);
        document.querySelector('#freelance-section .content-grid').innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p class="error-message">Unable to load freelance tasks. Please try again later.</p>
                </div>
            </div>
        `;
    }
}

// Load my freelance applications
async function loadMyFreelanceApplications(userId) {
    try {
        const db = firebase.firestore();
        const applicationsSnapshot = await db.collection('freelanceApplications')
            .where('candidateId', '==', userId)
            .orderBy('appliedDate', 'desc')
            .get();
        
        myFreelanceApplications = [];
        applicationsSnapshot.forEach(doc => {
            const application = doc.data();
            application.id = doc.id;
            myFreelanceApplications.push(application);
        });
        
        console.log(`📋 Loaded ${myFreelanceApplications.length} freelance applications`);
        displayMyFreelanceApplications();
        
    } catch (error) {
        console.error("Error loading freelance applications:", error);
    }
}

// Display my freelance applications
function displayMyFreelanceApplications() {
    const applicationsContainer = document.getElementById('my-freelance-applications');
    if (!applicationsContainer) return;
    
    if (myFreelanceApplications.length === 0) {
        applicationsContainer.innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p>You haven't submitted any freelance proposals yet.</p>
                </div>
            </div>
        `;
        return;
    }
    
    applicationsContainer.innerHTML = myFreelanceApplications.map(application => `
        <div class="content-card application-item" data-application-id="${application.id}">
            <div class="card-header">
                <h3>${application.taskTitle}</h3>
                <span class="application-status status-${application.status}">${application.status}</span>
            </div>
            <div class="card-content">
                <p><strong>Client:</strong> ${application.employerName}</p>
                <p><strong>Applied:</strong> ${application.appliedDate ? application.appliedDate.toDate().toLocaleDateString() : 'Recently'}</p>
                <p><strong>Proposal:</strong> ${application.proposal ? application.proposal.substring(0, 100) + '...' : 'No proposal'}</p>
                ${application.status === 'accepted' ? `
                    <div class="accepted-message">
                        <i class="fas fa-check-circle"></i>
                        <strong>Congratulations! Your proposal has been accepted.</strong>
                        <p>The client will contact you soon to discuss project details.</p>
                    </div>
                ` : ''}
                ${application.status === 'rejected' ? `
                    <div class="rejected-message">
                        <i class="fas fa-times-circle"></i>
                        <strong>Proposal not selected.</strong>
                        <p>Keep submitting proposals to other projects!</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Display freelance tasks in the grid
function displayFreelanceTasks() {
    const freelanceGrid = document.querySelector('#freelance-section .content-grid');
    
    // Clear existing content (except the header)
    const header = document.querySelector('#freelance-section .section-header');
    freelanceGrid.innerHTML = '';
    freelanceGrid.parentNode.insertBefore(header, freelanceGrid);
    
    if (freelanceTasks.length === 0) {
        freelanceGrid.innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p>No freelance tasks available at the moment. Please check back later.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Create task cards
    freelanceTasks.forEach(task => {
        const taskCard = createTaskCard(task);
        freelanceGrid.appendChild(taskCard);
    });
}

// Create a task card
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'content-card freelance-task';
    card.dataset.taskId = task.id;
    
    // Skills badges
    const skillsBadges = task.requiredSkills ? task.requiredSkills.map(skill => 
        `<span class="skill-badge">${skill}</span>`
    ).join('') : '';
    
    // Format budget
    let budgetInfo = '';
    if (task.pay) {
        budgetInfo = `$${task.pay.toFixed(2)}`;
    }
    
    // Format deadline
    let deadlineInfo = '';
    if (task.deadline) {
        const deadlineDate = task.deadline.toDate();
        const today = new Date();
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            deadlineInfo = `${diffDays} days left`;
        } else if (diffDays === 0) {
            deadlineInfo = 'Today';
        } else {
            deadlineInfo = 'Expired';
        }
    }
    
    // Format date
    const postedDate = task.createdAt ? new Date(task.createdAt.toDate()).toLocaleDateString() : 'Recently';
    
    // Check if user has already applied
    checkIfAppliedToTask(task.id).then(hasApplied => {
        const application = myFreelanceApplications.find(app => app.taskId === task.id);
        const status = application ? application.status : null;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-icon">
                    <i class="fas fa-laptop-code"></i>
                </div>
                <h3 class="card-title">${task.title}</h3>
                <span class="client-name">${task.employerName || task.client || 'Client'}</span>
            </div>
            <div class="card-content">
                <p class="task-description">${task.description || 'No description available.'}</p>
                
                <div class="task-details">
                    ${budgetInfo ? `
                    <div class="task-detail">
                        <i class="fas fa-dollar-sign"></i>
                        <span>${budgetInfo}</span>
                    </div>
                    ` : ''}
                    ${deadlineInfo ? `
                    <div class="task-detail">
                        <i class="fas fa-clock"></i>
                        <span>${deadlineInfo}</span>
                    </div>
                    ` : ''}
                    <div class="task-detail">
                        <i class="fas fa-star"></i>
                        <span>Star Level ${task.starRequirement || 1}+</span>
                    </div>
                </div>
                
                <div class="task-skills">
                    <h4>Required Skills:</h4>
                    <div class="skills-list">
                        ${skillsBadges || '<p>No specific skills required.</p>'}
                    </div>
                </div>
                
                ${task.proposalsCount !== undefined ? `
                <div class="task-stats">
                    <span class="proposals-count">
                        <i class="fas fa-users"></i> ${task.proposalsCount} proposals
                    </span>
                </div>
                ` : ''}
            </div>
            <div class="card-footer">
                ${hasApplied ? 
                    `<span class="application-status ${status}">${status === 'accepted' ? 'Accepted 🎉' : status === 'rejected' ? 'Not Selected' : 'Applied'} <i class="fas fa-${status === 'accepted' ? 'check' : status === 'rejected' ? 'times' : 'clock'}"></i></span>` : 
                    `<button class="apply-task" data-task-id="${task.id}">Apply Now</button>`
                }
                <span class="card-stats">Posted ${postedDate}</span>
            </div>
        `;
        
        // Add event listener to the apply button if not applied
        if (!hasApplied) {
            const button = card.querySelector('.apply-task');
            if (button) {
                button.addEventListener('click', function() {
                    console.log("Apply button clicked for task:", task.id);
                    showTaskApplicationForm(task);
                });
            }
        }
    });
    
    return card;
}

// Check if user has already applied to a task
async function checkIfAppliedToTask(taskId) {
    try {
        const db = firebase.firestore();
        const currentUser = firebase.auth().currentUser;
        
        const applicationDoc = await db.collection('freelanceApplications')
            .where('candidateId', '==', currentUser.uid)
            .where('taskId', '==', taskId)
            .get();
            
        return !applicationDoc.empty;
    } catch (error) {
        console.error("Error checking application status:", error);
        return false;
    }
}

// Show task application form
function showTaskApplicationForm(task) {
    currentTask = task;
    const currentUser = firebase.auth().currentUser;
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Apply for ${task.title}</h3>
                <button class="close-modal" type="button">&times;</button>
            </div>
            <div class="modal-body">
                <form id="task-application-form">
                    <div class="form-group">
                        <label for="applicant-name">Full Name</label>
                        <input type="text" id="applicant-name" required 
                               value="${candidateData.name || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="applicant-email">Email</label>
                        <input type="email" id="applicant-email" required 
                               value="${candidateData.email || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="applicant-resume">Resume (PDF, DOC, DOCX)</label>
                        <input type="file" id="applicant-resume" accept=".pdf,.doc,.docx" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="applicant-github">GitHub Profile URL</label>
                        <input type="url" id="applicant-github" 
                               placeholder="https://github.com/yourusername">
                    </div>
                    
                    <div class="form-group">
                        <label for="applicant-portfolio">Portfolio/Work Samples (Optional)</label>
                        <input type="file" id="applicant-portfolio" multiple 
                               accept=".jpg,.jpeg,.png,.pdf,.zip">
                        <small>You can upload multiple files (images, PDFs, or ZIP archives)</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="applicant-proposal">Proposal</label>
                        <textarea id="applicant-proposal" rows="4" required
                                  placeholder="Explain why you're the best fit for this task, your approach, and estimated timeline"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Submit Proposal</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Form submission handling
    const form = modal.querySelector('#task-application-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Freelance application form submitted");
        submitTaskApplication(task);
    });
}

// Submit task application
async function submitTaskApplication(task) {
    try {
        console.log("🚀 Starting freelance application submission...");
        
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error("❌ No user logged in");
            alert("Please log in to apply for freelance tasks");
            return;
        }

        const form = document.getElementById('task-application-form');
        if (!form) {
            console.error("❌ Form not found");
            return;
        }

        const resumeFile = document.getElementById('applicant-resume').files[0];
        console.log("📄 Resume file:", resumeFile);

        if (!resumeFile) {
            alert("Please upload your resume");
            return;
        }

        // Validate file size (max 5MB)
        if (resumeFile.size > 5 * 1024 * 1024) {
            alert('Resume file must be less than 5MB');
            return;
        }

        console.log("⬆️ Uploading resume...");
        
        // Upload resume to Firebase Storage
        let resumeUrl = '';
        try {
            const storageRef = firebase.storage().ref();
            const resumeRef = storageRef.child(`freelance/resumes/${currentUser.uid}/${Date.now()}_${resumeFile.name}`);
            const snapshot = await resumeRef.put(resumeFile);
            resumeUrl = await snapshot.ref.getDownloadURL();
            console.log("✅ Resume uploaded:", resumeUrl);
        } catch (uploadError) {
            console.error("❌ Resume upload failed:", uploadError);
            alert("Failed to upload resume. Please try again.");
            return;
        }

        console.log("💾 Saving application to Firestore...");
        
        // Save application to Firestore
        const db = firebase.firestore();
        const applicationData = {
            taskId: task.id,
            taskTitle: task.title,
            employerId: task.employerId,
            employerName: task.employerName || 'Client',
            candidateId: currentUser.uid,
            candidateName: document.getElementById('applicant-name').value,
            candidateEmail: document.getElementById('applicant-email').value,
            resumeUrl: resumeUrl,
            githubUrl: document.getElementById('applicant-github').value,
            proposal: document.getElementById('applicant-proposal').value,
            status: 'pending',
            appliedDate: firebase.firestore.FieldValue.serverTimestamp(),
            candidateStarLevel: candidateData.starLevel || 1,
            taskStarRequirement: task.starRequirement || 1,
            type: 'freelance'
        };

        console.log("📝 Application data:", applicationData);

        try {
            await db.collection('freelanceApplications').add(applicationData);
            console.log("✅ Application saved successfully");
            
            // Update proposals count on the task
            await db.collection('freelance').doc(task.id).update({
                proposalsCount: firebase.firestore.FieldValue.increment(1)
            });
            console.log("✅ Proposals count updated");
            
        } catch (firestoreError) {
            console.error("❌ Firestore save failed:", firestoreError);
            alert("Failed to save application. Please try again.");
            return;
        }

        // Close modal
        const modal = document.querySelector('.modal');
        if (modal) {
            document.body.removeChild(modal);
        }

        // Show success message
        showTaskApplicationSuccess();
        
        // Reload tasks and applications to update status
        loadFreelanceTasks();
        loadMyFreelanceApplications(currentUser.uid);
        
    } catch (error) {
        console.error("❌ Application submission error:", error);
        alert("There was an error submitting your application. Please try again.");
    }
}

// Show task application success message
function showTaskApplicationSuccess() {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <h3>Proposal Submitted!</h3>
            <p>Your proposal for "${currentTask.title}" has been submitted successfully.</p>
            <p>You will be notified when the client reviews your proposal.</p>
            <button class="success-ok-btn">OK</button>
        </div>
    `;
    
    document.body.appendChild(successMsg);
    
    // Add event listener
    successMsg.querySelector('.success-ok-btn').addEventListener('click', () => {
        document.body.removeChild(successMsg);
    });
}

// Set up real-time listener for freelance application status changes
function setupFreelanceApplicationStatusListener(userId) {
    const db = firebase.firestore();
    
    // Listen for freelance application status changes
    db.collection('freelanceApplications')
        .where('candidateId', '==', userId)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const application = change.doc.data();
                    console.log('Freelance application status updated:', application.status);
                    
                    // Show notification to user
                    if (application.status === 'accepted') {
                        showFreelanceAcceptanceNotification(application);
                    } else if (application.status === 'rejected') {
                        showFreelanceRejectionNotification(application);
                    }
                    
                    // Reload applications to update UI
                    loadMyFreelanceApplications(userId);
                    loadFreelanceTasks();
                }
            });
        });
}

// Show freelance acceptance notification
function showFreelanceAcceptanceNotification(application) {
    const notification = document.createElement('div');
    notification.className = 'notification acceptance-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <div class="notification-text">
                <h4>🎉 Proposal Accepted!</h4>
                <p>Your proposal for "${application.taskTitle}" has been accepted by ${application.employerName}!</p>
                <p>They will contact you soon to discuss project details.</p>
            </div>
            <button class="close-notification">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 10000);
    
    // Close button
    notification.querySelector('.close-notification').addEventListener('click', () => {
        document.body.removeChild(notification);
    });
}

// Show freelance rejection notification
function showFreelanceRejectionNotification(application) {
    const notification = document.createElement('div');
    notification.className = 'notification rejection-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-times-circle"></i>
            <div class="notification-text">
                <h4>Proposal Update</h4>
                <p>Your proposal for "${application.taskTitle}" was not selected.</p>
                <p>Keep submitting proposals to other projects!</p>
            </div>
            <button class="close-notification">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 8000);
    
    // Close button
    notification.querySelector('.close-notification').addEventListener('click', () => {
        document.body.removeChild(notification);
    });
}

// Set up event listeners for the freelance section
function setupFreelanceEventListeners() {
    // Set up real-time listener for application status changes
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        setupFreelanceApplicationStatusListener(currentUser.uid);
    }
}