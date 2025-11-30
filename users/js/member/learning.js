// DEBUG: Add this at the very top of learning.js
console.log("🚀 learning.js loaded successfully");
console.log("📋 Available functions:", Object.keys(window).filter(key => typeof window[key] === 'function'));

// Add this to the initLearningSection function
function initLearningSection(user, candidateData) {
    console.log("🎯 INIT: Learning section initialized", {
        user: user?.email,
        candidateData: candidateData,
        learningSection: document.getElementById('learning-section')
    });
    
    // Load learning modules
    loadLearningModules();
    
    // Set up event listeners for learning section
    setupLearningEventListeners();
}

// FIXED: Load learning modules with correct field names
async function loadLearningModules() {
    try {
        const db = firebase.firestore();
        
        const modulesSnapshot = await db.collection('learning_modules')
            .where('status', '==', 'active')
            .get(); 
        
        learningModules = [];
        modulesSnapshot.forEach(doc => {
            const moduleData = doc.data();
            
            console.log('📦 Raw module data from Firestore:', {
                id: doc.id,
                data: moduleData
            });
            
            // FIXED: Use 'videoLinks' instead of 'videos'
            const videos = moduleData.videoLinks || moduleData.videos || moduleData.youtubeLinks || [];
            
            // FIXED: Properly handle quiz data structure
            const quizQuestions = moduleData.quizQuestions || [];
            const processedQuestions = quizQuestions.map((q, index) => {
                console.log(`❓ Question ${index}:`, q);
                
                // Handle different option formats
                let options = [];
                if (q.options && Array.isArray(q.options)) {
                    options = q.options;
                } else if (q.option1 || q.option2 || q.option3 || q.option4) {
                    // Handle object format: {option1: "A", option2: "B", ...}
                    options = [
                        q.option1 || '',
                        q.option2 || '',
                        q.option3 || '',
                        q.option4 || ''
                    ].filter(opt => opt !== '');
                }
                
                return {
                    question: q.question || 'No question text',
                    options: options,
                    correctAnswer: q.correctAnswer !== undefined ? parseInt(q.correctAnswer) : 0
                };
            });
            
            learningModules.push({
                id: doc.id,
                title: moduleData.title || 'Untitled Module',
                description: moduleData.description || 'No description available',
                videos: videos, // FIXED: Now using the correct data
                quiz: { 
                    questions: processedQuestions
                },
                xp: moduleData.xpReward || moduleData.xp || 0,
                skills: moduleData.skillTags || moduleData.skills || [],
                ...moduleData
            });
        });
        
        console.log(`✅ Loaded ${learningModules.length} modules:`, learningModules);
        
        // Display modules in the grid
        displayLearningModules();
        
    } catch (error) {
        console.error("❌ Error loading learning modules:", error);
        const learningSection = document.getElementById('learning-section');
        if (learningSection) {
            learningSection.innerHTML = `
                <div class="section-header">
                    <h2>Learning Resources</h2>
                    <p>Develop your skills with our curated learning paths</p>
                </div>
                <div class="error-message">
                    <p>Unable to load learning modules. Please try again later.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    }
}

// candidate-learning.js - Learning & Gamification module for Candidate Dashboard

// Global variables
let learningModules = [];
let currentModule = null;
let currentQuestionIndex = 0;
let userAnswers = [];

// Initialize the learning section
function initLearningSection(user, candidateData) {
    console.log("Initializing Learning Section");
    
    // Load learning modules
    loadLearningModules();
    
    // Set up event listeners for learning section
    setupLearningEventListeners();
}

// FIXED: Load learning modules with correct field names
async function loadLearningModules() {
    try {
        const db = firebase.firestore();
        
        const modulesSnapshot = await db.collection('learning_modules')
            .where('status', '==', 'active')
            .get(); 
        
        learningModules = [];
        modulesSnapshot.forEach(doc => {
            const moduleData = doc.data();
            
            console.log('📦 Raw module data from Firestore:', {
                id: doc.id,
                data: moduleData
            });
            
            // FIXED: Use 'videoLinks' instead of 'videos'
            const videos = moduleData.videoLinks || moduleData.videos || moduleData.youtubeLinks || [];
            
            // FIXED: Properly handle quiz data structure
            const quizQuestions = moduleData.quizQuestions || [];
            const processedQuestions = quizQuestions.map((q, index) => {
                console.log(`❓ Question ${index}:`, q);
                
                // Handle different option formats
                let options = [];
                if (q.options && Array.isArray(q.options)) {
                    options = q.options;
                } else if (q.option1 || q.option2 || q.option3 || q.option4) {
                    // Handle object format: {option1: "A", option2: "B", ...}
                    options = [
                        q.option1 || '',
                        q.option2 || '',
                        q.option3 || '',
                        q.option4 || ''
                    ].filter(opt => opt !== '');
                }
                
                return {
                    question: q.question || 'No question text',
                    options: options,
                    correctAnswer: q.correctAnswer !== undefined ? parseInt(q.correctAnswer) : 0
                };
            });
            
            learningModules.push({
                id: doc.id,
                title: moduleData.title || 'Untitled Module',
                description: moduleData.description || 'No description available',
                videos: videos, // FIXED: Now using the correct data
                quiz: { 
                    questions: processedQuestions
                },
                xp: moduleData.xpReward || moduleData.xp || 0,
                skills: moduleData.skillTags || moduleData.skills || [],
                ...moduleData
            });
        });
        
        console.log(`✅ Loaded ${learningModules.length} modules:`, learningModules);
        
        // Display modules in the grid
        displayLearningModules();
        
    } catch (error) {
        console.error("❌ Error loading learning modules:", error);
        const learningSection = document.getElementById('learning-section');
        if (learningSection) {
            learningSection.innerHTML = `
                <div class="section-header">
                    <h2>Learning Resources</h2>
                    <p>Develop your skills with our curated learning paths</p>
                </div>
                <div class="error-message">
                    <p>Unable to load learning modules. Please try again later.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    }
}

// FIXED: Display learning modules in the grid (moved before createModuleCard)
function displayLearningModules() {
    const learningSection = document.getElementById('learning-section');
    if (!learningSection) {
        console.log('❌ Learning section not found');
        return;
    }
    
    learningSection.innerHTML = `
        <div class="section-header">
            <h2>Learning Resources</h2>
            <p>Develop your skills with our curated learning paths</p>
        </div>
        <div class="content-grid" id="learning-grid">
            <!-- Modules will be loaded here -->
        </div>
    `;
    
    const learningGrid = document.getElementById('learning-grid');
    
    if (learningModules.length === 0) {
        learningGrid.innerHTML = `
            <div class="content-card">
                <div class="card-content">
                    <p>No learning modules available at the moment. Please check back later.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Create module cards
    learningModules.forEach(module => {
        const moduleCard = createModuleCard(module);
        learningGrid.appendChild(moduleCard);
    });
}

// FIXED: Create a module card (now properly defined before being called)
function createModuleCard(module) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.dataset.moduleId = module.id;
    
    // Skills badges
    const skillsBadges = module.skills && module.skills.length > 0 
        ? module.skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')
        : '<span class="skill-badge">General</span>';
    
    // Check if module is completed
    checkModuleCompletion(module.id).then(isCompleted => {
        // FIXED: Use 'videos' instead of 'youtubeLinks'
        const videoData = module.videos || module.videoLinks || [];
        const hasVideos = module.videos && module.videos.length > 0;
        const hasQuiz = module.quiz && module.quiz.questions && module.quiz.questions.length > 0;
        
        card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">
                <i class="fas fa-graduation-cap"></i>
            </div>
            <h3 class="card-title">${module.title}</h3>
        </div>
        <div class="card-content">
            <p>${module.description}</p>
            <div class="module-skills">
                ${skillsBadges}
            </div>
            <div class="module-meta">
                <span class="xp-reward"><i class="fas fa-star"></i> ${module.xp} XP</span>
                ${hasVideos ? `<span class="video-count"><i class="fas fa-video"></i> ${videoData.length} videos</span>` : ''}
                ${hasQuiz ? `<span class="quiz-count"><i class="fas fa-question-circle"></i> ${module.quiz.questions.length} questions</span>` : ''}
            </div>
        </div>
        <div class="card-footer">
            <button class="card-action ${isCompleted ? 'completed' : 'start-learning'}" 
                    data-module-id="${module.id}">
                ${isCompleted ? 'Completed <i class="fas fa-check"></i>' : 'Start Learning'}
            </button>
            ${isCompleted ? '<span class="completion-badge">Completed</span>' : '<span class="card-stats">Ready to start</span>'}
        </div>
    `;
        
        // Add event listener to the button
        const button = card.querySelector('.card-action');
        if (isCompleted) {
            button.addEventListener('click', () => {
                alert('You have already completed this module!');
            });
        } else {
            button.addEventListener('click', () => startLearningModule(module));
        }
    });
    
    return card;
}

