// users/js/member/main.js - Main controller for Candidate Dashboard (COMPLETE)

// Firebase references
let currentUser = null;
let candidateData = null;

// Initialize the dashboard when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing dashboard...');
    initializeAuth();
});

function initializeAuth() {
    // Check authentication state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            firebase.firestore().collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && doc.data().role === 'member') { 
                    currentUser = user;
                    initializeDashboard(user);
                } else {
                    window.location.href = '/login/index.html';
                }
            }).catch(() => {
                 window.location.href = '/login/index.html';
            });
        } else {
            window.location.href = '/login/index.html';
        }
    });
}

// Initialize the dashboard
async function initializeDashboard(user) {
    try {
        const db = firebase.firestore();
        
        // Get user data from Firestore
        const candidateDoc = await db.collection('users').doc(user.uid).get(); 
        
        if (candidateDoc.exists) {
            candidateData = candidateDoc.data();
            
            // DEBUG: Check what data we have
            console.log('Firestore data:', candidateData);
            
            // Ensure name field exists - use multiple fallbacks
            candidateData.name = candidateData.name || 
                                user.displayName || 
                                (user.email ? user.email.split('@')[0] : 'Candidate') ||
                                'Candidate';
            
            // Ensure other required fields
            candidateData.email = candidateData.email || user.email || 'Not set';
            candidateData.xp = candidateData.xp || 0;
            candidateData.starLevel = candidateData.starLevel || 1;
            candidateData.joinDate = candidateData.joinDate || new Date().toISOString();
            
            console.log('Processed candidate data:', candidateData);
            
        } else {
            // Create new candidate document if missing
            const userName = user.displayName || (user.email ? user.email.split('@')[0] : 'Candidate');
            
            const newCandidateData = {
                uid: user.uid,
                name: userName,
                email: user.email,
                starLevel: 1,
                xp: 0,
                joinDate: new Date().toISOString(),
                skills: [],
                experience: [],
                walletBalance: 0,
                totalEarnings: 0,
                completedProjects: 0,
                lastSection: 'profile'
            };
            
            console.log('Creating new candidate with name:', userName);
            await db.collection('users').doc(user.uid).set(newCandidateData);
            candidateData = newCandidateData;
        }
        
        // Update UI with user data
        updateUserProfile(user, candidateData);
        updateProfileSection(candidateData);
        
        // Initialize XP system
        initializeXpSystem();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load initial section
        loadSection(candidateData.lastSection || 'profile');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// ========== UI UPDATE FUNCTIONS ==========

function updateUserProfile(user, candidateData) {
    const userNameElement = document.getElementById('user-name');
    const userAvatarElement = document.getElementById('user-avatar');
    
    const name = candidateData.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Candidate');
    if (userNameElement) userNameElement.textContent = name;
    if (userAvatarElement) userAvatarElement.textContent = name.charAt(0).toUpperCase();
}

function updateProfileSection(candidateData) {
    console.log('Updating profile section with data:', candidateData);
    
    // Update profile info
    const joinDate = candidateData.joinDate ? new Date(candidateData.joinDate).toLocaleDateString() : 'Recently';
    
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileJoined = document.getElementById('profile-joined');
    
    // Debug log to see what data we have
    console.log('Profile data:', {
        name: candidateData.name,
        email: candidateData.email,
        joinDate: joinDate
    });
    
    // Update the elements if they exist
    if (profileName) {
        profileName.textContent = candidateData.name || 'Not set';
        console.log('Set profile name to:', profileName.textContent);
    } else {
        console.error('profile-name element not found');
    }
    
    if (profileEmail) {
        profileEmail.textContent = candidateData.email || 'Not set';
        console.log('Set profile email to:', profileEmail.textContent);
    } else {
        console.error('profile-email element not found');
    }
    
    if (profileJoined) {
        profileJoined.textContent = joinDate;
        console.log('Set join date to:', profileJoined.textContent);
    } else {
        console.error('profile-joined element not found');
    }
    
    // Update skills, experience, and completion
    updateSkillsDisplay(candidateData.skills);
    updateExperienceDisplay(candidateData.experience);
    updateProfileCompletion(candidateData);
}

function initializeXpSystem() {
    // Ensure we have valid values for XP and star level
    const xp = candidateData.xp || 0;
    const starLevel = candidateData.starLevel || 1;
    
    console.log('Initializing XP system:', { xp, starLevel });
    updateXpProgress(xp, starLevel);
    
    // Set up real-time listener for XP changes
    firebase.firestore().collection('users').doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const newXp = data.xp || 0;
                const newStarLevel = data.starLevel || 1;
                
                console.log('XP update received:', { newXp, newStarLevel });
                
                if (newXp !== candidateData.xp || newStarLevel !== candidateData.starLevel) {
                    candidateData.xp = newXp;
                    candidateData.starLevel = newStarLevel;
                    updateXpProgress(newXp, newStarLevel);
                }
            }
        });
}

