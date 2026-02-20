import { 
    auth, 
    registerUser, 
    loginUser, 
    logoutUser, 
    deleteUserAccount,
    saveBusiness,
    loadBusiness,
    listenBusiness,
    listenAllBusinesses,
    logActivity,
    listenAnalytics,
    listenAuth,
    sendMessage as firebaseSendMessage,
    listenForMessages
} from './firebase.js';

// ==================== GLOBAL STATE ====================
let currentUser = null;
let appState = {
    id: null,
    name: '',
    tagline: '',
    desc: '',
    address: '',
    phone: '',
    email: '',
    portfolio: [],
    location: { lat: 40.7128, lng: -74.0060 },
    profileImage: null,
    coverImage: null
};

let businesses = [];
let filteredBusinesses = [];
let dashboardMap, editorMap, marker, businessMarkers = [];
let qrcodeModal, popupQRCode;
let notifications = [];
let stats = {
    views: 0,
    scans: 0,
    maps: 0,
    contacts: 0,
    today: 0
};

let viewsChart, activityChart;
let unsubscribeBusiness = null;
let unsubscribeAnalytics = null;
let unsubscribeAllBusinesses = null;
let currentPopupBusiness = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const notifDrop = document.getElementById('notificationDropdown');
        const profileMenu = document.getElementById('profileMenu');
        
        if (notifDrop && !notifDrop.contains(e.target) && !e.target.closest('button[onclick="toggleNotifications()"]')) {
            notifDrop.classList.add('hidden');
        }
        
        if (profileMenu && !profileMenu.contains(e.target) && !e.target.closest('button[onclick="toggleProfileMenu()"]')) {
            profileMenu.classList.add('hidden');
        }
    });

    // Setup search functionality
    setupSearch();

    // Setup auth form
    setupAuthForm();

    // Listen to auth state
    if (typeof listenAuth === 'function') {
        listenAuth(handleAuthChange);
    } else {
        console.error('listenAuth is not defined');
    }

    // Check for business ID in URL (for QR code deep linking)
    checkUrlForBusinessId();
});

function setupSearch() {
    const searchInput = document.getElementById('businessSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (!searchTerm) {
            filteredBusinesses = [...businesses];
        } else {
            filteredBusinesses = businesses.filter(business => 
                (business.name && business.name.toLowerCase().includes(searchTerm)) ||
                (business.tagline && business.tagline.toLowerCase().includes(searchTerm)) ||
                (business.desc && business.desc.toLowerCase().includes(searchTerm)) ||
                (business.address && business.address.toLowerCase().includes(searchTerm))
            );
        }
        
        renderBusinessList();
    }, 300));
}

function checkUrlForBusinessId() {
    const urlParams = new URLSearchParams(window.location.search);
    const businessId = urlParams.get('business');
    
    if (businessId && businesses.length > 0) {
        const business = businesses.find(b => b.id === businessId);
        if (business) {
            setTimeout(() => {
                showBusinessPopup(business);
            }, 1000);
        }
    }
}

function setupAuthForm() {
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');

    if (!authForm) return;

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail')?.value;
        const password = document.getElementById('authPassword')?.value;
        
        if (!email || !password) return;
        
        authError.classList.add('hidden');
        showLoading(true);
        
        try {
            await loginUser(email, password);
        } catch (error) {
            authError.textContent = error.message;
            authError.classList.remove('hidden');
            showLoading(false);
        }
    });
}

// Make register button work separately
document.getElementById('registerBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('authEmail')?.value;
    const password = document.getElementById('authPassword')?.value;
    const authError = document.getElementById('authError');
    
    if (!email || !password) {
        authError.textContent = 'Please enter email and password';
        authError.classList.remove('hidden');
        return;
    }
    
    authError.classList.add('hidden');
    showLoading(true);
    
    try {
        await registerUser(email, password);
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
        showLoading(false);
    }
});

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