// Check if a module is completed by the current user
async function checkModuleCompletion(moduleId) {
    try {
        const db = firebase.firestore();
        const currentUser = firebase.auth().currentUser;
        
        if (!currentUser) return false;
        
        const completionDoc = await db.collection('candidateModules')
            .doc(currentUser.uid)
            .collection('completedModules')
            .doc(moduleId)
            .get();
            
        return completionDoc.exists;
    } catch (error) {
        console.error("Error checking module completion:", error);
        return false;
    }
}

// Start a learning module
function startLearningModule(module) {
    console.log('Starting module:', module.title);
    currentModule = module;
    currentQuestionIndex = 0;
    userAnswers = [];
    
    // Show module content view
    showModuleContentView();
}

// FIXED: Show module content with correct video and quiz data
function showModuleContentView() {
    const learningSection = document.getElementById('learning-section');
    if (!learningSection) return;
    
    // FIXED: Use 'videos' instead of 'youtubeLinks'
    const hasVideos = currentModule.videos && currentModule.videos.length > 0;
    const hasQuiz = currentModule.quiz && currentModule.quiz.questions && currentModule.quiz.questions.length > 0;
    
    console.log('🎬 Video debug:', {
        hasVideos: hasVideos,
        videoCount: hasVideos ? currentModule.videos.length : 0,
        videoLinks: hasVideos ? currentModule.videos : [],
        module: currentModule
    });

    learningSection.innerHTML = `
        <div class="module-header">
            <button class="back-button" id="back-to-modules">
                <i class="fas fa-arrow-left"></i> Back to Modules
            </button>
            <h2>${currentModule.title}</h2>
            <p>${currentModule.description}</p>
            <div class="module-stats">
                <span><i class="fas fa-star"></i> ${currentModule.xp} XP Available</span>
                ${hasVideos ? `<span><i class="fas fa-video"></i> ${currentModule.videos.length} Videos</span>` : ''}
                ${hasQuiz ? `<span><i class="fas fa-question-circle"></i> ${currentModule.quiz.questions.length} Questions</span>` : ''}
            </div>
        </div>
        
        <div class="module-content">
            ${hasVideos ? `
                <div class="videos-section">
                    <h3><i class="fas fa-video"></i> Learning Videos</h3>
                    <div class="videos-grid">
                        ${currentModule.videos.map((link, index) => {
                            const videoId = extractYouTubeId(link);
                            console.log(`🎥 Video ${index + 1}:`, { link, videoId });
                            
                            return `
                                <div class="video-card">
                                    <div class="video-thumbnail" onclick="playVideo('${link}')">
                                        ${videoId ? `
                                            <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" 
                                                 alt="Video ${index + 1}"
                                                 class="video-thumb">
                                            <div class="play-overlay">
                                                <i class="fas fa-play-circle"></i>
                                            </div>
                                        ` : `
                                            <div class="video-placeholder">
                                                <i class="fas fa-film"></i>
                                                <p>Video ${index + 1}</p>
                                            </div>
                                        `}
                                    </div>
                                    <div class="video-info">
                                        <h4>Video ${index + 1}</h4>
                                        <button class="watch-video-btn" onclick="playVideo('${link}')">
                                            <i class="fas fa-play"></i> Watch Now
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- Video Player Modal -->
                <div id="video-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="video-modal-title">Video Player</h3>
                            <span class="close-modal" onclick="closeVideoPlayer()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div id="video-player-container">
                                <iframe id="youtube-iframe" width="100%" height="400" 
                                        frameborder="0" allowfullscreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                                </iframe>
                            </div>
                        </div>
                    </div>
                </div>
            ` : '<div class="no-videos-message"><p>No videos available for this module.</p></div>'}
            
            ${hasQuiz ? `
                <div class="quiz-section">
                    <h3><i class="fas fa-question-circle"></i> Knowledge Check</h3>
                    <p>Complete the quiz to earn ${currentModule.xp} XP</p>
                    <div class="quiz-container" id="quiz-container">
                        ${renderCurrentQuestion()}
                    </div>
                </div>
            ` : `
                <div class="no-quiz-section">
                    <h3><i class="fas fa-info-circle"></i> No Quiz Available</h3>
                    <p>This module doesn't have a quiz yet. Watch the videos and check back later.</p>
                </div>
            `}
        </div>
    `;
    
    // Add event listeners
    document.getElementById('back-to-modules').addEventListener('click', () => {
        displayLearningModules();
    });
    
    // Add modal close functionality
    const modal = document.getElementById('video-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVideoPlayer();
            }
        });
    }
}

// FIXED: Play a YouTube video with modal
function playVideo(videoUrl) {
    console.log('🎬 Playing video:', videoUrl);
    
    const videoId = extractYouTubeId(videoUrl);
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('youtube-iframe');
    
    if (videoId && modal && iframe) {
        // Construct the embed URL
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`;
        console.log('🚀 Setting iframe src to:', embedUrl);
        
        iframe.src = embedUrl;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Update modal title
        const titleElement = document.getElementById('video-modal-title');
        if (titleElement) {
            titleElement.textContent = "Now Playing";
        }
    } else {
        console.error('❌ Cannot play video:', { videoUrl, videoId, modal: !!modal, iframe: !!iframe });
        alert(`Cannot play this video. Please check the video URL:\n${videoUrl}`);
    }
}

// FIXED: Close video player
function closeVideoPlayer() {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('youtube-iframe');
    
    console.log('⏹️ Closing video player');
    
    // Stop video playback
    if (iframe) {
        iframe.src = '';
    }
    
    // Hide modal
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Restore scrolling
    document.body.style.overflow = 'auto';
}

// FIXED: Better YouTube ID extraction
function extractYouTubeId(url) {
    if (!url) {
        console.log('❌ No URL provided');
        return null;
    }
    
    console.log('🔍 Extracting YouTube ID from:', url);
    
    // Remove any extra spaces
    url = url.trim();
    
    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&?#]+)/,           // youtube.com/watch?v=ID
        /(?:youtu\.be\/)([^&?#]+)/,                       // youtu.be/ID
        /(?:youtube\.com\/embed\/)([^&?#]+)/,             // youtube.com/embed/ID
        /(?:youtube\.com\/v\/)([^&?#]+)/,                 // youtube.com/v/ID
        /(?:youtube\.com\/watch\?.*v=)([^&?#]+)/          // youtube.com/watch?other=params&v=ID
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            const videoId = match[1];
            console.log('✅ Found YouTube ID:', videoId);
            return videoId;
        }
    }
    
    console.log('❌ No YouTube ID found in URL');
    return null;
}

// FIXED: Render the current question using CSS classes
function renderCurrentQuestion() {
    console.log('🔍 RENDER: Rendering question:', currentQuestionIndex);
    
    if (!currentModule.quiz || !currentModule.quiz.questions || currentModule.quiz.questions.length === 0) {
        return `
            <div class="quiz-complete">
                <h4>No Quiz Available</h4>
                <p>This module doesn't have any quiz questions yet.</p>
                <button onclick="displayLearningModules()" class="primary-button">Back to Modules</button>
            </div>
        `;
    }
    
    if (currentQuestionIndex >= currentModule.quiz.questions.length) {
        return renderQuizComplete();
    }
    
    const question = currentModule.quiz.questions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;
    const totalQuestions = currentModule.quiz.questions.length;
    
    const options = question.options || [];
    const hasOptions = options.length > 0;
    const isLastQuestion = currentQuestionIndex === currentModule.quiz.questions.length - 1;

    // Build options HTML using CSS classes
    let optionsHTML = '';
    if (hasOptions) {
        options.forEach((option, index) => {
            const optionText = String(option || '').trim();
            const optionLetter = String.fromCharCode(65 + index);
            
            optionsHTML += `
                <div class="option">
                    <input type="radio" id="option-${currentQuestionIndex}-${index}" 
                           name="answer" value="${index}"
                           ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}>
                    <label for="option-${currentQuestionIndex}-${index}">
                        <span class="option-letter">${optionLetter}</span>
                        <span class="option-text">${optionText}</span>
                    </label>
                </div>
            `;
        });
    } else {
        optionsHTML = `
            <div class="no-options-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No options available for this question. Please contact the administrator.</p>
            </div>
        `;
    }

    return `
        <div class="quiz-progress">
            <div class="progress-info">
                Question ${questionNumber} of ${totalQuestions}
                <span class="progress-percent">${Math.round((questionNumber / totalQuestions) * 100)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(questionNumber / totalQuestions) * 100}%"></div>
            </div>
        </div>
        
        <div class="question-container">
            <h4>${question.question || 'Question not available'}</h4>
            <div class="options-container">
                ${optionsHTML}
            </div>
        </div>
        
        <div class="quiz-navigation">
            <div>
                ${currentQuestionIndex > 0 ? 
                    `<button class="secondary-button" onclick="goToPrevQuestion()">
                        <i class="fas fa-arrow-left"></i> Previous
                    </button>` : 
                    '<div></div>'
                }
            </div>
            
            <div>
                ${!isLastQuestion ?
                    `<button class="primary-button" onclick="goToNextQuestion()">
                        Next Question <i class="fas fa-arrow-right"></i>
                    </button>` :
                    `<button class="success-button" onclick="submitQuiz()">
                        <i class="fas fa-paper-plane"></i> Submit Quiz
                    </button>`
                }
            </div>
        </div>
        
        ${isLastQuestion ? `
            <div class="quiz-submit-notice">
                <i class="fas fa-info-circle"></i>
                This is the last question. Click "Submit Quiz" to finish.
            </div>
        ` : ''}
    `;
}

// Render quiz complete screen
function renderQuizComplete() {
    return `
        <div class="quiz-complete">
            <h4>Ready to Submit?</h4>
            <p>You've answered all ${currentModule.quiz.questions.length} questions. Ready to see your results?</p>
            <div class="quiz-actions">
                <button class="secondary-button" onclick="currentQuestionIndex = 0; document.getElementById('quiz-container').innerHTML = renderCurrentQuestion();">
                    Review Answers
                </button>
                <button class="primary-button" onclick="submitQuiz()">
                    Submit Quiz
                </button>
            </div>
        </div>
    `;
}

// Go to the next question
function goToNextQuestion() {
    // Save the current answer
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    if (selectedOption) {
        userAnswers[currentQuestionIndex] = parseInt(selectedOption.value);
    } else {
        userAnswers[currentQuestionIndex] = null;
    }
    
    // Move to next question
    currentQuestionIndex++;
    
    // Update the quiz display
    document.getElementById('quiz-container').innerHTML = renderCurrentQuestion();
}

// FIXED: Go to the previous question
function goToPrevQuestion() {
    // Move to previous question
    currentQuestionIndex--;
    
    // Update the quiz display
    document.getElementById('quiz-container').innerHTML = renderCurrentQuestion();
    
    // FIXED: Pre-select the previous answer if exists - with null check
    if (userAnswers[currentQuestionIndex] !== undefined && 
        userAnswers[currentQuestionIndex] !== null) {
        
        const optionElement = document.getElementById(`option-${currentQuestionIndex}-${userAnswers[currentQuestionIndex]}`);
        
        // FIX: Check if the element exists before trying to set checked
        if (optionElement) {
            optionElement.checked = true;
        } else {
            console.warn('Option element not found:', `option-${currentQuestionIndex}-${userAnswers[currentQuestionIndex]}`);
        }
    }
}

// Submit the quiz - FIXED VERSION with document existence check
async function submitQuiz() {
    try {
        console.log("🚀 Starting quiz submission...");
        
        // Save the final answer
        const selectedOption = document.querySelector('input[name="answer"]:checked');
        if (selectedOption) {
            userAnswers[currentQuestionIndex] = parseInt(selectedOption.value);
        }

        // Calculate score
        let correctAnswers = 0;
        const totalQuestions = currentModule.quiz.questions.length;
        
        for (let i = 0; i < totalQuestions; i++) {
            if (userAnswers[i] === currentModule.quiz.questions[i].correctAnswer) {
                correctAnswers++;
            }
        }
        
        const score = (correctAnswers / totalQuestions) * 100;
        const passed = score >= 70; // 70% passing threshold
        
        console.log(`📊 Quiz results: ${correctAnswers}/${totalQuestions} (${Math.round(score)}%) - ${passed ? 'PASSED' : 'FAILED'}`);

        // Award XP if passed
        let xpEarned = 0;
        if (passed) {
            xpEarned = currentModule.xp || 0;
            
            // Update candidate's XP in Firestore
            const db = firebase.firestore();
            const currentUser = firebase.auth().currentUser;
            
            if (currentUser) {
                console.log(`👤 Updating XP for user: ${currentUser.uid}`);
                
                const candidateRef = db.collection('candidates').doc(currentUser.uid);
                
                try {
                    // First, check if the candidate document exists
                    const candidateDoc = await candidateRef.get();
                    
                    if (!candidateDoc.exists()) {
                        console.log("📝 Candidate document doesn't exist, creating now...");
                        
                        // Create the candidate document with initial structure
                        await candidateRef.set({
                            userId: currentUser.uid,
                            email: currentUser.email || '',
                            xp: xpEarned,
                            starLevel: 1,
                            completedModules: [currentModule.id],
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                            profileComplete: false
                        });
                        
                        console.log("✅ New candidate document created");
                    } else {
                        console.log("✅ Candidate document exists, updating...");
                        const currentData = candidateDoc.data();
                        const currentXp = currentData.xp || 0;
                        const currentStarLevel = currentData.starLevel || 1;
                        
                        // Calculate new XP
                        let newXp = currentXp + xpEarned;
                        let newStarLevel = currentStarLevel;
                        
                        // Simple level up system (every 100 XP)
                        if (newXp >= newStarLevel * 100) {
                            newStarLevel = Math.floor(newXp / 100) + 1;
                        }
                        
                        // Update existing candidate document
                        await candidateRef.update({
                            xp: newXp,
                            starLevel: newStarLevel,
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                            completedModules: firebase.firestore.FieldValue.arrayUnion(currentModule.id)
                        });
                        
                        console.log(`✅ Candidate XP updated: ${currentXp} → ${newXp}`);
                    }

                    // Store completion status in candidateModules subcollection
                    console.log("💾 Storing module completion...");
                    await db.collection('candidateModules')
                        .doc(currentUser.uid)
                        .collection('completedModules')
                        .doc(currentModule.id)
                        .set({
                            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            score: score,
                            xpEarned: xpEarned,
                            moduleTitle: currentModule.title,
                            correctAnswers: correctAnswers,
                            totalQuestions: totalQuestions
                        });
                    
                    console.log("✅ Module completion recorded");
                    
                } catch (firestoreError) {
                    console.error("❌ Firestore error:", firestoreError);
                    
                    // If update fails, try set with merge as fallback
                    if (firestoreError.code === 'not-found') {
                        console.log("🔄 Fallback: Using set with merge...");
                        await candidateRef.set({
                            xp: xpEarned,
                            starLevel: 1,
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                            completedModules: [currentModule.id]
                        }, { merge: true });
                    } else {
                        throw firestoreError; // Re-throw other errors
                    }
                }
            }
        }
        
        // Show results
        showQuizResults(score, correctAnswers, totalQuestions, xpEarned, passed);
        
    } catch (error) {
        console.error("❌ Error submitting quiz:", error);
        
        // Show user-friendly error message
        const quizContainer = document.getElementById('quiz-container');
        if (quizContainer) {
            quizContainer.innerHTML = `
                <div class="quiz-error">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Submission Error</h3>
                    <p>There was a problem submitting your quiz. Your progress has been saved locally.</p>
                    <p><small>Error: ${error.message}</small></p>
                    <div class="error-actions">
                        <button onclick="displayLearningModules()" class="primary-button">
                            Back to Modules
                        </button>
                        <button onclick="retrySubmission()" class="secondary-button">
                            Try Again
                        </button>
                    </div>
                </div>
            `;
        } else {
            alert("There was an error submitting your quiz. Please try again.");
        }
    }
}

// Show quiz results
function showQuizResults(score, correctAnswers, totalQuestions, xpEarned, passed) {
    document.getElementById('quiz-container').innerHTML = `
        <div class="quiz-results ${passed ? 'passed' : 'failed'}">
            <div class="result-icon">
                <i class="fas ${passed ? 'fa-trophy' : 'fa-redo'}"></i>
            </div>
            <h3>${passed ? 'Congratulations!' : 'Keep Practicing'}</h3>
            <div class="score-display">
                <div class="score-circle">
                    <span class="score-percent">${Math.round(score)}%</span>
                    <span class="score-text">Score</span>
                </div>
                <div class="score-details">
                    <p><strong>${correctAnswers}</strong> out of <strong>${totalQuestions}</strong> correct</p>
                    ${passed ? `
                        <div class="xp-earned">
                            <i class="fas fa-star"></i> +${xpEarned} XP Earned!
                        </div>
                        <p class="success-message">You've successfully completed this module!</p>
                    ` : `
                        <p class="retry-message">You need 70% or higher to pass. Review the material and try again!</p>
                    `}
                </div>
            </div>
            <div class="result-actions">
                ${!passed ? `<button onclick="retryQuiz()" class="secondary-button">Try Again</button>` : ''}
                <button onclick="displayLearningModules()" class="primary-button">
                    ${passed ? 'Back to Modules' : 'Continue Learning'}
                </button>
            </div>
        </div>
    `;
}

// Retry quiz
function retryQuiz() {
    currentQuestionIndex = 0;
    userAnswers = [];
    document.getElementById('quiz-container').innerHTML = renderCurrentQuestion();
}

// Retry submission function
function retrySubmission() {
    currentQuestionIndex = currentModule.quiz.questions.length; // Go to completion screen
    document.getElementById('quiz-container').innerHTML = renderCurrentQuestion();
}

// Set up event listeners for the learning section
function setupLearningEventListeners() {
    // Event listeners are now set up within each function as needed
}

// Temporary debug function to check DOM
function debugQuizDOM() {
    console.log("🔍 DOM DEBUG: Checking quiz container");
    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
        console.log("✅ Quiz container found");
        console.log("🔍 Quiz container HTML:", quizContainer.innerHTML);
        
        // Check if options are in the DOM but not visible
        const options = quizContainer.querySelectorAll('.option-text');
        console.log(`🔍 Found ${options.length} option elements`);
        
        options.forEach((opt, index) => {
            console.log(`🔍 Option ${index}:`, {
                text: opt.textContent,
                visible: opt.offsetParent !== null,
                styles: window.getComputedStyle(opt)
            });
        });
    } else {
        console.log("❌ Quiz container not found");
    }
}

// NUCLEAR OPTION: Completely replace quiz rendering
function nuclearFixQuiz() {
    const quizContainer = document.getElementById('quiz-container');
    const question = currentModule.quiz.questions[currentQuestionIndex];
    
    let optionsHTML = '';
    question.options.forEach((option, index) => {
        optionsHTML += `
            <div style="padding: 10px; border: 2px solid blue; margin: 5px; background: white;">
                <input type="radio" name="answer" value="${index}">
                <span style="color: black; font-size: 16px; font-weight: bold;">
                    ${String.fromCharCode(65 + index)}. ${option}
                </span>
            </div>
        `;
    });
    
    quizContainer.innerHTML = `
        <div style="padding: 20px; background: #f0f8ff; border-radius: 10px;">
            <h3 style="color: black;">${question.question}</h3>
            <div style="margin-top: 20px;">
                ${optionsHTML}
            </div>
            <button onclick="goToNextQuestion()" style="margin-top: 20px; padding: 10px 20px; background: blue; color: white; border: none; border-radius: 5px;">
                Next Question
            </button>
        </div>
    `;
}

// Debug function to check module data
function debugModuleData() {
    console.log("🔍 CURRENT MODULE DATA:", currentModule);
    console.log("📹 Videos:", currentModule.videos);
    console.log("❓ Quiz questions:", currentModule.quiz);
    console.log("🎯 Has videos:", currentModule.videos && currentModule.videos.length > 0);
    console.log("🎯 Has quiz:", currentModule.quiz && currentModule.quiz.questions && currentModule.quiz.questions.length > 0);
}

// Debug video container styles
function debugVideoStyles() {
    const videoCards = document.querySelectorAll('.video-card');
    console.log(`🔍 Found ${videoCards.length} video cards`);
    
    videoCards.forEach((card, index) => {
        const styles = window.getComputedStyle(card);
        console.log(`Video Card ${index}:`, {
            display: styles.display,
            width: styles.width,
            height: styles.height,
            borderRadius: styles.borderRadius,
            overflow: styles.overflow
        });
        
        const thumbnail = card.querySelector('.video-thumbnail');
        if (thumbnail) {
            const thumbStyles = window.getComputedStyle(thumbnail);
            console.log(`  Thumbnail ${index}:`, {
                width: thumbStyles.width,
                height: thumbStyles.height,
                borderRadius: thumbStyles.borderRadius
            });
        }
    });
}

window.debugVideoStyles = debugVideoStyles;
window.nuclearFixQuiz = nuclearFixQuiz;

// Make it available globally
window.debugQuizDOM = debugQuizDOM;

// Make functions globally available
window.playVideo = playVideo;
window.closeVideoPlayer = closeVideoPlayer;
window.goToNextQuestion = goToNextQuestion;
window.goToPrevQuestion = goToPrevQuestion;
window.submitQuiz = submitQuiz;
window.retryQuiz = retryQuiz;
window.showQuizResults = showQuizResults;
window.retrySubmission = retrySubmission;