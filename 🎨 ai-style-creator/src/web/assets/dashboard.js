/**
 * DressForPleasure AI Style Creator - Dashboard JavaScript
 * ========================================================
 * 
 * Frontend logic for the web-based review dashboard
 * 
 * Author: DressForPleasure Dev Team
 * Version: 1.0.0
 */

// Global Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:8001/api',
    REFRESH_INTERVAL: 30000, // 30 seconds
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp']
};

// Global State
let currentSection = 'dashboard';
let refreshInterval = null;
let activeUploads = new Map();
let reviews = [];
let notifications = [];

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 AI Style Creator Dashboard wird initialisiert...');
    
    initializeNavigation();
    initializeEventListeners();
    initializeAutoRefresh();
    loadInitialData();
    
    console.log('✅ Dashboard erfolgreich initialisiert');
});

// ============================================================================
// Navigation
// ============================================================================

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const sectionName = href.substring(1);
                switchSection(sectionName);
            }
        });
    });
}

function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        currentSection = sectionName;
        
        // Update navigation
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.getElementById(`nav-${sectionName}`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Load section-specific data
        loadSectionData(sectionName);
    }
}

function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'reviews':
            loadReviews();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'batch':
            loadBatchJobs();
            break;
    }
}

// ============================================================================
// Event Listeners
// ============================================================================

function initializeEventListeners() {
    // Upload form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleSingleUpload);
    }
    
    // Batch upload form
    const batchForm = document.getElementById('batch-upload-form');
    if (batchForm) {
        batchForm.addEventListener('submit', handleBatchUpload);
    }
    
    // File input change
    const fileInput = document.getElementById('image-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }
    
    // Batch file input change
    const batchFileInput = document.getElementById('batch-files');
    if (batchFileInput) {
        batchFileInput.addEventListener('change', handleBatchFileSelection);
    }
}

// ============================================================================
// Data Loading
// ============================================================================

async function loadInitialData() {
    try {
        await Promise.all([
            checkSystemHealth(),
            loadDashboardStats(),
            loadNotifications()
        ]);
    } catch (error) {
        console.error('❌ Fehler beim Laden der initialen Daten:', error);
        showNotification('Fehler beim Laden der Daten', 'error');
    }
}

async function checkSystemHealth() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/health`);
        const health = await response.json();
        
        updateSystemStatus(health.status === 'healthy');
        
    } catch (error) {
        console.error('❌ System Health Check fehlgeschlagen:', error);
        updateSystemStatus(false);
    }
}

function updateSystemStatus(isHealthy) {
    const statusElement = document.getElementById('system-status');
    const statusIcon = statusElement.previousElementSibling;
    
    if (isHealthy) {
        statusElement.textContent = 'System OK';
        statusIcon.className = 'bi bi-circle-fill text-success me-1';
    } else {
        statusElement.textContent = 'System Error';
        statusIcon.className = 'bi bi-circle-fill text-danger me-1';
    }
}

async function loadDashboardData() {
    try {
        await Promise.all([
            loadDashboardStats(),
            loadRecentReviews()
        ]);
    } catch (error) {
        console.error('❌ Dashboard-Daten laden fehlgeschlagen:', error);
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/analytics/stats`);
        const data = await response.json();
        
        if (data.success) {
            updateStatsCards(data.stats);
        }
        
    } catch (error) {
        console.error('❌ Stats laden fehlgeschlagen:', error);
    }
}

function updateStatsCards(stats) {
    document.getElementById('stats-pending').textContent = stats.reviews.pending || 0;
    document.getElementById('stats-approved').textContent = stats.reviews.approved || 0;
    document.getElementById('stats-quality').textContent = `${stats.reviews.avgQualityScore || 0}%`;
    document.getElementById('stats-jobs').textContent = stats.processing.activeJobs || 0;
    
    // Update pending count badge
    const pendingCount = document.getElementById('pending-count');
    if (pendingCount) {
        pendingCount.textContent = stats.reviews.pending || 0;
        pendingCount.style.display = stats.reviews.pending > 0 ? 'inline' : 'none';
    }
}

