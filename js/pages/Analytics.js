// Analytics Page
const Analytics = () => {
    const [timeframe, setTimeframe] = React.useState('week');
    const [analyticsData, setAnalyticsData] = React.useState(null);
    const [selectedBusiness, setSelectedBusiness] = React.useState('all');
    const [chartInstances, setChartInstances] = React.useState({});

    React.useEffect(() => {
        loadAnalytics();
    }, [timeframe, selectedBusiness]);

    React.useEffect(() => {
        if (analyticsData) {
            renderCharts();
        }
        return () => {
            // Cleanup charts
            Object.values(chartInstances).forEach(chart => chart?.destroy());
        };
    }, [analyticsData]);

    const loadAnalytics = () => {
        const businesses = DataManager.getBusinesses();
        const analytics = DataManager.getAnalytics();
        
        let data;
        if (selectedBusiness === 'all') {
            data = analytics[timeframe] || DataManager.generateDailyData();
        } else {
            const business = businesses.find(b => b.id === parseInt(selectedBusiness));
            data = {
                labels: timeframe === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                       timeframe === 'month' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
                       ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                views: Array.from({ length: timeframe === 'week' ? 7 : timeframe === 'month' ? 4 : 6 }, 
                    () => Math.floor(Math.random() * (business?.views || 1000))),
                clicks: Array.from({ length: timeframe === 'week' ? 7 : timeframe === 'month' ? 4 : 6 }, 
                    () => Math.floor(Math.random() * (business?.clicks || 500))),
                scans: Array.from({ length: timeframe === 'week' ? 7 : timeframe === 'month' ? 4 : 6 }, 
                    () => Math.floor(Math.random() * (business?.qrScans || 300)))
            };
        }
        
        setAnalyticsData(data);
    };

    const renderCharts = () => {
        // Destroy existing charts
        Object.values(chartInstances).forEach(chart => chart?.destroy());

        // Main Performance Chart
        const mainCtx = document.getElementById('mainChart')?.getContext('2d');
        if (mainCtx) {
            const mainChart = new Chart(mainCtx, {
                type: 'line',
                data: {
                    labels: analyticsData.labels || 
                           (timeframe === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                            timeframe === 'month' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
                            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']),
                    datasets: [
                        {
                            label: 'Views',
                            data: analyticsData.views || [],
                            borderColor: '#4f46e5',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Clicks',
                            data: analyticsData.clicks || [],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'QR Scans',
                            data: analyticsData.scans || [],
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        }
                    }
                }
            });
            
            setChartInstances(prev => ({ ...prev, main: mainChart }));
        }

        // Distribution Chart
        const distCtx = document.getElementById('distributionChart')?.getContext('2d');
        if (distCtx) {
            const businesses = DataManager.getBusinesses();
            const distChart = new Chart(distCtx, {
                type: 'doughnut',
                data: {
                    labels: businesses.map(b => b.name),
                    datasets: [{
                        data: businesses.map(b => b.views || 0),
                        backgroundColor: [
                            '#4f46e5',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6',
                            '#ec4899'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        }
                    }
                }
            });
            
            setChartInstances(prev => ({ ...prev, distribution: distChart }));
        }
    };

    const businesses = DataManager.getBusinesses();
    const totalStats = DataManager.getAllAnalytics();

    const timeframeOptions = [
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' }
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
                    "Analytics & Insights"
                ),
                React.createElement(
                    'p',
                    { className: "text-gray-600" },
                    "Track performance across all your businesses."
                )
            ),
            React.createElement(
                'div',
                { className: "flex gap-3" },
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
                    'div',
                    { className: "flex rounded-xl border border-gray-200 overflow-hidden" },
                    timeframeOptions.map(option =>
                        React.createElement(
                            'button',
                            {
                                key: option.value,
                                onClick: () => setTimeframe(option.value),
                                className: `px-4 py-3 text-sm font-medium transition-all ${
                                    timeframe === option.value
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`
                            },
                            option.label
                        )
                    )
                )
            )
        ),

        // Key Metrics
        React.createElement(
            'div',
            { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" },
            React.createElement(
                StatCard,
                {
                    icon: "eye",
                    value: selectedBusiness === 'all' 
                        ? totalStats.totalViews?.toLocaleString() 
                        : businesses.find(b => b.id === parseInt(selectedBusiness))?.views?.toLocaleString() || '0',
                    label: "Total Views",
                    change: "+15.3%",
                    color: "primary"
                }
            ),
            React.createElement(
                StatCard,
                {
                    icon: "mouse-pointer",
                    value: selectedBusiness === 'all'
                        ? totalStats.totalClicks?.toLocaleString()
                        : businesses.find(b => b.id === parseInt(selectedBusiness))?.clicks?.toLocaleString() || '0',
                    label: "Total Clicks",
                    change: "+8.7%",
                    color: "green"
                }
            ),
            React.createElement(
                StatCard,
                {
                    icon: "qrcode",
                    value: selectedBusiness === 'all'
                        ? totalStats.totalQRScans?.toLocaleString()
                        : businesses.find(b => b.id === parseInt(selectedBusiness))?.qrScans?.toLocaleString() || '0',
                    label: "QR Scans",
                    change: "+22.1%",
                    color: "blue"
                }
            ),
            React.createElement(
                StatCard,
                {
                    icon: "star",
                    value: selectedBusiness === 'all'
                        ? totalStats.avgRating
                        : businesses.find(b => b.id === parseInt(selectedBusiness))?.rating || '0',
                    label: "Avg Rating",
                    change: "+0.3%",
                    color: "amber"
                }
            )
        ),

        // Main Chart
        React.createElement(
            ModernCard,
            { className: "p-6 mb-8" },
            React.createElement(
                'h2',
                { className: "text-lg font-bold mb-6" },
                "Performance Overview"
            ),
            React.createElement(
                'div',
                { className: "chart-container" },
                React.createElement('canvas', { id: "mainChart" })
            )
        ),

        // Secondary Charts Grid
        React.createElement(
            'div',
            { className: "grid lg:grid-cols-2 gap-6 mb-8" },
            // Distribution Chart
            React.createElement(
                ModernCard,
                { className: "p-6" },
                React.createElement(
                    'h2',
                    { className: "text-lg font-bold mb-6" },
                    "Views Distribution"
                ),
                React.createElement(
                    'div',
                    { className: "chart-container" },
                    React.createElement('canvas', { id: "distributionChart" })
                )
            ),
            // Top Performing
            React.createElement(
                ModernCard,
                { className: "p-6" },
                React.createElement(
                    'h2',
                    { className: "text-lg font-bold mb-6" },
                    "Top Performing Businesses"
                ),
                React.createElement(
                    'div',
                    { className: "space-y-4" },
                    businesses.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((business, i) =>
                        React.createElement(
                            'div',
                            { key: business.id, className: "flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors" },
                            React.createElement(
                                'div',
                                { className: "w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold" },
                                i + 1
                            ),
                            React.createElement(
                                'div',
                                { className: "flex-1" },
                                React.createElement('div', { className: "font-medium text-gray-900" }, business.name),
                                React.createElement('div', { className: "text-xs text-gray-500" }, business.category)
                            ),
                            React.createElement(
                                'div',
                                { className: "text-right" },
                                React.createElement('div', { className: "font-bold" }, business.views?.toLocaleString()),
                                React.createElement('div', { className: "text-xs text-gray-500" }, "views")
                            )
                        )
                    )
                )
            )
        ),

        // Detailed Stats Table
        React.createElement(
            ModernCard,
            { className: "p-6" },
            React.createElement(
                'h2',
                { className: "text-lg font-bold mb-6" },
                "Business Performance Details"
            ),
            React.createElement(
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
                            React.createElement('th', null, "Business"),
                            React.createElement('th', null, "Views"),
                            React.createElement('th', null, "Clicks"),
                            React.createElement('th', null, "CTR"),
                            React.createElement('th', null, "QR Scans"),
                            React.createElement('th', null, "Conversions"),
                            React.createElement('th', null, "Rating")
                        )
                    ),
                    React.createElement(
                        'tbody',
                        null,
                        businesses.map(business =>
                            React.createElement(
                                'tr',
                                { key: business.id },
                                React.createElement(
                                    'td',
                                    null,
                                    React.createElement(
                                        'div',
                                        { className: "flex items-center gap-3" },
                                        React.createElement(
                                            'div',
                                            { className: "w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs" },
                                            business.logo
                                        ),
                                        React.createElement('span', { className: "font-medium" }, business.name)
                                    )
                                ),
                                React.createElement('td', null, business.views?.toLocaleString() || '0'),
                                React.createElement('td', null, business.clicks?.toLocaleString() || '0'),
                                React.createElement('td', null, 
                                    business.views ? `${((business.clicks || 0) / business.views * 100).toFixed(1)}%` : '0%'
                                ),
                                React.createElement('td', null, business.qrScans?.toLocaleString() || '0'),
                                React.createElement('td', null, business.conversations?.toLocaleString() || '0'),
                                React.createElement(
                                    'td',
                                    null,
                                    React.createElement(
                                        'div',
                                        { className: "flex items-center gap-1" },
                                        React.createElement(Icon, { name: "star", className: "text-amber-400", size: 12 }),
                                        business.rating || '0'
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};