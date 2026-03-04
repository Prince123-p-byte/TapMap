// Reusable Components

// Icon Component
const Icon = ({ name, className = '', size = 20, ...props }) => {
    return React.createElement('i', {
        className: `fas fa-${name} ${className}`,
        style: { fontSize: size },
        ...props
    });
};

// Modern Card Component
const ModernCard = ({ children, className = '', onClick }) => {
    return React.createElement(
        'div',
        {
            className: `modern-card ${className}`,
            onClick
        },
        children
    );
};

// Button Component
const Button = ({ children, variant = 'primary', size = 'md', icon, onClick, disabled, type = 'button', className = '' }) => {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
        warning: 'bg-amber-600 text-white hover:bg-amber-700'
    };

    return React.createElement(
        'button',
        {
            type,
            className: `btn-modern ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
            onClick,
            disabled
        },
        icon && React.createElement(Icon, { name: icon, size: size === 'sm' ? 14 : 16, className: "mr-2" }),
        children
    );
};

// Stat Card Component
const StatCard = ({ icon, value, label, change, color = 'primary' }) => {
    const colors = {
        primary: 'bg-indigo-100 text-indigo-600',
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        amber: 'bg-amber-100 text-amber-600',
        purple: 'bg-purple-100 text-purple-600',
        red: 'bg-red-100 text-red-600'
    };

    const colorClass = colors[color] || colors.primary;

    return React.createElement(
        'div',
        { className: "stat-card" },
        React.createElement(
            'div',
            { className: `stat-icon ${colorClass}` },
            React.createElement(Icon, { name: icon })
        ),
        React.createElement(
            'div',
            { className: "stat-value" },
            value
        ),
        React.createElement(
            'div',
            { className: "stat-label" },
            label
        ),
        change && React.createElement(
            'div',
            { className: `stat-change ${change.startsWith('+') ? 'positive' : 'negative'}` },
            change
        )
    );
};

// Badge Component
const Badge = ({ children, type = 'success' }) => {
    return React.createElement(
        'span',
        { className: `badge badge-${type}` },
        children
    );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[90vw]'
    };

    // Close modal when clicking escape key
    React.useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return React.createElement(
        'div',
        { className: "modal-overlay", onClick: onClose },
        React.createElement(
            'div',
            { className: `modal-content ${sizeClasses[size]}`, onClick: e => e.stopPropagation() },
            React.createElement(
                'div',
                { className: "flex justify-between items-center mb-6" },
                React.createElement(
                    'h2',
                    { className: "text-2xl font-bold gradient-text" },
                    title
                ),
                React.createElement(
                    'button',
                    { 
                        onClick: onClose, 
                        className: "w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-500 hover:text-gray-700"
                    },
                    React.createElement(Icon, { name: "times", size: 20 })
                )
            ),
            children
        )
    );
};

// Form Input Component
const FormInput = ({ label, name, type = 'text', value, onChange, required, error, placeholder, icon }) => {
    return React.createElement(
        'div',
        { className: "form-group" },
        label && React.createElement(
            'label',
            { htmlFor: name, className: "form-label" },
            label,
            required && React.createElement('span', { className: "text-red-500 ml-1" }, '*')
        ),
        React.createElement(
            'div',
            { className: "relative" },
            icon && React.createElement(
                'div',
                { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" },
                React.createElement(Icon, { name: icon, size: 16 })
            ),
            React.createElement('input', {
                id: name,
                name,
                type,
                value,
                onChange,
                required,
                placeholder,
                className: `form-input ${error ? 'error' : ''} ${icon ? 'pl-10' : ''}`
            })
        ),
        error && React.createElement(
            'p',
            { className: "text-red-500 text-xs mt-1" },
            error
        )
    );
};

// Form Select Component
const FormSelect = ({ label, name, value, onChange, options, required }) => {
    return React.createElement(
        'div',
        { className: "form-group" },
        label && React.createElement(
            'label',
            { htmlFor: name, className: "form-label" },
            label,
            required && React.createElement('span', { className: "text-red-500 ml-1" }, '*')
        ),
        React.createElement(
            'select',
            { 
                id: name,
                name,
                value, 
                onChange, 
                required, 
                className: "form-input" 
            },
            options.map(opt => 
                React.createElement(
                    'option',
                    { key: opt.value, value: opt.value },
                    opt.label
                )
            )
        )
    );
};

// Form Textarea Component
const FormTextarea = ({ label, name, value, onChange, required, rows = 4, placeholder }) => {
    return React.createElement(
        'div',
        { className: "form-group" },
        label && React.createElement(
            'label',
            { htmlFor: name, className: "form-label" },
            label,
            required && React.createElement('span', { className: "text-red-500 ml-1" }, '*')
        ),
        React.createElement('textarea', {
            id: name,
            name,
            value,
            onChange,
            required,
            rows,
            placeholder,
            className: "form-input"
        })
    );
};

// DropZone Component
// DropZone Component - Updated to handle single files
const DropZone = ({ onDrop, accept = 'image/*', multiple = true }) => {
    const [dragging, setDragging] = React.useState(false);
    const fileInputRef = React.useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragging(true);
        } else if (e.type === "dragleave") {
            setDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        
        const files = Array.from(e.dataTransfer.files);
        onDrop(files);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        onDrop(files);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return React.createElement(
        'div',
        {
            className: `dropzone ${dragging ? 'dragging' : ''}`,
            onDragEnter: handleDrag,
            onDragLeave: handleDrag,
            onDragOver: handleDrag,
            onDrop: handleDrop,
            onClick: handleClick
        },
        React.createElement(
            'div',
            { className: "flex flex-col items-center" },
            React.createElement(Icon, { name: "cloud-upload-alt", size: 48, className: "text-gray-400 mb-4" }),
            React.createElement(
                'p',
                { className: "text-gray-600 font-medium mb-2" },
                "Drag and drop " + (multiple ? "files" : "a file") + " here, or "
            ),
            React.createElement(
                'span',
                { className: "text-indigo-600 font-bold cursor-pointer hover:text-indigo-700" },
                "browse"
            ),
            React.createElement('input', {
                ref: fileInputRef,
                type: "file",
                multiple,
                accept,
                className: "hidden",
                onChange: handleFileInput
            })
        )
    );
};

// Image Gallery Component
const ImageGallery = ({ images, onImageClick, onImageDelete }) => {
    if (!images || images.length === 0) {
        return React.createElement(
            'div',
            { className: "text-center py-12 text-gray-400" },
            React.createElement(Icon, { name: "images", size: 48, className: "mb-4 opacity-50" }),
            React.createElement('p', null, "No images to display")
        );
    }

    return React.createElement(
        'div',
        { className: "gallery-grid" },
        images.map((image, index) => {
            const imageUrl = typeof image === 'string' ? image : image.url;
            return React.createElement(
                'div',
                { 
                    key: index, 
                    className: "gallery-item group",
                    onClick: () => onImageClick?.(image)
                },
                React.createElement('img', { src: imageUrl, alt: `Gallery ${index}` }),
                React.createElement(
                    'div',
                    { className: "gallery-item-overlay" },
                    React.createElement(
                        'div',
                        { className: "flex gap-2" },
                        React.createElement(
                            'button',
                            {
                                onClick: (e) => {
                                    e.stopPropagation();
                                    onImageClick?.(image);
                                },
                                className: "bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            },
                            React.createElement(Icon, { name: "eye", size: 16 })
                        ),
                        onImageDelete && React.createElement(
                            'button',
                            {
                                onClick: (e) => {
                                    e.stopPropagation();
                                    onImageDelete(index);
                                },
                                className: "bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                            },
                            React.createElement(Icon, { name: "trash", size: 16 })
                        )
                    )
                )
            );
        })
    );
};

// Table Component
const Table = ({ columns, data, onRowClick }) => {
    return React.createElement(
        'div',
        { className: "overflow-x-auto" },
        React.createElement(
            'table',
            { className: "modern-table" },
            React.createElement(
                'thead',
                null,
                React.createElement(
                    'tr',
                    null,
                    columns.map(col =>
                        React.createElement('th', { 
                            key: col.key, 
                            style: col.width ? { width: col.width } : null 
                        }, col.label)
                    )
                )
            ),
            React.createElement(
                'tbody',
                null,
                data.map((row, index) =>
                    React.createElement(
                        'tr',
                        {
                            key: row.id || index,
                            onClick: () => onRowClick?.(row),
                            className: onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                        },
                        columns.map(col =>
                            React.createElement(
                                'td',
                                { key: col.key },
                                col.render ? col.render(row[col.key], row) : row[col.key]
                            )
                        )
                    )
                )
            )
        )
    );
};

// Tabs Component
const Tabs = ({ tabs, activeTab, onTabChange }) => {
    return React.createElement(
        'div',
        { className: "border-b border-gray-200 mb-6" },
        React.createElement(
            'nav',
            { className: "flex gap-8 overflow-x-auto pb-1" },
            tabs.map(tab =>
                React.createElement(
                    'button',
                    {
                        key: tab.id,
                        onClick: () => onTabChange(tab.id),
                        className: `pb-4 px-1 font-medium text-sm transition-all relative whitespace-nowrap ${
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
    );
};

// Loading Spinner
const LoadingSpinner = ({ fullPage = false }) => {
    const className = fullPage 
        ? "fixed inset-0 bg-white/80 flex items-center justify-center z-50"
        : "flex justify-center items-center py-12";

    return React.createElement(
        'div',
        { className },
        React.createElement('div', { className: "spinner" })
    );
};

// Empty State
const EmptyState = ({ icon, title, description, action }) => {
    return React.createElement(
        'div',
        { className: "text-center py-16 px-4" },
        React.createElement(Icon, { name: icon, size: 64, className: "text-gray-300 mx-auto mb-4" }),
        React.createElement('h3', { className: "text-lg font-bold text-gray-700 mb-2" }, title),
        React.createElement('p', { className: "text-gray-500 mb-6 max-w-sm mx-auto" }, description),
        action && action
    );
};

// Search Bar
const SearchBar = ({ value, onChange, placeholder }) => {
    return React.createElement(
        'div',
        { className: "relative" },
        React.createElement(Icon, { name: "search", className: "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" }),
        React.createElement('input', {
            type: "text",
            value,
            onChange: (e) => onChange(e.target.value),
            placeholder,
            className: "w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        }),
        value && React.createElement(
            'button',
            {
                onClick: () => onChange(''),
                className: "absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            },
            React.createElement(Icon, { name: "times-circle", size: 16 })
        )
    );
};

// Pagination
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }

        range.forEach(i => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    return React.createElement(
        'div',
        { className: "flex justify-center items-center gap-2 mt-8" },
        React.createElement(
            'button',
            {
                onClick: () => onPageChange(currentPage - 1),
                disabled: currentPage === 1,
                className: "w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            },
            React.createElement(Icon, { name: "chevron-left", size: 14 })
        ),
        getPageNumbers().map((page, index) => 
            page === '...' 
                ? React.createElement(
                    'span',
                    { key: `dots-${index}`, className: "px-2 text-gray-400" },
                    '...'
                )
                : React.createElement(
                    'button',
                    {
                        key: page,
                        onClick: () => onPageChange(page),
                        className: `w-10 h-10 rounded-lg font-medium transition-all ${
                            currentPage === page
                                ? 'bg-indigo-600 text-white'
                                : 'border border-gray-200 hover:bg-gray-50'
                        }`
                    },
                    page
                )
        ),
        React.createElement(
            'button',
            {
                onClick: () => onPageChange(currentPage + 1),
                disabled: currentPage === totalPages,
                className: "w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            },
            React.createElement(Icon, { name: "chevron-right", size: 14 })
        )
    );
};

// Toast notification system
const Toast = {
    show(message, type = 'success', duration = 3000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${this.getIcon(type)}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        // Add animation
        toast.style.animation = 'slideIn 0.3s ease';

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    getIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
};
// Business Card Component - Fixed to handle objects properly
const BusinessCard = ({ business, onClick }) => {
    if (!business) return null;

    // Safely get location string
    const locationString = React.useMemo(() => {
        if (!business.location) return 'Location TBD';
        if (typeof business.location === 'string') return business.location;
        if (typeof business.location === 'object') {
            // If it's an object with lat/lng, format it
            if (business.location.lat && business.location.lng) {
                return `${business.location.lat.toFixed(4)}, ${business.location.lng.toFixed(4)}`;
            }
            return JSON.stringify(business.location);
        }
        return 'Location TBD';
    }, [business.location]);

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
                locationString
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

// Make it globally available
window.BusinessCard = BusinessCard;
window.Icon = Icon;
window.ModernCard = ModernCard;
window.Button = Button;
window.StatCard = StatCard;
window.Badge = Badge;
window.Modal = Modal;
window.FormInput = FormInput;
window.FormSelect = FormSelect;
window.FormTextarea = FormTextarea;
window.DropZone = DropZone;
window.ImageGallery = ImageGallery;
window.Table = Table;
window.Tabs = Tabs;
window.LoadingSpinner = LoadingSpinner;
window.EmptyState = EmptyState;
window.SearchBar = SearchBar;
window.Pagination = Pagination;
window.Toast = Toast;
window.BusinessCard = BusinessCard;

// Add slideOut animation to styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);