// employer-jobs.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the job management section
    if (document.getElementById('job-management')) {
        initializeJobsModule();
    }
});

function initializeJobsModule() {
    // Load employer's jobs when the page is ready
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            loadEmployerJobs(user.uid);
            setupJobFormListener(user.uid);
        }
    });
}

function setupJobFormListener(employerId) {
    const jobForm = document.getElementById('job-form');
    if (jobForm) {
        jobForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveJob(employerId);
        });
    }
    
    // Add event listener for cancel button
    const cancelBtn = document.getElementById('cancel-job-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            resetJobForm();
            showJobListing();
        });
    }
}

function saveJob(employerId) {
    const jobId = document.getElementById('job-id').value;
    const title = document.getElementById('job-title').value;
    const description = document.getElementById('job-description').value;
    const requiredSkills = document.getElementById('job-skills').value.split(',').map(skill => skill.trim());
    const starRequirement = parseInt(document.getElementById('job-star-requirement').value);
    const deadline = document.getElementById('job-deadline').value;
    const pay = parseFloat(document.getElementById('job-pay').value);
    const status = document.getElementById('job-status').value;

    // Basic validation
    if (!title || !description || !deadline || !pay) {
        alert('Please fill in all required fields');
        return;
    }

    // Get employer name from the profile
    const employerName = document.getElementById('profile-name').textContent || 'Company';

    const jobData = {
        title,
        description,
        requiredSkills,
        starRequirement,
        deadline: firebase.firestore.Timestamp.fromDate(new Date(deadline)),
        pay,
        status: 'open', // MAKE SURE THIS IS 'open'
        employerId,
        employerName: employerName,
        isPublic: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add createdAt for new jobs
    if (!jobId) {
        jobData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        jobData.applicationCount = 0;
    }

    console.log("🚀 DEBUG: Posting job with data:", jobData); // ADD THIS LINE

    const db = firebase.firestore();
    
    // Save to Firestore
    if (jobId) {
        // Update existing job
        db.collection('jobs').doc(jobId).update(jobData)
            .then(() => {
                alert('Job updated successfully!');
                resetJobForm();
                loadEmployerJobs(employerId);
                showJobListing();
            })
            .catch((error) => {
                console.error('Error updating job: ', error);
                alert('Error updating job. Please try again.');
            });
    } else {
        // Add new job
        db.collection('jobs').add(jobData)
            .then(() => {
                alert('Job posted successfully!');
                resetJobForm();
                loadEmployerJobs(employerId);
                showJobListing();
            })
            .catch((error) => {
                console.error('Error adding job: ', error);
                alert('Error posting job. Please try again.');
            });
    }
}

function loadEmployerJobs(employerId) {
    const jobsList = document.getElementById('jobs-list');
    if (!jobsList) return;

    // Show loading state
    jobsList.innerHTML = '<div class="loading">Loading your jobs...</div>';

    const db = firebase.firestore();
    db.collection('jobs')
        .where('employerId', '==', employerId)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            jobsList.innerHTML = ''; // Clear loading state
            
            if (querySnapshot.empty) {
                jobsList.innerHTML = '<div class="no-jobs">You haven\'t posted any jobs yet.</div>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const job = doc.data();
                const jobId = doc.id;
                const jobCard = createJobCard(job, jobId, employerId);
                jobsList.appendChild(jobCard);
            });
        })
        .catch((error) => {
            console.error('Error getting jobs: ', error);
            jobsList.innerHTML = '<div class="error">Error loading jobs. Please try again.</div>';
        });
}