function updateXpProgress(xp, starLevel) {
    // Ensure we have valid numbers
    const currentXp = Number(xp) || 0;
    const currentStarLevel = Number(starLevel) || 1;
    
    // Calculate XP needed for current level (100 XP per level)
    const xpNeeded = currentStarLevel * 100;
    const progressPercent = Math.min((currentXp / xpNeeded) * 100, 100);
    
    const xpProgressBar = document.getElementById('xp-progress-bar');
    const xpText = document.getElementById('xp-text');
    const starLevelElement = document.getElementById('star-level');
    
    console.log('Updating XP display:', { 
        currentXp, 
        currentStarLevel, 
        xpNeeded, 
        progressPercent 
    });
    
    if (xpProgressBar) {
        xpProgressBar.style.width = `${progressPercent}%`;
        console.log('Progress bar width set to:', xpProgressBar.style.width);
    }
    
    if (xpText) {
        xpText.textContent = `${currentXp}/${xpNeeded} XP`;
        console.log('XP text set to:', xpText.textContent);
    }
    
    if (starLevelElement) {
        starLevelElement.textContent = currentStarLevel;
        console.log('Star level set to:', starLevelElement.textContent);
    }
}

function updateSkillsDisplay(skills) {
    const skillsContainer = document.getElementById('skills-container');
    const skillsCount = document.getElementById('skills-count');
    
    if (skills && skills.length > 0) {
        if (skillsContainer) {
            skillsContainer.innerHTML = '<div class="skills-list">' + 
                skills.map(skill => 
                    `<span class="skill-tag">${skill}</span>`
                ).join('') + '</div>';
        }
        if (skillsCount) skillsCount.textContent = `${skills.length} skills`;
    } else {
        if (skillsContainer) {
            skillsContainer.innerHTML = '<p>No skills added yet. Add your skills to attract better opportunities.</p>';
        }
        if (skillsCount) skillsCount.textContent = '0 skills';
    }
}

function updateExperienceDisplay(experience) {
    const experienceContainer = document.getElementById('experience-container');
    const experienceCount = document.getElementById('experience-count');
    
    console.log('updateExperienceDisplay called with:', experience);
    
    if (experience && experience.length > 0) {
        if (experienceContainer) {
            experienceContainer.innerHTML = experience.map((exp, index) => 
                `<div class="experience-item">
                    <div class="experience-header">
                        <h4>${exp.title}</h4>
                        <div class="experience-actions">
                            <button class="edit-experience-btn" data-index="${index}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-experience-btn" data-index="${index}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="company-info">${exp.company} ${exp.location ? `• ${exp.location}` : ''}</p>
                    <p class="experience-duration">${formatDateForDisplay(exp.startDate)} - ${exp.currentJob ? 'Present' : formatDateForDisplay(exp.endDate)} • ${exp.duration}</p>
                    <p class="employment-type">${exp.employmentType}</p>
                    ${exp.description ? `<p class="experience-description">${exp.description}</p>` : ''}
                </div>`
            ).join('');
            
            console.log('Experience HTML rendered, buttons count:', 
                experienceContainer.querySelectorAll('.delete-experience-btn').length);
            
            // Add event listeners for edit buttons
            experienceContainer.querySelectorAll('.edit-experience-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    console.log('Edit button clicked, index:', this.getAttribute('data-index'));
                    const index = parseInt(this.getAttribute('data-index'));
                    showAddExperienceForm(index);
                });
            });
            
            // Add event listeners for delete buttons
            experienceContainer.querySelectorAll('.delete-experience-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    console.log('Delete button clicked, index:', this.getAttribute('data-index'));
                    const index = parseInt(this.getAttribute('data-index'));
                    deleteExperience(index);
                });
            });
            
            console.log('Event listeners attached to delete buttons');
        }
        if (experienceCount) experienceCount.textContent = `${experience.length} position${experience.length !== 1 ? 's' : ''}`;
    } else {
        if (experienceContainer) {
            experienceContainer.innerHTML = '<p class="no-experience-message">No work experience added yet.</p>';
        }
        if (experienceCount) experienceCount.textContent = '0 positions';
    }
}

