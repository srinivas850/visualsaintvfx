const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const BASE_URL = isLocal ? 'http://localhost:5000' : 'https://visualsaintvfx.onrender.com';
const API_URL = `${BASE_URL}/api`;

// State
let token = localStorage.getItem('adminToken');
let filesToUpload = [];

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const navLinks = document.querySelectorAll('.nav-links li');
const viewSections = document.querySelectorAll('.view-section');
const logoutBtn = document.getElementById('logout-btn');

// ── Keep-Alive Ping ───────────────────────────────────────────────────────────
// Wakes up the Render free-tier backend when the admin panel is opened.
// Render cold starts can take 50+ seconds.
async function wakeUpServer() {
    let retries = 12; // 12 * 5s = 60s
    while (retries > 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); 
            const res = await fetch(`${BASE_URL}/health`, { method: 'GET', signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                console.log('[Server] Backend is awake.');
                return true;
            }
        } catch (e) {
            console.warn(`[Server] Waking up backend... (${retries} retries left)`);
        }
        retries--;
        if (retries > 0) await new Promise(resolve => setTimeout(resolve, 5000));
    }
    return false;
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    await wakeUpServer();
    loadDashboardData();
});


// Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(120%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// UI Navigation
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Update active nav
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Update active view
        const target = link.getAttribute('data-target');
        viewSections.forEach(v => {
            if(v.id === `view-${target}`) {
                v.classList.remove('hidden');
                v.classList.add('active');
            } else {
                v.classList.add('hidden');
                v.classList.remove('active');
            }
        });

        // Load specific data based on view
        if(target === 'overview') loadDashboardData();
        if(target === 'clients') loadClientsData();
        if(target === 'upload') loadClientsForUpload();
        if(target === 'services') loadServicesData();
        if(target === 'promo-codes') loadPromoCodesData();
        if(target === 'bookings') loadBookingsData();
    });
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    token = null;
    window.location.href = '../login.html';
});

// Fetch Data Helper
async function authFetch(endpoint, options = {}) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    try {
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('adminToken');
            token = null;
            window.location.href = '../login.html';
            throw new Error('Unauthorized');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Fetch error:', error);
        if (error.message === 'Unauthorized') throw error;
        showToast('Network error. Reconnecting to server...', 'error');
        return { success: false, message: 'Network error or backend sleeping' };
    }
}

