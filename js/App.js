(function() {
    const App = () => {
        // Check for business ID in URL IMMEDIATELY - before any state is set
        const urlParams = new URLSearchParams(window.location.search);
        const initialBusinessId = urlParams.get('business');
        
        const [activePage, setActivePage] = React.useState(initialBusinessId ? 'profile' : 'home');
        const [businesses, setBusinesses] = React.useState([]);
        const [allBusinesses, setAllBusinesses] = React.useState([]);
        const [selectedBusiness, setSelectedBusiness] = React.useState(null);
        const [user, setUser] = React.useState(null);
        const [userData, setUserData] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [showAuthModal, setShowAuthModal] = React.useState(false);
        const [notifications, setNotifications] = React.useState([]);
        const [unreadCount, setUnreadCount] = React.useState(0);
        const [showNotifications, setShowNotifications] = React.useState(false);
        const [showUserMenu, setShowUserMenu] = React.useState(false);
        const [initialBusinessLoaded, setInitialBusinessLoaded] = React.useState(false);

        // Base URL for sharing
        const BASE_URL = 'https://prince123-p-byte.github.io/TapMap';

        // Listen for auth modal event
        React.useEffect(() => {
            const handleOpenAuth = () => setShowAuthModal(true);
            window.addEventListener('openAuthModal', handleOpenAuth);
            
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

        // Load the specific business from URL if present
        React.useEffect(() => {
            const loadBusinessFromUrl = async () => {
                if (initialBusinessId && !initialBusinessLoaded) {
                    try {
                        const doc = await db.collection('businesses').doc(initialBusinessId).get();
                        if (doc.exists) {
                            const business = {
                                id: doc.id,
                                ...doc.data()
                            };
                            setSelectedBusiness(business);
                            setActivePage('profile');
                            
                            // Clean the URL (remove the parameter)
                            const newUrl = window.location.pathname;
                            window.history.replaceState({}, '', newUrl);
                        } else {
                            Toast.show('Business not found', 'error');
                            setActivePage('home');
                        }
                    } catch (error) {
                        console.error('Error loading business from URL:', error);
                        Toast.show('Error loading business', 'error');
                        setActivePage('home');
                    }
                    setInitialBusinessLoaded(true);
                }
            };
            
            loadBusinessFromUrl();
        }, [initialBusinessId, initialBusinessLoaded]);

        // Load all businesses on startup (public)
        React.useEffect(() => {
            loadAllBusinesses();
        }, []);

        // Listen for auth state changes (for protected features)
        React.useEffect(() => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                setUser(user);
                if (user) {
                    await loadUserData(user.uid);
                    await loadUserBusinesses(user.uid);
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

        const loadAllBusinesses = async () => {
            try {
                const snapshot = await db.collection('businesses')
                    .orderBy('createdAt', 'desc')
                    .get();

                const businessesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    name: doc.data().name || 'Unnamed Business',
                    category: doc.data().category || 'General',
                    location: doc.data().location || 'Location TBD',
                    rating: doc.data().rating || 5.0,
                    reviews: doc.data().reviews || 0
                }));

                setAllBusinesses(businessesData);
            } catch (error) {
                console.error('Error loading all businesses:', error);
            }
        };

        const loadUserData = async (userId) => {
            try {
                const docRef = db.collection('users').doc(userId);
                const doc = await docRef.get();
                
                if (doc.exists) {
                    setUserData(doc.data());
                } else {
                    const defaultData = {
                        name: auth.currentUser?.displayName || '',
                        email: auth.currentUser?.email || '',
                        companyName: '',
                        phone: '',
                        role: 'user',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        settings: {
                            notifications: true,
                            theme: 'light'
                        }
                    };
                    await docRef.set(defaultData);
                    setUserData(defaultData);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        const loadUserBusinesses = async (userId) => {
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
                console.error('Error loading user businesses:', error);
            }
        };

        const setupNotificationsListener = (userId) => {
            try {
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
            } catch (error) {
                console.error('Error setting up notifications:', error);
                return () => {};
            }
        };

        const handleAddBusiness = async (businessData) => {
            if (!user) {
                setShowAuthModal(true);
                return;
            }

            try {
                const processedImages = (businessData.images || []).map(img => {
                    if (img.url) return img.url;
                    if (typeof img === 'string') return img;
                    return null;
                }).filter(url => url !== null);

                const businessWithUser = {
                    ...businessData,
                    images: processedImages,
                    userId: user.uid,
                    userEmail: user.email,
                    userName: userData?.name || user.displayName || 'Anonymous',
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
                setAllBusinesses(prev => [newBusiness, ...prev]);
                
                await createNotification({
                    userId: user.uid,
                    type: 'business',
                    title: 'Business Created',
                    message: `Successfully created ${businessData.name}`,
                    link: `/business/${docRef.id}`
                });
                
                Toast.show('Business created successfully!', 'success');
                
                return newBusiness;
            } catch (error) {
                console.error('Error adding business:', error);
                Toast.show(error.message, 'error');
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
            if (!user) {
                setShowAuthModal(true);
                return;
            }
            
            try {
                const { id, ...data } = businessData;
                await db.collection('businesses').doc(id).update({
                    ...data,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                setBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
                setAllBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));

                Toast.show('Business updated successfully!', 'success');
            } catch (error) {
                console.error('Error updating business:', error);
                Toast.show(error.message, 'error');
            }
        };

        const handleDeleteBusiness = async (id) => {
            if (!user) {
                setShowAuthModal(true);
                return;
            }
            
            try {
                await db.collection('businesses').doc(id).delete();
                
                setBusinesses(prev => prev.filter(b => b.id !== id));
                setAllBusinesses(prev => prev.filter(b => b.id !== id));
                
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

        const handleViewProfile = (business) => {
            setSelectedBusiness(business);
            setActivePage('profile');
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

        if (loading && !initialBusinessLoaded) {
            return React.createElement(LoadingSpinner, { fullPage: true });
        }

        const renderPage = () => {
            switch(activePage) {
                case 'home':
                    return React.createElement(LandingPage, {
                        onExplore: () => setActivePage('directory'),
                        allBusinesses
                    });
                case 'directory':
                    return React.createElement(DirectoryPage, {
                        businesses: allBusinesses,
                        onSelectBusiness: handleViewProfile
                    });
                case 'profile':
                    return React.createElement(ProfilePage, {
                        business: selectedBusiness,
                        onBack: () => setActivePage('directory'),
                        currentUser: user,
                        userData,
                        baseUrl: BASE_URL
                    });
                case 'dashboard':
                    return React.createElement(ProtectedRoute, { user },
                        React.createElement(Dashboard, {
                            businesses,
                            onNavigate: (page, business) => {
                                if (business) {
                                    setSelectedBusiness(business);
                                    setActivePage(page);
                                } else {
                                    setActivePage(page);
                                }
                            },
                            baseUrl: BASE_URL
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
                case 'analytics':
                    return React.createElement(ProtectedRoute, { user },
                        React.createElement(Analytics, {
                            businesses
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
                        onExplore: () => setActivePage('directory'),
                        allBusinesses
                    });
            }
        };

        return React.createElement(
            'div',
            { className: "min-h-screen bg-gray-50" },
            React.createElement(Navbar, {
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
                onLogout: handleLogout,
                onShowAuth: () => setShowAuthModal(true),
                onMarkAsRead: handleMarkNotificationAsRead,
                onMarkAllAsRead: handleMarkAllNotificationsAsRead,
                onNotificationClick: (notif) => {
                    if (notif.link) {
                        const businessId = notif.link.split('/').pop();
                        const business = allBusinesses.find(b => b.id === businessId);
                        if (business) handleViewProfile(business);
                    }
                }
            }),
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
                    loadAllBusinesses();
                }
            })
        );
    };

    window.App = App;

    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(React.createElement(App));
})();