// users/admin-jobs.js

// Initialize job moderation
function initJobModeration() {
    // Fetch all jobs from Firestore
    fetchAllJobs();
    
    // Set up event listeners
    setupJobEventListeners();
}

// Fetch all jobs from Firestore
function fetchAllJobs() {
    const jobsContainer = document.getElementById('jobs-container');
    if (!jobsContainer) return;
    
    // Show loading state
    jobsContainer.innerHTML = '<div class="loading">Loading jobs...</div>';
    
    // Get reference to jobs collection
    const jobsRef = firebase.firestore().collection('jobs');
    
    // Fetch all jobs
    jobsRef.get().then(jobsSnapshot => {
        // Clear loading state
        jobsContainer.innerHTML = '';
        
        if (jobsSnapshot.empty) {
            jobsContainer.innerHTML = '<div class="no-data">No jobs found.</div>';
            return;
        }
        
        // Process each job
        jobsSnapshot.forEach(doc => {
            const jobData = doc.data();
            // Fetch employer details for each job
            fetchEmployerDetails(jobData.employerId, jobData, doc.id);
        });
    }).catch(error => {
        console.error('Error fetching jobs:', error);
        jobsContainer.innerHTML = '<div class="error">Error loading jobs. Please try again.</div>';
    });
}

// Fetch employer details for a job
function fetchEmployerDetails(employerId, jobData, jobId) {
    const employersRef = firebase.firestore().collection('employers');
    
    employersRef.doc(employerId).get().then(employerDoc => {
        if (employerDoc.exists) {
            const employerData = employerDoc.data();
            // Add job to the list with employer details
            addJobToList({
                id: jobId,
                ...jobData,
                employerName: employerData.companyName || employerData.name || 'Unknown Employer'
            });
        } else {
            // Add job with unknown employer
            addJobToList({
                id: jobId,
                ...jobData,
                employerName: 'Unknown Employer'
            });
        }
    }).catch(error => {
        console.error('Error fetching employer details:', error);
        // Add job with error fetching employer
        addJobToList({
            id: jobId,
            ...jobData,
            employerName: 'Error loading employer'
        });
    });
}

// Add a job to the list
function addJobToList(job) {
    const jobsContainer = document.getElementById('jobs-container');
    if (!jobsContainer) return;
    
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.dataset.jobId = job.id;
    
    jobCard.innerHTML = `
        <div class="job-header">
            <h3 class="job-title">${job.title || 'Untitled Job'}</h3>
            <span class="job-status ${job.status || 'pending'}">${job.status || 'Pending'}</span>
        </div>
        <div class="job-details">
            <p><strong>Employer:</strong> ${job.employerName}</p>
            <p><strong>Star Requirement:</strong> ${'★'.repeat(job.starRequirement || 0)}</p>
            <p><strong>Category:</strong> ${job.category || 'Not specified'}</p>
            <p><strong>Posted:</strong> ${job.createdAt ? formatDate(job.createdAt.toDate()) : 'Unknown date'}</p>
        </div>
        <div class="job-description">
            <p>${job.description || 'No description provided.'}</p>
        </div>
        <div class="job-actions">
            ${job.status === 'approved' ? 
                `<button class="btn-reject" data-job-id="${job.id}">Reject</button>` :
                `<button class="btn-approve" data-job-id="${job.id}">Approve</button>`
            }
            <button class="btn-delete" data-job-id="${job.id}">Delete</button>
        </div>
        <div class="rejection-reason" style="display: none;">
            <textarea placeholder="Reason for rejection (will be sent to employer)" rows="3"></textarea>
            <button class="btn-confirm-reject" data-job-id="${job.id}">Confirm Rejection</button>
            <button class="btn-cancel-reject">Cancel</button>
        </div>
    `;
    
    jobsContainer.appendChild(jobCard);
}

// Format date for display
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Set up event listeners for job actions
function setupJobEventListeners() {
    // Use event delegation for dynamically created elements
    document.addEventListener('click', function(event) {
        // Approve button
        if (event.target.classList.contains('btn-approve')) {
            const jobId = event.target.dataset.jobId;
            approveJob(jobId);
        }
        
        // Reject button
        if (event.target.classList.contains('btn-reject')) {
            const jobId = event.target.dataset.jobId;
            showRejectionReason(jobId);
        }
        
        // Delete button
        if (event.target.classList.contains('btn-delete')) {
            const jobId = event.target.dataset.jobId;
            deleteJob(jobId);
        }
        
        // Confirm rejection button
        if (event.target.classList.contains('btn-confirm-reject')) {
            const jobId = event.target.dataset.jobId;
            const jobCard = event.target.closest('.job-card');
            const reasonTextarea = jobCard.querySelector('.rejection-reason textarea');
            const reason = reasonTextarea.value.trim();
            
            if (reason) {
                rejectJob(jobId, reason);
            } else {
                alert('Please provide a reason for rejection.');
            }
        }
        
        // Cancel rejection button
        if (event.target.classList.contains('btn-cancel-reject')) {
            const jobCard = event.target.closest('.job-card');
            const rejectionReason = jobCard.querySelector('.rejection-reason');
            rejectionReason.style.display = 'none';
        }
    });
}