function createJobCard(job, jobId, employerId) {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.dataset.id = jobId;

    // Format deadline date
    const deadlineDate = job.deadline ? job.deadline.toDate().toLocaleDateString() : 'Not specified';
    
    // Status badge
    const statusClass = job.status === 'open' ? 'status-open' : 'status-closed';
    
    jobCard.innerHTML = `
        <div class="job-card-header">
            <h3>${job.title}</h3>
            <span class="status-badge ${statusClass}">${job.status}</span>
        </div>
        <div class="job-card-body">
            <p class="job-description">${job.description}</p>
            <div class="job-details">
                <div class="detail-item">
                    <span class="detail-label">Skills:</span>
                    <span class="detail-value">${job.requiredSkills ? job.requiredSkills.join(', ') : 'Not specified'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Star Requirement:</span>
                    <span class="detail-value">${'★'.repeat(job.starRequirement || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Deadline:</span>
                    <span class="detail-value">${deadlineDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pay:</span>
                    <span class="detail-value">$${job.pay ? job.pay.toFixed(2) : '0.00'}</span>
                </div>
            </div>
        </div>
        <div class="job-card-actions">
            <button class="btn-edit-job" data-id="${jobId}">Edit</button>
            <button class="btn-delete-job" data-id="${jobId}">Delete</button>
            <button class="btn-toggle-status" data-id="${jobId}" data-status="${job.status}">
                ${job.status === 'open' ? 'Close' : 'Open'}
            </button>
        </div>
    `;

    // Add event listeners to buttons
    jobCard.querySelector('.btn-edit-job').addEventListener('click', () => editJob(jobId, employerId));
    jobCard.querySelector('.btn-delete-job').addEventListener('click', () => deleteJob(jobId, employerId));
    jobCard.querySelector('.btn-toggle-status').addEventListener('click', () => toggleJobStatus(jobId, job.status, employerId));

    return jobCard;
}

function editJob(jobId, employerId) {
    const db = firebase.firestore();
    db.collection('jobs').doc(jobId).get()
        .then((doc) => {
            if (doc.exists) {
                const job = doc.data();
                populateJobForm(job, jobId);
                showJobForm();
            }
        })
        .catch((error) => {
            console.error('Error getting job: ', error);
            alert('Error loading job details. Please try again.');
        });
}

function populateJobForm(job, jobId) {
    document.getElementById('job-id').value = jobId;
    document.getElementById('job-title').value = job.title || '';
    document.getElementById('job-description').value = job.description || '';
    document.getElementById('job-skills').value = job.requiredSkills ? job.requiredSkills.join(', ') : '';
    document.getElementById('job-star-requirement').value = job.starRequirement || 1;
    
    // Format deadline for input field (YYYY-MM-DD)
    if (job.deadline) {
        const deadlineDate = job.deadline.toDate();
        const formattedDate = deadlineDate.toISOString().split('T')[0];
        document.getElementById('job-deadline').value = formattedDate;
    } else {
        document.getElementById('job-deadline').value = '';
    }
    
    document.getElementById('job-pay').value = job.pay || '';
    document.getElementById('job-status').value = job.status || 'open';
    
    // Update form title
    document.getElementById('form-title').textContent = 'Edit Job';
    document.getElementById('submit-job-btn').textContent = 'Update Job';
}

function deleteJob(jobId, employerId) {
    if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        const db = firebase.firestore();
        db.collection('jobs').doc(jobId).delete()
            .then(() => {
                alert('Job deleted successfully!');
                loadEmployerJobs(employerId);
            })
            .catch((error) => {
                console.error('Error deleting job: ', error);
                alert('Error deleting job. Please try again.');
            });
    }
}

function toggleJobStatus(jobId, currentStatus, employerId) {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    
    const db = firebase.firestore();
    db.collection('jobs').doc(jobId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        loadEmployerJobs(employerId);
    })
    .catch((error) => {
        console.error('Error updating job status: ', error);
        alert('Error updating job status. Please try again.');
    });
}

function showJobForm() {
    document.getElementById('job-listing').style.display = 'none';
    document.getElementById('job-form-container').style.display = 'block';
}

function showJobListing() {
    document.getElementById('job-form-container').style.display = 'none';
    document.getElementById('job-listing').style.display = 'block';
}

function resetJobForm() {
    document.getElementById('job-form').reset();
    document.getElementById('job-id').value = '';
    document.getElementById('form-title').textContent = 'Post New Job';
    document.getElementById('submit-job-btn').textContent = 'Post Job';
}

// Make functions available globally for HTML onclick attributes
window.postNewJob = function() {
    resetJobForm();
    showJobForm();
};

window.cancelJobEdit = function() {
    resetJobForm();
    showJobListing();
};

