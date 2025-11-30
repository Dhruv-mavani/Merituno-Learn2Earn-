// users/admin-freelance.js

// Initialize freelance moderation
function initFreelanceModeration() {
    // Fetch all freelance tasks from Firestore
    fetchAllFreelanceTasks();
    
    // Set up event listeners
    setupFreelanceEventListeners();
}

// Fetch all freelance tasks from Firestore
function fetchAllFreelanceTasks() {
    const freelanceContainer = document.getElementById('freelance-container');
    if (!freelanceContainer) return;
    
    // Show loading state
    freelanceContainer.innerHTML = '<div class="loading">Loading freelance tasks...</div>';
    
    // Get reference to freelance collection
    const freelanceRef = firebase.firestore().collection('freelanceTasks');
    
    // Fetch all freelance tasks
    freelanceRef.get().then(freelanceSnapshot => {
        // Clear loading state
        freelanceContainer.innerHTML = '';
        
        if (freelanceSnapshot.empty) {
            freelanceContainer.innerHTML = '<div class="no-data">No freelance tasks found.</div>';
            return;
        }
        
        // Process each freelance task
        freelanceSnapshot.forEach(doc => {
            const taskData = doc.data();
            // Fetch employer details for each task
            fetchEmployerDetailsForTask(taskData.employerId, taskData, doc.id);
        });
    }).catch(error => {
        console.error('Error fetching freelance tasks:', error);
        freelanceContainer.innerHTML = '<div class="error">Error loading freelance tasks. Please try again.</div>';
    });
}

// Fetch employer details for a freelance task
function fetchEmployerDetailsForTask(employerId, taskData, taskId) {
    const employersRef = firebase.firestore().collection('employers');
    
    employersRef.doc(employerId).get().then(employerDoc => {
        if (employerDoc.exists) {
            const employerData = employerDoc.data();
            // Add task to the list with employer details
            addFreelanceTaskToList({
                id: taskId,
                ...taskData,
                employerName: employerData.companyName || employerData.name || 'Unknown Employer'
            });
        } else {
            // Add task with unknown employer
            addFreelanceTaskToList({
                id: taskId,
                ...taskData,
                employerName: 'Unknown Employer'
            });
        }
    }).catch(error => {
        console.error('Error fetching employer details:', error);
        // Add task with error fetching employer
        addFreelanceTaskToList({
            id: taskId,
            ...taskData,
            employerName: 'Error loading employer'
        });
    });
}

// Add a freelance task to the list
function addFreelanceTaskToList(task) {
    const freelanceContainer = document.getElementById('freelance-container');
    if (!freelanceContainer) return;
    
    const taskCard = document.createElement('div');
    taskCard.className = 'freelance-card';
    taskCard.dataset.taskId = task.id;
    
    taskCard.innerHTML = `
        <div class="freelance-header">
            <h3 class="freelance-title">${task.title || 'Untitled Task'}</h3>
            <span class="freelance-status ${task.status || 'pending'}">${task.status || 'Pending'}</span>
        </div>
        <div class="freelance-details">
            <p><strong>Employer:</strong> ${task.employerName}</p>
            <p><strong>Star Requirement:</strong> ${'★'.repeat(task.starRequirement || 0)}</p>
            <p><strong>Budget:</strong> $${task.budget || 'Not specified'}</p>
            <p><strong>Category:</strong> ${task.category || 'Not specified'}</p>
            <p><strong>Duration:</strong> ${task.duration || 'Not specified'}</p>
            <p><strong>Posted:</strong> ${task.createdAt ? formatFreelanceDate(task.createdAt.toDate()) : 'Unknown date'}</p>
        </div>
        <div class="freelance-description">
            <p>${task.description || 'No description provided.'}</p>
        </div>
        <div class="freelance-actions">
            ${task.status === 'approved' ? 
                `<button class="btn-freelance-reject" data-task-id="${task.id}">Reject</button>` :
                `<button class="btn-freelance-approve" data-task-id="${task.id}">Approve</button>`
            }
            <button class="btn-freelance-delete" data-task-id="${task.id}">Delete</button>
        </div>
        <div class="freelance-rejection-reason" style="display: none;">
            <textarea placeholder="Reason for rejection (will be sent to employer)" rows="3"></textarea>
            <button class="btn-confirm-freelance-reject" data-task-id="${task.id}">Confirm Rejection</button>
            <button class="btn-cancel-freelance-reject">Cancel</button>
        </div>
    `;
    
    freelanceContainer.appendChild(taskCard);
}