// Show rejection reason input
function showRejectionReason(jobId) {
    const jobCard = document.querySelector(`.job-card[data-job-id="${jobId}"]`);
    if (!jobCard) return;
    
    const rejectionReason = jobCard.querySelector('.rejection-reason');
    rejectionReason.style.display = 'block';
}

// Approve a job
function approveJob(jobId) {
    if (!confirm('Are you sure you want to approve this job?')) return;
    
    firebase.firestore().collection('jobs').doc(jobId).update({
        status: 'approved',
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
        reviewedBy: firebase.auth().currentUser.uid
    }).then(() => {
        alert('Job approved successfully.');
        updateJobStatusUI(jobId, 'approved');
    }).catch(error => {
        console.error('Error approving job:', error);
        alert('Error approving job. Please try again.');
    });
}

// Reject a job and notify employer
function rejectJob(jobId, reason) {
    if (!confirm('Are you sure you want to reject this job?')) return;
    
    // First update the job status
    firebase.firestore().collection('jobs').doc(jobId).update({
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
        reviewedBy: firebase.auth().currentUser.uid
    }).then(() => {
        // Then notify the employer
        notifyEmployer(jobId, reason);
        alert('Job rejected successfully. Employer will be notified.');
        updateJobStatusUI(jobId, 'rejected');
    }).catch(error => {
        console.error('Error rejecting job:', error);
        alert('Error rejecting job. Please try again.');
    });
}

// Notify employer about job rejection
function notifyEmployer(jobId, reason) {
    // Get job details first
    firebase.firestore().collection('jobs').doc(jobId).get().then(jobDoc => {
        if (jobDoc.exists) {
            const jobData = jobDoc.data();
            
            // Get employer details
            firebase.firestore().collection('employers').doc(jobData.employerId).get().then(employerDoc => {
                if (employerDoc.exists) {
                    const employerData = employerDoc.data();
                    const employerEmail = employerData.email;
                    
                    // Send email notification (this would be implemented with a cloud function or email service)
                    sendRejectionEmail(employerEmail, jobData.title, reason);
                    
                    // Also add a notification to the employer's account
                    addEmployerNotification(jobData.employerId, jobId, jobData.title, reason);
                }
            });
        }
    });
}

// Send rejection email to employer (pseudo-implementation)
function sendRejectionEmail(employerEmail, jobTitle, reason) {
    // In a real implementation, this would call a cloud function or email service
    console.log(`Sending rejection email to ${employerEmail} for job "${jobTitle}" with reason: ${reason}`);
    
    // Example of what would be sent to a cloud function:
    /*
    fetch('https://yourapi.com/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            to: employerEmail,
            subject: `Your job posting "${jobTitle}" has been reviewed`,
            html: `
                <h2>Job Posting Update</h2>
                <p>Your job posting "${jobTitle}" has been reviewed by our team.</p>
                <p><strong>Status:</strong> Rejected</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>Please review our posting guidelines and make necessary changes before resubmitting.</p>
            `
        })
    });
    */
}

// Add notification to employer's account
function addEmployerNotification(employerId, jobId, jobTitle, reason) {
    const notificationsRef = firebase.firestore().collection('employers').doc(employerId).collection('notifications');
    
    notificationsRef.add({
        type: 'job_rejected',
        title: `Job Rejected: ${jobTitle}`,
        message: `Your job posting "${jobTitle}" was rejected. Reason: ${reason}`,
        jobId: jobId,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(error => {
        console.error('Error adding notification:', error);
    });
}

// Delete a job
function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    
    firebase.firestore().collection('jobs').doc(jobId).delete().then(() => {
        alert('Job deleted successfully.');
        // Remove the job card from the UI
        const jobCard = document.querySelector(`.job-card[data-job-id="${jobId}"]`);
        if (jobCard) {
            jobCard.remove();
        }
    }).catch(error => {
        console.error('Error deleting job:', error);
        alert('Error deleting job. Please try again.');
    });
}

// Update job status in the UI
function updateJobStatusUI(jobId, status) {
    const jobCard = document.querySelector(`.job-card[data-job-id="${jobId}"]`);
    if (!jobCard) return;
    
    // Update status badge
    const statusBadge = jobCard.querySelector('.job-status');
    statusBadge.textContent = status;
    statusBadge.className = `job-status ${status}`;
    
    // Update buttons
    const jobActions = jobCard.querySelector('.job-actions');
    if (status === 'approved') {
        jobActions.innerHTML = `
            <button class="btn-reject" data-job-id="${jobId}">Reject</button>
            <button class="btn-delete" data-job-id="${jobId}">Delete</button>
        `;
    } else if (status === 'rejected') {
        jobActions.innerHTML = `
            <button class="btn-approve" data-job-id="${jobId}">Approve</button>
            <button class="btn-delete" data-job-id="${jobId}">Delete</button>
        `;
    }
    
    // Hide rejection reason if visible
    const rejectionReason = jobCard.querySelector('.rejection-reason');
    rejectionReason.style.display = 'none';
}

// Initialize when the job moderation section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Watch for when the job moderation section becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const jobModerationSection = document.getElementById('job-moderation');
                if (jobModerationSection && jobModerationSection.style.display !== 'none') {
                    initJobModeration();
                }
            }
        });
    });
    
    // Start observing the job moderation section
    const jobModerationSection = document.getElementById('job-moderation');
    if (jobModerationSection) {
        observer.observe(jobModerationSection, { attributes: true });
    }
});