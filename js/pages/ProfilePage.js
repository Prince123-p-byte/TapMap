// Profile Page Component with GitHub Sharing Links
const ProfilePage = ({ business, onBack }) => {
    const [activeTab, setActiveTab] = React.useState('about');
    const [contactMessage, setContactMessage] = React.useState('');
    const [distance, setDistance] = React.useState(null);
    const [userLocation, setUserLocation] = React.useState(null);
    const [isOwner, setIsOwner] = React.useState(false);

    React.useEffect(() => {
        // Check if current user owns this business
        const user = auth.currentUser;
        if (user && business.userId === user.uid) {
            setIsOwner(true);
        }

        // Record view
        if (business?.id) {
            // Increment view count
            db.collection('businesses').doc(business.id).update({
                views: firebase.firestore.FieldValue.increment(1)
            }).catch(console.error);
        }

        // Get user location for distance calculation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });

                    // Calculate distance to business
                    try {
                        const coords = await GeolocationUtils.getCoordsFromAddress(business.address);
                        const dist = GeolocationUtils.calculateDistance(
                            position.coords.latitude,
                            position.coords.longitude,
                            coords.lat,
                            coords.lon
                        );
                        setDistance(dist);
                    } catch (error) {
                        console.error('Error calculating distance:', error);
                    }
                },
                (error) => {
                    console.log('Location permission denied');
                }
            );
        }
    }, [business?.id, business?.address]);

    // Get shareable URL
    const getBusinessUrl = () => {
        return `${window.APP_URL || 'https://princecodes247.github.io/tapmap'}?business=${business.id}`;
    };

    // Smart Directions - Opens appropriate maps app based on device
    const openDirections = (mode = 'drive') => {
        if (!business?.address) {
            Toast.show('Address not available', 'error');
            return;
        }

        const encodedAddress = encodeURIComponent(business.address);
        const encodedName = encodeURIComponent(business.name);
        
        // Detect device
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Travel mode mapping
        const travelMode = {
            drive: 'driving',
            transit: 'transit',
            walk: 'walking',
            bike: 'bicycling'
        }[mode] || 'driving';
        
        // iOS / Mac detection
        if (/iPad|iPhone|iPod|Macintosh/.test(userAgent) && !window.MSStream) {
            // For iOS/Mac - Try Apple Maps first
            const appleMapsUrl = `maps://?q=${encodedName}&daddr=${encodedAddress}&dirflg=${travelMode === 'walking' ? 'w' : 'd'}`;
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}`;
            
            // Try to open Apple Maps
            window.location.href = appleMapsUrl;
            
            // Fallback to Google Maps if Apple Maps doesn't open
            setTimeout(() => {
                if (!document.hidden) {
                    window.open(googleMapsUrl, '_blank');
                }
            }, 500);
        } 
        // Android detection
        else if (/android/i.test(userAgent)) {
            // For Android - Open Google Maps app
            const intentUrl = `intent://maps/dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}#Intent;scheme=https;package=com.google.android.apps.maps;end`;
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}`;
            
            // Try to open via intent
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = intentUrl;
            document.body.appendChild(iframe);
            
            // Fallback to web after timeout
            setTimeout(() => {
                document.body.removeChild(iframe);
                if (!document.hidden) {
                    window.open(webUrl, '_blank');
                }
            }, 500);
        }
        // Windows/Others
        else {
            // For Windows and others - Open Google Maps web
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}`;
            window.open(mapsUrl, '_blank');
        }
        
        // Track the direction request
        db.collection('businesses').doc(business.id).update({
            clicks: firebase.firestore.FieldValue.increment(1)
        }).catch(console.error);
        
        Toast.show('Opening directions...', 'info');
    };

    const handleContact = (type) => {
        db.collection('businesses').doc(business.id).update({
            conversations: firebase.firestore.FieldValue.increment(1)
        }).catch(console.error);
        
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

    const handleQRScan = () => {
        db.collection('businesses').doc(business.id).update({
            qrScans: firebase.firestore.FieldValue.increment(1)
        }).catch(console.error);
        Toast.show('QR scan recorded!', 'success');
    };

    const handleShare = async () => {
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
        { id: 'reviews', label: 'Reviews' },
        { id: 'contact', label: 'Contact' }
    ];

    // Check if business is open now (simplified)
    const isOpenNow = () => {
        if (!business.hours) return false;
        // In production, parse hours properly
        return true;
    };

    if (!business) {
        return React.createElement(
            'div',
            { className: "pt-20 text-center" },
            React.createElement(LoadingSpinner)
        );
    }

    return React.createElement(
        'div',
        { className: "min-h-screen bg-gray-50" },
        // Cover Image
        React.createElement(
            'div',
            { className: "relative h-96 w-full" },
            React.createElement('img', {
                src: business.coverImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
                className: "w-full h-full object-cover",
                alt: "Cover"
            }),
            React.createElement('div', { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" }),
            
            // Back Button
            React.createElement(
                'button',
                {
                    onClick: onBack,
                    className: "absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-gray-700 font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg"
                },
                React.createElement(Icon, { name: "arrow-left", size: 18 }),
                "Back to Directory"
            ),
            
            // Owner Badge
            isOwner && React.createElement(
                'div',
                { className: "absolute top-6 right-6 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg" },
                React.createElement(Icon, { name: "crown", size: 18 }),
                "You own this business"
            )
        ),

        // Business Info Card
        React.createElement(
            'div',
            { className: "max-w-7xl mx-auto px-4 -mt-20 relative z-10" },
            React.createElement(
                ModernCard,
                { className: "p-8 mb-8" },
                React.createElement(
                    'div',
                    { className: "flex flex-col md:flex-row gap-8 items-start md:items-center justify-between" },
                    React.createElement(
                        'div',
                        { className: "flex gap-6 items-center" },
                        // Logo
                        React.createElement(
                            'div',
                            { className: "w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-lg" },
                            business.logo || business.name?.charAt(0).toUpperCase()
                        ),
                        // Basic Info
                        React.createElement(
                            'div',
                            null,
                            React.createElement(
                                'div',
                                { className: "flex items-center gap-3 mb-2 flex-wrap" },
                                React.createElement(
                                    'h1',
                                    { className: "text-3xl md:text-4xl font-bold text-gray-900" },
                                    business.name
                                ),
                                React.createElement(
                                    'span',
                                    { className: "px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold" },
                                    "Verified"
                                ),
                                business.userName && React.createElement(
                                    'span',
                                    { className: "px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold" },
                                    `by ${business.userName}`
                                )
                            ),
                            React.createElement(
                                'p',
                                { className: "text-gray-500 flex items-center gap-2 mb-3 flex-wrap" },
                                React.createElement(Icon, { name: "building", size: 16 }),
                                business.category,
                                React.createElement('span', { className: "w-1 h-1 bg-gray-300 rounded-full" }),
                                React.createElement(Icon, { name: "map-marker-alt", size: 16 }),
                                business.location
                            ),
                            React.createElement(
                                'div',
                                { className: "flex items-center gap-4 flex-wrap" },
                                React.createElement(
                                    'div',
                                    { className: "flex items-center gap-1" },
                                    React.createElement(Icon, { name: "star", size: 20, className: "text-amber-400 fill-current" }),
                                    React.createElement('span', { className: "font-bold text-lg" }, business.rating || '5.0'),
                                    React.createElement('span', { className: "text-gray-400" }, `(${business.reviews || 0} reviews)`)
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex items-center gap-1" },
                                    React.createElement(Icon, { name: "eye", size: 20, className: "text-gray-400" }),
                                    React.createElement('span', { className: "font-medium" }, business.views?.toLocaleString() || 0, " views")
                                ),
                                distance && React.createElement(
                                    'div',
                                    { className: "flex items-center gap-1 text-indigo-600" },
                                    React.createElement(Icon, { name: "location-arrow", size: 16 }),
                                    React.createElement('span', { className: "font-medium" }, GeolocationUtils.formatDistance(distance), " away")
                                )
                            )
                        )
                    ),
                    // Action Buttons
                    React.createElement(
                        'div',
                        { className: "flex flex-wrap gap-3 w-full md:w-auto" },
                        React.createElement(
                            'button',
                            {
                                onClick: () => handleContact('phone'),
                                className: "flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            },
                            React.createElement(Icon, { name: "phone", size: 18 }),
                            "Call Now"
                        ),
                        business.whatsapp && React.createElement(
                            'button',
                            {
                                onClick: () => handleContact('whatsapp'),
                                className: "flex-1 md:flex-none bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-200"
                            },
                            React.createElement(Icon, { name: "whatsapp", size: 18 }),
                            "WhatsApp"
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: () => handleContact('email'),
                                className: "p-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                            },
                            React.createElement(Icon, { name: "envelope", size: 20 })
                        )
                    )
                )
            ),

            // Tabs
            React.createElement(
                ModernCard,
                { className: "p-6 mb-8" },
                React.createElement(Tabs, { tabs, activeTab, onTabChange: setActiveTab }),

                // Tab Content
                activeTab === 'about' && React.createElement(
                    'div',
                    { className: "space-y-8" },
                    // Description
                    React.createElement(
                        'div',
                        null,
                        React.createElement('h3', { className: "text-xl font-bold mb-4" }, "About the Business"),
                        React.createElement('p', { className: "text-gray-600 leading-relaxed" }, business.description || 'No description available.')
                    ),
                    // Business Hours
                    business.hours && React.createElement(
                        'div',
                        null,
                        React.createElement('h3', { className: "text-xl font-bold mb-4" }, "Business Hours"),
                        React.createElement('p', { className: "text-gray-600" }, business.hours)
                    ),
                    // Location & Directions
                    React.createElement(
                        'div',
                        null,
                        React.createElement('h3', { className: "text-xl font-bold mb-4" }, "Location & Directions"),
                        React.createElement(
                            'div',
                            { className: "bg-gray-50 rounded-xl p-6" },
                            React.createElement(
                                'div',
                                { className: "flex items-start gap-4 mb-6" },
                                React.createElement(
                                    'div',
                                    { className: "w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0" },
                                    React.createElement(Icon, { name: "map-marked-alt", size: 24 })
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex-1" },
                                    React.createElement('p', { className: "font-medium mb-2" }, business.address),
                                    React.createElement(
                                        'div',
                                        { className: "flex items-center gap-4 text-sm" },
                                        React.createElement(
                                            'span',
                                            { className: isOpenNow() ? 'text-green-600' : 'text-red-600' },
                                            React.createElement(Icon, { name: "circle", size: 8, className: "mr-1" }),
                                            isOpenNow() ? 'Open Now' : 'Closed'
                                        ),
                                        business.priceRange && React.createElement(
                                            'span',
                                            { className: "text-gray-500" },
                                            business.priceRange
                                        )
                                    )
                                )
                            ),

                            // Directions Buttons
                            React.createElement(
                                'div',
                                { className: "grid grid-cols-2 gap-3" },
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => openDirections('drive'),
                                        className: "col-span-2 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-indigo-200"
                                    },
                                    React.createElement(Icon, { name: "location-arrow", size: 20 }),
                                    "Get Directions"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => openDirections('drive'),
                                        className: "bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    },
                                    React.createElement(Icon, { name: "car", size: 16 }),
                                    "Drive"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => openDirections('transit'),
                                        className: "bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    },
                                    React.createElement(Icon, { name: "bus", size: 16 }),
                                    "Transit"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => openDirections('walk'),
                                        className: "bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    },
                                    React.createElement(Icon, { name: "walking", size: 16 }),
                                    "Walk"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => openDirections('bike'),
                                        className: "bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    },
                                    React.createElement(Icon, { name: "bicycle", size: 16 }),
                                    "Bike"
                                )
                            ),

                            // Share Button
                            React.createElement(
                                'button',
                                {
                                    onClick: handleShare,
                                    className: "w-full mt-3 text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 py-2"
                                },
                                React.createElement(Icon, { name: "share-alt", size: 14 }),
                                "Share this location"
                            )
                        )
                    )
                ),

                activeTab === 'gallery' && React.createElement(
                    'div',
                    null,
                    React.createElement(ImageGallery, {
                        images: business.images || [],
                        onImageClick: (image) => window.open(image.url || image, '_blank')
                    })
                ),

                activeTab === 'reviews' && React.createElement(
                    'div',
                    { className: "space-y-6" },
                    // Review Stats
                    React.createElement(
                        'div',
                        { className: "flex items-center gap-8 p-6 bg-gray-50 rounded-xl" },
                        React.createElement(
                            'div',
                            { className: "text-center" },
                            React.createElement('div', { className: "text-4xl font-bold text-indigo-600" }, business.rating || '5.0'),
                            React.createElement('div', { className: "flex gap-1 mt-2" },
                                Array.from({ length: 5 }).map((_, i) =>
                                    React.createElement(Icon, {
                                        key: i,
                                        name: "star",
                                        size: 16,
                                        className: i < Math.floor(business.rating || 5) ? 'text-amber-400 fill-current' : 'text-gray-300'
                                    })
                                )
                            ),
                            React.createElement('div', { className: "text-sm text-gray-500 mt-1" }, business.reviews || 0, " reviews")
                        ),
                        React.createElement(
                            'div',
                            { className: "flex-1" }
                        )
                    ),
                    // Review Form
                    React.createElement(
                        'div',
                        { className: "bg-white border border-gray-100 rounded-xl p-6" },
                        React.createElement('h4', { className: "font-bold mb-4" }, "Write a Review"),
                        React.createElement(
                            'textarea',
                            {
                                placeholder: "Share your experience...",
                                className: "w-full p-4 border border-gray-200 rounded-xl mb-4",
                                rows: "4"
                            }
                        ),
                        React.createElement(Button, { icon: "star" }, "Submit Review")
                    )
                ),

                activeTab === 'contact' && React.createElement(
                    'div',
                    { className: "grid md:grid-cols-2 gap-8" },
                    // Contact Info
                    React.createElement(
                        'div',
                        { className: "space-y-4" },
                        business.phone && React.createElement(
                            'div',
                            { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleContact('phone') },
                            React.createElement(
                                'div',
                                { className: "w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center" },
                                React.createElement(Icon, { name: "phone", size: 20 })
                            ),
                            React.createElement(
                                'div',
                                null,
                                React.createElement('div', { className: "text-sm text-gray-500" }, "Phone"),
                                React.createElement('div', { className: "font-medium" }, business.phone)
                            )
                        ),
                        business.whatsapp && React.createElement(
                            'div',
                            { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleContact('whatsapp') },
                            React.createElement(
                                'div',
                                { className: "w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center" },
                                React.createElement(Icon, { name: "whatsapp", size: 20 })
                            ),
                            React.createElement(
                                'div',
                                null,
                                React.createElement('div', { className: "text-sm text-gray-500" }, "WhatsApp"),
                                React.createElement('div', { className: "font-medium" }, business.whatsapp)
                            )
                        ),
                        business.email && React.createElement(
                            'div',
                            { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleContact('email') },
                            React.createElement(
                                'div',
                                { className: "w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center" },
                                React.createElement(Icon, { name: "envelope", size: 20 })
                            ),
                            React.createElement(
                                'div',
                                null,
                                React.createElement('div', { className: "text-sm text-gray-500" }, "Email"),
                                React.createElement('div', { className: "font-medium" }, business.email)
                            )
                        )
                    ),
                    // Contact Form
                    React.createElement(
                        'div',
                        { className: "bg-gray-50 rounded-xl p-6" },
                        React.createElement('h4', { className: "font-bold mb-4" }, "Send a Message"),
                        React.createElement(
                            'textarea',
                            {
                                value: contactMessage,
                                onChange: (e) => setContactMessage(e.target.value),
                                placeholder: "Type your message...",
                                className: "w-full p-4 border border-gray-200 rounded-xl mb-4",
                                rows: "4"
                            }
                        ),
                        React.createElement(
                            Button,
                            {
                                icon: "paper-plane",
                                onClick: () => {
                                    window.location.href = `mailto:${business.email}?subject=Inquiry about ${business.name}&body=${encodeURIComponent(contactMessage)}`;
                                    setContactMessage('');
                                }
                            },
                            "Send Message"
                        )
                    )
                )
            ),

            // QR Code Sidebar with GitHub link
            React.createElement(
                ModernCard,
                { className: "p-6" },
                React.createElement(
                    'div',
                    { className: "text-center" },
                    React.createElement(
                        'div',
                        { className: "inline-block p-4 bg-white rounded-2xl shadow-lg mb-4" },
                        React.createElement('img', {
                            src: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getBusinessUrl())}`,
                            alt: "QR Code",
                            className: "w-40 h-40"
                        })
                    ),
                    React.createElement('h3', { className: "font-bold text-lg mb-2" }, "Scan to View"),
                    React.createElement(
                        'p',
                        { className: "text-gray-500 text-sm mb-4" },
                        "Scan this QR code to view this business on tapMap"
                    ),
                    React.createElement(
                        'div',
                        { className: "flex gap-2 justify-center" },
                        React.createElement(
                            'a',
                            {
                                href: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getBusinessUrl())}`,
                                download: `${business.name}-qrcode.png`,
                                onClick: handleQRScan,
                                className: "flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            },
                            React.createElement(Icon, { name: "download", size: 16 }),
                            "Download QR"
                        ),
                        React.createElement(
                            'a',
                            {
                                href: getBusinessUrl(),
                                target: "_blank",
                                className: "p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
                            },
                            React.createElement(Icon, { name: "external-link", size: 16 })
                        )
                    ),
                    React.createElement(
                        'p',
                        { className: "text-xs text-gray-400 mt-4" },
                        "Share: ",
                        React.createElement(
                            'a',
                            { 
                                href: getBusinessUrl(),
                                target: "_blank",
                                className: "text-indigo-600 hover:underline"
                            },
                            getBusinessUrl().substring(0, 40) + '...'
                        )
                    )
                )
            )
        )
    );
};

// Make component globally available
window.ProfilePage = ProfilePage;