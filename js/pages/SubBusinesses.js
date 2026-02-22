// Sub-Businesses Management Page
const SubBusinesses = ({ businesses, onAddBusiness, onEditBusiness, onDeleteBusiness, onViewProfile }) => {
    const [showModal, setShowModal] = React.useState(false);
    const [editingBusiness, setEditingBusiness] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [selectedBusinesses, setSelectedBusinesses] = React.useState([]);

    const filteredBusinesses = businesses.filter(biz => {
        const matchesSearch = biz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             biz.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             biz.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || biz.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleEdit = (business) => {
        setEditingBusiness(business);
        setShowModal(true);
    };

    const handleSave = (businessData) => {
        if (editingBusiness) {
            onEditBusiness({ ...editingBusiness, ...businessData });
            Toast.show('Business updated successfully');
        } else {
            onAddBusiness(businessData);
            Toast.show('Business created successfully');
        }
        setShowModal(false);
        setEditingBusiness(null);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
            onDeleteBusiness(id);
            Toast.show('Business deleted successfully', 'warning');
        }
    };

    const handleBulkDelete = () => {
        if (selectedBusinesses.length === 0) return;
        if (confirm(`Delete ${selectedBusinesses.length} businesses?`)) {
            selectedBusinesses.forEach(id => onDeleteBusiness(id));
            setSelectedBusinesses([]);
            Toast.show(`${selectedBusinesses.length} businesses deleted`, 'warning');
        }
    };

    const columns = [
        { key: 'business', label: 'Business', render: (_, row) => 
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
                    { className: "w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold" },
                    row.logo
                ),
                React.createElement(
                    'div',
                    null,
                    React.createElement('div', { className: "font-medium text-gray-900" }, row.name),
                    React.createElement('div', { className: "text-xs text-gray-500" }, row.category)
                )
            )
        },
        { key: 'location', label: 'Location' },
        { key: 'status', label: 'Status', render: (status) => 
            React.createElement(Badge, { type: status === 'active' ? 'success' : 'warning' }, status.toUpperCase())
        },
        { key: 'stats', label: 'Stats', render: (_, row) => 
            React.createElement(
                'div',
                { className: "text-sm" },
                React.createElement('div', null, `${row.views?.toLocaleString() || 0} views`),
                React.createElement('div', { className: "text-xs text-gray-500" }, `${row.clicks?.toLocaleString() || 0} clicks`)
            )
        },
        { key: 'actions', label: 'Actions', render: (_, row) =>
            React.createElement(
                'div',
                { className: "flex gap-2" },
                React.createElement(
                    'button',
                    {
                        onClick: (e) => { e.stopPropagation(); onViewProfile(row); },
                        className: "p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    },
                    React.createElement(Icon, { name: "eye" })
                ),
                React.createElement(
                    'button',
                    {
                        onClick: (e) => { e.stopPropagation(); handleEdit(row); },
                        className: "p-2 text-gray-400 hover:text-amber-600 transition-colors"
                    },
                    React.createElement(Icon, { name: "edit" })
                ),
                React.createElement(
                    'button',
                    {
                        onClick: (e) => { e.stopPropagation(); handleDelete(row.id); },
                        className: "p-2 text-gray-400 hover:text-red-600 transition-colors"
                    },
                    React.createElement(Icon, { name: "trash" })
                )
            )
        }
    ];

    const stats = [
        { label: 'Total Businesses', value: businesses.length, icon: 'building' },
        { label: 'Active', value: businesses.filter(b => b.status === 'active').length, icon: 'check-circle' },
        { label: 'Total Views', value: businesses.reduce((sum, b) => sum + (b.views || 0), 0).toLocaleString(), icon: 'eye' },
        { label: 'Avg Rating', value: (businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / (businesses.length || 1)).toFixed(1), icon: 'star' }
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
                    "Sub-Businesses"
                ),
                React.createElement(
                    'p',
                    { className: "text-gray-600" },
                    "Manage all your business profiles in one place."
                )
            ),
            React.createElement(
                'div',
                { className: "flex gap-3" },
                selectedBusinesses.length > 0 && React.createElement(
                    Button,
                    { variant: "secondary", icon: "trash", onClick: handleBulkDelete },
                    `Delete (${selectedBusinesses.length})`
                ),
                React.createElement(
                    Button,
                    { icon: "plus", onClick: () => { setEditingBusiness(null); setShowModal(true); } },
                    "Add Business"
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
                            { className: "w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center" },
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
                { className: "flex flex-col md:flex-row gap-4" },
                React.createElement(
                    'div',
                    { className: "flex-1" },
                    React.createElement(SearchBar, {
                        value: searchTerm,
                        onChange: setSearchTerm,
                        placeholder: "Search businesses..."
                    })
                ),
                React.createElement(
                    'select',
                    {
                        value: filterStatus,
                        onChange: (e) => setFilterStatus(e.target.value),
                        className: "px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    },
                    React.createElement('option', { value: "all" }, "All Status"),
                    React.createElement('option', { value: "active" }, "Active"),
                    React.createElement('option', { value: "inactive" }, "Inactive")
                )
            )
        ),

        // Businesses Table
        React.createElement(
            ModernCard,
            { className: "overflow-hidden" },
            filteredBusinesses.length === 0
                ? React.createElement(EmptyState, {
                    icon: "building",
                    title: "No businesses found",
                    description: "Get started by creating your first business.",
                    action: React.createElement(Button, { icon: "plus", onClick: () => setShowModal(true) }, "Add Business")
                  })
                : React.createElement(Table, {
                    columns,
                    data: filteredBusinesses,
                    onRowClick: onViewProfile
                })
        ),

        // Create/Edit Modal
        React.createElement(CreateBusinessModal, {
            isOpen: showModal,
            onClose: () => { setShowModal(false); setEditingBusiness(null); },
            onSave: handleSave,
            editingBusiness
        })
    );
};

