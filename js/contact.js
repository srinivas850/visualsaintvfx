// Contact Form — WhatsApp redirect on submit
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cp-form');
    const btn  = document.getElementById('cp-submit');
    const successMsg = document.getElementById('cp-success');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name    = document.getElementById('cp-name').value.trim();
        const phone   = document.getElementById('cp-phone').value.trim();
        const email   = document.getElementById('cp-email').value.trim();
        const service = document.getElementById('cp-service').value;
        const date    = document.getElementById('cp-date').value;
        const message = document.getElementById('cp-msg').value.trim();

        if (!name || !phone) {
            alert('Please fill in your name and phone number.');
            return;
        }

        btn.classList.add('sending');
        btn.querySelector('.cp-btn-text').textContent = 'Sending...';

        // Build WhatsApp message
        const wa = [
            `*New Inquiry — Visual Saint VFX*`,
            ``,
            `*Name:* ${name}`,
            `*Phone:* ${phone}`,
            email    ? `*Email:* ${email}`           : null,
            service  ? `*Service:* ${service}`       : null,
            date     ? `*Event Date:* ${date}`       : null,
            message  ? `*Message:* ${message}`       : null,
        ].filter(Boolean).join('\n');

        const waUrl = `https://wa.me/919849599981?text=${encodeURIComponent(wa)}`;

        // Small delay for UX, then open WhatsApp
        setTimeout(() => {
            window.open(waUrl, '_blank');
            btn.classList.remove('sending');
            btn.querySelector('.cp-btn-text').textContent = 'Send Message';
            successMsg.classList.add('show');
            form.reset();
            setTimeout(() => successMsg.classList.remove('show'), 6000);
        }, 600);
    });

    // GSAP entrance animations
    if (typeof gsap !== 'undefined') {
        gsap.fromTo('.cp-hero-title, .cp-hero-sub, .cp-badge',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
        );
        gsap.fromTo('.cp-info-card',
            { opacity: 0, x: -30 },
            { opacity: 1, x: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out', delay: 0.5 }
        );
        gsap.fromTo('.cp-form-card',
            { opacity: 0, x: 30 },
            { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out', delay: 0.5 }
        );
    }
});
