const API_URL = 'https://visualsaintvfx.onrender.com/api';

// State
let token = localStorage.getItem('adminToken');
let filesToUpload = [];

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const navLinks = document.querySelectorAll('.nav-links li');
const viewSections = document.querySelectorAll('.view-section');
const logoutBtn = document.getElementById('logout-btn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
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
    
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('adminToken');
        token = null;
        window.location.href = '../login.html';
        throw new Error('Unauthorized');
    }
    
    return res.json();
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
const filePreview = document.getElementById('file-list-preview');
const uploadBtn = document.getElementById('btn-upload');

dropZone.addEventListener('click', () => fileInput.click());

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

function handleFiles(files) {
    filesToUpload = Array.from(files);
    filePreview.innerHTML = '';
    
    filesToUpload.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.textContent = file.name;
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

    const formData = new FormData();
    formData.append('client_id', clientId);
    filesToUpload.forEach(file => {
        formData.append('files', file);
    });

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    progressContainer.classList.remove('hidden');
    uploadBtn.disabled = true;
    progressBar.style.width = '30%'; // Fake initial progress since fetch doesn't support upload progress out of box easily

    try {
        const res = await fetch(`${API_URL}/admin/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        progressBar.style.width = '90%';
        const data = await res.json();
        progressBar.style.width = '100%';
        
        if (data.success) {
            showToast(`Successfully uploaded ${data.files.length} files`);
            filesToUpload = [];
            filePreview.innerHTML = '';
            fileInput.value = '';
            uploadBtn.disabled = true;
            document.getElementById('select-client').value = '';
        } else {
            showToast(data.message || 'Upload failed', 'error');
        }
    } catch (err) {
        showToast('Upload error', 'error');
    } finally {
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
            uploadBtn.disabled = filesToUpload.length === 0;
        }, 1500);
    }
});
