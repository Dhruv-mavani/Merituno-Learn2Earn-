// employer-freelance.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the freelance management section
    if (document.getElementById('freelance-management')) {
        initializeFreelanceModule();
    }
});

function initializeFreelanceModule() {
    // Load employer's freelance tasks when the page is ready
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            loadEmployerFreelanceTasks(user.uid);
            setupFreelanceFormListener(user.uid);
        }
    });
}

function setupFreelanceFormListener(employerId) {
    const freelanceForm = document.getElementById('freelance-form');
    if (freelanceForm) {
        freelanceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveFreelanceTask(employerId);
        });
    }
    
    // Add event listener for cancel button
    const cancelBtn = document.getElementById('cancel-freelance-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            resetFreelanceForm();
            showFreelanceListing();
        });
    }
}

function saveFreelanceTask(employerId) {
    const taskId = document.getElementById('freelance-id').value;
    const title = document.getElementById('freelance-title').value;
    const description = document.getElementById('freelance-description').value;
    const requiredSkills = document.getElementById('freelance-skills').value.split(',').map(skill => skill.trim());
    const starRequirement = parseInt(document.getElementById('freelance-star-requirement').value);
    const deadline = document.getElementById('freelance-deadline').value;
    const pay = parseFloat(document.getElementById('freelance-pay').value);
    const status = document.getElementById('freelance-status').value;

    // Basic validation
    if (!title || !description || !deadline || !pay) {
        alert('Please fill in all required fields');
        return;
    }

    // Get employer name from the profile
    const employerName = document.getElementById('profile-name').textContent || 'Company';

    const taskData = {
        title,
        description,
        requiredSkills,
        starRequirement,
        deadline: firebase.firestore.Timestamp.fromDate(new Date(deadline)),
        pay,
        status: 'open',
        employerId,
        employerName: employerName,
        isPublic: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add createdAt for new tasks
    if (!taskId) {
        taskData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        taskData.applicationCount = 0;
    }

    const db = firebase.firestore();
    
    // Save to Firestore - CORRECT COLLECTION
    if (taskId) {
        // Update existing task
        db.collection('freelance').doc(taskId).update(taskData)
            .then(() => {
                alert('Freelance task updated successfully!');
                resetFreelanceForm();
                loadEmployerFreelanceTasks(employerId);
                showFreelanceListing();
            })
            .catch((error) => {
                console.error('Error updating freelance task: ', error);
                alert('Error updating freelance task. Please try again.');
            });
    } else {
        // Add new task
        db.collection('freelance').add(taskData)
            .then(() => {
                alert('Freelance task posted successfully!');
                resetFreelanceForm();
                loadEmployerFreelanceTasks(employerId);
                showFreelanceListing();
            })
            .catch((error) => {
                console.error('Error adding freelance task: ', error);
                alert('Error posting freelance task. Please try again.');
            });
    }
}

function loadEmployerFreelanceTasks(employerId) {
    const tasksList = document.getElementById('freelance-tasks-list');
    if (!tasksList) return;

    // Show loading state
    tasksList.innerHTML = '<div class="loading">Loading your freelance tasks...</div>';

    const db = firebase.firestore();
    db.collection('freelance')
        .where('employerId', '==', employerId)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            tasksList.innerHTML = ''; // Clear loading state
            
            if (querySnapshot.empty) {
                tasksList.innerHTML = '<div class="no-tasks">You haven\'t posted any freelance tasks yet.</div>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const task = doc.data();
                const taskId = doc.id;
                const taskCard = createFreelanceTaskCard(task, taskId, employerId);
                tasksList.appendChild(taskCard);
            });
        })
        .catch((error) => {
            console.error('Error getting freelance tasks: ', error);
            tasksList.innerHTML = '<div class="error">Error loading freelance tasks. Please try again.</div>';
        });
}

