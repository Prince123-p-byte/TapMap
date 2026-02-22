// Dashboard Page Component
const Dashboard = ({ businesses, onNavigate }) => {
    const [analytics, setAnalytics] = React.useState(null);
    const [recentActivity, setRecentActivity] = React.useState([]);

    React.useEffect(() => {
        loadAnalytics();
        loadRecentActivity();
    }, [businesses]);

    const loadAnalytics = () => {
        const data = DataManager.getAllAnalytics();
        setAnalytics(data);
    };

    const loadRecentActivity = () => {
        // Simulate recent activity
        const activities = [
            { type: 'view', business: 'Lumina Architecture', time: '5 minutes ago', icon: 'eye' },
            { type: 'qr', business: 'Green Eat Co.', time: '15 minutes ago', icon: 'qrcode' },
            { type: 'click', business: 'Revive Wellness', time: '1 hour ago', icon: 'mouse-pointer' },
            { type: 'message', business: 'Lumina Architecture', time: '2 hours ago', icon: 'comment' }
        ];
        setRecentActivity(activities);
    };

    const stats = [
        { icon: 'eye', value: analytics?.totalViews?.toLocaleString() || '0', label: 'Total Views', change: '+12.5%', color: 'primary' },
        { icon: 'mouse-pointer', value: analytics?.totalClicks?.toLocaleString() || '0', label: 'Total Clicks', change: '+8.2%', color: 'green' },
        { icon: 'qrcode', value: analytics?.totalQRScans?.toLocaleString() || '0', label: 'QR Scans', change: '+15.3%', color: 'blue' },
        { icon: 'star', value: analytics?.avgRating || '0', label: 'Avg Rating', change: '+0.2%', color: 'amber' }
    ];

    const quickActions = [
        { icon: 'plus-circle', label: 'Add Business', color: 'bg-indigo-600', onClick: () => onNavigate('sub-businesses') },
        { icon: 'image', label: 'Upload Media', color: 'bg-green-600', onClick: () => onNavigate('media') },
        { icon: 'qrcode', label: 'Generate QR', color: 'bg-purple-600', onClick: () => onNavigate('qr-manager') },
        { icon: 'chart-line', label: 'View Reports', color: 'bg-amber-600', onClick: () => onNavigate('analytics') }
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
                    "Welcome back, Admin"
                ),
                React.createElement(
                    'p',
                    { className: "text-gray-600" },
                    "Here's what's happening with your businesses today."
                )
            ),
            React.createElement(
                'div',
                { className: "flex gap-3" },
                React.createElement(Button, { variant: "secondary", icon: "bell" }, "Notifications"),
                React.createElement(Button, { icon: "plus", onClick: () => onNavigate('sub-businesses') }, "New Business")
            )
        ),

        // Stats Grid
        React.createElement(
            'div',
            { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" },
            stats.map((stat, i) =>
                React.createElement(StatCard, { key: i, ...stat })
            )
        ),

        // Quick Actions
        React.createElement(
            ModernCard,
            { className: "p-6 mb-8" },
            React.createElement(
                'h2',
                { className: "text-lg font-bold mb-4" },
                "Quick Actions"
            ),
            React.createElement(
                'div',
                { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
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

        // Recent Activity & Top Businesses
        React.createElement(
            'div',
            { className: "grid lg:grid-cols-2 gap-6" },
            // Recent Activity
            React.createElement(
                ModernCard,
                { className: "p-6" },
                React.createElement(
                    'div',
                    { className: "flex justify-between items-center mb-4" },
                    React.createElement(
                        'h2',
                        { className: "text-lg font-bold" },
                        "Recent Activity"
                    ),
                    React.createElement(
                        'button',
                        { className: "text-indigo-600 text-sm font-medium hover:underline" },
                        "View All"
                    )
                ),
                React.createElement(
                    'div',
                    { className: "space-y-4" },
                    recentActivity.map((activity, i) =>
                        React.createElement(
                            'div',
                            { key: i, className: "flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors" },
                            React.createElement(
                                'div',
                                { className: "w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center" },
                                React.createElement(Icon, { name: activity.icon })
                            ),
                            React.createElement(
                                'div',
                                { className: "flex-1" },
                                React.createElement(
                                    'p',
                                    { className: "text-sm font-medium text-gray-900" },
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
                ModernCard,
                { className: "p-6" },
                React.createElement(
                    'div',
                    { className: "flex justify-between items-center mb-4" },
                    React.createElement(
                        'h2',
                        { className: "text-lg font-bold" },
                        "Top Performing"
                    ),
                    React.createElement(
                        'button',
                        { className: "text-indigo-600 text-sm font-medium hover:underline" },
                        "View All"
                    )
                ),
                React.createElement(
                    'div',
                    { className: "space-y-4" },
                    businesses.slice(0, 3).map((business, i) =>
                        React.createElement(
                            'div',
                            { key: i, className: "flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
                              onClick: () => onNavigate('profile', business) },
                            React.createElement(
                                'div',
                                { className: "w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold" },
                                business.logo
                            ),
                            React.createElement(
                                'div',
                                { className: "flex-1" },
                                React.createElement(
                                    'p',
                                    { className: "text-sm font-medium text-gray-900" },
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
                                { className: "text-right" },
                                React.createElement(
                                    'p',
                                    { className: "text-sm font-bold text-green-600" },
                                    `+${Math.floor(Math.random() * 20)}%`
                                )
                            )
                        )
                    )
                )
            )
        ),

        // Chart Preview
        React.createElement(
            ModernCard,
            { className: "p-6 mt-6" },
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
            React.createElement(
                'div',
                { className: "h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400" },
                "Chart visualization would go here"
            )
        )
    );
};