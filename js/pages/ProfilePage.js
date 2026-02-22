// Profile Page Component
const ProfilePage = ({ business, onBack }) => {
    const [activeTab, setActiveTab] = React.useState('about');
    const [showContactModal, setShowContactModal] = React.useState(false);
    const [contactMessage, setContactMessage] = React.useState('');

    React.useEffect(() => {
        // Record view
        DataManager.recordView(business.id);
    }, [business.id]);

    const getGoogleMapsUrl = () => {
        const encodedAddress = encodeURIComponent(business.address);
        return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    };

    const handleContact = (type) => {
        DataManager.recordConversation(business.id);
        
        switch(type) {
            case 'phone':
                window.location.href = `tel:${business.phone}`;
                break;
            case 'whatsapp':
                window.open(`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:${business.email}`;
                break;
        }
    };

    const handleQRScan = () => {
        DataManager.incrementQRScan(business.id);
    };

    const tabs = [
        { id: 'about', label: 'About' },
        { id: 'gallery', label: 'Gallery' },
        { id: 'reviews', label: 'Reviews' },
        { id: 'contact', label: 'Contact' }
    ];

    return React.createElement(
        'div',
        { className: "min-h-screen bg-gray-50" },
        // Cover Image
        React.createElement(
            'div',
            { className: "relative h-96 w-full" },
            React.createElement('img', {
                src: business.coverImage,
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
                            business.logo
                        ),
                        // Basic Info
                        React.createElement(
                            'div',
                            null,
                            React.createElement(
                                'div',
                                { className: "flex items-center gap-3 mb-2" },
                                React.createElement(
                                    'h1',
                                    { className: "text-3xl md:text-4xl font-bold text-gray-900" },
                                    business.name
                                ),
                                React.createElement(
                                    'span',
                                    { className: "px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold" },
                                    "Verified"
                                )
                            ),
                            React.createElement(
                                'p',
                                { className: "text-gray-500 flex items-center gap-2 mb-3" },
                                React.createElement(Icon, { name: "building", size: 16 }),
                                business.category,
                                React.createElement('span', { className: "w-1 h-1 bg-gray-300 rounded-full" }),
                                React.createElement(Icon, { name: "map-marker-alt", size: 16 }),
                                business.location
                            ),
                            React.createElement(
                                'div',
                                { className: "flex items-center gap-4" },
                                React.createElement(
                                    'div',
                                    { className: "flex items-center gap-1" },
                                    React.createElement(Icon, { name: "star", size: 20, className: "text-amber-400 fill-current" }),
                                    React.createElement('span', { className: "font-bold text-lg" }, business.rating),
                                    React.createElement('span', { className: "text-gray-400" }, `(${business.reviews} reviews)`)
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex items-center gap-1" },
                                    React.createElement(Icon, { name: "eye", size: 20, className: "text-gray-400" }),
                                    React.createElement('span', { className: "font-medium" }, business.views?.toLocaleString() || 0, " views")
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
                        React.createElement(
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
                        React.createElement('p', { className: "text-gray-600 leading-relaxed" }, business.description)
                    ),
                    // Business Hours
                    React.createElement(
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
                                { className: "flex items-start gap-4" },
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
                                        'a',
                                        {
                                            href: getGoogleMapsUrl(),
                                            target: "_blank",
                                            className: "inline-flex items-center gap-2 text-indigo-600 font-medium hover:underline"
                                        },
                                        React.createElement(Icon, { name: "location-arrow", size: 16 }),
                                        "Get Directions on Google Maps"
                                    )
                                )
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
                            React.createElement('div', { className: "text-4xl font-bold text-indigo-600" }, business.rating),
                            React.createElement('div', { className: "flex gap-1 mt-2" },
                                Array.from({ length: 5 }).map((_, i) =>
                                    React.createElement(Icon, {
                                        key: i,
                                        name: "star",
                                        size: 16,
                                        className: i < Math.floor(business.rating) ? 'text-amber-400 fill-current' : 'text-gray-300'
                                    })
                                )
                            ),
                            React.createElement('div', { className: "text-sm text-gray-500 mt-1" }, business.reviews, " reviews")
                        ),
                        React.createElement(
                            'div',
                            { className: "flex-1" },
                            // Rating bars would go here
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
                        React.createElement(
                            'div',
                            { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-xl" },
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
                        React.createElement(
                            'div',
                            { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-xl" },
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
                        React.createElement(
                            'div',
                            { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-xl" },
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

            // QR Code Sidebar
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
                            src: business.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://adport.com/business/${business.id}`,
                            alt: "QR Code",
                            className: "w-40 h-40"
                        })
                    ),
                    React.createElement('h3', { className: "font-bold text-lg mb-2" }, "Scan to Connect"),
                    React.createElement(
                        'p',
                        { className: "text-gray-500 text-sm mb-4" },
                        "Scan this QR code to save business info to your phone"
                    ),
                    React.createElement(
                        'div',
                        { className: "flex gap-2 justify-center" },
                        React.createElement(
                            'a',
                            {
                                href: business.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://adport.com/business/${business.id}`,
                                download: `${business.name}-qrcode.png`,
                                onClick: handleQRScan,
                                className: "flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-all"
                            },
                            React.createElement(Icon, { name: "download", size: 16 }),
                            " Download"
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: () => {
                                    navigator.clipboard?.writeText(`https://adport.com/business/${business.id}`);
                                    Toast.show('Link copied to clipboard');
                                },
                                className: "p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
                            },
                            React.createElement(Icon, { name: "link", size: 16 })
                        )
                    )
                )
            )
        )
    );
};