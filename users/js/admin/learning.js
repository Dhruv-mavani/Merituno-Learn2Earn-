// users/js/admin/learning.js - SIMPLE FIXED VERSION

console.log('🔧 Learning.js loaded');

// ===== ADMIN LEARNING FUNCTIONS =====
let currentEditingModuleId = null;

// Admin Learning Management Functions

// Function to show create module form
function showCreateModuleForm() {
    console.log("📝 Showing create module form...");
    
    // Hide modules container and show form
    document.getElementById('modules-container').style.display = 'none';
    document.getElementById('create-module-form').style.display = 'block';
    
    // Reset form
    document.getElementById('create-module-form').reset();
    clearDynamicFields();
}

// Function to close create module form
function closeCreateModule() {
    console.log("❌ Closing create module form...");
    
    // Hide form and show modules container
    document.getElementById('create-module-form').style.display = 'none';
    document.getElementById('modules-container').style.display = 'block';
    
    // Refresh modules list
    loadLearningModules();
}

// Function to handle form submission
function handleCreateModule(event) {
    event.preventDefault();
    console.log("🚀 Creating new module...");
    CreateModule();
}

// Function to create a new learning module
function CreateModule() {
    console.log("📝 Creating new module...");
    
    // Get form data
    const moduleData = {
        title: document.getElementById('module-title').value.trim(),
        description: document.getElementById('module-description').value.trim(),
        level: document.getElementById('module-star-level').value,
        xpReward: parseInt(document.getElementById('module-xp-reward').value) || 100,
        skillTags: document.getElementById('module-skills').value.split(',').map(skill => skill.trim()).filter(skill => skill),
        videos: getVideoLinks(),
        quizQuestions: getQuizQuestions(),
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Validate required fields
    if (!moduleData.title) {
        alert('Please enter a module title');
        return;
    }

    if (!moduleData.description) {
        alert('Please enter a module description');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#create-module-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    // Save to Firestore
    const db = firebase.firestore();
    db.collection('learning_modules').add(moduleData)
        .then((docRef) => {
            console.log('✅ Module created with ID:', docRef.id);
            alert('Module created successfully!');
            
            // Reset form and close
            closeCreateModule();
        })
        .catch((error) => {
            console.error('❌ Error creating module:', error);
            alert('Error creating module: ' + error.message);
        })
        .finally(() => {
            // Restore button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// Helper function to get video links from dynamic fields
function getVideoLinks() {
    const videoLinks = [];
    const videoInputs = document.querySelectorAll('#video-links-container input[type="url"]');
    
    videoInputs.forEach(input => {
        const url = input.value.trim();
        if (url) {
            videoLinks.push(url);
        }
    });
    
    return videoLinks;
}

// Helper function to get quiz questions from dynamic fields
function getQuizQuestions() {
    const questions = [];
    const questionContainers = document.querySelectorAll('#quiz-questions-container .quiz-question-container');
    
    questionContainers.forEach(container => {
        const questionInput = container.querySelector('input[placeholder="Question"]');
        const optionInputs = container.querySelectorAll('input[placeholder^="Option"]');
        
        if (questionInput && optionInputs.length >= 2) {
            const questionText = questionInput.value.trim();
            const options = [];
            
            // Get options
            optionInputs.forEach(input => {
                const optionText = input.value.trim();
                if (optionText) {
                    options.push(optionText);
                }
            });
            
            // Get correct answer (for now, assume first option is correct)
            // You'll need to implement proper correct answer selection
            const correctAnswer = 0;
            
            if (questionText && options.length >= 2) {
                questions.push({
                    question: questionText,
                    options: options,
                    correctAnswer: correctAnswer
                });
            }
        }
    });
    
    return questions;
}

// Function to add video link field
function addVideoLink() {
    const container = document.getElementById('video-links-container');
    const newVideoDiv = document.createElement('div');
    newVideoDiv.className = 'video-link-container';
    newVideoDiv.innerHTML = `
        <input type="url" placeholder="Enter YouTube video URL">
        <button type="button" class="remove-video-link" onclick="removeVideoLink(this)">Remove</button>
    `;
    container.appendChild(newVideoDiv);
}

// Function to remove video link field
function removeVideoLink(button) {
    const container = document.getElementById('video-links-container');
    const videoContainers = container.querySelectorAll('.video-link-container');
    
    // Don't remove the last one
    if (videoContainers.length > 1) {
        button.parentElement.remove();
    }
}

// Function to add quiz question field
function addQuizQuestion() {
    const container = document.getElementById('quiz-questions-container');
    const newQuestionDiv = document.createElement('div');
    newQuestionDiv.className = 'quiz-question-container';
    newQuestionDiv.innerHTML = `
        <input type="text" placeholder="Question" required>
        <input type="text" placeholder="Option 1" required>
        <input type="text" placeholder="Option 2" required>
        <input type="text" placeholder="Option 3">
        <input type="text" placeholder="Option 4">
        <button type="button" class="remove-quiz-question" onclick="removeQuizQuestion(this)">Remove</button>
    `;
    container.appendChild(newQuestionDiv);
}

// Function to remove quiz question field
function removeQuizQuestion(button) {
    const container = document.getElementById('quiz-questions-container');
    const questionContainers = container.querySelectorAll('.quiz-question-container');
    
    // Don't remove the last one
    if (questionContainers.length > 1) {
        button.parentElement.remove();
    }
}

// Function to clear dynamic fields (video links and quiz questions)
function clearDynamicFields() {
    // Clear video links (keep first one)
    const videoContainer = document.getElementById('video-links-container');
    const firstVideo = videoContainer.querySelector('.video-link-container');
    videoContainer.innerHTML = '';
    videoContainer.appendChild(firstVideo);
    firstVideo.querySelector('input').value = '';
    
    // Clear quiz questions (keep first one)
    const quizContainer = document.getElementById('quiz-questions-container');
    const firstQuestion = quizContainer.querySelector('.quiz-question-container');
    quizContainer.innerHTML = '';
    quizContainer.appendChild(firstQuestion);
    
    // Reset first question
    const inputs = firstQuestion.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
}

// Function to load learning modules
function loadLearningModules() {
    console.log("📚 Loading learning modules...");
    
    const db = firebase.firestore();
    const modulesContainer = document.getElementById('modules-container');
    
    modulesContainer.innerHTML = '<div class="loading">Loading modules...</div>';
    
    db.collection('learning_modules')
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                modulesContainer.innerHTML = '<div class="no-data">No learning modules found. Create your first module!</div>';
                return;
            }
            
            let modulesHTML = '';
            snapshot.forEach(doc => {
                const module = doc.data();
                modulesHTML += createModuleCard(doc.id, module);
            });
            
            modulesContainer.innerHTML = modulesHTML;
            
            // Update sidebar count
            document.getElementById('sidebar-learning-count').textContent = snapshot.size;
        })
        .catch((error) => {
            console.error('Error loading modules:', error);
            modulesContainer.innerHTML = '<div class="error">Error loading modules: ' + error.message + '</div>';
        });
}

// Function to create module card HTML
function createModuleCard(id, module) {
    const skillsHTML = module.skillTags && module.skillTags.length > 0 
        ? module.skillTags.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
        : '<span class="skill-tag">No skills</span>';
    
    return `
        <div class="module-card" data-module-id="${id}">
            <div class="module-header">
                <h3 class="module-title">${module.title || 'Untitled Module'}</h3>
                <span class="module-level">Level ${module.level || 1}</span>
            </div>
            <div class="module-details">
                <p>${module.description || 'No description'}</p>
                <div class="module-skills">${skillsHTML}</div>
                <div class="module-meta">
                    <span>XP: ${module.xpReward || 0}</span>
                    <span>Videos: ${module.videos ? module.videos.length : 0}</span>
                    <span>Questions: ${module.quizQuestions ? module.quizQuestions.length : 0}</span>
                    <span class="status-badge ${module.status || 'active'}">${module.status || 'active'}</span>
                </div>
            </div>
            <div class="module-actions">
                <button class="btn-edit-module" onclick="editModule('${id}')">Edit</button>
                <button class="btn-delete-module" onclick="deleteModule('${id}')">Delete</button>
            </div>
        </div>
    `;
}

// Function to edit module
function editModule(moduleId) {
    console.log("✏️ Editing module:", moduleId);
    // Implement edit functionality
    alert('Edit functionality for module: ' + moduleId);
}

// Function to delete module
function deleteModule(moduleId) {
    if (confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
        const db = firebase.firestore();
        db.collection('learning_modules').doc(moduleId).delete()
            .then(() => {
                console.log('✅ Module deleted successfully');
                alert('Module deleted successfully!');
                loadLearningModules();
            })
            .catch((error) => {
                console.error('❌ Error deleting module:', error);
                alert('Error deleting module: ' + error.message);
            });
    }
}

// Initialize learning management when section is shown
function initLearningManagement() {
    console.log("🎯 Initializing learning management...");
    loadLearningModules();
}



// Only run admin functions if we're on admin pages
function isAdminPage() {
    return window.location.pathname.includes('admin') || 
           document.getElementById('create-module-form') ||
           document.getElementById('edit-module-modal');
}

// Only run member functions if we're on member pages  
function isMemberPage() {
    return window.location.pathname.includes('member') ||
           (document.getElementById('modules-container') && 
            !document.getElementById('create-module-form'));
}

// Helper function to add an option input to the form
function addOptionInput(optionsList, value = '', isNew = true) {
    if (!isAdminPage()) return;
    
    const index = optionsList.querySelectorAll('.option-input').length;
    const div = document.createElement('div');
    div.className = 'option-input-container d-flex align-items-center mb-2';
    div.innerHTML = `
        <input type="text" class="form-control option-input" 
               placeholder="Option ${index + 1}" 
               value="${value}"
               required style="margin-right: 10px;">
        ${index > 0 || !isNew ? 
            `<button type="button" class="btn btn-sm btn-danger remove-option" 
                     onclick="this.closest('.option-input-container').remove()">
                &times;
            </button>` : ''
        }
    `;
    optionsList.appendChild(div);
}

// Fetch all learning modules for admin
function fetchAllModules() {
    if (!isAdminPage()) return;
    
    const db = firebase.firestore();
    const container = document.getElementById('modules-container');
    
    if (!container) {
        console.log('❌ Admin modules container not found');
        return;
    }
    
    container.innerHTML = '<div class="loading">Loading modules...</div>';
    
    db.collection('learning_modules').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = '<div class="no-data">No learning modules found</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const module = doc.data();
            const moduleElement = createModuleElement(doc.id, module);
            container.appendChild(moduleElement);
        });
    }).catch(error => {
        console.error('Error fetching modules:', error);
        container.innerHTML = '<div class="error">Error loading modules</div>';
    });
}

