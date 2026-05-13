document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    // Dashboard Entrance
    const tl = gsap.timeline({delay: 0.5});
    
    tl.to(".dm-dash-ui", {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out"
    })
    .to(".dm-chart-line", {
        strokeDashoffset: 0,
        duration: 2,
        ease: "power2.inOut"
    }, "-=0.5")
    .from(".dm-stat-box h4", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.7)"
    }, "-=1");

    // Services Stagger
    gsap.from(".dm-service-card", {
        scrollTrigger: {
            trigger: ".dm-services",
            start: "top 75%"
        },
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power2.out"
    });

    // Pipeline Steps
    gsap.from(".dm-step", {
        scrollTrigger: {
            trigger: ".dm-pipeline",
            start: "top 70%"
        },
        scale: 0.9,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "back.out(1.2)"
    });
});
