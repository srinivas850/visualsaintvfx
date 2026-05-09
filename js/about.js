/* ==========================================================================
   About Section Logic
   Handles scroll reveal animations using Intersection Observer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;

    // Elements to animate
    const subtitle = aboutSection.querySelector('.about-subtitle');
    const title = aboutSection.querySelector('.about-title');
    const description = aboutSection.querySelector('.about-description');
    const servicesGrid = aboutSection.querySelector('.about-services');

    // Create Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2 // Trigger when 20% of section is visible
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // If GSAP is available, use cinematic stagger
                if (window.gsap) {
                    const tl = gsap.timeline();
                    
                    if (subtitle) {
                        tl.to(subtitle, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
                    }
                    if (title) {
                        tl.to(title, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.3");
                    }
                    if (description) {
                        tl.to(description, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.5");
                    }
                    if (servicesGrid) {
                        tl.to(servicesGrid, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
                        
                        // Stagger the cards slightly
                        const cards = servicesGrid.querySelectorAll('.about-service-card');
                        if(cards.length) {
                            gsap.fromTo(cards, 
                                { opacity: 0, y: 30 },
                                { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power2.out", delay: 0.5 }
                            );
                        }
                    }
                } else {
                    // Fallback CSS transitions
                    const elements = [subtitle, title, description, servicesGrid];
                    elements.forEach((el, index) => {
                        if (el) {
                            el.style.transition = `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.2}s`;
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                        }
                    });
                }
                
                // Stop observing once animated
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    observer.observe(aboutSection);
});