// Create module element for admin
function createModuleElement(moduleId, module) {
    const div = document.createElement('div');
    div.className = 'module-card';
    
    const starDisplay = '★'.repeat(module.starLevelRequired || 1) + '☆'.repeat(5 - (module.starLevelRequired || 1));
    
    div.innerHTML = `
        <div class="module-header">
            <h3 class="module-title">${module.title || 'Untitled Module'}</h3>
            <span class="module-level">Level: ${getLevelName(module.starLevelRequired || 1)}</span>
        </div>
        <div class="module-details">
            <p><strong>Description:</strong> ${module.description || 'No description'}</p>
            <p><strong>Skills:</strong> ${module.skillTags ? module.skillTags.join(', ') : 'No skills specified'}</p>
            <p><strong>XP Reward:</strong> ${module.xpReward || 0} XP</p>
            <p><strong>Star Requirement:</strong> ${starDisplay}</p>
            <p><strong>Questions:</strong> ${module.quizQuestions ? module.quizQuestions.length : 0}</p>
            <p><strong>Videos:</strong> ${module.videoLinks ? module.videoLinks.length : 0}</p>
        </div>
        <div class="module-actions">
            <button class="btn-edit-module" onclick="openEditModule('${moduleId}')">Edit</button>
            <button class="btn-delete-module" onclick="deleteModule('${moduleId}')">Delete</button>
        </div>
    `;
    
    return div;
}

