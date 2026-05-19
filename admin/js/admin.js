// ── API URL Resolution ────────────────────────────────────────────────────────
// Backend is always on Render. Frontend may be on Vercel (visualsaintvfx.com),
// Render static (visualsaintvfx.onrender.com), or localhost during dev.
const isLocal = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.protocol === 'file:'
);
const BACKEND_URL = isLocal
  ? 'http://localhost:5000'
  : 'https://visualsaintvfx.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

// ── State ─────────────────────────────────────────────────────────────────────
let token = localStorage.getItem('adminToken');
let filesToUpload = [];

// ── DOM Elements ──────────────────────────────────────────────────────────────
const navLinks    = document.querySelectorAll('.nav-links li');
const viewSections = document.querySelectorAll('.view-section');
const logoutBtn   = document.getElementById('logout-btn');

// ── Server Wake-Up (Render free-tier cold start) ──────────────────────────────
async function wakeUpServer() {
    const MAX_RETRIES = 12;
    let retries = MAX_RETRIES;
    while (retries > 0) {
        try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal });
            clearTimeout(tid);
            if (res.ok) {
                console.log('[Server] Backend is awake.');
                return true;
            }
        } catch (e) {
            console.warn(`[Server] Waking up... (${retries} retries left)`);
        }
        retries--;
        if (retries > 0) await new Promise(r => setTimeout(r, 5000));
    }
    return false;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    await wakeUpServer();
    loadDashboardData();
});

// ── Toast Notifications ───────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(120%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Navigation ────────────────────────────────────────────────────────────────
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const target = link.getAttribute('data-target');
        viewSections.forEach(v => {
            if (v.id === `view-${target}`) {
                v.classList.remove('hidden');
                v.classList.add('active');
            } else {
                v.classList.add('hidden');
                v.classList.remove('active');
            }
        });

        if (target === 'overview') loadDashboardData();
        if (target === 'clients')  loadClientsData();
        if (target === 'upload')   loadClientsForUpload();
    });
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    token = null;
    window.location.href = '../login.html';
});

// ── Authenticated Fetch Helper ────────────────────────────────────────────────
async function authFetch(endpoint, options = {}) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    try {
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        if (res.status === 401 || res.status === 403) {
            console.warn('[Auth] Token rejected — redirecting to login');
            localStorage.removeItem('adminToken');
            token = null;
            window.location.href = '../login.html';
            throw new Error('Unauthorized');
        }

        const data = await res.json();
        if (!res.ok && !data.success) {
            // Surface the server's own error message in the toast
            throw new Error(data.message || `HTTP ${res.status}`);
        }
        return data;
    } catch (error) {
        if (error.message === 'Unauthorized') throw error;
        console.error('[Fetch] Error:', error.message);
        showToast(error.message || 'Network error. Is the server awake?', 'error');
        return { success: false, message: error.message };
    }
}

