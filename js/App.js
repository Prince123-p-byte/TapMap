(function() {
    const App = () => {
        const [activePage, setActivePage] = React.useState('home');
        const [businesses, setBusinesses] = React.useState([]);
        const [selectedBusiness, setSelectedBusiness] = React.useState(null);
        const [user, setUser] = React.useState(null);
        const [userData, setUserData] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [showAuthModal, setShowAuthModal] = React.useState(false);
        const [notifications, setNotifications] = React.useState([]);
        const [unreadCount, setUnreadCount] = React.useState(0);

        // Listen for auth modal event
        React.useEffect(() => {
            const handleOpenAuth = () => setShowAuthModal(true);
            window.addEventListener('openAuthModal', handleOpenAuth);
            
            // Listen for navigation events
            const handleNavigate = (e) => {
                if (e.detail?.page) {
                    setActivePage(e.detail.page);
                    if (e.detail?.business) {
                        setSelectedBusiness(e.detail.business);
                    }
                }
            };
            window.addEventListener('navigate', handleNavigate);
            
            return () => {
                window.removeEventListener('openAuthModal', handleOpenAuth);
                window.removeEventListener('navigate', handleNavigate);
            };
        }, []);

        // Listen for auth state changes
        React.useEffect(() => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                setUser(user);
                if (user) {
                    await loadUserData(user.uid);
                    await loadBusinesses(user.uid);
                    setupNotificationsListener(user.uid);
                } else {
                    setUserData(null);
                    setBusinesses([]);
                    setNotifications([]);
                    setUnreadCount(0);
                }
                setLoading(false);
            });

            return () => unsubscribe();
        }, []);

        const loadUserData = async (userId) => {
            try {
                const doc = await db.collection('users').doc(userId).get();
                if (doc.exists) {
                    setUserData(doc.data());
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        const loadBusinesses = async (userId) => {
            try {
                const snapshot = await db.collection('businesses')
                    .where('userId', '==', userId)
                    .orderBy('createdAt', 'desc')
                    .get();

                const businessesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setBusinesses(businessesData);
            } catch (error) {
                console.error('Error loading businesses:', error);
                Toast.show('Error loading businesses', 'error');
            }
        };

        const setupNotificationsListener = (userId) => {
            const unsubscribe = db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .onSnapshot((snapshot) => {
                    const notifs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setNotifications(notifs);
                    setUnreadCount(notifs.filter(n => !n.read).length);
                }, (error) => {
                    console.error('Error loading notifications:', error);
                });

            return unsubscribe;
        };

        const handleAddBusiness = async (businessData) => {
            if (!user) {
                setShowAuthModal(true);
                return;
            }

            try {
                const businessWithUser = {
                    ...businessData,
                    userId: user.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    views: 0,
                    clicks: 0,
                    qrScans: 0,
                    conversations: 0,
                    rating: 5.0,
                    reviews: 0
                };

                const docRef = await db.collection('businesses').add(businessWithUser);
                
                const newBusiness = {
                    id: docRef.id,
                    ...businessWithUser
                };

                setBusinesses(prev => [newBusiness, ...prev]);
                
                // Create notification
                await createNotification({
                    userId: user.uid,
                    type: 'business',
                    title: 'Business Created',
                    message: `Successfully created ${businessData.name}`,
                    link: `/business/${docRef.id}`
                });
                
                Toast.show('Business created successfully!', 'success');
                
                // Generate QR code
                await generateQRCode(docRef.id, newBusiness.name);
                
                return newBusiness;
            } catch (error) {
                console.error('Error adding business:', error);
                Toast.show(error.message, 'error');
            }
        };

        const generateQRCode = async (businessId, businessName) => {
            try {
                const qrData = {
                    businessId,
                    businessName,
                    url: `https://tapmap.com/business/${businessId}`,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    scans: 0
                };

                await db.collection('qrcodes').add(qrData);
            } catch (error) {
                console.error('Error generating QR code:', error);
            }
        };

        const createNotification = async (notification) => {
            try {
                await db.collection('notifications').add({
                    ...notification,
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error('Error creating notification:', error);
            }
        };

        const handleEditBusiness = async (businessData) => {
            try {
                const { id, ...data } = businessData;
                await db.collection('businesses').doc(id).update({
                    ...data,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                setBusinesses(prev => prev.map(b => 
                    b.id === id ? { ...b, ...data } : b
                ));

                Toast.show('Business updated successfully!', 'success');
            } catch (error) {
                console.error('Error updating business:', error);
                Toast.show(error.message, 'error');
            }
        };

        const handleDeleteBusiness = async (id) => {
            try {
                await db.collection('businesses').doc(id).delete();
                
                // Delete associated QR code
                const qrSnapshot = await db.collection('qrcodes')
                    .where('businessId', '==', id)
                    .get();
                
                qrSnapshot.docs.forEach(doc => doc.ref.delete());

                setBusinesses(prev => prev.filter(b => b.id !== id));
                
                await createNotification({
                    userId: user.uid,
                    type: 'business',
                    title: 'Business Deleted',
                    message: 'Business has been deleted',
                    link: '/businesses'
                });
                
                Toast.show('Business deleted', 'warning');
            } catch (error) {
                console.error('Error deleting business:', error);
                Toast.show(error.message, 'error');
            }
        };

        const handleMarkNotificationAsRead = async (notificationId) => {
            try {
                await db.collection('notifications').doc(notificationId).update({
                    read: true,
                    readAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        };

        const handleMarkAllNotificationsAsRead = async () => {
            try {
                const batch = db.batch();
                notifications.forEach(notif => {
                    if (!notif.read) {
                        batch.update(db.collection('notifications').doc(notif.id), {
                            read: true,
                            readAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                });
                await batch.commit();
                Toast.show('All notifications marked as read');
            } catch (error) {
                console.error('Error marking all as read:', error);
            }
        };

        const handleLogout = async () => {
            try {
                await auth.signOut();
                setUser(null);
                setUserData(null);
                setBusinesses([]);
                setActivePage('home');
                Toast.show('Logged out successfully', 'success');
            } catch (error) {
                console.error('Error logging out:', error);
                Toast.show(error.message, 'error');
            }
        };

        const handleUpdateProfile = async (profileData) => {
            try {
                await db.collection('users').doc(user.uid).update({
                    ...profileData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                setUserData(prev => ({ ...prev, ...profileData }));
                
                if (profileData.name && user.displayName !== profileData.name) {
                    await user.updateProfile({
                        displayName: profileData.name
                    });
                }
                
                Toast.show('Profile updated successfully', 'success');
            } catch (error) {
                console.error('Error updating profile:', error);
                Toast.show(error.message, 'error');
            }
        };

        const handleViewProfile = (business) => {
            setSelectedBusiness(business);
            setActivePage('profile');
        };

        const handleNavigate = (page, business = null) => {
            if (page === 'profile' && business) {
                setSelectedBusiness(business);
            }
            setActivePage(page);
        };

        if (loading) {
            return React.createElement(LoadingSpinner, { fullPage: true });
        }

        const renderPage = () => {
            switch(activePage) {
                case 'home':
                    return React.createElement(LandingPage, {
                        onExplore: () => setActivePage('directory')
                    });
                case 'directory':
                    return React.createElement(DirectoryPage, {
                        businesses,
                        onSelectBusiness: handleViewProfile
                    });
                case 'profile':
                    return React.createElement(ProtectedRoute, { user },
                        React.createElement(ProfilePage, {
                            business: selectedBusiness,
                            onBack: () => setActivePage('directory')
                        })
                    );
                case 'dashboard':
                    return React.createElement(ProtectedRoute, { user },
                        React.createElement(Dashboard, {
                            businesses,
                            onNavigate: handleNavigate
                        })
                    );
                case 'sub-businesses':
                    return React.createElement(ProtectedRoute, { user },
                        React.createElement(SubBusinesses, {
                            businesses,
                            onAddBusiness: handleAddBusiness,
                            onEditBusiness: handleEditBusiness,
                            onDeleteBusiness: handleDeleteBusiness,
                            onViewProfile: handleViewProfile
                        })
                    );
                case 'settings':
                    return React.createElement(ProtectedRoute, { user },
                        React.createElement(Settings, {
                            user,
                            userData,
                            onUpdateProfile: handleUpdateProfile,
                            onLogout: handleLogout
                        })
                    );
                case 'help':
                    return React.createElement(Help);
                default:
                    return React.createElement(LandingPage, {
                        onExplore: () => setActivePage('directory')
                    });
            }
        };

        // Navbar Component with Notifications
        const NavbarWithNotifications = () => {
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
                            [
                                { id: 'home', label: 'Home', icon: 'home' },
                                { id: 'directory', label: 'Explore', icon: 'compass' },
                                { id: 'dashboard', label: 'Dashboard', icon: 'chart-pie' },
                                { id: 'sub-businesses', label: 'Businesses', icon: 'building' },
                                { id: 'settings', label: 'Settings', icon: 'cog' }
                            ].map(link => 
                                React.createElement(
                                    'button',
                                    {
                                        key: link.id,
                                        onClick: () => { 
                                            setActivePage(link.id); 
                                            setSelectedBusiness(null);
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
                                // Notifications
                                React.createElement(
                                    'div',
                                    { className: "relative" },
                                    React.createElement(
                                        'button',
                                        { 
                                            className: "relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50",
                                            onClick: () => {
                                                // Toggle notifications panel
                                                const panel = document.getElementById('notifications-panel');
                                                if (panel) {
                                                    panel.classList.toggle('hidden');
                                                }
                                            }
                                        },
                                        React.createElement(Icon, { name: "bell", size: 20 }),
                                        unreadCount > 0 && React.createElement(
                                            'span',
                                            { className: "absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full" },
                                            unreadCount > 9 ? '9+' : unreadCount
                                        )
                                    ),
                                    // Notifications Panel
                                    React.createElement(
                                        'div',
                                        { 
                                            id: "notifications-panel",
                                            className: "absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 hidden"
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
                                                    onClick: handleMarkAllNotificationsAsRead,
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
                                                        onClick: () => handleMarkNotificationAsRead(notif.id)
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
                                            onClick: () => {
                                                const menu = document.getElementById('user-menu');
                                                if (menu) {
                                                    menu.classList.toggle('hidden');
                                                }
                                            },
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
                                    React.createElement(
                                        'div',
                                        { 
                                            id: "user-menu",
                                            className: "absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 hidden"
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
                                                document.getElementById('user-menu')?.classList.add('hidden');
                                            }},
                                            { icon: 'cog', label: 'Settings', onClick: () => {
                                                setActivePage('settings');
                                                document.getElementById('user-menu')?.classList.add('hidden');
                                            }},
                                            { icon: 'question-circle', label: 'Help Center', onClick: () => {
                                                setActivePage('help');
                                                document.getElementById('user-menu')?.classList.add('hidden');
                                            }},
                                            { icon: 'sign-out-alt', label: 'Logout', onClick: handleLogout }
                                        ].map((item, i) =>
                                            React.createElement(
                                                'button',
                                                {
                                                    key: i,
                                                    onClick: item.onClick,
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
                                        onClick: () => setShowAuthModal(true),
                                        className: "bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                                    },
                                    "Sign In"
                                )
                            )
                        )
                    )
                )
            );
        };

        return React.createElement(
            'div',
            { className: "min-h-screen bg-gray-50" },
            React.createElement(NavbarWithNotifications),
            React.createElement(
                'main',
                { className: "pt-16" },
                renderPage()
            ),
            React.createElement(AuthModal, {
                isOpen: showAuthModal,
                onClose: () => setShowAuthModal(false),
                onSuccess: () => {
                    setShowAuthModal(false);
                }
            })
        );
    };

    window.App = App;

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(React.createElement(App));
})();