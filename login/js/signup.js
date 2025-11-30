document.addEventListener('DOMContentLoaded', function() {
  const signupForm = document.getElementById('signup-form');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const roleSelect = document.getElementById('role');
  const showPasswordsCheckbox = document.getElementById('show-passwords');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  // Toggle password visibility
  showPasswordsCheckbox.addEventListener('change', function() {
    const type = this.checked ? 'text' : 'password';
    passwordInput.type = type;
    confirmPasswordInput.type = type;
  });

  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const role = roleSelect.value;

    // Reset messages
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    successMessage.textContent = '';
    successMessage.style.display = 'none';

    // Validate role selection
    if (!role) {
      errorMessage.textContent = 'Please select a role';
      errorMessage.style.display = 'block';
      return;
    }

    // Validate password
    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match';
      errorMessage.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      errorMessage.textContent = 'Password must be at least 6 characters long';
      errorMessage.style.display = 'block';
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      errorMessage.textContent = 'Password must contain both letters and numbers';
      errorMessage.style.display = 'block';
      return;
    }

    // Check if username or email already exists
    db.collection('users').where('username', '==', username).get()
      .then(usernameSnapshot => {
        if (!usernameSnapshot.empty) {
          errorMessage.textContent = 'Username already exists';
          errorMessage.style.display = 'block';
          return;
        }

        return db.collection('users').where('email', '==', email).get();
      })
      .then(emailSnapshot => {
        if (emailSnapshot && !emailSnapshot.empty) {
          errorMessage.textContent = 'Email already exists';
          errorMessage.style.display = 'block';
          return;
        }

        // Create user with email and password
        return auth.createUserWithEmailAndPassword(email, password);
      })
      .then(userCredential => {
        // Save additional user data to Firestore including role and status
        return db.collection('users').doc(userCredential.user.uid).set({
          username: username,
          email: email,
          role: role,
          status: 'active', // Default status for new users
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        successMessage.textContent = 'Account created successfully! Redirecting to dashboard...';
        successMessage.style.display = 'block';
        
        // Get the user data to store in localStorage
        const user = auth.currentUser;
        return db.collection('users').doc(user.uid).get();
      })
      .then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          localStorage.setItem('currentUser', JSON.stringify({
            uid: doc.id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            status: userData.status
          }));
          
          // Redirect based on role
          setTimeout(() => {
            redirectBasedOnRole(userData.role);
          }, 2000);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
      });
  });

  // Update in signup.js too
function redirectBasedOnRole(role) {
    console.log('🔄 Redirecting based on role:', role);
    
    switch(role) {
        case 'admin':
            window.location.href = '../admin/index.html';
            break;
        case 'candidate':
        case 'member':
            window.location.href = '../candidate/index.html';
            break;
        case 'employer':
            window.location.href = '../employer/index.html';
            break;
        default:
            window.location.href = '../candidate/index.html';
    }
}
});