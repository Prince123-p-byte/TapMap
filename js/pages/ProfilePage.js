(function() {
    const ProfilePage = ({ business, onBack, currentUser, userData, baseUrl }) => {
        const [activeTab, setActiveTab] = React.useState('about');
        const [contactMessage, setContactMessage] = React.useState('');
        const [distance, setDistance] = React.useState(null);
        const [isOwner, setIsOwner] = React.useState(false);
        const [reviews, setReviews] = React.useState([]);
        const [newReview, setNewReview] = React.useState({ rating: 5, comment: '' });
        const [userReview, setUserReview] = React.useState(null);
        const [loadingReviews, setLoadingReviews] = React.useState(false);
        const [submittingReview, setSubmittingReview] = React.useState(false);
        const [hasNotifiedView, setHasNotifiedView] = React.useState(false);

        // Format location safely
        const formatLocation = (location) => {
            if (!location) return 'Location not specified';
            if (typeof location === 'string') return location;
            if (typeof location === 'object') {
                if (location.lat && location.lng) {
                    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
                }
                if (location.address) return location.address;
                return 'Location available';
            }
            return String(location);
        };

        // Load reviews when component mounts
        React.useEffect(() => {
            if (business?.id) {
                loadReviews();
            }
        }, [business?.id]);

        // Load reviews from Firebase with error handling
        const loadReviews = async () => {
            setLoadingReviews(true);
            try {
                let snapshot;
                try {
                    snapshot = await db.collection('reviews')
                        .where('businessId', '==', business.id)
                        .orderBy('createdAt', 'desc')
                        .get();
                } catch (indexError) {
                    console.log('Index not ready, loading without order');
                    snapshot = await db.collection('reviews')
                        .where('businessId', '==', business.id)
                        .get();
                }

                const reviewsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                reviewsData.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB - dateA;
                });

                setReviews(reviewsData);

                if (currentUser) {
                    const userReview = reviewsData.find(r => r.userId === currentUser.uid);
                    if (userReview) {
                        setUserReview(userReview);
                        setNewReview({ rating: userReview.rating, comment: userReview.comment });
                    }
                }

                if (reviewsData.length > 0) {
                    const avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
                    await db.collection('businesses').doc(business.id).update({
                        rating: avgRating,
                        reviews: reviewsData.length
                    }).catch(console.error);
                }
            } catch (error) {
                console.error('Error loading reviews:', error);
                Toast.show('Error loading reviews', 'error');
            } finally {
                setLoadingReviews(false);
            }
        };

        // Create notification helper - stores in Firebase even if user is logged out
        const createNotification = async (notification) => {
            try {
                await db.collection('notifications').add({
                    ...notification,
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('Notification created:', notification);
            } catch (error) {
                console.error('Error creating notification:', error);
            }
        };

        // Submit a review
        const handleSubmitReview = async () => {
            if (!currentUser) {
                Toast.show('Please sign in to leave a review', 'info');
                window.dispatchEvent(new CustomEvent('openAuthModal'));
                return;
            }

            if (!newReview.comment.trim()) {
                Toast.show('Please write a comment', 'error');
                return;
            }

            setSubmittingReview(true);
            try {
                const reviewData = {
                    businessId: business.id,
                    userId: currentUser.uid,
                    userName: userData?.name || currentUser.displayName || 'Anonymous',
                    userPhoto: currentUser.photoURL || null,
                    rating: newReview.rating,
                    comment: newReview.comment,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (userReview) {
                    await db.collection('reviews').doc(userReview.id).update(reviewData);
                    Toast.show('Review updated successfully', 'success');
                } else {
                    await db.collection('reviews').add(reviewData);
                    Toast.show('Review posted successfully', 'success');
                    
                    // Notify business owner about new review (if not self-review)
                    if (business.userId !== currentUser.uid) {
                        await createNotification({
                            userId: business.userId,
                            type: 'review',
                            title: 'New Review',
                            message: `⭐ ${userData?.name || currentUser.displayName || 'Someone'} reviewed your business "${business.name}"`,
                            link: `/business/${business.id}`,
                            icon: 'star',
                            businessId: business.id,
                            reviewerName: userData?.name || currentUser.displayName || 'Someone'
                        });
                    }
                }

                await loadReviews();
                setNewReview({ rating: 5, comment: '' });
            } catch (error) {
                console.error('Error submitting review:', error);
                Toast.show(error.message || 'Error posting review', 'error');
            } finally {
                setSubmittingReview(false);
            }
        };

        // Delete a review
        const handleDeleteReview = async () => {
            if (!userReview) return;
            
            if (confirm('Delete your review?')) {
                try {
                    await db.collection('reviews').doc(userReview.id).delete();
                    await loadReviews();
                    setUserReview(null);
                    setNewReview({ rating: 5, comment: '' });
                    Toast.show('Review deleted', 'warning');
                } catch (error) {
                    console.error('Error deleting review:', error);
                    Toast.show('Error deleting review', 'error');
                }
            }
        };

        // Check if current user owns this business and record view
        React.useEffect(() => {
            if (currentUser && business && business.userId === currentUser.uid) {
                setIsOwner(true);
            }

            // Record view and notify owner (only once per session)
            if (business?.id && !hasNotifiedView) {
                // Always increment view count
                db.collection('businesses').doc(business.id).update({
                    views: firebase.firestore.FieldValue.increment(1)
                }).catch(console.error);

                // Notify business owner about new view (if viewer is not the owner)
                if (business.userId && (!currentUser || currentUser.uid !== business.userId)) {
                    createNotification({
                        userId: business.userId,
                        type: 'view',
                        title: 'New View',
                        message: `👀 Someone viewed your business "${business.name}"`,
                        link: `/business/${business.id}`,
                        icon: 'eye',
                        businessId: business.id
                    }).catch(console.error);
                }
                setHasNotifiedView(true);
            }

            // Get user location for distance calculation
            if (navigator.geolocation && business?.address) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const proxy = 'https://cors-anywhere.herokuapp.com/';
                            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(business.address)}`;
                            const response = await fetch(proxy + url);
                            const data = await response.json();
                            
                            if (data && data.length > 0) {
                                const coords = {
                                    lat: parseFloat(data[0].lat),
                                    lon: parseFloat(data[0].lon)
                                };
                                const dist = GeolocationUtils.calculateDistance(
                                    position.coords.latitude,
                                    position.coords.longitude,
                                    coords.lat,
                                    coords.lon
                                );
                                setDistance(dist);
                            }
                        } catch (error) {
                            console.error('Error calculating distance:', error);
                        }
                    },
                    (error) => {
                        console.log('Location permission denied');
                    }
                );
            }
        }, [business?.id, business?.address, currentUser, hasNotifiedView]);

        // Get shareable URL
        const getBusinessUrl = () => {
            return `${baseUrl || 'https://prince123-p-byte.github.io/TapMap'}/?business=${business?.id}`;
        };

        // Smart Directions with notification
        const openDirections = async (mode = 'drive') => {
            if (!business?.address) {
                Toast.show('Address not available', 'error');
                return;
            }

            const encodedAddress = encodeURIComponent(business.address);
            const encodedName = encodeURIComponent(business.name);
            
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            
            const travelMode = {
                drive: 'driving',
                transit: 'transit',
                walk: 'walking',
                bike: 'bicycling'
            }[mode] || 'driving';
            
            if (/iPad|iPhone|iPod|Macintosh/.test(userAgent) && !window.MSStream) {
                const appleMapsUrl = `maps://?q=${encodedName}&daddr=${encodedAddress}&dirflg=${travelMode === 'walking' ? 'w' : 'd'}`;
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}`;
                
                window.location.href = appleMapsUrl;
                
                setTimeout(() => {
                    if (!document.hidden) {
                        window.open(googleMapsUrl, '_blank');
                    }
                }, 500);
            } else if (/android/i.test(userAgent)) {
                const intentUrl = `intent://maps/dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}#Intent;scheme=https;package=com.google.android.apps.maps;end`;
                const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}`;
                
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = intentUrl;
                document.body.appendChild(iframe);
                
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    if (!document.hidden) {
                        window.open(webUrl, '_blank');
                    }
                }, 500);
            } else {
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}`;
                window.open(mapsUrl, '_blank');
            }
            
            // Update click count
            await db.collection('businesses').doc(business.id).update({
                clicks: firebase.firestore.FieldValue.increment(1)
            }).catch(console.error);
            
            // Notify business owner about directions request (if viewer is not the owner)
            if (business.userId && (!currentUser || currentUser.uid !== business.userId)) {
                await createNotification({
                    userId: business.userId,
                    type: 'click',
                    title: 'Directions Requested',
                    message: `📍 Someone requested directions to "${business.name}"`,
                    link: `/business/${business.id}`,
                    icon: 'location-arrow',
                    businessId: business.id
                });
            }
            
            Toast.show('Opening directions...', 'info');
        };

        const handleContact = async (type) => {
            if (!business) return;
            
            await db.collection('businesses').doc(business.id).update({
                conversations: firebase.firestore.FieldValue.increment(1)
            }).catch(console.error);
            
            // Notify business owner about contact (if viewer is not the owner)
            if (business.userId && (!currentUser || currentUser.uid !== business.userId)) {
                await createNotification({
                    userId: business.userId,
                    type: 'contact',
                    title: 'Contact Made',
                    message: `📞 Someone tried to contact "${business.name}" via ${type}`,
                    link: `/business/${business.id}`,
                    icon: type === 'phone' ? 'phone' : type === 'whatsapp' ? 'whatsapp' : 'envelope',
                    businessId: business.id
                });
            }
            
            switch(type) {
                case 'phone':
                    window.location.href = `tel:${business.phone}`;
                    break;
                case 'whatsapp':
                    window.open(`https://wa.me/${business.whatsapp?.replace(/\D/g, '')}`, '_blank');
                    break;
                case 'email':
                    window.location.href = `mailto:${business.email}`;
                    break;
            }
        };

        const handleQRScan = async () => {
            if (!business) return;
            
            await db.collection('businesses').doc(business.id).update({
                qrScans: firebase.firestore.FieldValue.increment(1)
            }).catch(console.error);
            
            // Notify business owner about QR scan (if viewer is not the owner)
            if (business.userId && (!currentUser || currentUser.uid !== business.userId)) {
                await createNotification({
                    userId: business.userId,
                    type: 'qr',
                    title: 'QR Code Scanned',
                    message: `📱 Someone scanned your QR code for "${business.name}"`,
                    link: `/business/${business.id}`,
                    icon: 'qrcode',
                    businessId: business.id
                });
            }
            
            Toast.show('QR scan recorded!', 'success');
        };

        const handleShare = async () => {
            if (!business) return;
            
            const businessUrl = getBusinessUrl();
            const shareData = {
                title: business.name,
                text: `Check out ${business.name} on tapMap!`,
                url: businessUrl
            };
            
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        navigator.clipboard.writeText(businessUrl);
                        Toast.show('Link copied to clipboard!', 'success');
                    }
                }
            } else {
                navigator.clipboard.writeText(businessUrl);
                Toast.show('Link copied to clipboard!', 'success');
            }
        };

        const tabs = [
            { id: 'about', label: 'About' },
            { id: 'gallery', label: 'Gallery' },
            { id: 'reviews', label: `Reviews (${reviews.length})` },
            { id: 'contact', label: 'Contact' }
        ];

        const isOpenNow = () => {
            if (!business?.hours) return false;
            return true;
        };

        if (!business) {
            return React.createElement(
                'div',
                { className: "pt-20 text-center" },
                React.createElement(LoadingSpinner)
            );
        }

        const displayLocation = formatLocation(business.location || business.address || 'Location not specified');

        return React.createElement(
            'div',
            { className: "min-h-screen bg-gray-50" },
            // Cover Image
            React.createElement(
                'div',
                { className: "relative h-64 md:h-96 w-full" },
                React.createElement('img', {
                    src: business.coverImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
                    className: "w-full h-full object-cover",
                    alt: "Cover",
                    onError: (e) => { e.target.src = 'https://via.placeholder.com/1200x400?text=No+Cover'; }
                }),
                React.createElement('div', { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" }),
                
                // Back Button
                React.createElement(
                    'button',
                    {
                        onClick: onBack,
                        className: "absolute top-4 left-4 md:top-6 md:left-6 bg-white/90 backdrop-blur px-3 py-2 md:px-4 md:py-2 rounded-xl text-gray-700 font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg text-sm md:text-base"
                    },
                    React.createElement(Icon, { name: "arrow-left", size: 16 }),
                    "Back"
                ),
                
                isOwner && React.createElement(
                    'div',
                    { className: "absolute top-4 right-4 md:top-6 md:right-6 bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg text-sm md:text-base" },
                    React.createElement(Icon, { name: "crown", size: 16 }),
                    "You own this"
                )
            ),

            // Business Info Card
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4 -mt-16 md:-mt-20 relative z-10" },
                React.createElement(
                    'div',
                    { className: "bg-white rounded-2xl md:rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100" },
                    React.createElement(
                        'div',
                        { className: "flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center justify-between" },
                        React.createElement(
                            'div',
                            { className: "flex gap-4 md:gap-6 items-center w-full md:w-auto" },
                            // Logo / Profile Photo
                            React.createElement(
                                'div',
                                { className: "w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl md:text-4xl font-black shadow-lg flex-shrink-0 overflow-hidden" },
                                business.logo ? 
                                    React.createElement('img', { 
                                        src: business.logo, 
                                        alt: business.name,
                                        className: "w-full h-full object-cover",
                                        onError: (e) => { e.target.src = ''; }
                                    }) :
                                    (business.name?.charAt(0).toUpperCase() || 'B')
                            ),
                            // Basic Info
                            React.createElement(
                                'div',
                                { className: "flex-1" },
                                React.createElement(
                                    'div',
                                    { className: "flex flex-wrap items-center gap-2 mb-2" },
                                    React.createElement(
                                        'h1',
                                        { className: "text-xl md:text-3xl font-bold text-gray-900" },
                                        business.name
                                    ),
                                    React.createElement(
                                        'span',
                                        { className: "px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold" },
                                        "Verified"
                                    )
                                ),
                                React.createElement(
                                    'p',
                                    { className: "text-xs md:text-sm text-gray-500 flex flex-wrap items-center gap-2 mb-2" },
                                    React.createElement(Icon, { name: "building", size: 12 }),
                                    business.category,
                                    React.createElement('span', { className: "w-1 h-1 bg-gray-300 rounded-full" }),
                                    React.createElement(Icon, { name: "map-marker-alt", size: 12 }),
                                    displayLocation
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex flex-wrap items-center gap-3 md:gap-4" },
                                    React.createElement(
                                        'div',
                                        { className: "flex items-center gap-1" },
                                        React.createElement(Icon, { name: "star", size: 16, className: "text-amber-400 fill-current" }),
                                        React.createElement('span', { className: "font-bold text-sm md:text-base" }, (business.rating || 0).toFixed(1)),
                                        React.createElement('span', { className: "text-gray-400 text-xs" }, `(${business.reviews || 0})`)
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: "flex items-center gap-1" },
                                        React.createElement(Icon, { name: "eye", size: 14, className: "text-gray-400" }),
                                        React.createElement('span', { className: "text-xs md:text-sm" }, business.views?.toLocaleString() || 0, " views")
                                    ),
                                    distance && React.createElement(
                                        'div',
                                        { className: "flex items-center gap-1 text-indigo-600" },
                                        React.createElement(Icon, { name: "location-arrow", size: 12 }),
                                        React.createElement('span', { className: "text-xs" }, GeolocationUtils.formatDistance(distance), " away")
                                    )
                                )
                            )
                        ),
                        // Action Buttons
                        React.createElement(
                            'div',
                            { className: "flex flex-wrap gap-2 w-full md:w-auto" },
                            business.phone && React.createElement(
                                'button',
                                {
                                    onClick: () => handleContact('phone'),
                                    className: "flex-1 md:flex-none bg-indigo-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                },
                                React.createElement(Icon, { name: "phone", size: 14 }),
                                "Call"
                            ),
                            business.whatsapp && React.createElement(
                                'button',
                                {
                                    onClick: () => handleContact('whatsapp'),
                                    className: "flex-1 md:flex-none bg-green-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-200"
                                },
                                React.createElement(Icon, { name: "whatsapp", size: 14 }),
                                "Chat"
                            ),
                            business.email && React.createElement(
                                'button',
                                {
                                    onClick: () => handleContact('email'),
                                    className: "p-2 md:p-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                                },
                                React.createElement(Icon, { name: "envelope", size: 16 })
                            )
                        )
                    )
                )
            ),

            // Tabs and Content
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4 mt-6 md:mt-8" },
                // Tabs
                React.createElement(
                    'div',
                    { className: "bg-white rounded-xl p-4 border border-gray-100 mb-6 overflow-x-auto" },
                    React.createElement(
                        'div',
                        { className: "flex gap-4 md:gap-8 min-w-max" },
                        tabs.map(tab =>
                            React.createElement(
                                'button',
                                {
                                    key: tab.id,
                                    onClick: () => setActiveTab(tab.id),
                                    className: `pb-2 px-1 font-medium text-sm transition-all relative ${
                                        activeTab === tab.id
                                            ? 'text-indigo-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`
                                },
                                tab.label,
                                activeTab === tab.id && React.createElement(
                                    'div',
                                    { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" }
                                )
                            )
                        )
                    )
                ),

                // Tab Content
                activeTab === 'about' && React.createElement(
                    'div',
                    { className: "bg-white rounded-xl p-6 border border-gray-100 space-y-6" },
                    // Description
                    business.description && React.createElement(
                        'div',
                        null,
                        React.createElement('h3', { className: "text-lg font-bold mb-3" }, "About"),
                        React.createElement('p', { className: "text-gray-600 text-sm leading-relaxed" }, business.description)
                    ),
                    // Business Hours
                    business.hours && React.createElement(
                        'div',
                        null,
                        React.createElement('h3', { className: "text-lg font-bold mb-3" }, "Hours"),
                        React.createElement('p', { className: "text-gray-600 text-sm" }, business.hours)
                    ),
                    // Location & Directions
                    React.createElement(
                        'div',
                        null,
                        React.createElement('h3', { className: "text-lg font-bold mb-3" }, "Location"),
                        React.createElement(
                            'div',
                            { className: "bg-gray-50 rounded-xl p-4" },
                            React.createElement('p', { className: "font-medium text-sm mb-3" }, business.address || displayLocation),
                            React.createElement(
                                'div',
                                { className: "flex flex-wrap gap-2" },
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => openDirections('drive'),
                                        className: "flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                    },
                                    React.createElement(Icon, { name: "location-arrow", size: 14 }),
                                    "Directions"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: handleShare,
                                        className: "p-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
                                    },
                                    React.createElement(Icon, { name: "share-alt", size: 14 })
                                )
                            )
                        )
                    )
                ),

                activeTab === 'gallery' && React.createElement(
                    'div',
                    { className: "bg-white rounded-xl p-6 border border-gray-100" },
                    React.createElement(
                        'div',
                        { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" },
                        (business.images && business.images.length > 0 ? business.images : [
                            'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&q=80&w=800',
                            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
                            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800'
                        ]).map((img, i) =>
                            React.createElement(
                                'div',
                                { 
                                    key: i, 
                                    className: "aspect-square rounded-xl overflow-hidden cursor-pointer group",
                                    onClick: () => window.open(img, '_blank')
                                },
                                React.createElement('img', {
                                    src: img,
                                    className: "w-full h-full object-cover hover:scale-110 transition-transform duration-500",
                                    alt: `Gallery ${i + 1}`,
                                    onError: (e) => { e.target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found'; }
                                })
                            )
                        )
                    )
                ),

                activeTab === 'reviews' && React.createElement(
                    'div',
                    { className: "bg-white rounded-xl p-6 border border-gray-100" },
                    // Review Form
                    React.createElement(
                        'div',
                        { className: "mb-8 p-6 bg-gray-50 rounded-xl" },
                        React.createElement('h3', { className: "font-bold mb-4" }, 
                            userReview ? 'Edit Your Review' : 'Write a Review'
                        ),
                        // Rating Stars
                        React.createElement(
                            'div',
                            { className: "flex gap-2 mb-4" },
                            [1, 2, 3, 4, 5].map(star =>
                                React.createElement(
                                    'button',
                                    {
                                        key: star,
                                        type: "button",
                                        onClick: () => setNewReview({ ...newReview, rating: star }),
                                        className: `text-2xl transition-colors ${
                                            star <= newReview.rating ? 'text-amber-400' : 'text-gray-300'
                                        } hover:text-amber-500`
                                    },
                                    '★'
                                )
                            )
                        ),
                        // Review Comment
                        React.createElement(
                            'textarea',
                            {
                                value: newReview.comment,
                                onChange: (e) => setNewReview({ ...newReview, comment: e.target.value }),
                                placeholder: "Share your experience...",
                                className: "w-full p-4 border border-gray-200 rounded-xl mb-4",
                                rows: "4"
                            }
                        ),
                        // Submit Button
                        React.createElement(
                            'div',
                            { className: "flex gap-3" },
                            React.createElement(
                                'button',
                                {
                                    onClick: handleSubmitReview,
                                    disabled: !newReview.comment.trim() || submittingReview,
                                    className: `bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 ${
                                        !newReview.comment.trim() || submittingReview ? 'opacity-50 cursor-not-allowed' : ''
                                    }`
                                },
                                submittingReview && React.createElement(Icon, { name: "spinner", className: "animate-spin" }),
                                submittingReview ? 'Posting...' : (userReview ? 'Update Review' : 'Submit Review')
                            ),
                            userReview && React.createElement(
                                'button',
                                {
                                    onClick: handleDeleteReview,
                                    className: "bg-red-50 text-red-600 px-6 py-3 rounded-xl font-medium hover:bg-red-100 transition-all"
                                },
                                "Delete"
                            )
                        )
                    ),

                    // Reviews List
                    React.createElement(
                        'div',
                        { className: "space-y-6" },
                        loadingReviews ? React.createElement(LoadingSpinner) :
                        reviews.length === 0 ? React.createElement(
                            'div',
                            { className: "text-center py-8 text-gray-500" },
                            React.createElement(Icon, { name: "star", size: 32, className: "mx-auto mb-2 opacity-50" }),
                            React.createElement('p', null, "No reviews yet. Be the first to review!")
                        ) :
                        reviews.map(review =>
                            React.createElement(
                                'div',
                                { key: review.id, className: "border-b border-gray-100 last:border-0 pb-6 last:pb-0" },
                                React.createElement(
                                    'div',
                                    { className: "flex items-start gap-4 mb-3" },
                                    // User Avatar
                                    React.createElement(
                                        'div',
                                        { className: "w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0 overflow-hidden" },
                                        review.userPhoto ?
                                            React.createElement('img', { 
                                                src: review.userPhoto, 
                                                alt: review.userName,
                                                className: "w-full h-full object-cover"
                                            }) :
                                            (review.userName?.charAt(0).toUpperCase() || 'U')
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: "flex-1" },
                                        React.createElement(
                                            'div',
                                            { className: "flex flex-wrap items-center justify-between gap-2 mb-1" },
                                            React.createElement(
                                                'h4',
                                                { className: "font-medium text-gray-900" },
                                                review.userName
                                            ),
                                            React.createElement(
                                                'div',
                                                { className: "flex gap-1" },
                                                [1, 2, 3, 4, 5].map(star =>
                                                    React.createElement(
                                                        'span',
                                                        { key: star, className: star <= review.rating ? 'text-amber-400' : 'text-gray-300' },
                                                        '★'
                                                    )
                                                )
                                            )
                                        ),
                                        React.createElement(
                                            'p',
                                            { className: "text-xs text-gray-400 mb-2" },
                                            review.createdAt?.toDate ? 
                                                new Date(review.createdAt.toDate()).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                }) : 
                                                'Just now'
                                        ),
                                        React.createElement(
                                            'p',
                                            { className: "text-gray-600 text-sm" },
                                            review.comment
                                        )
                                    )
                                )
                            )
                        )
                    )
                ),

                activeTab === 'contact' && React.createElement(
                    'div',
                    { className: "bg-white rounded-xl p-6 border border-gray-100" },
                    React.createElement(
                        'div',
                        { className: "space-y-4" },
                        business.phone && React.createElement(
                            'div',
                            { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleContact('phone') },
                            React.createElement(
                                'div',
                                { className: "w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center" },
                                React.createElement(Icon, { name: "phone", size: 16 })
                            ),
                            React.createElement(
                                'div',
                                { className: "flex-1" },
                                React.createElement('div', { className: "text-xs text-gray-500" }, "Phone"),
                                React.createElement('div', { className: "font-medium text-sm" }, business.phone)
                            )
                        ),
                        business.whatsapp && React.createElement(
                            'div',
                            { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleContact('whatsapp') },
                            React.createElement(
                                'div',
                                { className: "w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center" },
                                React.createElement(Icon, { name: "whatsapp", size: 16 })
                            ),
                            React.createElement(
                                'div',
                                { className: "flex-1" },
                                React.createElement('div', { className: "text-xs text-gray-500" }, "WhatsApp"),
                                React.createElement('div', { className: "font-medium text-sm" }, business.whatsapp)
                            )
                        ),
                        business.email && React.createElement(
                            'div',
                            { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleContact('email') },
                            React.createElement(
                                'div',
                                { className: "w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center" },
                                React.createElement(Icon, { name: "envelope", size: 16 })
                            ),
                            React.createElement(
                                'div',
                                { className: "flex-1" },
                                React.createElement('div', { className: "text-xs text-gray-500" }, "Email"),
                                React.createElement('div', { className: "font-medium text-sm" }, business.email)
                            )
                        )
                    )
                )
            ),

            // QR Code Section
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4 mt-6 mb-8" },
                React.createElement(
                    'div',
                    { className: "bg-white rounded-xl p-6 border border-gray-100" },
                    React.createElement(
                        'div',
                        { className: "flex flex-col md:flex-row items-center gap-6" },
                        React.createElement(
                            'div',
                            { className: "bg-white p-3 rounded-xl shadow-lg" },
                            React.createElement('img', {
                                src: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(getBusinessUrl())}`,
                                alt: "QR Code",
                                className: "w-24 h-24 md:w-32 md:h-32"
                            })
                        ),
                        React.createElement(
                            'div',
                            { className: "flex-1 text-center md:text-left" },
                            React.createElement('h3', { className: "font-bold text-lg mb-2" }, "Share this business"),
                            React.createElement('p', { className: "text-gray-500 text-sm mb-4" },
                                "Scan QR code or copy link to share"
                            ),
                            React.createElement(
                                'div',
                                { className: "flex flex-wrap gap-2 justify-center md:justify-start" },
                                React.createElement(
                                    'a',
                                    {
                                        href: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getBusinessUrl())}`,
                                        download: `${business.name}-qrcode.png`,
                                        onClick: handleQRScan,
                                        className: "bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center gap-2"
                                    },
                                    React.createElement(Icon, { name: "download", size: 14 }),
                                    "Download QR"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: handleShare,
                                        className: "border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
                                    },
                                    React.createElement(Icon, { name: "share-alt", size: 14 }),
                                    "Share Link"
                                )
                            )
                        )
                    )
                )
            )
        );
    };

    window.ProfilePage = ProfilePage;
})();