function getLevelName(starLevel) {
    const levels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return levels[starLevel - 1] || 'Unknown';
}

// Open create module form
function openCreateModule() {
    if (!isAdminPage()) return;
    
    document.getElementById('create-module-form').style.display = 'block';
    const quizContainer = document.getElementById('quiz-questions-container');
    if (quizContainer) quizContainer.innerHTML = '';
}

// Close create module form
function closeCreateModule() {
    document.getElementById('create-module-form').style.display = 'none';
}

// Add quiz question field
function addQuizQuestion() {
    if (!isAdminPage()) return;
    
    const container = document.getElementById('quiz-questions-container');
    const div = document.createElement('div');
    div.className = 'quiz-question-group mb-4 p-3 border rounded';
    
    const questionId = 'q-' + Date.now();
    
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h4>New Question</h4>
            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.quiz-question-group').remove()">
                Remove Question
            </button>
        </div>
        
        <div class="form-group">
            <label>Question Text</label>
            <input type="text" class="form-control question-text-input" placeholder="e.g., Which tag defines a heading?" required>
        </div>
        
        <div class="form-group">
            <label>Multiple Choice Options</label>
            <div class="quiz-options-list" id="options-list-${questionId}">
            </div>
            <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="addOptionInput(document.getElementById('options-list-${questionId}'))">
                Add Option
            </button>
        </div>
        
        <div class="form-group">
            <label>Correct Answer Index</label>
            <input type="number" class="form-control correct-answer-index" 
                   placeholder="Enter the number index of the correct option (0, 1, 2...)" 
                   min="0" required>
            <small class="form-text text-muted">0 is the first option, 1 is the second, etc.</small>
        </div>
    `;
    
    container.appendChild(div);
    
    // Add initial options
    addOptionInput(document.getElementById(`options-list-${questionId}`), '', true);
    addOptionInput(document.getElementById(`options-list-${questionId}`), '', true);
}

// Handle create module form submission
function handleCreateModule(event) {
    event.preventDefault();
    
    if (!isAdminPage()) return;
    
    const title = document.getElementById('module-title').value.trim();
    const description = document.getElementById('module-description').value.trim();
    const skills = document.getElementById('module-skills').value.split(',').map(s => s.trim()).filter(s => s);
    const starLevel = parseInt(document.getElementById('module-star-level').value);
    const xpReward = parseInt(document.getElementById('module-xp-reward').value);
    
    // 1. Get video links
    const videoLinks = [];
    const videoInputs = document.querySelectorAll('#video-links-container input');
    videoInputs.forEach(input => {
        if (input.value.trim()) {
            videoLinks.push(input.value.trim());
        }
    });
    
    // 2. Get quiz questions
    const quizQuestions = [];
    const questionContainers = document.querySelectorAll('.quiz-question-group');
    
    questionContainers.forEach(container => {
        const questionText = container.querySelector('.question-text-input').value.trim();
        const correctAnswerIndex = parseInt(container.querySelector('.correct-answer-index').value);
        
        // Fetch the options array
        const optionInputs = container.querySelectorAll('.option-input');
        const options = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(value => value.length > 0);
        
        // Validate question data
        if (questionText && options.length >= 2 && !isNaN(correctAnswerIndex) && correctAnswerIndex < options.length) {
            quizQuestions.push({ 
                question: questionText,
                options: options,
                correctAnswer: correctAnswerIndex
            });
        }
    });
    
    // Validate required fields
    if (!title || !description) {
        alert('Please fill in title and description');
        return;
    }
    
    if (quizQuestions.length === 0) {
        alert('Please add at least one valid quiz question with options.');
        return;
    }
    
    const db = firebase.firestore();
    const moduleData = {
        title: title,
        description: description,
        skillTags: skills,
        starLevelRequired: starLevel,
        xpReward: xpReward,
        videoLinks: videoLinks,
        quizQuestions: quizQuestions,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: firebase.auth().currentUser.uid,
        status: 'active'
    };
    
    db.collection('learning_modules').add(moduleData)
        .then(() => {
            alert('Module created successfully!');
            closeCreateModule();
            fetchAllModules();
        })
        .catch(error => {
            console.error('Error creating module:', error);
            alert('Error creating module: ' + error.message);
        });
}

// Add video link field
function addVideoLink() {
    if (!isAdminPage()) return;
    
    const container = document.getElementById('video-links-container');
    const div = document.createElement('div');
    div.className = 'video-link-container';
    div.innerHTML = `
        <input type="url" placeholder="YouTube URL">
        <button type="button" class="remove-video-link" onclick="this.parentElement.remove()">Remove</button>
    `;
    container.appendChild(div);
}

// Open edit module modal
function openEditModule(moduleId) {
    if (!isAdminPage()) return;
    
    const db = firebase.firestore();
    currentEditingModuleId = moduleId;
    
    db.collection('learning_modules').doc(moduleId).get().then(doc => {
        if (doc.exists) {
            const module = doc.data();
            populateEditForm(module);
            document.getElementById('edit-module-modal').style.display = 'block';
        }
    }).catch(error => {
        console.error('Error fetching module:', error);
        alert('Error loading module details');
    });
}

// Populate edit form with module data
function populateEditForm(module) {
    if (!isAdminPage()) return;
    
    // Populate basic fields
    document.getElementById('edit-module-title').value = module.title || '';
    document.getElementById('edit-module-description').value = module.description || '';
    document.getElementById('edit-module-skills').value = module.skillTags ? module.skillTags.join(', ') : '';
    document.getElementById('edit-module-star-level').value = module.starLevelRequired || 1;
    document.getElementById('edit-module-xp-reward').value = module.xpReward || 100;
    
    // Populate video links
    const videoContainer = document.getElementById('edit-video-links-container');
    videoContainer.innerHTML = '';
    if (module.videoLinks && module.videoLinks.length > 0) {
        module.videoLinks.forEach(url => {
            addEditVideoLink(url);
        });
    } else {
        addEditVideoLink();
    }
    
    // Populate quiz questions
    const quizContainer = document.getElementById('edit-quiz-questions-container');
    quizContainer.innerHTML = '';
    
    if (module.quizQuestions && module.quizQuestions.length > 0) {
        module.quizQuestions.forEach(q => {
            addEditQuizQuestion(q);
        });
    } else {
        addEditQuizQuestion();
    }
}

// Add video link to edit form
function addEditVideoLink(url = '') {
    if (!isAdminPage()) return;
    
    const container = document.getElementById('edit-video-links-container');
    const div = document.createElement('div');
    div.className = 'video-link-container';
    div.innerHTML = `
        <input type="url" placeholder="YouTube URL" value="${url}">
        <button type="button" class="remove-video-link" onclick="this.parentElement.remove()">Remove</button>
    `;
    container.appendChild(div);
}

// Add quiz question to edit form
function addEditQuizQuestion(questionData = {}) {
    if (!isAdminPage()) return;
    
    const container = document.getElementById('edit-quiz-questions-container');
    const div = document.createElement('div');
    div.className = 'quiz-question-group mb-4 p-3 border rounded';
    
    const questionId = 'q-' + Date.now() + Math.random().toString(36).substring(7);

    const optionsHtml = (questionData.options || ['', '', '']).map((option, index) => {
        return `<div class="option-input-container d-flex align-items-center mb-2">
                    <input type="text" class="form-control option-input" 
                           placeholder="Option ${index + 1}" 
                           value="${option}"
                           required style="margin-right: 10px;">
                    ${index > 0 || !questionData.options ? 
                        `<button type="button" class="btn btn-sm btn-danger remove-option" 
                                 onclick="this.closest('.option-input-container').remove()">
                            &times;
                        </button>` : ''
                    }
                </div>`;
    }).join('');
    
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h4>Edit Question</h4>
            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.quiz-question-group').remove()">
                Remove Question
            </button>
        </div>
        
        <div class="form-group">
            <label>Question Text</label>
            <input type="text" class="form-control question-text-input" 
                   value="${questionData.question || ''}" 
                   style="width: 100%; margin-bottom: 10px;" required>
        </div>
        
        <div class="form-group">
            <label>Multiple Choice Options</label>
            <div class="quiz-options-list" id="edit-options-list-${questionId}">
                ${optionsHtml}
            </div>
            <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="addOptionInput(document.getElementById('edit-options-list-${questionId}'))">
                Add Option
            </button>
        </div>
        
        <div class="form-group">
            <label>Correct Answer Index</label>
            <input type="number" class="form-control correct-answer-index" 
                   placeholder="Enter the number index of the correct option (0, 1, 2...)" 
                   value="${questionData.correctAnswer !== undefined ? questionData.correctAnswer : ''}"
                   min="0" required>
            <small class="form-text text-muted">0 is the first option, 1 is the second, etc.</small>
        </div>
    `;
    container.appendChild(div);
}