async function handleAuthChange(user) {
    console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    
    if (user) {
        currentUser = user;
        
        try {
            showLoading(true);
            
            // Load user business data
            const businessData = await loadBusiness(user.uid);
            if (businessData) {
                appState = { ...appState, ...businessData, id: user.uid };
            } else {
                // Initialize with default values if no data exists
                appState = {
                    ...appState,
                    id: user.uid,
                    email: user.email,
                    name: user.email.split('@')[0] || 'My Business'
                };
            }
            
            // Initialize app
            const authSection = document.getElementById('authSection');
            const app = document.getElementById('app');
            
            if (authSection) authSection.classList.add('hidden');
            if (app) app.classList.remove('hidden');
            
            // Initialize icons again
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Initialize maps
            setTimeout(() => {
                initDashboardMap();
                initEditorMap();
            }, 100);
            
            // Initialize QR codes
            initQRCode();
            initPopupQRCode();
            
            // Initialize charts
            initCharts();
            
            // Sync UI with state (this will populate editor fields)
            sync();
            renderPortfolioGrid();
            
            // Set profile initial with proper letter
            updateProfileDisplay();
            
            // Listen to business updates
            if (unsubscribeBusiness) unsubscribeBusiness();
            unsubscribeBusiness = listenBusiness(user.uid, (data) => {
                if (data) {
                    appState = { ...appState, ...data };
                    sync();
                    renderPortfolioGrid();
                    updateDashboardMarker();
                    updateProfileDisplay();
                }
            });
            
            // Listen to analytics
            if (unsubscribeAnalytics) unsubscribeAnalytics();
            unsubscribeAnalytics = listenAnalytics(user.uid, (data) => {
                if (data) {
                    stats = { ...stats, ...data };
                    updateStats();
                }
            });
            
            // Listen to all businesses
            if (unsubscribeAllBusinesses) unsubscribeAllBusinesses();
            unsubscribeAllBusinesses = listenAllBusinesses((allBusinesses) => {
                if (allBusinesses) {
                    businesses = allBusinesses;
                    filteredBusinesses = [...businesses];
                    renderBusinessList();
                    updateBusinessMarkers();
                    
                    // Check if we have a business ID in URL
                    checkUrlForBusinessId();
                }
            });
            
            // Log initial view
            logActivity(user.uid, 'views');
            
            showLoading(false);
            showToast('Welcome back!', 'success');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            showLoading(false);
            showToast('Error loading data', 'error');
        }
        
    } else {
        // User is signed out
        currentUser = null;
        
        const app = document.getElementById('app');
        const authSection = document.getElementById('authSection');
        
        if (app) app.classList.add('hidden');
        if (authSection) authSection.classList.remove('hidden');
        
        // Clear form
        const emailInput = document.getElementById('authEmail');
        const passwordInput = document.getElementById('authPassword');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        // Clean up listeners
        if (unsubscribeBusiness) unsubscribeBusiness();
        if (unsubscribeAnalytics) unsubscribeAnalytics();
        if (unsubscribeAllBusinesses) unsubscribeAllBusinesses();
        
        // Clear maps
        if (dashboardMap) {
            dashboardMap.remove();
            dashboardMap = null;
        }
        if (editorMap) {
            editorMap.remove();
            editorMap = null;
        }
        
        // Reset state
        appState = {
            id: null,
            name: '',
            tagline: '',
            desc: '',
            address: '',
            phone: '',
            email: '',
            portfolio: [],
            location: { lat: 40.7128, lng: -74.0060 },
            profileImage: null,
            coverImage: null
        };
        
        businesses = [];
        filteredBusinesses = [];
        stats = {
            views: 0,
            scans: 0,
            maps: 0,
            contacts: 0,
            today: 0
        };
        
        showLoading(false);
    }
}

function updateProfileDisplay() {
    // Get the first letter from business name, or use email first letter as fallback
    let initial = 'B';
    
    if (appState.name && appState.name.trim() !== '') {
        initial = appState.name.trim().charAt(0).toUpperCase();
    } else if (currentUser?.email) {
        initial = currentUser.email.charAt(0).toUpperCase();
    }
    
    console.log('Updating profile initial to:', initial, 'from name:', appState.name);
    
    const profileInitial = document.getElementById('profileInitial');
    const profileMenuInitial = document.getElementById('profileMenuInitial');
    const profileMenuName = document.getElementById('profileMenuName');
    const profileMenuEmail = document.getElementById('profileMenuEmail');
    
    if (profileInitial) profileInitial.innerText = initial;
    if (profileMenuInitial) profileMenuInitial.innerText = initial;
    if (profileMenuName) profileMenuName.innerText = appState.name || 'Your Business';
    if (profileMenuEmail) profileMenuEmail.innerText = currentUser?.email || '';
}

// ==================== SYNC FUNCTIONS ====================
function sync() {
    if (!currentUser) return;
    
    // Update input fields with appState data (this ensures editor shows saved data)
    const inputName = document.getElementById('inputName');
    const inputTagline = document.getElementById('inputTagline');
    const inputDesc = document.getElementById('inputDesc');
    const inputAddress = document.getElementById('inputAddress');
    const inputPhone = document.getElementById('inputPhone');
    const inputEmail = document.getElementById('inputEmail');
    
    if (inputName) inputName.value = appState.name || '';
    if (inputTagline) inputTagline.value = appState.tagline || '';
    if (inputDesc) inputDesc.value = appState.desc || '';
    if (inputAddress) inputAddress.value = appState.address || '';
    if (inputPhone) inputPhone.value = appState.phone || '';
    if (inputEmail) inputEmail.value = appState.email || '';

    // Update dashboard displays
    const businessNameDisplay = document.getElementById('businessNameDisplay');
    const businessAddressDisplay = document.getElementById('businessAddressDisplay');
    
    if (businessNameDisplay) businessNameDisplay.innerText = appState.name || 'Your Business';
    if (businessAddressDisplay) businessAddressDisplay.innerText = appState.address || 'Set your location';
    
    // Update cover photo if exists
    if (appState.coverImage) {
        const coverPreview = document.getElementById('coverPreview');
        const coverText = document.getElementById('coverText');
        if (coverPreview) {
            coverPreview.src = appState.coverImage;
            coverPreview.classList.remove('hidden');
            if (coverText) coverText.classList.add('hidden');
        }
    }
    
    // Update profile picture if exists
    if (appState.profileImage) {
        const profileIcon = document.querySelector('.w-24.h-24.rounded-2xl.border-4.border-white');
        if (profileIcon) {
            profileIcon.innerHTML = `<img src="${appState.profileImage}" class="w-full h-full object-cover rounded-2xl">`;
        }
    }
    
    updateProfileDisplay();
    updateBusinessPopup();
}

// ==================== PROFILE MENU FUNCTIONS ====================
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
        console.log('Profile menu toggled:', !menu.classList.contains('hidden'));
    }
}

