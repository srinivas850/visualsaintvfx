document.addEventListener('DOMContentLoaded', () => {
    // Simple particle effect for hero
    const particlesContainer = document.getElementById('mg-particles');
    
    if (particlesContainer) {
        for(let i=0; i<30; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = Math.random() * 3 + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = 'rgba(160, 190, 255, 0.4)';
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            // Animation
            gsap.to(particle, {
                y: -(Math.random() * 200 + 100),
                x: (Math.random() - 0.5) * 100,
                opacity: 0,
                duration: Math.random() * 5 + 3,
                repeat: -1,
                ease: "power1.inOut"
            });
            
            particlesContainer.appendChild(particle);
        }
    }

    // Scroll Animations
    gsap.registerPlugin(ScrollTrigger);

    gsap.from(".mg-card", {
        scrollTrigger: {
            trigger: ".mg-showcase",
            start: "top 70%"
        },
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out"
    });

    gsap.from(".mg-cap-item", {
        scrollTrigger: {
            trigger: ".mg-capabilities",
            start: "top 70%"
        },
        x: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out"
    });
    // ── Scroll-reveal (IntersectionObserver only) ──
    const reveals = document.querySelectorAll('.aps-reveal');
    if (reveals.length) {
        const revealObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const card = el.classList.contains('aps-card') ? el : null;
                const delay = card
                    ? Array.from(document.querySelectorAll('.aps-card')).indexOf(card) * 100
                    : 0;
                setTimeout(() => el.classList.add('visible'), delay);
                revealObs.unobserve(el);
            });
        }, { threshold: 0.05 });
        reveals.forEach(el => revealObs.observe(el));
    }

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
            trigger: '.aps-header',
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.from('.aps-eyebrow, .aps-lens-accent, .aps-title, .aps-desc', {
                    y: 24, opacity: 0, stagger: 0.1,
                    duration: 0.8, ease: 'power2.out',
                    clearProps: 'all'
                });
            }
        });
    }

    // ── Modal logic ──
    const backdrop  = document.getElementById('aps-modal');
    const iframe    = document.getElementById('aps-iframe');
    const modalTitle = document.getElementById('aps-modal-title');
    const closeBtn  = document.getElementById('aps-modal-close');
    const CHANNEL_URL = 'https://www.youtube.com/@visualsaintadsandpromos/videos';

    function openModal(videoId, title) {
        if (!backdrop || !iframe) return;
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&color=white`;
        if (modalTitle) modalTitle.textContent = title || '';
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!backdrop || !iframe) return;
        backdrop.classList.remove('open');
        setTimeout(() => { iframe.src = ''; }, 450);
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.aps-card').forEach(card => {
        card.addEventListener('click', () => {
            const vid   = card.dataset.vid;
            const title = card.dataset.title;
            if (vid && vid.trim().length > 0) {
                openModal(vid, title);
            } else {
                window.open(CHANNEL_URL, '_blank', 'noopener');
            }
        });
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });

        // Subtle 3D tilt on card hover
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 10;
            const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -8;
            card.style.transform = `translateY(-8px) scale(1.01) rotateX(${y}deg) rotateY(${x}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) {
        backdrop.addEventListener('click', e => {
            if (e.target === backdrop) closeModal();
        });
    }
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

});
