/* ==========================================================================
   Mobile Navbar Logic
   Handles overlay, toggle state, and GSAP animations
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // We expect the HTML structure to be injected via index.html
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const overlay = document.getElementById('mobile-menu-overlay');
    
    // If elements don't exist, exit gracefully
    if (!toggleBtn || !overlay) return;

    const navItems = overlay.querySelectorAll('.mobile-nav-links li');
    let isMenuOpen = false;

    // Toggle Menu Function
    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            // Open Menu
            toggleBtn.classList.add('is-open');
            overlay.classList.add('is-active');
            document.body.style.overflow = 'hidden'; // Lock scroll
            
            // GSAP Stagger Animation for Links
            if (window.gsap) {
                gsap.fromTo(navItems, 
                    { y: 50, opacity: 0 },
                    { 
                        y: 0, 
                        opacity: 1, 
                        duration: 0.6, 
                        stagger: 0.1, 
                        ease: "power3.out",
                        delay: 0.2 // slight delay to let blur kick in
                    }
                );
            } else {
                // Fallback if GSAP isn't loaded
                navItems.forEach((item, index) => {
                    item.style.transition = `all 0.5s ease ${0.2 + (index * 0.1)}s`;
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                });
            }
        } else {
            // Close Menu
            closeMenu();
        }
    }

    function closeMenu() {
        isMenuOpen = false;
        toggleBtn.classList.remove('is-open');
        
        if (window.gsap) {
            gsap.to(navItems, {
                y: -30,
                opacity: 0,
                duration: 0.3,
                stagger: 0.05,
                ease: "power2.in",
                onComplete: () => {
                    overlay.classList.remove('is-active');
                    document.body.style.overflow = ''; // Unlock scroll
                }
            });
        } else {
            overlay.classList.remove('is-active');
            document.body.style.overflow = '';
            navItems.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(30px)';
                item.style.transition = 'none';
            });
        }
    }

    // Event Listeners
    toggleBtn.addEventListener('click', toggleMenu);

    // Close on link click
    const links = overlay.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            // If it's a hash link, let it scroll smoothly, then close
            if (link.getAttribute('href').startsWith('#')) {
                closeMenu();
            }
        });
    });

    // Close on clicking outside the links (on the overlay background)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeMenu();
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
});
