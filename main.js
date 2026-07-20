document.addEventListener("DOMContentLoaded", () => {
    // =================================================================
    // 1. GLOBAL VARIABLES AND CONFIGURATION
    // =================================================================
    
    const CONFIG = {
        defaultLang: 'ko',
        storageKey: 'lang',
        baseUrl: '',
        timeout: 5000
    };

    let currentLang = localStorage.getItem(CONFIG.storageKey) || CONFIG.defaultLang;
    let allProducts = [];
    let translations = {};
    let isInitialized = false;

    // =================================================================
    // 2. UTILITY FUNCTIONS
    // =================================================================

    const loadHTML = (selector, url, callback = null) => {
        if (!selector || !url) {
            console.error('Invalid selector or URL for loadHTML');
            return Promise.reject(new Error('Invalid parameters'));
        }

        return fetch(url, { timeout: CONFIG.timeout })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                const element = document.querySelector(selector);
                if (element) {
                    element.innerHTML = data;
                    callback && callback();
                } else {
                    console.error(`Element with selector ${selector} not found.`);
                }
            })
            .catch(error => {
                console.error(`Error loading ${url}:`, error);
                throw error;
            });
    };

    const loadJSON = (url) => {
        if (!url) {
            return Promise.reject(new Error('Invalid URL'));
        }

        return fetch(url, { timeout: CONFIG.timeout })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error(`Error loading JSON from ${url}:`, error);
                throw error;
            });
    };

    const safeQuerySelector = (selector) => {
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.error('Invalid selector:', selector, error);
            return null;
        }
    };

    const safeQuerySelectorAll = (selector) => {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.error('Invalid selector:', selector, error);
            return [];
        }
    };

    // =================================================================
    // 3. LANGUAGE MANAGEMENT
    // =================================================================

    const applyTranslations = (lang) => {
        try {
            if (!translations[lang]) {
                console.warn(`No translations found for language: ${lang}`);
                return;
            }

            const elements = safeQuerySelectorAll("[data-i18n]");
            elements.forEach(element => {
                const key = element.getAttribute("data-i18n");
                if (translations[lang][key]) {
                    element.textContent = translations[lang][key];
                }
            });

            // Update language button text
            const langBtnSpans = safeQuerySelectorAll(".language-selector span");
            langBtnSpans.forEach(span => {
                if (span) span.textContent = lang.toUpperCase();
            });

            const event = new CustomEvent("languageChange", { 
                detail: { lang: lang } 
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Error applying translations:', error);
        }
    };

    const setLanguage = (lang) => {
        try {
            if (!lang || typeof lang !== 'string') {
                console.error('Invalid language parameter');
                return;
            }

            currentLang = lang;
            localStorage.setItem(CONFIG.storageKey, lang);
            applyTranslations(lang);
        } catch (error) {
            console.error('Error setting language:', error);
        }
    };

    const loadTranslations = async (lang) => {
        try {
            const data = await loadJSON('translation.json');
            translations = { ...translations, ...data };
            return data;
        } catch (error) {
            console.error('Failed to load translations:', error);
            throw error;
        }
    };

    // =================================================================
    // 4. MODAL MANAGEMENT
    // =================================================================

    const openModal = (modal) => {
        if (!modal) {
            console.error('Modal element is null');
            return;
        }

        try {
            modal.classList.remove("hidden");
            const modalContent = modal.querySelector(".bg-white");
            if (modalContent) {
                modalContent.classList.remove("animate-scale-out");
                modalContent.classList.add("animate-scale-in");
            }
            setTimeout(() => {
                modal.classList.remove("opacity-0");
            }, 10);
        } catch (error) {
            console.error('Error opening modal:', error);
        }
    };

    const closeModal = (modal) => {
        if (!modal) return;

        try {
            const modalContent = modal.querySelector(".bg-white");
            if (modalContent) {
                modalContent.classList.remove("animate-scale-in");
                modalContent.classList.add("animate-scale-out");
            }
            modal.classList.add("opacity-0");
            setTimeout(() => {
                modal.classList.add("hidden");
                modal.classList.remove("flex");
            }, 300);
        } catch (error) {
            console.error('Error closing modal:', error);
        }
    };

    // =================================================================
    // 5. PRODUCTS MANAGEMENT
    // =================================================================

    const showProductDetails = (product, modal) => {
        if (!product || !modal) return;

        try {
            const modalContent = modal.querySelector(".modal-content");
            const modalImage = safeQuerySelector("#modal-image");
            const modalName = safeQuerySelector("#modal-name");
            const modalViscosity = safeQuerySelector("#modal-viscosity");
            const modalDescription = safeQuerySelector("#modal-description");
            
            if (!modalContent || !modalImage || !modalName || !modalViscosity || !modalDescription) {
                console.error('Missing modal elements');
                return;
            }

            const gradient = `linear-gradient(135deg, ${product.color || '#666'} 0%, #1a202c 100%)`;
            modalContent.style.background = gradient;

            modalImage.src = product.image || '';
            modalName.textContent = product.name || '';
            modalViscosity.textContent = product.viscosity || '';
            modalDescription.textContent = product.description || ''; 

            // Fill table
            const tableBody = safeQuerySelector('#modal-table-body');
            if (tableBody && product.table && product.table.length > 1) {
                tableBody.innerHTML = '';
                for (let i = 1; i < product.table.length; i++) {
                    const row = product.table[i];
                    const tr = document.createElement('tr');
                    row.forEach(cell => {
                        const td = document.createElement('td');
                        td.className = "px-4 py-2 border-b border-gray-800";
                        td.textContent = cell;
                        tr.appendChild(td);
                    });
                    tableBody.appendChild(tr);
                }
            }

            // Show modal
            modal.classList.remove("hidden", "opacity-0");
            modal.classList.add("flex");
        } catch (error) {
            console.error('Error showing product details:', error);
        }
    };

    const handleProductHash = (productsData, modal) => {
        try {
            const hash = window.location.hash.substring(1);
            if (!hash) return;

            const productIDFromURL = hash;
            const targetProduct = productsData.find(p => p.id == productIDFromURL);
            
            if (targetProduct) {
                showProductDetails(targetProduct, modal);
            }
        } catch (error) {
            console.error('Error handling product hash:', error);
        }
    };

    const generateFilterButtons = (productsData) => {
        const filtersContainer = safeQuerySelector("#category-filters");
        if (!filtersContainer || !productsData.length) return;

        try {
            const categories = [...new Set(productsData.map(p => p.category).filter(c => c))];
            filtersContainer.innerHTML = '';

            const createFilterButton = (category) => {
                const button = document.createElement('button');
                button.textContent = translations[currentLang]?.[category] || category;
                button.setAttribute('data-category', category);
                button.className = 'filter-btn px-3 py-1 mx-1 rounded-full font-semibold transition-all duration-300 focus:outline-none active:scale-95';
                
                // Style the button
                Object.assign(button.style, {
                    backgroundColor: 'white',
                    color: '#333',
                    cursor: 'pointer'
                });

                const setHoverStyles = (isHover) => {
                    button.style.backgroundColor = isHover ? '#cdad59' : 'white';
                    button.style.color = isHover ? 'white' : '#333';
                };

                button.addEventListener('mouseenter', () => setHoverStyles(true));
                button.addEventListener('mouseleave', () => setHoverStyles(false));
                
                return button;
            };

            // Create "Show All" button
            const allBtn = createFilterButton('all');
            allBtn.textContent = translations[currentLang]?.['Show All'] || 'Show All';
            filtersContainer.appendChild(allBtn);

            // Create category buttons
            categories.forEach(category => {
                const button = createFilterButton(category);
                filtersContainer.appendChild(button);
            });
        } catch (error) {
            console.error('Error generating filter buttons:', error);
        }
    };

    const filterProducts = (category) => {
        const productGrid = safeQuerySelector("#product-grid");
        if (!productGrid) return;

        try {
            // Update button styles
            safeQuerySelectorAll('.filter-btn').forEach(btn => {
                Object.assign(btn.style, {
                    backgroundColor: 'white',
                    color: '#333'
                });
            });

            const currentButton = safeQuerySelector(`[data-category="${category}"]`);
            if (currentButton) {
                Object.assign(currentButton.style, {
                    backgroundColor: '#cdad59',
                    color: 'white'
                });
            }

            productGrid.innerHTML = "";

            const productsToDisplay = category === 'all' 
                ? allProducts 
                : allProducts.filter(p => p.category === category);

            if (!productsToDisplay.length) {
                productGrid.innerHTML = '<p class="text-center text-gray-600">No products found.</p>';
                return;
            }

            // Generate product cards
            productsToDisplay.forEach((product) => {
                const gradient = `linear-gradient(135deg, ${product.color || '#666'} 0%, #2C3E50 100%)`;
                const productCard = `
                    <div class="product-card rounded-xl shadow-lg text-white" style="background: ${gradient};">
                        <div class="image-wrapper rounded-t-xl overflow-hidden p-4">
                            <img src="${product.image || ''}" alt="${product.name || ''}" class="w-full h-full object-cover">
                        </div>
                        <div class="p-6 text-center">
                            <h2 class="text-xl font-bold mb-2 text-white">${product.name || ''}</h2>
                            <p class="text-gray-200 font-bold text-lg mb-4">${product.viscosity || ''}</p>
                            <button class="view-details-btn w-full bg-white/20 backdrop-blur-sm text-white py-2 px-4 rounded-lg font-bold hover:bg-white/30 transition-all duration-300" data-product-id="${product.id}">
                                ${translations[currentLang]?.['View Details'] || 'View Details'}
                            </button>
                        </div>
                    </div>
                `;
                productGrid.innerHTML += productCard;
            });
            
            // Reapply observers and language
            safeQuerySelectorAll(".product-card").forEach(card => {
                observer.observe(card);
            });
            applyTranslations(currentLang);

            // Attach event listeners
            const modal = safeQuerySelector("#product-modal");
            safeQuerySelectorAll(".view-details-btn").forEach(button => {
                button.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const productId = button.getAttribute("data-product-id");
                    const product = allProducts.find((p) => p.id == productId);
                    showProductDetails(product, modal);
                });
            });
        } catch (error) {
            console.error('Error filtering products:', error);
        }
    };

    // =================================================================
    // 6. EVENT LISTENERS AND INITIALIZATION
    // =================================================================

    const setupEventListeners = () => {
        try {
            // Mobile menu
            const mobileMenuButton = safeQuerySelector("#mobile-menu-button");
            const mobileMenu = safeQuerySelector("#mobile-menu");
            if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener("click", function () {
                    const body = document.body;
                    if (mobileMenu.classList.contains("hidden")) {
                        mobileMenu.classList.remove("hidden");
                        setTimeout(() => mobileMenu.classList.remove("scale-y-0"), 10);
                        body.classList.add("mobile-menu-open");
                    } else {
                        mobileMenu.classList.add("scale-y-0");
                        setTimeout(() => mobileMenu.classList.add("hidden"), 300);
                        body.classList.remove("mobile-menu-open");
                    }
                });
            }

            // Smooth scrolling
            safeQuerySelectorAll('a[href^="#"]').forEach((anchor) => {
                anchor.addEventListener("click", function (e) {
                    e.preventDefault();
                    const targetElement = safeQuerySelector(this.getAttribute("href"));
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                });
            });

            // Modal event listeners
            const langModal = safeQuerySelector("#lang-modal");
            const termsModal = safeQuerySelector("#terms-modal");
            const noticeModal = safeQuerySelector("#notice-modal");
            const aboutModal = safeQuerySelector("#about-modal");

            safeQuerySelector("#open-lang-modal")?.addEventListener("click", () => openModal(langModal));
            safeQuerySelector("#open-lang-modal-mobile")?.addEventListener("click", () => openModal(langModal));
            safeQuerySelector("#terms-link")?.addEventListener("click", (e) => { e.preventDefault(); openModal(termsModal); });
            safeQuerySelector("#notice-link")?.addEventListener("click", (e) => { e.preventDefault(); openModal(noticeModal); });
            safeQuerySelector("#footer-about-link")?.addEventListener("click", (e) => { e.preventDefault(); openModal(aboutModal); });
            safeQuerySelector("#close-lang-modal")?.addEventListener("click", () => closeModal(langModal));
            safeQuerySelector("#close-terms-modal")?.addEventListener("click", () => closeModal(termsModal));
            safeQuerySelector("#close-notice-modal")?.addEventListener("click", () => closeModal(noticeModal));
            safeQuerySelector("#close-about-modal")?.addEventListener("click", () => closeModal(aboutModal));
            safeQuerySelector("#close-terms-modal-button")?.addEventListener("click", () => closeModal(termsModal));
            safeQuerySelector("#close-notice-modal-button")?.addEventListener("click", () => closeModal(noticeModal));
            safeQuerySelector("#close-about-modal-button")?.addEventListener("click", () => closeModal(aboutModal));

            // Close modal when clicking outside
            window.addEventListener("click", (e) => {
                if (e.target === langModal) closeModal(langModal);
                if (e.target === termsModal) closeModal(termsModal);
                if (e.target === noticeModal) closeModal(noticeModal);
                if (e.target === aboutModal) closeModal(aboutModal);
            });

            // Language selection
            safeQuerySelectorAll(".lang-modal-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const lang = btn.getAttribute("data-lang");
                    if (lang) {
                        setLanguage(lang);
                        closeModal(langModal);
                    }
                });
            });

            // Contact form
            const contactForm = safeQuerySelector("#contact-form");
            if (contactForm) {
                contactForm.addEventListener("submit", function (event) {
                    event.preventDefault();
                    const messageElement = safeQuerySelector("#message");
                    if (!messageElement) return;

                    const message = messageElement.value.trim();
                    if (!message) {
                        alert('Please enter a message.');
                        return;
                    }

                    const toEmail = "Abd.bako.company@gmail.com";
                    const subject = "Message from Website Contact Form";
                    const mailtoLink = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                    window.location.href = mailtoLink;
                });
            }

        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    };

    const setupProductPage = async () => {
        try {
            const productGrid = safeQuerySelector("#product-grid");
            if (!productGrid) return;

            const products = await loadJSON("products.json");
            allProducts = products;

            // Generate and attach filters
            generateFilterButtons(products);

            // Attach filter event listeners
            safeQuerySelectorAll('.filter-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const category = button.getAttribute('data-category');
                    if (category) {
                        filterProducts(category);
                    }
                });
            });

            // Display all products by default
            filterProducts('all');

            // Setup modal
            const modal = safeQuerySelector("#product-modal");
            const closeModalButton = safeQuerySelector("#close-modal");

            if (closeModalButton) {
                closeModalButton.addEventListener("click", () => {
                    closeModal(modal);
                });
            }

            if (modal) {
                modal.addEventListener("click", (e) => {
                    if (e.target === modal) {
                        closeModal(modal);
                    }
                });
            }

            // Handle URL hash
            handleProductHash(products, modal);
        } catch (error) {
            console.error('Error setting up product page:', error);
        }
    };

    // =================================================================
    // 7. MAIN APPLICATION INITIALIZATION
    // =================================================================

    const initializeApp = async () => {
        try {
            if (isInitialized) return;
            isInitialized = true;

            // Load header first, then load common parts and initialize
            loadHTML("#header-placeholder", "layout/header.html", () => {
                loadHTML("#footer-placeholder", "layout/footer.html");
                loadHTML("#about-modal-placeholder", "about.html");
                
                // Load translations and apply language
                loadTranslations(currentLang).then(() => {
                    applyTranslations(currentLang);
                }).catch(error => {
                    console.error('Failed to load translations:', error);
                    // Continue with default language
                });
                
                // Setup event listeners
                setupEventListeners();
                
                // Load products if on products page
                setupProductPage();
            });
            
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    };

    // =================================================================
    // 8. INTERSECTION OBSERVER FOR ANIMATIONS
    // =================================================================

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("animate-fadeIn");
                }
            });
        },
        { threshold: 0.1 }
    );

    // =================================================================
    // 9. STARTUP SEQUENCE
    // =================================================================

    // Initialize the application
    initializeApp().catch(error => {
        console.error('Application initialization failed:', error);
    });

    // Handle hash changes
    window.addEventListener("hashchange", () => {
        if (allProducts.length > 0) {
            const modal = safeQuerySelector("#product-modal");
            handleProductHash(allProducts, modal);
        }
    });
});