// Data Management Module
const DataManager = {
    // Initialize data
    initialize() {
        if (!localStorage.getItem('adport_businesses')) {
            const initialBusinesses = [
                {
                    id: 1,
                    name: "Lumina Architecture",
                    category: "Design",
                    location: "New York, NY",
                    address: "42 Wall Street, Suite 200, New York, NY 10005",
                    phone: "+1 (212) 555-0123",
                    email: "hello@lumina.arch",
                    whatsapp: "+12125550123",
                    rating: 4.9,
                    reviews: 124,
                    description: "At Lumina Architecture, we believe in creating spaces that inspire human connection. With over 15 years of experience in the New York architectural scene, our team focuses on sustainable materials, fluid transitions, and minimalist aesthetics.",
                    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
                    logo: "LA",
                    images: [
                        "https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800"
                    ],
                    hours: "Mon-Fri: 9am-6pm, Sat: 10am-4pm",
                    priceRange: "$$$",
                    status: "active",
                    createdAt: new Date().toISOString(),
                    views: 15420,
                    clicks: 3892,
                    qrScans: 1204,
                    conversations: 156
                },
                {
                    id: 2,
                    name: "Green Eat Co.",
                    category: "Restaurant",
                    location: "Austin, TX",
                    address: "123 South Congress Ave, Austin, TX 78704",
                    phone: "+1 (512) 555-0456",
                    email: "hello@greeneat.co",
                    whatsapp: "+15125550456",
                    rating: 4.7,
                    reviews: 89,
                    description: "Farm-to-table restaurant specializing in organic, locally-sourced ingredients. Our menu changes seasonally to bring you the freshest flavors Texas has to offer.",
                    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
                    logo: "GE",
                    images: [
                        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800"
                    ],
                    hours: "Sun-Thu: 11am-10pm, Fri-Sat: 11am-12am",
                    priceRange: "$$",
                    status: "active",
                    createdAt: new Date().toISOString(),
                    views: 8750,
                    clicks: 2100,
                    qrScans: 856,
                    conversations: 89
                },
                {
                    id: 3,
                    name: "Revive Wellness",
                    category: "Health",
                    location: "Miami, FL",
                    address: "500 Ocean Drive, Miami Beach, FL 33139",
                    phone: "+1 (305) 555-0789",
                    email: "care@revive.wellness",
                    whatsapp: "+13055550789",
                    rating: 5.0,
                    reviews: 56,
                    description: "Holistic wellness center offering yoga, meditation, and natural healing therapies. Our expert practitioners are dedicated to your physical and mental wellbeing.",
                    coverImage: "https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&q=80&w=1200",
                    logo: "RW",
                    images: [
                        "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&q=80&w=800"
                    ],
                    hours: "Daily: 7am-9pm",
                    priceRange: "$$$",
                    status: "active",
                    createdAt: new Date().toISOString(),
                    views: 6230,
                    clicks: 1840,
                    qrScans: 567,
                    conversations: 45
                }
            ];
            localStorage.setItem('adport_businesses', JSON.stringify(initialBusinesses));
        }

        if (!localStorage.getItem('adport_media')) {
            localStorage.setItem('adport_media', JSON.stringify([]));
        }

        if (!localStorage.getItem('adport_qrcodes')) {
            localStorage.setItem('adport_qrcodes', JSON.stringify([]));
        }

        if (!localStorage.getItem('adport_analytics')) {
            const analytics = {
                daily: this.generateDailyData(),
                weekly: this.generateWeeklyData(),
                monthly: this.generateMonthlyData()
            };
            localStorage.setItem('adport_analytics', JSON.stringify(analytics));
        }
    },

    generateDailyData() {
        const data = [];
        for (let i = 0; i < 7; i++) {
            data.push({
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                views: Math.floor(Math.random() * 1000) + 500,
                clicks: Math.floor(Math.random() * 500) + 200,
                scans: Math.floor(Math.random() * 300) + 100
            });
        }
        return data.reverse();
    },

    generateWeeklyData() {
        const data = [];
        for (let i = 0; i < 4; i++) {
            data.push({
                week: `Week ${i + 1}`,
                views: Math.floor(Math.random() * 5000) + 2000,
                clicks: Math.floor(Math.random() * 2500) + 1000,
                scans: Math.floor(Math.random() * 1500) + 500
            });
        }
        return data;
    },

    generateMonthlyData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return months.map(month => ({
            month,
            views: Math.floor(Math.random() * 20000) + 8000,
            clicks: Math.floor(Math.random() * 10000) + 4000,
            scans: Math.floor(Math.random() * 6000) + 2000
        }));
    },

    // Business operations
    getBusinesses() {
        return JSON.parse(localStorage.getItem('adport_businesses')) || [];
    },

    addBusiness(business) {
        const businesses = this.getBusinesses();
        const newBusiness = {
            ...business,
            id: Date.now(),
            logo: business.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase(),
            createdAt: new Date().toISOString(),
            views: 0,
            clicks: 0,
            qrScans: 0,
            conversations: 0
        };
        businesses.push(newBusiness);
        localStorage.setItem('adport_businesses', JSON.stringify(businesses));
        
        // Generate QR code for the business
        this.generateQRCode(newBusiness.id, `https://adport.com/business/${newBusiness.id}`);
        
        return newBusiness;
    },

    updateBusiness(updatedBusiness) {
        const businesses = this.getBusinesses();
        const index = businesses.findIndex(b => b.id === updatedBusiness.id);
        if (index !== -1) {
            businesses[index] = { ...businesses[index], ...updatedBusiness };
            localStorage.setItem('adport_businesses', JSON.stringify(businesses));
        }
        return businesses[index];
    },

    deleteBusiness(id) {
        const businesses = this.getBusinesses();
        const filtered = businesses.filter(b => b.id !== id);
        localStorage.setItem('adport_businesses', JSON.stringify(filtered));
        
        // Delete associated media and QR codes
        this.deleteBusinessMedia(id);
        this.deleteBusinessQRCode(id);
    },

    // Media operations
    getMedia() {
        return JSON.parse(localStorage.getItem('adport_media')) || [];
    },

    addMedia(mediaItem) {
        const media = this.getMedia();
        const newMedia = {
            ...mediaItem,
            id: Date.now(),
            uploadedAt: new Date().toISOString()
        };
        media.push(newMedia);
        localStorage.setItem('adport_media', JSON.stringify(media));
        return newMedia;
    },

    deleteMedia(id) {
        const media = this.getMedia();
        const filtered = media.filter(m => m.id !== id);
        localStorage.setItem('adport_media', JSON.stringify(filtered));
    },

    getBusinessMedia(businessId) {
        const media = this.getMedia();
        return media.filter(m => m.businessId === businessId);
    },

    deleteBusinessMedia(businessId) {
        const media = this.getMedia();
        const filtered = media.filter(m => m.businessId !== businessId);
        localStorage.setItem('adport_media', JSON.stringify(filtered));
    },

    // QR Code operations
    getQRCodes() {
        return JSON.parse(localStorage.getItem('adport_qrcodes')) || [];
    },

    generateQRCode(businessId, url) {
        const qrcodes = this.getQRCodes();
        const newQR = {
            id: Date.now(),
            businessId,
            url,
            createdAt: new Date().toISOString(),
            scans: 0,
            downloads: 0
        };
        qrcodes.push(newQR);
        localStorage.setItem('adport_qrcodes', JSON.stringify(qrcodes));
        return newQR;
    },

    getBusinessQRCode(businessId) {
        const qrcodes = this.getQRCodes();
        return qrcodes.find(q => q.businessId === businessId);
    },

    incrementQRScan(businessId) {
        const businesses = this.getBusinesses();
        const business = businesses.find(b => b.id === businessId);
        if (business) {
            business.qrScans = (business.qrScans || 0) + 1;
            this.updateBusiness(business);
        }

        const qrcodes = this.getQRCodes();
        const qrcode = qrcodes.find(q => q.businessId === businessId);
        if (qrcode) {
            qrcode.scans = (qrcode.scans || 0) + 1;
            localStorage.setItem('adport_qrcodes', JSON.stringify(qrcodes));
        }
    },

    deleteBusinessQRCode(businessId) {
        const qrcodes = this.getQRCodes();
        const filtered = qrcodes.filter(q => q.businessId !== businessId);
        localStorage.setItem('adport_qrcodes', JSON.stringify(filtered));
    },

    // Analytics operations
    getAnalytics() {
        return JSON.parse(localStorage.getItem('adport_analytics')) || {};
    },

    getBusinessAnalytics(businessId) {
        const businesses = this.getBusinesses();
        const business = businesses.find(b => b.id === businessId);
        if (!business) return null;

        return {
            views: business.views || 0,
            clicks: business.clicks || 0,
            qrScans: business.qrScans || 0,
            conversations: business.conversations || 0,
            rating: business.rating || 0,
            reviews: business.reviews || 0
        };
    },

    getAllAnalytics() {
        const businesses = this.getBusinesses();
        const total = {
            totalViews: 0,
            totalClicks: 0,
            totalQRScans: 0,
            totalConversations: 0,
            avgRating: 0,
            totalReviews: 0
        };

        businesses.forEach(business => {
            total.totalViews += business.views || 0;
            total.totalClicks += business.clicks || 0;
            total.totalQRScans += business.qrScans || 0;
            total.totalConversations += business.conversations || 0;
            total.totalReviews += business.reviews || 0;
            total.avgRating += business.rating || 0;
        });

        if (businesses.length > 0) {
            total.avgRating = (total.avgRating / businesses.length).toFixed(1);
        }

        return total;
    },

    recordClick(businessId) {
        const businesses = this.getBusinesses();
        const business = businesses.find(b => b.id === businessId);
        if (business) {
            business.clicks = (business.clicks || 0) + 1;
            this.updateBusiness(business);
        }
    },

    recordView(businessId) {
        const businesses = this.getBusinesses();
        const business = businesses.find(b => b.id === businessId);
        if (business) {
            business.views = (business.views || 0) + 1;
            this.updateBusiness(business);
        }
    },

    recordConversation(businessId) {
        const businesses = this.getBusinesses();
        const business = businesses.find(b => b.id === businessId);
        if (business) {
            business.conversations = (business.conversations || 0) + 1;
            this.updateBusiness(business);
        }
    }
};

// Toast notification system
const Toast = {
    show(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${this.getIcon(type)}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    getIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
};

// Initialize data on load
DataManager.initialize();