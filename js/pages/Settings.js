(function() {
    const Settings = () => {
        const [user, setUser] = React.useState(null);
        const [userData, setUserData] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [saving, setSaving] = React.useState(false);
        const [activeTab, setActiveTab] = React.useState('profile');

        React.useEffect(() => {
            loadUserData();
        }, []);

        const loadUserData = async () => {
            try {
                const currentUser = auth.currentUser;
                if (!currentUser) return;

                setUser(currentUser);
                
                const doc = await db.collection('users').doc(currentUser.uid).get();
                if (doc.exists) {
                    setUserData(doc.data());
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                Toast.show('Error loading settings', 'error');
            } finally {
                setLoading(false);
            }
        };

        const handleProfileUpdate = async (e) => {
            e.preventDefault();
            setSaving(true);

            try {
                const formData = new FormData(e.target);
                const updates = {
                    name: formData.get('name'),
                    companyName: formData.get('companyName'),
                    phone: formData.get('phone'),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('users').doc(user.uid).update(updates);
                
                // Update auth profile
                if (user.displayName !== updates.name) {
                    await user.updateProfile({
                        displayName: updates.name
                    });
                }

                Toast.show('Profile updated successfully', 'success');
                loadUserData();
            } catch (error) {
                console.error('Error updating profile:', error);
                Toast.show(error.message, 'error');
            } finally {
                setSaving(false);
            }
        };

        const handlePasswordChange = async (e) => {
            e.preventDefault();
            setSaving(true);

            try {
                const formData = new FormData(e.target);
                const currentPassword = formData.get('currentPassword');
                const newPassword = formData.get('newPassword');
                const confirmPassword = formData.get('confirmPassword');

                if (newPassword !== confirmPassword) {
                    throw new Error('New passwords do not match');
                }

                // Re-authenticate user
                const credential = firebase.auth.EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );
                await user.reauthenticateWithCredential(credential);

                // Update password
                await user.updatePassword(newPassword);

                Toast.show('Password updated successfully', 'success');
                e.target.reset();
            } catch (error) {
                console.error('Error updating password:', error);
                Toast.show(error.message, 'error');
            } finally {
                setSaving(false);
            }
        };

        const handleNotificationUpdate = async (settings) => {
            setSaving(true);
            try {
                await db.collection('users').doc(user.uid).update({
                    'settings.notifications': settings
                });
                Toast.show('Notification settings updated', 'success');
                loadUserData();
            } catch (error) {
                console.error('Error updating notifications:', error);
                Toast.show(error.message, 'error');
            } finally {
                setSaving(false);
            }
        };

        const handleDeleteAccount = async () => {
            if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                return;
            }

            try {
                // Delete user data from Firestore
                await db.collection('users').doc(user.uid).delete();
                
                // Delete businesses owned by user
                const businesses = await db.collection('businesses')
                    .where('userId', '==', user.uid)
                    .get();
                
                const batch = db.batch();
                businesses.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();

                // Delete user auth account
                await user.delete();

                Toast.show('Account deleted successfully', 'warning');
                auth.signOut();
            } catch (error) {
                console.error('Error deleting account:', error);
                Toast.show(error.message, 'error');
            }
        };

        if (loading) {
            return React.createElement(LoadingSpinner, { fullPage: true });
        }

        const tabs = [
            { id: 'profile', label: 'Profile', icon: 'user' },
            { id: 'security', label: 'Security', icon: 'lock' },
            { id: 'notifications', label: 'Notifications', icon: 'bell' },
            { id: 'billing', label: 'Billing', icon: 'credit-card' },
            { id: 'team', label: 'Team', icon: 'users' }
        ];

        return React.createElement(
            'div',
            { className: "pt-20 pb-12 min-h-screen bg-gray-50" },
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4" },
                
                // Header
                React.createElement(
                    'div',
                    { className: "mb-8" },
                    React.createElement(
                        'h1',
                        { className: "text-3xl font-bold gradient-text mb-2" },
                        "Settings"
                    ),
                    React.createElement(
                        'p',
                        { className: "text-gray-600" },
                        "Manage your account preferences and security"
                    )
                ),

                // Settings Layout
                React.createElement(
                    'div',
                    { className: "grid lg:grid-cols-4 gap-8" },
                    
                    // Sidebar
                    React.createElement(
                        'div',
                        { className: "lg:col-span-1" },
                        React.createElement(
                            ModernCard,
                            { className: "p-4" },
                            tabs.map(tab =>
                                React.createElement(
                                    'button',
                                    {
                                        key: tab.id,
                                        onClick: () => setActiveTab(tab.id),
                                        className: `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`
                                    },
                                    React.createElement(Icon, { name: tab.icon, size: 18 }),
                                    tab.label
                                )
                            )
                        )
                    ),

                    // Main Content
                    React.createElement(
                        'div',
                        { className: "lg:col-span-3" },
                        React.createElement(
                            ModernCard,
                            { className: "p-8" },
                            
                            // Profile Settings
                            activeTab === 'profile' && React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'h2',
                                    { className: "text-xl font-bold mb-6" },
                                    "Profile Information"
                                ),
                                React.createElement(
                                    'form',
                                    { onSubmit: handleProfileUpdate, className: "space-y-6" },
                                    React.createElement(
                                        'div',
                                        { className: "flex items-center gap-6 mb-6" },
                                        React.createElement(
                                            'div',
                                            { className: "relative" },
                                            React.createElement(
                                                'div',
                                                { className: "w-24 h-24 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center text-3xl font-bold" },
                                                userData?.name?.charAt(0) || user?.email?.charAt(0) || 'U'
                                            ),
                                            React.createElement(
                                                'button',
                                                {
                                                    type: "button",
                                                    className: "absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-600 transition-all"
                                                },
                                                React.createElement(Icon, { name: "camera", size: 14 })
                                            )
                                        ),
                                        React.createElement(
                                            'div',
                                            null,
                                            React.createElement('h3', { className: "font-bold" }, userData?.name || 'User'),
                                            React.createElement('p', { className: "text-sm text-gray-500" }, user?.email)
                                        )
                                    ),

                                    React.createElement(FormInput, {
                                        label: "Full Name",
                                        name: "name",
                                        defaultValue: userData?.name || '',
                                        icon: "user"
                                    }),

                                    React.createElement(FormInput, {
                                        label: "Company Name",
                                        name: "companyName",
                                        defaultValue: userData?.companyName || '',
                                        icon: "building"
                                    }),

                                    React.createElement(FormInput, {
                                        label: "Phone Number",
                                        name: "phone",
                                        type: "tel",
                                        defaultValue: userData?.phone || '',
                                        icon: "phone"
                                    }),

                                    React.createElement(
                                        'div',
                                        { className: "flex justify-end gap-4 pt-4 border-t border-gray-100" },
                                        React.createElement(
                                            Button,
                                            {
                                                type: "submit",
                                                icon: "save",
                                                loading: saving
                                            },
                                            "Save Changes"
                                        )
                                    )
                                )
                            ),

                            // Security Settings
                            activeTab === 'security' && React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'h2',
                                    { className: "text-xl font-bold mb-6" },
                                    "Security Settings"
                                ),
                                React.createElement(
                                    'form',
                                    { onSubmit: handlePasswordChange, className: "space-y-6 max-w-md" },
                                    React.createElement(FormInput, {
                                        label: "Current Password",
                                        name: "currentPassword",
                                        type: "password",
                                        required: true,
                                        icon: "lock"
                                    }),
                                    React.createElement(FormInput, {
                                        label: "New Password",
                                        name: "newPassword",
                                        type: "password",
                                        required: true,
                                        icon: "lock"
                                    }),
                                    React.createElement(FormInput, {
                                        label: "Confirm New Password",
                                        name: "confirmPassword",
                                        type: "password",
                                        required: true,
                                        icon: "lock"
                                    }),
                                    React.createElement(
                                        'div',
                                        { className: "flex justify-end gap-4 pt-4 border-t border-gray-100" },
                                        React.createElement(
                                            Button,
                                            {
                                                type: "submit",
                                                icon: "key",
                                                loading: saving
                                            },
                                            "Update Password"
                                        )
                                    )
                                ),

                                React.createElement(
                                    'div',
                                    { className: "mt-8 pt-8 border-t border-gray-100" },
                                    React.createElement(
                                        'h3',
                                        { className: "text-lg font-bold text-red-600 mb-4" },
                                        "Danger Zone"
                                    ),
                                    React.createElement(
                                        'button',
                                        {
                                            onClick: handleDeleteAccount,
                                            className: "bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-all"
                                        },
                                        "Delete Account"
                                    )
                                )
                            ),

                            // Notification Settings
                            activeTab === 'notifications' && React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'h2',
                                    { className: "text-xl font-bold mb-6" },
                                    "Notification Preferences"
                                ),
                                React.createElement(
                                    'div',
                                    { className: "space-y-4" },
                                    [
                                        { id: 'emailAlerts', label: 'Email Alerts', desc: 'Receive email notifications for important updates' },
                                        { id: 'qrScans', label: 'QR Scan Alerts', desc: 'Get notified when someone scans your QR codes' },
                                        { id: 'newReviews', label: 'New Reviews', desc: 'Be notified when customers leave reviews' },
                                        { id: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly performance reports' }
                                    ].map((setting, i) =>
                                        React.createElement(
                                            'div',
                                            { key: i, className: "flex items-center justify-between p-4 bg-gray-50 rounded-xl" },
                                            React.createElement(
                                                'div',
                                                null,
                                                React.createElement('h4', { className: "font-medium" }, setting.label),
                                                React.createElement('p', { className: "text-sm text-gray-500" }, setting.desc)
                                            ),
                                            React.createElement(
                                                'label',
                                                { className: "relative inline-flex items-center cursor-pointer" },
                                                React.createElement('input', {
                                                    type: "checkbox",
                                                    className: "sr-only peer",
                                                    defaultChecked: true,
                                                    onChange: (e) => handleNotificationUpdate({
                                                        ...userData?.settings?.notifications,
                                                        [setting.id]: e.target.checked
                                                    })
                                                }),
                                                React.createElement('div', {
                                                    className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"
                                                })
                                            )
                                        )
                                    )
                                )
                            ),

                            // Billing Settings
                            activeTab === 'billing' && React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'h2',
                                    { className: "text-xl font-bold mb-6" },
                                    "Billing & Subscription"
                                ),
                                React.createElement(
                                    'div',
                                    { className: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl mb-6" },
                                    React.createElement(
                                        'div',
                                        { className: "flex justify-between items-start" },
                                        React.createElement(
                                            'div',
                                            null,
                                            React.createElement('p', { className: "text-indigo-100 mb-2" }, "Current Plan"),
                                            React.createElement('h3', { className: "text-3xl font-bold mb-2" }, "Pro Business"),
                                            React.createElement('p', { className: "text-indigo-100" }, "$29/month")
                                        ),
                                        React.createElement(
                                            'button',
                                            {
                                                onClick: () => Toast.show('Upgrade options coming soon'),
                                                className: "bg-white/20 backdrop-blur px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
                                            },
                                            "Upgrade"
                                        )
                                    )
                                ),
                                React.createElement(
                                    'div',
                                    { className: "space-y-4" },
                                    [
                                        { date: 'Mar 1, 2024', amount: '$29.00', status: 'Paid' },
                                        { date: 'Feb 1, 2024', amount: '$29.00', status: 'Paid' },
                                        { date: 'Jan 1, 2024', amount: '$29.00', status: 'Paid' }
                                    ].map((invoice, i) =>
                                        React.createElement(
                                            'div',
                                            { key: i, className: "flex items-center justify-between p-4 bg-gray-50 rounded-xl" },
                                            React.createElement(
                                                'div',
                                                { className: "flex items-center gap-4" },
                                                React.createElement(Icon, { name: "file-invoice", className: "text-gray-400" }),
                                                React.createElement(
                                                    'div',
                                                    null,
                                                    React.createElement('p', { className: "font-medium" }, invoice.date),
                                                    React.createElement('p', { className: "text-sm text-gray-500" }, invoice.amount)
                                                )
                                            ),
                                            React.createElement(
                                                'div',
                                                { className: "flex items-center gap-3" },
                                                React.createElement(Badge, { type: "success" }, invoice.status),
                                                React.createElement(
                                                    'button',
                                                    { className: "text-indigo-600 hover:text-indigo-700" },
                                                    React.createElement(Icon, { name: "download", size: 16 })
                                                )
                                            )
                                        )
                                    )
                                )
                            ),

                            // Team Settings
                            activeTab === 'team' && React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'div',
                                    { className: "flex justify-between items-center mb-6" },
                                    React.createElement(
                                        'h2',
                                        { className: "text-xl font-bold" },
                                        "Team Members"
                                    ),
                                    React.createElement(
                                        'button',
                                        {
                                            onClick: () => Toast.show('Invite team members coming soon'),
                                            className: "bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center gap-2"
                                        },
                                        React.createElement(Icon, { name: "plus", size: 14 }),
                                        "Invite Member"
                                    )
                                ),
                                React.createElement(
                                    'div',
                                    { className: "space-y-4" },
                                    [
                                        { name: 'You', email: user?.email, role: 'Owner', status: 'Active' }
                                    ].concat(userData?.team || []).map((member, i) =>
                                        React.createElement(
                                            'div',
                                            { key: i, className: "flex items-center justify-between p-4 bg-gray-50 rounded-xl" },
                                            React.createElement(
                                                'div',
                                                { className: "flex items-center gap-4" },
                                                React.createElement(
                                                    'div',
                                                    { className: "w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold" },
                                                    member.name?.charAt(0) || 'U'
                                                ),
                                                React.createElement(
                                                    'div',
                                                    null,
                                                    React.createElement('p', { className: "font-medium" }, member.name),
                                                    React.createElement('p', { className: "text-sm text-gray-500" }, member.email)
                                                )
                                            ),
                                            React.createElement(
                                                'div',
                                                { className: "flex items-center gap-3" },
                                                React.createElement(Badge, { type: "success" }, member.status),
                                                member.role !== 'Owner' && React.createElement(
                                                    'button',
                                                    { className: "text-gray-400 hover:text-red-600 transition-colors" },
                                                    React.createElement(Icon, { name: "trash", size: 16 })
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
    };

    window.Settings = Settings;
})();