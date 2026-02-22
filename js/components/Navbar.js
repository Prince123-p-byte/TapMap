// Navbar Component
(function() {
    const Navbar = ({ activePage, setActivePage, setSelectedBusiness }) => {
        const [isOpen, setIsOpen] = React.useState(false);
        const [showUserMenu, setShowUserMenu] = React.useState(false);
        const [notifications, setNotifications] = React.useState(3);

        const navLinks = [
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'directory', label: 'Explore', icon: 'compass' },
            { id: 'dashboard', label: 'Dashboard', icon: 'chart-pie' },
            { id: 'sub-businesses', label: 'Businesses', icon: 'building' },
            { id: 'media', label: 'Media', icon: 'image' },
            { id: 'qr-manager', label: 'QR Codes', icon: 'qrcode' },
            { id: 'analytics', label: 'Analytics', icon: 'chart-line' }
        ];

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
                            React.createElement(Icon, { name: "building-2", className: "text-white w-5 h-5" })
                        ),
                        React.createElement(
                            'span',
                            { className: "text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600" },
                            "AdPort Pro"
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
                        React.createElement(
                            'button',
                            { 
                                className: "relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50",
                                onClick: () => Toast.show('No new notifications', 'info')
                            },
                            React.createElement(Icon, { name: "bell", size: 20 }),
                            notifications > 0 && React.createElement(
                                'span',
                                { className: "absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" }
                            )
                        ),
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
                                    "A"
                                ),
                                React.createElement(Icon, { name: "chevron-down", size: 16, className: "text-gray-400" })
                            ),
                            // User Menu Dropdown
                            showUserMenu && React.createElement(
                                'div',
                                { 
                                    className: "absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50",
                                    onMouseLeave: () => setShowUserMenu(false)
                                },
                                [
                                    { icon: 'user', label: 'Profile', onClick: () => Toast.show('Profile page coming soon') },
                                    { icon: 'cog', label: 'Settings', onClick: () => Toast.show('Settings coming soon') },
                                    { icon: 'help-circle', label: 'Help', onClick: () => Toast.show('Help center coming soon') },
                                    { icon: 'sign-out-alt', label: 'Logout', onClick: () => {
                                        Toast.show('Logged out successfully');
                                        setActivePage('home');
                                    }}
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
                React.createElement(
                    'button',
                    { 
                        className: "w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg",
                        onClick: () => Toast.show('Notifications coming soon')
                    },
                    React.createElement(Icon, { name: "bell", size: 18 }),
                    "Notifications",
                    notifications > 0 && React.createElement(
                        'span',
                        { className: "ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full" },
                        notifications
                    )
                ),
                React.createElement(
                    'button',
                    { 
                        className: "w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg",
                        onClick: () => {
                            Toast.show('Logged out successfully');
                            setActivePage('home');
                            setIsOpen(false);
                        }
                    },
                    React.createElement(Icon, { name: "sign-out-alt", size: 18 }),
                    "Logout"
                )
            )
        );
    };

    // Make Navbar globally available
    window.Navbar = Navbar;
})();