// Format date for display
function formatFreelanceDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Set up event listeners for freelance actions
function setupFreelanceEventListeners() {
    // Use event delegation for dynamically created elements
    document.addEventListener('click', function(event) {
        // Approve button
        if (event.target.classList.contains('btn-freelance-approve')) {
            const taskId = event.target.dataset.taskId;
            approveFreelanceTask(taskId);
        }
        
        // Reject button
        if (event.target.classList.contains('btn-freelance-reject')) {
            const taskId = event.target.dataset.taskId;
            showFreelanceRejectionReason(taskId);
        }
        
        // Delete button
        if (event.target.classList.contains('btn-freelance-delete')) {
            const taskId = event.target.dataset.taskId;
            deleteFreelanceTask(taskId);
        }
        
        // Confirm rejection button
        if (event.target.classList.contains('btn-confirm-freelance-reject')) {
            const taskId = event.target.dataset.taskId;
            const taskCard = event.target.closest('.freelance-card');
            const reasonTextarea = taskCard.querySelector('.freelance-rejection-reason textarea');
            const reason = reasonTextarea.value.trim();
            
            if (reason) {
                rejectFreelanceTask(taskId, reason);
            } else {
                alert('Please provide a reason for rejection.');
            }
        }
        
        // Cancel rejection button
        if (event.target.classList.contains('btn-cancel-freelance-reject')) {
            const taskCard = event.target.closest('.freelance-card');
            const rejectionReason = taskCard.querySelector('.freelance-rejection-reason');
            rejectionReason.style.display = 'none';
        }
    });
}

// Show rejection reason input for freelance task
function showFreelanceRejectionReason(taskId) {
    const taskCard = document.querySelector(`.freelance-card[data-task-id="${taskId}"]`);
    if (!taskCard) return;
    
    const rejectionReason = taskCard.querySelector('.freelance-rejection-reason');
    rejectionReason.style.display = 'block';
}

// Approve a freelance task
function approveFreelanceTask(taskId) {
    if (!confirm('Are you sure you want to approve this freelance task?')) return;
    
    firebase.firestore().collection('freelanceTasks').doc(taskId).update({
        status: 'approved',
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
        reviewedBy: firebase.auth().currentUser.uid
    }).then(() => {
        alert('Freelance task approved successfully.');
        updateFreelanceStatusUI(taskId, 'approved');
    }).catch(error => {
        console.error('Error approving freelance task:', error);
        alert('Error approving freelance task. Please try again.');
    });
}

// Reject a freelance task and notify employer
function rejectFreelanceTask(taskId, reason) {
    if (!confirm('Are you sure you want to reject this freelance task?')) return;
    
    // First update the task status
    firebase.firestore().collection('freelanceTasks').doc(taskId).update({
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
        reviewedBy: firebase.auth().currentUser.uid
    }).then(() => {
        // Then notify the employer
        notifyEmployerAboutFreelance(taskId, reason);
        alert('Freelance task rejected successfully. Employer will be notified.');
        updateFreelanceStatusUI(taskId, 'rejected');
    }).catch(error => {
        console.error('Error rejecting freelance task:', error);
        alert('Error rejecting freelance task. Please try again.');
    });
}

// Notify employer about freelance task rejection
function notifyEmployerAboutFreelance(taskId, reason) {
    // Get task details first
    firebase.firestore().collection('freelanceTasks').doc(taskId).get().then(taskDoc => {
        if (taskDoc.exists) {
            const taskData = taskDoc.data();
            
            // Get employer details
            firebase.firestore().collection('employers').doc(taskData.employerId).get().then(employerDoc => {
                if (employerDoc.exists) {
                    const employerData = employerDoc.data();
                    const employerEmail = employerData.email;
                    
                    // Send email notification (this would be implemented with a cloud function or email service)
                    sendFreelanceRejectionEmail(employerEmail, taskData.title, reason);
                    
                    // Also add a notification to the employer's account
                    addEmployerFreelanceNotification(taskData.employerId, taskId, taskData.title, reason);
                }
            });
        }
    });
}

