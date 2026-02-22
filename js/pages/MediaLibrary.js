// Media Library Page
const MediaLibrary = () => {
    const [media, setMedia] = React.useState([]);
    const [selectedMedia, setSelectedMedia] = React.useState([]);
    const [view, setView] = React.useState('grid'); // grid or list
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterType, setFilterType] = React.useState('all');
    const [sortBy, setSortBy] = React.useState('newest');
    const [selectedBusiness, setSelectedBusiness] = React.useState('all');
    const [showUploadModal, setShowUploadModal] = React.useState(false);

    React.useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = () => {
        const mediaData = DataManager.getMedia();
        setMedia(mediaData);
    };

    const businesses = DataManager.getBusinesses();

    const filteredMedia = media.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesBusiness = selectedBusiness === 'all' || item.businessId === parseInt(selectedBusiness);
        return matchesSearch && matchesType && matchesBusiness;
    }).sort((a, b) => {
        switch(sortBy) {
            case 'newest':
                return new Date(b.uploadedAt) - new Date(a.uploadedAt);
            case 'oldest':
                return new Date(a.uploadedAt) - new Date(b.uploadedAt);
            case 'name':
                return a.name.localeCompare(b.name);
            case 'size':
                return (b.size || 0) - (a.size || 0);
            default:
                return 0;
        }
    });

    const handleUpload = (files) => {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newMedia = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    url: e.target.result,
                    type: file.type.split('/')[0],
                    size: file.size,
                    businessId: selectedBusiness !== 'all' ? parseInt(selectedBusiness) : null,
                    businessName: businesses.find(b => b.id === parseInt(selectedBusiness))?.name,
                    uploadedAt: new Date().toISOString()
                };
                DataManager.addMedia(newMedia);
                setMedia(prev => [...prev, newMedia]);
            };
            reader.readAsDataURL(file);
        });
        Toast.show(`${files.length} files uploaded successfully`);
        setShowUploadModal(false);
    };

    const handleDelete = (ids) => {
        if (confirm(`Delete ${ids.length} item(s)?`)) {
            ids.forEach(id => DataManager.deleteMedia(id));
            setMedia(prev => prev.filter(item => !ids.includes(item.id)));
            setSelectedMedia([]);
            Toast.show(`${ids.length} item(s) deleted`, 'warning');
        }
    };

    const stats = [
        {
            icon: 'image',
            label: 'Total Files',
            value: media.length,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            icon: 'hdd',
            label: 'Total Size',
            value: formatBytes(media.reduce((sum, item) => sum + (item.size || 0), 0)),
            color: 'bg-green-100 text-green-600'
        },
        {
            icon: 'building',
            label: 'Businesses',
            value: new Set(media.map(m => m.businessId)).size,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            icon: 'calendar',
            label: 'This Month',
            value: media.filter(m => new Date(m.uploadedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
            color: 'bg-amber-100 text-amber-600'
        }
    ];

    return React.createElement(
        'div',
        { className: "p-8" },
        // Header
        React.createElement(
            'div',
            { className: "flex justify-between items-center mb-8" },
            React.createElement(
                'div',
                null,
                React.createElement(
                    'h1',
                    { className: "text-3xl font-bold gradient-text mb-2" },
                    "Media Library"
                ),
                React.createElement(
                    'p',
                    { className: "text-gray-600" },
                    "Manage all your images, videos, and documents in one place."
                )
            ),
            React.createElement(
                'div',
                { className: "flex gap-3" },
                selectedMedia.length > 0 && React.createElement(
                    Button,
                    { variant: "danger", icon: "trash", onClick: () => handleDelete(selectedMedia) },
                    `Delete (${selectedMedia.length})`
                ),
                React.createElement(
                    Button,
                    { icon: "upload", onClick: () => setShowUploadModal(true) },
                    "Upload Files"
                )
            )
        ),

        // Stats Cards
        React.createElement(
            'div',
            { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" },
            stats.map((stat, i) =>
                React.createElement(
                    ModernCard,
                    { key: i, className: "p-6" },
                    React.createElement(
                        'div',
                        { className: "flex items-center gap-4" },
                        React.createElement(
                            'div',
                            { className: `w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center` },
                            React.createElement(Icon, { name: stat.icon, size: 24 })
                        ),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('div', { className: "text-2xl font-bold" }, stat.value),
                            React.createElement('div', { className: "text-sm text-gray-500" }, stat.label)
                        )
                    )
                )
            )
        ),

        // Filters
        React.createElement(
            ModernCard,
            { className: "p-6 mb-6" },
            React.createElement(
                'div',
                { className: "grid grid-cols-1 md:grid-cols-5 gap-4" },
                React.createElement(
                    'div',
                    { className: "md:col-span-2" },
                    React.createElement(SearchBar, {
                        value: searchTerm,
                        onChange: setSearchTerm,
                        placeholder: "Search media..."
                    })
                ),
                React.createElement(
                    'select',
                    {
                        value: filterType,
                        onChange: (e) => setFilterType(e.target.value),
                        className: "px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    },
                    React.createElement('option', { value: "all" }, "All Types"),
                    React.createElement('option', { value: "image" }, "Images"),
                    React.createElement('option', { value: "video" }, "Videos"),
                    React.createElement('option', { value: "application" }, "Documents")
                ),
                React.createElement(
                    'select',
                    {
                        value: selectedBusiness,
                        onChange: (e) => setSelectedBusiness(e.target.value),
                        className: "px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    },
                    React.createElement('option', { value: "all" }, "All Businesses"),
                    businesses.map(biz =>
                        React.createElement('option', { key: biz.id, value: biz.id }, biz.name)
                    )
                ),
                React.createElement(
                    'select',
                    {
                        value: sortBy,
                        onChange: (e) => setSortBy(e.target.value),
                        className: "px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    },
                    React.createElement('option', { value: "newest" }, "Newest First"),
                    React.createElement('option', { value: "oldest" }, "Oldest First"),
                    React.createElement('option', { value: "name" }, "Name A-Z"),
                    React.createElement('option', { value: "size" }, "Size")
                ),
                React.createElement(
                    'div',
                    { className: "flex gap-2" },
                    React.createElement(
                        'button',
                        {
                            onClick: () => setView('grid'),
                            className: `p-3 rounded-xl border ${view === 'grid' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`
                        },
                        React.createElement(Icon, { name: "th-large" })
                    ),
                    React.createElement(
                        'button',
                        {
                            onClick: () => setView('list'),
                            className: `p-3 rounded-xl border ${view === 'list' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`
                        },
                        React.createElement(Icon, { name: "list" })
                    )
                )
            )
        ),

        // Media Display
        React.createElement(
            ModernCard,
            { className: "p-6" },
            filteredMedia.length === 0
                ? React.createElement(EmptyState, {
                    icon: "images",
                    title: "No media found",
                    description: "Upload images, videos, or documents to get started.",
                    action: React.createElement(Button, { icon: "upload", onClick: () => setShowUploadModal(true) }, "Upload Files")
                  })
                : view === 'grid'
                    ? React.createElement(
                        'div',
                        { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" },
                        filteredMedia.map(item =>
                            React.createElement(
                                'div',
                                {
                                    key: item.id,
                                    className: "relative group cursor-pointer",
                                    onClick: () => {
                                        if (selectedMedia.includes(item.id)) {
                                            setSelectedMedia(prev => prev.filter(id => id !== item.id));
                                        } else {
                                            setSelectedMedia(prev => [...prev, item.id]);
                                        }
                                    }
                                },
                                React.createElement(
                                    'div',
                                    { className: `aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                        selectedMedia.includes(item.id) ? 'border-indigo-600' : 'border-transparent group-hover:border-gray-300'
                                    }` },
                                    item.type === 'image'
                                        ? React.createElement('img', { src: item.url, alt: item.name, className: "w-full h-full object-cover" })
                                        : React.createElement(
                                            'div',
                                            { className: "w-full h-full bg-gray-100 flex items-center justify-center" },
                                            React.createElement(Icon, { name: item.type === 'video' ? 'video' : 'file', size: 32, className: "text-gray-400" })
                                        )
                                ),
                                selectedMedia.includes(item.id) && React.createElement(
                                    'div',
                                    { className: "absolute top-2 left-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center" },
                                    React.createElement(Icon, { name: "check", size: 12, className: "text-white" })
                                ),
                                React.createElement(
                                    'div',
                                    { className: "absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white text-xs truncate" },
                                    item.name
                                )
                            )
                        )
                    )
                    : React.createElement(
                        'div',
                        { className: "space-y-2" },
                        filteredMedia.map(item =>
                            React.createElement(
                                'div',
                                {
                                    key: item.id,
                                    className: `flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${
                                        selectedMedia.includes(item.id) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'
                                    }`,
                                    onClick: () => {
                                        if (selectedMedia.includes(item.id)) {
                                            setSelectedMedia(prev => prev.filter(id => id !== item.id));
                                        } else {
                                            setSelectedMedia(prev => [...prev, item.id]);
                                        }
                                    }
                                },
                                React.createElement(
                                    'div',
                                    { className: "w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center" },
                                    item.type === 'image'
                                        ? React.createElement('img', { src: item.url, alt: item.name, className: "w-full h-full object-cover rounded-lg" })
                                        : React.createElement(Icon, { name: item.type === 'video' ? 'video' : 'file', className: "text-gray-400" })
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex-1" },
                                    React.createElement('div', { className: "font-medium text-gray-900" }, item.name),
                                    React.createElement('div', { className: "text-xs text-gray-500" },
                                        `${item.businessName || 'Unassigned'} • ${formatBytes(item.size)} • ${new Date(item.uploadedAt).toLocaleDateString()}`
                                    )
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: (e) => { e.stopPropagation(); handleDelete([item.id]); },
                                        className: "p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    },
                                    React.createElement(Icon, { name: "trash" })
                                )
                            )
                        )
                    )
        ),

        // Upload Modal
        React.createElement(
            Modal,
            { isOpen: showUploadModal, onClose: () => setShowUploadModal(false), title: "Upload Files", size: "md" },
            React.createElement(
                'div',
                { className: "space-y-6" },
                React.createElement(
                    'div',
                    null,
                    React.createElement('label', { className: "form-label" }, "Assign to Business"),
                    React.createElement(
                        'select',
                        {
                            value: selectedBusiness,
                            onChange: (e) => setSelectedBusiness(e.target.value),
                            className: "form-input"
                        },
                        React.createElement('option', { value: "all" }, "All Businesses"),
                        businesses.map(biz =>
                            React.createElement('option', { key: biz.id, value: biz.id }, biz.name)
                        )
                    )
                ),
                React.createElement(DropZone, { onDrop: handleUpload }),
                React.createElement(
                    'div',
                    { className: "flex justify-end gap-4" },
                    React.createElement(Button, { variant: "secondary", onClick: () => setShowUploadModal(false) }, "Cancel")
                )
            )
        )
    );
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};