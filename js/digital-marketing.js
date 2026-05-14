document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    // Hero animations are now handled smoothly by pure CSS to prevent conflicts

    // Particles Effect
    const particlesContainer = document.getElementById('dm-particles');
    if (particlesContainer) {
        for(let i=0; i<40; i++) {
            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.width = Math.random() * 3 + 'px';
            p.style.height = p.style.width;
            p.style.background = 'rgba(0, 242, 254, 0.4)';
            p.style.borderRadius = '50%';
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            
            gsap.to(p, {
                y: -(Math.random() * 300 + 100),
                x: (Math.random() - 0.5) * 100,
                opacity: 0,
                duration: Math.random() * 5 + 3,
                repeat: -1,
                ease: "power1.inOut"
            });
            particlesContainer.appendChild(p);
        }
    }

    // Number Counters
    const counters = document.querySelectorAll(".dm-counter");
    counters.forEach(counter => {
        ScrollTrigger.create({
            trigger: ".dm-stats",
            start: "top 80%",
            once: true,
            onEnter: () => {
                const target = +counter.getAttribute("data-target");
                gsap.to(counter, {
                    innerHTML: target,
                    duration: 2.5,
                    ease: "power3.out",
                    snap: { innerHTML: 1 },
                    onUpdate: function() {
                        counter.innerHTML = Math.round(this.targets()[0].innerHTML);
                    }
                });
            }
        });
    });

    // Reliable IntersectionObserver for all reveal elements
    const revealElements = document.querySelectorAll('.dm-service-card, .dm-step, .dm-showcase-item, .dm-test-card, .dm-why-item, .dm-cta-box');
    
    if (revealElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        revealElements.forEach(el => {
            observer.observe(el);
        });
    }

});
