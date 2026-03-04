// js/QRManager.js
(function() {
    const QRManager = () => {
        const [businesses, setBusinesses] = React.useState([]);
        const [selectedBusiness, setSelectedBusiness] = React.useState(null);
        const [qrData, setQrData] = React.useState(null);
        const [qrCodes, setQrCodes] = React.useState([]);
        const [showGenerator, setShowGenerator] = React.useState(false);
        const [loading, setLoading] = React.useState(true);
        const [qrSettings, setQrSettings] = React.useState({
            size: 300,
            foreground: '#000000',
            background: '#FFFFFF',
            margin: 10,
            format: 'png'
        });

        const BASE_URL = 'https://prince123-p-byte.github.io/TapMap';

        React.useEffect(() => {
            loadData();
        }, []);

        const loadData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) {
                    setBusinesses([]);
                    setQrCodes([]);
                    setLoading(false);
                    return;
                }

                const { data: bizData, error } = await window.supabase
                    .from('businesses')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setBusinesses(bizData || []);

                const qrs = (bizData || []).map(b => ({
                    id: b.id,
                    businessId: b.id,
                    businessName: b.name,
                    logo: b.logo,
                    url: `${BASE_URL}/?business=${b.id}`,
                    scans: b.qr_scans || 0,
                    createdAt: b.created_at,
                    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${BASE_URL}/?business=${b.id}`)}`
                }));

                setQrCodes(qrs);
            } catch (error) {
                console.error('Error loading data:', error);
                window.Toast.show('Error loading businesses', 'error');
            } finally {
                setLoading(false);
            }
        };

        const generateQR = (business) => {
            if (!business) {
                window.Toast.show('Please select a business', 'error');
                return;
            }

            setSelectedBusiness(business);
            
            const businessUrl = `${BASE_URL}/?business=${business.id}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSettings.size}x${qrSettings.size}&data=${encodeURIComponent(businessUrl)}&color=${qrSettings.foreground.substring(1)}&bgcolor=${qrSettings.background.substring(1)}&margin=${qrSettings.margin}&format=${qrSettings.format}`;
            
            setQrData(qrImageUrl);
            setShowGenerator(true);
        };

        const downloadQR = async () => {
            if (!qrData || !selectedBusiness) return;

            try {
                const response = await fetch(qrData);
                const blob = await response.blob();
                
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${selectedBusiness.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-qrcode.${qrSettings.format}`;
                link.click();
                
                window.URL.revokeObjectURL(url);

                await window.supabase
                    .rpc('increment_analytics', {
                        p_business_id: selectedBusiness.id,
                        p_field: 'qr_scans'
                    });

                setQrCodes(prev => prev.map(q => 
                    q.id === selectedBusiness.id 
                        ? { ...q, scans: (q.scans || 0) + 1 }
                        : q
                ));

                window.Toast.show('QR Code downloaded', 'success');
                
            } catch (error) {
                console.error('Error downloading QR:', error);
                window.Toast.show('Error downloading QR code', 'error');
            }
        };

        const printQR = () => {
            if (!qrData || !selectedBusiness) return;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>QR Code - ${selectedBusiness.name}</title>
                        <style>
                            body { 
                                display: flex; 
                                justify-content: center; 
                                align-items: center; 
                                height: 100vh; 
                                margin: 0; 
                                font-family: Arial, sans-serif;
                            }
                            .container { 
                                text-align: center; 
                                padding: 20px;
                            }
                            img { 
                                max-width: 90%; 
                                max-height: 80vh;
                                box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                                border-radius: 10px;
                            }
                            .business-name { 
                                margin-top: 20px; 
                                font-size: 18px; 
                                color: #333;
                            }
                            .url { 
                                margin-top: 10px; 
                                font-size: 12px; 
                                color: #666;
                                word-break: break-all;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <img src="${qrData}" alt="QR Code for ${selectedBusiness.name}" />
                            <div class="business-name">${selectedBusiness.name}</div>
                            <div class="url">${BASE_URL}/?business=${selectedBusiness.id}</div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };

        const copyQRToClipboard = async () => {
            if (!qrData || !selectedBusiness) return;

            try {
                const response = await fetch(qrData);
                const blob = await response.blob();
                
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
                
                window.Toast.show('QR code copied to clipboard', 'success');
            } catch (error) {
                console.error('Error copying QR:', error);
                navigator.clipboard.writeText(qrData);
                window.Toast.show('QR code URL copied to clipboard', 'success');
            }
        };

        const shareQR = async () => {
            if (!qrData || !selectedBusiness) return;

            const shareData = {
                title: `${selectedBusiness.name} QR Code`,
                text: `Scan this QR code to view ${selectedBusiness.name} on tapMap`,
                url: `${BASE_URL}/?business=${selectedBusiness.id}`
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        copyQRToClipboard();
                    }
                }
            } else {
                copyQRToClipboard();
            }
        };

        const stats = [
            { label: 'Total QR Codes', value: qrCodes.length, icon: 'qrcode', color: 'bg-blue-100 text-blue-600' },
            { label: 'Total Scans', value: qrCodes.reduce((sum, q) => sum + (q.scans || 0), 0).toLocaleString(), icon: 'eye', color: 'bg-green-100 text-green-600' },
            { label: 'Avg Scans/Code', value: (qrCodes.reduce((sum, q) => sum + (q.scans || 0), 0) / (qrCodes.length || 1)).toFixed(0), icon: 'chart-line', color: 'bg-purple-100 text-purple-600' },
            { label: 'Active Codes', value: qrCodes.length, icon: 'check-circle', color: 'bg-amber-100 text-amber-600' }
        ];

        if (loading) {
            return React.createElement(
                'div',
                { className: "p-8 text-center" },
                React.createElement(window.LoadingSpinner, null)
            );
        }

        return React.createElement(
            'div',
            { className: "p-4 md:p-8 max-w-7xl mx-auto" },
            
            React.createElement(
                'div',
                { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" },
                React.createElement(
                    'div',
                    null,
                    React.createElement('h1', { className: "text-3xl font-bold gradient-text mb-2" }, "QR Code Manager"),
                    React.createElement('p', { className: "text-gray-600" }, "Generate and manage QR codes for all your businesses.")
                ),
                businesses.length > 0 && React.createElement(
                    window.Button,
                    { 
                        icon: "plus", 
                        onClick: () => {
                            setSelectedBusiness(null);
                            setQrData(null);
                            setShowGenerator(true);
                        } 
                    },
                    "Generate New"
                )
            ),

            businesses.length === 0 ? React.createElement(
                'div',
                { className: "bg-gray-50 rounded-2xl p-12 text-center text-gray-500 mb-8" },
                React.createElement(window.Icon, { name: "qrcode", size: 48, className: "mx-auto mb-4 opacity-50" }),
                React.createElement('h3', { className: "text-xl font-bold mb-2" }, "No businesses yet"),
                React.createElement('p', { className: "text-sm mb-6" }, "Create a business to generate QR codes"),
                React.createElement(
                    window.Button,
                    { 
                        icon: "plus", 
                        onClick: () => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'sub-businesses' } }))
                    },
                    "Create Business"
                )
            ) : React.createElement(
                React.Fragment,
                null,
                React.createElement(
                    'div',
                    { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8" },
                    stats.map((stat, i) =>
                        React.createElement(
                            'div',
                            { key: i, className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow" },
                            React.createElement(
                                'div',
                                { className: "flex items-center gap-4" },
                                React.createElement(
                                    'div',
                                    { className: `w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center` },
                                    React.createElement(window.Icon, { name: stat.icon, size: 24 })
                                ),
                                React.createElement(
                                    'div',
                                    null,
                                    React.createElement('div', { className: "text-2xl font-bold" }, stat.value),
                                    React.createElement('div', { className: "text-sm text-gray-500" }, stat.label)
                                )
                            )
                        )
                    )
                ),

                qrCodes.length === 0 ? React.createElement(
                    'div',
                    { className: "text-center py-16 bg-white rounded-2xl border border-gray-100" },
                    React.createElement(window.Icon, { name: "qrcode", size: 48, className: "mx-auto mb-4 opacity-30" }),
                    React.createElement('h3', { className: "text-xl font-bold mb-2" }, "No QR codes generated"),
                    React.createElement('p', { className: "text-gray-500 mb-6" }, "Generate your first QR code for a business"),
                    React.createElement(
                        window.Button,
                        { 
                            icon: "plus", 
                            onClick: () => {
                                setSelectedBusiness(null);
                                setQrData(null);
                                setShowGenerator(true);
                            } 
                        },
                        "Generate QR Code"
                    )
                ) : React.createElement(
                    'div',
                    { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
                    qrCodes.map(qr =>
                        React.createElement(
                            'div',
                            {
                                key: qr.id,
                                className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group",
                                onClick: () => generateQR(businesses.find(b => b.id === qr.businessId))
                            },
                            React.createElement(
                                'div',
                                { className: "flex items-center gap-4 mb-4" },
                                React.createElement(
                                    'div',
                                    { className: "w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold overflow-hidden" },
                                    qr.logo ? 
                                        React.createElement('img', { 
                                            src: qr.logo, 
                                            alt: qr.businessName,
                                            className: "w-full h-full object-cover"
                                        }) :
                                        (qr.businessName?.charAt(0).toUpperCase() || 'B')
                                ),
                                React.createElement(
                                    'div',
                                    { className: "flex-1 min-w-0" },
                                    React.createElement(
                                        'h3',
                                        { className: "font-bold text-gray-900 truncate" },
                                        qr.businessName
                                    ),
                                    React.createElement(
                                        'p',
                                        { className: "text-xs text-gray-500" },
                                        `Created: ${new Date(qr.createdAt).toLocaleDateString()}`
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: "flex justify-center mb-4" },
                                React.createElement('img', {
                                    src: qr.qrCode,
                                    alt: `QR for ${qr.businessName}`,
                                    className: "w-32 h-32 rounded-lg shadow-sm group-hover:scale-105 transition-transform",
                                    onError: (e) => { 
                                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr.url)}`; 
                                    }
                                })
                            ),
                            React.createElement(
                                'div',
                                { className: "flex justify-between items-center text-sm" },
                                React.createElement(
                                    'span',
                                    { className: "text-gray-500 flex items-center gap-1" },
                                    React.createElement(window.Icon, { name: "eye", size: 14 }),
                                    (qr.scans || 0).toLocaleString(),
                                    " scan", qr.scans !== 1 ? 's' : ''
                                ),
                                React.createElement(
                                    'span',
                                    { className: "text-indigo-600 font-medium flex items-center gap-1" },
                                    "Customize",
                                    React.createElement(window.Icon, { name: "chevron-right", size: 14 })
                                )
                            )
                        )
                    )
                )
            ),

            React.createElement(
                window.Modal,
                { 
                    isOpen: showGenerator, 
                    onClose: () => { 
                        setShowGenerator(false); 
                        setSelectedBusiness(null);
                        setQrData(null);
                    }, 
                    title: qrData ? "Your QR Code" : "QR Code Generator", 
                    size: "md" 
                },
                React.createElement(
                    'div',
                    { className: "space-y-6" },
                    !qrData ? React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, "Select Business"),
                            React.createElement(
                                'select',
                                {
                                    value: selectedBusiness?.id || '',
                                    onChange: (e) => {
                                        const biz = businesses.find(b => b.id === e.target.value);
                                        setSelectedBusiness(biz);
                                    },
                                    className: "form-input"
                                },
                                React.createElement('option', { value: "" }, "Choose a business"),
                                businesses.map(biz =>
                                    React.createElement('option', { key: biz.id, value: biz.id }, biz.name)
                                )
                            )
                        ),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, `Size: ${qrSettings.size}px`),
                            React.createElement('input', {
                                type: "range",
                                min: "100",
                                max: "500",
                                step: "10",
                                value: qrSettings.size,
                                onChange: (e) => setQrSettings({ ...qrSettings, size: parseInt(e.target.value) }),
                                className: "w-full"
                            })
                        ),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, `Margin: ${qrSettings.margin}`),
                            React.createElement('input', {
                                type: "range",
                                min: "0",
                                max: "50",
                                value: qrSettings.margin,
                                onChange: (e) => setQrSettings({ ...qrSettings, margin: parseInt(e.target.value) }),
                                className: "w-full"
                            })
                        ),
                        React.createElement(
                            'div',
                            { className: "grid grid-cols-2 gap-4" },
                            React.createElement(
                                'div',
                                null,
                                React.createElement('label', { className: "form-label" }, "Foreground"),
                                React.createElement('input', {
                                    type: "color",
                                    value: qrSettings.foreground,
                                    onChange: (e) => setQrSettings({ ...qrSettings, foreground: e.target.value }),
                                    className: "w-full h-10 rounded-lg cursor-pointer"
                                })
                            ),
                            React.createElement(
                                'div',
                                null,
                                React.createElement('label', { className: "form-label" }, "Background"),
                                React.createElement('input', {
                                    type: "color",
                                    value: qrSettings.background,
                                    onChange: (e) => setQrSettings({ ...qrSettings, background: e.target.value }),
                                    className: "w-full h-10 rounded-lg cursor-pointer"
                                })
                            )
                        ),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, "Format"),
                            React.createElement(
                                'select',
                                {
                                    value: qrSettings.format,
                                    onChange: (e) => setQrSettings({ ...qrSettings, format: e.target.value }),
                                    className: "form-input"
                                },
                                React.createElement('option', { value: "png" }, "PNG"),
                                React.createElement('option', { value: "jpg" }, "JPEG"),
                                React.createElement('option', { value: "gif" }, "GIF"),
                                React.createElement('option', { value: "svg" }, "SVG")
                            )
                        ),
                        React.createElement(
                            'div',
                            { className: "flex justify-end gap-4 pt-4" },
                            React.createElement(
                                window.Button,
                                {
                                    variant: "secondary",
                                    onClick: () => setShowGenerator(false)
                                },
                                "Cancel"
                            ),
                            React.createElement(
                                window.Button,
                                {
                                    icon: "qrcode",
                                    onClick: () => generateQR(selectedBusiness),
                                    disabled: !selectedBusiness
                                },
                                "Generate QR Code"
                            )
                        )
                    ) : React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(
                            'div',
                            { className: "text-center" },
                            React.createElement(
                                'div',
                                { className: "qr-container mb-4 inline-block p-4 bg-white rounded-2xl shadow-lg" },
                                React.createElement('img', {
                                    src: qrData,
                                    alt: "Generated QR Code",
                                    className: "w-48 h-48 md:w-64 md:h-64 mx-auto",
                                    onError: (e) => { 
                                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${BASE_URL}/?business=${selectedBusiness?.id}`)}`; 
                                    }
                                })
                            ),
                            React.createElement(
                                'p',
                                { className: "text-sm font-medium text-gray-900 mb-1" },
                                selectedBusiness?.name
                            ),
                            React.createElement(
                                'p',
                                { className: "text-xs text-gray-500 mb-4 break-all" },
                                `${BASE_URL}/?business=${selectedBusiness?.id}`
                            )
                        ),
                        React.createElement(
                            'div',
                            { className: "flex flex-wrap justify-center gap-3 pt-4" },
                            React.createElement(
                                window.Button,
                                { 
                                    icon: "download", 
                                    onClick: downloadQR 
                                },
                                "Download"
                            ),
                            React.createElement(
                                window.Button,
                                { 
                                    variant: "secondary", 
                                    icon: "printer", 
                                    onClick: printQR 
                                },
                                "Print"
                            ),
                            React.createElement(
                                window.Button,
                                { 
                                    variant: "secondary", 
                                    icon: "copy", 
                                    onClick: copyQRToClipboard 
                                },
                                "Copy"
                            ),
                            React.createElement(
                                window.Button,
                                { 
                                    variant: "secondary", 
                                    icon: "share-2", 
                                    onClick: shareQR 
                                },
                                "Share"
                            )
                        ),
                        React.createElement(
                            'div',
                            { className: "text-center mt-4" },
                            React.createElement(
                                'button',
                                {
                                    onClick: () => {
                                        setQrData(null);
                                    },
                                    className: "text-indigo-600 text-sm hover:underline flex items-center gap-1 mx-auto"
                                },
                                React.createElement(window.Icon, { name: "refresh-cw", size: 14 }),
                                "Regenerate with different settings"
                            )
                        )
                    )
                )
            )
        );
    };

    window.QRManager = QRManager;
})();