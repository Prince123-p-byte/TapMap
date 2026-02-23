(function() {
    const MediaLibrary = () => {
        const [media, setMedia] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [uploading, setUploading] = React.useState(false);

        React.useEffect(() => {
            loadMedia();
        }, []);

        const loadMedia = async () => {
            try {
                const snapshot = await db.collection('media')
                    .orderBy('uploadedAt', 'desc')
                    .get();
                
                const mediaData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMedia(mediaData);
            } catch (error) {
                console.error('Error loading media:', error);
            } finally {
                setLoading(false);
            }
        };

        const handleUpload = async (files) => {
            setUploading(true);
            try {
                for (const file of files) {
                    if (file.type.startsWith('image/')) {
                        // Upload to Firebase Storage
                        const storageRef = storage.ref();
                        const fileName = `media/${Date.now()}_${file.name}`;
                        const imageRef = storageRef.child(fileName);
                        
                        await imageRef.put(file);
                        const downloadURL = await imageRef.getDownloadURL();
                        
                        // Save to Firestore
                        await db.collection('media').add({
                            name: file.name,
                            url: downloadURL,
                            type: file.type,
                            size: file.size,
                            uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            userId: auth.currentUser?.uid
                        });
                    }
                }
                Toast.show('Files uploaded successfully');
                loadMedia();
            } catch (error) {
                console.error('Error uploading:', error);
                Toast.show('Error uploading files', 'error');
            } finally {
                setUploading(false);
            }
        };

        return React.createElement(
            'div',
            { className: "p-8" },
            React.createElement(
                'div',
                { className: "flex justify-between items-center mb-8" },
                React.createElement(
                    'div',
                    null,
                    React.createElement('h1', { className: "text-3xl font-bold gradient-text mb-2" }, "Media Library"),
                    React.createElement('p', { className: "text-gray-600" }, "Manage your uploaded images and files")
                ),
                React.createElement(DropZone, { onDrop: handleUpload })
            ),
            loading ? React.createElement(LoadingSpinner) :
            media.length === 0 ? React.createElement(
                'div',
                { className: "text-center py-16 bg-white rounded-2xl" },
                React.createElement(Icon, { name: "images", size: 64, className: "text-gray-300 mx-auto mb-4" }),
                React.createElement('h3', { className: "text-xl font-bold mb-2" }, "No media yet"),
                React.createElement('p', { className: "text-gray-500" }, "Upload images to get started")
            ) :
            React.createElement(
                'div',
                { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" },
                media.map(item =>
                    React.createElement(
                        'div',
                        { key: item.id, className: "aspect-square rounded-xl overflow-hidden cursor-pointer group relative" },
                        React.createElement('img', {
                            src: item.url,
                            alt: item.name,
                            className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        }),
                        React.createElement(
                            'div',
                            { className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" },
                            React.createElement(
                                'a',
                                {
                                    href: item.url,
                                    target: "_blank",
                                    className: "bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100"
                                },
                                React.createElement(Icon, { name: "eye", size: 16 })
                            )
                        )
                    )
                )
            )
        );
    };

    window.MediaLibrary = MediaLibrary;
})();