// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');

// Only set up mobile menu if elements exist
if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        // Update aria-expanded for accessibility
        const isExpanded = navMenu.classList.contains('active');
        mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
        // Change menu icon
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
            // Custom toggle: use classList.replace for clarity and uniqueness
            if (isExpanded) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target) && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });

    // Close menu when window is resized beyond mobile breakpoint
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
}

// Animation on scroll for subtle entrance animations
document.addEventListener('DOMContentLoaded', () => {
    // Skip animations altogether if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        const animateElements = document.querySelectorAll('.animate-on-scroll');
        
        // Intersection Observer configuration
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add visible class to trigger animation
                    entry.target.classList.add('visible');
                    // Stop observing once the animation is triggered
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.1, // Trigger when 10% of element is visible
            rootMargin: '0px 0px -50px 0px' // Slightly earlier trigger
        });
        
        // Start observing each element
        animateElements.forEach(element => {
            observer.observe(element);
        });
    } else {
        // If user prefers reduced motion, make all elements visible immediately
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            el.classList.add('visible');
        });
    }
});

// Modified Smooth Scrolling for Internal Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            // First, cancel any ongoing scroll momentum by stopping at current position
            window.scrollTo({
                top: window.pageYOffset,
                behavior: 'auto'
            });
            
            // Then, after a very brief delay, scroll to the target
            setTimeout(() => {
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }, 10);
            
            // Close mobile menu if open
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
});

// Commented out: Donation and external alert handlers no longer needed
// as these sections have been removed from the HTML
//
// // Donation button alerts
// document.querySelectorAll('.donate-alert').forEach(button => {
//     button.addEventListener('click', function(e) {
//         e.preventDefault();
//         alert('Donation functionality coming soon. Thank you for your interest in supporting our community!');
//     });
// });
//
// // External button alerts
// document.querySelectorAll('.external-alert').forEach(button => {
//     button.addEventListener('click', function(e) {
//         e.preventDefault();
//         alert('Coming soon!');
//     });
// });