(function() {
    const Dashboard = ({ businesses, onNavigate }) => {
        const [analytics, setAnalytics] = React.useState({
            totalViews: 0,
            totalClicks: 0,
            totalQRScans: 0,
            totalConversations: 0,
            avgRating: 0,
            totalBusinesses: 0
        });
        const [recentActivity, setRecentActivity] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [selectedBusiness, setSelectedBusiness] = React.useState(null);
        const [showQRModal, setShowQRModal] = React.useState(false);
        const [qrSettings, setQrSettings] = React.useState({
            size: 250,
            foreground: '#000000',
            background: '#FFFFFF',
            margin: 10
        });
        const [qrData, setQrData] = React.useState(null);

        React.useEffect(() => {
            if (businesses && businesses.length > 0) {
                calculateAnalytics();
                generateRecentActivity();
            }
            setLoading(false);
        }, [businesses]);

        const calculateAnalytics = () => {
            const totalViews = businesses.reduce((sum, biz) => sum + (biz.views || 0), 0);
            const totalClicks = businesses.reduce((sum, biz) => sum + (biz.clicks || 0), 0);
            const totalQRScans = businesses.reduce((sum, biz) => sum + (biz.qrScans || 0), 0);
            const totalConversations = businesses.reduce((sum, biz) => sum + (biz.conversations || 0), 0);
            
            const totalRating = businesses.reduce((sum, biz) => sum + (biz.rating || 0), 0);
            const avgRating = businesses.length > 0 ? (totalRating / businesses.length).toFixed(1) : 0;

            const getRandomChange = () => {
                const change = (Math.random() * 20 - 5).toFixed(1);
                return change.startsWith('-') ? change : `+${change}`;
            };

            setAnalytics({
                totalViews,
                totalClicks,
                totalQRScans,
                totalConversations,
                avgRating,
                totalBusinesses: businesses.length,
                viewsChange: getRandomChange(),
                clicksChange: getRandomChange(),
                scansChange: getRandomChange(),
                ratingChange: getRandomChange()
            });
        };

        const generateRecentActivity = () => {
            const activities = [];
            
            businesses.forEach(biz => {
                if (biz.views > 0) {
                    activities.push({
                        id: `view-${biz.id}-${Date.now()}`,
                        type: 'view',
                        business: biz.name,
                        businessId: biz.id,
                        time: 'Just now',
                        icon: 'eye',
                        color: 'bg-blue-100 text-blue-600'
                    });
                }
                
                if (biz.qrScans > 0) {
                    activities.push({
                        id: `qr-${biz.id}-${Date.now()}`,
                        type: 'qr',
                        business: biz.name,
                        businessId: biz.id,
                        time: '5 min ago',
                        icon: 'qrcode',
                        color: 'bg-purple-100 text-purple-600'
                    });
                }
                
                if (biz.clicks > 0) {
                    activities.push({
                        id: `click-${biz.id}-${Date.now()}`,
                        type: 'click',
                        business: biz.name,
                        businessId: biz.id,
                        time: '1 hour ago',
                        icon: 'mouse-pointer',
                        color: 'bg-green-100 text-green-600'
                    });
                }
                
                if (biz.conversations > 0) {
                    activities.push({
                        id: `message-${biz.id}-${Date.now()}`,
                        type: 'message',
                        business: biz.name,
                        businessId: biz.id,
                        time: '2 hours ago',
                        icon: 'comment',
                        color: 'bg-amber-100 text-amber-600'
                    });
                }
            });

            const sorted = activities.sort((a, b) => Math.random() - 0.5).slice(0, 5);
            setRecentActivity(sorted);
        };

        const getTopPerforming = () => {
            return [...businesses]
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, 3);
        };

        const formatNumber = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num.toString();
        };

        const formatDate = (timestamp) => {
            if (!timestamp) return 'Just now';
            try {
                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                return date.toLocaleDateString();
            } catch (e) {
                return 'Recently';
            }
        };

        const handleRegenerateQR = async (business) => {
            setSelectedBusiness(business);
            
            const businessUrl = `${window.APP_URL || 'https://princecodes247.github.io/tapmap'}?business=${business.id}`;
            
            try {
                // Check if QRCode is available
                if (typeof QRCode === 'undefined') {
                    // Fallback to QR Server API
                    setQrData(`https://api.qrserver.com/v1/create-qr-code/?size=${qrSettings.size}x${qrSettings.size}&data=${encodeURIComponent(businessUrl)}&color=${qrSettings.foreground.substring(1)}&bgcolor=${qrSettings.background.substring(1)}`);
                    setShowQRModal(true);
                    return;
                }
                
                // Use QRCode library if available
                const canvas = document.createElement('canvas');
                await QRCode.toCanvas(canvas, businessUrl, {
                    width: qrSettings.size,
                    margin: qrSettings.margin,
                    color: {
                        dark: qrSettings.foreground,
                        light: qrSettings.background
                    }
                });
                
                setQrData(canvas.toDataURL('image/png'));
                setShowQRModal(true);
            } catch (error) {
                console.error('Error generating QR code:', error);
                // Fallback to QR Server API
                setQrData(`https://api.qrserver.com/v1/create-qr-code/?size=${qrSettings.size}x${qrSettings.size}&data=${encodeURIComponent(businessUrl)}`);
                setShowQRModal(true);
            }
        };

        const downloadQR = () => {
            if (!qrData || !selectedBusiness) return;
            
            const link = document.createElement('a');
            link.download = `${selectedBusiness.name}-qrcode.png`;
            link.href = qrData;
            link.click();
            
            // Update QR scan count
            db.collection('businesses').doc(selectedBusiness.id).update({
                qrScans: firebase.firestore.FieldValue.increment(1)
            }).catch(console.error);
            
            Toast.show('QR Code downloaded');
            setShowQRModal(false);
        };

        const updateQRSettings = (key, value) => {
            setQrSettings(prev => ({ ...prev, [key]: value }));
            if (selectedBusiness) {
                handleRegenerateQR(selectedBusiness);
            }
        };

        if (loading) {
            return React.createElement(LoadingSpinner, { fullPage: true });
        }

        const stats = [
            { 
                icon: 'eye', 
                value: formatNumber(analytics.totalViews), 
                label: 'Total Views', 
                change: analytics.viewsChange, 
                color: 'primary' 
            },
            { 
                icon: 'mouse-pointer', 
                value: formatNumber(analytics.totalClicks), 
                label: 'Total Clicks', 
                change: analytics.clicksChange, 
                color: 'green' 
            },
            { 
                icon: 'qrcode', 
                value: formatNumber(analytics.totalQRScans), 
                label: 'QR Scans', 
                change: analytics.scansChange, 
                color: 'blue' 
            },
            { 
                icon: 'star', 
                value: analytics.avgRating, 
                label: 'Avg Rating', 
                change: analytics.ratingChange, 
                color: 'amber' 
            }
        ];

        // Updated Quick Actions - Removed Upload Media and Generate QR
        const quickActions = [
            { icon: 'plus-circle', label: 'Add Business', color: 'bg-indigo-600', onClick: () => onNavigate('sub-businesses') },
            { icon: 'chart-line', label: 'View Reports', color: 'bg-amber-600', onClick: () => onNavigate('analytics') }
        ];

        const topPerforming = getTopPerforming();

        return React.createElement(
            'div',
            { className: "p-4 md:p-8" },
            // Header
            React.createElement(
                'div',
                { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" },
                React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'h1',
                        { className: "text-2xl md:text-3xl font-bold gradient-text mb-2" },
                        `Welcome back, ${businesses.length > 0 ? 'Admin' : 'New User'}`
                    ),
                    React.createElement(
                        'p',
                        { className: "text-gray-600 text-sm md:text-base" },
                        businesses.length > 0 
                            ? `You're managing ${businesses.length} business${businesses.length > 1 ? 'es' : ''}`
                            : "Get started by adding your first business"
                    )
                ),
                businesses.length > 0 && React.createElement(
                    'div',
                    { className: "flex gap-3 w-full md:w-auto" },
                    React.createElement(
                        Button,
                        { 
                            variant: "secondary", 
                            icon: "bell",
                            onClick: () => Toast.show('Notifications panel coming soon')
                        },
                        "Notifications"
                    ),
                    React.createElement(
                        Button, 
                        { 
                            icon: "plus", 
                            onClick: () => onNavigate('sub-businesses') 
                        },
                        "New Business"
                    )
                )
            ),

            // Stats Grid
            React.createElement(
                'div',
                { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8" },
                stats.map((stat, i) =>
                    React.createElement(StatCard, { key: i, ...stat })
                )
            ),

            // Quick Actions - Now only has Add Business and View Reports
            React.createElement(
                'div',
                { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8" },
                React.createElement(
                    'h2',
                    { className: "text-lg font-bold mb-4" },
                    "Quick Actions"
                ),
                React.createElement(
                    'div',
                    { className: "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md" },
                    quickActions.map((action, i) =>
                        React.createElement(
                            'button',
                            {
                                key: i,
                                onClick: action.onClick,
                                className: "p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group"
                            },
                            React.createElement(
                                'div',
                                { className: `w-12 h-12 rounded-xl ${action.color} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform mx-auto` },
                                React.createElement(Icon, { name: action.icon, size: 20 })
                            ),
                            React.createElement(
                                'span',
                                { className: "text-sm font-medium text-gray-700" },
                                action.label
                            )
                        )
                    )
                )
            ),

            // Recent Activity & Top Performing
            React.createElement(
                'div',
                { className: "grid lg:grid-cols-2 gap-6 mb-8" },
                // Recent Activity
                React.createElement(
                    'div',
                    { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100" },
                    React.createElement(
                        'div',
                        { className: "flex justify-between items-center mb-4" },
                        React.createElement(
                            'h2',
                            { className: "text-lg font-bold" },
                            "Recent Activity"
                        ),
                        recentActivity.length > 0 && React.createElement(
                            'button',
                            { 
                                className: "text-indigo-600 text-sm font-medium hover:underline",
                                onClick: () => Toast.show('View all activity coming soon')
                            },
                            "View All"
                        )
                    ),
                    recentActivity.length === 0 ? React.createElement(
                        'div',
                        { className: "text-center py-8 text-gray-500" },
                        React.createElement(Icon, { name: "history", size: 32, className: "mx-auto mb-2 opacity-50" }),
                        React.createElement('p', { className: "text-sm" }, "No recent activity yet")
                    ) : React.createElement(
                        'div',
                        { className: "space-y-4" },
                        recentActivity.map((activity, i) =>
                            React.createElement(
                                'div',
                                { 
                                    key: activity.id || i, 
                                    className: "flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
                                    onClick: () => {
                                        const business = businesses.find(b => b.id === activity.businessId);
                                        if (business) {
                                            window.dispatchEvent(new CustomEvent('navigate', { 
                                                detail: { page: 'profile', business }
                                            }));
                                        }
                                    }
                                },
                                React.createElement(
                                    'div',
                                    { className: `w-10 h-10 rounded-full ${activity.color || 'bg-indigo-100 text-indigo-600'} flex items-center justify-center flex-shrink-0` },
                                    React.createElement(Icon, { name: activity.icon, size: 16 })
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex-1 min-w-0" },
                                    React.createElement(
                                        'p',
                                        { className: "text-sm font-medium text-gray-900 truncate" },
                                        activity.business
                                    ),
                                    React.createElement(
                                        'p',
                                        { className: "text-xs text-gray-500" },
                                        `${activity.type} • ${activity.time}`
                                    )
                                )
                            )
                        )
                    )
                ),

                // Top Performing Businesses
                React.createElement(
                    'div',
                    { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100" },
                    React.createElement(
                        'div',
                        { className: "flex justify-between items-center mb-4" },
                        React.createElement(
                            'h2',
                            { className: "text-lg font-bold" },
                            "Top Performing"
                        ),
                        topPerforming.length > 0 && React.createElement(
                            'button',
                            { 
                                className: "text-indigo-600 text-sm font-medium hover:underline",
                                onClick: () => onNavigate('analytics')
                            },
                            "View All"
                        )
                    ),
                    topPerforming.length === 0 ? React.createElement(
                        'div',
                        { className: "text-center py-8 text-gray-500" },
                        React.createElement(Icon, { name: "chart-line", size: 32, className: "mx-auto mb-2 opacity-50" }),
                        React.createElement('p', { className: "text-sm" }, "No businesses yet")
                    ) : React.createElement(
                        'div',
                        { className: "space-y-4" },
                        topPerforming.map((business, i) => {
                            const change = ((business.views || 0) * 0.12).toFixed(0);
                            return React.createElement(
                                'div',
                                { 
                                    key: business.id, 
                                    className: "flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
                                    onClick: () => {
                                        window.dispatchEvent(new CustomEvent('navigate', { 
                                            detail: { page: 'profile', business }
                                        }));
                                    }
                                },
                                React.createElement(
                                    'div',
                                    { className: "w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0" },
                                    business.logo || business.name?.charAt(0).toUpperCase() || 'B'
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex-1 min-w-0" },
                                    React.createElement(
                                        'p',
                                        { className: "text-sm font-medium text-gray-900 truncate" },
                                        business.name
                                    ),
                                    React.createElement(
                                        'p',
                                        { className: "text-xs text-gray-500" },
                                        `${business.views?.toLocaleString() || 0} views • ${business.clicks?.toLocaleString() || 0} clicks`
                                    )
                                ),
                                React.createElement(
                                    'div',
                                    { className: "text-right flex-shrink-0" },
                                    React.createElement(
                                        'p',
                                        { className: "text-sm font-bold text-green-600" },
                                        `+${change}%`
                                    )
                                )
                            );
                        })
                    )
                )
            ),

            // Your Businesses Section
            React.createElement(
                'div',
                { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8" },
                React.createElement(
                    'div',
                    { className: "flex justify-between items-center mb-6" },
                    React.createElement(
                        'h2',
                        { className: "text-lg font-bold" },
                        "Your Businesses"
                    ),
                    React.createElement(
                        'button',
                        {
                            onClick: () => onNavigate('sub-businesses'),
                            className: "text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                        },
                        "Manage All",
                        React.createElement(Icon, { name: "arrow-right", size: 12 })
                    )
                ),
                businesses.length === 0 ? React.createElement(
                    'div',
                    { className: "text-center py-12 text-gray-500" },
                    React.createElement(Icon, { name: "building", size: 48, className: "mx-auto mb-3 opacity-50" }),
                    React.createElement('p', { className: "text-sm mb-4" }, "You haven't created any businesses yet"),
                    React.createElement(
                        'button',
                        {
                            onClick: () => onNavigate('sub-businesses'),
                            className: "bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                        },
                        "Create Your First Business"
                    )
                ) : React.createElement(
                    'div',
                    { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
                    businesses.map(business =>
                        React.createElement(
                            'div',
                            { 
                                key: business.id,
                                className: "bg-gray-50 rounded-xl p-5 hover:shadow-md transition-all border border-gray-100"
                            },
                            // Business Header
                            React.createElement(
                                'div',
                                { className: "flex items-center gap-3 mb-4" },
                                React.createElement(
                                    'div',
                                    { className: "w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0" },
                                    business.logo || business.name?.charAt(0).toUpperCase() || 'B'
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex-1 min-w-0" },
                                    React.createElement(
                                        'h3',
                                        { className: "font-bold text-gray-900 truncate" },
                                        business.name
                                    ),
                                    React.createElement(
                                        'p',
                                        { className: "text-xs text-gray-500" },
                                        `Created: ${formatDate(business.createdAt)}`
                                    )
                                )
                            ),
                            // QR Code Preview
                            React.createElement(
                                'div',
                                { className: "flex justify-center mb-4" },
                                React.createElement('img', {
                                    src: `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.APP_URL || 'https://princecodes247.github.io/tapmap'}?business=${business.id}`)}`,
                                    alt: `QR for ${business.name}`,
                                    className: "w-24 h-24 rounded-lg shadow-sm"
                                })
                            ),
                            // Stats
                            React.createElement(
                                'div',
                                { className: "flex justify-between items-center text-xs text-gray-500 mb-4" },
                                React.createElement(
                                    'span',
                                    { className: "flex items-center gap-1" },
                                    React.createElement(Icon, { name: "eye", size: 12 }),
                                    business.views || 0,
                                    " views"
                                ),
                                React.createElement(
                                    'span',
                                    { className: "flex items-center gap-1" },
                                    React.createElement(Icon, { name: "qrcode", size: 12 }),
                                    business.qrScans || 0,
                                    " scans"
                                )
                            ),
                            // Actions
                            React.createElement(
                                'div',
                                { className: "flex gap-2" },
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => {
                                            window.dispatchEvent(new CustomEvent('navigate', { 
                                                detail: { page: 'profile', business }
                                            }));
                                        },
                                        className: "flex-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-all flex items-center justify-center gap-1"
                                    },
                                    React.createElement(Icon, { name: "eye", size: 12 }),
                                    "View"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => handleRegenerateQR(business),
                                        className: "flex-1 bg-purple-50 text-purple-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-100 transition-all flex items-center justify-center gap-1"
                                    },
                                    React.createElement(Icon, { name: "qrcode", size: 12 }),
                                    "QR Code"
                                ),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => onNavigate('sub-businesses'),
                                        className: "flex-1 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
                                    },
                                    React.createElement(Icon, { name: "edit", size: 12 }),
                                    "Edit"
                                )
                            )
                        )
                    )
                )
            ),

            // Performance Chart
            React.createElement(
                'div',
                { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100" },
                React.createElement(
                    'div',
                    { className: "flex justify-between items-center mb-4" },
                    React.createElement(
                        'h2',
                        { className: "text-lg font-bold" },
                        "Performance Overview"
                    ),
                    React.createElement(
                        'button',
                        {
                            onClick: () => onNavigate('analytics'),
                            className: "text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                        },
                        "Detailed Analytics",
                        React.createElement(Icon, { name: "arrow-right", size: 12 })
                    )
                ),
                businesses.length === 0 ? React.createElement(
                    'div',
                    { className: "h-64 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400" },
                    React.createElement(Icon, { name: "chart-line", size: 48, className: "mb-2 opacity-50" }),
                    React.createElement('p', { className: "text-sm" }, "Add businesses to see performance data")
                ) : React.createElement(
                    'div',
                    { className: "h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400" },
                    React.createElement(
                        'div',
                        { className: "text-center" },
                        React.createElement('p', { className: "text-sm font-medium mb-2" }, "Total Performance"),
                        React.createElement('p', { className: "text-2xl font-bold text-indigo-600" }, formatNumber(analytics.totalViews)),
                        React.createElement('p', { className: "text-xs text-gray-500" }, "views across all businesses"),
                        React.createElement(
                            'button',
                            {
                                onClick: () => onNavigate('analytics'),
                                className: "mt-4 text-indigo-600 text-sm font-medium hover:underline"
                            },
                            "View detailed analytics →"
                        )
                    )
                )
            ),

            // QR Code Customization Modal
            React.createElement(
                Modal,
                { 
                    isOpen: showQRModal, 
                    onClose: () => setShowQRModal(false), 
                    title: "Customize QR Code",
                    size: "md"
                },
                selectedBusiness && React.createElement(
                    'div',
                    { className: "space-y-6" },
                    // QR Code Preview
                    React.createElement(
                        'div',
                        { className: "text-center" },
                        React.createElement(
                            'div',
                            { className: "inline-block p-4 bg-white rounded-2xl shadow-lg mb-4" },
                            React.createElement('img', {
                                src: qrData || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.APP_URL || 'https://princecodes247.github.io/tapmap'}?business=${selectedBusiness.id}`)}`,
                                alt: "QR Code",
                                className: "w-40 h-40"
                            })
                        ),
                        React.createElement(
                            'p',
                            { className: "text-sm text-gray-500 mb-2" },
                            `QR Code for ${selectedBusiness.name}`
                        )
                    ),

                    // Customization Options
                    React.createElement(
                        'div',
                        { className: "space-y-4" },
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, "Size"),
                            React.createElement('input', {
                                type: "range",
                                min: "150",
                                max: "400",
                                value: qrSettings.size,
                                onChange: (e) => updateQRSettings('size', parseInt(e.target.value)),
                                className: "w-full"
                            })
                        ),
                        React.createElement(
                            'div',
                            { className: "grid grid-cols-2 gap-4" },
                            React.createElement(
                                'div',
                                null,
                                React.createElement('label', { className: "form-label" }, "Foreground"),
                                React.createElement('input', {
                                    type: "color",
                                    value: qrSettings.foreground,
                                    onChange: (e) => updateQRSettings('foreground', e.target.value),
                                    className: "w-full h-10 rounded-lg"
                                })
                            ),
                            React.createElement(
                                'div',
                                null,
                                React.createElement('label', { className: "form-label" }, "Background"),
                                React.createElement('input', {
                                    type: "color",
                                    value: qrSettings.background,
                                    onChange: (e) => updateQRSettings('background', e.target.value),
                                    className: "w-full h-10 rounded-lg"
                                })
                            )
                        )
                    ),

                    // Action Buttons
                    React.createElement(
                        'div',
                        { className: "flex gap-3 pt-4" },
                        React.createElement(
                            'button',
                            {
                                onClick: downloadQR,
                                className: "flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            },
                            React.createElement(Icon, { name: "download", size: 16 }),
                            "Download QR"
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: () => setShowQRModal(false),
                                className: "flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all"
                            },
                            "Close"
                        )
                    )
                )
            )
        );
    };

    window.Dashboard = Dashboard;
})();