async function loadRecentReviews() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/reviews?limit=10`);
        const data = await response.json();
        
        if (data.success) {
            displayRecentReviews(data.reviews);
        }
        
    } catch (error) {
        console.error('❌ Recent Reviews laden fehlgeschlagen:', error);
        displayRecentReviews([]);
    }
}

function displayRecentReviews(reviewList) {
    const tableBody = document.getElementById('recent-reviews-table');
    
    if (reviewList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Keine Reviews vorhanden</td></tr>';
        return;
    }
    
    tableBody.innerHTML = reviewList.map(review => `
        <tr onclick="showReviewDetails('${review.id}')" style="cursor: pointer;">
            <td>
                <div class="d-flex align-items-center">
                    <i class="bi bi-image me-2"></i>
                    ${review.filename || 'Unbekannt'}
                </div>
            </td>
            <td>
                <span class="badge status-${review.status}">
                    ${getStatusText(review.status)}
                </span>
            </td>
            <td>${review.settings?.style || 'Standard'}</td>
            <td>
                <span class="quality-score ${getQualityClass(review.qualityScore)}">
                    <i class="bi bi-star-fill me-1"></i>
                    ${review.qualityScore || 0}/100
                </span>
            </td>
            <td>${formatDate(review.createdAt)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm" onclick="event.stopPropagation(); showReviewDetails('${review.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${review.status === 'pending' ? `
                        <button class="btn btn-outline-success btn-sm" onclick="event.stopPropagation(); approveReview('${review.id}')">
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="event.stopPropagation(); rejectReview('${review.id}')">
                            <i class="bi bi-x"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================================================
// Upload Handling
// ============================================================================

function handleFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        validateFile(file);
    }
}

function handleBatchFileSelection(event) {
    const files = Array.from(event.target.files);
    files.forEach(validateFile);
}

function validateFile(file) {
    const errors = [];
    
    // Check file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        errors.push(`Datei zu groß: ${formatFileSize(file.size)} (max. ${formatFileSize(CONFIG.MAX_FILE_SIZE)})`);
    }
    
    // Check file type
    if (!CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
        errors.push(`Dateityp nicht unterstützt: ${file.type}`);
    }
    
    if (errors.length > 0) {
        showNotification(`Validierungsfehler für ${file.name}:\n${errors.join('\n')}`, 'error');
        return false;
    }
    
    return true;
}

async function handleSingleUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const fileInput = form.querySelector('#image-file');
    if (!fileInput.files[0]) {
        showNotification('Bitte wählen Sie eine Datei aus', 'error');
        return;
    }
    
    if (!validateFile(fileInput.files[0])) {
        return;
    }
    
    try {
        showUploadProgress(true);
        updateProgressBar(0, 'Upload wird vorbereitet...');
        
        const response = await uploadWithProgress(
            `${CONFIG.API_BASE_URL}/enhance/image`,
            formData,
            updateProgressBar
        );
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(
                `Bildverarbeitung erfolgreich gestartet!\nJob ID: ${result.jobId}\nReview ID: ${result.reviewId}`,
                'success'
            );
            
            // Reset form
            form.reset();
            
            // Redirect to reviews if auto-approved
            if (result.review.status === 'approved') {
                setTimeout(() => {
                    switchSection('reviews');
                }, 2000);
            }
            
        } else {
            throw new Error(result.error || 'Upload fehlgeschlagen');
        }
        
    } catch (error) {
        console.error('❌ Upload fehlgeschlagen:', error);
        showNotification(`Upload fehlgeschlagen: ${error.message}`, 'error');
    } finally {
        showUploadProgress(false);
    }
}