async function deleteExperience(index) {
    console.log('deleteExperience called with index:', index);
    
    // Simple confirmation
    const confirmed = confirm('Are you sure you want to delete this work experience?');
    if (!confirmed) {
        console.log('Delete cancelled by user');
        return;
    }
    
    console.log('User confirmed deletion');
    
    try {
        const db = firebase.firestore();
        const updatedExperience = [...candidateData.experience];
        console.log('Current experience before deletion:', updatedExperience);
        
        updatedExperience.splice(index, 1);
        console.log('Experience after deletion:', updatedExperience);
        
        await db.collection('users').doc(currentUser.uid).update({
            experience: updatedExperience,
            lastUpdated: new Date()
        });
        
        console.log('Firestore updated successfully');
        
        // Update local candidateData
        candidateData.experience = updatedExperience;
        
        // Update UI
        updateExperienceDisplay(updatedExperience);
        updateProfileCompletion(candidateData);
        
        // Show success message
        showSuccessMessage('Work experience deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting experience:', error);
        alert('Error deleting work experience. Please try again.');
    }
}

function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
    });
}

function updateProfileCompletion(candidateData) {
    let completion = 0;
    if (candidateData.name && candidateData.name !== 'Candidate') completion += 25;
    if (candidateData.skills && candidateData.skills.length > 0) completion += 25;
    if (candidateData.experience && candidateData.experience.length > 0) completion += 25;
    
    const completionElement = document.getElementById('profile-completion');
    if (completionElement) {
        completionElement.textContent = `${completion}% complete`;
    }
}

// ========== PROFILE EDITING FUNCTIONS ==========

function showEditProfileForm() {
    console.log('Showing edit profile form');
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Profile Information</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-profile-form">
                    <div class="form-group">
                        <label for="edit-name">Full Name</label>
                        <input type="text" id="edit-name" value="${candidateData.name || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-email">Email</label>
                        <input type="email" id="edit-email" value="${candidateData.email || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-skills">Skills (comma separated)</label>
                        <input type="text" id="edit-skills" value="${candidateData.skills ? candidateData.skills.join(', ') : ''}" 
                               placeholder="JavaScript, React, Node.js, etc.">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for the modal
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#edit-profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfileChanges();
        document.body.removeChild(modal);
    });
}

