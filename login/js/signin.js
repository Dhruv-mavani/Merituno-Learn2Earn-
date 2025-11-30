// FIXED signin.js


function redirectBasedOnRole(role) {
    console.log('🔄 Redirecting based on role:', role);
    
    switch(role) {
        case 'admin':
            window.location.href = '../users/admin-dashboard.html';
            break;
        case 'employer':
            window.location.href = '../users/employer-dashboard.html';
            break;
        case 'member':
        case 'user':
        default:
            window.location.href = '../users/member-dashboard.html';
            break;
    }
    
    console.log('📍 Redirecting to:', window.location.href);
}

// IMPROVED SUSPENSION CHECK - handles undefined status
function checkUserSuspension(userId, email) {
    console.log('🔐 Checking suspension status for:', email);
    
    return Promise.all([
        db.collection('candidates').where('email', '==', email).get(),
        db.collection('employers').where('email', '==', email).get(),
        db.collection('users').where('email', '==', email).get()
    ]).then(([candidatesSnapshot, employersSnapshot, usersSnapshot]) => {
        
        let userData = null;
        let userType = null;
        let docId = null;
        
        // Check candidates first
        if (!candidatesSnapshot.empty) {
            userData = candidatesSnapshot.docs[0].data();
            userType = 'candidate';
            docId = candidatesSnapshot.docs[0].id;
        }
        // Check employers second
        else if (!employersSnapshot.empty) {
            userData = employersSnapshot.docs[0].data();
            userType = 'employer';
            docId = employersSnapshot.docs[0].id;
        }
        // Check old users collection last
        else if (!usersSnapshot.empty) {
            userData = usersSnapshot.docs[0].data();
            userType = userData.role || 'member';
            docId = usersSnapshot.docs[0].id;
        }
        
        if (userData) {
            console.log('📋 User found:', {
                type: userType,
                status: userData.status,
                isSuspended: userData.isSuspended,
                email: userData.email
            });
            
            // IMPROVED SUSPENSION CHECK - handles undefined values
            const isSuspended = userData.status === 'Suspended' || 
                              userData.status === 'suspended' || 
                              userData.isSuspended === true;
            
            if (isSuspended) {
                console.log('🚫 User is suspended, blocking login');
                throw new Error('This account has been suspended. Please contact support.');
            }
            
            // If status is undefined, set a default active status
            if (!userData.status) {
                userData.status = 'active';
                console.log('⚠️ Status was undefined, set to active');
            }
            
            return { userData, userType, docId };
        }
        
        // If no user document found, allow login (new user)
        return null;
    });
}

function completeSocialRegistration(role) {
    const user = auth.currentUser;
    const errorMessage = document.getElementById('error-message');
    const username = user.displayName || (user.email ? user.email.split('@')[0] : user.uid);
    
    const collectionName = role === 'employer' ? 'employers' : 
                          role === 'candidate' ? 'candidates' : 'users';
    
    const userData = {
        displayName: user.displayName || '',
        email: user.email || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isSocialLogin: true,
        status: 'active' // Explicitly set status
    };
    
    if (role === 'employer') {
        userData.companyName = user.displayName || '';
    } else if (role === 'candidate') {
        userData.name = user.displayName || '';
    } else {
        userData.role = role;
        userData.username = username;
    }
    
    db.collection(collectionName).doc(user.uid).set(userData)
    .then(() => {
        localStorage.setItem('currentUser', JSON.stringify({
            uid: user.uid,
            username: username,
            email: user.email,
            role: role,
            status: 'active',
            isSocialLogin: true
        }));
        
        redirectBasedOnRole(role);
    })
    .catch(error => {
        console.error('Error saving user data:', error);
        errorMessage.textContent = 'Error completing registration. Please try again.';
        errorMessage.style.display = 'block';
    });
}

function showRoleSelectionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Select Your Role</h2>
            <p>Please choose how you'd like to use our platform:</p>
            <div class="role-options">
                <button class="role-btn" data-role="candidate">
                    <h3>Candidate</h3>
                    <p>Learn skills and earn money</p>
                </button>
                <button class="role-btn" data-role="employer">
                    <h3>Employer</h3>
                    <p>Hire talented professionals</p>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const style = document.createElement('style');
    style.setAttribute('data-modal-styles', 'true');
    style.textContent = `
        .modal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center;
            align-items: center; z-index: 1000;
        }
        .modal-content {
            background: white; padding: 30px; border-radius: 10px; width: 90%; max-width: 400px; text-align: center;
        }
        .role-options {
            display: flex; flex-direction: column; gap: 15px; margin-top: 20px;
        }
        .role-btn {
            padding: 15px; border: 2px solid #ddd; border-radius: 8px; background: white; cursor: pointer; transition: all 0.3s;
        }
        .role-btn:hover {
            border-color: #4285f4; background-color: #f8f9fa;
        }
        .role-btn h3 { margin: 0 0 5px 0; color: #333; }
        .role-btn p { margin: 0; color: #666; font-size: 14px; }
    `;
    document.head.appendChild(style);

    modal.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const role = this.getAttribute('data-role');
            completeSocialRegistration(role);
            document.body.removeChild(modal);
            const modalStyle = document.querySelector('style[data-modal-styles="true"]');
            if (modalStyle) {
                document.head.removeChild(modalStyle);
            }
        });
    });
}

