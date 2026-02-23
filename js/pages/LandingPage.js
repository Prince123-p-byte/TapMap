(function() {
    const LandingPage = ({ onExplore, allBusinesses = [] }) => {
        const featured = allBusinesses.slice(0, 6);
        const stats = {
            totalViews: allBusinesses.reduce((sum, b) => sum + (b.views || 0), 0),
            totalBusinesses: allBusinesses.length
        };

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

        return React.createElement(
            'div',
            { className: "min-h-screen" },
            // Hero Section
            React.createElement(
                'section',
                { className: "relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-32" },
                React.createElement('div', { className: "absolute top-0 -left-4 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob" }),
                React.createElement('div', { className: "absolute top-0 -right-4 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" }),
                
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
                            ` ${stats.totalBusinesses}+ Businesses on tapMap`
                        ),
                        React.createElement(
                            'h1',
                            { className: "text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 animate-slide-in" },
                            "Discover Local ",
                            React.createElement('br'),
                            React.createElement(
                                'span',
                                { className: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300" },
                                "Businesses Near You"
                            )
                        ),
                        React.createElement(
                            'p',
                            { className: "text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto animate-slide-in" },
                            "Find and connect with local businesses. View profiles, get directions, and share with friends."
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
                            { value: (stats.totalViews || 150000).toLocaleString(), label: 'Monthly Views' },
                            { value: (stats.totalBusinesses || 50) + '+', label: 'Active Businesses' },
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
                                'div',
                                { 
                                    key: i, 
                                    className: "bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
                                },
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
                            "Discover top businesses on our network"
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
                    { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8" },
                    featured.map(biz =>
                        React.createElement(BusinessCard, {
                            key: biz.id,
                            business: biz,
                            onClick: () => window.dispatchEvent(new CustomEvent('navigate', { 
                                detail: { page: 'profile', business: biz }
                            }))
                        })
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
                        "Join businesses already using tapMap to manage their multi-brand presence."
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
                            "Start Exploring"
                        )
                    )
                )
            )
        );
    };

    window.LandingPage = LandingPage;
})();