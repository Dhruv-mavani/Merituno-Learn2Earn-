document.addEventListener('DOMContentLoaded', function() {
    const resetPasswordForm = document.getElementById('reset-password-form');
    const emailInput = document.getElementById('email');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');
    const showPasswordsCheckbox = document.getElementById('show-passwords');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const authFormContainer = document.querySelector('.auth-form-container');

    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const actionCode = urlParams.get('oobCode');
    const mode = urlParams.get('mode');

    // If we have an action code from Firebase, verify it and extract email
    if (actionCode && mode === 'resetPassword') {
        auth.verifyPasswordResetCode(actionCode)
            .then(resetEmail => {
                emailInput.value = resetEmail;
                window.actionCode = actionCode;
                console.log('Reset code verified for email:', resetEmail);
            })
            .catch(error => {
                console.error('Invalid reset code:', error);
                errorMessage.textContent = 'Invalid or expired password reset link. Please request a new reset link.';
                errorMessage.classList.add('active');
                // Hide the form container instead of the form itself
                if (authFormContainer) {
                    authFormContainer.style.display = 'none';
                }
            });
    } else {
        // If no action code, check for email parameter
        const email = urlParams.get('email');
        if (email) {
            emailInput.value = email;
        } else {
            errorMessage.textContent = 'Invalid password reset link. Please use the link from your email.';
            errorMessage.classList.add('active');
            // Hide the form container instead of the form itself
            if (authFormContainer) {
                authFormContainer.style.display = 'none';
            }
        }
    }

    // Toggle password visibility
    showPasswordsCheckbox.addEventListener('change', function() {
        const type = this.checked ? 'text' : 'password';
        newPasswordInput.type = type;
        confirmNewPasswordInput.type = type;
    });

    resetPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        // Reset messages
        errorMessage.textContent = '';
        successMessage.textContent = '';
        errorMessage.classList.remove('active');
        successMessage.classList.remove('active');

        // Validate password
        if (newPassword !== confirmNewPassword) {
            errorMessage.textContent = 'Passwords do not match';
            errorMessage.classList.add('active');
            return;
        }

        if (newPassword.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters long';
            errorMessage.classList.add('active');
            return;
        }

        if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            errorMessage.textContent = 'Password must contain both letters and numbers';
            errorMessage.classList.add('active');
            return;
        }

        // If there's an actionCode (from Firebase email link)
        if (window.actionCode) {
            auth.confirmPasswordReset(window.actionCode, newPassword)
                .then(() => {
                    successMessage.textContent = 'Password changed successfully! Redirecting to login page...';
                    successMessage.classList.add('active');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                })
                .catch(error => {
                    console.error('Error:', error);
                    errorMessage.textContent = 'Password change failed: ' + error.message;
                    errorMessage.classList.add('active');
                    
                    if (error.code === 'auth/expired-action-code') {
                        errorMessage.textContent = 'Reset link has expired. Please request a new password reset.';
                    } else if (error.code === 'auth/invalid-action-code') {
                        errorMessage.textContent = 'Invalid reset link. Please request a new password reset.';
                    }
                });
        } else {
            // If no actionCode, require user to be logged in
            const user = auth.currentUser;
            
            if (!user) {
                errorMessage.textContent = 'You must be logged in to change your password. Please sign in first.';
                errorMessage.classList.add('active');
                return;
            }

            user.updatePassword(newPassword)
                .then(() => {
                    successMessage.textContent = 'Password changed successfully! Redirecting to login page...';
                    successMessage.classList.add('active');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                })
                .catch(error => {
                    console.error('Error:', error);
                    errorMessage.textContent = 'Password change failed: ' + error.message;
                    errorMessage.classList.add('active');
                });
        }
    });
});