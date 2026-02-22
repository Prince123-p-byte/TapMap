(function() {
    const AuthModal = ({ isOpen, onClose, onSuccess }) => {
        const [mode, setMode] = React.useState('login'); // 'login' or 'signup'
        const [formData, setFormData] = React.useState({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
            companyName: ''
        });
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState('');

        const handleChange = (e) => {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
            setError('');
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            setError('');

            try {
                if (mode === 'signup') {
                    // Validate passwords match
                    if (formData.password !== formData.confirmPassword) {
                        throw new Error('Passwords do not match');
                    }

                    // Create user in Firebase
                    const userCredential = await auth.createUserWithEmailAndPassword(
                        formData.email, 
                        formData.password
                    );

                    // Update profile with name
                    await userCredential.user.updateProfile({
                        displayName: formData.name
                    });

                    // Create user document in Firestore
                    await db.collection('users').doc(userCredential.user.uid).set({
                        name: formData.name,
                        email: formData.email,
                        companyName: formData.companyName,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        settings: {
                            notifications: true,
                            theme: 'light'
                        }
                    });

                    Toast.show('Account created successfully!', 'success');
                } else {
                    // Login existing user
                    await auth.signInWithEmailAndPassword(
                        formData.email, 
                        formData.password
                    );
                    Toast.show('Welcome back!', 'success');
                }

                onSuccess?.();
                onClose();
            } catch (error) {
                console.error('Auth error:', error);
                setError(error.message);
                Toast.show(error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        const handleGoogleLogin = async () => {
            setLoading(true);
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                await auth.signInWithPopup(provider);
                Toast.show('Logged in with Google!', 'success');
                onSuccess?.();
                onClose();
            } catch (error) {
                console.error('Google login error:', error);
                Toast.show(error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        if (!isOpen) return null;

        return React.createElement(
            'div',
            { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" },
            React.createElement(
                'div',
                { className: "bg-white rounded-3xl max-w-md w-full p-8 relative animate-slide-up" },
                
                // Close button
                React.createElement(
                    'button',
                    {
                        onClick: onClose,
                        className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    },
                    React.createElement(Icon, { name: "times", size: 20 })
                ),

                // Logo
                React.createElement(
                    'div',
                    { className: "text-center mb-8" },
                    React.createElement(
                        'div',
                        { className: "w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4" },
                        React.createElement(Icon, { name: "map-marked-alt", className: "text-white", size: 32 })
                    ),
                    React.createElement(
                        'h2',
                        { className: "text-2xl font-bold" },
                        mode === 'login' ? 'Welcome back to tapMap' : 'Create your tapMap account'
                    ),
                    React.createElement(
                        'p',
                        { className: "text-gray-500 text-sm mt-2" },
                        mode === 'login' 
                            ? 'Sign in to manage your businesses'
                            : 'Start managing your multi-business portfolio'
                    )
                ),

                // Error message
                error && React.createElement(
                    'div',
                    { className: "bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm" },
                    React.createElement(Icon, { name: "exclamation-circle", className: "mr-2" }),
                    error
                ),

                // Form
                React.createElement(
                    'form',
                    { onSubmit: handleSubmit, className: "space-y-4" },
                    
                    mode === 'signup' && React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(FormInput, {
                            label: "Full Name",
                            name: "name",
                            value: formData.name,
                            onChange: handleChange,
                            required: true,
                            icon: "user"
                        }),
                        React.createElement(FormInput, {
                            label: "Company Name",
                            name: "companyName",
                            value: formData.companyName,
                            onChange: handleChange,
                            required: true,
                            icon: "building"
                        })
                    ),

                    React.createElement(FormInput, {
                        label: "Email Address",
                        name: "email",
                        type: "email",
                        value: formData.email,
                        onChange: handleChange,
                        required: true,
                        icon: "envelope"
                    }),

                    React.createElement(FormInput, {
                        label: "Password",
                        name: "password",
                        type: "password",
                        value: formData.password,
                        onChange: handleChange,
                        required: true,
                        icon: "lock"
                    }),

                    mode === 'signup' && React.createElement(FormInput, {
                        label: "Confirm Password",
                        name: "confirmPassword",
                        type: "password",
                        value: formData.confirmPassword,
                        onChange: handleChange,
                        required: true,
                        icon: "lock"
                    }),

                    React.createElement(
                        'button',
                        {
                            type: "submit",
                            disabled: loading,
                            className: "w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                        },
                        loading 
                            ? React.createElement(Icon, { name: "spinner", className: "animate-spin" })
                            : (mode === 'login' ? 'Sign In' : 'Create Account')
                    )
                ),

                // Divider
                React.createElement(
                    'div',
                    { className: "relative my-6" },
                    React.createElement('div', { className: "absolute inset-0 flex items-center" },
                        React.createElement('div', { className: "w-full border-t border-gray-200" })
                    ),
                    React.createElement(
                        'div',
                        { className: "relative flex justify-center text-sm" },
                        React.createElement('span', { className: "px-4 bg-white text-gray-500" }, "Or continue with")
                    )
                ),

                // Google Sign In
                React.createElement(
                    'button',
                    {
                        onClick: handleGoogleLogin,
                        disabled: loading,
                        className: "w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    },
                    React.createElement('img', {
                        src: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
                        className: "w-5 h-5"
                    }),
                    "Google"
                ),

                // Toggle mode
                React.createElement(
                    'p',
                    { className: "text-center text-sm text-gray-500 mt-6" },
                    mode === 'login' ? "Don't have an account? " : "Already have an account? ",
                    React.createElement(
                        'button',
                        {
                            onClick: () => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                setError('');
                            },
                            className: "text-indigo-600 font-medium hover:underline"
                        },
                        mode === 'login' ? 'Sign up' : 'Sign in'
                    )
                )
            )
        );
    };

    window.AuthModal = AuthModal;
})();