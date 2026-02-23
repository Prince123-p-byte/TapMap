(function() {
    const Navbar = ({ 
        activePage, 
        setActivePage, 
        setSelectedBusiness,
        user,
        userData,
        notifications,
        unreadCount,
        showNotifications,
        setShowNotifications,
        showUserMenu,
        setShowUserMenu,
        onLogout,
        onShowAuth,
        onMarkAsRead,
        onMarkAllAsRead,
        onNotificationClick
    }) => {
        const [isOpen, setIsOpen] = React.useState(false);

        // Public navigation links - always visible
        const publicLinks = [
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'directory', label: 'Explore', icon: 'compass' },
            { id: 'help', label: 'Help', icon: 'question-circle' }
        ];

        // Protected navigation links - only visible when logged in
        const protectedLinks = [
            { id: 'dashboard', label: 'Dashboard', icon: 'chart-pie' },
            { id: 'sub-businesses', label: 'My Businesses', icon: 'building' },
            { id: 'analytics', label: 'Analytics', icon: 'chart-line' }
        ];

        // Combine based on auth status
        const navLinks = user 
            ? [...publicLinks, ...protectedLinks]
            : publicLinks;

        const handleNotificationClick = (notif) => {
            onMarkAsRead(notif.id);
            if (onNotificationClick) {
                onNotificationClick(notif);
            }
            setShowNotifications(false);
        };

        return React.createElement(
            'nav',
            { className: "fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm" },
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
                React.createElement(
                    'div',
                    { className: "flex justify-between h-16 items-center" },
                    // Logo
                    React.createElement(
                        'div',
                        { 
                            className: "flex items-center gap-2 cursor-pointer group",
                            onClick: () => { 
                                setActivePage('home'); 
                                setSelectedBusiness(null);
                                setIsOpen(false);
                            }
                        },
                        React.createElement(
                            'div',
                            { className: "bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform" },
                            React.createElement(Icon, { name: "map-marked-alt", className: "text-white w-5 h-5" })
                        ),
                        React.createElement(
                            'span',
                            { className: "text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600" },
                            "tapMap"
                        )
                    ),

                    // Desktop Navigation
                    React.createElement(
                        'div',
                        { className: "hidden md:flex items-center space-x-1" },
                        navLinks.map(link => 
                            React.createElement(
                                'button',
                                {
                                    key: link.id,
                                    onClick: () => { 
                                        setActivePage(link.id); 
                                        setSelectedBusiness(null);
                                        setIsOpen(false);
                                    },
                                    className: `px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                        activePage === link.id 
                                            ? 'bg-indigo-50 text-indigo-600' 
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                },
                                React.createElement(Icon, { name: link.icon, size: 16 }),
                                link.label
                            )
                        )
                    ),

                    // Right side actions
                    React.createElement(
                        'div',
                        { className: "hidden md:flex items-center gap-3" },
                        user ? React.createElement(
                            React.Fragment,
                            null,
                            // Notifications (only for logged in users)
                            React.createElement(
                                'div',
                                { className: "relative" },
                                React.createElement(
                                    'button',
                                    { 
                                        className: "relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50",
                                        onClick: () => setShowNotifications(!showNotifications)
                                    },
                                    React.createElement(Icon, { name: "bell", size: 20 }),
                                    unreadCount > 0 && React.createElement(
                                        'span',
                                        { className: "absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full" },
                                        unreadCount > 9 ? '9+' : unreadCount
                                    )
                                ),
                                // Notifications Panel
                                showNotifications && React.createElement(
                                    'div',
                                    { 
                                        className: "absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50",
                                        onMouseLeave: () => setShowNotifications(false)
                                    },
                                    React.createElement(
                                        'div',
                                        { className: "p-4 border-b border-gray-100 flex justify-between items-center" },
                                        React.createElement(
                                            'h3',
                                            { className: "font-bold" },
                                            "Notifications"
                                        ),
                                        unreadCount > 0 && React.createElement(
                                            'button',
                                            {
                                                onClick: onMarkAllAsRead,
                                                className: "text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                            },
                                            "Mark all as read"
                                        )
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: "max-h-96 overflow-y-auto" },
                                        notifications.length === 0 ? React.createElement(
                                            'div',
                                            { className: "p-8 text-center text-gray-500" },
                                            React.createElement(Icon, { name: "bell-slash", size: 32, className: "mx-auto mb-2 opacity-50" }),
                                            React.createElement('p', null, "No notifications yet")
                                        ) : notifications.map(notif =>
                                            React.createElement(
                                                'div',
                                                {
                                                    key: notif.id,
                                                    className: `p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-indigo-50/30' : ''}`,
                                                    onClick: () => handleNotificationClick(notif)
                                                },
                                                React.createElement(
                                                    'div',
                                                    { className: "flex gap-3" },
                                                    React.createElement(
                                                        'div',
                                                        { className: `w-8 h-8 rounded-full ${notif.read ? 'bg-gray-100' : 'bg-indigo-100'} flex items-center justify-center flex-shrink-0` },
                                                        React.createElement(Icon, { 
                                                            name: notif.type === 'business' ? 'building' : 'bell', 
                                                            size: 14,
                                                            className: notif.read ? 'text-gray-500' : 'text-indigo-600'
                                                        })
                                                    ),
                                                    React.createElement(
                                                        'div',
                                                        { className: "flex-1" },
                                                        React.createElement(
                                                            'p',
                                                            { className: "text-sm text-gray-800" },
                                                            notif.message || notif.title
                                                        ),
                                                        React.createElement(
                                                            'p',
                                                            { className: "text-xs text-gray-400 mt-1" },
                                                            notif.createdAt?.toDate ? 
                                                                new Date(notif.createdAt.toDate()).toLocaleDateString() : 
                                                                'Just now'
                                                        )
                                                    ),
                                                    !notif.read && React.createElement(
                                                        'div',
                                                        { className: "w-2 h-2 bg-indigo-600 rounded-full" }
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            ),
                            // User Menu
                            React.createElement(
                                'div',
                                { className: "relative" },
                                React.createElement(
                                    'button',
                                    {
                                        onClick: () => setShowUserMenu(!showUserMenu),
                                        className: "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                    },
                                    React.createElement(
                                        'div',
                                        { className: "w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold" },
                                        userData?.name ? userData.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'
                                    ),
                                    React.createElement(Icon, { name: "chevron-down", size: 16, className: "text-gray-400" })
                                ),
                                // User Menu Dropdown
                                showUserMenu && React.createElement(
                                    'div',
                                    { 
                                        className: "absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50",
                                        onMouseLeave: () => setShowUserMenu(false)
                                    },
                                    React.createElement(
                                        'div',
                                        { className: "px-4 py-3 border-b border-gray-100" },
                                        React.createElement('p', { className: "text-sm font-medium text-gray-900" }, userData?.name || 'User'),
                                        React.createElement('p', { className: "text-xs text-gray-500" }, user?.email)
                                    ),
                                    [
                                        { icon: 'user', label: 'My Profile', onClick: () => {
                                            setActivePage('settings');
                                            setShowUserMenu(false);
                                        }},
                                        { icon: 'cog', label: 'Settings', onClick: () => {
                                            setActivePage('settings');
                                            setShowUserMenu(false);
                                        }},
                                        { icon: 'question-circle', label: 'Help Center', onClick: () => {
                                            setActivePage('help');
                                            setShowUserMenu(false);
                                        }},
                                        { icon: 'sign-out-alt', label: 'Logout', onClick: onLogout }
                                    ].map((item, i) =>
                                        React.createElement(
                                            'button',
                                            {
                                                key: i,
                                                onClick: () => {
                                                    item.onClick();
                                                    setShowUserMenu(false);
                                                },
                                                className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                            },
                                            React.createElement(Icon, { name: item.icon, size: 16 }),
                                            item.label
                                        )
                                    )
                                )
                            )
                        ) : React.createElement(
                            React.Fragment,
                            null,
                            React.createElement(
                                'button',
                                {
                                    onClick: onShowAuth,
                                    className: "bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                                },
                                "Sign In"
                            ),
                            React.createElement(
                                'button',
                                {
                                    onClick: onShowAuth,
                                    className: "ml-2 text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium"
                                },
                                "Sign Up"
                            )
                        )
                    ),

                    // Mobile Menu Button
                    React.createElement(
                        'div',
                        { className: "md:hidden" },
                        React.createElement(
                            'button',
                            { 
                                onClick: () => setIsOpen(!isOpen), 
                                className: "p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            },
                            isOpen 
                                ? React.createElement(Icon, { name: "times", size: 24 })
                                : React.createElement(Icon, { name: "bars", size: 24 })
                        )
                    )
                )
            ),

            // Mobile Navigation Menu
            isOpen && React.createElement(
                'div',
                { className: "md:hidden bg-white border-b border-gray-100 py-4 px-4 space-y-2 animate-slide-down" },
                navLinks.map(link =>
                    React.createElement(
                        'button',
                        {
                            key: link.id,
                            onClick: () => { 
                                setActivePage(link.id); 
                                setIsOpen(false); 
                                setSelectedBusiness(null); 
                            },
                            className: `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activePage === link.id 
                                    ? 'bg-indigo-50 text-indigo-600' 
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`
                        },
                        React.createElement(Icon, { name: link.icon, size: 18 }),
                        link.label
                    )
                ),
                React.createElement('div', { className: "border-t border-gray-100 my-2" }),
                user ? React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                        'div',
                        { className: "px-4 py-2" },
                        React.createElement('p', { className: "font-medium" }, userData?.name || 'User'),
                        React.createElement('p', { className: "text-xs text-gray-500" }, user?.email)
                    ),
                    [
                        { icon: 'user', label: 'Profile', page: 'settings' },
                        { icon: 'cog', label: 'Settings', page: 'settings' },
                        { icon: 'question-circle', label: 'Help', page: 'help' }
                    ].map((item, i) =>
                        React.createElement(
                            'button',
                            {
                                key: i,
                                onClick: () => {
                                    setActivePage(item.page);
                                    setIsOpen(false);
                                },
                                className: "w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
                            },
                            React.createElement(Icon, { name: item.icon, size: 18 }),
                            item.label
                        )
                    ),
                    React.createElement(
                        'button',
                        {
                            onClick: onLogout,
                            className: "w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                        },
                        React.createElement(Icon, { name: "sign-out-alt", size: 18 }),
                        "Logout"
                    )
                ) : React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                        'button',
                        {
                            onClick: () => {
                                onShowAuth();
                                setIsOpen(false);
                            },
                            className: "w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-all"
                        },
                        "Sign In / Sign Up"
                    )
                )
            )
        );
    };

    window.Navbar = Navbar;
})();