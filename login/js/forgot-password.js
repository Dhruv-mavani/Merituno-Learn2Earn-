document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const emailInput = document.getElementById('email');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');

    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const originalButtonText = submitButton.textContent;

        // Reset messages and UI state
        errorMessage.textContent = '';
        successMessage.textContent = '';
        errorMessage.classList.remove('active');
        successMessage.classList.remove('active');
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        // Basic email validation
        if (!email || !email.includes('@')) {
            showError('Please enter a valid email address');
            resetButton();
            return;
        }

        console.log('Attempting password reset for:', email);

        // Check if email exists in database and if user has a password (not Google auth)
        db.collection('users').where('email', '==', email).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    showError('Email doesn\'t exist in our system');
                    return Promise.reject(new Error('Email not found'));
                }

                // Check if user signed up with Google (no password)
                const userData = snapshot.docs[0].data();
                console.log('User data:', userData);
                
                if (userData.authProvider && userData.authProvider === 'google') {
                    showError('This account uses Google authentication. Please sign in with Google.');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 3000);
                    return Promise.reject(new Error('Google authentication user'));
                }

                // Send password reset email using Firebase Authentication with custom redirect
                console.log('Sending password reset email via Firebase...');
                return auth.sendPasswordResetEmail(email, {
                    url: 'http://localhost:3000/login/reset-password.html',
                    handleCodeInApp: true
                });
            })
            .then(() => {
                console.log('Password reset email sent successfully');
                showSuccess('Password reset email sent! Please check your inbox (and spam folder).');
                
                // Clear form
                emailInput.value = '';
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = 'index.html?message=Password reset email sent';
                }, 5000);
            })
            .catch(error => {
                console.error('Error in password reset process:', error);
                
                // Don't show error message for expected errors
                if (error.message !== 'Email not found' && error.message !== 'Google authentication user') {
                    showError('Error sending reset email: ' + error.message);
                    
                    // Specific handling for common Firebase errors
                    if (error.code === 'auth/user-not-found') {
                        showError('No account found with this email address');
                    } else if (error.code === 'auth/invalid-email') {
                        showError('Invalid email address format');
                    } else if (error.code === 'auth/too-many-requests') {
                        showError('Too many attempts. Please try again later.');
                    }
                }
            })
            .finally(() => {
                resetButton();
            });

        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.classList.add('active');
        }

        function showSuccess(message) {
            successMessage.textContent = message;
            successMessage.classList.add('active');
        }

        function resetButton() {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
});