function viewMyProfile() {
    toggleProfileMenu();
    
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    
    // Update profile modal with all business details
    document.getElementById('profileModalName').innerText = appState.name || 'Your Business';
    document.getElementById('profileModalTagline').innerText = appState.tagline || '';
    document.getElementById('profileModalDesc').innerText = appState.desc || 'No description yet';
    document.getElementById('profileModalPhone').innerText = appState.phone || 'Not provided';
    document.getElementById('profileModalEmail').innerText = appState.email || 'Not provided';
    document.getElementById('profileModalAddress').innerText = appState.address || 'Not set';
    
    // Handle profile image
    const iconEl = document.getElementById('profileModalIcon');
    const imgEl = document.getElementById('profileModalImg');
    
    if (appState.profileImage) {
        iconEl.classList.add('hidden');
        imgEl.classList.remove('hidden');
        imgEl.src = appState.profileImage;
    } else {
        iconEl.classList.remove('hidden');
        imgEl.classList.add('hidden');
    }
    
    // Load portfolio images
    const portfolioGrid = document.getElementById('profileModalPortfolio');
    if (portfolioGrid) {
        if (appState.portfolio && appState.portfolio.length > 0) {
            portfolioGrid.innerHTML = appState.portfolio.slice(0, 3).map(item => `
                <div class="aspect-square rounded-lg overflow-hidden bg-slate-100">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
            `).join('');
        } else {
            portfolioGrid.innerHTML = '<p class="text-xs text-slate-400 col-span-3 text-center py-2">No portfolio items</p>';
        }
    }
    
    modal.classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.add('hidden');
}

async function logout() {
    toggleProfileMenu();
    showLoading(true);
    await logoutUser();
    showLoading(false);
}

// ==================== BUSINESS POPUP FUNCTIONS ====================
function showBusinessPopup(business) {
    if (!business) return;
    
    currentPopupBusiness = business;
    const modal = document.getElementById('businessPopupModal');
    if (!modal) return;
    
    // Set business info
    document.getElementById('popupBusinessName').innerText = business.name || 'Business Name';
    document.getElementById('popupBusinessTagline').innerText = business.tagline || '';
    document.getElementById('popupBusinessDesc').innerText = business.desc || 'No description available';
    document.getElementById('popupBusinessPhone').innerText = business.phone || 'Not provided';
    document.getElementById('popupBusinessEmail').innerText = business.email || 'Not provided';
    document.getElementById('popupBusinessAddress').innerText = business.address || 'Location not set';
    
    // Set contact links
    const phoneLink = document.getElementById('popupPhoneLink');
    const emailLink = document.getElementById('popupEmailLink');
    
    if (business.phone) {
        phoneLink.href = `tel:${business.phone}`;
        phoneLink.classList.remove('opacity-50', 'pointer-events-none');
    } else {
        phoneLink.href = '#';
        phoneLink.classList.add('opacity-50', 'pointer-events-none');
    }
    
    if (business.email) {
        emailLink.href = `mailto:${business.email}`;
        emailLink.classList.remove('opacity-50', 'pointer-events-none');
    } else {
        emailLink.href = '#';
        emailLink.classList.add('opacity-50', 'pointer-events-none');
    }
    
    // Set message recipient
    document.getElementById('messageRecipient').innerText = business.name || 'Business';
    
    // Handle cover image
    const coverImg = document.getElementById('popupCoverImage');
    const coverPlaceholder = document.getElementById('popupCoverPlaceholder');
    
    if (business.coverImage) {
        coverImg.src = business.coverImage;
        coverImg.classList.remove('hidden');
        coverPlaceholder.classList.add('hidden');
    } else {
        coverImg.classList.add('hidden');
        coverPlaceholder.classList.remove('hidden');
    }
    
    // Handle profile image
    const profileImg = document.getElementById('popupProfileImage');
    const profileIcon = document.getElementById('popupProfileIcon');
    
    if (business.profileImage) {
        profileImg.src = business.profileImage;
        profileImg.classList.remove('hidden');
        profileIcon.classList.add('hidden');
    } else {
        profileImg.classList.add('hidden');
        profileIcon.classList.remove('hidden');
    }
    
    // Load portfolio images
    const portfolioGrid = document.getElementById('popupPortfolioGrid');
    if (portfolioGrid) {
        if (business.portfolio && business.portfolio.length > 0) {
            portfolioGrid.innerHTML = business.portfolio.map(item => `
                <div class="aspect-square rounded-lg overflow-hidden bg-slate-100">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
            `).join('');
        } else {
            portfolioGrid.innerHTML = '<p class="text-xs text-slate-400 col-span-3 text-center py-2">No portfolio items</p>';
        }
    }
    
    // Generate QR code for this business
    generateBusinessQRCode(business);
    
    modal.classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeBusinessPopup() {
    const modal = document.getElementById('businessPopupModal');
    if (modal) modal.classList.add('hidden');
    currentPopupBusiness = null;
}

function generateBusinessQRCode(business) {
    const qrElement = document.getElementById('popupQRCode');
    if (!qrElement) return;
    
    qrElement.innerHTML = '';
    
    // Create deep link URL with business ID
    const baseUrl = window.location.origin + window.location.pathname;
    const businessUrl = `${baseUrl}?business=${business.id}`;
    
    if (typeof QRCode !== 'undefined') {
        popupQRCode = new QRCode(qrElement, {
            text: businessUrl,
            width: 150,
            height: 150
        });
    }
}

function getDirectionsToBusiness() {
    if (!currentPopupBusiness || !currentPopupBusiness.location) return;
    
    const { lat, lng } = currentPopupBusiness.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
    
    if (currentUser && currentPopupBusiness.id !== currentUser.uid) {
        logActivity(currentPopupBusiness.id, 'maps');
    }
}

function sendMessageToBusiness() {
    if (!currentPopupBusiness) return;
    document.getElementById('messageModal').classList.remove('hidden');
}

function closeMessageModal() {
    document.getElementById('messageModal').classList.add('hidden');
    document.getElementById('messageInput').value = '';
}

async function handleSendMessage() {
    const message = document.getElementById('messageInput').value.trim();
    if (!message || !currentUser || !currentPopupBusiness) return;
    
    showLoading(true);
    
    try {
        await firebaseSendMessage(currentUser.uid, currentPopupBusiness.id, message);
        showToast('Message sent!', 'success');
        closeMessageModal();
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Error sending message', 'error');
    }
    
    showLoading(false);
}

// ==================== DELETE ACCOUNT FUNCTIONS ====================
function openDeleteModal() {
    toggleProfileMenu();
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('hidden');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('hidden');
}

async function confirmDelete() {
    closeDeleteModal();
    showLoading(true);
    
    try {
        await deleteUserAccount(currentUser);
        showToast('Account deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting account:', error);
        showToast('Error deleting account', 'error');
    }
    
    showLoading(false);
}

// ==================== MAP FUNCTIONS ====================
function initDashboardMap() {
    const mapElement = document.getElementById('dashboardMap');
    if (!mapElement) return;
    
    if (!appState.location) {
        appState.location = { lat: 40.7128, lng: -74.0060 };
    }
    
    if (dashboardMap) {
        dashboardMap.remove();
    }
    
    dashboardMap = L.map('dashboardMap').setView([appState.location.lat, appState.location.lng], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap, ©CartoDB'
    }).addTo(dashboardMap);

    businessMarkers = [];
    
    // Add your business marker
    if (appState.location && appState.location.lat) {
        addBusinessMarker({
            ...appState,
            id: currentUser?.uid
        }, true);
    }

    // Add all other business markers
    if (businesses && businesses.length > 0) {
        businesses.forEach(business => {
            if (business.id !== currentUser?.uid && business.location && business.location.lat) {
                addBusinessMarker(business, false);
            }
        });
    }
}

