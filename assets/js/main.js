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
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzBArKztbv8L3NoyByYlKpt5k3wPQfVmTDP6R5u9sxnwT0REqpgsJuZGSj3qWnbKcGg/exec'; // User must replace this
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
                if (form.id === 'registrationForm') {
                    // Transform modal to success state
                    const modalContent = form.closest('.modal-content');
                    modalContent.innerHTML = `
                        <div style="text-align: center; padding: 2rem 1rem;">
                            <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                            <h3 class="text-accent">Registration Complete!</h3>
                            <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                                Your payment was successful and your spot has been reserved.
                                <br>check your email for the confirmation details.
                            </p>
                            <button class="btn btn-outline" onclick="window.closeModal()">Close</button>
                        </div>
                    `;
                } else {
                    // Contact form success
                    statusDiv.innerText = 'Success! Check your email.';
                    statusDiv.style.color = '#4ade80';
                    form.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
            })
            .catch(error => {
                console.error('Error!', error.message);
                statusDiv.innerText = 'Error! Please try again.';
                statusDiv.style.color = '#f87171';
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

/* =========================================
5. In-Person Carousel Logic
========================================= */
function initInPersonCarousel() {
    const track = document.getElementById('inPersonTrack');
    const wrapper = document.getElementById('inPersonWrapper');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    if (!track || !wrapper) return;

    // Clone items for seamless infinite loop (double content)
    const items = Array.from(track.children);
    items.forEach(item => {
        const clone = item.cloneNode(true);
        track.appendChild(clone);
    });

    // Loop Variables
    let scrollAmount = 0;
    const speedNormal = 0.8; // pixels per frame
    let currentSpeed = speedNormal;
    let isPaused = false;
    let animationId;

    // Manual Drag Variables
    let isDown = false;
    let startX;
    let scrollLeft;

    const animate = () => {
        if (!isPaused && !isDown) {
            scrollAmount += currentSpeed;
            const maxScroll = track.scrollWidth / 2; // Split point since we cloned simple 1x

            if (scrollAmount >= maxScroll) {
                scrollAmount = 0; // Reset seamlessly
            }

            wrapper.scrollLeft = scrollAmount;
        }
        animationId = requestAnimationFrame(animate);
    };

    // Start Animation
    animationId = requestAnimationFrame(animate);

    // --- Controls ---

    // Hover to Pause
    wrapper.addEventListener('mouseenter', () => isPaused = true);
    wrapper.addEventListener('mouseleave', () => {
        if (pauseBtn.innerText === '⏸') isPaused = false;
        isDown = false;
    });

    // Drag to Scroll (Manual)
    wrapper.addEventListener('mousedown', (e) => {
        isDown = true;
        isPaused = true;
        startX = e.pageX - wrapper.offsetLeft;
        scrollLeft = wrapper.scrollLeft;
        track.style.cursor = 'grabbing';
    });

    wrapper.addEventListener('mouseup', () => {
        isDown = false;
        if (pauseBtn.innerText === '⏸') isPaused = false;
        track.style.cursor = 'grab';
        scrollAmount = wrapper.scrollLeft;
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const walk = (x - startX) * 2; // scroll-fast
        wrapper.scrollLeft = scrollLeft - walk;
        scrollAmount = wrapper.scrollLeft;
    });

    // Touch Support
    wrapper.addEventListener('touchstart', (e) => {
        isDown = true;
        isPaused = true;
        startX = e.touches[0].pageX - wrapper.offsetLeft;
        scrollLeft = wrapper.scrollLeft;
    });

    wrapper.addEventListener('touchend', () => {
        isDown = false;
        if (pauseBtn.innerText === '⏸') isPaused = false;
        scrollAmount = wrapper.scrollLeft;
    });

    wrapper.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        // e.preventDefault(); // allow vertical scroll
        const x = e.touches[0].pageX - wrapper.offsetLeft;
        const walk = (x - startX) * 2;
        wrapper.scrollLeft = scrollLeft - walk;
        scrollAmount = wrapper.scrollLeft;
    });

    // Buttons
    if (prevBtn) prevBtn.addEventListener('click', () => {
        wrapper.scrollBy({ left: -300, behavior: 'smooth' });
        setTimeout(() => scrollAmount = wrapper.scrollLeft, 500);
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        wrapper.scrollBy({ left: 300, behavior: 'smooth' });
        setTimeout(() => scrollAmount = wrapper.scrollLeft, 500);
    });

    if (pauseBtn) pauseBtn.addEventListener('click', () => {
        if (pauseBtn.innerText === '⏸') {
            isPaused = true;
            pauseBtn.innerText = '▶';
        } else {
            isPaused = false;
            pauseBtn.innerText = '⏸';
        }
    });
}

initInPersonCarousel();