// --- Helper function to handle post-login Firestore checks ---
function processPostSocialLogin(user) {
    const errorMessage = document.getElementById('error-message');
    
    checkUserSuspension(user.uid, user.email)
        .then(result => {
            if (result === null) {
                showRoleSelectionModal();
                return;
            }
            
            const { userData, userType, docId } = result;
            
            const collectionName = userType === 'employer' ? 'employers' : 
                                 userType === 'candidate' ? 'candidates' : 'users';
            
            return db.collection(collectionName).doc(docId).set({
                uid: user.uid,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                status: userData.status || 'active' // Ensure status is set
            }, { merge: true }).then(() => {
                return { userData, userType };
            });
        })
        .then(result => {
            if (result) {
                const { userData, userType } = result;
                
                localStorage.setItem('currentUser', JSON.stringify({
                    uid: user.uid,
                    username: userData.username || userData.displayName || userData.name || userData.companyName,
                    email: userData.email,
                    role: userData.role || userType,
                    status: userData.status || 'active', // Default to active if undefined
                    isSocialLogin: true
                }));
                
                redirectBasedOnRole(userData.role || userType);
            }
        })
        .catch(error => {
            console.error('Error processing post-login:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            auth.signOut();
        });
}

// -----------------------------------------------------------------------------------
// --- FIREBASE REDIRECT HANDLER ---
// -----------------------------------------------------------------------------------
auth.getRedirectResult()
  .then((result) => {
    if (result.credential) {
      const user = result.user;
      console.log("Social login result processed. User:", user.email);
      processPostSocialLogin(user); 
    }
  })
  .catch((error) => {
    console.error("Error processing social login result:", error);
    const errorMessage = document.getElementById('error-message');
    if(errorMessage) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
  });

// --- DOM Content Loaded Listener ---
document.addEventListener('DOMContentLoaded', function() {
    const signinForm = document.getElementById('signin-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const showPasswordCheckbox = document.getElementById('show-password');
    const errorMessage = document.getElementById('error-message');
    const googleLoginBtn = document.getElementById('google-login');

    showPasswordCheckbox.addEventListener('change', function() {
        passwordInput.type = this.checked ? 'text' : 'password';
    });

    // --- EMAIL/PASSWORD SIGN IN ---
    signinForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        errorMessage.textContent = '';
        errorMessage.style.display = 'none';

        checkUserSuspension(null, email)
            .then(result => {
                if (result === null) {
                    errorMessage.textContent = 'User not found';
                    errorMessage.style.display = 'block';
                    throw new Error('User not found');
                }
                
                return auth.signInWithEmailAndPassword(email, password);
            })
            .then(userCredential => {
                if (!userCredential) return;
                return checkUserSuspension(userCredential.user.uid, email);
            })
            .then(result => {
                if (result) {
                    const { userData, userType } = result;
                    
                    localStorage.setItem('currentUser', JSON.stringify({
                        uid: auth.currentUser.uid,
                        username: userData.username || userData.displayName || userData.name || userData.companyName,
                        email: userData.email,
                        role: userData.role || userType,
                        status: userData.status || 'active'
                    }));
                    
                    redirectBasedOnRole(userData.role || userType);
                }
            })
            .catch(error => {
                console.error('Login Error:', error);
                if (error.message.includes('suspended')) {
                    errorMessage.textContent = error.message;
                } else if (error.message.includes('not found')) {
                    errorMessage.textContent = 'User not found';
                } else {
                    errorMessage.textContent = 'Invalid email or password';
                }
                errorMessage.style.display = 'block';
                auth.signOut();
            });
    });

    // SIMPLIFIED GOOGLE LOGIN - Replace your current Google login code

// --- GOOGLE SIGN IN BUTTON CLICK ---
googleLoginBtn.addEventListener('click', function() {
    console.log('🔵 Google login button clicked');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Add scopes if needed
    provider.addScope('email');
    provider.addScope('profile');
    
    // Set custom parameters
    provider.setCustomParameters({
        'prompt': 'select_account'
    });
    
    // Use signInWithPopup with better error handling
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('✅ Google login successful:', result.user.email);
            const user = result.user;
            
            // Process the login immediately
            processPostSocialLogin(user);
        })
        .catch((error) => {
            console.error('❌ Google login error:', error);
            
            // Handle specific errors
            if (error.code === 'auth/popup-blocked') {
                errorMessage.textContent = 'Popup was blocked by browser. Please allow popups for this site.';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage.textContent = 'Login was cancelled.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage.textContent = 'Network error. Please check your connection.';
            } else {
                errorMessage.textContent = 'Google login failed: ' + error.message;
            }
            
            errorMessage.style.display = 'block';
        });
});
});