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
   4. Form Submission & Payments
   ========================================= */
function initForms() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycby5bIpxcQBx_ULAYzukby97SDGocKZBKEuuginGKVGSnMkMbjd9dupEd1ybRyjwc1-r/exec'; // User must replace this
    const paystackPublicKey = 'pk_test_ce2a7dd2920d05c8d41852656ffa92304b8d46a9';

    // Pricing Map (in GHS)
    const prices = {
        'Foundations Program': 800,
        'Career Accelerator Program': 2500,
        'Tech Leadership': 6000
    };

    const handleSubmission = (form, formData, statusDiv, submitBtn, originalBtnText) => {
        fetch(scriptURL, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                statusDiv.innerText = 'Success! Check your email.';
                statusDiv.style.color = '#4ade80';
                form.reset();
                if (form.id === 'registrationForm') {
                    setTimeout(() => window.closeModal(), 3000);
                }
            })
            .catch(error => {
                console.error('Error!', error.message);
                statusDiv.innerText = 'Error! Please try again.';
                statusDiv.style.color = '#f87171';
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            });
    };

    const settings = {
        'contactForm': { statusId: 'formStatus', type: 'contact' },
        'registrationForm': { statusId: 'regStatus', type: 'payment' }
    };

    for (const [formId, config] of Object.entries(settings)) {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();

                if (scriptURL.includes('YOUR_GOOGLE_APPS_SCRIPT')) {
                    alert('Please deploy backend.gs and update the URL in main.js');
                    return;
                }

                const statusDiv = document.getElementById(config.statusId);
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerText;
                const formData = new FormData(form);

                statusDiv.innerText = 'Processing...';
                submitBtn.disabled = true;

                // Payment Flow
                if (config.type === 'payment') {
                    const email = formData.get('email');
                    const packageName = formData.get('package');
                    const amount = prices[packageName];

                    if (!amount) {
                        statusDiv.innerText = 'Error: Invalid Package Selected';
                        submitBtn.disabled = false;
                        return;
                    }

                    const handler = PaystackPop.setup({
                        key: paystackPublicKey,
                        email: email,
                        amount: amount * 100, // in kobo
                        currency: 'GHS',
                        ref: '' + Math.floor((Math.random() * 1000000000) + 1),
                        callback: function (response) {
                            // Payment Success
                            statusDiv.innerText = 'Payment Verified. Registering...';
                            formData.append('reference', response.reference);
                            handleSubmission(form, formData, statusDiv, submitBtn, originalBtnText);
                        },
                        onClose: function () {
                            statusDiv.innerText = 'Payment cancelled.';
                            submitBtn.disabled = false;
                            submitBtn.innerText = originalBtnText;
                        }
                    });

                    handler.openIframe();

                } else {
                    // Normal Contact Form
                    handleSubmission(form, formData, statusDiv, submitBtn, originalBtnText);
                }
            });
        }
    }
}
