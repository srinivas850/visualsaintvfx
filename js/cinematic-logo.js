/**
 * VISUAL SAINT VFX — Ultra-Premium Cinematic 3D Logo JS Controller
 * Powered by GSAP
 */
(function() {
    'use strict';

    // Wait for DOM to load
    document.addEventListener("DOMContentLoaded", function() {
        initCinematicLogo();
    });

    function initCinematicLogo() {
        const stage = document.querySelector('.cin-logo-stage');
        const iconGroup = document.querySelector('.cin-icon-group');
        const vShape = document.querySelector('.cin-v-shape');
        const eye = document.querySelector('.cin-center-eye');
        const eyeRings = document.querySelectorAll('.cin-eye-ring');
        const eyeCore = document.querySelector('.cin-eye-core');
        const shards = document.querySelectorAll('.cin-shard');
        const title = document.querySelector('.cin-title');
        const productions = document.querySelector('.cin-productions');
        const tagline = document.querySelector('.cin-tagline');
        const dots = document.querySelectorAll('.cin-dot');
        const canvas = document.getElementById('cin-canvas');
        const rings = document.querySelectorAll('.cin-glow-ring');

        if (!stage || !iconGroup) return;

        // --- 1. Canvas Particles Trails ---
        let ctx = null;
        let particles = [];
        let rafId = null;

        if (canvas) {
            ctx = canvas.getContext('2d');
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas, { passive: true });
            
            // Generate initial particles
            for (let i = 0; i < 45; i++) {
                particles.push(createParticle(true));
            }
            
            drawParticles();
        }

        function resizeCanvas() {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * 1.5;
            canvas.height = rect.height * 1.5;
        }

        function createParticle(randomStart = false) {
            const colors = ['rgba(123, 45, 255, ', 'rgba(45, 123, 255, ', 'rgba(255, 34, 34, ', 'rgba(0, 204, 102, '];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 2.5 + 0.8;
            
            return {
                x: Math.random() * canvas.width,
                y: randomStart ? Math.random() * canvas.height : canvas.height + 20,
                vx: (Math.random() - 0.5) * 0.6,
                vy: -(Math.random() * 1.2 + 0.5), // Rising (anti-gravity)
                size: size,
                alpha: Math.random() * 0.4 + 0.2,
                decay: Math.random() * 0.003 + 0.001,
                color: color,
                // Orbit/attraction center
                centerX: canvas.width / 2,
                centerY: canvas.height / 2,
                attractForce: Math.random() * 0.015 + 0.005
            };
        }

        function drawParticles() {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw particle trails
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                
                // Slow attraction towards center (implosion/assembly feel)
                const dx = p.centerX - p.x;
                const dy = p.centerY - p.y;
                p.vx += dx * p.attractForce * 0.1;
                p.vy += dy * p.attractForce * 0.1;

                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;

                if (p.alpha <= 0 || p.y < -20 || p.x < -20 || p.x > canvas.width + 20) {
                    particles[i] = createParticle(false);
                    continue;
                }

                ctx.beginPath();
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                grad.addColorStop(0, p.color + p.alpha + ')');
                grad.addColorStop(1, p.color + '0)');
                ctx.fillStyle = grad;
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fill();
            }

            rafId = requestAnimationFrame(drawParticles);
        }

        // --- 2. Anti-gravity Shard Scatter Setup ---
        // Pre-scatter shards in random 3D space with high blurs/rotations
        gsap.set(shards, {
            x: () => (Math.random() - 0.5) * 450,
            y: () => (Math.random() - 0.5) * 350 - 100,
            z: () => Math.random() * 300 - 150,
            rotationX: () => Math.random() * 360,
            rotationY: () => Math.random() * 360,
            rotationZ: () => Math.random() * 360,
            scale: 0.1,
            opacity: 0,
            filter: "blur(12px) brightness(2)"
        });

        // Set other initial states
        gsap.set([vShape, eye, eyeCore, eyeRings, title, productions, tagline, dots], { opacity: 0 });
        gsap.set(vShape, { scale: 0.2, y: 150, rotationX: 45, filter: "blur(15px)" });
        gsap.set(eye, { scale: 0.1, z: 200, filter: "blur(10px)" });
        gsap.set(title, { scale: 0.8, y: 30, z: -100, filter: "blur(8px)" });
        gsap.set(productions, { scale: 0.9, y: 20, z: -80 });

        // --- 3. Majestic Cinematic Assembly Timeline ---
        const tl = gsap.timeline({
            delay: 0.8,
            onComplete: () => {
                // Trigger post-assembly idle animations
                iconGroup.classList.add('assembled');
                stage.classList.add('breathing');
                shards.forEach(s => s.classList.add('assembled'));
                rings.forEach(r => r.classList.add('active'));
                
                // Active subtle parallax mouse movement
                enableParallax();
            }
        });

        // Phase A: Anti-gravity rise & sweep
        tl.to(vShape, {
            opacity: 1,
            scale: 1,
            y: 0,
            rotationX: 0,
            filter: "blur(0px)",
            duration: 2.2,
            ease: "power4.out"
        });

        // Phase B: Shards aggregate with smooth glowing trails
        shards.forEach((shard, idx) => {
            const finalX = parseFloat(shard.style.getPropertyValue('--final-x') || 0);
            const finalY = parseFloat(shard.style.getPropertyValue('--final-y') || 0);
            const finalRot = parseFloat(shard.style.getPropertyValue('--final-rot') || 0);

            tl.to(shard, {
                opacity: 1,
                x: finalX,
                y: finalY,
                z: 0,
                rotationX: 0,
                rotationY: 0,
                rotationZ: finalRot,
                scale: 1,
                filter: "blur(0px) brightness(1)",
                duration: 2.5,
                ease: "power3.inOut"
            }, idx * 0.15 + 0.5); // Staggered entry
        });

        // Phase C: Eye and Core assembly
        tl.to(eye, {
            opacity: 1,
            scale: 1,
            z: 0,
            filter: "blur(0px)",
            duration: 1.8,
            ease: "back.out(1.5)"
        }, "-=1.5");

        tl.to(eyeRings, {
            opacity: 1,
            stagger: 0.15,
            duration: 1.2,
            ease: "power2.out"
        }, "-=1.0");

        tl.to(eyeCore, {
            opacity: 1,
            scale: 1,
            duration: 1.0,
            ease: "elastic.out(1, 0.5)"
        }, "-=0.8");

        // Phase D: Brand Typography reveal with Cinematic Sweeps
        tl.to(title, {
            opacity: 1,
            scale: 1,
            y: 0,
            z: 0,
            filter: "blur(0px)",
            duration: 1.8,
            ease: "power3.out"
        }, "-=0.6");

        tl.to(productions, {
            opacity: 1,
            scale: 1,
            y: 0,
            z: 0,
            duration: 1.5,
            ease: "power2.out"
        }, "-=1.0");

        // Phase E: Futuristic Typing effect for tagline
        tl.call(() => {
            const taglineText = "THE COMPLETE MEDIA WORKS...";
            tagline.style.opacity = 1;
            let currentStr = "";
            let charIdx = 0;

            function typeTagline() {
                if (charIdx < taglineText.length) {
                    currentStr += taglineText.charAt(charIdx);
                    tagline.textContent = currentStr;
                    charIdx++;
                    setTimeout(typeTagline, 65);
                } else {
                    tagline.classList.add('typing-done');
                    // Fade in the three RGB glowing accent dots at the bottom right
                    gsap.to(dots, {
                        opacity: 1,
                        scale: 1,
                        stagger: 0.2,
                        duration: 0.8,
                        ease: "back.out(2)"
                    });
                }
            }
            typeTagline();
        }, null, "-=0.4");

        // --- 4. Interactive Mouse Parallax (Optimized rAF-throttled) ---
        function enableParallax() {
            if ('ontouchstart' in window) return; // Skip on mobile/touch screens

            let mouseX = 0, mouseY = 0;
            let targetX = 0, targetY = 0;
            let pRafId = null;

            document.addEventListener('mousemove', function(e) {
                mouseX = (e.clientX / window.innerWidth) - 0.5;
                mouseY = (e.clientY / window.innerHeight) - 0.5;

                if (!pRafId) {
                    pRafId = requestAnimationFrame(updateParallax);
                }
            }, { passive: true });

            function updateParallax() {
                // Interpolation for ultra-smooth easing
                targetX += (mouseX - targetX) * 0.08;
                targetY += (mouseY - targetY) * 0.08;

                // Parallax transforms on layers for fake 3D depth
                gsap.set(iconGroup, {
                    rotationY: targetX * 25,
                    rotationX: -targetY * 20,
                    x: targetX * 15,
                    y: targetY * 12
                });

                gsap.set(title, {
                    rotationY: targetX * 12,
                    rotationX: -targetY * 10,
                    x: targetX * 8,
                    y: targetY * 6,
                    z: 20
                });

                gsap.set(productions, {
                    rotationY: targetX * 8,
                    rotationX: -targetY * 6,
                    x: targetX * 5,
                    y: targetY * 4,
                    z: 10
                });

                pRafId = requestAnimationFrame(updateParallax);
            }
        }
    }
})();