async function handleBatchUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const fileInput = form.querySelector('#batch-files');
    if (!fileInput.files.length) {
        showNotification('Bitte wählen Sie mindestens eine Datei aus', 'error');
        return;
    }
    
    // Validate all files
    const files = Array.from(fileInput.files);
    const validFiles = files.filter(validateFile);
    
    if (validFiles.length === 0) {
        showNotification('Keine gültigen Dateien ausgewählt', 'error');
        return;
    }
    
    try {
        showNotification(`Starte Batch-Upload mit ${validFiles.length} Dateien...`, 'info');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/enhance/batch`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(
                `Batch-Verarbeitung erfolgreich!\n${result.approvedItems}/${result.processedItems} Bilder genehmigt`,
                'success'
            );
            
            // Reset form
            form.reset();
            
            // Refresh dashboard
            loadDashboardData();
            
        } else {
            throw new Error(result.error || 'Batch-Upload fehlgeschlagen');
        }
        
    } catch (error) {
        console.error('❌ Batch-Upload fehlgeschlagen:', error);
        showNotification(`Batch-Upload fehlgeschlagen: ${error.message}`, 'error');
    }
}

async function uploadWithProgress(url, formData, progressCallback) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressCallback(percentComplete, 'Upload läuft...');
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({
                    json: () => Promise.resolve(JSON.parse(xhr.responseText))
                });
            } else {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
        });
        
        xhr.open('POST', url);
        xhr.send(formData);
    });
}

function showUploadProgress(show) {
    const progressElement = document.getElementById('upload-progress');
    if (progressElement) {
        progressElement.style.display = show ? 'block' : 'none';
        if (!show) {
            updateProgressBar(0, '');
        }
    }
}

function updateProgressBar(percent, text) {
    const progressBar = document.querySelector('#upload-progress .progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.textContent = `${Math.round(percent)}%`;
    }
    
    if (progressText) {
        progressText.textContent = text;
    }
}

// ============================================================================
// Reviews Management
// ============================================================================

async function loadReviews(status = null) {
    try {
        let url = `${CONFIG.API_BASE_URL}/reviews?limit=50`;
        if (status) {
            url += `&status=${status}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            reviews = data.reviews;
            displayReviews(data.reviews);
        }
        
    } catch (error) {
        console.error('❌ Reviews laden fehlgeschlagen:', error);
        displayReviews([]);
    }
}

