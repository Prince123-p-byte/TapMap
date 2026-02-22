// QR Manager Page
const QRManager = () => {
    const [businesses, setBusinesses] = React.useState([]);
    const [selectedBusiness, setSelectedBusiness] = React.useState(null);
    const [qrData, setQrData] = React.useState(null);
    const [qrCodes, setQrCodes] = React.useState([]);
    const [showGenerator, setShowGenerator] = React.useState(false);
    const [qrSettings, setQrSettings] = React.useState({
        size: 300,
        foreground: '#000000',
        background: '#FFFFFF',
        margin: 10,
        format: 'png'
    });

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const biz = DataManager.getBusinesses();
        setBusinesses(biz);
        
        const qrs = biz.map(b => ({
            id: b.id,
            businessId: b.id,
            businessName: b.name,
            logo: b.logo,
            url: `https://adport.com/business/${b.id}`,
            scans: b.qrScans || 0,
            createdAt: b.createdAt,
            qrCode: b.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://adport.com/business/${b.id}`
        }));
        setQrCodes(qrs);
    };

    const generateQR = (business) => {
        setSelectedBusiness(business);
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, `https://adport.com/business/${business.id}`, {
            width: qrSettings.size,
            margin: qrSettings.margin,
            color: {
                dark: qrSettings.foreground,
                light: qrSettings.background
            }
        }, (error) => {
            if (error) {
                Toast.show('Error generating QR code', 'error');
            } else {
                setQrData(canvas.toDataURL(`image/${qrSettings.format}`));
            }
        });
    };

    const downloadQR = () => {
        if (!qrData) return;
        
        const link = document.createElement('a');
        link.download = `${selectedBusiness.name}-qrcode.${qrSettings.format}`;
        link.href = qrData;
        link.click();
        
        DataManager.incrementQRScan(selectedBusiness.id);
        Toast.show('QR Code downloaded');
    };

    const printQR = () => {
        if (!qrData) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>QR Code - ${selectedBusiness.name}</title>
                    <style>
                        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                        img { max-width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    </style>
                </head>
                <body>
                    <img src="${qrData}" />
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const stats = [
        { label: 'Total QR Codes', value: qrCodes.length, icon: 'qrcode', color: 'bg-blue-100 text-blue-600' },
        { label: 'Total Scans', value: qrCodes.reduce((sum, q) => sum + (q.scans || 0), 0).toLocaleString(), icon: 'eye', color: 'bg-green-100 text-green-600' },
        { label: 'Avg Scans/Code', value: (qrCodes.reduce((sum, q) => sum + (q.scans || 0), 0) / (qrCodes.length || 1)).toFixed(0), icon: 'chart-line', color: 'bg-purple-100 text-purple-600' },
        { label: 'Active Codes', value: qrCodes.length, icon: 'check-circle', color: 'bg-amber-100 text-amber-600' }
    ];

    return React.createElement(
        'div',
        { className: "p-8" },
        // Header
        React.createElement(
            'div',
            { className: "flex justify-between items-center mb-8" },
            React.createElement(
                'div',
                null,
                React.createElement(
                    'h1',
                    { className: "text-3xl font-bold gradient-text mb-2" },
                    "QR Code Manager"
                ),
                React.createElement(
                    'p',
                    { className: "text-gray-600" },
                    "Generate and manage QR codes for all your businesses."
                )
            ),
            React.createElement(
                Button,
                { icon: "plus", onClick: () => setShowGenerator(true) },
                "Generate New"
            )
        ),

        // Stats Cards
        React.createElement(
            'div',
            { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" },
            stats.map((stat, i) =>
                React.createElement(
                    ModernCard,
                    { key: i, className: "p-6" },
                    React.createElement(
                        'div',
                        { className: "flex items-center gap-4" },
                        React.createElement(
                            'div',
                            { className: `w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center` },
                            React.createElement(Icon, { name: stat.icon, size: 24 })
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

        // QR Codes Grid
        React.createElement(
            'div',
            { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
            qrCodes.map(qr =>
                React.createElement(
                    ModernCard,
                    {
                        key: qr.id,
                        className: "p-6 hover:transform hover:scale-105 transition-all cursor-pointer",
                        onClick: () => generateQR(businesses.find(b => b.id === qr.businessId))
                    },
                    React.createElement(
                        'div',
                        { className: "flex items-center gap-4 mb-4" },
                        React.createElement(
                            'div',
                            { className: "w-12 h-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold" },
                            qr.logo
                        ),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('h3', { className: "font-bold text-gray-900" }, qr.businessName),
                            React.createElement('p', { className: "text-xs text-gray-500" }, `Created: ${new Date(qr.createdAt).toLocaleDateString()}`)
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: "flex justify-center mb-4" },
                        React.createElement('img', {
                            src: qr.qrCode,
                            alt: `QR for ${qr.businessName}`,
                            className: "w-32 h-32"
                        })
                    ),
                    React.createElement(
                        'div',
                        { className: "flex justify-between items-center text-sm" },
                        React.createElement('span', { className: "text-gray-500" }, `${qr.scans || 0} scans`),
                        React.createElement(
                            'span',
                            { className: "text-indigo-600 font-medium" },
                            "Click to customize"
                        )
                    )
                )
            )
        ),

        // QR Generator Modal
        React.createElement(
            Modal,
            { isOpen: showGenerator || qrData, onClose: () => { setShowGenerator(false); setQrData(null); }, title: "QR Code Generator", size: "md" },
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
                                    const biz = businesses.find(b => b.id === parseInt(e.target.value));
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
                        { className: "grid grid-cols-2 gap-4" },
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, "Size"),
                            React.createElement('input', {
                                type: "range",
                                min: "100",
                                max: "500",
                                value: qrSettings.size,
                                onChange: (e) => setQrSettings({ ...qrSettings, size: parseInt(e.target.value) }),
                                className: "w-full"
                            })
                        ),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, "Margin"),
                            React.createElement('input', {
                                type: "range",
                                min: "0",
                                max: "50",
                                value: qrSettings.margin,
                                onChange: (e) => setQrSettings({ ...qrSettings, margin: parseInt(e.target.value) }),
                                className: "w-full"
                            })
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: "grid grid-cols-2 gap-4" },
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, "Foreground Color"),
                            React.createElement('input', {
                                type: "color",
                                value: qrSettings.foreground,
                                onChange: (e) => setQrSettings({ ...qrSettings, foreground: e.target.value }),
                                className: "w-full h-10 rounded-lg"
                            })
                        ),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, "Background Color"),
                            React.createElement('input', {
                                type: "color",
                                value: qrSettings.background,
                                onChange: (e) => setQrSettings({ ...qrSettings, background: e.target.value }),
                                className: "w-full h-10 rounded-lg"
                            })
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: "flex justify-end gap-4" },
                        React.createElement(
                            Button,
                            {
                                variant: "secondary",
                                onClick: () => setShowGenerator(false)
                            },
                            "Cancel"
                        ),
                        React.createElement(
                            Button,
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
                            { className: "qr-container mb-4" },
                            React.createElement('img', {
                                src: qrData,
                                alt: "Generated QR Code",
                                className: "w-64 h-64 mx-auto"
                            })
                        ),
                        React.createElement(
                            'p',
                            { className: "text-sm text-gray-500 mb-4" },
                            `QR Code for ${selectedBusiness?.name}`
                        ),
                        React.createElement(
                            'div',
                            { className: "qr-actions" },
                            React.createElement(
                                Button,
                                { icon: "download", onClick: downloadQR },
                                "Download"
                            ),
                            React.createElement(
                                Button,
                                { variant: "secondary", icon: "print", onClick: printQR },
                                "Print"
                            ),
                            React.createElement(
                                Button,
                                { variant: "secondary", icon: "share", onClick: () => {
                                    navigator.clipboard?.writeText(qrData);
                                    Toast.show('QR code copied to clipboard');
                                } },
                                "Copy"
                            )
                        )
                    )
                )
            )
        )
    );
};