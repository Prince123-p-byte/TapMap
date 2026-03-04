// js/Settings.js
(function() {
    const Settings = ({ user, userData, onUpdateProfile, onLogout }) => {
        const [activeTab, setActiveTab] = React.useState('profile');
        const [loading, setLoading] = React.useState(false);
        const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
        const [profilePhoto, setProfilePhoto] = React.useState(userData?.photo_url || null);
        const [formData, setFormData] = React.useState({
            name: userData?.name || '',
            companyName: userData?.company_name || '',
            phone: userData?.phone || '',
            email: user?.email || ''
        });

        const handleChange = (e) => {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
        };

        const handleProfilePhotoUpload = async (files) => {
            if (files.length === 0) return;
            
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                window.Toast.show('Please select an image file', 'error');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                window.Toast.show('File size must be less than 5MB', 'error');
                return;
            }

            setUploadingPhoto(true);
            
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setProfilePhoto(e.target.result);
                };
                reader.readAsDataURL(file);

                const { data: { user: currentUser } } = await window.supabase.auth.getUser();
                
                const fileName = `profiles/${currentUser.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                
                const { error: uploadError } = await window.supabase.storage
                    .from('business-images')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = window.supabase.storage
                    .from('business-images')
                    .getPublicUrl(fileName);

                const publicUrl = urlData.publicUrl;
                
                setProfilePhoto(publicUrl);
                
                const { error: updateError } = await window.supabase
                    .from('users')
                    .update({ 
                        photo_url: publicUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentUser.id);

                if (updateError) throw updateError;

                window.Toast.show('Profile photo uploaded successfully', 'success');
                
            } catch (error) {
                console.error('Error uploading photo:', error);
                window.Toast.show('Error uploading photo: ' + error.message, 'error');
            } finally {
                setUploadingPhoto(false);
            }
        };

        const handleProfileSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            
            try {
                await onUpdateProfile({
                    name: formData.name,
                    companyName: formData.companyName,
                    phone: formData.phone
                });
                window.Toast.show('Profile updated successfully', 'success');
            } catch (error) {
                console.error('Error updating profile:', error);
                window.Toast.show(error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        const handlePasswordSubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');

            if (newPassword !== confirmPassword) {
                window.Toast.show('New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                window.Toast.show('Password must be at least 6 characters', 'error');
                return;
            }

            setLoading(true);
            try {
                const { error } = await window.supabase.auth.updateUser({
                    password: newPassword
                });

                if (error) throw error;
                
                window.Toast.show('Password updated successfully', 'success');
                e.target.reset();
            } catch (error) {
                console.error('Error updating password:', error);
                window.Toast.show(error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        const handleNotificationChange = async (settingId, checked) => {
            try {
                const currentSettings = userData?.settings || { notifications: {} };
                const newSettings = {
                    ...currentSettings,
                    notifications: {
                        ...currentSettings.notifications,
                        [settingId]: checked
                    }
                };

                const { error } = await window.supabase
                    .from('users')
                    .update({ 
                        settings: newSettings,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);

                if (error) throw error;
                
                window.Toast.show('Settings updated', 'success');
            } catch (error) {
                console.error('Error updating settings:', error);
                window.Toast.show('Error updating settings', 'error');
            }
        };

        const handleDeleteAccount = async () => {
            if (confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone.\n\nAll your businesses, reviews, and data will be permanently deleted.')) {
                setLoading(true);
                try {
                    await window.supabase.auth.signOut();
                    onLogout();
                    window.Toast.show('Account signed out. For permanent deletion, please contact support.', 'warning');
                } catch (error) {
                    console.error('Error during account deletion:', error);
                    window.Toast.show(error.message, 'error');
                } finally {
                    setLoading(false);
                }
            }
        };

        const tabs = [
            { id: 'profile', label: 'Profile', icon: 'user' },
            { id: 'security', label: 'Security', icon: 'lock' },
            { id: 'notifications', label: 'Notifications', icon: 'bell' }
        ];

        return React.createElement(
            'div',
            { className: "pt-20 pb-12 min-h-screen bg-gray-50" },
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4" },
                
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

                React.createElement(
                    'div',
                    { className: "grid lg:grid-cols-4 gap-8" },
                    
                    React.createElement(
                        'div',
                        { className: "lg:col-span-1" },
                        React.createElement(
                            'div',
                            { className: "bg-white rounded-2xl p-4 shadow-sm border border-gray-100" },
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
                                    React.createElement(window.Icon, { name: tab.icon, size: 18 }),
                                    tab.label
                                )
                            )
                        )
                    ),

                    React.createElement(
                        'div',
                        { className: "lg:col-span-3" },
                        React.createElement(
                            'div',
                            { className: "bg-white rounded-2xl p-8 shadow-sm border border-gray-100" },
                            
                            activeTab === 'profile' && React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'h2',
                                    { className: "text-xl font-bold mb-6" },
                                    "Profile Information"
                                ),
                                
                                React.createElement(
                                    'div',
                                    { className: "mb-8" },
                                    React.createElement('label', { className: "form-label" }, "Profile Photo"),
                                    React.createElement(
                                        'div',
                                        { className: "flex flex-col sm:flex-row items-center gap-6" },
                                        React.createElement(
                                            'div',
                                            { className: "relative" },
                                            React.createElement(
                                                'div',
                                                { className: "w-24 h-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center text-3xl font-bold overflow-hidden" },
                                                profilePhoto ?
                                                    React.createElement('img', {
                                                        src: profilePhoto,
                                                        alt: "Profile",
                                                        className: "w-full h-full object-cover"
                                                    }) :
                                                    (formData.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U')
                                            ),
                                            uploadingPhoto && React.createElement(
                                                'div',
                                                { className: "absolute inset-0 bg-black/50 rounded-full flex items-center justify-center" },
                                                React.createElement('div', { className: "spinner w-6 h-6" })
                                            )
                                        ),
                                        React.createElement(
                                            'div',
                                            { className: "flex-1 w-full relative" },
                                            React.createElement(window.DropZone, {
                                                onDrop: handleProfilePhotoUpload,
                                                accept: "image/*",
                                                multiple: false
                                            }),
                                            React.createElement(
                                                'p',
                                                { className: "text-xs text-gray-400 mt-2 text-center sm:text-left" },
                                                "Upload a square image for best results. Max size 5MB."
                                            )
                                        )
                                    )
                                ),

                                React.createElement(
                                    'form',
                                    {
                                        onSubmit: handleProfileSubmit,
                                        className: "space-y-6"
                                    },
                                    React.createElement(window.FormInput, {
                                        label: "Full Name",
                                        name: "name",
                                        value: formData.name,
                                        onChange: handleChange,
                                        icon: "user"
                                    }),
                                    React.createElement(window.FormInput, {
                                        label: "Company Name",
                                        name: "companyName",
                                        value: formData.companyName,
                                        onChange: handleChange,
                                        icon: "building"
                                    }),
                                    React.createElement(window.FormInput, {
                                        label: "Phone Number",
                                        name: "phone",
                                        type: "tel",
                                        value: formData.phone,
                                        onChange: handleChange,
                                        icon: "phone"
                                    }),
                                    React.createElement(window.FormInput, {
                                        label: "Email Address",
                                        name: "email",
                                        type: "email",
                                        value: formData.email,
                                        disabled: true,
                                        icon: "envelope",
                                        className: "bg-gray-50 cursor-not-allowed"
                                    }),
                                    React.createElement(
                                        'div',
                                        { className: "flex justify-end gap-4 pt-4 border-t border-gray-100" },
                                        React.createElement(
                                            window.Button,
                                            {
                                                type: "submit",
                                                icon: "save",
                                                loading
                                            },
                                            "Save Changes"
                                        )
                                    )
                                )
                            ),

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
                                    {
                                        onSubmit: handlePasswordSubmit,
                                        className: "space-y-6 max-w-md"
                                    },
                                    React.createElement(window.FormInput, {
                                        label: "New Password",
                                        name: "newPassword",
                                        type: "password",
                                        required: true,
                                        icon: "lock",
                                        minLength: 6
                                    }),
                                    React.createElement(window.FormInput, {
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
                                            window.Button,
                                            {
                                                type: "submit",
                                                icon: "key",
                                                loading
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
                                            disabled: loading,
                                            className: "bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                                        },
                                        "Delete Account"
                                    ),
                                    React.createElement(
                                        'p',
                                        { className: "text-xs text-gray-500 mt-2" },
                                        "Note: For security reasons, account deletion requires contacting support. This will sign you out."
                                    )
                                )
                            ),

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
                                                    defaultChecked: userData?.settings?.notifications?.[setting.id] ?? true,
                                                    onChange: (e) => handleNotificationChange(setting.id, e.target.checked)
                                                }),
                                                React.createElement('div', {
                                                    className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"
                                                })
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