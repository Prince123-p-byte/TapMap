// Landing Page Component
const LandingPage = ({ onExplore }) => {
    const businesses = DataManager.getBusinesses();
    const featured = businesses.slice(0, 3);
    const stats = DataManager.getAllAnalytics();

    const features = [
        {
            icon: 'qrcode',
            title: 'Smart QR Codes',
            desc: 'Generate dynamic QR codes for each business. Track scans and engagement in real-time.',
            color: 'bg-blue-100 text-blue-600'
        },
        {
            icon: 'layer-group',
            title: 'Multi-Business Dashboard',
            desc: 'Manage all your businesses from a single, powerful dashboard with unified analytics.',
            color: 'bg-green-100 text-green-600'
        },
        {
            icon: 'chart-line',
            title: 'Advanced Analytics',
            desc: 'Get detailed insights into views, clicks, conversions, and customer engagement.',
            color: 'bg-purple-100 text-purple-600'
        },
        {
            icon: 'image',
            title: 'Media Library',
            desc: 'Centralized storage for all your business images, videos, and marketing materials.',
            color: 'bg-amber-100 text-amber-600'
        },
        {
            icon: 'map-marked-alt',
            title: 'Location Integration',
            desc: 'Google Maps integration for easy directions and location-based discovery.',
            color: 'bg-red-100 text-red-600'
        },
        {
            icon: 'whatsapp',
            title: 'Instant Connect',
            desc: 'One-click contact via phone, email, or WhatsApp for immediate customer connection.',
            color: 'bg-indigo-100 text-indigo-600'
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'CEO, Lumina Architecture',
            content: 'AdPort transformed how we manage our multiple business locations. The QR codes alone have increased our walk-in traffic by 40%.',
            avatar: 'SJ',
            rating: 5
        },
        {
            name: 'Michael Chen',
            role: 'Owner, Green Eat Co.',
            content: 'The unified dashboard saves us hours every week. Now I can track performance across all our restaurants in real-time.',
            avatar: 'MC',
            rating: 5
        },
        {
            name: 'Emma Davis',
            role: 'Founder, Revive Wellness',
            content: 'The media library and analytics tools are game-changers. Our engagement has never been better.',
            avatar: 'ED',
            rating: 5
        }
    ];

    return React.createElement(
        'div',
        { className: "min-h-screen" },
        // Hero Section with Gradient Background
        React.createElement(
            'section',
            { className: "relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-32" },
            // Animated background blobs
            React.createElement('div', { className: "absolute top-0 -left-4 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob" }),
            React.createElement('div', { className: "absolute top-0 -right-4 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" }),
            React.createElement('div', { className: "absolute -bottom-8 left-20 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000" }),
            
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4 relative z-10" },
                React.createElement(
                    'div',
                    { className: "text-center max-w-4xl mx-auto" },
                    React.createElement(
                        'div',
                        { className: "inline-flex items-center gap-2 bg-white/20 backdrop-blur-lg text-white px-4 py-2 rounded-full text-sm font-bold tracking-wide uppercase mb-8 animate-fade-in" },
                        React.createElement(Icon, { name: "zap", size: 14 }),
                        " New: AI-Powered QR Portfolios"
                    ),
                    React.createElement(
                        'h1',
                        { className: "text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 animate-slide-in" },
                        "One Platform. ",
                        React.createElement('br'),
                        React.createElement(
                            'span',
                            { className: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300" },
                            "Unlimited Businesses."
                        )
                    ),
                    React.createElement(
                        'p',
                        { className: "text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto animate-slide-in" },
                        "Manage multiple business portfolios, generate dynamic QR codes, and track engagement with a powerful unified dashboard."
                    ),
                    React.createElement(
                        'div',
                        { className: "flex flex-col sm:flex-row gap-4 justify-center animate-slide-in" },
                        React.createElement(
                            'button',
                            {
                                onClick: onExplore,
                                className: "bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:scale-105"
                            },
                            "Explore Businesses ",
                            React.createElement(Icon, { name: "arrow-right", size: 20 })
                        ),
                        React.createElement(
                            'button',
                            { className: "bg-white/20 backdrop-blur-lg text-white border-2 border-white/30 px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2" },
                            React.createElement(Icon, { name: "play", size: 20 }),
                            "Watch Demo"
                        )
                    )
                )
            )
        ),

        // Stats Section
        React.createElement(
            'section',
            { className: "py-16 bg-white" },
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4" },
                React.createElement(
                    'div',
                    { className: "grid grid-cols-2 md:grid-cols-4 gap-8" },
                    [
                        { value: stats.totalViews?.toLocaleString() || '150K+', label: 'Monthly Views' },
                        { value: businesses.length + '+', label: 'Active Businesses' },
                        { value: '98%', label: 'Satisfaction Rate' },
                        { value: '24/7', label: 'Support' }
                    ].map((stat, i) =>
                        React.createElement(
                            'div',
                            { key: i, className: "text-center" },
                            React.createElement('div', { className: "text-3xl font-bold gradient-text" }, stat.value),
                            React.createElement('div', { className: "text-gray-500 mt-2" }, stat.label)
                        )
                    )
                )
            )
        ),

        // Features Section
        React.createElement(
            'section',
            { className: "py-24 bg-gray-50" },
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4" },
                React.createElement(
                    'div',
                    { className: "text-center mb-16" },
                    React.createElement(
                        'h2',
                        { className: "text-4xl font-bold mb-4" },
                        "Everything You Need to ",
                        React.createElement('span', { className: "gradient-text" }, "Scale Your Business")
                    ),
                    React.createElement(
                        'p',
                        { className: "text-xl text-gray-600 max-w-2xl mx-auto" },
                        "Powerful features designed to help you manage and grow your multi-business portfolio."
                    )
                ),
                React.createElement(
                    'div',
                    { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8" },
                    features.map((feature, i) =>
                        React.createElement(
                            ModernCard,
                            { key: i, className: "p-8 hover:shadow-xl transition-all group" },
                            React.createElement(
                                'div',
                                { className: `w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform` },
                                React.createElement(Icon, { name: feature.icon, size: 32 })
                            ),
                            React.createElement(
                                'h3',
                                { className: "text-xl font-bold mb-3" },
                                feature.title
                            ),
                            React.createElement(
                                'p',
                                { className: "text-gray-500 leading-relaxed" },
                                feature.desc
                            )
                        )
                    )
                )
            )
        ),

        // Featured Businesses
        featured.length > 0 && React.createElement(
            'section',
            { className: "py-24 max-w-7xl mx-auto px-4" },
            React.createElement(
                'div',
                { className: "flex justify-between items-end mb-12" },
                React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'h2',
                        { className: "text-4xl font-bold mb-4" },
                        "Featured ",
                        React.createElement('span', { className: "gradient-text" }, "Businesses")
                    ),
                    React.createElement(
                        'p',
                        { className: "text-gray-500 text-lg" },
                        "Discover top-tier companies on our network"
                    )
                ),
                React.createElement(
                    'button',
                    {
                        onClick: onExplore,
                        className: "text-indigo-600 font-bold flex items-center gap-1 hover:underline text-lg"
                    },
                    "View All ",
                    React.createElement(Icon, { name: "arrow-right", size: 18 })
                )
            ),
            React.createElement(
                'div',
                { className: "grid md:grid-cols-3 gap-8" },
                featured.map(biz =>
                    React.createElement(BusinessCard, {
                        key: biz.id,
                        business: biz,
                        onClick: () => onExplore(biz)
                    })
                )
            )
        ),

        // Testimonials
        React.createElement(
            'section',
            { className: "py-24 bg-gradient-to-br from-indigo-50 to-purple-50" },
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4" },
                React.createElement(
                    'div',
                    { className: "text-center mb-16" },
                    React.createElement(
                        'h2',
                        { className: "text-4xl font-bold mb-4" },
                        "What Our ",
                        React.createElement('span', { className: "gradient-text" }, "Clients Say")
                    ),
                    React.createElement(
                        'p',
                        { className: "text-xl text-gray-600" },
                        "Join thousands of satisfied business owners using AdPort"
                    )
                ),
                React.createElement(
                    'div',
                    { className: "grid md:grid-cols-3 gap-8" },
                    testimonials.map((testimonial, i) =>
                        React.createElement(
                            ModernCard,
                            { key: i, className: "p-8" },
                            React.createElement(
                                'div',
                                { className: "flex items-center gap-4 mb-6" },
                                React.createElement(
                                    'div',
                                    { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold" },
                                    testimonial.avatar
                                ),
                                React.createElement(
                                    'div',
                                    null,
                                    React.createElement('h3', { className: "font-bold text-gray-900" }, testimonial.name),
                                    React.createElement('p', { className: "text-sm text-gray-500" }, testimonial.role)
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: "flex gap-1 mb-4" },
                                Array.from({ length: testimonial.rating }).map((_, j) =>
                                    React.createElement(Icon, { key: j, name: "star", className: "text-amber-400", size: 16 })
                                )
                            ),
                            React.createElement(
                                'p',
                                { className: "text-gray-600 italic" },
                                `"${testimonial.content}"`
                            )
                        )
                    )
                )
            )
        ),

        // CTA Section
        React.createElement(
            'section',
            { className: "py-24 bg-gradient-to-br from-indigo-600 to-purple-600" },
            React.createElement(
                'div',
                { className: "max-w-4xl mx-auto px-4 text-center" },
                React.createElement(
                    'h2',
                    { className: "text-4xl font-bold text-white mb-6" },
                    "Ready to Get Started?"
                ),
                React.createElement(
                    'p',
                    { className: "text-xl text-white/90 mb-10" },
                    "Join thousands of businesses already using AdPort to manage their multi-brand presence."
                ),
                React.createElement(
                    'div',
                    { className: "flex flex-col sm:flex-row gap-4 justify-center" },
                    React.createElement(
                        'button',
                        {
                            onClick: onExplore,
                            className: "bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                        },
                        "Start Free Trial"
                    ),
                    React.createElement(
                        'button',
                        { className: "bg-transparent text-white border-2 border-white/30 px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-all" },
                        "Contact Sales"
                    )
                )
            )
        )
    );
};