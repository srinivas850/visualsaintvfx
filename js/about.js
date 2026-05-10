document.addEventListener('DOMContentLoaded', () => {
    // ── Counter Animation (pure JS, no GSAP dependency) ──────────────────────
    function animateCounter(el, target, duration) {
        let start = 0;
        const step = target / (duration / 16);

        function tick() {
            start += step;
            if (start >= target) {
                el.textContent = target.toLocaleString();
                return;
            }
            el.textContent = Math.floor(start).toLocaleString();
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    const counters = document.querySelectorAll('.counter');
    const statsSection = document.getElementById('stats-counter-section');

    if (counters.length && statsSection) {
        let fired = false;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !fired) {
                    fired = true;
                    counters.forEach(counter => {
                        const target = parseInt(counter.getAttribute('data-target'), 10);
                        animateCounter(counter, target, 2000);
                    });
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });

        observer.observe(statsSection);
    }

    // ── GSAP Scroll Reveals (if GSAP loaded) ──────────────────────────────────
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Fade-up for story text, section titles etc.
        gsap.utils.toArray('.ap-hero-title, .ap-hero-sub, .ap-quote, .ap-body-text, .ap-section-title, .ap-founder-name, .ap-founder-role').forEach((el, i) => {
            gsap.fromTo(el,
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0,
                    duration: 1,
                    delay: i * 0.05,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
                }
            );
        });

        // Founder image slide-in
        gsap.fromTo('.ap-founder-img-wrap',
            { opacity: 0, x: -50 },
            { opacity: 1, x: 0, duration: 1.2, ease: 'power2.out',
              scrollTrigger: { trigger: '.ap-founder-grid', start: 'top 80%', once: true }
            }
        );

        // Team image scale-in
        gsap.fromTo('.ap-team-img-wrap',
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out',
              scrollTrigger: { trigger: '.ap-team-img-wrap', start: 'top 85%', once: true }
            }
        );

        // Stat cards stagger
        gsap.fromTo('.ap-stat-card',
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out',
              scrollTrigger: { trigger: '.ap-stats-grid', start: 'top 85%', once: true }
            }
        );
    }
});