// Dashboard Overview
async function loadDashboardData() {
    try {
        const data = await authFetch('/admin/stats');
        if (data.success) {
            document.getElementById('stat-total-clients').textContent = data.stats.totalClients;
            document.getElementById('stat-total-uploads').textContent = data.stats.totalUploads;
            document.getElementById('stat-total-bookings').textContent = data.stats.totalBookings || 0;
            
            const recentList = document.getElementById('recent-activity-list');
            recentList.innerHTML = '';
            
            data.stats.recentUploads.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.client_name}</td>
                    <td>${item.original_filename}</td>
                    <td>${item.file_type.split('/')[0]}</td>
                    <td>${new Date(item.upload_date).toLocaleDateString()}</td>
                `;
                recentList.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Failed to load stats', err);
    }
}

// Client Management
async function loadClientsData() {
    try {
        const data = await authFetch('/admin/clients');
        if (data.success) {
            const tbody = document.getElementById('clients-list');
            tbody.innerHTML = '';
            
            data.clients.forEach(client => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${client.client_id}</td>
                    <td>${client.name}</td>
                    <td>${new Date(client.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteClient(${client.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Failed to load clients', err);
    }
}

// Add Client Modal Logic
const modal = document.getElementById('add-client-modal');
document.getElementById('open-add-client-modal').onclick = () => {
    modal.classList.remove('hidden');
}
document.querySelector('.close-modal').onclick = () => {
    modal.classList.add('hidden');
}
window.onclick = (e) => {
    if (e.target === modal) modal.classList.add('hidden');
}

document.getElementById('add-client-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-client-name').value;
    const client_id = document.getElementById('new-client-id').value;
    const password = document.getElementById('new-client-password').value;

    try {
        const data = await authFetch('/admin/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, client_id, password })
        });
        
        if (data.success) {
            showToast('Client created successfully');
            modal.classList.add('hidden');
            document.getElementById('add-client-form').reset();
            loadClientsData();
        } else {
            showToast(data.message || 'Failed to create client', 'error');
        }
    } catch (err) {
        showToast('Error creating client', 'error');
    }
});

window.deleteClient = async (id) => {
    if(confirm('Are you sure? This will delete the client and ALL their uploaded files permanently.')) {
        try {
            const data = await authFetch(`/admin/clients/${id}`, { method: 'DELETE' });
            if(data.success) {
                showToast('Client deleted');
                loadClientsData();
            } else {
                showToast(data.message, 'error');
            }
        } catch(err) {
            showToast('Error deleting client', 'error');
        }
    }
}

// Upload Media logic
async function loadClientsForUpload() {
    try {
        const data = await authFetch('/admin/clients');
        if (data.success) {
            const select = document.getElementById('select-client');
            select.innerHTML = '<option value="">-- Choose a Client --</option>';
            data.clients.forEach(client => {
                const opt = document.createElement('option');
                opt.value = client.id;
                opt.textContent = `${client.name} (${client.client_id})`;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Failed to load clients for upload', err);
    }
}

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const folderInput = document.getElementById('folder-input');
const filePreview = document.getElementById('file-list-preview');
const uploadBtn = document.getElementById('btn-upload');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
    }
});
fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFiles(fileInput.files);
    }
});
folderInput.addEventListener('change', () => {
    if (folderInput.files.length) {
        handleFiles(folderInput.files);
    }
});

function handleFiles(files) {
    // Filter out hidden system files that might cause backend errors
    const validFiles = Array.from(files).filter(f => !f.name.startsWith('.DS_Store') && f.name !== 'Thumbs.db');
    
    if (validFiles.length === 0) return;
    
    filesToUpload = [...filesToUpload, ...validFiles];
    filePreview.innerHTML = '';
    
    filesToUpload.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            div.appendChild(img);
        }
        
        const span = document.createElement('span');
        span.textContent = file.name;
        div.appendChild(span);
        
        filePreview.appendChild(div);
    });
    
    uploadBtn.disabled = filesToUpload.length === 0;
}

document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const clientId = document.getElementById('select-client').value;
    
    if(!clientId || filesToUpload.length === 0) {
        showToast('Please select client and files', 'error');
        return;
    }

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    progressContainer.classList.remove('hidden');
    uploadBtn.disabled = true;
    progressBar.style.width = '5%'; 

    try {
        showToast('Connecting to server (may take 50s if asleep)...', 'success');
        const isAwake = await wakeUpServer(); 
        if (!isAwake) {
            throw new Error('Server took too long to wake up. Please try again.');
        }
        progressBar.style.width = '10%';

        // CHUNK UPLOADS to prevent backend timeout! (Render timeout is 30-60s)
        const CHUNK_SIZE = 2; // Upload 2 files at a time
        const totalChunks = Math.ceil(filesToUpload.length / CHUNK_SIZE);
        let uploadedCount = 0;

        for (let i = 0; i < totalChunks; i++) {
            const chunkFiles = filesToUpload.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const formData = new FormData();
            formData.append('client_id', clientId);
            
            chunkFiles.forEach(file => {
                formData.append('files', file);
            });

            const res = await fetch(`${API_URL}/admin/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                let errMsg = 'Chunk upload failed';
                try {
                    const errData = await res.json();
                    errMsg = errData.message || errMsg;
                } catch (parseErr) {
                    errMsg = `Server error ${res.status}`;
                }
                throw new Error(errMsg);
            }

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || 'Chunk upload failed');
            }
            
            uploadedCount += data.files ? data.files.length : chunkFiles.length;
            const progress = 10 + ((i + 1) / totalChunks) * 85;
            progressBar.style.width = `${progress}%`;
        }

        progressBar.style.width = '100%';
        
        showToast(`Successfully uploaded ${uploadedCount} files!`, 'success');
        filesToUpload = [];
        filePreview.innerHTML = '';
        fileInput.value = '';
        folderInput.value = ''; // clear folder input too
        document.getElementById('select-client').value = '';
        
    } catch (err) {
        console.error('Upload error:', err);
        const errMsg = err.message || 'Upload failed. Check your connection or file limits.';
        showToast(errMsg, 'error');
    } finally {
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
            uploadBtn.disabled = filesToUpload.length === 0;
        }, 2000);
    }
});

