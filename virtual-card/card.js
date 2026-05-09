/* ==========================================================================
   Virtual Card Module Logic
   Isolated module for Virtual Visiting Card
   ========================================================================== */

(function () {
    // State
    let isModalOpen = false;
    let scriptsLoaded = false;

    // CDNs
    const CDNS = {
        gsap: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
        vanillaTilt: "https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.1/vanilla-tilt.min.js",
        html2canvas: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
        jspdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    };

    // DOM Templates
    const FAB_HTML = `
        <button class="vc-floating-btn" id="vc-fab">
            <svg class="vc-icon" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Digital Card
        </button>
    `;

    // Note: Paths to assets would ideally be absolute or remote if used inside an injected script.
    // Assuming placeholder URLs for now to ensure it works anywhere.
    const QR_URL = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://visualsaint.com";

    const CARD_HTML = `
        <div class="vc-modal-overlay" id="vc-modal">
            <button class="vc-close-btn" id="vc-close" aria-label="Close modal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="vc-bg-glow"></div>
            
            <div class="vc-scene" id="vc-scene">
                <div class="vc-card-wrapper" id="vc-wrapper">
                    <!-- Front -->
                    <div class="vc-card-face vc-card-front" style="background: linear-gradient(135deg, #16161c 0%, #0a0a0f 100%);">
                        <div class="vc-shine"></div>
                        
                        <!-- Holographic Watermark -->
                        <div style="position: absolute; top: 10%; right: -15%; opacity: 0.03; transform: rotate(-15deg); pointer-events: none; z-index: 0;">
                            <h1 style="font-size: 200px; font-family: 'Outfit', sans-serif; font-weight: 800; margin: 0; line-height: 1;">VS</h1>
                        </div>
                        
                        <div class="vc-front-content" style="z-index: 2;">
                            <div class="vc-logo-area" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                                <img src="https://res.cloudinary.com/djda3lldb/image/upload/v1778315223/VSAds_Promos_low.jpg_zudxyc.jpg" alt="VS Logo" style="width: 80px; height: 80px; border-radius: 16px; object-fit: cover; box-shadow: 0 8px 20px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.05);">
                                
                                <!-- NFC / Smart Card Icon -->
                                <div style="opacity: 0.5;">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <path d="M4 10a12 12 0 0 1 16 0M8 14a6 6 0 0 1 8 0M12 18h.01"></path>
                                    </svg>
                                </div>
                            </div>
                            
                            <div class="vc-profile-area" style="text-align: center; margin-top: auto; margin-bottom: 25px; position: relative;">
                                <!-- Glowing Aura -->
                                <div style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); width: 180px; height: 200px; background: linear-gradient(45deg, rgba(138,43,226,0.4), rgba(255,153,51,0.4)); border-radius: 50%; filter: blur(30px); z-index: -1;"></div>
                                
                                <img src="https://res.cloudinary.com/djda3lldb/image/upload/v1778315189/vs_owner_beuywr.webp" alt="Owner" style="width: 160px; height: 180px; border-radius: 20px; border: 2px solid rgba(255,255,255,0.15); object-fit: cover; margin-bottom: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.7);">
                                
                                <h2 class="vc-name" style="font-size: 26px; letter-spacing: 1px; line-height: 1.1; margin-bottom: 8px;">JALADI VIJAYENDRA <br> KUMAR</h2>
                                <p class="vc-role" style="color: #ff9933; font-weight: 500; letter-spacing: 4px; font-size: 12px; margin: 0;">FOUNDER & PARTNER</p>
                            </div>
                            
                            <!-- Interesting details bottom -->
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; opacity: 0.3; font-family: monospace; font-size: 11px; letter-spacing: 1px;">
                                <div>ID: VS-98495</div>
                                <div><svg width="40" height="12" viewBox="0 0 40 12" fill="currentColor"><path d="M0 0h2v12H0zm4 0h1v12H4zm3 0h3v12H7zm5 0h1v12h-1zm3 0h2v12h-2zm4 0h1v12h-1zm3 0h4v12h-4zm6 0h1v12h-1zm3 0h2v12h-2zm4 0h1v12h-1z"/></svg></div>
                                <div>EST. 2026</div>
                            </div>
                            
                            <div class="vc-flip-hint" style="bottom: 10px; right: 10px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21.5 2v6h-6M2.13 15.57a9 9 0 1 0 3.87-10.45l-4-2"/>
                                </svg>
                                Tap to flip
                            </div>
                        </div>
                    </div>
                    
                    <!-- Back -->
                    <div class="vc-card-face vc-card-back" style="background: linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(15, 15, 20, 0.98) 100%);">
                        <div class="vc-back-content">
                            <!-- Subtle Accents -->
                            <div style="position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: rgba(138,43,226, 0.2); filter: blur(50px); z-index: -1;"></div>
                            
                            <ul class="vc-contact-list" style="margin-top: 5px;">
                                <li><a href="tel:+919849599981" class="vc-contact-item" target="_blank">
                                    <div class="vc-contact-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                    </div>
                                    +91 9849599981
                                </a></li>
                                <li><a href="mailto:hello@visualsaintvfx.com" class="vc-contact-item" target="_blank">
                                    <div class="vc-contact-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </div>
                                    hello@visualsaintvfx.com
                                </a></li>
                                <li><a href="https://www.visualsaintvfx.com" class="vc-contact-item" target="_blank">
                                    <div class="vc-contact-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                    </div>
                                    www.visualsaintvfx.com
                                </a></li>
                                <li><a href="https://www.instagram.com/visualsaintvfx?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" class="vc-contact-item" target="_blank">
                                    <div class="vc-contact-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                    </div>
                                    @visualsaintvfx
                                </a></li>
                            </ul>
                            
                            <div class="vc-qr-area" style="margin-top: auto; margin-bottom: 20px;">
                                <div class="vc-qr-box" style="width: 100px; height: 100px; box-shadow: 0 5px 20px rgba(0,0,0,0.5);">
                                    <img src="${QR_URL}" alt="QR Code">
                                </div>
                                <p style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 10px; letter-spacing: 1px;">SCAN TO CONNECT</p>
                            </div>
                            
                            <div class="vc-actions">
                                <button class="vc-btn vc-btn-primary" id="vc-download-btn">
                                    <span class="vc-btn-text">Download Card</span>
                                    <span class="vc-spinner"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialization
    function init() {
        // Inject elements
        document.body.insertAdjacentHTML('beforeend', FAB_HTML);
        document.body.insertAdjacentHTML('beforeend', CARD_HTML);

        // Bind events
        document.getElementById('vc-fab').addEventListener('click', openModal);
        document.getElementById('vc-close').addEventListener('click', closeModal);
        document.getElementById('vc-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('vc-modal')) closeModal();
        });

        document.getElementById('vc-scene').addEventListener('click', (e) => {
            // Don't flip if clicking a button or link
            if (e.target.closest('a') || e.target.closest('button')) return;
            document.getElementById('vc-wrapper').classList.toggle('vc-is-flipped');
        });

        document.getElementById('vc-download-btn').addEventListener('click', handleDownload);

        // VCard Generation
        document.getElementById('vc-save-contact').addEventListener('click', (e) => {
            e.preventDefault();
            downloadVCard();
        });

        // Preload scripts silently
        loadScripts();
    }

    // Script Loader
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function loadScripts() {
        if (scriptsLoaded) return;
        try {
            await Promise.all([
                loadScript(CDNS.gsap),
                loadScript(CDNS.vanillaTilt),
                loadScript(CDNS.html2canvas),
                loadScript(CDNS.jspdf)
            ]);
            scriptsLoaded = true;

            // Init Vanilla Tilt
            if (window.VanillaTilt) {
                VanillaTilt.init(document.getElementById('vc-scene'), {
                    max: 10,
                    speed: 400,
                    glare: true,
                    "max-glare": 0.15,
                    scale: 1.02
                });
            }
        } catch (e) {
            console.error("Virtual Card: Failed to load libraries", e);
        }
    }

    // Modal Controls
    async function openModal() {
        const modal = document.getElementById('vc-modal');
        modal.classList.add('vc-active');
        isModalOpen = true;

        if (!scriptsLoaded) await loadScripts();

        if (window.gsap) {
            gsap.fromTo('#vc-scene',
                { y: 100, opacity: 0, rotationX: -10 },
                { y: 0, opacity: 1, rotationX: 0, duration: 0.8, ease: "power3.out" }
            );
            gsap.fromTo('.vc-bg-glow',
                { scale: 0.5, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" }
            );
        }
    }

    function closeModal() {
        const modal = document.getElementById('vc-modal');
        if (window.gsap) {
            gsap.to('#vc-scene', {
                y: 50, opacity: 0, duration: 0.4, ease: "power2.in",
                onComplete: () => {
                    modal.classList.remove('vc-active');
                    // Reset flip state
                    document.getElementById('vc-wrapper').classList.remove('vc-is-flipped');
                }
            });
            gsap.to('.vc-bg-glow', { opacity: 0, duration: 0.4 });
        } else {
            modal.classList.remove('vc-active');
            document.getElementById('vc-wrapper').classList.remove('vc-is-flipped');
        }
        isModalOpen = false;
    }

    // VCard implementation
    function downloadVCard() {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:JALADI VIJAYENDRA KUMAR
ORG:Visual Saint VFX Productions
TITLE:Founder & Partner
TEL;TYPE=WORK,VOICE:+919849599981
EMAIL;TYPE=PREF,INTERNET:hello@visualsaintvfx.com
URL:https://www.visualsaintvfx.com
END:VCARD`;

        const blob = new Blob([vcard], { type: "text/vcard" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "JohnDoe_VisualSaint.vcf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Download PDF Logic
    async function handleDownload(e) {
        e.stopPropagation();
        if (!window.html2canvas || !window.jspdf) return;

        const btn = document.getElementById('vc-download-btn');
        btn.classList.add('vc-loading');

        try {
            const { jsPDF } = window.jspdf;

            // Create an off-screen clone container to capture without 3D transforms interfering
            const cloneContainer = document.createElement('div');
            cloneContainer.style.position = 'fixed';
            cloneContainer.style.top = '-9999px';
            cloneContainer.style.left = '-9999px';
            cloneContainer.style.width = '380px';
            cloneContainer.style.zIndex = '-1';
            document.body.appendChild(cloneContainer);

            // Render Front
            const frontEl = document.querySelector('.vc-card-front').cloneNode(true);
            frontEl.style.position = 'relative';
            frontEl.style.transform = 'none';
            frontEl.style.height = '600px';

            // Fix html2canvas text gradient bug
            const nameEl = frontEl.querySelector('.vc-name');
            if (nameEl) {
                nameEl.style.background = 'none';
                nameEl.style.webkitTextFillColor = 'initial';
                nameEl.style.color = '#fff';
            }

            // Hide flip hint on static PDF
            const flipHint = frontEl.querySelector('.vc-flip-hint');
            if (flipHint) flipHint.style.display = 'none';

            cloneContainer.appendChild(frontEl);

            const frontCanvas = await html2canvas(frontEl, { scale: 2, useCORS: true, backgroundColor: null });
            const frontImg = frontCanvas.toDataURL('image/jpeg', 0.95);

            // Render Back
            cloneContainer.innerHTML = '';
            const backEl = document.querySelector('.vc-card-back').cloneNode(true);
            backEl.style.position = 'relative';
            backEl.style.transform = 'none';
            backEl.style.height = '600px';

            // Remove download buttons from the static PDF capture
            const actionsEl = backEl.querySelector('.vc-actions');
            if (actionsEl) actionsEl.style.display = 'none';

            cloneContainer.appendChild(backEl);

            const backCanvas = await html2canvas(backEl, { scale: 2, useCORS: true, backgroundColor: null });
            const backImg = backCanvas.toDataURL('image/jpeg', 0.95);

            document.body.removeChild(cloneContainer);

            // Generate PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [90, 142]
            });

            // Add Front Side
            pdf.addImage(frontImg, 'JPEG', 0, 0, 90, 142);

            // Add Back Side
            pdf.addPage();
            pdf.addImage(backImg, 'JPEG', 0, 0, 90, 142);

            // Add clickable links mapped to the back face content
            pdf.link(10, 7, 70, 10, { url: 'tel:+919849599981' });
            pdf.link(10, 17, 70, 10, { url: 'mailto:hello@visualsaintvfx.com' });
            pdf.link(10, 27, 70, 10, { url: 'https://www.visualsaintvfx.com' });
            pdf.link(10, 37, 70, 10, { url: 'https://www.instagram.com/visualsaintvfx?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' });

            // Trigger download
            pdf.save("VisualSaint_Digital_Card.pdf");

        } catch (err) {
            console.error("Failed to generate PDF card", err);
            alert("Could not generate PDF card. Please check your internet connection.");
        } finally {
            btn.classList.remove('vc-loading');
        }
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