// Send rejection email to employer for freelance task (pseudo-implementation)
function sendFreelanceRejectionEmail(employerEmail, taskTitle, reason) {
    // In a real implementation, this would call a cloud function or email service
    console.log(`Sending freelance rejection email to ${employerEmail} for task "${taskTitle}" with reason: ${reason}`);
    
    // Example of what would be sent to a cloud function:
    /*
    fetch('https://yourapi.com/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            to: employerEmail,
            subject: `Your freelance task "${taskTitle}" has been reviewed`,
            html: `
                <h2>Freelance Task Update</h2>
                <p>Your freelance task "${taskTitle}" has been reviewed by our team.</p>
                <p><strong>Status:</strong> Rejected</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>Please review our posting guidelines and make necessary changes before resubmitting.</p>
            `
        })
    });
    */
}

// Add notification to employer's account about freelance task
function addEmployerFreelanceNotification(employerId, taskId, taskTitle, reason) {
    const notificationsRef = firebase.firestore().collection('employers').doc(employerId).collection('notifications');
    
    notificationsRef.add({
        type: 'freelance_rejected',
        title: `Freelance Task Rejected: ${taskTitle}`,
        message: `Your freelance task "${taskTitle}" was rejected. Reason: ${reason}`,
        taskId: taskId,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(error => {
        console.error('Error adding notification:', error);
    });
}

// Delete a freelance task
function deleteFreelanceTask(taskId) {
    if (!confirm('Are you sure you want to delete this freelance task? This action cannot be undone.')) return;
    
    firebase.firestore().collection('freelanceTasks').doc(taskId).delete().then(() => {
        alert('Freelance task deleted successfully.');
        // Remove the task card from the UI
        const taskCard = document.querySelector(`.freelance-card[data-task-id="${taskId}"]`);
        if (taskCard) {
            taskCard.remove();
        }
    }).catch(error => {
        console.error('Error deleting freelance task:', error);
        alert('Error deleting freelance task. Please try again.');
    });
}

// Update freelance task status in the UI
function updateFreelanceStatusUI(taskId, status) {
    const taskCard = document.querySelector(`.freelance-card[data-task-id="${taskId}"]`);
    if (!taskCard) return;
    
    // Update status badge
    const statusBadge = taskCard.querySelector('.freelance-status');
    statusBadge.textContent = status;
    statusBadge.className = `freelance-status ${status}`;
    
    // Update buttons
    const taskActions = taskCard.querySelector('.freelance-actions');
    if (status === 'approved') {
        taskActions.innerHTML = `
            <button class="btn-freelance-reject" data-task-id="${taskId}">Reject</button>
            <button class="btn-freelance-delete" data-task-id="${taskId}">Delete</button>
        `;
    } else if (status === 'rejected') {
        taskActions.innerHTML = `
            <button class="btn-freelance-approve" data-task-id="${taskId}">Approve</button>
            <button class="btn-freelance-delete" data-task-id="${taskId}">Delete</button>
        `;
    }
    
    // Hide rejection reason if visible
    const rejectionReason = taskCard.querySelector('.freelance-rejection-reason');
    rejectionReason.style.display = 'none';
}

// Initialize when the freelance moderation section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Watch for when the freelance moderation section becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const freelanceModerationSection = document.getElementById('freelance-moderation');
                if (freelanceModerationSection && freelanceModerationSection.style.display !== 'none') {
                    initFreelanceModeration();
                }
            }
        });
    });
    
    // Start observing the freelance moderation section
    const freelanceModerationSection = document.getElementById('freelance-moderation');
    if (freelanceModerationSection) {
        observer.observe(freelanceModerationSection, { attributes: true });
    }
});