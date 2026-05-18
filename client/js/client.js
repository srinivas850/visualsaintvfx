const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const API_URL = isLocal ? 'http://localhost:5000/api' : 'https://visualsaintvfx.onrender.com/api';
const BASE_URL = isLocal ? 'http://localhost:5000' : 'https://visualsaintvfx.onrender.com';

// State
let token = localStorage.getItem('clientToken');
let currentGallery = [];

// DOM Elements
const gallerySection = document.getElementById('gallery-section');
const logoutBtn = document.getElementById('logout-btn');
const mediaGrid = document.getElementById('media-grid');

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxDownload = document.getElementById('lightbox-download');
const closeLightboxBtn = document.querySelector('.close-lightbox');

// ── Keep-Alive Ping ───────────────────────────────────────────────────────────
async function wakeUpServer() {
    try {
        await fetch(`${BASE_URL}/health`, { method: 'GET' });
        console.log('[Server] Backend is awake.');
    } catch (e) {
        console.warn('[Server] Could not reach backend yet...', e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    await wakeUpServer();
    showGallery();
});


function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showGallery() {
    const clientName = localStorage.getItem('clientName');
    if(clientName) {
        document.getElementById('welcome-name').textContent = clientName;
    }
    
    loadGalleryData();
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientName');
    token = null;
    window.location.href = '../login.html';
});

async function loadGalleryData() {
    try {
        const res = await fetch(`${API_URL}/client/gallery`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.status === 401 || res.status === 403) {
            logoutBtn.click();
            return;
        }

        const data = await res.json();
        if (data.success) {
            currentGallery = data.files;
            renderGallery();
        }
    } catch (err) {
        console.error('Failed to load gallery', err);
        showToast('Network error. Reconnecting to server...', 'error');
    }
}

function renderGallery() {
    mediaGrid.innerHTML = '';
    const fileCount = document.getElementById('file-count');
    const emptyState = document.getElementById('empty-state');
    
    fileCount.textContent = `${currentGallery.length} items`;
    
    if(currentGallery.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');

    currentGallery.forEach((file, index) => {
        const isVideo = file.file_type.startsWith('video');
        const mediaElement = document.createElement('div');
        mediaElement.className = 'media-item';
        
        // Add auto download attachment to cloudinary URL
        // Replace /upload/ with /upload/fl_attachment/ to force download on cloudinary
        const downloadUrl = file.secure_url.replace('/upload/', '/upload/fl_attachment/');

        mediaElement.innerHTML = `
            ${isVideo 
                ? `<video src="${file.secure_url}#t=0.1" preload="metadata"></video><div class="media-type-icon">▶</div>`
                : `<img src="${file.secure_url}" alt="Gallery Image" loading="lazy">`
            }
            <div class="media-overlay">
                <div class="media-actions">
                    <span style="font-size: 0.8rem; opacity: 0.8;">${new Date(file.upload_date).toLocaleDateString()}</span>
                    <a href="${downloadUrl}" class="download-icon" download="${file.original_filename}" title="Download" onclick="event.stopPropagation()">
                        ↓
                    </a>
                </div>
            </div>
        `;
        
        // Open lightbox on click
        mediaElement.addEventListener('click', () => openLightbox(file, downloadUrl));
        
        mediaGrid.appendChild(mediaElement);
    });
}

function openLightbox(file, downloadUrl) {
    const isVideo = file.file_type.startsWith('video');
    
    if(isVideo) {
        lightboxImg.classList.add('hidden');
        lightboxVideo.classList.remove('hidden');
        lightboxVideo.src = file.secure_url;
        lightboxVideo.play();
    } else {
        lightboxVideo.classList.add('hidden');
        lightboxImg.classList.remove('hidden');
        lightboxImg.src = file.secure_url;
    }
    
    // Set download button
    lightboxDownload.onclick = () => {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = file.original_filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    lightbox.classList.remove('hidden');
}

function closeLightbox() {
    lightbox.classList.add('hidden');
    lightboxVideo.pause();
    lightboxVideo.src = '';
    lightboxImg.src = '';
}

closeLightboxBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    if(e.target === lightbox) closeLightbox();
});

// Download All
document.getElementById('download-all-btn').addEventListener('click', () => {
    if(currentGallery.length === 0) {
        showToast('No files to download');
        return;
    }
    
    showToast(`Starting download of ${currentGallery.length} files...`);
    
    currentGallery.forEach((file, index) => {
        setTimeout(() => {
            const downloadUrl = file.secure_url.replace('/upload/', '/upload/fl_attachment/');
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = file.original_filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, index * 800); // Stagger downloads slightly
    });
});
