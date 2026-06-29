const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const BASE_URL = isLocal ? 'http://localhost:5000' : 'https://visualsaintvfx.onrender.com';
const API_URL = `${BASE_URL}/api`;

// State
let availableServices = [];
let selectedServices = [];
let appliedPromo = null; // { id, code, discount_percentage }
let invoiceTotals = { subtotal: 0, discountAmount: 0, gstAmount: 0, grandTotal: 0 };
let currentInvoiceNumber = null;

// DOM Elements
const servicesContainer = document.getElementById('services-container');
const servicesLoading = document.getElementById('services-loading');
const summaryServicesList = document.getElementById('summary-services-list');
const elSubtotal = document.getElementById('summary-subtotal');
const elDiscountRow = document.getElementById('summary-discount-row');
const elDiscountPct = document.getElementById('summary-discount-pct');
const elDiscountAmount = document.getElementById('summary-discount-amount');
const elGstRow = document.getElementById('summary-gst-row');
const elGst = document.getElementById('summary-gst');
const elTotal = document.getElementById('summary-total');

const btnGeneratePdf = document.getElementById('btn-generate-pdf');
const btnSubmitBooking = document.getElementById('btn-submit-booking');

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    
    // Add input listeners to validate form
    const formInputs = document.querySelectorAll('#customer-form input[required]');
    formInputs.forEach(input => {
        input.addEventListener('input', checkFormValidity);
    });
});

async function loadServices() {
    try {
        const res = await fetch(`${API_URL}/booking/services`);
        const data = await res.json();
        
        if (data.success && data.services.length > 0) {
            availableServices = data.services;
            renderServicesList();
        } else {
            servicesLoading.textContent = 'No services available at the moment.';
        }
    } catch (err) {
        servicesLoading.textContent = 'Failed to load services. Please try again.';
    }
}

function renderServicesList() {
    servicesLoading.style.display = 'none';
    servicesContainer.innerHTML = '';
    
    availableServices.forEach(service => {
        const item = document.createElement('div');
        item.className = 'service-item';
        item.innerHTML = `
            <div class="service-info">
                <h4>${service.name}</h4>
                <p>Professional Service</p>
            </div>
            <div class="service-price">₹${parseFloat(service.price).toFixed(2)}</div>
        `;
        
        item.addEventListener('click', () => {
            const index = selectedServices.findIndex(s => s.id === service.id);
            if (index > -1) {
                // Deselect
                selectedServices.splice(index, 1);
                item.classList.remove('selected');
            } else {
                // Select
                selectedServices.push(service);
                item.classList.add('selected');
            }
            updateInvoiceCalculation();
            checkFormValidity();
        });
        
        servicesContainer.appendChild(item);
    });
}

