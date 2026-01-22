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
    const scriptURL = 'https://script.google.com/macros/s/AKfycbz1J_jhKVf5c3HIYxwaANMEO95pwmjuBy5GXaCpMG-FcS4TDriJfYaQp8_NewDhFiA/exec'; // User must replace this
    const paystackPublicKey = 'pk_live_961d8aeef06ccf444219f7a67d9153f740959733';

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
    const speedNormal = 1.2; // pixels per frame
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

/* =========================================
   6. Testimonial Carousel Logic
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    initTestimonialCarousel();
});

function initTestimonialCarousel() {
    const track = document.getElementById('testimonialTrack');
    const cards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.getElementById('t-prev');
    const nextBtn = document.getElementById('t-next');
    const dotsContainer = document.getElementById('t-dots');

    if (!track || cards.length === 0) return;

    let currentIndex = 0;
    const totalSlides = cards.length;

    // Create Dots
    if (dotsContainer) {
        dotsContainer.innerHTML = ''; // Clear existing
        cards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('t-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                goToSlide(index);
                resetTimer();
            });
            dotsContainer.appendChild(dot);
        });
    }

    const dots = document.querySelectorAll('.t-dot');

    const updateClasses = () => {
        // Update Cards
        cards.forEach((card, index) => {
            card.classList.remove('active');
            if (index === currentIndex) card.classList.add('active');
        });

        // Update Dots
        dots.forEach((dot, index) => {
            dot.classList.remove('active');
            if (index === currentIndex) dot.classList.add('active');
        });
    };

    const goToSlide = (index) => {
        if (index < 0) {
            currentIndex = totalSlides - 1;
        } else if (index >= totalSlides) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }

        const translateX = -(currentIndex * 100);
        track.style.transform = `translateX(${translateX}%)`;
        updateClasses();
    };

    // Auto Play (5 seconds)
    let interval = setInterval(() => goToSlide(currentIndex + 1), 5000);

    const resetTimer = () => {
        clearInterval(interval);
        interval = setInterval(() => goToSlide(currentIndex + 1), 5000);
    };

    // Event Listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
            resetTimer();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
            resetTimer();
        });
    }

    // Pause on hover
    track.addEventListener('mouseenter', () => clearInterval(interval));
    track.addEventListener('mouseleave', resetTimer);
}

/* =========================================
   7. Cursor Spotlight Effect
   ========================================= */
function initCursorEffect() {
    // Check if device supports hover (desktop) - REMOVED to force render for testing
    // if (window.matchMedia('(hover: none)').matches) return;

    const glow = document.createElement('div');
    glow.classList.add('cursor-glow');
    document.body.appendChild(glow);

    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;

    // Track mouse
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth follow loop
    const animateGlow = () => {
        // Linear interpolation for smooth lag
        const speed = 0.15; // 0 to 1 (1 = instant)

        glowX += (mouseX - glowX) * speed;
        glowY += (mouseY - glowY) * speed;

        glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;

        requestAnimationFrame(animateGlow);
    };

    animateGlow();
}

/* =========================================
   8. Typewriter Effect
   ========================================= */
function initTypewriter() {
    const element = document.getElementById('hero-typewriter');
    if (!element) return;

    const textToType = "Building Scalable Systems. Coaching Elite Tech Talent."; // Loop this text or split for effect?
    // User asked for "texted out... in a loop".
    // Let's implement a delete-and-rewrite loop for a smooth effect.

    // Actually, distinct phrases might look better if user implies two sentences.
    // Let's treat it as one full statement for now based on request "make THIS text... be texted out".

    const phrases = [
        "Building Scalable Systems.",
        "Coaching Elite Tech Talent."
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            element.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50; // Faster deleting
        } else {
            element.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100; // Normal typing
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            // Finished typing phrase
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length; // Next phrase
            typeSpeed = 500; // Pause before typing next
        }

        setTimeout(type, typeSpeed);
    }

    type();
}

// Init Cursor & Typewriter
document.addEventListener('DOMContentLoaded', () => {
    initCursorEffect();
    initTypewriter();
});
