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
});
