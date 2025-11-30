// candidate-jobs.js - Job Applications module for Candidate Dashboard

// Global variables
let jobListings = [];
let currentJob = null;
let myApplications = [];

// Initialize the jobs section
function initJobsSection(user, candidateData) {
    console.log("Initializing Jobs Section");
    
    // Load job listings
    loadJobListings();
    
    // Load my applications
    loadMyApplications(user.uid);
    
    // Set up event listeners for jobs section
    setupJobsEventListeners();
}

// Fetch job listings from Firestore
async function loadJobListings() {
    try {
        const db = firebase.firestore();
        const jobsSnapshot = await db.collection('jobs')
            .where('status', '==', 'open')
            .where('isPublic', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        console.log(`🎯 Final query result: ${jobsSnapshot.size} jobs`);
        
        jobListings = [];
        jobsSnapshot.forEach(doc => {
            const jobData = doc.data();
            console.log(`📝 Processing job: ${jobData.title}`);
            jobListings.push({
                id: doc.id,
                ...jobData,
                company: jobData.employerName || 'Company',
                postedDate: jobData.createdAt,
                starLevelRequired: jobData.starRequirement || 1,
                location: jobData.location || 'Remote',
                companyId: jobData.employerId || ''
            });
        });
        
        console.log(`🎉 Ready to display: ${jobListings.length} jobs`);
        displayJobListings();
        
    } catch (error) {
        console.error("❌ Error loading job listings:", error);
        document.querySelector('#jobs-section .content-grid').innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p class="error-message">Unable to load job listings: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

// Load my job applications
async function loadMyApplications(userId) {
    try {
        const db = firebase.firestore();
        const applicationsSnapshot = await db.collection('applications')
            .where('candidateId', '==', userId)
            .orderBy('appliedDate', 'desc')
            .get();
        
        myApplications = [];
        applicationsSnapshot.forEach(doc => {
            const application = doc.data();
            application.id = doc.id;
            myApplications.push(application);
        });
        
        console.log(`📋 Loaded ${myApplications.length} job applications`);
        displayMyApplications();
        
    } catch (error) {
        console.error("Error loading applications:", error);
    }
}

// Display my applications
function displayMyApplications() {
    const applicationsContainer = document.getElementById('my-job-applications');
    if (!applicationsContainer) return;
    
    if (myApplications.length === 0) {
        applicationsContainer.innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p>You haven't applied to any jobs yet.</p>
                </div>
            </div>
        `;
        return;
    }
    
    applicationsContainer.innerHTML = myApplications.map(application => `
        <div class="content-card application-item" data-application-id="${application.id}">
            <div class="card-header">
                <h3>${application.jobTitle}</h3>
                <span class="application-status status-${application.status}">${application.status}</span>
            </div>
            <div class="card-content">
                <p><strong>Company:</strong> ${application.employerName}</p>
                <p><strong>Applied:</strong> ${application.appliedDate ? application.appliedDate.toDate().toLocaleDateString() : 'Recently'}</p>
                ${application.status === 'accepted' ? `
                    <div class="accepted-message">
                        <i class="fas fa-check-circle"></i>
                        <strong>Congratulations! Your application has been accepted.</strong>
                        <p>The employer will contact you soon with next steps.</p>
                    </div>
                ` : ''}
                ${application.status === 'rejected' ? `
                    <div class="rejected-message">
                        <i class="fas fa-times-circle"></i>
                        <strong>Application not selected.</strong>
                        <p>Don't worry! Keep applying to other opportunities.</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Display job listings in the grid
function displayJobListings() {
    const jobsGrid = document.querySelector('#jobs-section .content-grid');
    
    // Clear existing content (except the header)
    const header = document.querySelector('#jobs-section .section-header');
    jobsGrid.innerHTML = '';
    jobsGrid.parentNode.insertBefore(header, jobsGrid);
    
    if (jobListings.length === 0) {
        jobsGrid.innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p>No job openings available at the moment. Please check back later.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Create job cards
    jobListings.forEach(job => {
        const jobCard = createJobCard(job);
        jobsGrid.appendChild(jobCard);
    });
}

// Create a job card
function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'content-card job-listing';
    card.dataset.jobId = job.id;
    
    // Skills badges
    const skillsBadges = job.requiredSkills ? job.requiredSkills.map(skill => 
        `<span class="skill-badge">${skill}</span>`
    ).join('') : '';
    
    // Format salary
    let salaryInfo = '';
    if (job.pay) {
        salaryInfo = `$${job.pay.toFixed(2)}`;
    }
    
    // Format location
    const location = job.location || 'Remote';
    
    // Format date
    const postedDate = job.createdAt ? new Date(job.createdAt.toDate()).toLocaleDateString() : 'Recently';
    
    // Check if user has already applied
    checkIfApplied(job.id).then(hasApplied => {
        const application = myApplications.find(app => app.jobId === job.id);
        const status = application ? application.status : null;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-icon">
                    <i class="fas fa-briefcase"></i>
                </div>
                <h3 class="card-title">${job.title}</h3>
                <span class="company-name">${job.employerName || job.company || 'Company'}</span>
            </div>
            <div class="card-content">
                <p class="job-description">${job.description || 'No description available.'}</p>
                
                <div class="job-details">
                    <div class="job-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${location}</span>
                    </div>
                    ${salaryInfo ? `
                    <div class="job-detail">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${salaryInfo}</span>
                    </div>
                    ` : ''}
                    <div class="job-detail">
                        <i class="fas fa-star"></i>
                        <span>Star Level ${job.starRequirement || 1}+ Required</span>
                    </div>
                </div>
                
                <div class="job-skills">
                    <h4>Required Skills:</h4>
                    <div class="skills-list">
                        ${skillsBadges || '<p>No specific skills required.</p>'}
                    </div>
                </div>
            </div>
            <div class="card-footer">
                ${hasApplied ? 
                    `<span class="application-status ${status}">${status === 'accepted' ? 'Accepted 🎉' : status === 'rejected' ? 'Not Selected' : 'Applied'} <i class="fas fa-${status === 'accepted' ? 'check' : status === 'rejected' ? 'times' : 'clock'}"></i></span>` : 
                    `<button class="apply-job" data-job-id="${job.id}">Apply Now</button>`
                }
                <span class="card-stats">Posted ${postedDate}</span>
            </div>
        `;
        
        // Add event listener to the apply button if not applied
        if (!hasApplied) {
            const button = card.querySelector('.apply-job');
            if (button) {
                button.addEventListener('click', function() {
                    console.log("Apply button clicked for job:", job.id);
                    showApplicationForm(job);
                });
            }
        }
    });
    
    return card;
}

// Check if user has already applied to a job
async function checkIfApplied(jobId) {
    try {
        const db = firebase.firestore();
        const currentUser = firebase.auth().currentUser;
        
        const applicationDoc = await db.collection('applications')
            .where('candidateId', '==', currentUser.uid)
            .where('jobId', '==', jobId)
            .get();
            
        return !applicationDoc.empty;
    } catch (error) {
        console.error("Error checking application status:", error);
        return false;
    }
}

// Show application form
function showApplicationForm(job) {
    currentJob = job;
    const currentUser = firebase.auth().currentUser;
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Apply for ${job.title}</h3>
                <button class="close-modal" type="button">&times;</button>
            </div>
            <div class="modal-body">
                <form id="job-application-form">
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
                        <label for="applicant-cover">Cover Letter (Optional)</label>
                        <textarea id="applicant-cover" rows="4" 
                                  placeholder="Why are you interested in this position?"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Submit Application</button>
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
    const form = modal.querySelector('#job-application-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Job application form submitted");
        submitApplication(job);
    });
}

// Submit job application
async function submitApplication(job) {
    try {
        console.log("🚀 Starting job application submission...");
        
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error("❌ No user logged in");
            alert("Please log in to apply for jobs");
            return;
        }

        const form = document.getElementById('job-application-form');
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
            const resumeRef = storageRef.child(`resumes/${currentUser.uid}/${Date.now()}_${resumeFile.name}`);
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
            jobId: job.id,
            jobTitle: job.title,
            employerId: job.employerId,
            employerName: job.employerName || 'Company',
            candidateId: currentUser.uid,
            candidateName: document.getElementById('applicant-name').value,
            candidateEmail: document.getElementById('applicant-email').value,
            resumeUrl: resumeUrl,
            coverLetter: document.getElementById('applicant-cover').value,
            status: 'pending',
            appliedDate: firebase.firestore.FieldValue.serverTimestamp(),
            candidateStarLevel: candidateData.starLevel || 1,
            jobStarRequirement: job.starRequirement || 1,
            type: 'job'
        };

        console.log("📝 Application data:", applicationData);

        try {
            await db.collection('applications').add(applicationData);
            console.log("✅ Application saved successfully");
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
        showApplicationSuccess();
        
        // Reload job listings and applications to update status
        loadJobListings();
        loadMyApplications(currentUser.uid);
        
    } catch (error) {
        console.error("❌ Application submission error:", error);
        alert("There was an error submitting your application. Please try again.");
    }
}

// Show application success message
function showApplicationSuccess() {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <h3>Application Submitted!</h3>
            <p>Your application for "${currentJob.title}" has been submitted successfully.</p>
            <p>You will be notified when the employer reviews your application.</p>
            <button class="success-ok-btn">OK</button>
        </div>
    `;
    
    document.body.appendChild(successMsg);
    
    // Add event listener
    successMsg.querySelector('.success-ok-btn').addEventListener('click', () => {
        document.body.removeChild(successMsg);
    });
}

// Set up real-time listener for application status changes
function setupApplicationStatusListener(userId) {
    const db = firebase.firestore();
    
    // Listen for job application status changes
    db.collection('applications')
        .where('candidateId', '==', userId)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const application = change.doc.data();
                    console.log('Application status updated:', application.status);
                    
                    // Show notification to user
                    if (application.status === 'accepted') {
                        showAcceptanceNotification(application);
                    } else if (application.status === 'rejected') {
                        showRejectionNotification(application);
                    }
                    
                    // Reload applications to update UI
                    loadMyApplications(userId);
                    loadJobListings();
                }
            });
        });
}

// Show acceptance notification
function showAcceptanceNotification(application) {
    const notification = document.createElement('div');
    notification.className = 'notification acceptance-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <div class="notification-text">
                <h4>🎉 Application Accepted!</h4>
                <p>Your application for "${application.jobTitle}" has been accepted by ${application.employerName}!</p>
                <p>They will contact you soon with next steps.</p>
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

// Show rejection notification
function showRejectionNotification(application) {
    const notification = document.createElement('div');
    notification.className = 'notification rejection-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-times-circle"></i>
            <div class="notification-text">
                <h4>Application Update</h4>
                <p>Your application for "${application.jobTitle}" was not selected.</p>
                <p>Don't worry! Keep applying to other opportunities.</p>
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

// Set up event listeners for the jobs section
function setupJobsEventListeners() {
    // Set up real-time listener for application status changes
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        setupApplicationStatusListener(currentUser.uid);
    }
}