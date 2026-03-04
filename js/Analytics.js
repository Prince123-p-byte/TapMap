// js/Analytics.js
(function() {
    const Analytics = ({ businesses }) => {
        const [timeframe, setTimeframe] = React.useState('week');
        const [selectedBusiness, setSelectedBusiness] = React.useState('all');
        const [analyticsData, setAnalyticsData] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [dailyStats, setDailyStats] = React.useState([]);
        const [totalStats, setTotalStats] = React.useState({
            totalViews: 0,
            totalClicks: 0,
            totalQRScans: 0,
            totalConversations: 0,
            avgRating: 0,
            totalBusinesses: 0,
            viewsChange: '+0%',
            clicksChange: '+0%',
            scansChange: '+0%',
            ratingChange: '+0%'
        });

        React.useEffect(() => {
            if (businesses && businesses.length > 0) {
                loadDailyStats();
            }
        }, [businesses]);

        React.useEffect(() => {
            if (businesses && businesses.length > 0) {
                calculateTotalStats();
                generateChartData();
            }
            setLoading(false);
        }, [businesses, timeframe, selectedBusiness, dailyStats]);

        const loadDailyStats = async () => {
            try {
                const businessIds = businesses.map(b => b.id);
                
                if (businessIds.length === 0) return;

                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data, error } = await window.supabase
                    .from('daily_stats')
                    .select('*')
                    .in('business_id', businessIds)
                    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                    .order('date', { ascending: true });

                if (error) throw error;
                
                setDailyStats(data || []);
            } catch (error) {
                console.error('Error loading daily stats:', error);
            }
        };

        const calculateTotalStats = () => {
            const filteredBiz = selectedBusiness === 'all' 
                ? businesses 
                : businesses.filter(b => b.id === selectedBusiness);

            const totalViews = filteredBiz.reduce((sum, biz) => sum + (biz.views || 0), 0);
            const totalClicks = filteredBiz.reduce((sum, biz) => sum + (biz.clicks || 0), 0);
            const totalQRScans = filteredBiz.reduce((sum, biz) => sum + (biz.qr_scans || 0), 0);
            const totalConversations = filteredBiz.reduce((sum, biz) => sum + (biz.conversations || 0), 0);
            
            const totalRating = filteredBiz.reduce((sum, biz) => sum + (biz.rating || 0), 0);
            const avgRating = filteredBiz.length > 0 ? (totalRating / filteredBiz.length).toFixed(1) : 0;

            const previousPeriodStats = calculatePreviousPeriodStats(filteredBiz);

            setTotalStats({
                totalViews,
                totalClicks,
                totalQRScans,
                totalConversations,
                avgRating,
                totalBusinesses: filteredBiz.length,
                viewsChange: previousPeriodStats.viewsChange,
                clicksChange: previousPeriodStats.clicksChange,
                scansChange: previousPeriodStats.scansChange,
                ratingChange: previousPeriodStats.ratingChange
            });
        };

        const calculatePreviousPeriodStats = (filteredBiz) => {
            const result = {
                viewsChange: '+0%',
                clicksChange: '+0%',
                scansChange: '+0%',
                ratingChange: '+0%'
            };

            if (dailyStats.length === 0 || filteredBiz.length === 0) return result;

            const now = new Date();
            let currentStart, currentEnd, previousStart, previousEnd;

            switch(timeframe) {
                case 'week':
                    currentStart = new Date(now.setDate(now.getDate() - 7));
                    currentEnd = new Date();
                    previousStart = new Date(currentStart);
                    previousStart.setDate(previousStart.getDate() - 7);
                    previousEnd = currentStart;
                    break;
                case 'month':
                    currentStart = new Date(now.setMonth(now.getMonth() - 1));
                    currentEnd = new Date();
                    previousStart = new Date(currentStart);
                    previousStart.setMonth(previousStart.getMonth() - 1);
                    previousEnd = currentStart;
                    break;
                case 'year':
                    currentStart = new Date(now.setFullYear(now.getFullYear() - 1));
                    currentEnd = new Date();
                    previousStart = new Date(currentStart);
                    previousStart.setFullYear(previousStart.getFullYear() - 1);
                    previousEnd = currentStart;
                    break;
                default:
                    return result;
            }

            const currentStats = dailyStats.filter(stat => {
                const statDate = new Date(stat.date);
                return statDate >= currentStart && statDate <= currentEnd;
            });

            const previousStats = dailyStats.filter(stat => {
                const statDate = new Date(stat.date);
                return statDate >= previousStart && statDate < previousEnd;
            });

            const currentViews = currentStats.reduce((sum, s) => sum + (s.views || 0), 0);
            const previousViews = previousStats.reduce((sum, s) => sum + (s.views || 0), 0);
            const currentScans = currentStats.reduce((sum, s) => sum + (s.scans || 0), 0);
            const previousScans = previousStats.reduce((sum, s) => sum + (s.scans || 0), 0);

            if (previousViews > 0) {
                const viewsChange = ((currentViews - previousViews) / previousViews * 100).toFixed(1);
                result.viewsChange = viewsChange.startsWith('-') ? viewsChange + '%' : '+' + viewsChange + '%';
            }

            if (previousScans > 0) {
                const scansChange = ((currentScans - previousScans) / previousScans * 100).toFixed(1);
                result.scansChange = scansChange.startsWith('-') ? scansChange + '%' : '+' + scansChange + '%';
            }

            return result;
        };

        const generateChartData = () => {
            let labels = [];
            let viewsData = [];
            let clicksData = [];
            let scansData = [];

            const filteredBizIds = selectedBusiness === 'all' 
                ? businesses.map(b => b.id)
                : [selectedBusiness];

            const filteredDailyStats = dailyStats.filter(stat => 
                filteredBizIds.includes(stat.business_id)
            );

            switch(timeframe) {
                case 'week':
                    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    viewsData = labels.map((_, index) => {
                        const dayStats = filteredDailyStats.filter(stat => {
                            const date = new Date(stat.date);
                            return date.getDay() === index + 1;
                        });
                        return dayStats.reduce((sum, s) => sum + (s.views || 0), 0);
                    });
                    clicksData = labels.map((_, index) => {
                        const dayStats = filteredDailyStats.filter(stat => {
                            const date = new Date(stat.date);
                            return date.getDay() === index + 1;
                        });
                        return dayStats.reduce((sum, s) => sum + (s.clicks || 0), 0);
                    });
                    scansData = labels.map((_, index) => {
                        const dayStats = filteredDailyStats.filter(stat => {
                            const date = new Date(stat.date);
                            return date.getDay() === index + 1;
                        });
                        return dayStats.reduce((sum, s) => sum + (s.scans || 0), 0);
                    });
                    break;
                case 'month':
                    labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                    for (let week = 0; week < 4; week++) {
                        const weekStart = new Date();
                        weekStart.setDate(weekStart.getDate() - (28 - week * 7));
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekEnd.getDate() + 7);

                        const weekStats = filteredDailyStats.filter(stat => {
                            const statDate = new Date(stat.date);
                            return statDate >= weekStart && statDate < weekEnd;
                        });

                        viewsData.push(weekStats.reduce((sum, s) => sum + (s.views || 0), 0));
                        clicksData.push(weekStats.reduce((sum, s) => sum + (s.clicks || 0), 0));
                        scansData.push(weekStats.reduce((sum, s) => sum + (s.scans || 0), 0));
                    }
                    break;
                case 'year':
                    labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    for (let month = 0; month < 12; month++) {
                        const monthStats = filteredDailyStats.filter(stat => {
                            const date = new Date(stat.date);
                            return date.getMonth() === month;
                        });
                        viewsData.push(monthStats.reduce((sum, s) => sum + (s.views || 0), 0));
                        clicksData.push(monthStats.reduce((sum, s) => sum + (s.clicks || 0), 0));
                        scansData.push(monthStats.reduce((sum, s) => sum + (s.scans || 0), 0));
                    }
                    break;
            }

            setAnalyticsData({
                labels,
                views: viewsData,
                clicks: clicksData,
                scans: scansData
            });
        };

        const formatNumber = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num.toString();
        };

        const calculateCTR = (views, clicks) => {
            if (!views || views === 0) return '0%';
            return ((clicks / views) * 100).toFixed(1) + '%';
        };

        const getTopPerforming = () => {
            return [...businesses]
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, 5);
        };

        const timeframeOptions = [
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' }
        ];

        if (loading) {
            return React.createElement(window.LoadingSpinner, { fullPage: true });
        }

        const topPerforming = getTopPerforming();

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
                        "Analytics & Insights"
                    ),
                    React.createElement(
                        'p',
                        { className: "text-gray-600" },
                        `Tracking ${businesses.length} business${businesses.length !== 1 ? 'es' : ''}`
                    )
                ),
                React.createElement(
                    'div',
                    { className: "flex flex-col sm:flex-row gap-3 w-full md:w-auto" },
                    businesses.length > 1 && React.createElement(
                        'select',
                        {
                            value: selectedBusiness,
                            onChange: (e) => setSelectedBusiness(e.target.value),
                            className: "px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
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

            businesses.length > 0 ? React.createElement(
                'div',
                { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" },
                React.createElement(
                    window.StatCard,
                    {
                        icon: "eye",
                        value: formatNumber(totalStats.totalViews),
                        label: "Total Views",
                        change: totalStats.viewsChange,
                        color: "primary"
                    }
                ),
                React.createElement(
                    window.StatCard,
                    {
                        icon: "mouse-pointer",
                        value: formatNumber(totalStats.totalClicks),
                        label: "Total Clicks",
                        change: totalStats.clicksChange,
                        color: "green"
                    }
                ),
                React.createElement(
                    window.StatCard,
                    {
                        icon: "qrcode",
                        value: formatNumber(totalStats.totalQRScans),
                        label: "QR Scans",
                        change: totalStats.scansChange,
                        color: "blue"
                    }
                ),
                React.createElement(
                    window.StatCard,
                    {
                        icon: "star",
                        value: totalStats.avgRating,
                        label: "Avg Rating",
                        change: totalStats.ratingChange,
                        color: "amber"
                    }
                )
            ) : React.createElement(
                'div',
                { className: "bg-gray-50 rounded-2xl p-8 text-center text-gray-500 mb-8" },
                React.createElement(window.Icon, { name: "chart-line", size: 48, className: "mx-auto mb-3 opacity-50" }),
                React.createElement('p', { className: "text-lg font-medium mb-2" }, "No data to display"),
                React.createElement('p', { className: "text-sm" }, "Add businesses to see analytics")
            ),

            businesses.length > 0 && analyticsData && React.createElement(
                'div',
                { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8" },
                React.createElement(
                    'h2',
                    { className: "text-lg font-bold mb-6" },
                    "Performance Overview"
                ),
                React.createElement(
                    'div',
                    { className: "h-80 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400" },
                    React.createElement(
                        'div',
                        { className: "text-center p-8" },
                        React.createElement('p', { className: "text-sm text-gray-500 mb-4" }, 
                            `Showing data for ${selectedBusiness === 'all' ? 'all businesses' : businesses.find(b => b.id === selectedBusiness)?.name}`
                        ),
                        React.createElement('p', { className: "text-2xl font-bold text-indigo-600 mb-2" }, 
                            formatNumber(totalStats.totalViews)
                        ),
                        React.createElement('p', { className: "text-sm text-gray-500" }, 
                            `Total ${timeframe === 'week' ? 'weekly' : timeframe === 'month' ? 'monthly' : 'yearly'} views`
                        )
                    )
                )
            ),

            businesses.length > 0 && topPerforming.length > 0 && React.createElement(
                'div',
                { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8" },
                React.createElement(
                    'h2',
                    { className: "text-lg font-bold mb-6" },
                    "Top Performing Businesses"
                ),
                React.createElement(
                    'div',
                    { className: "space-y-4" },
                    topPerforming.map((business, index) => (
                        React.createElement(
                            'div',
                            { 
                                key: business.id,
                                className: "flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer",
                                onClick: () => {
                                    window.dispatchEvent(new CustomEvent('navigate', { 
                                        detail: { page: 'profile', business }
                                    }));
                                }
                            },
                            React.createElement(
                                'div',
                                { 
                                    className: `w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                                        index === 0 ? 'bg-amber-500' :
                                        index === 1 ? 'bg-gray-400' :
                                        index === 2 ? 'bg-amber-700' : 'bg-indigo-600'
                                    }` 
                                },
                                index + 1
                            ),
                            React.createElement(
                                'div',
                                { className: "w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold overflow-hidden flex-shrink-0" },
                                business.logo ? 
                                    React.createElement('img', { 
                                        src: business.logo, 
                                        alt: business.name,
                                        className: "w-full h-full object-cover"
                                    }) :
                                    (business.name?.charAt(0).toUpperCase() || 'B')
                            ),
                            React.createElement(
                                'div',
                                { className: "flex-1 min-w-0" },
                                React.createElement(
                                    'div',
                                    { className: "font-medium text-gray-900 truncate" },
                                    business.name
                                ),
                                React.createElement(
                                    'div',
                                    { className: "text-xs text-gray-500 truncate" },
                                    business.category || 'General'
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: "text-right flex-shrink-0" },
                                React.createElement(
                                    'div',
                                    { className: "font-bold text-indigo-600" },
                                    business.views?.toLocaleString() || 0
                                ),
                                React.createElement(
                                    'div',
                                    { className: "text-xs text-gray-500" },
                                    "views"
                                )
                            )
                        )
                    ))
                )
            ),

            businesses.length > 0 && React.createElement(
                'div',
                { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100" },
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
                        { className: "w-full text-left" },
                        React.createElement(
                            'thead',
                            { className: "bg-gray-50" },
                            React.createElement(
                                'tr',
                                { className: "text-gray-500 text-xs uppercase font-bold" },
                                React.createElement('th', { className: "px-6 py-4" }, "Business"),
                                React.createElement('th', { className: "px-6 py-4 text-right" }, "Views"),
                                React.createElement('th', { className: "px-6 py-4 text-right" }, "Clicks"),
                                React.createElement('th', { className: "px-6 py-4 text-right" }, "CTR"),
                                React.createElement('th', { className: "px-6 py-4 text-right" }, "QR Scans"),
                                React.createElement('th', { className: "px-6 py-4 text-right" }, "Conversations"),
                                React.createElement('th', { className: "px-6 py-4 text-right" }, "Rating")
                            )
                        ),
                        React.createElement(
                            'tbody',
                            { className: "divide-y divide-gray-100" },
                            businesses.map(business =>
                                React.createElement(
                                    'tr',
                                    { 
                                        key: business.id,
                                        className: "hover:bg-gray-50 transition-colors cursor-pointer",
                                        onClick: () => {
                                            window.dispatchEvent(new CustomEvent('navigate', { 
                                                detail: { page: 'profile', business }
                                            }));
                                        }
                                    },
                                    React.createElement(
                                        'td',
                                        { className: "px-6 py-4" },
                                        React.createElement(
                                            'div',
                                            { className: "flex items-center gap-3" },
                                            React.createElement(
                                                'div',
                                                { className: "w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0" },
                                                business.logo ? 
                                                    React.createElement('img', { 
                                                        src: business.logo, 
                                                        alt: business.name,
                                                        className: "w-full h-full object-cover"
                                                    }) :
                                                    (business.name?.charAt(0).toUpperCase() || 'B')
                                            ),
                                            React.createElement(
                                                'div',
                                                { className: "min-w-0" },
                                                React.createElement('div', { className: "font-medium text-gray-900 truncate" }, business.name),
                                                React.createElement('div', { className: "text-xs text-gray-500 truncate" }, business.category || 'General')
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        'td',
                                        { className: "px-6 py-4 text-right font-medium" },
                                        business.views?.toLocaleString() || '0'
                                    ),
                                    React.createElement(
                                        'td',
                                        { className: "px-6 py-4 text-right" },
                                        business.clicks?.toLocaleString() || '0'
                                    ),
                                    React.createElement(
                                        'td',
                                        { className: "px-6 py-4 text-right text-indigo-600 font-medium" },
                                        calculateCTR(business.views, business.clicks)
                                    ),
                                    React.createElement(
                                        'td',
                                        { className: "px-6 py-4 text-right" },
                                        business.qr_scans?.toLocaleString() || '0'
                                    ),
                                    React.createElement(
                                        'td',
                                        { className: "px-6 py-4 text-right" },
                                        business.conversations?.toLocaleString() || '0'
                                    ),
                                    React.createElement(
                                        'td',
                                        { className: "px-6 py-4 text-right" },
                                        React.createElement(
                                            'div',
                                            { className: "flex items-center justify-end gap-1" },
                                            React.createElement(window.Icon, { name: "star", size: 12, className: "text-amber-400" }),
                                            business.rating?.toFixed(1) || '0'
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),

            businesses.length === 0 && React.createElement(
                'div',
                { className: "bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-100" },
                React.createElement(window.Icon, { name: "chart-bar", size: 64, className: "mx-auto mb-4 opacity-30" }),
                React.createElement('h3', { className: "text-xl font-bold mb-2" }, "No Data Available"),
                React.createElement('p', { className: "text-gray-400 mb-6" }, "Create your first business to start tracking analytics"),
                React.createElement(
                    'button',
                    {
                        onClick: () => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'sub-businesses' } })),
                        className: "bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all"
                    },
                    "Add Business"
                )
            )
        );
    };

    window.Analytics = Analytics;
})();