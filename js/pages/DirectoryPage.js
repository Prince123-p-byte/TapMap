// Directory Page Component
const DirectoryPage = ({ businesses, onSelectBusiness }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [locationFilter, setLocationFilter] = React.useState('all');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    const [sortBy, setSortBy] = React.useState('recommended');
    const [viewMode, setViewMode] = React.useState('grid');

    const locations = ['all', ...new Set(businesses.map(b => b.location))];
    const categories = ['all', ...new Set(businesses.map(b => b.category))];

    const filteredBusinesses = businesses
        .filter(biz => {
            const matchesSearch = biz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 biz.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 biz.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLocation = locationFilter === 'all' || biz.location === locationFilter;
            const matchesCategory = categoryFilter === 'all' || biz.category === categoryFilter;
            return matchesSearch && matchesLocation && matchesCategory;
        })
        .sort((a, b) => {
            switch(sortBy) {
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'views':
                    return (b.views || 0) - (a.views || 0);
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                default:
                    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
            }
        });

    return React.createElement(
        'div',
        { className: "pt-24 pb-20 min-h-screen bg-gray-50" },
        React.createElement(
            'div',
            { className: "max-w-7xl mx-auto px-4" },
            // Header
            React.createElement(
                'div',
                { className: "text-center mb-12" },
                React.createElement(
                    'h1',
                    { className: "text-4xl font-extrabold gradient-text mb-4" },
                    "Discover Local Excellence"
                ),
                React.createElement(
                    'p',
                    { className: "text-gray-500 text-lg max-w-2xl mx-auto" },
                    "Browse through hundreds of verified business portfolios and professional services."
                )
            ),

            // Search & Filters
            React.createElement(
                ModernCard,
                { className: "p-6 mb-8" },
                React.createElement(
                    'div',
                    { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
                    React.createElement(
                        'div',
                        { className: "md:col-span-2" },
                        React.createElement(SearchBar, {
                            value: searchTerm,
                            onChange: setSearchTerm,
                            placeholder: "Search businesses, services, or categories..."
                        })
                    ),
                    React.createElement(
                        'select',
                        {
                            value: locationFilter,
                            onChange: (e) => setLocationFilter(e.target.value),
                            className: "px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        },
                        locations.map(loc =>
                            React.createElement('option', { key: loc, value: loc },
                                loc === 'all' ? 'All Locations' : loc
                            )
                        )
                    ),
                    React.createElement(
                        'select',
                        {
                            value: categoryFilter,
                            onChange: (e) => setCategoryFilter(e.target.value),
                            className: "px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        },
                        categories.map(cat =>
                            React.createElement('option', { key: cat, value: cat },
                                cat === 'all' ? 'All Categories' : cat
                            )
                        )
                    )
                )
            ),

            // Results Header
            React.createElement(
                'div',
                { className: "flex justify-between items-center mb-6" },
                React.createElement(
                    'p',
                    { className: "text-gray-600" },
                    React.createElement('span', { className: "font-bold" }, filteredBusinesses.length),
                    " businesses found"
                ),
                React.createElement(
                    'div',
                    { className: "flex gap-3" },
                    React.createElement(
                        'select',
                        {
                            value: sortBy,
                            onChange: (e) => setSortBy(e.target.value),
                            className: "px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        },
                        React.createElement('option', { value: "recommended" }, "Recommended"),
                        React.createElement('option', { value: "rating" }, "Highest Rated"),
                        React.createElement('option', { value: "views" }, "Most Viewed"),
                        React.createElement('option', { value: "newest" }, "Newest First")
                    ),
                    React.createElement(
                        'div',
                        { className: "flex rounded-lg border border-gray-200 overflow-hidden" },
                        React.createElement(
                            'button',
                            {
                                onClick: () => setViewMode('grid'),
                                className: `p-2 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`
                            },
                            React.createElement(Icon, { name: "th-large", size: 18 })
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: () => setViewMode('list'),
                                className: `p-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`
                            },
                            React.createElement(Icon, { name: "list", size: 18 })
                        )
                    )
                )
            ),

            // Results Grid/List
            filteredBusinesses.length === 0
                ? React.createElement(EmptyState, {
                    icon: "search",
                    title: "No businesses found",
                    description: "Try adjusting your search or filters to find what you're looking for."
                  })
                : viewMode === 'grid'
                    ? React.createElement(
                        'div',
                        { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-8" },
                        filteredBusinesses.map(biz =>
                            React.createElement(BusinessCard, {
                                key: biz.id,
                                business: biz,
                                onClick: () => onSelectBusiness(biz)
                            })
                        )
                    )
                    : React.createElement(
                        'div',
                        { className: "space-y-4" },
                        filteredBusinesses.map(biz =>
                            React.createElement(
                                ModernCard,
                                {
                                    key: biz.id,
                                    className: "p-4 hover:shadow-lg transition-all cursor-pointer",
                                    onClick: () => onSelectBusiness(biz)
                                },
                                React.createElement(
                                    'div',
                                    { className: "flex items-center gap-6" },
                                    React.createElement(
                                        'div',
                                        { className: "w-24 h-24 rounded-xl overflow-hidden" },
                                        React.createElement('img', {
                                            src: biz.image || biz.coverImage,
                                            alt: biz.name,
                                            className: "w-full h-full object-cover"
                                        })
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: "flex-1" },
                                        React.createElement(
                                            'div',
                                            { className: "flex items-center gap-3 mb-2" },
                                            React.createElement(
                                                'h3',
                                                { className: "text-xl font-bold text-gray-900" },
                                                biz.name
                                            ),
                                            React.createElement(
                                                'span',
                                                { className: "px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600" },
                                                biz.category
                                            )
                                        ),
                                        React.createElement(
                                            'div',
                                            { className: "flex items-center gap-4 text-sm text-gray-500 mb-2" },
                                            React.createElement(
                                                'span',
                                                { className: "flex items-center gap-1" },
                                                React.createElement(Icon, { name: "map-marker-alt", size: 12 }),
                                                biz.location
                                            ),
                                            React.createElement(
                                                'span',
                                                { className: "flex items-center gap-1" },
                                                React.createElement(Icon, { name: "star", size: 12, className: "text-amber-400" }),
                                                biz.rating,
                                                React.createElement('span', { className: "text-gray-400" }, `(${biz.reviews})`)
                                            )
                                        ),
                                        React.createElement(
                                            'p',
                                            { className: "text-gray-600 text-sm line-clamp-2" },
                                            biz.description
                                        )
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: "text-right" },
                                        React.createElement(
                                            'div',
                                            { className: "text-2xl font-bold text-indigo-600 mb-2" },
                                            biz.rating
                                        ),
                                        React.createElement(
                                            'button',
                                            { className: "text-indigo-600 hover:text-indigo-700" },
                                            React.createElement(Icon, { name: "arrow-right", size: 20 })
                                        )
                                    )
                                )
                            )
                        )
                    ),

            // Pagination
            filteredBusinesses.length > 12 && React.createElement(Pagination, {
                currentPage: 1,
                totalPages: Math.ceil(filteredBusinesses.length / 12),
                onPageChange: () => {}
            })
        )
    );
};