// Promo Code Logic
document.getElementById('apply-promo-btn').addEventListener('click', async () => {
    const codeInput = document.getElementById('promo-input').value.trim().toUpperCase();
    const msgEl = document.getElementById('promo-message');
    
    if (!codeInput) {
        msgEl.textContent = 'Please enter a promo code.';
        msgEl.className = 'promo-message promo-error';
        return;
    }

    if (appliedPromo && appliedPromo.code === codeInput) {
        return; // Already applied
    }

    try {
        const res = await fetch(`${API_URL}/booking/promo/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: codeInput })
        });
        
        const data = await res.json();
        if (data.success) {
            appliedPromo = {
                id: data.promo_code_id,
                code: codeInput,
                discount_percentage: data.discount_percentage
            };
            msgEl.textContent = `Promo applied! ${data.discount_percentage}% off.`;
            msgEl.className = 'promo-message promo-success';
            updateInvoiceCalculation();
        } else {
            appliedPromo = null;
            msgEl.textContent = data.message || 'Invalid promo code.';
            msgEl.className = 'promo-message promo-error';
            updateInvoiceCalculation();
        }
    } catch (err) {
        msgEl.textContent = 'Error validating promo code.';
        msgEl.className = 'promo-message promo-error';
    }
});

// Calculations
function updateInvoiceCalculation() {
    summaryServicesList.innerHTML = '';
    
    if (selectedServices.length === 0) {
        summaryServicesList.innerHTML = '<div style="color: #666; font-size: 0.9em;">No services selected yet.</div>';
        invoiceTotals = { subtotal: 0, discountAmount: 0, gstAmount: 0, grandTotal: 0 };
    } else {
        let subtotal = 0;
        selectedServices.forEach(s => {
            subtotal += parseFloat(s.price);
            const div = document.createElement('div');
            div.className = 'summary-item';
            div.innerHTML = `<span>${s.name}</span> <span>₹${parseFloat(s.price).toFixed(2)}</span>`;
            summaryServicesList.appendChild(div);
        });
        
        let discountAmount = 0;
        if (appliedPromo) {
            discountAmount = subtotal * (appliedPromo.discount_percentage / 100);
            elDiscountRow.classList.remove('hidden');
            elDiscountPct.textContent = appliedPromo.discount_percentage;
            elDiscountAmount.textContent = `-₹${discountAmount.toFixed(2)}`;
        } else {
            elDiscountRow.classList.add('hidden');
        }
        
        const taxableAmount = Math.max(0, subtotal - discountAmount);
        const gstAmount = taxableAmount * 0.18; // 18% GST
        
        if (gstAmount > 0) {
            elGstRow.classList.remove('hidden');
        } else {
            elGstRow.classList.add('hidden');
        }
        
        const grandTotal = taxableAmount + gstAmount;
        
        invoiceTotals = { subtotal, discountAmount, gstAmount, grandTotal };
    }
    
    elSubtotal.textContent = `₹${invoiceTotals.subtotal.toFixed(2)}`;
    elGst.textContent = `₹${invoiceTotals.gstAmount.toFixed(2)}`;
    elTotal.textContent = `₹${invoiceTotals.grandTotal.toFixed(2)}`;
    
    checkFormValidity();
}

function checkFormValidity() {
    const form = document.getElementById('customer-form');
    const isValid = form.checkValidity() && selectedServices.length > 0;
    
    // Enable Generate PDF only if form is valid
    btnGeneratePdf.disabled = !isValid;
    // Enable Submit Booking only if form is valid and maybe PDF was generated (we can just enable if valid)
    btnSubmitBooking.disabled = !isValid;
}

function generateAndDownloadPDF(invoiceNumberStr) {
    return new Promise((resolve, reject) => {
        try {
            const custName    = document.getElementById('cust-name').value;
            const custCompany = document.getElementById('cust-company').value || '';
            const custEmail   = document.getElementById('cust-email').value;
            const custPhone   = document.getElementById('cust-phone').value;
            const today       = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

            // Use jsPDF directly — no html2canvas, no DOM capture issues
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

            const pageW  = 210; // A4 width in mm
            const pageH  = 297; // A4 height in mm
            const margin = 20;
            const contentW = pageW - margin * 2;
            let y = 0;

            // ── Background ──────────────────────────────────────────────────────────
            doc.setFillColor(17, 17, 17);
            doc.rect(0, 0, pageW, pageH, 'F');

            // ── HEADER ──────────────────────────────────────────────────────────────
            y = 20;

            // Left: Company name
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.text('VISUAL SAINT VFX', margin, y);

            // Right: INVOICE label
            doc.setFontSize(26);
            doc.setTextColor(138, 43, 226);
            doc.text('INVOICE', pageW - margin, y, { align: 'right' });

            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(170, 170, 170);
            doc.text('PRODUCTIONS', margin, y);
            doc.setFontSize(11);
            doc.setTextColor(221, 221, 221);
            doc.text(invoiceNumberStr, pageW - margin, y, { align: 'right' });

            y += 5;
            doc.setFontSize(9);
            doc.setTextColor(170, 170, 170);
            doc.text('Andhra Pradesh, India', margin, y);
            doc.text('Date: ' + today, pageW - margin, y, { align: 'right' });

            y += 5;
            doc.text('hello@visualsaintvfx.com', margin, y);

            // Purple divider line under header
            y += 6;
            doc.setDrawColor(138, 43, 226);
            doc.setLineWidth(0.8);
            doc.line(margin, y, pageW - margin, y);

            // ── BILL TO ─────────────────────────────────────────────────────────────
            y += 8;
            // Background box
            doc.setFillColor(26, 26, 46);
            doc.rect(margin, y, contentW, 30, 'F');
            // Purple left border
            doc.setFillColor(138, 43, 226);
            doc.rect(margin, y, 2, 30, 'F');

            y += 6;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(138, 43, 226);
            doc.text('BILL TO', margin + 6, y);

            y += 6;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.text(custName, margin + 6, y);

            if (custCompany) {
                y += 5;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(200, 200, 200);
                doc.text(custCompany, margin + 6, y);
            }

            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(200, 200, 200);
            doc.text(custEmail, margin + 6, y);

            y += 5;
            doc.text(custPhone, margin + 6, y);

            // ── SERVICES TABLE ───────────────────────────────────────────────────────
            y += 12;

            // Table header background
            doc.setFillColor(30, 16, 48);
            doc.rect(margin, y, contentW, 10, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(138, 43, 226);
            doc.text('#',           margin + 4,            y + 6.5);
            doc.text('DESCRIPTION', margin + 14,           y + 6.5);
            doc.text('AMOUNT',      pageW - margin - 4,    y + 6.5, { align: 'right' });

            // Bottom border of header
            doc.setDrawColor(51, 51, 51);
            doc.setLineWidth(0.3);
            y += 10;
            doc.line(margin, y, pageW - margin, y);

            // Table rows
            selectedServices.forEach((s, i) => {
                y += 9;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(230, 230, 230);
                doc.text(String(i + 1),                   margin + 4,         y);
                doc.text(s.name,                          margin + 14,        y);
                doc.text('Rs. ' + parseFloat(s.price).toFixed(2), pageW - margin - 4, y, { align: 'right' });

                doc.setDrawColor(51, 51, 51);
                doc.setLineWidth(0.2);
                doc.line(margin, y + 3, pageW - margin, y + 3);
            });

            // ── TOTALS ───────────────────────────────────────────────────────────────
            y += 12;
            const totalsX = pageW - margin - 80;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(180, 180, 180);
            doc.text('Subtotal:',              totalsX,          y);
            doc.text('Rs. ' + invoiceTotals.subtotal.toFixed(2), pageW - margin - 4, y, { align: 'right' });

            if (invoiceTotals.discountAmount > 0) {
                y += 7;
                doc.setTextColor(255, 71, 87);
                doc.text('Discount:',           totalsX,          y);
                doc.text('- Rs. ' + invoiceTotals.discountAmount.toFixed(2), pageW - margin - 4, y, { align: 'right' });
            }

            if (invoiceTotals.gstAmount > 0) {
                y += 7;
                doc.setTextColor(180, 180, 180);
                doc.text('GST (18%):',          totalsX,          y);
                doc.text('Rs. ' + invoiceTotals.gstAmount.toFixed(2), pageW - margin - 4, y, { align: 'right' });
            }

            // Total divider
            y += 4;
            doc.setDrawColor(138, 43, 226);
            doc.setLineWidth(0.6);
            doc.line(totalsX, y, pageW - margin, y);

            y += 7;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(255, 255, 255);
            doc.text('Total Amount:',         totalsX,          y);
            doc.text('Rs. ' + invoiceTotals.grandTotal.toFixed(2), pageW - margin - 4, y, { align: 'right' });

            // ── FOOTER ───────────────────────────────────────────────────────────────
            const footerY = pageH - 18;
            doc.setDrawColor(51, 51, 51);
            doc.setLineWidth(0.3);
            doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text('Thank you for choosing VisualSaint VFX.', pageW / 2, footerY, { align: 'center' });
            doc.setFontSize(8);
            doc.setTextColor(85, 85, 85);
            doc.text('www.visualsaintvfx.com', pageW / 2, footerY + 5, { align: 'center' });

            doc.save(`${invoiceNumberStr}.pdf`);
            resolve();
        } catch (err) {
            console.error('PDF Generation Error:', err);
            reject(err);
        }
    });
}

// PDF Preview
btnGeneratePdf.addEventListener('click', () => {
    btnGeneratePdf.textContent = 'Generating Preview...';
    // Use a temporary invoice number for preview
    const tempInv = `VS-INV-PREVIEW-${Math.floor(1000 + Math.random() * 9000)}`;
    generateAndDownloadPDF(tempInv).then(() => {
        btnGeneratePdf.textContent = 'Preview Invoice (PDF)';
    }).catch(() => {
        btnGeneratePdf.textContent = 'Preview Invoice (PDF)';
        alert('Failed to generate preview. Please try again.');
    });
});

// Submit Booking
btnSubmitBooking.addEventListener('click', async () => {
    btnSubmitBooking.disabled = true;
    btnSubmitBooking.textContent = 'Submitting...';
    const statusEl = document.getElementById('booking-status');
    statusEl.innerHTML = '';

    const payload = {
        customer_name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        email: document.getElementById('cust-email').value,
        company_name: document.getElementById('cust-company').value,
        services: selectedServices,
        promo_code_id: appliedPromo ? appliedPromo.id : null,
        discount_percentage: appliedPromo ? appliedPromo.discount_percentage : 0,
        subtotal: invoiceTotals.subtotal,
        discount_amount: invoiceTotals.discountAmount,
        gst_amount: invoiceTotals.gstAmount,
        final_amount: invoiceTotals.grandTotal
    };

    try {
        const res = await fetch(`${API_URL}/booking/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (data.success) {
            statusEl.innerHTML = `<span style="color: #2ecc71;">Booking Submitted! Generating Official Invoice...</span>`;
            
            try {
                // Generate PDF using the OFFICIAL invoice number from the backend
                await generateAndDownloadPDF(data.invoice_number);
                statusEl.innerHTML = `<span style="color: #2ecc71;">Booking Complete! Official Invoice (${data.invoice_number}) downloaded.</span>`;
            } catch(e) {
                statusEl.innerHTML = `<span style="color: #e74c3c;">Booking Submitted, but PDF generation failed.</span>`;
            }

            // Reset form after successful submission
            document.getElementById('customer-form').reset();
            selectedServices = [];
            appliedPromo = null;
            document.getElementById('promo-input').value = '';
            document.getElementById('promo-message').textContent = '';
            
            // visually deselect items
            document.querySelectorAll('.service-item').forEach(el => el.classList.remove('selected'));
            
            updateInvoiceCalculation();
        } else {
            statusEl.innerHTML = `<span style="color: #e74c3c;">Submission Failed: ${data.message}</span>`;
            btnSubmitBooking.disabled = false;
        }
    } catch (err) {
        statusEl.innerHTML = `<span style="color: #e74c3c;">Network Error. Please try again later.</span>`;
        btnSubmitBooking.disabled = false;
    } finally {
        btnSubmitBooking.textContent = 'Submit Booking';
    }
});
