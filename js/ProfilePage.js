// js/ProfilePage.js
(function() {
    const ProfilePage = ({ business, onBack, currentUser, userData, baseUrl }) => {
        const [activeTab, setActiveTab] = React.useState('about');
        const [distance, setDistance] = React.useState(null);
        const [isOwner, setIsOwner] = React.useState(false);
        const [reviews, setReviews] = React.useState([]);
        const [newReview, setNewReview] = React.useState({ rating: 5, comment: '' });
        const [userReview, setUserReview] = React.useState(null);
        const [loadingReviews, setLoadingReviews] = React.useState(false);
        const [submittingReview, setSubmittingReview] = React.useState(false);
        const [hasNotifiedView, setHasNotifiedView] = React.useState(false);

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

        React.useEffect(() => {
            if (business?.id) {
                loadReviews();
            }
        }, [business?.id]);

        const loadReviews = async () => {
            setLoadingReviews(true);
            try {
                const { data, error } = await window.supabase
                    .from('reviews')
                    .select('*')
                    .eq('business_id', business.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const reviewsData = data || [];
                setReviews(reviewsData);

                if (currentUser) {
                    const userReview = reviewsData.find(r => r.user_id === currentUser.id);
                    if (userReview) {
                        setUserReview(userReview);
                        setNewReview({ rating: userReview.rating, comment: userReview.comment });
                    }
                }

                if (reviewsData.length > 0) {
                    const avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
                    
                    await window.supabase
                        .from('businesses')
                        .update({
                            rating: avgRating,
                            reviews: reviewsData.length
                        })
                        .eq('id', business.id);
                }
            } catch (error) {
                console.error('Error loading reviews:', error);
                window.Toast?.show('Error loading reviews', 'error');
            } finally {
                setLoadingReviews(false);
            }
        };

        const createNotification = async (notification) => {
            try {
                const { error } = await window.supabase
                    .from('notifications')
                    .insert([{
                        ...notification,
                        read: false,
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                console.log('Notification created:', notification);
            } catch (error) {
                console.error('Error creating notification:', error);
            }
        };

        const handleSubmitReview = async () => {
            if (!currentUser) {
                window.Toast?.show('Please sign in to leave a review', 'info');
                window.dispatchEvent(new CustomEvent('openAuthModal'));
                return;
            }

            if (!newReview.comment.trim()) {
                window.Toast?.show('Please write a comment', 'error');
                return;
            }

            setSubmittingReview(true);
            try {
                const reviewData = {
                    business_id: business.id,
                    user_id: currentUser.id,
                    user_name: userData?.name || currentUser.email?.split('@')[0] || 'Anonymous',
                    rating: newReview.rating,
                    comment: newReview.comment,
                    created_at: new Date().toISOString()
                };

                if (userReview) {
                    const { error } = await window.supabase
                        .from('reviews')
                        .update(reviewData)
                        .eq('id', userReview.id);

                    if (error) throw error;
                    window.Toast?.show('Review updated successfully', 'success');
                } else {
                    const { error } = await window.supabase
                        .from('reviews')
                        .insert([reviewData]);

                    if (error) throw error;
                    window.Toast?.show('Review posted successfully', 'success');
                    
                    if (business.user_id !== currentUser.id) {
                        await createNotification({
                            user_id: business.user_id,
                            type: 'review',
                            title: 'New Review',
                            message: `⭐ ${userData?.name || currentUser.email?.split('@')[0] || 'Someone'} reviewed your business "${business.name}"`,
                            icon: 'star',
                            business_id: business.id
                        });
                    }
                }

                await loadReviews();
                setNewReview({ rating: 5, comment: '' });
            } catch (error) {
                console.error('Error submitting review:', error);
                window.Toast?.show(error.message || 'Error posting review', 'error');
            } finally {
                setSubmittingReview(false);
            }
        };

        const handleDeleteReview = async () => {
            if (!userReview) return;
            
            if (confirm('Delete your review?')) {
                try {
                    const { error } = await window.supabase
                        .from('reviews')
                        .delete()
                        .eq('id', userReview.id);

                    if (error) throw error;

                    await loadReviews();
                    setUserReview(null);
                    setNewReview({ rating: 5, comment: '' });
                    window.Toast?.show('Review deleted', 'warning');
                } catch (error) {
                    console.error('Error deleting review:', error);
                    window.Toast?.show('Error deleting review', 'error');
                }
            }
        };

        React.useEffect(() => {
            if (currentUser && business && business.user_id === currentUser.id) {
                setIsOwner(true);
            }

            if (business?.id && !hasNotifiedView) {
                // Increment view count - safely handle if RPC doesn't exist
                const incrementView = async () => {
                    try {
                        // Try RPC first
                        await window.supabase.rpc('increment_analytics', {
                            p_business_id: business.id,
                            p_field: 'views'
                        });
                    } catch (rpcError) {
                        console.log('RPC not available, using direct update');
                        // Fallback to direct update
                        try {
                            await window.supabase
                                .from('businesses')
                                .update({ views: (business.views || 0) + 1 })
                                .eq('id', business.id);
                        } catch (updateError) {
                            console.error('Failed to update views:', updateError);
                        }
                    }
                };
                
                incrementView();

                if (business.user_id && (!currentUser || currentUser.id !== business.user_id)) {
                    createNotification({
                        user_id: business.user_id,
                        type: 'view',
                        title: 'New View',
                        message: `👀 Someone viewed your business "${business.name}"`,
                        icon: 'eye',
                        business_id: business.id
                    }).catch(console.error);
                }
                setHasNotifiedView(true);
            }

            if (window.navigator.geolocation && business?.address) {
                window.navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(business.address)}`;
                            const response = await fetch(url);
                            const data = await response.json();
                            
                            if (data && data.length > 0) {
                                const coords = {
                                    lat: parseFloat(data[0].lat),
                                    lon: parseFloat(data[0].lon)
                                };
                                const dist = window.GeolocationUtils?.calculateDistance(
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

        const getBusinessUrl = () => {
            return `${baseUrl || 'https://prince123-p-byte.github.io/TapMap'}/?business=${business?.id}`;
        };

        const openDirections = async (mode = 'drive') => {
            if (!business?.address) {
                window.Toast?.show('Address not available', 'error');
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
            
            // Increment clicks - safely handle if RPC doesn't exist
            try {
                await window.supabase.rpc('increment_analytics', {
                    p_business_id: business.id,
                    p_field: 'clicks'
                });
            } catch (rpcError) {
                console.log('RPC not available, using direct update');
                try {
                    await window.supabase
                        .from('businesses')
                        .update({ clicks: (business.clicks || 0) + 1 })
                        .eq('id', business.id);
                } catch (updateError) {
                    console.error('Failed to update clicks:', updateError);
                }
            }
            
            if (business.user_id && (!currentUser || currentUser.id !== business.user_id)) {
                await createNotification({
                    user_id: business.user_id,
                    type: 'click',
                    title: 'Directions Requested',
                    message: `📍 Someone requested directions to "${business.name}"`,
                    icon: 'location-arrow',
                    business_id: business.id
                });
            }
            
            window.Toast?.show('Opening directions...', 'info');
        };

        const handleContact = async (type) => {
            if (!business) return;
            
            // Increment conversations - safely handle if RPC doesn't exist
            try {
                await window.supabase.rpc('increment_analytics', {
                    p_business_id: business.id,
                    p_field: 'conversations'
                });
            } catch (rpcError) {
                console.log('RPC not available, using direct update');
                try {
                    await window.supabase
                        .from('businesses')
                        .update({ conversations: (business.conversations || 0) + 1 })
                        .eq('id', business.id);
                } catch (updateError) {
                    console.error('Failed to update conversations:', updateError);
                }
            }
            
            if (business.user_id && (!currentUser || currentUser.id !== business.user_id)) {
                await createNotification({
                    user_id: business.user_id,
                    type: 'contact',
                    title: 'Contact Made',
                    message: `📞 Someone tried to contact "${business.name}" via ${type}`,
                    icon: type === 'phone' ? 'phone' : type === 'whatsapp' ? 'whatsapp' : 'envelope',
                    business_id: business.id
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
            
            // Increment qr_scans - safely handle if RPC doesn't exist
            try {
                await window.supabase.rpc('increment_analytics', {
                    p_business_id: business.id,
                    p_field: 'qr_scans'
                });
            } catch (rpcError) {
                console.log('RPC not available, using direct update');
                try {
                    await window.supabase
                        .from('businesses')
                        .update({ qr_scans: (business.qr_scans || 0) + 1 })
                        .eq('id', business.id);
                } catch (updateError) {
                    console.error('Failed to update qr_scans:', updateError);
                }
            }
            
            if (business.user_id && (!currentUser || currentUser.id !== business.user_id)) {
                await createNotification({
                    user_id: business.user_id,
                    type: 'qr',
                    title: 'QR Code Scanned',
                    message: `📱 Someone scanned your QR code for "${business.name}"`,
                    icon: 'qrcode',
                    business_id: business.id
                });
            }
            
            window.Toast?.show('QR scan recorded!', 'success');
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
                        window.Toast?.show('Link copied to clipboard!', 'success');
                    }
                }
            } else {
                navigator.clipboard.writeText(businessUrl);
                window.Toast?.show('Link copied to clipboard!', 'success');
            }
        };

        const tabs = [
            { id: 'about', label: 'About' },
            { id: 'gallery', label: 'Gallery' },
            { id: 'reviews', label: `Reviews (${reviews.length})` },
            { id: 'contact', label: 'Contact' }
        ];

        if (!business) {
            return React.createElement(
                'div',
                { className: "pt-20 text-center" },
                React.createElement(window.LoadingSpinner, null)
            );
        }

        const displayLocation = formatLocation(business.location || business.address || 'Location not specified');

        return React.createElement(
            'div',
            { className: "min-h-screen bg-gray-50" },
            React.createElement(
                'div',
                { className: "relative h-64 md:h-96 w-full" },
                React.createElement('img', {
                    src: business.cover_image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
                    className: "w-full h-full object-cover",
                    alt: "Cover",
                    onError: (e) => { e.target.src = 'https://via.placeholder.com/1200x400?text=No+Cover'; }
                }),
                React.createElement('div', { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" }),
                
                React.createElement(
                    'button',
                    {
                        onClick: onBack,
                        className: "absolute top-4 left-4 md:top-6 md:left-6 bg-white/90 backdrop-blur px-3 py-2 md:px-4 md:py-2 rounded-xl text-gray-700 font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg text-sm md:text-base"
                    },
                    React.createElement(window.Icon, { name: "arrow-left", size: 16 }),
                    "Back"
                ),
                
                isOwner && React.createElement(
                    'div',
                    { className: "absolute top-4 right-4 md:top-6 md:right-6 bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg text-sm md:text-base" },
                    React.createElement(window.Icon, { name: "crown", size: 16 }),
                    "You own this"
                )
            ),

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
                                    React.createElement(window.Icon, { name: "building", size: 12 }),
                                    business.category,
                                    React.createElement('span', { className: "w-1 h-1 bg-gray-300 rounded-full" }),
                                    React.createElement(window.Icon, { name: "map-marker-alt", size: 12 }),
                                    displayLocation
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex flex-wrap items-center gap-3 md:gap-4" },
                                    React.createElement(
                                        'div',
                                        { className: "flex items-center gap-1" },
                                        React.createElement(window.Icon, { name: "star", size: 16, className: "text-amber-400 fill-current" }),
                                        React.createElement('span', { className: "font-bold text-sm md:text-base" }, (business.rating || 0).toFixed(1)),
                                        React.createElement('span', { className: "text-gray-400 text-xs" }, `(${business.reviews || 0})`)
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: "flex items-center gap-1" },
                                        React.createElement(window.Icon, { name: "eye", size: 14, className: "text-gray-400" }),
                                        React.createElement('span', { className: "text-xs md:text-sm" }, business.views?.toLocaleString() || 0, " views")
                                    ),
                                    distance && React.createElement(
                                        'div',
                                        { className: "flex items-center gap-1 text-indigo-600" },
                                        React.createElement(window.Icon, { name: "location-arrow", size: 12 }),
                                        React.createElement('span', { className: "text-xs" }, window.GeolocationUtils?.formatDistance(distance), " away")
                                    )
                                )
                            )
                        ),
                        React.createElement(
                            'div',
                            { className: "flex flex-wrap gap-2 w-full md:w-auto" },
                            business.phone && React.createElement(
                                'button',
                                {
                                    onClick: () => handleContact('phone'),
                                    className: "flex-1 md:flex-none bg-indigo-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                },
                                React.createElement(window.Icon, { name: "phone", size: 14 }),
                                "Call"
                            ),
                            business.whatsapp && React.createElement(
                                'button',
                                {
                                    onClick: () => handleContact('whatsapp'),
                                    className: "flex-1 md:flex-none bg-green-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-200"
                                },
                                React.createElement(window.Icon, { name: "whatsapp", size: 14 }),
                                "Chat"
                            ),
                            business.email && React.createElement(
                                'button',
                                {
                                    onClick: () => handleContact('email'),
                                    className: "p-2 md:p-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                                },
                                React.createElement(window.Icon, { name: "envelope", size: 16 })
                            )
                        )
                    )
                )
            ),

            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4 mt-6 md:mt-8" },
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

                activeTab === 'about' && React.createElement(
                    'div',
                    { className: "bg-white rounded-xl p-6 border border-gray-100 space-y-6" },
                    business.description && React.createElement(
                        'div',
                        null,
                        React.createElement('h3', { className: "text-lg font-bold mb-3" }, "About"),
                        React.createElement('p', { className: "text-gray-600 text-sm leading-relaxed" }, business.description)
                    ),
                    business.hours && React.createElement(
                        'div',
                        null,
                        React.createElement('h3', { className: "text-lg font-bold mb-3" }, "Hours"),
                        React.createElement('p', { className: "text-gray-600 text-sm" }, business.hours)
                    ),
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
                                    React.createElement(window.Icon, { name: "location-arrow", size: 14 }),
                                    "Directions"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: handleShare,
                                        className: "p-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
                                    },
                                    React.createElement(window.Icon, { name: "share-alt", size: 14 })
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
                    React.createElement(
                        'div',
                        { className: "mb-8 p-6 bg-gray-50 rounded-xl" },
                        React.createElement('h3', { className: "font-bold mb-4" }, 
                            userReview ? 'Edit Your Review' : 'Write a Review'
                        ),
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
                                submittingReview && React.createElement(window.Icon, { name: "spinner", className: "animate-spin" }),
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

                    React.createElement(
                        'div',
                        { className: "space-y-6" },
                        loadingReviews ? React.createElement(window.LoadingSpinner, null) :
                        reviews.length === 0 ? React.createElement(
                            'div',
                            { className: "text-center py-8 text-gray-500" },
                            React.createElement(window.Icon, { name: "star", size: 32, className: "mx-auto mb-2 opacity-50" }),
                            React.createElement('p', null, "No reviews yet. Be the first to review!")
                        ) :
                        reviews.map(review =>
                            React.createElement(
                                'div',
                                { key: review.id, className: "border-b border-gray-100 last:border-0 pb-6 last:pb-0" },
                                React.createElement(
                                    'div',
                                    { className: "flex items-start gap-4 mb-3" },
                                    React.createElement(
                                        'div',
                                        { className: "w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0 overflow-hidden" },
                                        review.user_name?.charAt(0).toUpperCase() || 'U'
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
                                                review.user_name
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
                                            new Date(review.created_at).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })
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
                                React.createElement(window.Icon, { name: "phone", size: 16 })
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
                                React.createElement(window.Icon, { name: "whatsapp", size: 16 })
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
                                React.createElement(window.Icon, { name: "envelope", size: 16 })
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
                                    React.createElement(window.Icon, { name: "download", size: 14 }),
                                    "Download QR"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: handleShare,
                                        className: "border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
                                    },
                                    React.createElement(window.Icon, { name: "share-alt", size: 14 }),
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