// ── Dashboard Overview ────────────────────────────────────────────────────────
async function loadDashboardData() {
    try {
        const data = await authFetch('/admin/stats');
        if (!data.success) return;

        document.getElementById('stat-total-clients').textContent = data.stats.totalClients;
        document.getElementById('stat-total-uploads').textContent = data.stats.totalUploads;

        const recentList = document.getElementById('recent-activity-list');
        recentList.innerHTML = '';
        if (data.stats.recentUploads.length === 0) {
            recentList.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.4)">No uploads yet</td></tr>';
            return;
        }
        data.stats.recentUploads.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.client_name || '—'}</td>
                <td>${item.original_filename || '—'}</td>
                <td>${(item.file_type || '').split('/')[0] || '—'}</td>
                <td>${new Date(item.upload_date).toLocaleDateString()}</td>
            `;
            recentList.appendChild(tr);
        });
    } catch (err) {
        console.error('[Dashboard] Failed to load stats:', err);
    }
}

// ── Client Management ─────────────────────────────────────────────────────────
async function loadClientsData() {
    try {
        const data = await authFetch('/admin/clients');
        if (!data.success) return;

        const tbody = document.getElementById('clients-list');
        tbody.innerHTML = '';

        if (data.clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.4)">No clients yet</td></tr>';
            return;
        }
        data.clients.forEach(client => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${client.client_id}</td>
                <td>${client.name}</td>
                <td>${new Date(client.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteClient(${client.id}, this)">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('[Clients] Failed to load:', err);
    }
}

// Add Client Modal
const modal = document.getElementById('add-client-modal');
document.getElementById('open-add-client-modal').onclick = () => modal.classList.remove('hidden');
document.querySelector('.close-modal').onclick = () => modal.classList.add('hidden');
window.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };

document.getElementById('add-client-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const name      = document.getElementById('new-client-name').value.trim();
    const client_id = document.getElementById('new-client-id').value.trim();
    const password  = document.getElementById('new-client-password').value;

    if (!name || !client_id || !password) {
        showToast('All fields are required', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating...';
    try {
        const data = await authFetch('/admin/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, client_id, password }),
        });
        if (data.success) {
            showToast('Client created successfully');
            modal.classList.add('hidden');
            e.target.reset();
            loadClientsData();
        } else {
            showToast(data.message || 'Failed to create client', 'error');
        }
    } catch (err) {
        showToast('Error creating client', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Client Account';
    }
});

window.deleteClient = async (id, btnEl) => {
    if (!confirm('Are you sure? This will delete the client AND all their uploaded files permanently.')) return;

    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Deleting...'; }
    try {
        const data = await authFetch(`/admin/clients/${id}`, { method: 'DELETE' });
        if (data.success) {
            showToast(data.message || 'Client deleted');
            loadClientsData();
        } else {
            showToast(data.message || 'Failed to delete client', 'error');
            if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Delete'; }
        }
    } catch (err) {
        showToast('Error deleting client', 'error');
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Delete'; }
    }
};

// ── Upload View ───────────────────────────────────────────────────────────────
async function loadClientsForUpload() {
    try {
        const data = await authFetch('/admin/clients');
        if (!data.success) return;
        const select = document.getElementById('select-client');
        select.innerHTML = '<option value="">-- Choose a Client --</option>';
        data.clients.forEach(client => {
            const opt = document.createElement('option');
            opt.value = client.id;
            opt.textContent = `${client.name} (${client.client_id})`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('[Upload] Failed to load clients:', err);
    }
}

const dropZone   = document.getElementById('drop-zone');
const fileInput  = document.getElementById('file-input');
const folderInput = document.getElementById('folder-input');
const filePreview = document.getElementById('file-list-preview');
const uploadBtn  = document.getElementById('btn-upload');

dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change',   () => { if (fileInput.files.length)   handleFiles(fileInput.files); });
folderInput.addEventListener('change', () => { if (folderInput.files.length) handleFiles(folderInput.files); });

function handleFiles(files) {
    const validFiles = Array.from(files).filter(f =>
        !f.name.startsWith('.') && f.name !== 'Thumbs.db' && f.size > 0
    );
    if (validFiles.length === 0) return;

    filesToUpload = [...filesToUpload, ...validFiles];
    renderFilePreview();
}

function renderFilePreview() {
    filePreview.innerHTML = '';
    filesToUpload.forEach((file, idx) => {
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

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '✕';
        removeBtn.title = 'Remove file';
        removeBtn.style.cssText = 'position:absolute;top:4px;right:4px;background:rgba(255,50,50,0.8);border:none;color:#fff;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:10px;';
        removeBtn.onclick = () => {
            filesToUpload.splice(idx, 1);
            renderFilePreview();
            uploadBtn.disabled = filesToUpload.length === 0;
        };
        div.style.position = 'relative';
        div.appendChild(removeBtn);

        filePreview.appendChild(div);
    });
    uploadBtn.disabled = filesToUpload.length === 0;
}

document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const clientId = document.getElementById('select-client').value;

    if (!clientId) {
        showToast('Please select a client', 'error');
        return;
    }
    if (filesToUpload.length === 0) {
        showToast('Please select at least one file', 'error');
        return;
    }

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    progressContainer.classList.remove('hidden');
    uploadBtn.disabled = true;
    progressBar.style.width = '5%';

    try {
        showToast('Connecting to server...', 'success');
        const isAwake = await wakeUpServer();
        if (!isAwake) throw new Error('Server is not responding. Please try again in a minute.');
        progressBar.style.width = '10%';

        // Upload in chunks of 2 files to avoid timeouts on Render's free tier
        const CHUNK_SIZE = 2;
        const totalChunks = Math.ceil(filesToUpload.length / CHUNK_SIZE);
        let uploadedCount = 0;

        for (let i = 0; i < totalChunks; i++) {
            const chunk = filesToUpload.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const formData = new FormData();
            formData.append('client_id', clientId);
            chunk.forEach(file => formData.append('files', file));

            const res = await fetch(`${API_URL}/admin/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                // Do NOT set Content-Type — let the browser set multipart boundary
                body: formData,
            });

            let data;
            try { data = await res.json(); } catch { data = {}; }

            if (!res.ok || !data.success) {
                throw new Error(data.message || `Upload chunk ${i + 1} failed (HTTP ${res.status})`);
            }

            uploadedCount += (data.files || chunk).length;
            progressBar.style.width = `${10 + ((i + 1) / totalChunks) * 85}%`;
        }

        progressBar.style.width = '100%';
        showToast(`✅ Successfully uploaded ${uploadedCount} file(s)!`, 'success');

        // Reset state
        filesToUpload = [];
        filePreview.innerHTML = '';
        fileInput.value = '';
        folderInput.value = '';
        document.getElementById('select-client').value = '';

    } catch (err) {
        console.error('[Upload] Error:', err);
        showToast(err.message || 'Upload failed. Check your connection.', 'error');
    } finally {
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
            uploadBtn.disabled = filesToUpload.length === 0;
        }, 2000);
    }
});
