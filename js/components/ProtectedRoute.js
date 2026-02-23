const ProtectedRoute = ({ children, user }) => {
    if (!user) {
        return React.createElement(
            'div',
            { className: "min-h-screen flex items-center justify-center p-4" },
            React.createElement(
                'div',
                { className: "text-center max-w-md" },
                React.createElement(Icon, { name: "lock", size: 48, className: "text-gray-300 mx-auto mb-4" }),
                React.createElement('h2', { className: "text-2xl font-bold mb-2" }, "Sign In Required"),
                React.createElement('p', { className: "text-gray-500 mb-6" },
                    "You need to be signed in to access your dashboard and manage businesses."
                ),
                React.createElement(
                    'button',
                    {
                        onClick: () => window.dispatchEvent(new CustomEvent('openAuthModal')),
                        className: "bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    },
                    "Sign In"
                ),
                React.createElement(
                    'p',
                    { className: "text-sm text-gray-400 mt-4" },
                    "Don't have an account? ",
                    React.createElement(
                        'button',
                        {
                            onClick: () => window.dispatchEvent(new CustomEvent('openAuthModal')),
                            className: "text-indigo-600 hover:underline font-medium"
                        },
                        "Sign up"
                    )
                )
            )
        );
    }

    return children;
};

window.ProtectedRoute = ProtectedRoute;