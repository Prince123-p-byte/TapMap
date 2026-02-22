(function() {
    const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
        const [loading, setLoading] = React.useState(true);
        const [user, setUser] = React.useState(null);
        const [authorized, setAuthorized] = React.useState(false);

        React.useEffect(() => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                setUser(user);
                
                if (user) {
                    // Check user role from Firestore
                    try {
                        const userDoc = await db.collection('users').doc(user.uid).get();
                        const userData = userDoc.data();
                        
                        if (requiredRole === 'admin' && userData?.role !== 'admin') {
                            setAuthorized(false);
                            Toast.show('Admin access required', 'error');
                        } else {
                            setAuthorized(true);
                        }
                    } catch (error) {
                        console.error('Error checking user role:', error);
                        setAuthorized(false);
                    }
                } else {
                    setAuthorized(false);
                }
                
                setLoading(false);
            });

            return () => unsubscribe();
        }, [requiredRole]);

        if (loading) {
            return React.createElement(LoadingSpinner, { fullPage: true });
        }

        if (!authorized) {
            return React.createElement(
                'div',
                { className: "min-h-screen flex items-center justify-center p-4" },
                React.createElement(
                    'div',
                    { className: "text-center max-w-md" },
                    React.createElement(Icon, { name: "lock", size: 48, className: "text-gray-300 mx-auto mb-4" }),
                    React.createElement('h2', { className: "text-2xl font-bold mb-2" }, "Access Denied"),
                    React.createElement('p', { className: "text-gray-500 mb-6" },
                        user 
                            ? "You don't have permission to access this page."
                            : "Please sign in to access this page."
                    ),
                    !user && React.createElement(
                        'button',
                        {
                            onClick: () => window.dispatchEvent(new CustomEvent('openAuthModal')),
                            className: "bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                        },
                        "Sign In"
                    )
                )
            );
        }

        return children;
    };

    window.ProtectedRoute = ProtectedRoute;
})();