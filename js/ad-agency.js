document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Animation
    gsap.from(".ad-title span", {
        y: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1.2,
        ease: "power4.out",
        delay: 0.2
    });

    gsap.from(".ad-subtitle, .ad-hero-cta", {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        delay: 0.8
    });

    // Stat Counter Animation
    const counters = document.querySelectorAll('.ad-counter');
    
    counters.forEach(counter => {
        ScrollTrigger.create({
            trigger: counter,
            start: "top 80%",
            once: true,
            onEnter: () => {
                const target = +counter.getAttribute('data-target');
                gsap.to(counter, {
                    innerHTML: target,
                    duration: 2,
                    snap: { innerHTML: 1 },
                    ease: "power2.out"
                });
            }
        });
    });

    // Campaign Image Parallax & Reveal
    const campaignItems = document.querySelectorAll('.ad-campaign-item');
    
    campaignItems.forEach(item => {
        const img = item.querySelector('.ad-campaign-img');
        const info = item.querySelector('.ad-campaign-info');
        
        gsap.from(img, {
            scrollTrigger: {
                trigger: item,
                start: "top 75%"
            },
            scale: 1.1,
            opacity: 0,
            duration: 1.5,
            ease: "power3.out"
        });
        
        gsap.from(info.children, {
            scrollTrigger: {
                trigger: item,
                start: "top 70%"
            },
            y: 30,
            opacity: 0,
            stagger: 0.15,
            duration: 1,
            ease: "power2.out"
        });
    });
});