function showManageSkillsForm() {
    console.log('Showing manage skills form');
    
    // Get current skills
    const currentSkills = candidateData.skills || [];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Manage Your Skills</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="skills-management">
                    <div class="form-group">
                        <label for="new-skill">Add New Skill</label>
                        <div class="skill-input-container">
                            <input type="text" id="new-skill" placeholder="Enter a skill (e.g., JavaScript, React, Python)">
                            <button type="button" id="add-skill-btn" class="add-skill-btn">Add</button>
                        </div>
                    </div>
                    
                    <div class="current-skills-section">
                        <h4>Your Current Skills</h4>
                        <div class="skills-list" id="editable-skills-list">
                            ${currentSkills.length > 0 ? 
                                currentSkills.map(skill => `
                                    <div class="editable-skill-item">
                                        <span class="skill-text">${skill}</span>
                                        <button class="remove-skill-btn" data-skill="${skill}">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('') : 
                                '<p class="no-skills-message">No skills added yet. Add your first skill above!</p>'
                            }
                        </div>
                    </div>
                    
                    <div class="suggested-skills">
                        <h4>Suggested Skills</h4>
                        <div class="suggested-skills-list">
                            <button type="button" class="suggested-skill" data-skill="JavaScript">JavaScript</button>
                            <button type="button" class="suggested-skill" data-skill="React">React</button>
                            <button type="button" class="suggested-skill" data-skill="Node.js">Node.js</button>
                            <button type="button" class="suggested-skill" data-skill="Python">Python</button>
                            <button type="button" class="suggested-skill" data-skill="HTML">HTML</button>
                            <button type="button" class="suggested-skill" data-skill="CSS">CSS</button>
                            <button type="button" class="suggested-skill" data-skill="Git">Git</button>
                            <button type="button" class="suggested-skill" data-skill="SQL">SQL</button>
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="button" id="save-skills-btn" class="submit-btn">Save Skills</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for the modal
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Add skill button
    modal.querySelector('#add-skill-btn').addEventListener('click', addNewSkill);
    
    // Add skill on Enter key
    modal.querySelector('#new-skill').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewSkill();
        }
    });
    
    // Remove skill buttons
    modal.querySelectorAll('.remove-skill-btn').forEach(btn => {
        btn.addEventListener('click', removeSkill);
    });
    
    // Suggested skills buttons
    modal.querySelectorAll('.suggested-skill').forEach(btn => {
        btn.addEventListener('click', addSuggestedSkill);
    });
    
    // Save skills button
    modal.querySelector('#save-skills-btn').addEventListener('click', async () => {
        await saveSkills();
        document.body.removeChild(modal);
    });
}

function addNewSkill() {
    const skillInput = document.getElementById('new-skill');
    const skill = skillInput.value.trim();
    
    if (skill && skill.length > 0) {
        addSkillToDisplay(skill);
        skillInput.value = '';
        skillInput.focus();
    }
}

function addSuggestedSkill(e) {
    const skill = e.target.getAttribute('data-skill');
    addSkillToDisplay(skill);
}

function addSkillToDisplay(skill) {
    const skillsList = document.getElementById('editable-skills-list');
    const noSkillsMessage = skillsList.querySelector('.no-skills-message');
    
    // Remove "no skills" message if it exists
    if (noSkillsMessage) {
        noSkillsMessage.remove();
    }
    
    // Check if skill already exists
    const existingSkills = Array.from(skillsList.querySelectorAll('.skill-text'))
        .map(el => el.textContent);
    
    if (!existingSkills.includes(skill)) {
        const skillElement = document.createElement('div');
        skillElement.className = 'editable-skill-item';
        skillElement.innerHTML = `
            <span class="skill-text">${skill}</span>
            <button class="remove-skill-btn" data-skill="${skill}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        skillsList.appendChild(skillElement);
        
        // Add event listener to the new remove button
        skillElement.querySelector('.remove-skill-btn').addEventListener('click', removeSkill);
    }
}

function removeSkill(e) {
    const skillItem = e.target.closest('.editable-skill-item');
    if (skillItem) {
        skillItem.remove();
        
        // If no skills left, show the "no skills" message
        const skillsList = document.getElementById('editable-skills-list');
        if (skillsList.children.length === 0) {
            skillsList.innerHTML = '<p class="no-skills-message">No skills added yet. Add your first skill above!</p>';
        }
    }
}

async function saveSkills() {
    try {
        const skillsList = document.getElementById('editable-skills-list');
        const skillElements = skillsList.querySelectorAll('.skill-text');
        
        const updatedSkills = Array.from(skillElements).map(el => el.textContent.trim());
        
        console.log('Saving skills:', updatedSkills);
        
        const db = firebase.firestore();
        await db.collection('users').doc(currentUser.uid).update({
            skills: updatedSkills,
            lastUpdated: new Date()
        });
        
        // Update local candidateData
        candidateData.skills = updatedSkills;
        
        // Update UI
        updateSkillsDisplay(updatedSkills);
        updateProfileCompletion(candidateData);
        
        // Show success message
        showSuccessMessage('Skills updated successfully!');
        
    } catch (error) {
        console.error('Error saving skills:', error);
        alert('Error saving skills. Please try again.');
    }
}

async function saveProfileChanges() {
    try {
        const db = firebase.firestore();
        
        // Get form values
        const updatedData = {
            name: document.getElementById('edit-name').value,
            email: document.getElementById('edit-email').value,
            skills: document.getElementById('edit-skills').value 
                ? document.getElementById('edit-skills').value.split(',').map(skill => skill.trim()).filter(skill => skill)
                : [],
            lastUpdated: new Date()
        };
        
        console.log('Saving profile changes:', updatedData);
        
        // Update Firestore
        await db.collection('users').doc(currentUser.uid).update(updatedData);
        
        // Update local candidateData
        Object.assign(candidateData, updatedData);
        
        // Update UI
        updateUserProfile(currentUser, candidateData);
        updateProfileSection(candidateData);
        
        // Show success message
        showSuccessMessage('Profile updated successfully!');
        
    } catch (error) {
        console.error('Error saving profile changes:', error);
        alert('Error saving profile changes. Please try again.');
    }
}

function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <h3>Success!</h3>
            <p>${message}</p>
            <button class="success-ok-btn">OK</button>
        </div>
    `;
    
    document.body.appendChild(successMsg);
    
    // Add event listener
    successMsg.querySelector('.success-ok-btn').addEventListener('click', () => {
        document.body.removeChild(successMsg);
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (document.body.contains(successMsg)) {
            document.body.removeChild(successMsg);
        }
    }, 3000);
}

function showAddExperienceForm(editIndex = null) {
    console.log('Showing add experience form');
    
    const isEditing = editIndex !== null;
    const experience = isEditing ? candidateData.experience[editIndex] : null;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isEditing ? 'Edit Work Experience' : 'Add Work Experience'}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="experience-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="job-title">Job Title *</label>
                            <input type="text" id="job-title" value="${experience ? experience.title : ''}" required placeholder="e.g., Frontend Developer">
                        </div>
                        <div class="form-group">
                            <label for="company">Company *</label>
                            <input type="text" id="company" value="${experience ? experience.company : ''}" required placeholder="e.g., Google">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="start-date">Start Date *</label>
                            <input type="month" id="start-date" value="${experience ? experience.startDate : ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="end-date">End Date</label>
                            <input type="month" id="end-date" value="${experience ? experience.endDate : ''}">
                            <small>Leave empty if current position</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="employment-type">Employment Type</label>
                        <select id="employment-type">
                            <option value="Full-time" ${experience && experience.employmentType === 'Full-time' ? 'selected' : ''}>Full-time</option>
                            <option value="Part-time" ${experience && experience.employmentType === 'Part-time' ? 'selected' : ''}>Part-time</option>
                            <option value="Contract" ${experience && experience.employmentType === 'Contract' ? 'selected' : ''}>Contract</option>
                            <option value="Freelance" ${experience && experience.employmentType === 'Freelance' ? 'selected' : ''}>Freelance</option>
                            <option value="Internship" ${experience && experience.employmentType === 'Internship' ? 'selected' : ''}>Internship</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="location">Location</label>
                        <input type="text" id="location" value="${experience ? experience.location : ''}" placeholder="e.g., San Francisco, CA">
                    </div>
                    
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" rows="4" placeholder="Describe your responsibilities and achievements...">${experience ? experience.description : ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-container">
                            <input type="checkbox" id="current-job" ${experience && experience.currentJob ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            I currently work here
                        </label>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">${isEditing ? 'Update Experience' : 'Add Experience'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for the modal
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Current job checkbox functionality
    const currentJobCheckbox = modal.querySelector('#current-job');
    const endDateInput = modal.querySelector('#end-date');
    
    currentJobCheckbox.addEventListener('change', function() {
        endDateInput.disabled = this.checked;
        if (this.checked) {
            endDateInput.value = '';
        }
    });
    
    // Set initial state
    endDateInput.disabled = currentJobCheckbox.checked;
    
    // Form submission
    modal.querySelector('#experience-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isEditing) {
            await updateExperience(editIndex);
        } else {
            await addExperience();
        }
        document.body.removeChild(modal);
    });
}

async function addExperience() {
    try {
        const experienceData = getExperienceFormData();
        if (!experienceData) return;
        
        const db = firebase.firestore();
        const updatedExperience = [...(candidateData.experience || []), experienceData];
        
        await db.collection('users').doc(currentUser.uid).update({
            experience: updatedExperience,
            lastUpdated: new Date()
        });
        
        // Update local candidateData
        candidateData.experience = updatedExperience;
        
        // Update UI
        updateExperienceDisplay(updatedExperience);
        updateProfileCompletion(candidateData);
        
        // Show success message
        showSuccessMessage('Work experience added successfully!');
        
    } catch (error) {
        console.error('Error adding experience:', error);
        alert('Error adding work experience. Please try again.');
    }
}

async function updateExperience(index) {
    try {
        const experienceData = getExperienceFormData();
        if (!experienceData) return;
        
        const db = firebase.firestore();
        const updatedExperience = [...candidateData.experience];
        updatedExperience[index] = experienceData;
        
        await db.collection('users').doc(currentUser.uid).update({
            experience: updatedExperience,
            lastUpdated: new Date()
        });
        
        // Update local candidateData
        candidateData.experience = updatedExperience;
        
        // Update UI
        updateExperienceDisplay(updatedExperience);
        
        // Show success message
        showSuccessMessage('Work experience updated successfully!');
        
    } catch (error) {
        console.error('Error updating experience:', error);
        alert('Error updating work experience. Please try again.');
    }
}

function getExperienceFormData() {
    const title = document.getElementById('job-title').value.trim();
    const company = document.getElementById('company').value.trim();
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const employmentType = document.getElementById('employment-type').value;
    const location = document.getElementById('location').value.trim();
    const description = document.getElementById('description').value.trim();
    const currentJob = document.getElementById('current-job').checked;
    
    if (!title || !company || !startDate) {
        alert('Please fill in all required fields (Title, Company, Start Date)');
        return null;
    }
    
    // Calculate duration
    const duration = calculateDuration(startDate, endDate, currentJob);
    
    return {
        title,
        company,
        startDate,
        endDate: currentJob ? null : endDate,
        employmentType,
        location,
        description,
        currentJob,
        duration
    };
}

function calculateDuration(startDate, endDate, currentJob) {
    const start = new Date(startDate);
    const end = currentJob ? new Date() : new Date(endDate);
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (months < 12) {
        return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0) {
            return `${years} year${years !== 1 ? 's' : ''}`;
        } else {
            return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        }
    }
}

// ========== EVENT HANDLERS ==========

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.sidebar-menu a[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            const section = this.getAttribute('data-section');
            console.log('Loading section:', section);
            
            // Load the selected section
            loadSection(section);
            
            // Save last visited section
            if (currentUser && candidateData) {
                firebase.firestore().collection('users').doc(currentUser.uid).update({
                    lastSection: section
                });
            }
        });
    });
    
    // Edit Info button
    const editInfoButton = document.querySelector('[data-action="edit-profile"]');
    if (editInfoButton) {
        editInfoButton.addEventListener('click', function(e) {
            e.preventDefault();
            showEditProfileForm();
        });
    }
    
    // Manage Skills button
    const manageSkillsButton = document.querySelector('[data-action="manage-skills"]');
    if (manageSkillsButton) {
        manageSkillsButton.addEventListener('click', function(e) {
            e.preventDefault();
            showManageSkillsForm();
        });
    }
    
    // Add Experience button - ADD THIS
    const addExperienceButton = document.querySelector('[data-action="add-experience"]');
    if (addExperienceButton) {
        addExperienceButton.addEventListener('click', function(e) {
            e.preventDefault();
            showAddExperienceForm();
        });
    }
    
    // Profile dropdown functionality
    const profileToggle = document.getElementById('user-profile-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleProfileDropdown();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', closeProfileDropdown);
    
    // Dropdown actions
    document.querySelectorAll('.profile-dropdown a[data-action]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.getAttribute('data-action');
            handleDropdownAction(action);
        });
    });
    
    console.log('Event listeners setup complete');
}


function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        console.log('Dropdown toggled, show class:', dropdown.classList.contains('show'));
    }
}

function closeProfileDropdown(event) {
    const dropdown = document.getElementById('profile-dropdown');
    const profileContainer = document.querySelector('.user-profile');
    
    if (dropdown && profileContainer && !profileContainer.contains(event.target)) {
        dropdown.classList.remove('show');
    }
}

function handleDropdownAction(action) {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    switch(action) {
        case 'view-profile':
            loadSection('profile');
            break;
        case 'settings':
            loadSection('settings');
            break;
        case 'logout':
            firebase.auth().signOut().then(() => {
                window.location.href = '/login/index.html';
            }).catch((error) => {
                console.error('Logout error:', error);
            });
            break;
    }
}

// ========== SECTION MANAGEMENT ==========


// ========== SECTION MANAGEMENT ==========

function loadSection(section) {
    console.log('Loading section:', section);
    
    // Hide all sections first
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });
    
    // Show the selected section
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        
        // Update active state in sidebar
        const navLinks = document.querySelectorAll('.sidebar-menu a[data-section]');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === section) {
                link.classList.add('active');
            }
        });
        
        // Load section-specific content
        loadSectionModules(section);
        
    } else {
        console.error(`Section '${section}' not found`);
        // Fallback to profile section
        loadSection('profile');
    }
}

function loadSectionModules(section) {
    console.log('Loading modules for section:', section);
    
    
    switch(section) {
        case 'learning':
            if (typeof initLearningSection === 'function') {
                console.log('Initializing learning section');
                initLearningSection(currentUser, candidateData);
            } else {
                console.warn('initLearningSection function not found');
            }
            break;
            
        case 'jobs':
            if (typeof initJobsSection === 'function') {
                console.log('Initializing jobs section');
                initJobsSection(currentUser, candidateData);
            } else {
                console.warn('initJobsSection function not found');
            }
            break;
            
        case 'freelance':
            if (typeof initFreelanceSection === 'function') {
                console.log('Initializing freelance section');
                initFreelanceSection(currentUser, candidateData);
            } else {
                console.warn('initFreelanceSection function not found');
            }
            break;
            
        case 'wallet':
            if (typeof initWalletSection === 'function') {
                console.log('Initializing wallet section');
                initWalletSection(currentUser, candidateData);
            } else {
                console.warn('initWalletSection function not found');
            }
            break;
            
        case 'chats':
            console.log('Initializing chats section');
            initChatsSection(currentUser, candidateData);
            break;
            
        case 'profile':
            console.log('Profile section loaded');
            break;
            
        case 'settings':
            console.log('Settings section loaded');
            break;
            
        default:
            console.warn('Unknown section:', section);
    }
}

// THEN the chat functions should be OUTSIDE, not inside

// ========== CHAT SYSTEM FUNCTIONS ==========

let currentChatId = null;
let unsubscribeChat = null;

// Add this function for chat section initialization
// Add this function for chat section initialization
function initChatsSection(user, userData) {
    console.log("Initializing Chats Section");
    
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
    
    // Load user chats
    loadUserChats(user.uid);
}

// FIXED: Chat loading function with duplicate removal
async function loadUserChats(userId) {
    try {
        console.log("Loading chats for user:", userId);
        
        // Get chats where user is employer OR member
        const employerChatsPromise = firebase.firestore().collection('chats')
            .where('participants.employer', '==', userId)
            .get();
        
        const memberChatsPromise = firebase.firestore().collection('chats')
            .where('participants.member', '==', userId)
            .get();

        const [employerChats, memberChats] = await Promise.all([employerChatsPromise, memberChatsPromise]);

        // Use Set to remove duplicates by chatId
        const uniqueChatsMap = new Map();
        
        // Process employer chats
        employerChats.docs.forEach(chatDoc => {
            const chat = chatDoc.data();
            uniqueChatsMap.set(chat.chatId, chatDoc);
        });
        
        // Process member chats - will override if same chatId exists
        memberChats.docs.forEach(chatDoc => {
            const chat = chatDoc.data();
            uniqueChatsMap.set(chat.chatId, chatDoc);
        });
        
        // Convert back to array
        const allChats = Array.from(uniqueChatsMap.values());
        
        console.log(`Found ${allChats.length} unique chats:`, allChats.map(chat => chat.data().chatId));
        
        displayChatsList(allChats);
    } catch (error) {
        console.error('Error loading chats:', error);
        const chatsList = document.getElementById('chats-list');
        if (chatsList) {
            chatsList.innerHTML = '<p>Error loading chats: ' + error.message + '</p>';
        }
    }
}

function displayChatsList(chats) {
    const chatsList = document.getElementById('chats-list');
    if (!chatsList) {
        console.error('Chats list element not found');
        return;
    }
    
    if (chats.length === 0) {
        chatsList.innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p>No active chats yet. Chats will appear here when employers accept your applications.</p>
                </div>
            </div>
        `;
        return;
    }
    
    chatsList.innerHTML = chats.map(chatDoc => {
        const chat = chatDoc.data();
        const otherParticipant = chat.participants.employer === currentUser.uid ? 
            'Member' : 'Employer';
            
        return `
            <div class="content-card chat-item" onclick="openChat('${chat.chatId}')">
                <div class="card-header">
                    <h3>${chat.project.title}</h3>
                    <span class="card-stats">${otherParticipant}</span>
                </div>
                <div class="card-content">
                    <p>Project Type: ${chat.project.type}</p>
                    <p>Last activity: ${formatDate(chat.lastActivity)}</p>
                </div>
            </div>
        `;
    }).join('');
}

