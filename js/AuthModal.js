// js/AuthModal.js
(function() {
    const AuthModal = ({ isOpen, onClose, onSuccess }) => {
        const [mode, setMode] = React.useState('login');
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
                    if (formData.password !== formData.confirmPassword) {
                        throw new Error('Passwords do not match');
                    }

                    if (formData.password.length < 6) {
                        throw new Error('Password must be at least 6 characters');
                    }

                    const { data, error } = await window.supabase.auth.signUp({
                        email: formData.email,
                        password: formData.password,
                        options: {
                            data: {
                                name: formData.name,
                                company_name: formData.companyName
                            }
                        }
                    });

                    if (error) {
                        if (error.message.includes('User already registered')) {
                            throw new Error('This email is already registered. Please sign in instead.');
                        }
                        throw error;
                    }

                    if (data.user) {
                        // Try to create user profile, but don't fail if it doesn't work yet
                        try {
                            await window.supabase
                                .from('users')
                                .insert([{
                                    id: data.user.id,
                                    name: formData.name,
                                    email: formData.email,
                                    company_name: formData.companyName,
                                    created_at: new Date().toISOString(),
                                    settings: {
                                        notifications: true,
                                        theme: 'light'
                                    }
                                }]);
                        } catch (profileError) {
                            console.log('Profile creation will happen on first login');
                        }
                    }

                    window.Toast.show('Account created! Please check your email for confirmation.', 'success');
                    onSuccess?.();
                    onClose();
                } else {
                    const { error } = await window.supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password
                    });

                    if (error) {
                        if (error.message.includes('Invalid login credentials')) {
                            throw new Error('Invalid email or password. Please try again.');
                        }
                        throw error;
                    }
                    
                    window.Toast.show('Welcome back!', 'success');
                    onSuccess?.();
                    onClose();
                }
            } catch (error) {
                console.error('Auth error:', error);
                let errorMessage = error.message;
                
                if (error.message.includes('rate limit')) {
                    errorMessage = 'Too many attempts. Please wait a moment and try again.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Please check your email to confirm your account';
                } else if (error.message.includes('User already registered')) {
                    errorMessage = 'This email is already registered. Please sign in.';
                }
                
                setError(errorMessage);
                window.Toast.show(errorMessage, 'error');
            } finally {
                setLoading(false);
            }
        };

        if (!isOpen) return null;

        return React.createElement(
            'div',
            { 
                className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4",
                onClick: (e) => {
                    if (e.target === e.currentTarget) onClose();
                }
            },
            React.createElement(
                'div',
                { className: "bg-white rounded-3xl max-w-md w-full p-8 relative animate-slide-up" },
                
                React.createElement(
                    'button',
                    {
                        onClick: onClose,
                        className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    },
                    React.createElement(window.Icon, { name: "times", size: 20 })
                ),

                React.createElement(
                    'div',
                    { className: "text-center mb-8" },
                    React.createElement(
                        'div',
                        { className: "w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4" },
                        React.createElement(window.Icon, { name: "map-marked-alt", className: "text-white", size: 32 })
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

                error && React.createElement(
                    'div',
                    { className: "bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-start gap-2" },
                    React.createElement(window.Icon, { name: "exclamation-circle", className: "flex-shrink-0 mt-0.5", size: 16 }),
                    React.createElement('span', null, error)
                ),

                React.createElement(
                    'form',
                    { onSubmit: handleSubmit, className: "space-y-4" },
                    
                    mode === 'signup' && React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(window.FormInput, {
                            label: "Full Name",
                            name: "name",
                            value: formData.name,
                            onChange: handleChange,
                            required: true,
                            icon: "user"
                        }),
                        React.createElement(window.FormInput, {
                            label: "Company Name",
                            name: "companyName",
                            value: formData.companyName,
                            onChange: handleChange,
                            icon: "building"
                        })
                    ),

                    React.createElement(window.FormInput, {
                        label: "Email Address",
                        name: "email",
                        type: "email",
                        value: formData.email,
                        onChange: handleChange,
                        required: true,
                        icon: "envelope"
                    }),

                    React.createElement(window.FormInput, {
                        label: "Password",
                        name: "password",
                        type: "password",
                        value: formData.password,
                        onChange: handleChange,
                        required: true,
                        icon: "lock"
                    }),

                    mode === 'signup' && React.createElement(window.FormInput, {
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
                            className: "w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        },
                        loading 
                            ? React.createElement(window.Icon, { name: "spinner", className: "animate-spin", size: 18 })
                            : (mode === 'login' ? 'Sign In' : 'Create Account')
                    )
                ),

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

                React.createElement(
                    'button',
                    {
                        onClick: async () => {
                            setLoading(true);
                            try {
                                const { error } = await window.supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: window.location.origin
                                    }
                                });
                                if (error) throw error;
                            } catch (error) {
                                console.error('Google login error:', error);
                                window.Toast.show(error.message, 'error');
                                setLoading(false);
                            }
                        },
                        disabled: loading,
                        type: "button",
                        className: "w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    },
                    React.createElement('img', {
                        src: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
                        className: "w-5 h-5",
                        alt: "Google logo"
                    }),
                    "Continue with Google"
                ),

                React.createElement(
                    'p',
                    { className: "text-center text-sm text-gray-500 mt-6" },
                    mode === 'login' ? "Don't have an account? " : "Already have an account? ",
                    React.createElement(
                        'button',
                        {
                            type: "button",
                            onClick: () => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                setError('');
                                setFormData({
                                    email: '',
                                    password: '',
                                    confirmPassword: '',
                                    name: '',
                                    companyName: ''
                                });
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