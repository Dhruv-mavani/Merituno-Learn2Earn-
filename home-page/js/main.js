"use strict";

// Smooth scrolling for navigation
document.querySelectorAll('.navlink').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        if(this.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Animate stats counter
function animateStats() {
    const statElements = document.querySelectorAll('.stat-item h3');
    const targetValues = [1000, 50, 200, 5000];
    
    statElements.forEach((el, index) => {
        let current = 0;
        const increment = targetValues[index] / 50;
        const timer = setInterval(() => {
            current += increment;
            el.textContent = Math.floor(current) + (index === 3 ? '+' : '+');
            if(current >= targetValues[index]) {
                el.textContent = targetValues[index] + (index === 3 ? '+' : '+');
                clearInterval(timer);
            }
        }, 20);
    });
}

// Trigger animations when visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            if(entry.target.classList.contains('stats')) {
                animateStats();
            }
            entry.target.classList.add('animated');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Policy Modal functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Merituno platform loaded');
    
    // Policy modal functionality
    const policyModal = document.getElementById('policyModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    const closeModal = document.querySelector('.close-modal');
    const policyLinks = document.querySelectorAll('.policy-link');
    
    // Close modal when clicking on X
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            policyModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === policyModal) {
            policyModal.style.display = 'none';
        }
    });
    
    // Policy link click handlers
    if (policyLinks.length > 0) {
        policyLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const policyType = this.getAttribute('data-policy');
                
                if (policyType === 'privacy') {
                    modalTitle.textContent = 'Privacy Policy';
                    modalText.innerHTML = `
                        <p>Your privacy is important to us. This Privacy Policy explains how Merituno collects, uses, and protects your personal information.</p>
                        <h3>Information We Collect</h3>
                        <p>We collect information you provide directly to us, such as when you create an account, complete your profile, or use our services.</p>
                        <h3>How We Use Your Information</h3>
                        <p>We use your information to provide, maintain, and improve our services, to develop new ones, and to protect Merituno and our users.</p>
                    `;
                } else if (policyType === 'terms') {
                    modalTitle.textContent = 'Terms of Service';
                    modalText.innerHTML = `
                        <p>Welcome to Merituno! These Terms of Service govern your use of our platform and services.</p>
                        <h3>Account Terms</h3>
                        <p>You are responsible for maintaining the security of your account and for all activities that occur under your account.</p>
                        <h3>User Content</h3>
                        <p>You retain ownership of any intellectual property rights that you hold in the content you submit or post on Merituno.</p>
                        <h3>Termination</h3>
                        <p>We may suspend or terminate your access to our services if you violate these Terms or any applicable laws.</p>
                    `;
                }
                
                policyModal.style.display = 'block';
            });
        });
    }

    // Mobile menu toggle
    const toggle = document.getElementById('toogle');
    const navlinks = document.querySelector('.navlinks');
    
    if (toggle && navlinks) {
        toggle.addEventListener('change', function() {
            if (this.checked) {
                navlinks.style.display = 'flex';
            } else {
                navlinks.style.display = 'none';
            }
        });
    }

    // Newsletter form submission
    const newsletterForm = document.querySelector('.news-mail');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-input').value;
            if (email) {
                alert('Thank you for subscribing to our newsletter!');
                document.getElementById('email-input').value = '';
            }
        });
    }
});

// Add hover effects for cards
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.wc, .pt, .testimonial');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});