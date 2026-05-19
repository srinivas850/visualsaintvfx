const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const BASE_URL = (isLocal && window.location.port !== '5000') ? 'http://localhost:5000' : window.location.origin;
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
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Chunk upload failed');
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