function initEditorMap() {
    const mapElement = document.getElementById('editorMap');
    if (!mapElement) return;
    
    if (!appState.location) {
        appState.location = { lat: 40.7128, lng: -74.0060 };
    }
    
    if (editorMap) {
        editorMap.remove();
    }
    
    editorMap = L.map('editorMap').setView([appState.location.lat, appState.location.lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(editorMap);

    if (marker) {
        marker.remove();
    }
    
    marker = L.marker([appState.location.lat, appState.location.lng], { draggable: true }).addTo(editorMap);
    marker.on('dragend', async (e) => {
        const pos = e.target.getLatLng();
        appState.location = { lat: pos.lat, lng: pos.lng };
        await reverseGeocode(pos.lat, pos.lng);
        updateQRCode();
        saveBusinessProfile();
    });
}

function addBusinessMarker(business, isCurrent = false) {
    if (!business || !business.location || !business.location.lat || !dashboardMap) return;
    
    const marker = L.marker([business.location.lat, business.location.lng], {
        icon: L.divIcon({
            className: `custom-marker ${isCurrent ? 'your-business' : ''}`,
            html: `<i data-lucide="${isCurrent ? 'store' : 'map-pin'}" class="w-5 h-5"></i>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        })
    }).addTo(dashboardMap);

    const popupContent = isCurrent ? `
        <div class="text-center min-w-[150px]">
            <h3 class="font-bold text-indigo-600">${business.name || 'Your Business'}</h3>
            <p class="text-xs text-slate-500 mt-1">${business.address || 'Location set'}</p>
            <button onclick="focusOnBusiness('${business.id}')" class="mt-2 text-xs bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 transition-colors">
                View Details
            </button>
        </div>
    ` : `
        <div class="text-center min-w-[150px]">
            <h3 class="font-bold">${business.name || 'Business'}</h3>
            <p class="text-xs text-slate-500 mt-1">${business.address || 'Location set'}</p>
            <button onclick="showBusinessPopupFromId('${business.id}')" class="mt-2 text-xs bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 transition-colors">
                View Business
            </button>
        </div>
    `;

    marker.bindPopup(popupContent);
    marker.on('click', () => {
        if (!isCurrent) {
            showBusinessPopup(business);
        }
    });
    
    businessMarkers.push({ id: business.id, marker, isCurrent });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function showBusinessPopupFromId(businessId) {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
        showBusinessPopup(business);
    }
}

function updateBusinessMarkers() {
    if (!dashboardMap) return;
    
    // Clear existing markers (except current user's)
    businessMarkers.forEach(m => {
        if (!m.isCurrent && dashboardMap) {
            dashboardMap.removeLayer(m.marker);
        }
    });
    
    businessMarkers = businessMarkers.filter(m => m.isCurrent);
    
    // Add all business markers
    if (businesses && businesses.length > 0) {
        businesses.forEach(business => {
            if (business.id !== currentUser?.uid && business.location && business.location.lat) {
                addBusinessMarker(business, false);
            }
        });
    }
}

function updateDashboardMarker() {
    const currentMarker = businessMarkers.find(m => m.isCurrent);
    if (currentMarker && currentMarker.marker && appState.location) {
        currentMarker.marker.setLatLng([appState.location.lat, appState.location.lng]);
        updateBusinessPopup();
    }
}

function updateBusinessPopup() {
    const currentMarker = businessMarkers.find(m => m.isCurrent);
    if (currentMarker && currentMarker.marker) {
        currentMarker.marker.setPopupContent(`
            <div class="text-center min-w-[150px]">
                <h3 class="font-bold text-indigo-600">${appState.name || 'Your Business'}</h3>
                <p class="text-xs text-slate-500 mt-1">${appState.address || 'Location set'}</p>
                <button onclick="focusOnBusiness('${currentUser?.uid}')" class="mt-2 text-xs bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 transition-colors">
                    View Details
                </button>
            </div>
        `);
    }
}

function focusOnBusiness(businessId) {
    if (!dashboardMap) return;
    
    let target;
    if (businessId === currentUser?.uid) {
        target = appState;
    } else {
        target = businesses.find(b => b.id === businessId);
    }
    
    if (target && target.location) {
        dashboardMap.setView([target.location.lat, target.location.lng], 16);
        
        const marker = businessMarkers.find(m => m.id === businessId);
        if (marker) marker.marker.openPopup();
        
        // Show business popup for other businesses
        if (businessId !== currentUser?.uid) {
            showBusinessPopup(target);
        }
    }
}

// ==================== LOCATION FUNCTIONS ====================
function openLocationSearch() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[250] bg-black/70 backdrop-blur-md flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-md p-6 scale-in">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-lg">Search Location</h3>
                <button onclick="this.closest('.fixed').remove()" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="relative mb-4">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                <input type="text" id="addressSearch" placeholder="Enter address" 
                       class="w-full pl-9 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
            </div>
            <div id="searchResults" class="space-y-2 max-h-60 overflow-y-auto mb-4">
                <p class="text-sm text-slate-500 text-center py-4">Type at least 3 characters to search</p>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="w-full bg-slate-100 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                Cancel
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    const searchInput = document.getElementById('addressSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            if (e.target.value.length < 3) return;
            
            const results = document.getElementById('searchResults');
            if (!results) return;
            
            results.innerHTML = `
                <div class="p-4 text-center text-slate-400">
                    <div class="loader mx-auto mb-2"></div>
                    <p class="text-sm">Searching...</p>
                </div>
            `;
            
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(e.target.value)}&limit=5`);
                const data = await response.json();
                
                if (data.length === 0) {
                    results.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">No results found</p>';
                    return;
                }
                
                results.innerHTML = data.map(place => `
                    <div onclick="selectAddress('${place.display_name.replace(/'/g, "\\'")}', ${place.lat}, ${place.lon})" class="p-3 hover:bg-slate-50 rounded-xl cursor-pointer border transition-all">
                        <p class="font-medium">${place.display_name}</p>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Search error:', error);
                results.innerHTML = '<p class="text-sm text-red-500 text-center py-4">Error searching. Please try again.</p>';
            }
        }, 500));
    }
}

function selectAddress(address, lat, lng) {
    const modal = document.querySelector('.fixed.z-\\[250\\]');
    if (modal) modal.remove();
    
    const inputAddress = document.getElementById('inputAddress');
    if (inputAddress) {
        inputAddress.value = address;
        appState.address = address;
    }
    
    appState.location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    
    if (editorMap) {
        editorMap.setView([lat, lng], 16);
        if (marker) marker.setLatLng([lat, lng]);
    }
    if (dashboardMap) {
        dashboardMap.setView([lat, lng], 14);
        updateDashboardMarker();
    }
    updateQRCode();
    
    saveBusinessProfile();
    showToast('Location updated', 'success');
}

async function syncToRealTimeLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation not supported', 'error');
        return;
    }
    
    showLoading(true);
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        appState.location = { lat, lng };
        
        if (editorMap) {
            editorMap.setView([lat, lng], 17);
            if (marker) marker.setLatLng([lat, lng]);
        }
        if (dashboardMap) {
            dashboardMap.setView([lat, lng], 14);
            updateDashboardMarker();
        }
        
        await reverseGeocode(lat, lng);
        updateQRCode();
        await saveBusinessProfile();
        
        showLoading(false);
        showToast('Location synced!', 'success');
    }, (err) => {
        console.error('Geolocation error:', err);
        showLoading(false);
        showToast('Failed to get location', 'error');
    });
}

async function reverseGeocode(lat, lng) {
    const loader = document.getElementById('addrLoader');
    if (loader) loader.classList.remove('hidden');
    
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        const addr = data.display_name || "Location set";
        
        const inputAddress = document.getElementById('inputAddress');
        if (inputAddress) {
            inputAddress.value = addr;
            appState.address = addr;
        }
    } catch (e) {
        console.error('Geocoding failed:', e);
    }
    
    if (loader) loader.classList.add('hidden');
}

// ==================== BUSINESS LIST FUNCTIONS ====================
function renderBusinessList() {
    const list = document.getElementById('businessList');
    if (!list) return;
    
    const businessesToShow = filteredBusinesses.length > 0 ? filteredBusinesses : businesses;
    
    if (!businessesToShow || businessesToShow.length === 0) {
        list.innerHTML = `
            <div class="p-8 text-center text-slate-400">
                <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 opacity-20"></i>
                <p class="text-sm">No businesses found</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    list.innerHTML = businessesToShow
        .filter(business => business.id !== currentUser?.uid)
        .map(business => `
        <div class="p-4 border-b hover:bg-slate-50 transition-colors cursor-pointer" onclick="showBusinessPopupFromId('${business.id}')">
            <div class="flex gap-3">
                <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                    ${business.profileImage 
                        ? `<img src="${business.profileImage}" class="w-full h-full object-cover">` 
                        : `<i data-lucide="store" class="w-8 h-8"></i>`
                    }
                </div>
                <div class="flex-1">
                    <h3 class="font-bold">${business.name || 'Business'}</h3>
                    <p class="text-xs text-slate-500 mt-1">${business.address || 'Location not set'}</p>
                    <div class="flex gap-2 mt-2">
                        ${business.phone ? `<span class="text-xs text-slate-400">📞</span>` : ''}
                        ${business.email ? `<span class="text-xs text-slate-400">✉️</span>` : ''}
                        ${business.portfolio?.length ? `<span class="text-xs text-slate-400">📸 ${business.portfolio.length}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ==================== QR CODE FUNCTIONS ====================
function initQRCode() {
    const qrElement = document.getElementById("qrcode-modal");
    if (!qrElement) return;
    
    qrElement.innerHTML = '';
    
    const link = `${window.location.origin}${window.location.pathname}?business=${currentUser?.uid}`;
    
    if (typeof QRCode !== 'undefined') {
        qrcodeModal = new QRCode(qrElement, {
            text: link,
            width: 200,
            height: 200
        });
    }
}

function initPopupQRCode() {
    const qrElement = document.getElementById('popupQRCode');
    if (!qrElement) return;
    
    qrElement.innerHTML = '';
}

function updateQRCode() {
    if (!qrcodeModal) return;
    
    const link = `${window.location.origin}${window.location.pathname}?business=${currentUser?.uid}`;
    qrcodeModal.clear();
    qrcodeModal.makeCode(link);
}

function downloadQR() {
    const img = document.querySelector("#qrcode-modal img");
    if (img) {
        const a = document.createElement("a");
        a.href = img.src;
        a.download = "tapmap-business-qr.png";
        a.click();
        showToast('QR Code downloaded!', 'success');
    }
}

function openShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.remove('hidden');
        updateQRCode();
    }
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.add('hidden');
}

function simulateScan() {
    if (currentUser) {
        logActivity(currentUser.uid, 'scans');
        showToast('QR Scan recorded!', 'success');
    }
}

// ==================== PORTFOLIO FUNCTIONS ====================
function addPortfolioItem() {
    const id = Date.now();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => handleNewPortfolioUpload(id, e);
    document.body.appendChild(fileInput);
    fileInput.click();
}

function handleNewPortfolioUpload(id, event) {
    const file = event.target.files[0];
    if (!file) {
        document.body.removeChild(event.target);
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        document.body.removeChild(event.target);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        if (!appState.portfolio) {
            appState.portfolio = [];
        }
        appState.portfolio.push({
            id,
            name: 'New Item',
            image: e.target.result
        });
        renderPortfolioGrid();
        saveBusinessProfile();
        
        if (event.target && event.target.parentNode) {
            document.body.removeChild(event.target);
        }
        showToast('Image added!', 'success');
    };
    reader.readAsDataURL(file);
}

function triggerPortfolioUpload(id) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = (e) => handlePortfolioImageUpload(id, e);
    document.body.appendChild(input);
    input.click();
}

function handlePortfolioImageUpload(id, event) {
    const file = event.target.files[0];
    if (!file) {
        document.body.removeChild(event.target);
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        document.body.removeChild(event.target);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const item = appState.portfolio.find(i => i.id === id);
        if (item) {
            item.image = e.target.result;
            renderPortfolioGrid();
            saveBusinessProfile();
        }
        
        if (event.target && event.target.parentNode) {
            document.body.removeChild(event.target);
        }
        showToast('Image updated!', 'success');
    };
    reader.readAsDataURL(file);
}

function renderPortfolioGrid() {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;
    
    if (!appState.portfolio || appState.portfolio.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-8 text-slate-400">
                <i data-lucide="image" class="w-8 h-8 mx-auto mb-2 opacity-20"></i>
                <p class="text-sm">No photos yet. Click "Add Photos" to get started.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    grid.innerHTML = appState.portfolio.map(item => `
        <div class="portfolio-item group">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
            <div class="portfolio-item-overlay">
                <div class="w-full space-y-2">
                    <input type="text" value="${item.name}" 
                           onchange="updatePortfolioName(${item.id}, this.value)"
                           class="w-full bg-transparent text-white font-medium text-sm border-b border-white/50 focus:outline-none focus:border-white px-1 py-0.5"
                           placeholder="Item name">
                    <button onclick="triggerPortfolioUpload(${item.id})" 
                            class="w-full text-xs bg-white/20 backdrop-blur-sm text-white py-1 rounded-full hover:bg-white/30 transition-colors">
                        Change Image
                    </button>
                </div>
            </div>
            <button onclick="removePortfolioItem(${item.id})" 
                    class="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:bg-red-600">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function updatePortfolioName(id, newName) {
    const item = appState.portfolio.find(i => i.id === id);
    if (item) {
        item.name = newName;
        saveBusinessProfile();
    }
}

function removePortfolioItem(id) {
    appState.portfolio = appState.portfolio.filter(i => i.id !== id);
    renderPortfolioGrid();
    saveBusinessProfile();
    showToast('Item removed', 'success');
}

// ==================== ANALYTICS FUNCTIONS ====================
function initCharts() {
    const viewsCtx = document.getElementById('viewsChart')?.getContext('2d');
    const activityCtx = document.getElementById('activityChart')?.getContext('2d');
    
    if (viewsCtx && typeof Chart !== 'undefined') {
        if (viewsChart) viewsChart.destroy();
        viewsChart = new Chart(viewsCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Views',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    if (activityCtx && typeof Chart !== 'undefined') {
        if (activityChart) activityChart.destroy();
        activityChart = new Chart(activityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Views', 'Scans', 'Directions', 'Contacts'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

function updateAnalyticsCharts() {
    if (!viewsChart || !activityChart) return;
    
    const timeframe = document.getElementById('analyticsTimeframe')?.value || 'week';
    
    // Update charts with actual stats
    viewsChart.data.datasets[0].data = generateTimeframeData(timeframe);
    viewsChart.update();
    
    activityChart.data.datasets[0].data = [
        stats.views || 0,
        stats.scans || 0,
        stats.maps || 0,
        stats.contacts || 0
    ];
    activityChart.update();
}

function generateTimeframeData(timeframe) {
    const baseValue = stats.views || 100;
    
    switch(timeframe) {
        case 'today':
            return [2, 4, 3, 6, 8, 10, 12];
        case 'week':
            return [
                Math.round(baseValue * 0.1),
                Math.round(baseValue * 0.15),
                Math.round(baseValue * 0.2),
                Math.round(baseValue * 0.25),
                Math.round(baseValue * 0.3),
                Math.round(baseValue * 0.35),
                Math.round(baseValue * 0.4)
            ];
        case 'month':
            return Array(30).fill(0).map(() => Math.round(baseValue / 30));
        default:
            return [0, 0, 0, 0, 0, 0, 0];
    }
}

// ==================== SAVE PROFILE ====================
async function saveBusinessProfile() {
    if (!currentUser) return;
    
    showLoading(true);
    
    try {
        await saveBusiness(currentUser.uid, {
            name: appState.name,
            tagline: appState.tagline,
            desc: appState.desc,
            address: appState.address,
            phone: appState.phone,
            email: appState.email,
            portfolio: appState.portfolio,
            location: appState.location,
            profileImage: appState.profileImage,
            coverImage: appState.coverImage
        });
        
        showToast('Profile saved!', 'success');
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Error saving profile', 'error');
    }
    
    showLoading(false);
}

// ==================== COVER PHOTO ====================
function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const coverPreview = document.getElementById('coverPreview');
        const coverText = document.getElementById('coverText');
        
        if (coverPreview) {
            coverPreview.src = e.target.result;
            coverPreview.classList.remove('hidden');
            appState.coverImage = e.target.result;
        }
        if (coverText) coverText.classList.add('hidden');
        
        showToast('Cover photo updated!', 'success');
    };
    reader.readAsDataURL(file);
}

function uploadProfilePicture() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const profileIcon = document.querySelector('.w-24.h-24.rounded-2xl.border-4.border-white');
            if (profileIcon) {
                profileIcon.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover rounded-2xl">`;
                appState.profileImage = event.target.result;
            }
            showToast('Profile picture updated!', 'success');
            updateProfileDisplay();
        };
        reader.readAsDataURL(file);
    };
    document.body.appendChild(input);
    input.click();
}

// ==================== VIEW SWITCHING ====================
function switchView(view) {
    const dashboard = document.getElementById('dashboardView');
    const editor = document.getElementById('editorView');
    const analytics = document.getElementById('analyticsView');
    const toggleDashboard = document.getElementById('toggleDashboard');
    const toggleEditor = document.getElementById('toggleEditor');
    const toggleAnalytics = document.getElementById('toggleAnalytics');
    
    if (!dashboard || !editor || !analytics) return;
    
    dashboard.classList.add('hidden');
    editor.classList.add('hidden');
    analytics.classList.add('hidden');
    
    if (view === 'dashboard') {
        dashboard.classList.remove('hidden');
        if (toggleDashboard) toggleDashboard.className = "px-4 py-1.5 rounded-full text-sm font-semibold transition-all bg-white text-indigo-600 shadow-sm";
        if (toggleEditor) toggleEditor.className = "px-4 py-1.5 rounded-full text-sm font-semibold transition-all text-slate-500";
        if (toggleAnalytics) toggleAnalytics.className = "px-4 py-1.5 rounded-full text-sm font-semibold transition-all text-slate-500";
        
        setTimeout(() => {
            if (dashboardMap) dashboardMap.invalidateSize();
        }, 100);
    } else if (view === 'editor') {
        editor.classList.remove('hidden');
        if (toggleEditor) toggleEditor.className = "px-4 py-1.5 rounded-full text-sm font-semibold transition-all bg-white text-indigo-600 shadow-sm";
        if (toggleDashboard) toggleDashboard.className = "px-4 py-1.5 rounded-full text-sm font-semibold transition-all text-slate-500";
        if (toggleAnalytics) toggleAnalytics.className = "px-4 py-1.5 rounded-full text-sm font-semibold transition-all text-slate-500";
        
        setTimeout(() => {
            if (editorMap) editorMap.invalidateSize();
        }, 100);
    } else {
        analytics.classList.remove('hidden');
        if (toggleAnalytics) toggleAnalytics.className = "px-4 py-1.5 rounded-full text-sm font-semibold transition-all bg-white text-indigo-600 shadow-sm";
        if (toggleDashboard) toggleDashboard.className = "px-4 py-1.5 rounded-full text-sm font-semibold transition-all text-slate-500";
        if (toggleEditor) toggleEditor.className = "px-4 py-1.5 rounded-full text-sm font-semibold transition-all text-slate-500";
        
        updateAnalyticsCharts();
    }
}

// ==================== STATS MANAGEMENT ====================
function updateStats() {
    // Update sidebar stats
    const viewsSidebar = document.getElementById('stat-views-sidebar');
    const scansSidebar = document.getElementById('stat-scans-sidebar');
    const viewsMini = document.getElementById('stat-views-mini');
    const scansMini = document.getElementById('stat-scans-mini');
    const businessCount = document.getElementById('businessCount');
    const statsToday = document.getElementById('statsToday');
    const statsTodayScans = document.getElementById('statsTodayScans');
    
    if (viewsSidebar) viewsSidebar.innerText = stats.views || 0;
    if (scansSidebar) scansSidebar.innerText = stats.scans || 0;
    if (viewsMini) viewsMini.innerText = stats.views || 0;
    if (scansMini) scansMini.innerText = stats.scans || 0;
    if (businessCount) businessCount.innerText = businesses.length || 0;
    
    if (statsToday) statsToday.innerText = stats.today || 0;
    if (statsTodayScans) statsTodayScans.innerText = stats.scans || 0;
    
    // Update analytics numbers
    const analyticsViews = document.getElementById('analytics-views');
    const analyticsScans = document.getElementById('analytics-scans');
    const analyticsMaps = document.getElementById('analytics-maps');
    const analyticsContacts = document.getElementById('analytics-contacts');
    
    if (analyticsViews) analyticsViews.innerText = (stats.views || 0).toLocaleString();
    if (analyticsScans) analyticsScans.innerText = (stats.scans || 0).toLocaleString();
    if (analyticsMaps) analyticsMaps.innerText = (stats.maps || 0).toLocaleString();
    if (analyticsContacts) analyticsContacts.innerText = (stats.contacts || 0).toLocaleString();
    
    updateAnalyticsCharts();
    
    // Update recent activity
    const activityDiv = document.getElementById('recentActivity');
    if (activityDiv) {
        const activities = [];
        if (stats.views > 0) activities.push(`📊 ${stats.views} total views`);
        if (stats.scans > 0) activities.push(`📱 ${stats.scans} QR scans`);
        if (stats.maps > 0) activities.push(`🗺️ ${stats.maps} directions`);
        if (stats.contacts > 0) activities.push(`📞 ${stats.contacts} contacts`);
        
        if (activities.length > 0) {
            activityDiv.innerHTML = activities.map(a => 
                `<div class="p-2 bg-slate-50 rounded-lg text-sm">${a}</div>`
            ).join('');
        } else {
            activityDiv.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">No activity yet</p>';
        }
    }
}

// ==================== NOTIFICATIONS ====================
function toggleNotifications() {
    const drop = document.getElementById('notificationDropdown');
    if (drop) {
        drop.classList.toggle('hidden');
        console.log('Notifications toggled:', !drop.classList.contains('hidden'));
        if (!drop.classList.contains('hidden')) {
            const badge = document.getElementById('notifBadge');
            if (badge) badge.classList.add('hidden');
        }
    }
}

function addNotification(title, message, icon = 'bell') {
    const notif = {
        id: Date.now(),
        title,
        message,
        icon,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    notifications.unshift(notif);
    if (notifications.length > 10) notifications.pop();
    updateNotificationUI();

    const badge = document.getElementById('notifBadge');
    if (badge) {
        const count = parseInt(badge.innerText || '0') + 1;
        badge.innerText = count;
        badge.classList.remove('hidden');
    }
}

function updateNotificationUI() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="p-8 text-center text-slate-400">
                <i data-lucide="bell-off" class="w-8 h-8 mx-auto mb-2 opacity-20"></i>
                <p class="text-sm">No notifications</p>
            </div>`;
    } else {
        list.innerHTML = notifications.map(n => `
            <div class="px-4 py-3 hover:bg-slate-50 transition-colors border-b last:border-0 flex gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="${n.icon}" class="w-4 h-4"></i>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <p class="text-sm font-medium">${n.title}</p>
                        <span class="text-xs text-slate-400">${n.time}</span>
                    </div>
                    <p class="text-xs text-slate-500 mt-0.5">${n.message}</p>
                </div>
            </div>
        `).join('');
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function clearNotifications() {
    notifications = [];
    updateNotificationUI();
    showToast('Notifications cleared', 'success');
}

// ==================== TOAST SYSTEM ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
    const color = type === 'success' ? 'text-emerald-500 bg-emerald-50' : 
                  type === 'error' ? 'text-red-500 bg-red-50' : 'text-indigo-500 bg-indigo-50';
    
    toast.className = `toast-enter flex items-center gap-3 px-5 py-3 rounded-full shadow-xl bg-white border pointer-events-auto mb-2`;
    toast.innerHTML = `
        <div class="w-6 h-6 rounded-full flex items-center justify-center ${color}">
            <i data-lucide="${icon}" class="w-4 h-4"></i>
        </div>
        <span class="text-sm font-medium text-slate-700">${message}</span>
    `;
    
    container.appendChild(toast);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    setTimeout(() => toast.classList.add('toast-active'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-active');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== UTILITY FUNCTIONS ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make functions globally available
window.switchView = switchView;
window.toggleNotifications = toggleNotifications;
window.clearNotifications = clearNotifications;
window.toggleProfileMenu = toggleProfileMenu;
window.viewMyProfile = viewMyProfile;
window.closeProfileModal = closeProfileModal;
window.logout = logout;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.downloadQR = downloadQR;
window.simulateScan = simulateScan;
window.syncToRealTimeLocation = syncToRealTimeLocation;
window.openLocationSearch = openLocationSearch;
window.selectAddress = selectAddress;
window.focusOnBusiness = focusOnBusiness;
window.showBusinessPopupFromId = showBusinessPopupFromId;
window.closeBusinessPopup = closeBusinessPopup;
window.getDirectionsToBusiness = getDirectionsToBusiness;
window.sendMessageToBusiness = sendMessageToBusiness;
window.closeMessageModal = closeMessageModal;
window.handleSendMessage = handleSendMessage;
window.addPortfolioItem = addPortfolioItem;
window.triggerPortfolioUpload = triggerPortfolioUpload;
window.updatePortfolioName = updatePortfolioName;
window.removePortfolioItem = removePortfolioItem;
window.saveBusinessProfile = saveBusinessProfile;
window.sync = sync;
window.handleCoverUpload = handleCoverUpload;
window.uploadProfilePicture = uploadProfilePicture;
window.updateAnalyticsCharts = updateAnalyticsCharts;
