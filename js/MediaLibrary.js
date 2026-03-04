// js/MediaLibrary.js
(function() {
    const MediaLibrary = () => {
        const [media, setMedia] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [uploading, setUploading] = React.useState(false);
        const [deleting, setDeleting] = React.useState(null);

        React.useEffect(() => {
            loadMedia();
        }, []);

        const loadMedia = async () => {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) {
                    setMedia([]);
                    setLoading(false);
                    return;
                }

                const { data: mediaData, error } = await window.supabase
                    .from('media')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('uploaded_at', { ascending: false });

                if (error) throw error;

                const mediaWithUrls = await Promise.all((mediaData || []).map(async (item) => {
                    const { data: urlData } = window.supabase.storage
                        .from('business-images')
                        .getPublicUrl(item.storage_path);
                    
                    return {
                        ...item,
                        url: urlData.publicUrl,
                        formattedSize: formatFileSize(item.size)
                    };
                }));

                setMedia(mediaWithUrls);
            } catch (error) {
                console.error('Error loading media:', error);
                window.Toast.show('Error loading media', 'error');
            } finally {
                setLoading(false);
            }
        };

        const formatFileSize = (bytes) => {
            if (!bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const handleUpload = async (files) => {
            if (!files || files.length === 0) return;

            setUploading(true);
            let successCount = 0;
            let errorCount = 0;

            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) {
                    window.Toast.show('Please sign in to upload files', 'error');
                    return;
                }

                for (const file of files) {
                    try {
                        if (!file.type.startsWith('image/')) {
                            window.Toast.show(`${file.name} is not an image`, 'warning');
                            errorCount++;
                            continue;
                        }

                        if (file.size > 10 * 1024 * 1024) {
                            window.Toast.show(`${file.name} is too large (max 10MB)`, 'warning');
                            errorCount++;
                            continue;
                        }

                        const timestamp = Date.now();
                        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                        const storagePath = `media/${user.id}/${timestamp}_${safeFileName}`;

                        const { error: uploadError } = await window.supabase.storage
                            .from('business-images')
                            .upload(storagePath, file, {
                                cacheControl: '3600',
                                upsert: false
                            });

                        if (uploadError) throw uploadError;

                        const { data: urlData } = window.supabase.storage
                            .from('business-images')
                            .getPublicUrl(storagePath);

                        const { error: dbError } = await window.supabase
                            .from('media')
                            .insert([{
                                user_id: user.id,
                                name: file.name,
                                storage_path: storagePath,
                                type: file.type,
                                size: file.size,
                                uploaded_at: new Date().toISOString()
                            }]);

                        if (dbError) throw dbError;

                        successCount++;
                    } catch (error) {
                        console.error('Error uploading file:', error);
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    window.Toast.show(`${successCount} file(s) uploaded successfully`, 'success');
                }
                if (errorCount > 0) {
                    window.Toast.show(`${errorCount} file(s) failed to upload`, 'error');
                }

                await loadMedia();

            } catch (error) {
                console.error('Error in upload process:', error);
                window.Toast.show('Error uploading files', 'error');
            } finally {
                setUploading(false);
            }
        };

        const handleDelete = async (mediaItem) => {
            if (!confirm(`Delete "${mediaItem.name}"? This action cannot be undone.`)) {
                return;
            }

            setDeleting(mediaItem.id);

            try {
                const { error: storageError } = await window.supabase.storage
                    .from('business-images')
                    .remove([mediaItem.storage_path]);

                if (storageError) throw storageError;

                const { error: dbError } = await window.supabase
                    .from('media')
                    .delete()
                    .eq('id', mediaItem.id);

                if (dbError) throw dbError;

                window.Toast.show('File deleted successfully', 'success');
                setMedia(prev => prev.filter(item => item.id !== mediaItem.id));

            } catch (error) {
                console.error('Error deleting file:', error);
                window.Toast.show('Error deleting file', 'error');
            } finally {
                setDeleting(null);
            }
        };

        const handleCopyUrl = (url) => {
            navigator.clipboard.writeText(url);
            window.Toast.show('URL copied to clipboard', 'success');
        };

        return React.createElement(
            'div',
            { className: "p-4 md:p-8 max-w-7xl mx-auto" },
            
            React.createElement(
                'div',
                { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" },
                React.createElement(
                    'div',
                    null,
                    React.createElement('h1', { className: "text-3xl font-bold gradient-text mb-2" }, "Media Library"),
                    React.createElement('p', { className: "text-gray-600" }, "Manage your uploaded images and files")
                ),
                React.createElement(
                    'div',
                    { className: "w-full md:w-auto" },
                    React.createElement(window.DropZone, { 
                        onDrop: handleUpload,
                        accept: "image/*",
                        multiple: true
                    })
                )
            ),

            uploading && React.createElement(
                'div',
                { className: "mb-6 p-4 bg-blue-50 text-blue-600 rounded-xl flex items-center gap-3" },
                React.createElement(window.Icon, { name: "spinner", className: "animate-spin", size: 20 }),
                React.createElement('span', null, "Uploading files...")
            ),

            loading ? 
                React.createElement(window.LoadingSpinner, { fullPage: true }) :
                media.length === 0 ? 
                    React.createElement(
                        'div',
                        { className: "text-center py-16 bg-white rounded-2xl border border-gray-100" },
                        React.createElement(window.Icon, { name: "images", size: 64, className: "text-gray-300 mx-auto mb-4" }),
                        React.createElement('h3', { className: "text-xl font-bold mb-2" }, "No media yet"),
                        React.createElement('p', { className: "text-gray-500 mb-6" }, "Upload images to get started"),
                        React.createElement(
                            'label',
                            { 
                                className: "inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all cursor-pointer",
                                onClick: () => document.querySelector('input[type="file"]')?.click()
                            },
                            React.createElement(window.Icon, { name: "upload", size: 18 }),
                            "Upload First Image"
                        )
                    ) :
                    React.createElement(
                        'div',
                        { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" },
                        media.map(item =>
                            React.createElement(
                                'div',
                                { 
                                    key: item.id, 
                                    className: "group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:shadow-lg transition-all"
                                },
                                React.createElement('img', {
                                    src: item.url,
                                    alt: item.name,
                                    className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500",
                                    onError: (e) => { 
                                        e.target.src = 'https://via.placeholder.com/400x400?text=Error'; 
                                    }
                                }),
                                React.createElement(
                                    'div',
                                    { className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4" },
                                    React.createElement(
                                        'p',
                                        { className: "text-white text-sm font-medium text-center mb-2 truncate w-full" },
                                        item.name
                                    ),
                                    React.createElement(
                                        'p',
                                        { className: "text-white/70 text-xs mb-3" },
                                        item.formattedSize
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: "flex gap-2" },
                                        React.createElement(
                                            'a',
                                            {
                                                href: item.url,
                                                target: "_blank",
                                                rel: "noopener noreferrer",
                                                className: "bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors",
                                                title: "View full size"
                                            },
                                            React.createElement(window.Icon, { name: "eye", size: 16 })
                                        ),
                                        React.createElement(
                                            'button',
                                            {
                                                onClick: () => handleCopyUrl(item.url),
                                                className: "bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors",
                                                title: "Copy URL"
                                            },
                                            React.createElement(window.Icon, { name: "link", size: 16 })
                                        ),
                                        React.createElement(
                                            'button',
                                            {
                                                onClick: () => handleDelete(item),
                                                disabled: deleting === item.id,
                                                className: `bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors ${deleting === item.id ? 'opacity-50 cursor-not-allowed' : ''}`,
                                                title: "Delete"
                                            },
                                            deleting === item.id ?
                                                React.createElement(window.Icon, { name: "spinner", className: "animate-spin", size: 16 }) :
                                                React.createElement(window.Icon, { name: "trash-2", size: 16 })
                                        )
                                    )
                                )
                            )
                        )
                    )
        );
    };

    window.MediaLibrary = MediaLibrary;
})();