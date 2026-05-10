/* ==========================================================================
   Wedding Photography JS
   Handles GSAP, Lenis, and Image Loading
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Initialize Lenis for Smooth Scrolling
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP with Lenis
    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    // 2. Cinematic Loader
    const loader = document.querySelector('.w-loader');
    const logo = document.querySelector('.w-loader-logo');
    const progressWrap = document.querySelector('.w-loader-progress-wrap');
    const progressBar = document.querySelector('.w-loader-progress');
    const percentage = document.querySelector('.w-loader-percentage');

    let loadProgress = 0;
    
    // Animate Logo In
    gsap.to(logo, { opacity: 1, y: 0, duration: 1.5, ease: "power3.out" });
    gsap.to(progressWrap, { opacity: 1, duration: 1, delay: 0.5 });
    gsap.to(percentage, { opacity: 1, duration: 1, delay: 0.5 });

    // Simulate Loading (Since images will be lazy loaded, we simulate initial critical load)
    const interval = setInterval(() => {
        loadProgress += Math.floor(Math.random() * 10) + 1;
        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(interval);
            
            gsap.to(progressBar, { width: "100%", duration: 0.5, ease: "power2.inOut" });
            percentage.textContent = "100%";
            
            // Fade Out Loader
            setTimeout(() => {
                gsap.to(loader, {
                    opacity: 0,
                    duration: 1.5,
                    ease: "power3.inOut",
                    onComplete: () => {
                        loader.style.display = "none";
                        initAnimations();
                    }
                });
            }, 500);
        } else {
            gsap.to(progressBar, { width: `${loadProgress}%`, duration: 0.2 });
            percentage.textContent = `${loadProgress}%`;
        }
    }, 150);

    // 3. Image Loading Logic (The 59 Images)
    const cloudinaryImages = [
        "https://res.cloudinary.com/djda3lldb/image/upload/v1778337495/15-2-1_tq9g4f.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337493/04-2-1_alhctw.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337492/16-2-1_xntqaa.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337492/46-2-1_kxsiut.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337492/62-2-1_ftddi4.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337491/47-2-1_pxmyxx.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337491/01-2-1_b8uopy.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337489/63-2-1_ecagjl.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337489/25-2-1_owce1w.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337488/59-2-1_qyas8y.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337488/55-2-1_osvgml.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337488/26-2-1_rf7bes.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337488/66-2-1_ojufja.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337487/20-2-1_ggevwr.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337487/33-2-1_ld5kes.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337487/23-2-1_bayxkj.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337487/13-2-1_bs1m4u.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337487/32-2-1_igujc2.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337487/60-2-1_m6fxko.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337486/29-2-1_xbhv3k.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337486/30-2-1_nbvbdg.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337486/07-2-1_mwjfww.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337486/61-2-1_h1shg4.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337485/31-2-1_xsgqth.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337485/65-2-1_svfb1u.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337485/43-2-1_uvcpte.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337485/64-2-1_rptdrg.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337485/06-2-1_emllfm.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337484/08-2-1_b5bj7s.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337484/05-2-1_dvy4m4.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337484/57-2-1_oktahr.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337484/40-2-1_cnwfys.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337484/36-2-1_bwuur6.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337483/38-2-1_i7hdke.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337483/11-2-1_rx94j3.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337483/56-2-1_ydosbp.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337483/10-2-1_bhrgku.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337482/44-2-1_luymiy.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337482/48-2-1_pmunuh.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337482/28-2-1_jdmilr.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337482/24-2-1_rt3prz.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337481/52-2-1_oihp8o.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337481/39-2-1_tpazrx.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337481/34-2-1_l7kooe.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337481/35-2-1_l05rpj.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337481/02-2-1_g3j5jp.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337481/27-2-1_xy5djd.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337480/58-2-1_xfitph.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337480/22-2-1_atsmx1.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337480/53-2-1_qpimf2.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337480/09-2-1_xqez5d.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337480/51-2-1_v5fmqd.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337480/37-2-1_nenkdx.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337479/41-2-1_hiljqo.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337479/16-2-1_1_neiy6m.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337479/54-2-1_v8foaq.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337479/47-2-1_1_kw0dmu.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337479/42-2-1_cpifea.webp", "https://res.cloudinary.com/djda3lldb/image/upload/v1778337478/62-2-1_1_ta6qoa.webp"
    ];

    // Optimize image format delivery (Cloudinary auto format/quality)
    const optimizeUrl = (url) => url.replace('/upload/', '/upload/f_auto,q_auto/');

    // Assign Images to specific elements
    
    // Hero
    if(document.querySelector('.w-hero-img')) document.querySelector('.w-hero-img').src = optimizeUrl(cloudinaryImages[0]);
    
    // Event Cards (Take 5)
    const eventCards = document.querySelectorAll('.w-event-img');
    eventCards.forEach((img, i) => {
        if (cloudinaryImages[i+6]) img.src = optimizeUrl(cloudinaryImages[i+6]);
    });
    
    // CTA BG
    if(document.querySelector('.w-cta-bg')) document.querySelector('.w-cta-bg').src = optimizeUrl(cloudinaryImages[15]);

    // Masonry (The rest of the images)
    const masonryContainer = document.querySelector('.w-masonry');
    if (masonryContainer) {
        let masonryHTML = '';
        for (let i = 16; i < cloudinaryImages.length; i++) {
            masonryHTML += `
                <div class="w-masonry-item">
                    <img src="${optimizeUrl(cloudinaryImages[i])}" loading="lazy" alt="Wedding Moment">
                </div>
            `;
        }
        masonryContainer.innerHTML = masonryHTML;
    }

    // 4. GSAP Animations
    function initAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        // Hero Parallax
        gsap.to('.w-hero-img', {
            yPercent: 30,
            ease: "none",
            scrollTrigger: {
                trigger: ".w-hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });

        // Emotion Text Reveal (Scroll Triggered)
        const emotionSpans = document.querySelectorAll('.w-emotion-text span');
        emotionSpans.forEach((span, i) => {
            ScrollTrigger.create({
                trigger: span,
                start: "top 80%",
                onEnter: () => span.classList.add('active'),
                onLeaveBack: () => span.classList.remove('active') // Optional: remove if you want it to hide again
            });
        });

        // Masonry Elegant Landing Reveal
        const masonryItems = gsap.utils.toArray('.w-masonry-item');
        masonryItems.forEach((item) => {
            gsap.fromTo(item, 
                { y: 150, opacity: 0, scale: 0.95, filter: "blur(10px)" },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                    duration: 1.5,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: item,
                        start: "top 90%",
                    }
                }
            );
        });

        // Cinematic Auto-Play Experience
        initCinematicAutoPlay();
    }

    // Cinematic Auto-Play Engine
    function initCinematicAutoPlay() {
        const centerImg1 = document.querySelector('.w-cinema-img-1');
        const centerImg2 = document.querySelector('.w-cinema-img-2');
        const floatingFrames = document.querySelectorAll('.w-frame-floating img');
        if (!centerImg1 || !centerImg2 || floatingFrames.length === 0) return;

        // Start from index 10 to skip hero/events
        let currentIndex = 10;
        const totalImages = cloudinaryImages.length;
        let isImg1Active = true;

        // Initialize first set of images
        centerImg1.src = optimizeUrl(cloudinaryImages[currentIndex]);
        floatingFrames.forEach((img, i) => {
            img.src = optimizeUrl(cloudinaryImages[(currentIndex + i + 1) % totalImages]);
        });

        // The main Auto-Play Loop
        setInterval(() => {
            currentIndex = (currentIndex + 5) % totalImages; // Jump to next batch of images
            
            const nextCenterUrl = optimizeUrl(cloudinaryImages[currentIndex]);
            const activeImg = isImg1Active ? centerImg1 : centerImg2;
            const nextImg = isImg1Active ? centerImg2 : centerImg1;

            // Load next image into the hidden img tag
            nextImg.src = nextCenterUrl;

            // Smooth crossfade using GSAP
            gsap.to(activeImg, { opacity: 0, duration: 2, ease: "power2.inOut", scale: 0.95 });
            gsap.fromTo(nextImg, 
                { opacity: 0, scale: 1.05 },
                { opacity: 1, duration: 2, ease: "power2.inOut", scale: 1 }
            );

            // Softly update floating frames with new images and slight blur transition
            floatingFrames.forEach((img, i) => {
                gsap.to(img, {
                    opacity: 0,
                    filter: "blur(10px)",
                    duration: 1,
                    onComplete: () => {
                        img.src = optimizeUrl(cloudinaryImages[(currentIndex + i + 1) % totalImages]);
                        gsap.to(img, {
                            opacity: 1,
                            filter: "blur(0px)",
                            duration: 1.5,
                            ease: "power2.out"
                        });
                    }
                });
            });

            isImg1Active = !isImg1Active;

        }, 4000); // Change scene every 4 seconds
        
        // Optional: Mouse Hover Tilt for premium interaction
        const cinemaWrapper = document.querySelector('.w-cinematic-autoplay');
        const cinemaFrames = document.querySelector('.w-cinema-frames');
        
        if (cinemaWrapper && cinemaFrames && window.innerWidth > 768) {
            cinemaWrapper.addEventListener('mousemove', (e) => {
                // Subtle tilt logic
                const xAxis = (window.innerWidth / 2 - e.pageX) / 80;
                const yAxis = (window.innerHeight / 2 - e.pageY) / 80;
                gsap.to(cinemaFrames, {
                    rotationY: xAxis,
                    rotationX: yAxis,
                    duration: 1,
                    ease: "power2.out"
                });
            });
            cinemaWrapper.addEventListener('mouseleave', () => {
                gsap.to(cinemaFrames, {
                    rotationY: 0,
                    rotationX: 0,
                    duration: 1,
                    ease: "power2.out"
                });
            });
        }
    }

});
