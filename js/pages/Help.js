(function() {
    const Help = () => {
        const [searchTerm, setSearchTerm] = React.useState('');
        const [activeCategory, setActiveCategory] = React.useState('all');
        const [showContactModal, setShowContactModal] = React.useState(false);
        const [contactForm, setContactForm] = React.useState({
            subject: '',
            message: '',
            priority: 'normal'
        });

        const categories = [
            { id: 'all', label: 'All Help', icon: 'compass' },
            { id: 'getting-started', label: 'Getting Started', icon: 'rocket' },
            { id: 'businesses', label: 'Managing Businesses', icon: 'building' },
            { id: 'qr-codes', label: 'QR Codes', icon: 'qrcode' },
            { id: 'analytics', label: 'Analytics', icon: 'chart-line' },
            { id: 'billing', label: 'Billing', icon: 'credit-card' },
            { id: 'account', label: 'Account', icon: 'user' }
        ];

        const articles = [
            {
                id: 1,
                title: 'Getting Started with tapMap',
                description: 'Learn the basics of setting up your first business on tapMap',
                category: 'getting-started',
                views: 1234,
                helpful: 95
            },
            {
                id: 2,
                title: 'How to Create a New Business Profile',
                description: 'Step-by-step guide to adding and configuring your business',
                category: 'businesses',
                views: 892,
                helpful: 88
            },
            {
                id: 3,
                title: 'Generating and Managing QR Codes',
                description: 'Everything you need to know about QR codes for your businesses',
                category: 'qr-codes',
                views: 2156,
                helpful: 97
            },
            {
                id: 4,
                title: 'Understanding Your Analytics Dashboard',
                description: 'Make data-driven decisions with our analytics tools',
                category: 'analytics',
                views: 567,
                helpful: 91
            },
            {
                id: 5,
                title: 'Subscription Plans and Billing',
                description: 'Information about pricing, plans, and payment methods',
                category: 'billing',
                views: 789,
                helpful: 86
            },
            {
                id: 6,
                title: 'Managing Your Account Settings',
                description: 'Update your profile, security, and notification preferences',
                category: 'account',
                views: 445,
                helpful: 93
            }
        ];

        const filteredArticles = articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 article.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
            return matchesSearch && matchesCategory;
        });

        const faqs = [
            {
                question: 'How do I add multiple businesses?',
                answer: 'You can add multiple businesses from your Dashboard. Click on "Add Business" and fill in the details for each business.'
            },
            {
                question: 'Can I customize QR codes?',
                answer: 'Yes! You can customize QR code colors, size, and even add your logo using the QR Manager.'
            },
            {
                question: 'How is billing handled?',
                answer: 'Billing is handled monthly. You can upgrade, downgrade, or cancel your plan at any time from the Settings page.'
            },
            {
                question: 'Is my data secure?',
                answer: 'Absolutely! We use industry-standard encryption and security practices to protect your data.'
            }
        ];

        const handleContactSubmit = (e) => {
            e.preventDefault();
            Toast.show('Message sent! Support will respond within 24 hours.', 'success');
            setShowContactModal(false);
            setContactForm({ subject: '', message: '', priority: 'normal' });
        };

        return React.createElement(
            'div',
            { className: "pt-20 pb-12 min-h-screen bg-gray-50" },
            React.createElement(
                'div',
                { className: "max-w-7xl mx-auto px-4" },
                
                // Header
                React.createElement(
                    'div',
                    { className: "text-center mb-12" },
                    React.createElement(
                        'h1',
                        { className: "text-4xl font-bold gradient-text mb-4" },
                        "How can we help you?"
                    ),
                    React.createElement(
                        'p',
                        { className: "text-gray-600 text-lg mb-8 max-w-2xl mx-auto" },
                        "Find answers to common questions or get in touch with our support team"
                    ),
                    
                    // Search
                    React.createElement(
                        'div',
                        { className: "max-w-2xl mx-auto" },
                        React.createElement(SearchBar, {
                            value: searchTerm,
                            onChange: setSearchTerm,
                            placeholder: "Search for help articles..."
                        })
                    )
                ),

                // Categories
                React.createElement(
                    'div',
                    { className: "flex flex-wrap gap-3 justify-center mb-12" },
                    categories.map(cat =>
                        React.createElement(
                            'button',
                            {
                                key: cat.id,
                                onClick: () => setActiveCategory(cat.id),
                                className: `px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                    activeCategory === cat.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`
                            },
                            React.createElement(Icon, { name: cat.icon, size: 14 }),
                            cat.label
                        )
                    )
                ),

                // Help Articles Grid
                React.createElement(
                    'div',
                    { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" },
                    filteredArticles.map(article =>
                        React.createElement(
                            ModernCard,
                            {
                                key: article.id,
                                className: "p-6 hover:shadow-xl transition-all cursor-pointer group",
                                onClick: () => Toast.show(`Opening: ${article.title}`)
                            },
                            React.createElement(
                                'div',
                                { className: "flex items-start justify-between mb-4" },
                                React.createElement(
                                    'div',
                                    { className: "w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform" },
                                    React.createElement(Icon, { name: "file-alt", size: 20 })
                                ),
                                React.createElement(
                                    'span',
                                    { className: "text-xs text-gray-400" },
                                    `${article.views} views`
                                )
                            ),
                            React.createElement(
                                'h3',
                                { className: "font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors" },
                                article.title
                            ),
                            React.createElement(
                                'p',
                                { className: "text-gray-500 text-sm mb-4" },
                                article.description
                            ),
                            React.createElement(
                                'div',
                                { className: "flex items-center justify-between text-sm" },
                                React.createElement(
                                    'span',
                                    { className: "text-green-600" },
                                    `${article.helpful}% found this helpful`
                                ),
                                React.createElement(
                                    'span',
                                    { className: "text-indigo-600 font-medium flex items-center gap-1" },
                                    "Read more",
                                    React.createElement(Icon, { name: "arrow-right", size: 12 })
                                )
                            )
                        )
                    )
                ),

                // FAQs
                React.createElement(
                    ModernCard,
                    { className: "p-8 mb-12" },
                    React.createElement(
                        'h2',
                        { className: "text-2xl font-bold mb-6" },
                        "Frequently Asked Questions"
                    ),
                    React.createElement(
                        'div',
                        { className: "space-y-4" },
                        faqs.map((faq, i) =>
                            React.createElement(
                                'div',
                                { key: i, className: "border-b border-gray-100 last:border-0 pb-4 last:pb-0" },
                                React.createElement(
                                    'button',
                                    {
                                        className: "w-full flex items-center justify-between text-left font-medium hover:text-indigo-600 transition-colors",
                                        onClick: (e) => {
                                            const answer = e.currentTarget.nextElementSibling;
                                            answer.classList.toggle('hidden');
                                        }
                                    },
                                    faq.question,
                                    React.createElement(Icon, { name: "chevron-down", size: 16 })
                                ),
                                React.createElement(
                                    'p',
                                    { className: "text-gray-500 text-sm mt-2 hidden" },
                                    faq.answer
                                )
                            )
                        )
                    )
                ),

                // Contact Support
                React.createElement(
                    ModernCard,
                    { className: "p-8 text-center" },
                    React.createElement(
                        'h2',
                        { className: "text-2xl font-bold mb-4" },
                        "Still need help?"
                    ),
                    React.createElement(
                        'p',
                        { className: "text-gray-500 mb-6 max-w-md mx-auto" },
                        "Our support team is available 24/7 to assist you with any questions or issues."
                    ),
                    React.createElement(
                        'div',
                        { className: "flex flex-col sm:flex-row gap-4 justify-center" },
                        React.createElement(
                            'button',
                            {
                                onClick: () => setShowContactModal(true),
                                className: "bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            },
                            React.createElement(Icon, { name: "envelope", size: 18 }),
                            "Contact Support"
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: () => window.open('https://docs.tapmap.com', '_blank'),
                                className: "bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                            },
                            React.createElement(Icon, { name: "book", size: 18 }),
                            "Read Documentation"
                        )
                    )
                ),

                // Contact Modal
                React.createElement(
                    Modal,
                    { isOpen: showContactModal, onClose: () => setShowContactModal(false), title: "Contact Support", size: "md" },
                    React.createElement(
                        'form',
                        { onSubmit: handleContactSubmit, className: "space-y-6" },
                        React.createElement(
                            'div',
                            null,
                            React.createElement('label', { className: "form-label" }, "Priority"),
                            React.createElement(
                                'select',
                                {
                                    value: contactForm.priority,
                                    onChange: (e) => setContactForm({ ...contactForm, priority: e.target.value }),
                                    className: "form-input"
                                },
                                React.createElement('option', { value: "low" }, "Low - General Question"),
                                React.createElement('option', { value: "normal" }, "Normal - Need Help"),
                                React.createElement('option', { value: "high" }, "High - Urgent Issue"),
                                React.createElement('option', { value: "critical" }, "Critical - System Down")
                            )
                        ),
                        React.createElement(FormInput, {
                            label: "Subject",
                            value: contactForm.subject,
                            onChange: (e) => setContactForm({ ...contactForm, subject: e.target.value }),
                            required: true,
                            icon: "heading"
                        }),
                        React.createElement(FormTextarea, {
                            label: "Message",
                            value: contactForm.message,
                            onChange: (e) => setContactForm({ ...contactForm, message: e.target.value }),
                            required: true,
                            rows: 6,
                            placeholder: "Describe your issue in detail..."
                        }),
                        React.createElement(
                            'div',
                            { className: "flex justify-end gap-4" },
                            React.createElement(
                                Button,
                                { variant: "secondary", onClick: () => setShowContactModal(false) },
                                "Cancel"
                            ),
                            React.createElement(
                                Button,
                                { type: "submit", icon: "paper-plane" },
                                "Send Message"
                            )
                        )
                    )
                )
            )
        );
    };

    window.Help = Help;
})();