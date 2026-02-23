(function() {
    const DirectoryPage = ({ businesses, onSelectBusiness }) => {
        const [searchTerm, setSearchTerm] = React.useState('');
        const [locationFilter, setLocationFilter] = React.useState('all');
        const [categoryFilter, setCategoryFilter] = React.useState('all');
        const [sortBy, setSortBy] = React.useState('recommended');
        const [viewMode, setViewMode] = React.useState('grid');

        // Safely get unique locations and categories
        const locations = React.useMemo(() => {
            const uniqueLocs = ['all', ...new Set(businesses
                .map(b => b?.location)
                .filter(loc => loc && typeof loc === 'string')
            )];
            return uniqueLocs;
        }, [businesses]);

        const categories = React.useMemo(() => {
            const uniqueCats = ['all', ...new Set(businesses
                .map(b => b?.category)
                .filter(cat => cat && typeof cat === 'string')
            )];
            return uniqueCats;
        }, [businesses]);

        // Safe location formatter
        const formatLocation = (location) => {
            if (!location) return 'Location TBD';
            if (typeof location === 'string') return location;
            if (typeof location === 'object') {
                if (location.lat && location.lng) {
                    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
                }
                return 'Location available';
            }
            return String(location);
        };

        const filteredBusinesses = React.useMemo(() => {
            return businesses
                .filter(biz => {
                    if (!biz) return false;
                    
                    const bizLocation = formatLocation(biz.location).toLowerCase();
                    const bizCategory = (biz.category || '').toLowerCase();
                    const bizName = (biz.name || '').toLowerCase();
                    const bizDesc = (biz.description || '').toLowerCase();
                    const searchLower = searchTerm.toLowerCase();

                    const matchesSearch = searchTerm === '' || 
                        bizName.includes(searchLower) ||
                        bizCategory.includes(searchLower) ||
                        bizDesc.includes(searchLower);
                    
                    const matchesLocation = locationFilter === 'all' || 
                        bizLocation.includes(locationFilter.toLowerCase());
                    
                    const matchesCategory = categoryFilter === 'all' || 
                        bizCategory === categoryFilter.toLowerCase();

                    return matchesSearch && matchesLocation && matchesCategory;
                })
                .sort((a, b) => {
                    switch(sortBy) {
                        case 'rating':
                            return (b.rating || 0) - (a.rating || 0);
                        case 'views':
                            return (b.views || 0) - (a.views || 0);
                        case 'newest':
                            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                            return dateB - dateA;
                        default:
                            return 0;
                    }
                });
        }, [businesses, searchTerm, locationFilter, categoryFilter, sortBy]);

        // Business Card Component
        const BusinessCard = ({ business, onClick }) => {
            if (!business) return null;

            const displayLocation = formatLocation(business.location);

            return React.createElement(
                'div',
                {
                    onClick: onClick,
                    className: "bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group"
                },
                React.createElement(
                    'div',
                    { className: "relative h-48 overflow-hidden" },
                    React.createElement('img', { 
                        src: business.image || business.coverImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800', 
                        alt: business.name, 
                        className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500",
                        onError: (e) => { e.target.src = 'https://via.placeholder.com/800x600?text=No+Image'; }
                    }),
                    React.createElement(
                        'div',
                        { className: "absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-800" },
                        business.category || 'Business'
                    ),
                    business.userName && React.createElement(
                        'div',
                        { className: "absolute top-4 right-4 bg-purple-600/90 backdrop-blur text-white px-2 py-1 rounded-lg text-xs font-bold" },
                        business.userName
                    )
                ),
                React.createElement(
                    'div',
                    { className: "p-5" },
                    React.createElement(
                        'div',
                        { className: "flex justify-between items-start mb-2" },
                        React.createElement(
                            'h3',
                            { className: "text-lg font-bold text-gray-900" },
                            business.name
                        ),
                        business.rating && React.createElement(
                            'div',
                            { className: "flex items-center gap-1 text-amber-500 font-bold text-sm" },
                            React.createElement(Icon, { name: "star", size: 16 }),
                            " ",
                            business.rating
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: "flex items-center gap-1 text-gray-500 text-sm mb-4" },
                        React.createElement(Icon, { name: "map-marker-alt", size: 14 }),
                        " ",
                        displayLocation
                    ),
                    React.createElement(
                        'div',
                        { className: "flex items-center justify-between border-t border-gray-50 pt-4" },
                        React.createElement(
                            'span',
                            { className: "text-xs text-gray-400 font-medium uppercase" },
                            business.reviews ? `${business.reviews} Reviews` : 'New'
                        ),
                        React.createElement(
                            'div',
                            { className: "bg-gray-50 p-2 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors" },
                            React.createElement(Icon, { name: "arrow-right", size: 16 })
                        )
                    )
                )
            );
        };

        return React.createElement(
            'div',
            { className: "pt-20 pb-12 min-h-screen bg-gray-50" },
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
                
                // Header
                React.createElement(
                    'div',
                    { className: "text-center mb-8" },
                    React.createElement(
                        'h1',
                        { className: "text-3xl sm:text-4xl font-extrabold gradient-text mb-3" },
                        "Discover Local Businesses"
                    ),
                    React.createElement(
                        'p',
                        { className: "text-gray-600 text-sm sm:text-base max-w-2xl mx-auto" },
                        `Browse through ${businesses.length} verified business profiles`
                    )
                ),

                // Search & Filters
                React.createElement(
                    'div',
                    { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8" },
                    React.createElement(
                        'div',
                        { className: "space-y-4" },
                        
                        // Search Bar
                        React.createElement(
                            'div',
                            { className: "relative" },
                            React.createElement(Icon, { name: "search", className: "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400", size: 18 }),
                            React.createElement('input', {
                                type: "text",
                                value: searchTerm,
                                onChange: (e) => setSearchTerm(e.target.value),
                                placeholder: "Search businesses...",
                                className: "w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                            })
                        ),

                        // Filter Row
                        React.createElement(
                            'div',
                            { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" },
                            
                            // Location Filter
                            React.createElement(
                                'select',
                                {
                                    value: locationFilter,
                                    onChange: (e) => setLocationFilter(e.target.value),
                                    className: "w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                },
                                locations.map(loc => 
                                    React.createElement('option', { 
                                        key: loc === 'all' ? 'all-locations' : loc, 
                                        value: loc 
                                    },
                                        loc === 'all' ? 'All Locations' : loc
                                    )
                                )
                            ),

                            // Category Filter
                            React.createElement(
                                'select',
                                {
                                    value: categoryFilter,
                                    onChange: (e) => setCategoryFilter(e.target.value),
                                    className: "w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                },
                                categories.map(cat => 
                                    React.createElement('option', { 
                                        key: cat === 'all' ? 'all-categories' : cat, 
                                        value: cat 
                                    },
                                        cat === 'all' ? 'All Categories' : cat
                                    )
                                )
                            ),

                            // Sort By
                            React.createElement(
                                'select',
                                {
                                    value: sortBy,
                                    onChange: (e) => setSortBy(e.target.value),
                                    className: "w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                },
                                [
                                    { value: 'recommended', label: 'Recommended' },
                                    { value: 'rating', label: 'Highest Rated' },
                                    { value: 'views', label: 'Most Viewed' },
                                    { value: 'newest', label: 'Newest First' }
                                ].map(option =>
                                    React.createElement('option', { 
                                        key: option.value, 
                                        value: option.value 
                                    }, option.label)
                                )
                            )
                        ),

                        // Results Count & View Toggle
                        React.createElement(
                            'div',
                            { className: "flex justify-between items-center pt-2" },
                            React.createElement(
                                'p',
                                { className: "text-sm text-gray-500" },
                                React.createElement('span', { className: "font-bold text-indigo-600" }, filteredBusinesses.length),
                                " businesses found"
                            ),
                            React.createElement(
                                'div',
                                { className: "flex gap-2" },
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => setViewMode('grid'),
                                        className: `p-2 rounded-lg transition-all ${
                                            viewMode === 'grid' 
                                                ? 'bg-indigo-600 text-white' 
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`
                                    },
                                    React.createElement(Icon, { name: "th-large", size: 16 })
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => setViewMode('list'),
                                        className: `p-2 rounded-lg transition-all ${
                                            viewMode === 'list' 
                                                ? 'bg-indigo-600 text-white' 
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`
                                    },
                                    React.createElement(Icon, { name: "list", size: 16 })
                                )
                            )
                        )
                    )
                ),

                // Results
                filteredBusinesses.length === 0 ? 
                    React.createElement(
                        'div',
                        { className: "text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100" },
                        React.createElement(Icon, { name: "search", size: 48, className: "text-gray-300 mx-auto mb-4" }),
                        React.createElement('h3', { className: "text-lg font-bold text-gray-700 mb-2" }, "No businesses found"),
                        React.createElement('p', { className: "text-gray-500 text-sm mb-6 max-w-sm mx-auto" },
                            "Try adjusting your search or filters to find what you're looking for."
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: () => {
                                    setSearchTerm('');
                                    setLocationFilter('all');
                                    setCategoryFilter('all');
                                    setSortBy('recommended');
                                },
                                className: "text-indigo-600 font-medium hover:underline text-sm"
                            },
                            "Clear all filters"
                        )
                    ) : 
                    viewMode === 'grid' ? 
                    React.createElement(
                        'div',
                        { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" },
                        filteredBusinesses.map(biz =>
                            React.createElement(BusinessCard, {
                                key: biz.id,
                                business: biz,
                                onClick: () => onSelectBusiness(biz)
                            })
                        )
                    ) : 
                    React.createElement(
                        'div',
                        { className: "space-y-4" },
                        filteredBusinesses.map(biz =>
                            React.createElement(
                                'div',
                                {
                                    key: biz.id,
                                    onClick: () => onSelectBusiness(biz),
                                    className: "bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                                },
                                React.createElement(
                                    'div',
                                    { className: "flex flex-col sm:flex-row gap-4 sm:gap-6" },
                                    
                                    React.createElement(
                                        'div',
                                        { className: "w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0" },
                                        React.createElement('img', {
                                            src: biz.image || biz.coverImage || 'https://via.placeholder.com/400x300',
                                            alt: biz.name,
                                            className: "w-full h-full object-cover",
                                            onError: (e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }
                                        })
                                    ),

                                    React.createElement(
                                        'div',
                                        { className: "flex-1" },
                                        React.createElement(
                                            'div',
                                            { className: "flex flex-wrap items-start justify-between gap-2 mb-2" },
                                            React.createElement(
                                                'h3',
                                                { className: "text-lg font-bold text-gray-900" },
                                                biz.name
                                            ),
                                            biz.rating && React.createElement(
                                                'div',
                                                { className: "flex items-center gap-1 text-amber-500 font-bold text-sm" },
                                                React.createElement(Icon, { name: "star", size: 14, className: "fill-current" }),
                                                biz.rating,
                                                React.createElement('span', { className: "text-gray-400 font-normal text-xs" },
                                                    `(${biz.reviews || 0})`
                                                )
                                            )
                                        ),

                                        React.createElement(
                                            'div',
                                            { className: "flex flex-wrap gap-3 text-xs sm:text-sm text-gray-500 mb-3" },
                                            React.createElement(
                                                'span',
                                                { className: "flex items-center gap-1" },
                                                React.createElement(Icon, { name: "building", size: 12 }),
                                                biz.category || 'General'
                                            ),
                                            React.createElement(
                                                'span',
                                                { className: "flex items-center gap-1" },
                                                React.createElement(Icon, { name: "map-marker-alt", size: 12 }),
                                                formatLocation(biz.location)
                                            ),
                                            biz.userName && React.createElement(
                                                'span',
                                                { className: "flex items-center gap-1 text-purple-600" },
                                                React.createElement(Icon, { name: "user", size: 12 }),
                                                biz.userName
                                            )
                                        ),

                                        biz.description && React.createElement(
                                            'p',
                                            { className: "text-gray-600 text-sm hidden sm:block line-clamp-2 mb-3" },
                                            biz.description
                                        ),

                                        React.createElement(
                                            'div',
                                            { className: "flex flex-wrap gap-4 text-xs text-gray-400" },
                                            React.createElement(
                                                'span',
                                                { className: "flex items-center gap-1" },
                                                React.createElement(Icon, { name: "eye", size: 12 }),
                                                biz.views?.toLocaleString() || 0,
                                                " views"
                                            ),
                                            React.createElement(
                                                'span',
                                                { className: "flex items-center gap-1" },
                                                React.createElement(Icon, { name: "mouse-pointer", size: 12 }),
                                                biz.clicks?.toLocaleString() || 0,
                                                " clicks"
                                            )
                                        )
                                    ),

                                    React.createElement(
                                        'div',
                                        { className: "hidden sm:flex items-center" },
                                        React.createElement(
                                            'div',
                                            { className: "w-8 h-8 rounded-full bg-gray-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors" },
                                            React.createElement(Icon, { name: "arrow-right", size: 16 })
                                        )
                                    )
                                )
                            )
                        )
                    )
            )
        );
    };

    window.DirectoryPage = DirectoryPage;
})();