function createFreelanceTaskCard(task, taskId, employerId) {
    const taskCard = document.createElement('div');
    taskCard.className = 'freelance-task-card';
    taskCard.dataset.id = taskId;

    // Format deadline date
    const deadlineDate = task.deadline ? task.deadline.toDate().toLocaleDateString() : 'Not specified';
    
    // Status badge
    const statusClass = task.status === 'open' ? 'status-open' : 'status-closed';
    
    taskCard.innerHTML = `
        <div class="freelance-task-card-header">
            <h3>${task.title}</h3>
            <span class="status-badge ${statusClass}">${task.status}</span>
        </div>
        <div class="freelance-task-card-body">
            <p class="freelance-task-description">${task.description}</p>
            <div class="freelance-task-details">
                <div class="detail-item">
                    <span class="detail-label">Skills:</span>
                    <span class="detail-value">${task.requiredSkills ? task.requiredSkills.join(', ') : 'Not specified'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Star Requirement:</span>
                    <span class="detail-value">${'★'.repeat(task.starRequirement || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Deadline:</span>
                    <span class="detail-value">${deadlineDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pay:</span>
                    <span class="detail-value">$${task.pay ? task.pay.toFixed(2) : '0.00'}</span>
                </div>
            </div>
        </div>
        <div class="freelance-task-card-actions">
            <button class="btn-edit-freelance" data-id="${taskId}">Edit</button>
            <button class="btn-delete-freelance" data-id="${taskId}">Delete</button>
            <button class="btn-toggle-freelance-status" data-id="${taskId}" data-status="${task.status}">
                ${task.status === 'open' ? 'Close' : 'Open'}
            </button>
        </div>
    `;

    // Add event listeners to buttons
    taskCard.querySelector('.btn-edit-freelance').addEventListener('click', () => editFreelanceTask(taskId, employerId));
    taskCard.querySelector('.btn-delete-freelance').addEventListener('click', () => deleteFreelanceTask(taskId, employerId));
    taskCard.querySelector('.btn-toggle-freelance-status').addEventListener('click', () => toggleFreelanceTaskStatus(taskId, task.status, employerId));

    return taskCard;
}

function editFreelanceTask(taskId, employerId) {
    const db = firebase.firestore();
    db.collection('freelance').doc(taskId).get()
        .then((doc) => {
            if (doc.exists) {
                const task = doc.data();
                populateFreelanceForm(task, taskId);
                showFreelanceForm();
            }
        })
        .catch((error) => {
            console.error('Error getting freelance task: ', error);
            alert('Error loading freelance task details. Please try again.');
        });
}

function populateFreelanceForm(task, taskId) {
    document.getElementById('freelance-id').value = taskId;
    document.getElementById('freelance-title').value = task.title || '';
    document.getElementById('freelance-description').value = task.description || '';
    document.getElementById('freelance-skills').value = task.requiredSkills ? task.requiredSkills.join(', ') : '';
    document.getElementById('freelance-star-requirement').value = task.starRequirement || 1;
    
    // Format deadline for input field (YYYY-MM-DD)
    if (task.deadline) {
        const deadlineDate = task.deadline.toDate();
        const formattedDate = deadlineDate.toISOString().split('T')[0];
        document.getElementById('freelance-deadline').value = formattedDate;
    } else {
        document.getElementById('freelance-deadline').value = '';
    }
    
    document.getElementById('freelance-pay').value = task.pay || '';
    document.getElementById('freelance-status').value = task.status || 'open';
    
    // Update form title
    document.getElementById('freelance-form-title').textContent = 'Edit Freelance Task';
    document.getElementById('submit-freelance-btn').textContent = 'Update Task';
}

function deleteFreelanceTask(taskId, employerId) {
    if (confirm('Are you sure you want to delete this freelance task? This action cannot be undone.')) {
        const db = firebase.firestore();
        db.collection('freelance').doc(taskId).delete()
            .then(() => {
                alert('Freelance task deleted successfully!');
                loadEmployerFreelanceTasks(employerId);
            })
            .catch((error) => {
                console.error('Error deleting freelance task: ', error);
                alert('Error deleting freelance task. Please try again.');
            });
    }
}

function toggleFreelanceTaskStatus(taskId, currentStatus, employerId) {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    
    const db = firebase.firestore();
    db.collection('freelance').doc(taskId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        loadEmployerFreelanceTasks(employerId);
    })
    .catch((error) => {
        console.error('Error updating freelance task status: ', error);
        alert('Error updating freelance task status. Please try again.');
    });
}

function showFreelanceForm() {
    document.getElementById('freelance-listing').style.display = 'none';
    document.getElementById('freelance-form-container').style.display = 'block';
}

function showFreelanceListing() {
    document.getElementById('freelance-form-container').style.display = 'none';
    document.getElementById('freelance-listing').style.display = 'block';
}

function resetFreelanceForm() {
    document.getElementById('freelance-form').reset();
    document.getElementById('freelance-id').value = '';
    document.getElementById('freelance-form-title').textContent = 'Post New Freelance Task';
    document.getElementById('submit-freelance-btn').textContent = 'Post Task';
}

// Make functions available globally for HTML onclick attributes
window.postNewFreelanceTask = function() {
    resetFreelanceForm();
    showFreelanceForm();
};

window.cancelFreelanceEdit = function() {
    resetFreelanceForm();
    showFreelanceListing();
};