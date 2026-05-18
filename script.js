// ─── Device & Platform Detection ────────────────────────────────────────────
const _ua          = navigator.userAgent;
const isAndroid    = /Android/i.test(_ua);
const isTouchOnly  = !window.matchMedia('(pointer: fine)').matches;
const deviceMemory = navigator.deviceMemory || 4; // GB; undefined on Firefox → assume 4
const isLowEnd     = isAndroid && deviceMemory <= 2;

// ─── Page Visibility API — Pause ALL CSS animations when tab is hidden ───────
// This is the single biggest Android battery/GPU saver possible.
(function initVisibilityPause() {
    const animSelectors = [
        '.vs-3d-scene', '.vs-logo-container',
        '.orbit-spin', '.glow-orb',
        '.vc-floating-btn'
    ];
    let animEls = [];

    function collectEls() {
        animEls = [];
        animSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => animEls.push(el));
        });
    }

    function setPlayState(state) {
        if (!animEls.length) collectEls();
        animEls.forEach(el => { el.style.animationPlayState = state; });
    }

    document.addEventListener('visibilitychange', () => {
        setPlayState(document.hidden ? 'paused' : 'running');
    });

    // Initial collect after DOM settle
    requestAnimationFrame(collectEls);
})();

// ─── Magnetic Button Effect — rAF-guarded, skip on touch-only ────────────────
const magneticBtns = document.querySelectorAll('.magnetic-btn');

if (!isTouchOnly) {
    magneticBtns.forEach(btn => {
        let rafId = null;
        let lastE = null;

        btn.addEventListener('mousemove', e => {
            lastE = e;
            if (rafId) return; // Already scheduled
            rafId = requestAnimationFrame(() => {
                const rect = btn.getBoundingClientRect();
                const x = lastE.clientX - rect.left;
                const y = lastE.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const distanceX = x - centerX;
                const distanceY = y - centerY;
                btn.style.transform = `translate(${distanceX * 0.2}px, ${distanceY * 0.2}px)`;
                const text = btn.querySelector('.btn-text');
                if (text) {
                    text.style.transform = `translate(${distanceX * 0.1}px, ${distanceY * 0.1}px)`;
                }
                rafId = null;
            });
        });

        btn.addEventListener('mouseleave', () => {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            btn.style.transform = 'translate(0px, 0px)';
            const text = btn.querySelector('.btn-text');
            if (text) text.style.transform = 'translate(0px, 0px)';
        });
    });
}

// 3D Tilt Effect for Service Cards — rAF-guarded
const cards = document.querySelectorAll('.service-card');

if (!isTouchOnly) {
    cards.forEach(card => {
        let cardRaf = null;
        let lastCE = null;

        card.addEventListener('mousemove', e => {
            lastCE = e;
            if (cardRaf) return;
            cardRaf = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = lastCE.clientX - rect.left;
                const y = lastCE.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale3d(1.02, 1.02, 1.02)`;
                cardRaf = null;
            });
        });

        card.addEventListener('mouseleave', () => {
            if (cardRaf) { cancelAnimationFrame(cardRaf); cardRaf = null; }
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
        });
    });
}

// Hero Centerpiece subtle mouse follow — rAF-throttled, skipped on touch
const centerpiece = document.getElementById('centerpiece');

// On Android/touch-only, this effect never fires (no mouse) so skip binding
// to save a global listener that runs on every pointer event.
if (centerpiece && !isTouchOnly) {
    let cpRaf = null;
    let cpX = 0, cpY = 0;
    document.addEventListener('mousemove', e => {
        cpX = e.clientX / window.innerWidth;
        cpY = e.clientY / window.innerHeight;
        if (cpRaf) return;
        cpRaf = requestAnimationFrame(() => {
            const rotateX = (cpY - 0.5) * 15;
            const rotateY = (cpX - 0.5) * 15;
            centerpiece.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
            cpRaf = null;
        });
    }, { passive: true });
}

// Particle System — adaptive count based on device capability
const particleContainer = document.getElementById('particles');
if (particleContainer) {
    const style = document.createElement('style');
    style.innerHTML = `
@keyframes float-particle {
    0%   { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(50px, -100px, 0); }
}
`;
    document.head.appendChild(style);

    // Adaptive count: fewer particles = fewer GPU layers = smoother scroll on Android
    // Low-end Android (≤2GB RAM): 8 | Mid Android: 15 | Desktop: 30
    const particleCount = isLowEnd ? 8 : isAndroid ? 15 : 30;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 10;
        const opacity = Math.random() * 0.5 + 0.1;

        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: #ffffff;
            border-radius: 50%;
            left: ${left}%;
            top: ${top}%;
            opacity: ${opacity};
            box-shadow: 0 0 ${size*2}px #ffffff;
            animation: float-particle ${duration}s linear ${delay}s infinite alternate;
            pointer-events: none;
            will-change: transform;
            contain: strict;
        `;
        fragment.appendChild(particle);
    }
    particleContainer.appendChild(fragment);
}

// Navbar Scroll Effect — passive listener + rAF-throttled style writes
const nav = document.querySelector('.glass-navbar');
if (nav) {
    let scrollRaf = null;
    window.addEventListener('scroll', () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
            if (window.scrollY > 50) {
                nav.style.background = 'rgba(10, 10, 15, 0.8)';
                nav.style.padding = '10px 40px';
            } else {
                nav.style.background = 'var(--glass-bg)';
                nav.style.padding = '15px 40px';
            }
            scrollRaf = null;
        });
    }, { passive: true });
}

// Typewriter Animation
const typeWriterElement = document.getElementById('typewriter-text');
if (typeWriterElement) {
    const words = [
        { text: "MOTION GRAPHICS.", color: "#a855f7" },
        { text: "DIGITAL MARKETING.", color: "#3b82f6" },
        { text: "WEDDING PHOTOGRAPHY.", color: "#eab308" },
        { text: "ADS & PROMOTIONS.", color: "#ef4444" }
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    // Timings
    const typingDelay = 100;
    const erasingDelay = 50;
    const newWordDelay = 2000;

    function type() {
        const currentWordObj = words[wordIndex];
        const currentWord = currentWordObj.text;
        
        typeWriterElement.style.color = currentWordObj.color;
        
        if (isDeleting) {
            typeWriterElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typeWriterElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? erasingDelay : typingDelay;

        if (!isDeleting && charIndex === currentWord.length) {
            typeSpeed = newWordDelay;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    setTimeout(type, 1000);
}

// ─── About Section Scroll Reveals (Home Page) ─────────────────────────────────
(function initAboutReveals() {
    const targets = [
        { sel: '.about-subtitle',    y: 20 },
        { sel: '.about-title',       y: 30 },
        { sel: '.about-description', y: 30 },
        { sel: '.about-services',    y: 40 },
    ];

    const nodes = targets.map(t => ({ el: document.querySelector(t.sel), y: t.y }))
                         .filter(t => t.el);

    if (!nodes.length) return;

    // If GSAP + ScrollTrigger available — use them
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        nodes.forEach(({ el, y }) => {
            // Set hidden state via GSAP (not CSS) so fallback always works
            gsap.set(el, { opacity: 0, y });
            gsap.to(el, {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 92%',   // fires earlier — important for mobile
                    once: true
                }
            });
        });
        return;
    }

    // Fallback: IntersectionObserver (works on mobile even without GSAP)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    nodes.forEach(({ el, y }) => {
        el.style.opacity = '0';
        el.style.transform = `translateY(${y}px)`;
        observer.observe(el);
    });
})();

