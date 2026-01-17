/**
 * Main JavaScript for Stephen Gyan Bimpong's Portfolio
 * Handles: Navigation, Modals, Forms, and Scroll Animations
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAnimations();
    initModal();
    initForms();
});

/* =========================================
   1. Mobile Navigation
   ========================================= */
function initNavigation() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav ul');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const isVisible = nav.style.display === 'flex';
            if (isVisible) {
                nav.style.display = ''; // Reset to CSS default (hidden on mobile)
                toggle.classList.remove('active');
            } else {
                nav.style.display = 'flex';
                nav.style.flexDirection = 'column';
                nav.style.position = 'absolute';
                nav.style.top = '100%';
                nav.style.left = '0';
                nav.style.right = '0';
                nav.style.background = 'var(--bg-surface)';
                nav.style.padding = '2rem';
                nav.style.borderBottom = '1px solid var(--border-subtle)';
                toggle.classList.add('active');
            }
        });
    }
}

/* =========================================
   2. Scroll Animations (IntersectionObserver)
   ========================================= */
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll('section > .container > *');
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // CSS class injection for animation
    const style = document.createElement('style');
    style.innerHTML = `
        .fade-in-up {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

/* =========================================
   3. Modal Logic
   ========================================= */
function initModal() {
    // Expose these to global scope for HTML onclick attributes
    window.openModal = (packageName) => {
        const modal = document.getElementById('registrationModal');
        const hiddenInput = document.getElementById('reg-package');

        if (modal) {
            modal.classList.add('open');
            if (hiddenInput) hiddenInput.value = packageName;
        }
    };

    window.closeModal = () => {
        const modal = document.getElementById('registrationModal');
        if (modal) modal.classList.remove('open');
    };

    // Close on background click
    const modal = document.getElementById('registrationModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeModal();
        });
    }
}

/* =========================================
   4. Form Submission (Google Apps Script)
   ========================================= */
function initForms() {
    const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'; // User must replace this

    const settings = {
        'contactForm': {
            statusId: 'formStatus',
            successMsg: 'Message sent successfully. I will be in touch shortly.',
            errorMsg: 'There was an error sending your message. Please try again.',
            redirect: false
        },
        'registrationForm': {
            statusId: 'regStatus',
            successMsg: 'Application submitted! Check your email for confirmation.',
            errorMsg: 'Submission failed. Please try again or contact me directly.',
            redirect: false // Could redirect to a thank you page
        }
    };

    for (const [formId, config] of Object.entries(settings)) {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();

                if (scriptURL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
                    alert('Backend not connected yet. Please deploy the Google Apps Script and update main.js with the URL.');
                    return;
                }

                const statusDiv = document.getElementById(config.statusId);
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerText;

                statusDiv.innerText = 'Sending...';
                statusDiv.style.color = 'var(--text-secondary)';
                submitBtn.disabled = true;
                submitBtn.innerText = 'Processing...';

                const formData = new FormData(form);

                // GAS requires data as query parameters or JSON body handled carefully with CORS
                // Standard fetch to GAS Web App
                fetch(scriptURL, {
                    method: 'POST',
                    body: formData
                })
                    .then(response => {
                        statusDiv.innerText = config.successMsg;
                        statusDiv.style.color = '#4ade80'; // Success green
                        form.reset();
                        if (formId === 'registrationForm') {
                            setTimeout(() => window.closeModal(), 3000);
                        }
                    })
                    .catch(error => {
                        console.error('Error!', error.message);
                        statusDiv.innerText = config.errorMsg;
                        statusDiv.style.color = '#f87171'; // Error red
                    })
                    .finally(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerText = originalBtnText;
                    });
            });
        }
    }
}
