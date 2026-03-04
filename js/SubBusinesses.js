// js/SubBusinesses.js
(function() {
    const SubBusinesses = ({ businesses, onAddBusiness, onEditBusiness, onDeleteBusiness, onViewProfile }) => {
        const [showModal, setShowModal] = React.useState(false);
        const [editingBusiness, setEditingBusiness] = React.useState(null);
        const [searchTerm, setSearchTerm] = React.useState('');
        const [filterStatus, setFilterStatus] = React.useState('all');
        const [selectedBusinesses, setSelectedBusinesses] = React.useState([]);
        const [loading, setLoading] = React.useState(false);

        const filteredBusinesses = businesses.filter(biz => {
            const matchesSearch = biz.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 biz.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (biz.location && biz.location.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = filterStatus === 'all' || biz.status === filterStatus;
            return matchesSearch && matchesStatus;
        });

        const handleEdit = (business) => {
            setEditingBusiness(business);
            setShowModal(true);
        };

        const handleSave = async (businessData) => {
            setLoading(true);
            try {
                if (editingBusiness) {
                    await onEditBusiness({ ...editingBusiness, ...businessData });
                    window.Toast.show('Business updated successfully', 'success');
                } else {
                    await onAddBusiness(businessData);
                    window.Toast.show('Business created successfully', 'success');
                }
                setShowModal(false);
                setEditingBusiness(null);
            } catch (error) {
                console.error('Save error:', error);
                window.Toast.show(error.message || 'Error saving business', 'error');
            } finally {
                setLoading(false);
            }
        };

        const handleDelete = async (id) => {
            if (window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
                await onDeleteBusiness(id);
                window.Toast.show('Business deleted successfully', 'warning');
            }
        };

        const handleBulkDelete = async () => {
            if (selectedBusinesses.length === 0) return;
            if (window.confirm(`Delete ${selectedBusinesses.length} businesses?`)) {
                for (const id of selectedBusinesses) {
                    await onDeleteBusiness(id);
                }
                setSelectedBusinesses([]);
                window.Toast.show(`${selectedBusinesses.length} businesses deleted`, 'warning');
            }
        };

        const columns = [
            { 
                key: 'business', 
                label: 'Business', 
                render: (_, row) => 
                    React.createElement(
                        'div',
                        { className: "flex items-center gap-3" },
                        React.createElement('input', {
                            type: "checkbox",
                            checked: selectedBusinesses.includes(row.id),
                            onChange: (e) => {
                                e.stopPropagation();
                                setSelectedBusinesses(prev =>
                                    e.target.checked
                                        ? [...prev, row.id]
                                        : prev.filter(id => id !== row.id)
                                );
                            },
                            className: "w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        }),
                        React.createElement(
                            'div',
                            { 
                                className: "w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold overflow-hidden flex-shrink-0",
                                style: row.cover_image ? { backgroundImage: `url(${row.cover_image})`, backgroundSize: 'cover' } : {}
                            },
                            !row.cover_image && (row.logo || row.name?.charAt(0).toUpperCase())
                        ),
                        React.createElement(
                            'div',
                            { className: "min-w-0" },
                            React.createElement('div', { className: "font-medium text-gray-900 truncate" }, row.name),
                            React.createElement('div', { className: "text-xs text-gray-500 truncate" }, row.category)
                        )
                    )
            },
            { key: 'location', label: 'Location', render: (loc) => loc || 'Not set' },
            { 
                key: 'status', 
                label: 'Status', 
                render: (status) => 
                    React.createElement(window.Badge, { type: status === 'active' ? 'success' : 'warning' }, (status || 'active').toUpperCase())
            },
            { 
                key: 'stats', 
                label: 'Stats', 
                render: (_, row) => 
                    React.createElement(
                        'div',
                        { className: "text-sm" },
                        React.createElement('div', null, `${row.views?.toLocaleString() || 0} views`),
                        React.createElement('div', { className: "text-xs text-gray-500" }, `${row.clicks?.toLocaleString() || 0} clicks`)
                    )
            },
            { 
                key: 'actions', 
                label: 'Actions', 
                render: (_, row) =>
                    React.createElement(
                        'div',
                        { className: "flex gap-2" },
                        React.createElement(
                            'button',
                            {
                                onClick: (e) => { e.stopPropagation(); onViewProfile(row); },
                                className: "p-2 text-gray-400 hover:text-indigo-600 transition-colors",
                                title: "View Profile"
                            },
                            React.createElement(window.Icon, { name: "eye", size: 16 })
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: (e) => { e.stopPropagation(); handleEdit(row); },
                                className: "p-2 text-gray-400 hover:text-amber-600 transition-colors",
                                title: "Edit Business"
                            },
                            React.createElement(window.Icon, { name: "edit", size: 16 })
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: (e) => { e.stopPropagation(); handleDelete(row.id); },
                                className: "p-2 text-gray-400 hover:text-red-600 transition-colors",
                                title: "Delete Business"
                            },
                            React.createElement(window.Icon, { name: "trash", size: 16 })
                        )
                    )
            }
        ];

        const stats = [
            { 
                label: 'Total Businesses', 
                value: businesses.length, 
                icon: 'building', 
                color: 'bg-blue-100 text-blue-600' 
            },
            { 
                label: 'Active', 
                value: businesses.filter(b => b.status === 'active').length, 
                icon: 'check-circle', 
                color: 'bg-green-100 text-green-600' 
            },
            { 
                label: 'Total Views', 
                value: businesses.reduce((sum, b) => sum + (b.views || 0), 0).toLocaleString(), 
                icon: 'eye', 
                color: 'bg-purple-100 text-purple-600' 
            },
            { 
                label: 'Avg Rating', 
                value: (businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / (businesses.length || 1)).toFixed(1), 
                icon: 'star', 
                color: 'bg-amber-100 text-amber-600' 
            }
        ];

        return React.createElement(
            'div',
            { className: "p-4 md:p-8" },
            
            React.createElement(
                'div',
                { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" },
                React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'h1',
                        { className: "text-3xl font-bold gradient-text mb-2" },
                        "My Businesses"
                    ),
                    React.createElement(
                        'p',
                        { className: "text-gray-600" },
                        `You have ${businesses.length} business${businesses.length !== 1 ? 'es' : ''}`
                    )
                ),
                React.createElement(
                    'div',
                    { className: "flex gap-3 w-full md:w-auto" },
                    selectedBusinesses.length > 0 && React.createElement(
                        window.Button,
                        { variant: "danger", icon: "trash", onClick: handleBulkDelete },
                        `Delete (${selectedBusinesses.length})`
                    ),
                    React.createElement(
                        window.Button,
                        { icon: "plus", onClick: () => { setEditingBusiness(null); setShowModal(true); } },
                        "Add Business"
                    )
                )
            ),

            React.createElement(
                'div',
                { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8" },
                stats.map((stat, i) =>
                    React.createElement(
                        'div',
                        { key: i, className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow" },
                        React.createElement(
                            'div',
                            { className: "flex items-center gap-4" },
                            React.createElement(
                                'div',
                                { className: `w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center` },
                                React.createElement(window.Icon, { name: stat.icon, size: 24 })
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

            React.createElement(
                'div',
                { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6" },
                React.createElement(
                    'div',
                    { className: "flex flex-col md:flex-row gap-4" },
                    React.createElement(
                        'div',
                        { className: "flex-1" },
                        React.createElement(window.SearchBar, {
                            value: searchTerm,
                            onChange: setSearchTerm,
                            placeholder: "Search businesses by name, category, or location..."
                        })
                    ),
                    React.createElement(
                        'select',
                        {
                            value: filterStatus,
                            onChange: (e) => setFilterStatus(e.target.value),
                            className: "px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white md:w-48"
                        },
                        React.createElement('option', { value: "all" }, "All Status"),
                        React.createElement('option', { value: "active" }, "Active"),
                        React.createElement('option', { value: "inactive" }, "Inactive")
                    )
                )
            ),

            React.createElement(
                'div',
                { className: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" },
                filteredBusinesses.length === 0
                    ? React.createElement(window.EmptyState, {
                        icon: "building",
                        title: "No businesses found",
                        description: searchTerm || filterStatus !== 'all' 
                            ? "Try adjusting your search or filters"
                            : "Get started by creating your first business.",
                        action: (!searchTerm && filterStatus === 'all') ? React.createElement(
                            window.Button, 
                            { icon: "plus", onClick: () => setShowModal(true) }, 
                            "Add Business"
                        ) : null
                      })
                    : React.createElement(window.Table, {
                        columns,
                        data: filteredBusinesses,
                        onRowClick: onViewProfile
                    })
            ),

            React.createElement(CreateBusinessModal, {
                isOpen: showModal,
                onClose: () => { setShowModal(false); setEditingBusiness(null); },
                onSave: handleSave,
                editingBusiness,
                loading
            })
        );
    };

    const CreateBusinessModal = ({ isOpen, onClose, onSave, editingBusiness, loading }) => {
        const [formData, setFormData] = React.useState({
            name: '',
            category: '',
            location: '',
            address: '',
            phone: '',
            email: '',
            whatsapp: '',
            description: '',
            hours: '',
            priceRange: '$$',
            status: 'active',
            images: [],
            coverImage: '',
            logo: ''
        });
        const [searchQuery, setSearchQuery] = React.useState('');
        const [syncing, setSyncing] = React.useState(false);
        const [uploadingCover, setUploadingCover] = React.useState(false);
        const [uploadingLogo, setUploadingLogo] = React.useState(false);
        const [uploadingGallery, setUploadingGallery] = React.useState(false);

        React.useEffect(() => {
            if (editingBusiness) {
                setFormData({
                    name: editingBusiness.name || '',
                    category: editingBusiness.category || '',
                    location: editingBusiness.location || '',
                    address: editingBusiness.address || '',
                    phone: editingBusiness.phone || '',
                    email: editingBusiness.email || '',
                    whatsapp: editingBusiness.whatsapp || '',
                    description: editingBusiness.description || '',
                    hours: editingBusiness.hours || '',
                    priceRange: editingBusiness.priceRange || '$$',
                    status: editingBusiness.status || 'active',
                    images: editingBusiness.images || [],
                    coverImage: editingBusiness.cover_image || editingBusiness.coverImage || '',
                    logo: editingBusiness.logo || ''
                });
            } else {
                setFormData({
                    name: '',
                    category: '',
                    location: '',
                    address: '',
                    phone: '',
                    email: '',
                    whatsapp: '',
                    description: '',
                    hours: '',
                    priceRange: '$$',
                    status: 'active',
                    images: [],
                    coverImage: '',
                    logo: ''
                });
            }
        }, [editingBusiness]);

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const uploadToSupabase = async (file, folder) => {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const timestamp = Date.now();
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const fileName = `${folder}/${timestamp}_${cleanFileName}`;
            
            console.log('Uploading to:', fileName);
            
            const { error: uploadError } = await window.supabase.storage
                .from('business-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            const { data: urlData } = window.supabase.storage
                .from('business-images')
                .getPublicUrl(fileName);

            return urlData.publicUrl;
        };

        const handleLogoUpload = async (files) => {
            if (files.length === 0) return;
            
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                window.Toast.show('Please select an image file', 'error');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                window.Toast.show('Logo must be less than 2MB', 'error');
                return;
            }

            setUploadingLogo(true);
            
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFormData(prev => ({ ...prev, logo: e.target.result }));
                };
                reader.readAsDataURL(file);

                const publicUrl = await uploadToSupabase(file, 'logos');
                setFormData(prev => ({ ...prev, logo: publicUrl }));
                window.Toast.show('Logo uploaded successfully', 'success');
                
            } catch (error) {
                console.error('Logo upload error:', error);
                window.Toast.show('Error uploading logo: ' + (error.message || 'Unknown error'), 'error');
            } finally {
                setUploadingLogo(false);
            }
        };

        const handleCoverImageUpload = async (files) => {
            if (files.length === 0) return;
            
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                window.Toast.show('Please select an image file', 'error');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                window.Toast.show('Cover image must be less than 5MB', 'error');
                return;
            }

            setUploadingCover(true);
            
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFormData(prev => ({ ...prev, coverImage: e.target.result }));
                };
                reader.readAsDataURL(file);

                const publicUrl = await uploadToSupabase(file, 'covers');
                setFormData(prev => ({ ...prev, coverImage: publicUrl }));
                window.Toast.show('Cover image uploaded successfully', 'success');
                
            } catch (error) {
                console.error('Cover upload error:', error);
                window.Toast.show('Error uploading cover image: ' + (error.message || 'Unknown error'), 'error');
            } finally {
                setUploadingCover(false);
            }
        };

        const handleGalleryUpload = async (files) => {
            setUploadingGallery(true);
            let successCount = 0;
            
            try {
                for (const file of files) {
                    if (!file.type.startsWith('image/')) continue;
                    
                    if (file.size > 2 * 1024 * 1024) {
                        window.Toast.show(`Skipping ${file.name}: too large (max 2MB)`, 'warning');
                        continue;
                    }

                    const reader = new FileReader();
                    const previewPromise = new Promise((resolve) => {
                        reader.onload = (e) => resolve(e.target.result);
                    });
                    reader.readAsDataURL(file);
                    const preview = await previewPromise;
                    
                    setFormData(prev => ({
                        ...prev,
                        images: [...prev.images, preview]
                    }));

                    const publicUrl = await uploadToSupabase(file, 'gallery');
                    
                    setFormData(prev => ({
                        ...prev,
                        images: prev.images.map(img => 
                            img === preview ? publicUrl : img
                        )
                    }));
                    
                    successCount++;
                }
                
                if (successCount > 0) {
                    window.Toast.show(`${successCount} image${successCount > 1 ? 's' : ''} uploaded`, 'success');
                }
            } catch (error) {
                console.error('Gallery upload error:', error);
                window.Toast.show('Error uploading images: ' + (error.message || 'Unknown error'), 'error');
            } finally {
                setUploadingGallery(false);
            }
        };

        const removeImage = (index) => {
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index)
            }));
        };

        const syncMyLocation = async () => {
            if (!navigator.geolocation) {
                window.Toast.show('Geolocation is not supported by your browser', 'error');
                return;
            }

            setSyncing(true);
            window.Toast.show('Getting your location...', 'info');
            
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                
                const { latitude, longitude } = position.coords;
                
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
                );
                const data = await response.json();
                
                if (data && data.display_name) {
                    const address = data.display_name;
                    const city = data.address?.city || data.address?.town || data.address?.village || '';
                    const state = data.address?.state || '';
                    const country = data.address?.country || '';
                    
                    const locationStr = [city, state, country].filter(Boolean).join(', ');
                    
                    setFormData(prev => ({
                        ...prev,
                        address: address,
                        location: locationStr || 'Location Synced'
                    }));
                    
                    setSearchQuery(address);
                    window.Toast.show('Location synced successfully!', 'success');
                }
            } catch (error) {
                console.error('Geolocation error:', error);
                window.Toast.show('Could not get your location. Please try again.', 'error');
            } finally {
                setSyncing(false);
            }
        };

        const handleLocationSearch = () => {
            if (!searchQuery.trim()) {
                window.Toast.show('Please enter a location to search', 'warning');
                return;
            }

            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const result = data[0];
                        setFormData(prev => ({
                            ...prev,
                            address: result.display_name,
                            location: result.display_name.split(',').slice(0, 2).join(',').trim()
                        }));
                        window.Toast.show('Location found!', 'success');
                    } else {
                        window.Toast.show('Location not found. Try being more specific.', 'warning');
                    }
                })
                .catch(error => {
                    console.error('Search error:', error);
                    window.Toast.show('Error searching location', 'error');
                });
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            
            if (!formData.name) {
                window.Toast.show('Business name is required', 'error');
                return;
            }
            if (!formData.category) {
                window.Toast.show('Category is required', 'error');
                return;
            }
            if (!formData.address) {
                window.Toast.show('Address is required', 'error');
                return;
            }
            
            onSave(formData);
        };

        const categories = [
            { value: 'Design', label: 'Design' },
            { value: 'Restaurant', label: 'Restaurant' },
            { value: 'Health', label: 'Health' },
            { value: 'Technology', label: 'Technology' },
            { value: 'Education', label: 'Education' },
            { value: 'Retail', label: 'Retail' },
            { value: 'Real Estate', label: 'Real Estate' },
            { value: 'Automotive', label: 'Automotive' },
            { value: 'Beauty', label: 'Beauty' },
            { value: 'Fitness', label: 'Fitness' },
            { value: 'Legal', label: 'Legal' },
            { value: 'Financial', label: 'Financial' },
            { value: 'Other', label: 'Other' }
        ];

        const priceRanges = [
            { value: '$', label: '$ - Budget' },
            { value: '$$', label: '$$ - Moderate' },
            { value: '$$$', label: '$$$ - Premium' },
            { value: '$$$$', label: '$$$$ - Luxury' }
        ];

        return React.createElement(
            window.Modal,
            { isOpen, onClose, title: editingBusiness ? 'Edit Business' : 'Create New Business', size: 'lg' },
            React.createElement(
                'form',
                { onSubmit: handleSubmit, className: "space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto px-1" },
                
                React.createElement(
                    'div',
                    null,
                    React.createElement('label', { className: "form-label" }, "Cover Photo"),
                    React.createElement(
                        'div',
                        { className: "mb-4" },
                        formData.coverImage ? React.createElement(
                            'div',
                            { className: "relative w-full h-48 rounded-xl overflow-hidden mb-2" },
                            React.createElement('img', {
                                src: formData.coverImage,
                                alt: "Cover",
                                className: "w-full h-full object-cover"
                            }),
                            React.createElement(
                                'button',
                                {
                                    type: "button",
                                    onClick: () => setFormData(prev => ({ ...prev, coverImage: '' })),
                                    className: "absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                },
                                React.createElement(window.Icon, { name: "times", size: 16 })
                            )
                        ) : React.createElement(
                            'div',
                            { className: "relative" },
                            React.createElement(window.DropZone, { 
                                onDrop: handleCoverImageUpload,
                                accept: "image/*",
                                multiple: false
                            }),
                            uploadingCover && React.createElement(
                                'div',
                                { className: "absolute inset-0 bg-white/80 flex items-center justify-center" },
                                React.createElement(window.LoadingSpinner, null)
                            )
                        )
                    )
                ),

                React.createElement(
                    'div',
                    null,
                    React.createElement('label', { className: "form-label" }, "Business Logo"),
                    React.createElement(
                        'div',
                        { className: "mb-4 flex items-center gap-4" },
                        React.createElement(
                            'div',
                            { className: "w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0" },
                            formData.logo ? 
                                React.createElement('img', {
                                    src: formData.logo,
                                    alt: "Logo",
                                    className: "w-full h-full object-cover"
                                }) :
                                (formData.name?.charAt(0).toUpperCase() || 'L')
                        ),
                        React.createElement(
                            'div',
                            { className: "flex-1 relative" },
                            React.createElement(window.DropZone, { 
                                onDrop: handleLogoUpload,
                                accept: "image/*",
                                multiple: false
                            }),
                            uploadingLogo && React.createElement(
                                'div',
                                { className: "absolute inset-0 bg-white/80 flex items-center justify-center" },
                                React.createElement(window.LoadingSpinner, null)
                            )
                        )
                    )
                ),

                React.createElement(
                    'div',
                    { className: "grid md:grid-cols-2 gap-6" },
                    React.createElement(window.FormInput, {
                        label: "Business Name",
                        name: "name",
                        value: formData.name,
                        onChange: handleChange,
                        required: true,
                        icon: "building"
                    }),
                    React.createElement(window.FormSelect, {
                        label: "Category",
                        name: "category",
                        value: formData.category,
                        onChange: handleChange,
                        options: categories,
                        required: true
                    })
                ),

                React.createElement(
                    'div',
                    null,
                    React.createElement('label', { className: "form-label" }, "Find Location"),
                    React.createElement(
                        'div',
                        { className: "flex flex-col sm:flex-row gap-2" },
                        React.createElement('input', {
                            type: "text",
                            placeholder: "Enter city or address...",
                            value: searchQuery,
                            onChange: (e) => setSearchQuery(e.target.value),
                            className: "flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        }),
                        React.createElement(
                            'div',
                            { className: "flex gap-2" },
                            React.createElement(
                                'button',
                                {
                                    type: "button",
                                    onClick: syncMyLocation,
                                    disabled: syncing,
                                    className: "bg-green-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-600 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                                },
                                React.createElement(window.Icon, { name: syncing ? "spinner" : "location-arrow", size: 18, className: syncing ? "animate-spin" : "" }),
                                "Sync"
                            ),
                            React.createElement(
                                'button',
                                {
                                    type: "button",
                                    onClick: handleLocationSearch,
                                    className: "bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all whitespace-nowrap"
                                },
                                "Search"
                            )
                        )
                    )
                ),

                React.createElement(
                    'div',
                    null,
                    React.createElement('label', { className: "form-label" }, "Full Address *"),
                    React.createElement('textarea', {
                        name: "address",
                        required: true,
                        value: formData.address,
                        onChange: handleChange,
                        rows: "2",
                        className: "form-input",
                        placeholder: "Street address, city, state, zip code"
                    })
                ),

                React.createElement(window.FormInput, {
                    label: "City, State",
                    name: "location",
                    value: formData.location,
                    onChange: handleChange,
                    required: true,
                    icon: "map-marker-alt"
                }),

                React.createElement(
                    'div',
                    { className: "grid md:grid-cols-3 gap-6" },
                    React.createElement(window.FormInput, {
                        label: "Phone",
                        name: "phone",
                        type: "tel",
                        value: formData.phone,
                        onChange: handleChange,
                        required: true,
                        icon: "phone"
                    }),
                    React.createElement(window.FormInput, {
                        label: "Email",
                        name: "email",
                        type: "email",
                        value: formData.email,
                        onChange: handleChange,
                        required: true,
                        icon: "envelope"
                    }),
                    React.createElement(window.FormInput, {
                        label: "WhatsApp",
                        name: "whatsapp",
                        type: "tel",
                        value: formData.whatsapp,
                        onChange: handleChange,
                        icon: "whatsapp"
                    })
                ),

                React.createElement(window.FormTextarea, {
                    label: "Description",
                    name: "description",
                    value: formData.description,
                    onChange: handleChange,
                    required: true,
                    rows: 4,
                    placeholder: "Tell customers about your business..."
                }),

                React.createElement(
                    'div',
                    { className: "grid md:grid-cols-2 gap-6" },
                    React.createElement(window.FormInput, {
                        label: "Business Hours",
                        name: "hours",
                        value: formData.hours,
                        onChange: handleChange,
                        placeholder: "e.g., Mon-Fri: 9am-6pm, Sat: 10am-4pm",
                        icon: "clock"
                    }),
                    React.createElement(window.FormSelect, {
                        label: "Price Range",
                        name: "priceRange",
                        value: formData.priceRange,
                        onChange: handleChange,
                        options: priceRanges
                    })
                ),

                React.createElement(
                    'div',
                    null,
                    React.createElement('label', { className: "form-label" }, "Business Status"),
                    React.createElement(
                        'div',
                        { className: "flex gap-4" },
                        React.createElement(
                            'label',
                            { className: "flex items-center gap-2 cursor-pointer" },
                            React.createElement('input', {
                                type: "radio",
                                name: "status",
                                value: "active",
                                checked: formData.status === 'active',
                                onChange: handleChange,
                                className: "text-indigo-600"
                            }),
                            "Active"
                        ),
                        React.createElement(
                            'label',
                            { className: "flex items-center gap-2 cursor-pointer" },
                            React.createElement('input', {
                                type: "radio",
                                name: "status",
                                value: "inactive",
                                checked: formData.status === 'inactive',
                                onChange: handleChange,
                                className: "text-indigo-600"
                            }),
                            "Inactive"
                        )
                    )
                ),

                React.createElement(
                    'div',
                    null,
                    React.createElement('label', { className: "form-label" }, "Gallery Images"),
                    React.createElement(
                        'div',
                        { className: "relative" },
                        React.createElement(window.DropZone, { 
                            onDrop: handleGalleryUpload,
                            accept: "image/*",
                            multiple: true
                        }),
                        uploadingGallery && React.createElement(
                            'div',
                            { className: "absolute inset-0 bg-white/80 flex items-center justify-center" },
                            React.createElement(window.LoadingSpinner, null)
                        )
                    ),
                    formData.images.length > 0 && React.createElement(
                        'div',
                        { className: "mt-4 grid grid-cols-2 md:grid-cols-4 gap-4" },
                        formData.images.map((img, index) =>
                            React.createElement(
                                'div',
                                { key: index, className: "relative group aspect-square rounded-lg overflow-hidden" },
                                React.createElement('img', {
                                    src: img,
                                    alt: `Gallery ${index + 1}`,
                                    className: "w-full h-full object-cover"
                                }),
                                React.createElement(
                                    'button',
                                    {
                                        type: "button",
                                        onClick: () => removeImage(index),
                                        className: "absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    },
                                    React.createElement(window.Icon, { name: "times", size: 14 })
                                )
                            )
                        )
                    )
                ),

                React.createElement(
                    'div',
                    { className: "flex justify-end gap-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white pb-2" },
                    React.createElement(window.Button, { variant: "secondary", onClick: onClose, disabled: loading }, "Cancel"),
                    React.createElement(
                        window.Button, 
                        { 
                            type: "submit", 
                            icon: loading ? "spinner" : "save",
                            disabled: loading || uploadingCover || uploadingLogo || uploadingGallery,
                            className: (loading || uploadingCover || uploadingLogo || uploadingGallery) ? "opacity-50 cursor-not-allowed" : ""
                        },
                        loading ? "Saving..." : (editingBusiness ? 'Update Business' : 'Create Business')
                    )
                )
            )
        );
    };

    window.SubBusinesses = SubBusinesses;
    window.CreateBusinessModal = CreateBusinessModal;
})();