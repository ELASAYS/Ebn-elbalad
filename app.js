// ====================================
// Global Variables & Configuration
// ====================================
const CONFIG = {
    WHATSAPP_NUMBER: '201019388501',
    PRODUCTS_PER_PAGE: 12,
    ANIMATION_DURATION: 300
};

let allProducts = [];
let allCategories = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSort = 'default';
let currentPage = 1;
let cart = [];

// ====================================
// Initialize Application
// ====================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    showLoading();
    
    try {
        console.log('Initializing app...');
        
        // Load data
        await loadData();
        
        console.log('Rendering UI...');
        
        // Initialize UI
        renderCategories();
        renderFilterTabs();
        applyFiltersAndSort();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load cart from localStorage
        loadCart();
        
        console.log('App initialized successfully!');
        hideLoading();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        hideLoading();
        
        // Show friendly error message
        const container = document.getElementById('productsGrid');
        if (container) {
            container.innerHTML = `
                <div style="
                    grid-column: 1/-1;
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-lg);
                ">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                    <h3 style="font-size: 1.5rem; color: var(--danger); margin-bottom: 1rem;">
                        حدث خطأ في تحميل البيانات
                    </h3>
                    <p style="color: var(--gray-600); margin-bottom: 2rem;">
                        تأكد من وجود ملف oil_shop_complete.json في نفس المجلد
                    </p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        إعادة تحميل الصفحة
                    </button>
                    <div style="margin-top: 2rem; padding: 1rem; background: var(--gray-50); border-radius: var(--radius-lg); text-align: right; font-size: 0.9rem; color: var(--gray-600);">
                        <strong>الأخطاء الشائعة:</strong>
                        <ul style="margin: 0.5rem 0 0 1.5rem;">
                            <li>ملف JSON غير موجود في نفس المجلد</li>
                            <li>يجب فتح الملف من خادم (لا يعمل من file://)</li>
                            <li>تأكد من رفع جميع الملفات على GitHub Pages</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    }
}

// ====================================
// Data Loading
// ====================================
async function loadData() {
    try {
        console.log('Loading data...');
        const response = await fetch('oil_shop_complete.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data loaded successfully:', data);
        
        if (!data.products || !data.categories) {
            throw new Error('Invalid data structure');
        }
        
        allProducts = data.products;
        allCategories = data.categories;
        filteredProducts = [...allProducts];
        
        console.log(`Loaded ${allProducts.length} products and ${allCategories.length} categories`);
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// ====================================
// Rendering Functions
// ====================================
function renderCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    // Count products per category
    const categoryCounts = {};
    allProducts.forEach(product => {
        categoryCounts[product.category_id] = (categoryCounts[product.category_id] || 0) + 1;
    });
    
    const icons = ['🛢️', '🧴', '🔧', '❄️', '⚙️', '✨', '🔩', '💧', '⚡'];
    
    container.innerHTML = allCategories.map((category, index) => {
        const count = categoryCounts[category.id] || 0;
        const icon = icons[index % icons.length];
        
        return `
            <div class="category-card" onclick="filterByCategory(${category.id})">
                <div class="category-icon">${icon}</div>
                <h3 class="category-name">${category.name}</h3>
                <p class="category-count">${count} منتج</p>
            </div>
        `;
    }).join('');
}

function renderFilterTabs() {
    const container = document.getElementById('filterTabs');
    if (!container) return;
    
    // Count products per category
    const categoryCounts = {};
    allProducts.forEach(product => {
        categoryCounts[product.category_id] = (categoryCounts[product.category_id] || 0) + 1;
    });
    
    const allButton = `<button class="filter-tab active" data-category="all">الكل (${allProducts.length})</button>`;
    
    const categoryButtons = allCategories.map(category => {
        const count = categoryCounts[category.id] || 0;
        return `<button class="filter-tab" data-category="${category.id}">${category.name} (${count})</button>`;
    }).join('');
    
    container.innerHTML = allButton + categoryButtons;
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (!container) return;
    
    // Calculate products to show
    const startIndex = 0;
    const endIndex = currentPage * CONFIG.PRODUCTS_PER_PAGE;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    // Show/hide no results
    if (filteredProducts.length === 0) {
        noResults.classList.add('show');
        container.innerHTML = '';
        loadMoreContainer.style.display = 'none';
        return;
    } else {
        noResults.classList.remove('show');
    }
    
    // Render products
    container.innerHTML = productsToShow.map(product => createProductCard(product)).join('');
    
    // Show/hide load more button
    if (endIndex >= filteredProducts.length) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'flex';
    }
    
    // Animate cards
    animateCards();
}

function createProductCard(product) {
    const price = product.wholesale_price.toFixed(2);
    const liters = product.liters ? `${product.liters} لتر` : product.unit;
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <span class="product-category-badge">${product.category_name}</span>
            <h3 class="product-name">${product.product_name}</h3>
            <div class="product-specs">
                <span>📦 الحجم: ${liters}</span>
                <span>📋 الوحدة: ${product.unit}</span>
            </div>
            <div class="product-price">${price} ج.م</div>
            <div class="product-actions">
                <button class="btn btn-primary btn-sm btn-block" onclick="addToCart(${product.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    أضف للسلة
                </button>
            </div>
        </div>
    `;
}

// ====================================
// Filter & Sort Functions
// ====================================
function applyFiltersAndSort() {
    // Filter by category
    if (currentCategory === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(p => p.category_id == currentCategory);
    }
    
    // Sort products
    switch (currentSort) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.wholesale_price - b.wholesale_price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.wholesale_price - a.wholesale_price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.product_name.localeCompare(b.product_name, 'ar'));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.product_name.localeCompare(a.product_name, 'ar'));
            break;
    }
    
    // Reset pagination
    currentPage = 1;
    
    // Render
    renderProducts();
    
    // Scroll to products
    scrollToProducts();
}