// ── SERVICES MANAGEMENT ──────────────────────────────────────────────
async function loadServicesData() {
    try {
        const data = await authFetch('/admin/services');
        if (data.success) {
            const tbody = document.getElementById('services-list');
            tbody.innerHTML = '';
            
            data.services.forEach(service => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${service.id}</td>
                    <td>${service.name}</td>
                    <td>₹${parseFloat(service.price).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteService(${service.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Failed to load services', err);
    }
}

const serviceModal = document.getElementById('add-service-modal');
document.getElementById('open-add-service-modal').onclick = () => serviceModal.classList.remove('hidden');
serviceModal.querySelector('.close-modal').onclick = () => serviceModal.classList.add('hidden');
window.addEventListener('click', (e) => { if (e.target === serviceModal) serviceModal.classList.add('hidden'); });

document.getElementById('add-service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-service-name').value;
    const price = document.getElementById('new-service-price').value;

    try {
        const data = await authFetch('/admin/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price })
        });
        
        if (data.success) {
            showToast('Service added successfully');
            serviceModal.classList.add('hidden');
            document.getElementById('add-service-form').reset();
            loadServicesData();
        } else {
            showToast(data.message || 'Failed to add service', 'error');
        }
    } catch (err) {
        showToast('Error adding service', 'error');
    }
});

window.deleteService = async (id) => {
    if(confirm('Are you sure you want to delete this service?')) {
        try {
            const data = await authFetch(`/admin/services/${id}`, { method: 'DELETE' });
            if(data.success) {
                showToast('Service deleted');
                loadServicesData();
            } else {
                showToast(data.message, 'error');
            }
        } catch(err) {
            showToast('Error deleting service', 'error');
        }
    }
};

// ── PROMO CODES MANAGEMENT ───────────────────────────────────────────
async function loadPromoCodesData() {
    try {
        const data = await authFetch('/admin/promo-codes');
        if (data.success) {
            const tbody = document.getElementById('promo-codes-list');
            tbody.innerHTML = '';
            
            data.promo_codes.forEach(promo => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${promo.code}</strong></td>
                    <td>${promo.discount_percentage}%</td>
                    <td>${promo.expiry_date ? new Date(promo.expiry_date).toLocaleDateString() : 'Never'}</td>
                    <td>${promo.used_count} / ${promo.usage_limit || '∞'}</td>
                    <td>
                        <span style="color: ${promo.is_active ? 'green' : 'red'}">${promo.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="togglePromo(${promo.id}, ${!promo.is_active})">${promo.is_active ? 'Disable' : 'Enable'}</button>
                        <button class="btn btn-danger btn-sm" onclick="deletePromo(${promo.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Failed to load promo codes', err);
    }
}

const promoModal = document.getElementById('add-promo-modal');
document.getElementById('open-add-promo-modal').onclick = () => promoModal.classList.remove('hidden');
promoModal.querySelector('.close-modal').onclick = () => promoModal.classList.add('hidden');
window.addEventListener('click', (e) => { if (e.target === promoModal) promoModal.classList.add('hidden'); });

document.getElementById('add-promo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('new-promo-code').value;
    const discount_percentage = document.getElementById('new-promo-discount').value;
    const expiry_date = document.getElementById('new-promo-expiry').value;
    const usage_limit = document.getElementById('new-promo-limit').value;

    try {
        const data = await authFetch('/admin/promo-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                code, 
                discount_percentage, 
                expiry_date: expiry_date || null, 
                usage_limit: usage_limit || null,
                is_active: true
            })
        });
        
        if (data.success) {
            showToast('Promo code added successfully');
            promoModal.classList.add('hidden');
            document.getElementById('add-promo-form').reset();
            loadPromoCodesData();
        } else {
            showToast(data.message || 'Failed to add promo code', 'error');
        }
    } catch (err) {
        showToast('Error adding promo code', 'error');
    }
});

window.togglePromo = async (id, is_active) => {
    try {
        const data = await authFetch(`/admin/promo-codes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active })
        });
        if(data.success) {
            showToast(`Promo code ${is_active ? 'enabled' : 'disabled'}`);
            loadPromoCodesData();
        } else {
            showToast(data.message, 'error');
        }
    } catch(err) {
        showToast('Error updating promo code', 'error');
    }
};

window.deletePromo = async (id) => {
    if(confirm('Are you sure you want to delete this promo code?')) {
        try {
            const data = await authFetch(`/admin/promo-codes/${id}`, { method: 'DELETE' });
            if(data.success) {
                showToast('Promo code deleted');
                loadPromoCodesData();
            } else {
                showToast(data.message, 'error');
            }
        } catch(err) {
            showToast('Error deleting promo code', 'error');
        }
    }
};

// ── BOOKINGS MANAGEMENT ──────────────────────────────────────────────
async function loadBookingsData() {
    try {
        const data = await authFetch('/admin/bookings');
        if (data.success) {
            const tbody = document.getElementById('bookings-list');
            tbody.innerHTML = '';
            
            data.bookings.forEach(booking => {
                let servicesArr = [];
                try {
                    servicesArr = typeof booking.services === 'string' ? JSON.parse(booking.services) : booking.services;
                } catch(e) {
                    servicesArr = [];
                }
                if (!Array.isArray(servicesArr)) servicesArr = [];

                const serviceDetailsList = servicesArr.map(s => `- ${s.name}: Rs. ${parseFloat(s.price).toFixed(2)}`).join('\\n');

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${booking.invoice_number}</td>
                    <td>${booking.customer_name}</td>
                    <td>${booking.phone}</td>
                    <td>${new Date(booking.created_at).toLocaleDateString()}</td>
                    <td>₹${parseFloat(booking.final_amount).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="alert('Booked Services:\\n${serviceDetailsList.replace(/'/g, "\\'")}')">Details</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteBooking(${booking.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Failed to load bookings', err);
    }
}

window.deleteBooking = async (id) => {
    if(confirm('Are you sure you want to delete this booking?')) {
        try {
            const data = await authFetch(`/admin/bookings/${id}`, { method: 'DELETE' });
            if(data.success) {
                showToast('Booking deleted');
                loadBookingsData();
            } else {
                showToast(data.message, 'error');
            }
        } catch(err) {
            showToast('Error deleting booking', 'error');
        }
    }
};

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