// Handle edit module form submission
function handleEditModule(event) {
    event.preventDefault();
    
    if (!isAdminPage() || !currentEditingModuleId) return;
    
    const title = document.getElementById('edit-module-title').value.trim();
    const description = document.getElementById('edit-module-description').value.trim();
    const skills = document.getElementById('edit-module-skills').value.split(',').map(s => s.trim()).filter(s => s);
    const starLevel = parseInt(document.getElementById('edit-module-star-level').value);
    const xpReward = parseInt(document.getElementById('edit-module-xp-reward').value);
    
    // 1. Get video links
    const videoLinks = [];
    const videoInputs = document.querySelectorAll('#edit-video-links-container input');
    videoInputs.forEach(input => {
        if (input.value.trim()) {
            videoLinks.push(input.value.trim());
        }
    });
    
    // 2. Get quiz questions
    const quizQuestions = [];
    const questionContainers = document.querySelectorAll('#edit-quiz-questions-container .quiz-question-group');
    
    questionContainers.forEach(container => {
        const questionText = container.querySelector('.question-text-input').value.trim();
        const correctAnswerIndex = parseInt(container.querySelector('.correct-answer-index').value);
        
        // Fetch the options array
        const optionInputs = container.querySelectorAll('.option-input');
        const options = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(value => value.length > 0);
        
        // Validate question data
        if (questionText && options.length >= 2 && !isNaN(correctAnswerIndex) && correctAnswerIndex < options.length) {
            quizQuestions.push({ 
                question: questionText,
                options: options,
                correctAnswer: correctAnswerIndex
            });
        }
    });
    
    if (quizQuestions.length === 0) {
        alert('Please ensure you have at least one valid quiz question with options.');
        return;
    }

    const updateData = {
        title,
        description,
        skillTags: skills,
        starLevelRequired: starLevel,
        xpReward: xpReward,
        videoLinks,
        quizQuestions,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const db = firebase.firestore();
    db.collection('learning_modules').doc(currentEditingModuleId).update(updateData)
        .then(() => {
            alert('Module updated successfully!');
            closeEditModal();
            fetchAllModules();
        })
        .catch(error => {
            console.error('Error updating module:', error);
            alert('Error updating module. Please try again.');
        });
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-module-modal').style.display = 'none';
    currentEditingModuleId = null;
}

// Delete module
function deleteModule(moduleId) {
    if (!isAdminPage()) return;
    
    if (!confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
        return;
    }
    
    const db = firebase.firestore();
    db.collection('learning_modules').doc(moduleId).delete()
        .then(() => {
            alert('Module deleted successfully!');
            fetchAllModules();
        })
        .catch(error => {
            console.error('Error deleting module:', error);
            alert('Error deleting module. Please try again.');
        });
}

// ===== SIMPLE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Learning.js initialized');
    
    // Only set up admin forms if we're on admin page
    if (isAdminPage()) {
        console.log('🏢 Setting up admin learning forms');
        
        const createForm = document.getElementById('create-module-form');
        if (createForm) {
            createForm.addEventListener('submit', handleCreateModule);
        }
        
        const editForm = document.getElementById('edit-module-form');
        if (editForm) {
            editForm.addEventListener('submit', handleEditModule);
        }
        
        // Only load modules if we're on the admin learning management page
        if (document.getElementById('modules-container') && document.getElementById('create-module-form')) {
            fetchAllModules();
        }
    }
    
    // Don't auto-load anything for members - let member pages handle their own loading
});

// Make functions globally available
window.showCreateModuleForm = showCreateModuleForm;
window.closeCreateModule = closeCreateModule;
window.handleCreateModule = handleCreateModule;
window.CreateModule = CreateModule;
window.addVideoLink = addVideoLink;
window.removeVideoLink = removeVideoLink;
window.addQuizQuestion = addQuizQuestion;
window.removeQuizQuestion = removeQuizQuestion;
window.loadLearningModules = loadLearningModules;
window.editModule = editModule;
window.deleteModule = deleteModule;
window.initLearningManagement = initLearningManagement;