function filterByCategory(categoryId) {
    currentCategory = categoryId;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category == categoryId) {
            tab.classList.add('active');
        }
    });
    
    applyFiltersAndSort();
}

// ====================================
// Search Functions
// ====================================
let searchTimeout;
function setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
}

function performSearch(query) {
    const results = allProducts.filter(product => 
        product.product_name.toLowerCase().includes(query.toLowerCase()) ||
        product.category_name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray-500);">لم يتم العثور على نتائج</p>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(product => `
        <div class="search-result-item" onclick="selectSearchResult(${product.id})" style="
            padding: 1rem;
            border-bottom: 1px solid var(--gray-200);
            cursor: pointer;
            transition: background 0.2s;
        " onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background='white'">
            <h4 style="font-weight: 600; margin-bottom: 0.25rem;">${product.product_name}</h4>
            <p style="font-size: 0.85rem; color: var(--gray-500);">${product.category_name} • ${product.wholesale_price.toFixed(2)} ج.م</p>
        </div>
    `).join('');
}

function selectSearchResult(productId) {
    closeSearchModal();
    
    // Filter to show only this product's category
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        filterByCategory(product.category_id);
        
        // Scroll to product
        setTimeout(() => {
            const productCard = document.querySelector(`[data-product-id="${productId}"]`);
            if (productCard) {
                productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                productCard.style.animation = 'pulse 1s ease-in-out 2';
            }
        }, 500);
    }
}

// ====================================
// Cart Functions
// ====================================
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.product_name,
            price: product.wholesale_price,
            category: product.category_name,
            unit: product.unit,
            quantity: 1
        });
    }
    
    updateCart();
    saveCart();
    
    // Show notification
    showNotification('تمت الإضافة إلى السلة ✓');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    saveCart();
}

function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCart();
        saveCart();
    }
}

function updateCart() {
    const cartBadge = document.getElementById('cartBadge');
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    
    // Update badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>السلة فارغة</p>
            </div>
        `;
        cartFooter.style.display = 'none';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item" style="
                padding: 1rem;
                border: 1px solid var(--gray-200);
                border-radius: var(--radius-lg);
                margin-bottom: 1rem;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <h4 style="font-size: 0.95rem; font-weight: 600;">${item.name}</h4>
                    <button onclick="removeFromCart(${item.id})" style="
                        color: var(--accent);
                        font-size: 1.25rem;
                        padding: 0.25rem;
                    ">×</button>
                </div>
                <p style="font-size: 0.85rem; color: var(--gray-500); margin-bottom: 0.75rem;">${item.category}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <button onclick="updateCartQuantity(${item.id}, -1)" style="
                            width: 1.75rem;
                            height: 1.75rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: var(--gray-100);
                            border-radius: var(--radius);
                            font-weight: 700;
                        ">-</button>
                        <span style="font-weight: 600; min-width: 2rem; text-align: center;">${item.quantity}</span>
                        <button onclick="updateCartQuantity(${item.id}, 1)" style="
                            width: 1.75rem;
                            height: 1.75rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: var(--accent);
                            color: white;
                            border-radius: var(--radius);
                            font-weight: 700;
                        ">+</button>
                    </div>
                    <span style="font-weight: 700; color: var(--accent);">${(item.price * item.quantity).toFixed(2)} ج.م</span>
                </div>
            </div>
        `).join('');
        
        cartFooter.style.display = 'block';
        
        // Update total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `${total.toFixed(2)} ج.م`;
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

function checkout() {
    if (cart.length === 0) return;
    
    // Build WhatsApp message
    let message = 'مرحباً! أريد طلب المنتجات التالية:\n\n';
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`;
        message += `   الكمية: ${item.quantity}\n`;
        message += `   السعر: ${(item.price * item.quantity).toFixed(2)} ج.م\n\n`;
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `───────────────\n`;
    message += `الإجمالي: ${total.toFixed(2)} ج.م`;
    
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function openCart() {
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ====================================
// Modal Functions
// ====================================
function openSearchModal() {
    const modal = document.getElementById('searchModal');
    modal.classList.add('active');
    document.getElementById('globalSearch').focus();
    document.body.style.overflow = 'hidden';
}

function closeSearchModal() {
    const modal = document.getElementById('searchModal');
    modal.classList.remove('active');
    document.getElementById('globalSearch').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.body.style.overflow = '';
}

// ====================================
// Event Listeners
// ====================================
function setupEventListeners() {
    // Navigation
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            const element = document.querySelector(target);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                navMenu.classList.remove('active');
            }
            
            // Update active link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Search button
    document.getElementById('searchBtn').addEventListener('click', openSearchModal);
    
    // Cart button
    document.getElementById('cartBtn').addEventListener('click', openCart);
    
    // Filter tabs
    document.getElementById('filterTabs').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tab')) {
            const category = e.target.dataset.category;
            filterByCategory(category);
        }
    });
    
    // Sort select
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndSort();
    });
    
    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        currentPage++;
        renderProducts();
    });
    
    // Global search
    setupGlobalSearch();
    
    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSearchModal();
            closeCart();
        }
    });
}

// ====================================
// Utility Functions
// ====================================
function scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        const offset = 100;
        const top = productsSection.offsetTop - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

function showLoading() {
    document.getElementById('loadingSpinner').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('active');
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        color: var(--danger);
        padding: 2rem;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-xl);
        z-index: 3001;
        max-width: 400px;
        text-align: center;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
}

function animateCards() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// ====================================
// Additional Animations CSS
// ====================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);