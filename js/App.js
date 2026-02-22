(function() {
    const App = () => {
        const [activePage, setActivePage] = React.useState('home');
        const [businesses, setBusinesses] = React.useState([]);
        const [selectedBusiness, setSelectedBusiness] = React.useState(null);
        const [user, setUser] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [showAuthModal, setShowAuthModal] = React.useState(false);

        // Listen for auth modal event
        React.useEffect(() => {
            const handleOpenAuth = () => setShowAuthModal(true);
            window.addEventListener('openAuthModal', handleOpenAuth);
            return () => window.removeEventListener('openAuthModal', handleOpenAuth);
        }, []);

        // Listen for auth state changes
        React.useEffect(() => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                setUser(user);
                if (user) {
                    await loadBusinesses(user.uid);
                } else {
                    setBusinesses([]);
                }
                setLoading(false);
            });

            return () => unsubscribe();
        }, []);

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
                    conversations: 0
                };

                const docRef = await db.collection('businesses').add(businessWithUser);
                
                const newBusiness = {
                    id: docRef.id,
                    ...businessWithUser
                };

                setBusinesses(prev => [newBusiness, ...prev]);
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
                Toast.show('Business deleted', 'warning');
            } catch (error) {
                console.error('Error deleting business:', error);
                Toast.show(error.message, 'error');
            }
        };

        const handleLogout = async () => {
            try {
                await auth.signOut();
                setUser(null);
                setBusinesses([]);
                setActivePage('home');
                Toast.show('Logged out successfully', 'success');
            } catch (error) {
                console.error('Error logging out:', error);
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
                    return React.createElement(ProtectedRoute, null,
                        React.createElement(ProfilePage, {
                            business: selectedBusiness,
                            onBack: () => setActivePage('directory')
                        })
                    );
                case 'dashboard':
                    return React.createElement(ProtectedRoute, null,
                        React.createElement(Dashboard, {
                            businesses,
                            onNavigate: handleNavigate
                        })
                    );
                case 'sub-businesses':
                    return React.createElement(ProtectedRoute, null,
                        React.createElement(SubBusinesses, {
                            businesses,
                            onAddBusiness: handleAddBusiness,
                            onEditBusiness: handleEditBusiness,
                            onDeleteBusiness: handleDeleteBusiness,
                            onViewProfile: handleViewProfile
                        })
                    );
                case 'media':
                    return React.createElement(ProtectedRoute, null,
                        React.createElement(MediaLibrary)
                    );
                case 'qr-manager':
                    return React.createElement(ProtectedRoute, null,
                        React.createElement(QRManager)
                    );
                case 'analytics':
                    return React.createElement(ProtectedRoute, null,
                        React.createElement(Analytics)
                    );
                case 'settings':
                    return React.createElement(ProtectedRoute, null,
                        React.createElement(Settings)
                    );
                case 'help':
                    return React.createElement(Help);
                default:
                    return React.createElement(LandingPage, {
                        onExplore: () => setActivePage('directory')
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
                onLogout: handleLogout,
                onShowAuth: () => setShowAuthModal(true)
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
                }
            })
        );
    };

    window.App = App;

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(React.createElement(App));
})();