// Create/Edit Business Modal
const CreateBusinessModal = ({ isOpen, onClose, onSave, editingBusiness }) => {
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
        images: []
    });

    React.useEffect(() => {
        if (editingBusiness) {
            setFormData(editingBusiness);
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
                images: []
            });
        }
    }, [editingBusiness]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (files) => {
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFormData(prev => ({
                        ...prev,
                        images: [...prev.images, {
                            url: e.target.result,
                            name: file.name,
                            size: file.size
                        }]
                    }));
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const categories = [
        { value: 'Design', label: 'Design' },
        { value: 'Restaurant', label: 'Restaurant' },
        { value: 'Health', label: 'Health' },
        { value: 'Technology', label: 'Technology' },
        { value: 'Education', label: 'Education' },
        { value: 'Retail', label: 'Retail' }
    ];

    const priceRanges = [
        { value: '$', label: '$ - Budget' },
        { value: '$$', label: '$$ - Moderate' },
        { value: '$$$', label: '$$$ - Premium' },
        { value: '$$$$', label: '$$$$ - Luxury' }
    ];

    return React.createElement(
        Modal,
        { isOpen, onClose, title: editingBusiness ? 'Edit Business' : 'Create New Business', size: 'lg' },
        React.createElement(
            'form',
            { onSubmit: handleSubmit, className: "space-y-6" },
            React.createElement(
                'div',
                { className: "grid md:grid-cols-2 gap-6" },
                React.createElement(FormInput, {
                    label: "Business Name",
                    name: "name",
                    value: formData.name,
                    onChange: handleChange,
                    required: true,
                    icon: "building"
                }),
                React.createElement(FormSelect, {
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
                { className: "grid md:grid-cols-2 gap-6" },
                React.createElement(FormInput, {
                    label: "Location",
                    name: "location",
                    value: formData.location,
                    onChange: handleChange,
                    required: true,
                    icon: "map-marker-alt"
                }),
                React.createElement(FormInput, {
                    label: "Address",
                    name: "address",
                    value: formData.address,
                    onChange: handleChange,
                    required: true,
                    icon: "map"
                })
            ),

            React.createElement(
                'div',
                { className: "grid md:grid-cols-3 gap-6" },
                React.createElement(FormInput, {
                    label: "Phone",
                    name: "phone",
                    type: "tel",
                    value: formData.phone,
                    onChange: handleChange,
                    required: true,
                    icon: "phone"
                }),
                React.createElement(FormInput, {
                    label: "Email",
                    name: "email",
                    type: "email",
                    value: formData.email,
                    onChange: handleChange,
                    required: true,
                    icon: "envelope"
                }),
                React.createElement(FormInput, {
                    label: "WhatsApp",
                    name: "whatsapp",
                    type: "tel",
                    value: formData.whatsapp,
                    onChange: handleChange,
                    icon: "whatsapp"
                })
            ),

            React.createElement(FormTextarea, {
                label: "Description",
                name: "description",
                value: formData.description,
                onChange: handleChange,
                required: true,
                rows: 4
            }),

            React.createElement(
                'div',
                { className: "grid md:grid-cols-2 gap-6" },
                React.createElement(FormInput, {
                    label: "Business Hours",
                    name: "hours",
                    value: formData.hours,
                    onChange: handleChange,
                    placeholder: "e.g., Mon-Fri: 9am-6pm",
                    icon: "clock"
                }),
                React.createElement(FormSelect, {
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
                React.createElement('label', { className: "form-label" }, "Gallery Images"),
                React.createElement(DropZone, { onDrop: handleImageUpload }),
                formData.images.length > 0 && React.createElement(ImageGallery, {
                    images: formData.images,
                    onImageDelete: removeImage
                })
            ),

            React.createElement(
                'div',
                { className: "flex justify-end gap-4 pt-6 border-t border-gray-200" },
                React.createElement(Button, { variant: "secondary", onClick: onClose }, "Cancel"),
                React.createElement(Button, { type: "submit", icon: "save" }, editingBusiness ? 'Update' : 'Create')
            )
        )
    );
};