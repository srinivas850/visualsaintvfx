// Magnetic Button Effect
const magneticBtns = document.querySelectorAll('.magnetic-btn');

magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate center
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Distance from center
        const distanceX = x - centerX;
        const distanceY = y - centerY;
        
        // Apply transform
        btn.style.transform = `translate(${distanceX * 0.2}px, ${distanceY * 0.2}px)`;
        
        // If btn has text span, move it slightly more for parallax
        const text = btn.querySelector('.btn-text');
        if (text) {
            text.style.transform = `translate(${distanceX * 0.1}px, ${distanceY * 0.1}px)`;
        }
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
        const text = btn.querySelector('.btn-text');
        if (text) {
            text.style.transform = 'translate(0px, 0px)';
        }
    });
});

// 3D Tilt Effect for Service Cards
const cards = document.querySelectorAll('.service-card');

cards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element.
        const y = e.clientY - rect.top;  // y position within the element.
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
        const rotateY = ((x - centerX) / centerX) * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
    });
});

// Hero Centerpiece subtle mouse follow
const centerpiece = document.getElementById('centerpiece');

if (centerpiece) {
    document.addEventListener('mousemove', e => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        const rotateX = (y - 0.5) * 15; // Subtle movement
        const rotateY = (x - 0.5) * 15;
        
        centerpiece.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
    });
}

// Simple Particle System for Atmosphere
const particleContainer = document.getElementById('particles');
if (particleContainer) {
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random properties
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
        `;
        
        particleContainer.appendChild(particle);
    }
}

// Add CSS keyframes dynamically for particles
const style = document.createElement('style');
style.innerHTML = `
@keyframes float-particle {
    0% { transform: translateY(0) translateX(0); }
    100% { transform: translateY(-100px) translateX(50px); }
}
`;
document.head.appendChild(style);

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.glass-navbar');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(10, 10, 15, 0.8)';
        nav.style.padding = '10px 40px';
    } else {
        nav.style.background = 'var(--glass-bg)';
        nav.style.padding = '15px 40px';
    }
});

// Typewriter Animation
const typeWriterElement = document.getElementById('typewriter-text');
if (typeWriterElement) {
    const words = [
        "MOTION GRAPHICS.",
        "DIGITAL MARKETING.",
        "WEDDING PHOTOGRAPHY.",
        "ADS & PROMOTIONS."
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    // Timings
    const typingDelay = 100;
    const erasingDelay = 50;
    const newWordDelay = 2000;

    function type() {
        const currentWord = words[wordIndex];
        
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
