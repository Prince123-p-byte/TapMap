(function() {
    const Settings = ({ user, userData, onUpdateProfile, onLogout }) => {
        const [activeTab, setActiveTab] = React.useState('profile');
        const [loading, setLoading] = React.useState(false);
        const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
        const [profilePhoto, setProfilePhoto] = React.useState(user?.photoURL || userData?.photoURL || null);
        const [formData, setFormData] = React.useState({
            name: userData?.name || '',
            companyName: userData?.companyName || '',
            phone: userData?.phone || '',
            email: user?.email || ''
        });

        // Handle form input changes
        const handleChange = (e) => {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
        };

        // Updated profile photo upload function - works like business logo
        const handleProfilePhotoUpload = (files) => {
            if (files.length === 0) return;
            
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                Toast.show('Please select an image file', 'error');
                return;
            }

            setUploadingPhoto(true);
            
            // Show preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                // Set the local preview first
                setProfilePhoto(e.target.result);
                
                // Try to upload to Firebase Storage, but don't fail if it doesn't work
                try {
                    const storageRef = storage.ref();
                    // Sanitize filename
                    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                    const fileName = `profiles/${user.uid}_${Date.now()}_${safeFileName}`;
                    const imageRef = storageRef.child(fileName);
                    
                    // Upload with metadata
                    const metadata = {
                        contentType: file.type,
                        customMetadata: {
                            'uploadedBy': user.uid,
                            'uploadedAt': new Date().toISOString()
                        }
                    };
                    
                    imageRef.put(file, metadata).then(() => {
                        return imageRef.getDownloadURL();
                    }).then(async (downloadURL) => {
                        // Update with the actual Firebase Storage URL
                        setProfilePhoto(downloadURL);
                        
                        // Update user profile in Firebase Auth
                        await user.updateProfile({
                            photoURL: downloadURL
                        });

                        // Update user data in Firestore
                        await db.collection('users').doc(user.uid).update({
                            photoURL: downloadURL,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        console.log('Profile photo uploaded to Firebase:', downloadURL);
                        Toast.show('Profile photo uploaded successfully', 'success');
                    }).catch(err => {
                        // If Firebase upload fails, keep the local preview
                        console.log('Firebase upload failed, using local preview only:', err);
                        Toast.show('Profile photo saved locally', 'success');
                    });
                } catch (err) {
                    console.log('Firebase upload error:', err);
                    Toast.show('Profile photo saved locally', 'success');
                } finally {
                    setUploadingPhoto(false);
                }
            };
            reader.readAsDataURL(file);
        };

        // Handle profile update
        const handleProfileSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            
            try {
                await onUpdateProfile({
                    name: formData.name,
                    companyName: formData.companyName,
                    phone: formData.phone
                });
                Toast.show('Profile updated successfully', 'success');
            } catch (error) {
                console.error('Error updating profile:', error);
                Toast.show(error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        // Handle password change
        const handlePasswordSubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');

            if (newPassword !== confirmPassword) {
                Toast.show('New passwords do not match', 'error');
                return;
            }

            setLoading(true);
            try {
                const credential = firebase.auth.EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );
                await user.reauthenticateWithCredential(credential);
                await user.updatePassword(newPassword);
                Toast.show('Password updated successfully', 'success');
                e.target.reset();
            } catch (error) {
                console.error('Error updating password:', error);
                Toast.show(error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        // Handle notification settings update
        const handleNotificationChange = async (settingId, checked) => {
            try {
                const newSettings = {
                    ...userData?.settings,
                    notifications: {
                        ...userData?.settings?.notifications,
                        [settingId]: checked
                    }
                };
                await db.collection('users').doc(user.uid).update({
                    settings: newSettings
                });
                Toast.show('Settings updated', 'success');
            } catch (error) {
                console.error('Error updating settings:', error);
                Toast.show('Error updating settings', 'error');
            }
        };

        // Handle account deletion
        const handleDeleteAccount = async () => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                try {
                    await db.collection('users').doc(user.uid).delete();
                    await user.delete();
                    onLogout();
                    Toast.show('Account deleted', 'warning');
                } catch (error) {
                    console.error('Error deleting account:', error);
                    Toast.show(error.message, 'error');
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
                            'div',
                            { className: "bg-white rounded-2xl p-8 shadow-sm border border-gray-100" },
                            
                            // Profile Settings
                            activeTab === 'profile' && React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'h2',
                                    { className: "text-xl font-bold mb-6" },
                                    "Profile Information"
                                ),
                                
                                // Profile Photo Upload - Fixed version
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
                                            React.createElement(DropZone, {
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
                                    React.createElement(FormInput, {
                                        label: "Full Name",
                                        name: "name",
                                        value: formData.name,
                                        onChange: handleChange,
                                        icon: "user"
                                    }),
                                    React.createElement(FormInput, {
                                        label: "Company Name",
                                        name: "companyName",
                                        value: formData.companyName,
                                        onChange: handleChange,
                                        icon: "building"
                                    }),
                                    React.createElement(FormInput, {
                                        label: "Phone Number",
                                        name: "phone",
                                        type: "tel",
                                        value: formData.phone,
                                        onChange: handleChange,
                                        icon: "phone"
                                    }),
                                    React.createElement(FormInput, {
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
                                            Button,
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
                                    {
                                        onSubmit: handlePasswordSubmit,
                                        className: "space-y-6 max-w-md"
                                    },
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