function displayReviews(reviewList) {
    const container = document.getElementById('reviews-container');
    
    if (reviewList.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    Keine Reviews gefunden
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviewList.map(review => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card review-card" onclick="showReviewDetails('${review.id}')">
                <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                    <i class="bi bi-image" style="font-size: 3rem; color: #6c757d;"></i>
                </div>
                <div class="card-body">
                    <h6 class="card-title">${review.filename || 'Unbekannt'}</h6>
                    <p class="card-text">
                        <span class="badge status-${review.status}">
                            ${getStatusText(review.status)}
                        </span>
                        <span class="quality-score ${getQualityClass(review.qualityScore)} ms-2">
                            <i class="bi bi-star-fill me-1"></i>
                            ${review.qualityScore || 0}/100
                        </span>
                    </p>
                    <p class="card-text">
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            ${formatDate(review.createdAt)}
                        </small>
                    </p>
                    <p class="card-text">
                        <small class="text-muted">
                            Stil: ${review.settings?.style || 'Standard'}
                        </small>
                    </p>
                    ${review.status === 'pending' ? `
                        <div class="review-actions mt-2">
                            <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); approveReview('${review.id}')">
                                <i class="bi bi-check me-1"></i> Genehmigen
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); rejectReview('${review.id}')">
                                <i class="bi bi-x me-1"></i> Ablehnen
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function showReviewDetails(reviewId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/reviews/${reviewId}`);
        const data = await response.json();
        
        if (data.success) {
            displayReviewModal(data.review, data.comparison);
        } else {
            throw new Error(data.error || 'Review nicht gefunden');
        }
        
    } catch (error) {
        console.error('❌ Review-Details laden fehlgeschlagen:', error);
        showNotification('Fehler beim Laden der Review-Details', 'error');
    }
}

function displayReviewModal(review, comparison) {
    const modal = document.getElementById('reviewModal');
    const title = document.getElementById('reviewModalTitle');
    const body = document.getElementById('reviewModalBody');
    const actions = document.getElementById('review-actions');
    
    title.textContent = `Review: ${review.filename}`;
    
    body.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h6>Bildvergleich</h6>
                <div class="image-comparison">
                    <div class="image-container">
                        <div class="image-label">Original</div>
                        <div class="bg-light d-flex align-items-center justify-content-center" style="height: 300px;">
                            <i class="bi bi-image" style="font-size: 3rem; color: #6c757d;"></i>
                        </div>
                    </div>
                    <div class="image-container">
                        <div class="image-label">Verarbeitet</div>
                        <div class="bg-light d-flex align-items-center justify-content-center" style="height: 300px;">
                            <i class="bi bi-magic" style="font-size: 3rem; color: #6c757d;"></i>
                        </div>
                    </div>
                </div>
                
                ${review.generatedContent ? `
                    <h6 class="mt-4">Generierter Content</h6>
                    <div class="card">
                        <div class="card-body">
                            <h6>${review.generatedContent.productDescription?.title || 'Produkttitel'}</h6>
                            <p>${review.generatedContent.productDescription?.description || 'Produktbeschreibung wird generiert...'}</p>
                            
                            ${review.generatedContent.stylingTips ? `
                                <h6>Styling-Tipps</h6>
                                <ul>
                                    ${review.generatedContent.stylingTips.map(tip => `<li>${tip}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="col-md-4">
                <h6>Review-Details</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                            <span class="badge status-${review.status}">
                                ${getStatusText(review.status)}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Qualität:</strong></td>
                        <td>
                            <span class="quality-score ${getQualityClass(review.qualityScore)}">
                                ${review.qualityScore || 0}/100
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Stil:</strong></td>
                        <td>${review.settings?.style || 'Standard'}</td>
                    </tr>
                    <tr>
                        <td><strong>Erstellt:</strong></td>
                        <td>${formatDate(review.createdAt)}</td>
                    </tr>
                    <tr>
                        <td><strong>Aktualisiert:</strong></td>
                        <td>${formatDate(review.updatedAt)}</td>
                    </tr>
                </table>
                
                ${review.reviewerComments && review.reviewerComments.length > 0 ? `
                    <h6>Kommentare</h6>
                    <div class="list-group list-group-flush">
                        ${review.reviewerComments.map(comment => `
                            <div class="list-group-item px-0">
                                <div class="d-flex w-100 justify-content-between">
                                    <h6 class="mb-1">${comment.reviewer}</h6>
                                    <small>${formatDate(comment.timestamp)}</small>
                                </div>
                                <p class="mb-1">${comment.comment}</p>
                                ${comment.rating ? `
                                    <small>
                                        Bewertung: ${comment.rating}/5 
                                        ${'★'.repeat(comment.rating)}${'☆'.repeat(5-comment.rating)}
                                    </small>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${review.status === 'pending' ? `
                    <h6 class="mt-3">Review durchführen</h6>
                    <div class="mb-3">
                        <label for="review-rating" class="form-label">Bewertung</label>
                        <select class="form-select" id="review-rating">
                            <option value="5">5 - Ausgezeichnet</option>
                            <option value="4">4 - Gut</option>
                            <option value="3">3 - Befriedigend</option>
                            <option value="2">2 - Mangelhaft</option>
                            <option value="1">1 - Ungenügend</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="review-comments" class="form-label">Kommentare</label>
                        <textarea class="form-control" id="review-comments" rows="3" placeholder="Ihre Anmerkungen..."></textarea>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Action buttons
    if (review.status === 'pending') {
        actions.innerHTML = `
            <button type="button" class="btn btn-success" onclick="approveReviewFromModal('${review.id}')">
                <i class="bi bi-check me-1"></i> Genehmigen
            </button>
            <button type="button" class="btn btn-warning" onclick="requestRevisionFromModal('${review.id}')">
                <i class="bi bi-arrow-clockwise me-1"></i> Überarbeitung
            </button>
            <button type="button" class="btn btn-danger" onclick="rejectReviewFromModal('${review.id}')">
                <i class="bi bi-x me-1"></i> Ablehnen
            </button>
        `;
    } else {
        actions.innerHTML = '';
    }
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Review Actions
async function approveReview(reviewId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/reviews/${reviewId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reviewerName: 'Dashboard User',
                rating: 5,
                comments: 'Genehmigt über Dashboard',
                publishToWebsite: true
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Review erfolgreich genehmigt', 'success');
            loadReviews(); // Refresh reviews
            loadDashboardStats(); // Refresh stats
        } else {
            throw new Error(result.error || 'Genehmigung fehlgeschlagen');
        }
        
    } catch (error) {
        console.error('❌ Review-Genehmigung fehlgeschlagen:', error);
        showNotification(`Genehmigung fehlgeschlagen: ${error.message}`, 'error');
    }
}

async function rejectReview(reviewId) {
    const reason = prompt('Grund für Ablehnung:');
    if (!reason) return;
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/reviews/${reviewId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reviewerName: 'Dashboard User',
                reason: reason,
                suggestions: 'Bitte überarbeiten und erneut einreichen'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Review erfolgreich abgelehnt', 'success');
            loadReviews(); // Refresh reviews
            loadDashboardStats(); // Refresh stats
        } else {
            throw new Error(result.error || 'Ablehnung fehlgeschlagen');
        }
        
    } catch (error) {
        console.error('❌ Review-Ablehnung fehlgeschlagen:', error);
        showNotification(`Ablehnung fehlgeschlagen: ${error.message}`, 'error');
    }
}

async function approveReviewFromModal(reviewId) {
    const rating = document.getElementById('review-rating')?.value || 5;
    const comments = document.getElementById('review-comments')?.value || '';
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/reviews/${reviewId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reviewerName: 'Dashboard User',
                rating: parseInt(rating),
                comments: comments,
                publishToWebsite: true
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Review erfolgreich genehmigt', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
            modal.hide();
            
            // Refresh data
            loadReviews();
            loadDashboardStats();
        } else {
            throw new Error(result.error || 'Genehmigung fehlgeschlagen');
        }
        
    } catch (error) {
        console.error('❌ Review-Genehmigung fehlgeschlagen:', error);
        showNotification(`Genehmigung fehlgeschlagen: ${error.message}`, 'error');
    }
}

async function rejectReviewFromModal(reviewId) {
    const comments = document.getElementById('review-comments')?.value || '';
    if (!comments.trim()) {
        showNotification('Bitte geben Sie einen Grund für die Ablehnung an', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/reviews/${reviewId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reviewerName: 'Dashboard User',
                reason: comments,
                suggestions: 'Bitte überarbeiten basierend auf den Anmerkungen'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Review erfolgreich abgelehnt', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
            modal.hide();
            
            // Refresh data
            loadReviews();
            loadDashboardStats();
        } else {
            throw new Error(result.error || 'Ablehnung fehlgeschlagen');
        }
        
    } catch (error) {
        console.error('❌ Review-Ablehnung fehlgeschlagen:', error);
        showNotification(`Ablehnung fehlgeschlagen: ${error.message}`, 'error');
    }
}

// ============================================================================
// Notifications
// ============================================================================

async function loadNotifications() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/notifications`);
        const data = await response.json();
        
        if (data.success) {
            notifications = data.notifications;
            updateNotificationsBadge(data.notifications);
            displayNotificationsDropdown(data.notifications);
        }
        
    } catch (error) {
        console.error('❌ Notifications laden fehlgeschlagen:', error);
    }
}

function updateNotificationsBadge(notificationsList) {
    const badge = document.getElementById('notification-count');
    if (badge) {
        const unreadCount = notificationsList.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline' : 'none';
    }
}

function displayNotificationsDropdown(notificationsList) {
    const dropdown = document.getElementById('notifications-dropdown');
    
    if (notificationsList.length === 0) {
        dropdown.innerHTML = '<li><span class="dropdown-item-text">Keine Benachrichtigungen</span></li>';
        return;
    }
    
    dropdown.innerHTML = notificationsList.slice(0, 10).map(notification => `
        <li>
            <div class="dropdown-item notification-item ${notification.read ? '' : 'fw-bold'}">
                <div class="d-flex justify-content-between">
                    <span>${notification.message}</span>
                    <small class="notification-time">${formatDate(notification.timestamp)}</small>
                </div>
            </div>
        </li>
    `).join('');
    
    if (notificationsList.length > 10) {
        dropdown.innerHTML += '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-center" href="#notifications">Alle anzeigen</a></li>';
    }
}

function showNotification(message, type = 'info') {
    // Create toast notification
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${getBootstrapClass(type)} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
    bsToast.show();
    
    // Remove after hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// ============================================================================
// Auto Refresh
// ============================================================================

function initializeAutoRefresh() {
    refreshInterval = setInterval(() => {
        if (currentSection === 'dashboard') {
            loadDashboardStats();
        } else if (currentSection === 'reviews') {
            loadReviews();
        }
        
        loadNotifications();
    }, CONFIG.REFRESH_INTERVAL);
}

function refreshDashboard() {
    loadDashboardData();
    loadNotifications();
    showNotification('Dashboard aktualisiert', 'success');
}

// ============================================================================
// Utility Functions
// ============================================================================

function getStatusText(status) {
    const statusMap = {
        'pending': 'Ausstehend',
        'approved': 'Genehmigt',
        'rejected': 'Abgelehnt',
        'revision_requested': 'Überarbeitung',
        'in_review': 'In Review',
        'archived': 'Archiviert'
    };
    return statusMap[status] || status;
}

function getQualityClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

function getBootstrapClass(type) {
    const classMap = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return classMap[type] || 'primary';
}

function formatDate(dateString) {
    if (!dateString) return 'Unbekannt';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Placeholder functions for future implementation
function loadAnalytics() {
    console.log('📊 Analytics werden geladen...');
}

function loadBatchJobs() {
    console.log('📦 Batch-Jobs werden geladen...');
}