async function openChat(chatId) {
    console.log("Opening chat:", chatId);
    currentChatId = chatId;
    
    const chatWindow = document.getElementById('chat-window');
    const chatsList = document.getElementById('chats-list');
    
    if (chatWindow) chatWindow.style.display = 'block';
    if (chatsList) chatsList.style.display = 'none';
    
    await loadChatMessages(chatId);
}

async function loadChatMessages(chatId) {
    try {
        const chatDoc = await firebase.firestore().collection('chats').doc(chatId).get();
        if (chatDoc.exists) {
            const chatData = chatDoc.data();
            
            console.log('=== CHAT STRUCTURE ANALYSIS ===');
            console.log('Chat ID:', chatId);
            console.log('Participants:', chatData.participants);
            console.log('Current User UID:', currentUser.uid);
            console.log('Is employer participant?', chatData.participants?.employer === currentUser.uid);
            console.log('Is member participant?', chatData.participants?.member === currentUser.uid);
            console.log('Your role in this chat:', 
                chatData.participants?.employer === currentUser.uid ? 'EMPLOYER' : 
                chatData.participants?.member === currentUser.uid ? 'MEMBER' : 'UNKNOWN'
            );
            
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

function displayMessages(messages) {
    const container = document.getElementById('messages-container');
    if (!container) {
        console.error('Messages container not found!');
        return;
    }
    
    console.log('=== DISPLAY MESSAGES - DEBUG SENDER DETECTION ===');
    console.log('Current User UID:', currentUser?.uid);
    console.log('Number of messages:', messages.length);
    
    // Log each message with FULL details for debugging
    messages.forEach((msg, index) => {
        const isOwn = msg.sender === currentUser.uid;
        console.log(`Message ${index}:`, {
            content: msg.content,
            sender: msg.sender,
            currentUser: currentUser.uid,
            isOwnMessage: isOwn,
            senderLength: msg.sender?.length,
            currentUserLength: currentUser.uid?.length,
            stringsEqual: msg.sender === currentUser.uid,
            exactComparison: `"${msg.sender}" === "${currentUser.uid}" = ${msg.sender === currentUser.uid}`
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
        
        console.log(`Rendering: "${msg.content.substring(0, 30)}..." as ${messageClass} (sender: ${msg.sender})`);
        
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
    
    // Debug the final rendered result
    setTimeout(() => {
        const renderedMessages = container.querySelectorAll('.message');
        console.log('=== FINAL RENDERED RESULT ===');
        console.log(`Rendered ${renderedMessages.length} messages`);
        
        renderedMessages.forEach((msg, index) => {
            const content = msg.querySelector('.message-content').textContent;
            const classes = msg.className;
            const computedStyle = window.getComputedStyle(msg);
            
            console.log(`Final Message ${index + 1}:`, {
                content: content.substring(0, 40) + '...',
                classes: classes,
                alignSelf: computedStyle.alignSelf,
                marginLeft: computedStyle.marginLeft,
                marginRight: computedStyle.marginRight,
                isOwn: classes.includes('own'),
                isOther: classes.includes('other')
            });
        });
    }, 100);
}

// Send message function for member (matching employer version)
async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message || !currentChatId) {
        return;
    }
    
    try {
        // Create message with client timestamp
        const newMessage = {
            id: Date.now().toString(),
            sender: currentUser.uid,
            content: message,
            type: 'text',
            timestamp: new Date(), // Client timestamp
            read: false
        };

        // Add message to the array and update lastActivity
        await firebase.firestore().collection('chats').doc(currentChatId).update({
            messages: firebase.firestore.FieldValue.arrayUnion(newMessage),
            lastActivity: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = '';
        console.log('Member message sent successfully');
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message. Please try again.');
    }
}

function closeChat() {
    console.log("Closing chat");
    
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

function formatTime(date) {
    if (!date) return 'Just now';
    try {
        // Handle both Firestore timestamps and regular Date objects
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diffMs = now - dateObj;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMs < 0) return 'Just now';
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        
        if (dateObj.toDateString() === now.toDateString()) {
            return dateObj.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
        
        return dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    } catch (error) {
        return 'Just now';
    }
}
function testChatLayout() {
    console.log('Testing chat layout with fixed styles...');
    
    const container = document.getElementById('messages-container');
    if (!container) {
        console.error('No messages container found');
        return;
    }
    
    // Clear any existing messages
    container.innerHTML = '';
    
    // Add test messages with proper structure
    const testMessages = [
        { content: "Test message from other person", sender: "other-user-id", timestamp: new Date() },
        { content: "Test message from you", sender: currentUser.uid, timestamp: new Date() },
        { content: "Another test message from other person", sender: "other-user-id", timestamp: new Date() }
    ];
    
    testMessages.forEach(msg => {
        const isOwn = msg.sender === currentUser.uid;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
        messageDiv.innerHTML = `
            <div class="message-content">${msg.content}</div>
            <div class="message-time">Just now</div>
        `;
        container.appendChild(messageDiv);
    });
    
    console
    
    function debugChatData(chatId) {
    console.log('=== DEBUG CHAT DATA ===');
    console.log('Chat ID:', chatId);
    console.log('Current User UID:', currentUser.uid);
    
    firebase.firestore().collection('chats').doc(chatId).get().then(doc => {
        if (doc.exists) {
            const chatData = doc.data();
            console.log('Full Chat Data:', chatData);
            console.log('Participants:', chatData.participants);
            console.log('Messages:', chatData.messages);
            
            if (chatData.messages) {
                chatData.messages.forEach((msg, index) => {
                    console.log(`Message ${index}:`, {
                        sender: msg.sender,
                        content: msg.content,
                        isCurrentUser: msg.sender === currentUser.uid,
                        senderType: msg.sender === chatData.participants.employer ? 'EMPLOYER' : 
                                   msg.sender === chatData.participants.member ? 'MEMBER' : 'UNKNOWN'
                    });
                });
            }
        }
    }).catch(error => {
        console.error('Error debugging chat data:', error);
    });
}

// Call this when opening a chat
async function openChat(chatId) {
    console.log("Opening chat:", chatId);
    currentChatId = chatId;
    
    const chatWindow = document.getElementById('chat-window');
    const chatsList = document.getElementById('chats-list');
    
    if (chatWindow) chatWindow.style.display = 'block';
    if (chatsList) chatsList.style.display = 'none';
    
    // Debug the chat data first
    await debugChatData(chatId);
    
    await loadChatMessages(chatId);
}console.log('Test messages added. Check if they show zigzag layout.');
}

// DEBUG: Add this to main.js to check learning section initialization
console.log("🔍 MAIN.JS: Checking learning section initialization");

// In your section switching code, add debug logs
function showSection(sectionId) {
    console.log("🔄 MAIN.JS: Switching to section:", sectionId);
    
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
        console.log("✅ MAIN.JS: Section activated:", sectionId);
        
        // If it's the learning section, make sure it's properly initialized
        if (sectionId === 'learning') {
            console.log("🎯 MAIN.JS: Learning section activated, current state:", {
                learningModules: window.learningModules,
                currentModule: window.currentModule
            });
            
            // Re-initialize if needed
            if (window.learningModules && window.learningModules.length === 0) {
                console.log("🔄 MAIN.JS: Re-initializing learning section");
                window.loadLearningModules && window.loadLearningModules();
            }
        }
    } else {
        console.log("❌ MAIN.JS: Section not found:", sectionId);
    }
}

// Also add this to make it available globally
window.testChatLayout = testChatLayout;
// Export functions for global access
window.loadSection = loadSection;
window.openChat = openChat;
window.closeChat = closeChat;
window.sendMessage = sendMessage;
window.updateProfileSection = updateProfileSection;
window.initializeXpSystem = initializeXpSystem;