document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // ── Hero animation ────────────────────────────────────────────────
    gsap.from('.ad-title span', {
        y: 100, opacity: 0, stagger: 0.2, duration: 1.2, ease: 'power4.out', delay: 0.2
    });
    gsap.from('.ad-subtitle, .ad-hero-cta', {
        y: 30, opacity: 0, duration: 1, ease: 'power2.out', delay: 0.8
    });

    // ── Stat counter ─────────────────────────────────────────────────
    document.querySelectorAll('.ad-counter').forEach(counter => {
        ScrollTrigger.create({
            trigger: counter, start: 'top 80%', once: true,
            onEnter: () => {
                const target = +counter.getAttribute('data-target');
                gsap.to(counter, {
                    innerHTML: target, duration: 2,
                    snap: { innerHTML: 1 }, ease: 'power2.out'
                });
            }
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // ADS & PROMOS CINEMATIC SECTION
    // ══════════════════════════════════════════════════════════════════

    // ── Scroll-reveal (IntersectionObserver only — no GSAP conflict) ──
    const reveals = document.querySelectorAll('.aps-reveal');
    if (reveals.length) {
        const revealObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                // Stagger cards by their DOM order
                const card = el.classList.contains('aps-card') ? el : null;
                const delay = card
                    ? Array.from(document.querySelectorAll('.aps-card')).indexOf(card) * 100
                    : 0;
                setTimeout(() => el.classList.add('visible'), delay);
                revealObs.unobserve(el);
            });
        }, { threshold: 0.05 }); // low threshold — fire as soon as 5% is visible

        reveals.forEach(el => revealObs.observe(el));
    }

    // ── GSAP hero + stats animations (separate from cards) ───────────
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
            trigger: '.aps-header',
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.from('.aps-eyebrow, .aps-lens-accent, .aps-title, .aps-desc', {
                    y: 24, opacity: 0, stagger: 0.1,
                    duration: 0.8, ease: 'power2.out',
                    clearProps: 'all'   // ← remove inline styles when done
                });
            }
        });
    }
    const particleBox = document.getElementById('aps-particles');
    if (particleBox) {
        const COUNT = 28;
        for (let i = 0; i < COUNT; i++) {
            const p = document.createElement('span');
            p.className = 'aps-particle';
            p.style.setProperty('--x',     Math.random() * 100 + '%');
            p.style.setProperty('--y',     Math.random() * 100 + '%');
            p.style.setProperty('--dur',   (6 + Math.random() * 10) + 's');
            p.style.setProperty('--delay', (Math.random() * -12)    + 's');
            p.style.width  = (Math.random() > 0.7 ? 3 : 2) + 'px';
            p.style.height = p.style.width;
            particleBox.appendChild(p);
        }
    }

    // ── Ambient canvas light-leak animations ──────────────────────────
    function initAmbientCanvas(id, hue, reverse) {
        const cv = document.getElementById(id);
        if (!cv) return;
        const ctx = cv.getContext('2d');
        const W = cv.width, H = cv.height;
        let t = 0;
        const streaks = Array.from({ length: 12 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            len: 40 + Math.random() * 60,
            spd: 0.3 + Math.random() * 0.5,
            a: 0.02 + Math.random() * 0.06,
            ang: (reverse ? 1 : -1) * (Math.random() * 30 - 15) * Math.PI / 180
        }));
        function draw() {
            ctx.clearRect(0, 0, W, H);
            t += 0.01;
            streaks.forEach(s => {
                const dx = Math.cos(s.ang) * s.len;
                const dy = Math.sin(s.ang) * s.len;
                const g = ctx.createLinearGradient(s.x, s.y, s.x - dx, s.y - dy);
                const pulse = s.a * (0.7 + 0.3 * Math.sin(t + s.x));
                g.addColorStop(0, `hsla(${hue},80%,60%,${pulse})`);
                g.addColorStop(1, `hsla(${hue},80%,60%,0)`);
                ctx.beginPath();
                ctx.strokeStyle = g;
                ctx.lineWidth = 1.5;
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - dx, s.y - dy);
                ctx.stroke();
                s.y -= s.spd * 0.5;
                s.x -= s.spd * 0.3;
                if (s.y < -s.len || s.x < -s.len) {
                    s.x = Math.random() * W;
                    s.y = H + 10;
                }
            });
            requestAnimationFrame(draw);
        }
        draw();
        cv.parentElement.classList.add('loaded');
    }
    initAmbientCanvas('aps-cnv-tl', 45,  false);  // warm gold top-left
    initAmbientCanvas('aps-cnv-tr', 280, true);   // purple top-right
    initAmbientCanvas('aps-cnv-bl', 200, false);  // blue bottom-left

    // ── Modal logic ───────────────────────────────────────────────────
    const backdrop  = document.getElementById('aps-modal');
    const iframe    = document.getElementById('aps-iframe');
    const modalTitle = document.getElementById('aps-modal-title');
    const closeBtn  = document.getElementById('aps-modal-close');
    const CHANNEL_URL = 'https://www.youtube.com/@visualsaintadsandpromos/videos';

    function openModal(videoId, title) {
        if (!backdrop || !iframe) return;
        // Use YouTube nocookie embed with autoplay
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&color=white`;
        if (modalTitle) modalTitle.textContent = title || '';
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!backdrop || !iframe) return;
        backdrop.classList.remove('open');
        // Stop video after transition
        setTimeout(() => { iframe.src = ''; }, 450);
        document.body.style.overflow = '';
    }

    // Card click → open modal (or channel if no video ID set)
    document.querySelectorAll('.aps-card').forEach(card => {
        card.addEventListener('click', () => {
            const vid   = card.dataset.vid;
            const title = card.dataset.title;
            if (vid && vid.trim().length > 0) {
                openModal(vid, title);
            } else {
                // No real video ID yet — open the channel page
                window.open(CHANNEL_URL, '_blank', 'noopener');
            }
        });
        // Keyboard accessible
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Click outside modal box to close
    if (backdrop) {
        backdrop.addEventListener('click', e => {
            if (e.target === backdrop) closeModal();
        });
    }

    // Escape key to close
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    // ── Subtle 3D tilt on card hover ──────────────────────────────────
    document.querySelectorAll('.aps-card').forEach(card => {
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
});
