// js/app.js
(function() {
    const App = () => {
        const [activePage, setActivePage] = React.useState('home');
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
        const [previousUnreadCount, setPreviousUnreadCount] = React.useState(0);
        const [supabaseReady, setSupabaseReady] = React.useState(!!window.supabase);

        const BASE_URL = 'https://prince123-p-byte.github.io/TapMap';

        // Check if Supabase is available
        React.useEffect(() => {
            if (!window.supabase) {
                console.error('❌ Supabase not initialized! Check your index.html script order.');
                window.Toast?.show('Database connection error. Please refresh.', 'error');
                setLoading(false);
                return;
            }
            console.log('✅ Supabase ready in App');
            setSupabaseReady(true);
        }, []);

        // Event listeners for navigation and auth
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

        // Check URL for business ID (QR code scan)
        React.useEffect(() => {
            if (!supabaseReady) return;
            
            const checkUrlForBusiness = async () => {
                const urlParams = new URLSearchParams(window.location.search);
                const businessId = urlParams.get('business');
                
                if (businessId) {
                    try {
                        const { data, error } = await window.supabase
                            .from('businesses')
                            .select('*')
                            .eq('id', businessId)
                            .single();
                        
                        if (error) throw error;
                        
                        if (data) {
                            setSelectedBusiness(data);
                            setActivePage('profile');
                            
                            const newUrl = window.location.pathname;
                            window.history.replaceState({}, '', newUrl);
                            
                            try {
                                await window.supabase
                                    .rpc('increment_analytics', {
                                        p_business_id: businessId,
                                        p_field: 'scans'
                                    });
                            } catch (rpcError) {
                                console.log('Analytics RPC not available yet');
                            }
                            
                            if (data.user_id) {
                                try {
                                    await window.supabase.from('notifications').insert([{
                                        user_id: data.user_id,
                                        type: 'scan',
                                        title: 'New QR Scan',
                                        message: `📱 Someone scanned your QR code for "${data.name}"`,
                                        icon: 'qrcode',
                                        business_id: businessId,
                                        read: false,
                                        created_at: new Date().toISOString()
                                    }]);
                                } catch (notifError) {
                                    console.log('Notification insert failed');
                                }
                            }
                            
                            window.Toast?.show('Business loaded!', 'success');
                        }
                    } catch (error) {
                        console.error('Error loading business from URL:', error);
                        window.Toast?.show('Business not found', 'error');
                    }
                }
            };
            
            checkUrlForBusiness();
        }, [supabaseReady]);

        // Load all businesses on startup
        React.useEffect(() => {
            if (!supabaseReady) return;
            loadAllBusinesses();
        }, [supabaseReady]);

        // Auth state listener
        React.useEffect(() => {
            if (!supabaseReady) return;
            
            window.supabase.auth.getSession().then(({ data: { session } }) => {
                const currentUser = session?.user || null;
                setUser(currentUser);
                if (currentUser) {
                    loadUserData(currentUser.id);
                    loadUserBusinesses(currentUser.id);
                    setupNotificationsListener(currentUser.id);
                } else {
                    setUserData(null);
                    setBusinesses([]);
                    setNotifications([]);
                    setUnreadCount(0);
                }
                setLoading(false);
            }).catch(error => {
                console.error('Auth session error:', error);
                setLoading(false);
            });

            const { data: { subscription } } = window.supabase.auth.onAuthStateChange((event, session) => {
                const currentUser = session?.user || null;
                setUser(currentUser);
                
                if (currentUser) {
                    loadUserData(currentUser.id);
                    loadUserBusinesses(currentUser.id);
                    setupNotificationsListener(currentUser.id);
                } else {
                    setUserData(null);
                    setBusinesses([]);
                    setNotifications([]);
                    setUnreadCount(0);
                }
            });

            return () => subscription?.unsubscribe();
        }, [supabaseReady]);

        // Notification sound
        React.useEffect(() => {
            if (unreadCount > previousUnreadCount) {
                const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
                audio.play().catch(e => console.log('Audio play failed:', e));
                
                const latestNotification = notifications[0];
                if (latestNotification) {
                    window.Toast?.show(latestNotification.message, 'info', 4000);
                }
            }
            setPreviousUnreadCount(unreadCount);
        }, [unreadCount, notifications]);

        // Data loading functions
        const loadAllBusinesses = async () => {
            try {
                const { data, error } = await window.supabase
                    .from('businesses')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;

                const businessesData = (data || []).map(biz => ({
                    id: biz.id,
                    ...biz,
                    name: biz.name || 'Unnamed Business',
                    category: biz.category || 'General',
                    location: biz.location || 'Location TBD',
                    rating: biz.rating || 5.0,
                    reviews: biz.reviews || 0,
                    views: biz.views || 0,
                    clicks: biz.clicks || 0,
                    qrScans: biz.qr_scans || 0,
                    conversations: biz.conversations || 0,
                    coverImage: biz.cover_image,
                    priceRange: biz.price_range
                }));

                setAllBusinesses(businessesData);
            } catch (error) {
                console.error('Error loading all businesses:', error);
                setAllBusinesses([]);
            }
        };

        const loadUserData = async (userId) => {
            try {
                const { data, error } = await window.supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();
                
                if (error && error.code !== 'PGRST116') throw error;
                
                if (data) {
                    setUserData(data);
                } else {
                    const defaultData = {
                        id: userId,
                        name: user?.email?.split('@')[0] || '',
                        email: user?.email || '',
                        company_name: '',
                        phone: '',
                        role: 'user',
                        created_at: new Date().toISOString(),
                        settings: {
                            notifications: true,
                            theme: 'light'
                        }
                    };
                    
                    try {
                        const { error: insertError } = await window.supabase
                            .from('users')
                            .insert([defaultData]);
                        
                        if (!insertError) {
                            setUserData(defaultData);
                        }
                    } catch (insertError) {
                        console.log('Could not create user profile');
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        const loadUserBusinesses = async (userId) => {
            try {
                console.log('Loading businesses for user:', userId);
                
                const { data, error } = await window.supabase
                    .from('businesses')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Error loading businesses:', error);
                    throw error;
                }
                
                console.log('Loaded businesses:', data);
                
                const businessesData = (data || []).map(biz => ({
                    id: biz.id,
                    ...biz,
                    views: biz.views || 0,
                    clicks: biz.clicks || 0,
                    qrScans: biz.qr_scans || 0,
                    conversations: biz.conversations || 0,
                    coverImage: biz.cover_image,
                    priceRange: biz.price_range
                }));

                setBusinesses(businessesData);
            } catch (error) {
                console.error('Error loading user businesses:', error);
                setBusinesses([]);
            }
        };

        const setupNotificationsListener = (userId) => {
            try {
                const subscription = window.supabase
                    .channel('notifications-channel')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${userId}`
                        },
                        async () => {
                            const { data } = await window.supabase
                                .from('notifications')
                                .select('*')
                                .eq('user_id', userId)
                                .order('created_at', { ascending: false })
                                .limit(50);
                            
                            setNotifications(data || []);
                            setUnreadCount((data || []).filter(n => !n.read).length);
                        }
                    )
                    .subscribe();

                window.supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(50)
                    .then(({ data }) => {
                        setNotifications(data || []);
                        setUnreadCount((data || []).filter(n => !n.read).length);
                    });

                return () => subscription?.unsubscribe();
            } catch (error) {
                console.error('Error setting up notifications:', error);
                return () => {};
            }
        };

        const createNotification = async (notification) => {
            try {
                const { error } = await window.supabase
                    .from('notifications')
                    .insert([{
                        ...notification,
                        read: false,
                        created_at: new Date().toISOString()
                    }]);
                
                if (error) throw error;
            } catch (error) {
                console.error('Error creating notification:', error);
            }
        };

        const handleAddBusiness = async (businessData) => {
            if (!user) {
                setShowAuthModal(true);
                return;
            }

            try {
                console.log('Creating business with data:', businessData);
                
                const { data: { user: currentUser } } = await window.supabase.auth.getUser();
                
                const businessToInsert = {
                    user_id: currentUser.id,
                    name: businessData.name || '',
                    category: businessData.category || '',
                    location: businessData.location || '',
                    address: businessData.address || '',
                    phone: businessData.phone || '',
                    email: businessData.email || '',
                    whatsapp: businessData.whatsapp || '',
                    description: businessData.description || '',
                    hours: businessData.hours || '',
                    price_range: businessData.priceRange || '$$',
                    status: businessData.status || 'active',
                    images: businessData.images || [],
                    cover_image: businessData.coverImage || '',
                    logo: businessData.logo || '',
                    user_email: currentUser.email || '',
                    user_name: userData?.name || currentUser.email?.split('@')[0] || 'Anonymous',
                    views: 0,
                    clicks: 0,
                    qr_scans: 0,
                    conversations: 0,
                    rating: 5.0,
                    reviews: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                console.log('Inserting business:', businessToInsert);

                const { data, error } = await window.supabase
                    .from('businesses')
                    .insert([businessToInsert])
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase insert error:', error);
                    throw new Error(error.message);
                }
                
                console.log('Business created successfully:', data);
                
                const newBusiness = {
                    id: data.id,
                    ...data,
                    qrScans: data.qr_scans || 0,
                    coverImage: data.cover_image,
                    priceRange: data.price_range
                };

                setBusinesses(prev => [newBusiness, ...prev]);
                setAllBusinesses(prev => [newBusiness, ...prev]);
                
                try {
                    await window.supabase
                        .from('notifications')
                        .insert([{
                            user_id: currentUser.id,
                            type: 'business',
                            title: 'Business Created',
                            message: `🎉 You successfully created "${businessData.name}"`,
                            icon: 'building',
                            read: false,
                            created_at: new Date().toISOString()
                        }]);
                } catch (notifError) {
                    console.log('Notification creation failed:', notifError);
                }
                
                window.Toast?.show('Business created successfully!', 'success');
                
                return newBusiness;
            } catch (error) {
                console.error('Error adding business:', error);
                window.Toast?.show(error.message || 'Error creating business', 'error');
            }
        };

        const handleEditBusiness = async (businessData) => {
            if (!user) {
                setShowAuthModal(true);
                return;
            }
            
            try {
                const { id, ...data } = businessData;
                
                const updateData = {
                    name: data.name,
                    category: data.category,
                    location: data.location,
                    address: data.address,
                    phone: data.phone,
                    email: data.email,
                    whatsapp: data.whatsapp,
                    description: data.description,
                    hours: data.hours,
                    price_range: data.priceRange,
                    status: data.status,
                    images: data.images,
                    cover_image: data.coverImage,
                    logo: data.logo,
                    updated_at: new Date().toISOString()
                };

                const { error } = await window.supabase
                    .from('businesses')
                    .update(updateData)
                    .eq('id', id);
                
                if (error) throw error;

                setBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
                setAllBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));

                await createNotification({
                    user_id: user.id,
                    type: 'business',
                    title: 'Business Updated',
                    message: `✏️ You updated "${businessData.name}"`,
                    icon: 'edit'
                });

                window.Toast?.show('Business updated successfully!', 'success');
            } catch (error) {
                console.error('Error updating business:', error);
                window.Toast?.show(error.message, 'error');
            }
        };

        const handleDeleteBusiness = async (id) => {
            if (!user) {
                setShowAuthModal(true);
                return;
            }
            
            try {
                const business = businesses.find(b => b.id === id);
                
                const { error } = await window.supabase
                    .from('businesses')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
                
                setBusinesses(prev => prev.filter(b => b.id !== id));
                setAllBusinesses(prev => prev.filter(b => b.id !== id));
                
                await createNotification({
                    user_id: user.id,
                    type: 'business',
                    title: 'Business Deleted',
                    message: `🗑️ You deleted "${business?.name}"`,
                    icon: 'trash'
                });
                
                window.Toast?.show('Business deleted', 'warning');
            } catch (error) {
                console.error('Error deleting business:', error);
                window.Toast?.show(error.message, 'error');
            }
        };

        const handleMarkNotificationAsRead = async (notificationId) => {
            try {
                await window.supabase
                    .from('notifications')
                    .update({ 
                        read: true,
                        read_at: new Date().toISOString()
                    })
                    .eq('id', notificationId);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        };

        const handleMarkAllNotificationsAsRead = async () => {
            try {
                await window.supabase
                    .from('notifications')
                    .update({ 
                        read: true,
                        read_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id)
                    .eq('read', false);
                
                window.Toast?.show('All notifications marked as read');
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
                await window.supabase.auth.signOut();
                setUser(null);
                setUserData(null);
                setBusinesses([]);
                setActivePage('home');
                window.Toast?.show('Logged out successfully', 'success');
            } catch (error) {
                console.error('Error logging out:', error);
                window.Toast?.show(error.message, 'error');
            }
        };

        const handleUpdateProfile = async (profileData) => {
            try {
                const { error } = await window.supabase
                    .from('users')
                    .update({
                        name: profileData.name,
                        company_name: profileData.companyName,
                        phone: profileData.phone,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);
                
                if (error) throw error;
                
                setUserData(prev => ({ 
                    ...prev, 
                    name: profileData.name,
                    company_name: profileData.companyName,
                    phone: profileData.phone
                }));
                
                await createNotification({
                    user_id: user.id,
                    type: 'profile',
                    title: 'Profile Updated',
                    message: `👤 Your profile was updated successfully`,
                    icon: 'user'
                });
                
                window.Toast?.show('Profile updated successfully', 'success');
            } catch (error) {
                console.error('Error updating profile:', error);
                window.Toast?.show(error.message, 'error');
            }
        };

        // Show loading while checking Supabase
        if (!supabaseReady) {
            return React.createElement(
                'div',
                { className: "min-h-screen flex items-center justify-center" },
                React.createElement(
                    'div',
                    { className: "text-center" },
                    React.createElement('div', { className: "spinner mx-auto mb-4" }),
                    React.createElement('p', { className: "text-gray-600" }, "Connecting to database...")
                )
            );
        }

        if (loading) {
            return React.createElement(window.LoadingSpinner, { fullPage: true });
        }

        const renderPage = () => {
            switch(activePage) {
                case 'home':
                    return React.createElement(window.LandingPage, {
                        onExplore: () => setActivePage('directory'),
                        allBusinesses
                    });
                case 'directory':
                    return React.createElement(window.DirectoryPage, {
                        businesses: allBusinesses,
                        onSelectBusiness: handleViewProfile
                    });
                case 'profile':
                    return React.createElement(window.ProfilePage, {
                        business: selectedBusiness,
                        onBack: () => setActivePage('directory'),
                        currentUser: user,
                        userData,
                        baseUrl: BASE_URL
                    });
                case 'dashboard':
                    return React.createElement(window.ProtectedRoute, { user },
                        React.createElement(window.Dashboard, {
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
                    return React.createElement(window.ProtectedRoute, { user },
                        React.createElement(window.SubBusinesses, {
                            key: businesses.length,
                            businesses,
                            onAddBusiness: handleAddBusiness,
                            onEditBusiness: handleEditBusiness,
                            onDeleteBusiness: handleDeleteBusiness,
                            onViewProfile: handleViewProfile
                        })
                    );
                case 'analytics':
                    return React.createElement(window.ProtectedRoute, { user },
                        React.createElement(window.Analytics, {
                            businesses
                        })
                    );
                case 'media':
                    return React.createElement(window.ProtectedRoute, { user },
                        React.createElement(window.MediaLibrary, null)
                    );
                case 'qr-manager':
                    return React.createElement(window.ProtectedRoute, { user },
                        React.createElement(window.QRManager, null)
                    );
                case 'settings':
                    return React.createElement(window.ProtectedRoute, { user },
                        React.createElement(window.Settings, {
                            user,
                            userData,
                            onUpdateProfile: handleUpdateProfile,
                            onLogout: handleLogout
                        })
                    );
                case 'help':
                    return React.createElement(window.Help);
                default:
                    return React.createElement(window.LandingPage, {
                        onExplore: () => setActivePage('directory'),
                        allBusinesses
                    });
            }
        };

        return React.createElement(
            'div',
            { className: "min-h-screen bg-gray-50" },
            React.createElement(window.Navbar, {
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
            React.createElement(window.AuthModal, {
                isOpen: showAuthModal,
                onClose: () => setShowAuthModal(false),
                onSuccess: () => {
                    setShowAuthModal(false);
                    loadAllBusinesses();
                }
            })
        );
    };

    const rootElement = document.getElementById('app');
    if (rootElement) {
        const root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(App));
    } else {
        console.error('❌ App root element not found');
    }
})();