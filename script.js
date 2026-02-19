import { 
    auth, 
    registerUser, 
    loginUser, 
    logoutUser, 
    listenAuth,
    saveBusiness,
    loadBusiness,
    listenBusiness,
    listenAllBusinesses,
    logActivity,
    listenAnalytics
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
    location: { lat: 40.7128, lng: -74.0060 }
};

let businesses = [];
let dashboardMap, editorMap, marker, businessMarkers = [];
let qrcodeModal;
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

    // Setup auth form
    setupAuthForm();

    // Listen to auth state
    listenAuth(handleAuthChange);
});

function setupAuthForm() {
    const authForm = document.getElementById('authForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
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

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const email = document.getElementById('authEmail')?.value;
            const password = document.getElementById('authPassword')?.value;
            
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
    }
}

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
            
            // Initialize QR code
            initQRCode();
            
            // Initialize charts
            initCharts();
            
            // Sync UI with state
            sync();
            renderPortfolioGrid();
            
            // Set profile initial
            updateProfileDisplay();
            
            // Listen to business updates
            if (unsubscribeBusiness) unsubscribeBusiness();
            unsubscribeBusiness = listenBusiness(user.uid, (data) => {
                if (data) {
                    appState = { ...appState, ...data };
                    sync();
                    renderPortfolioGrid();
                    updateDashboardMarker();
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
                    businesses = allBusinesses.filter(b => b.id !== user.uid);
                    renderBusinessList();
                    updateBusinessMarkers();
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
            location: { lat: 40.7128, lng: -74.0060 }
        };
        
        businesses = [];
        stats = {
            views: 0,
            scans: 0,
            maps: 0,
            contacts: 0,
            today: 0
        };
    }
}

function updateProfileDisplay() {
    const initial = appState.name ? appState.name.charAt(0).toUpperCase() : 'B';
    
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
    
    // Update appState from inputs
    const inputName = document.getElementById('inputName');
    const inputTagline = document.getElementById('inputTagline');
    const inputDesc = document.getElementById('inputDesc');
    const inputAddress = document.getElementById('inputAddress');
    const inputPhone = document.getElementById('inputPhone');
    const inputEmail = document.getElementById('inputEmail');
    
    if (inputName) appState.name = inputName.value;
    if (inputTagline) appState.tagline = inputTagline.value;
    if (inputDesc) appState.desc = inputDesc.value;
    if (inputAddress) appState.address = inputAddress.value;
    if (inputPhone) appState.phone = inputPhone.value;
    if (inputEmail) appState.email = inputEmail.value;

    // Update dashboard displays
    const businessNameDisplay = document.getElementById('businessNameDisplay');
    const businessAddressDisplay = document.getElementById('businessAddressDisplay');
    
    if (businessNameDisplay) businessNameDisplay.innerText = appState.name || 'Your Business';
    if (businessAddressDisplay) businessAddressDisplay.innerText = appState.address || 'Set your location';
    
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
    
    document.getElementById('profileModalName').innerText = appState.name || 'Your Business';
    document.getElementById('profileModalTagline').innerText = appState.tagline || '';
    document.getElementById('profileModalDesc').innerText = appState.desc || 'No description yet';
    document.getElementById('profileModalPhone').innerText = appState.phone || 'Not provided';
    document.getElementById('profileModalEmail').innerText = appState.email || 'Not provided';
    document.getElementById('profileModalAddress').innerText = appState.address || 'Not set';
    
    modal.classList.remove('hidden');
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

    // Add other business markers
    if (businesses && businesses.length > 0) {
        businesses.forEach(business => {
            if (business.location && business.location.lat) {
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
        </div>
    ` : `
        <div class="text-center min-w-[150px]">
            <h3 class="font-bold">${business.name || 'Business'}</h3>
            <p class="text-xs text-slate-500 mt-1">${business.address || 'Location set'}</p>
        </div>
    `;

    marker.bindPopup(popupContent);
    businessMarkers.push({ id: business.id, marker, isCurrent });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
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
    
    // Add new business markers
    if (businesses && businesses.length > 0) {
        businesses.forEach(business => {
            if (business.location && business.location.lat) {
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
            </div>
        `);
    }
}

function focusOnBusiness(businessId) {
    if (!dashboardMap) return;
    
    let target;
    if (businessId === 'current') {
        target = appState;
    } else {
        target = businesses.find(b => b.id === businessId);
    }
    
    if (target && target.location) {
        dashboardMap.setView([target.location.lat, target.location.lng], 16);
        
        const marker = businessMarkers.find(m => m.id === businessId);
        if (marker) marker.marker.openPopup();
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
    
    if (!businesses || businesses.length === 0) {
        list.innerHTML = `
            <div class="p-8 text-center text-slate-400">
                <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 opacity-20"></i>
                <p class="text-sm">No other businesses yet</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    list.innerHTML = businesses.map(business => `
        <div class="p-4 border-b hover:bg-slate-50 transition-colors cursor-pointer" onclick="focusOnBusiness('${business.id}')">
            <div class="flex gap-3">
                <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    <i data-lucide="store" class="w-8 h-8"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold">${business.name || 'Business'}</h3>
                    <p class="text-xs text-slate-500 mt-1">${business.address || 'Location not set'}</p>
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
    
    // Clear existing QR code
    qrElement.innerHTML = '';
    
    const link = `https://www.google.com/maps/search/?api=1&query=${appState.location.lat},${appState.location.lng}`;
    
    if (typeof QRCode !== 'undefined') {
        qrcodeModal = new QRCode(qrElement, {
            text: link,
            width: 200,
            height: 200
        });
    }
}

function updateQRCode() {
    if (!qrcodeModal) return;
    
    const link = `https://www.google.com/maps/search/?api=1&query=${appState.location.lat},${appState.location.lng}`;
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
    // Generate realistic data based on actual stats
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
            location: appState.location
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
            }
            showToast('Profile picture updated!', 'success');
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
    if (businessCount) businessCount.innerText = (businesses?.length || 0) + 1;
    
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
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.downloadQR = downloadQR;
window.simulateScan = simulateScan;
window.syncToRealTimeLocation = syncToRealTimeLocation;
window.openLocationSearch = openLocationSearch;
window.selectAddress = selectAddress;
window.focusOnBusiness = focusOnBusiness;
window.addPortfolioItem = addPortfolioItem;
window.triggerPortfolioUpload = triggerPortfolioUpload;
window.updatePortfolioName = updatePortfolioName;
window.removePortfolioItem = removePortfolioItem;
window.saveBusinessProfile = saveBusinessProfile;
window.sync = sync;
window.handleCoverUpload = handleCoverUpload;
window.uploadProfilePicture = uploadProfilePicture;
window.updateAnalyticsCharts = updateAnalyticsCharts;
