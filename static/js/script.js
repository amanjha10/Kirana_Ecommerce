let cart = [];
const today = new Date();

// eSewa Configuration
const ESEWA_CONFIG = {
    SECRET_KEY: '8gBm/:&EnhH.1/q', // Test environment secret key
    PRODUCT_CODE: 'EPAYTEST',
    BASE_URL: window.location.origin
};

// Location Configuration
let selectedLocation = {
    district: '',
    area: '',
    coordinates: null,
    fullAddress: ''
};

const areas = {
    kathmandu: ['Koteshwor', 'Baneshwor', 'New Baneshwor', 'Kalanki', 'Balaju', 'Maharajgunj', 'Chabahil', 'Bouddha', 'Jorpati', 'Thamel', 'Lazimpat', 'Durbarmarg', 'Putalisadak', 'Naxal', 'Sinamangal'],
    lalitpur: ['Patan Dhoka', 'Jawalakhel', 'Pulchowk', 'Lagankhel', 'Kupondole', 'Sanepa', 'Jhamsikhel', 'Ekantakuna', 'Satdobato', 'Gwarko'],
    bhaktapur: ['Bhaktapur Durbar Square', 'Suryabinayak', 'Madhyapur Thimi', 'Sipadol', 'Changunarayan', 'Nagarkot']
};

let map, marker, mapSelectedCoords = null;

const elements = {
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mainNav: document.getElementById('mainNav'),
    cartCount: document.getElementById('cartCount'),
    priceRange: document.getElementById('priceRange'),
    priceValue: document.getElementById('priceValue'),
    categoryCheckboxes: document.querySelectorAll('input[name="category"]'),
    clearFilters: document.getElementById('clearFilters'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarClose: document.getElementById('sidebarClose'),
    products: document.querySelectorAll('.product'),
    chatBtn: document.getElementById('chatBtn'),
    messageBox: document.getElementById('messageBox'),
    closeBtn: document.getElementById('closeBtn'),
    messageContent: document.getElementById('messageContent'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    saleBanner: document.getElementById('saleBanner'),
    heroSlider: document.getElementById('heroSlider'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    sliderDots: document.getElementById('sliderDots')
};

function init() {
    setupEventListeners();
    checkFridaySale();
    loadCartFromStorage();
    filterProducts();
    initSlider();
    initCartPage();
    setupLocationSelectors();
}

function setupEventListeners() {
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    document.addEventListener('click', (e) => {
        if (elements.mainNav && elements.mainNav.classList.contains('active') && 
            !elements.mainNav.contains(e.target) && 
            !elements.mobileMenuBtn.contains(e.target)) {
            elements.mainNav.classList.remove('active');
        }
        
        if (elements.sidebar && elements.sidebar.classList.contains('active') && 
            !elements.sidebar.contains(e.target) && 
            elements.sidebarToggle && !elements.sidebarToggle.contains(e.target)) {
            elements.sidebar.classList.remove('active');
        }
    });
    
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', () => {
            elements.sidebar.classList.add('active');
        });
    }
    
    if (elements.sidebarClose) {
        elements.sidebarClose.addEventListener('click', () => {
            elements.sidebar.classList.remove('active');
        });
    }
    
    if (elements.priceRange) {
        elements.priceRange.addEventListener('input', () => {
            elements.priceValue.textContent = elements.priceRange.value;
            filterProducts();
        });
    }
    
    if (elements.categoryCheckboxes) {
        elements.categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', filterProducts);
        });
    }
    
    if (elements.clearFilters) {
        elements.clearFilters.addEventListener('click', clearAllFilters);
    }
    
    if (elements.chatBtn) {
        elements.chatBtn.addEventListener('click', () => {
            elements.messageBox.style.display = 'block';
        });
    }
    
    if (elements.closeBtn) {
        elements.closeBtn.addEventListener('click', () => {
            elements.messageBox.style.display = 'none';
        });
    }
    
    if (elements.sendBtn) {
        elements.sendBtn.addEventListener('click', sendMessage);
    }
    
    if (elements.messageInput) {
        elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function toggleMobileMenu() {
    elements.mainNav.classList.toggle('active');
}

function filterProducts() {
    if (!elements.priceRange || !elements.products) return;
    
    const maxPrice = parseInt(elements.priceRange.value);
    const selectedCategories = Array.from(elements.categoryCheckboxes)
        .filter(cb => cb.checked && cb.value !== 'all')
        .map(cb => cb.value);
    
    const showAll = document.querySelector('input[name="category"][value="all"]')?.checked || 
                    selectedCategories.length === 0;
    
    elements.products.forEach(product => {
        const price = parseInt(product.getAttribute('data-price'));
        const category = product.getAttribute('data-category');
        
        const matchesPrice = price <= maxPrice;
        const matchesCategory = showAll || selectedCategories.includes(category);
        
        if (matchesPrice && matchesCategory) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

function clearAllFilters() {
    if (elements.priceRange) {
        elements.priceRange.value = 3000;
        elements.priceValue.textContent = 3000;
    }
    
    if (elements.categoryCheckboxes) {
        elements.categoryCheckboxes.forEach(checkbox => {
            if (checkbox.value === 'all') {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
        });
    }
    
    const expressRadio = document.getElementById('express');
    if (expressRadio) {
        expressRadio.checked = true;
    }
    
    filterProducts();
}

function checkFridaySale() {
    if (today.getDay() === 5 && elements.saleBanner) {
        elements.saleBanner.style.display = 'block';
    }
}

function addToCart(id, name, price, image) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id,
            name,
            price,
            image,
            quantity: 1
        });
    }
    
    updateCartCount();
    saveCartToStorage();
    showNotification(`${name} added to cart!`);
    
    if (elements.cartCount) {
        elements.cartCount.style.animation = 'none';
        setTimeout(() => {
            elements.cartCount.style.animation = 'bounce 0.5s ease';
        }, 10);
    }
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCartCount();
            saveCartToStorage();
            renderCartPage();
            updateEsewaFields();
        }
    }
}

function removeFromCart(id) {
    const item = cart.find(item => item.id === id);
    if (item) {
        cart = cart.filter(item => item.id !== id);
        updateCartCount();
        saveCartToStorage();
        renderCartPage();
        updateEsewaFields();
        showNotification(`${item.name} removed from cart`);
    }
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    if (elements.cartCount) {
        elements.cartCount.textContent = count;
    }
    
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.animation = 'none';
        setTimeout(() => {
            el.style.animation = 'pulse 0.3s ease';
        }, 10);
    });
}

function saveCartToStorage() {
    try {
        localStorage.setItem('thapaKiranaCart', JSON.stringify(cart));
    } catch (e) {
        console.log('Unable to save cart');
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('thapaKiranaCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            updateCartCount();
        }
    } catch (e) {
        console.log('Unable to load cart');
    }
}

// eSewa Integration Functions
function generateTransactionUUID() {
    return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function generateEsewaSignature(totalAmount, transactionUuid, productCode) {
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const hash = CryptoJS.HmacSHA256(message, ESEWA_CONFIG.SECRET_KEY);
    const signature = CryptoJS.enc.Base64.stringify(hash);
    return signature;
}

function calculateCartTotals() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryCharge = subtotal >= 500 ? 0 : 50;
    let discount = 0;
    
    if (today.getDay() === 5) {
        discount = Math.round(subtotal * 0.2);
    }
    
    const taxAmount = 0; // No tax for now
    const serviceCharge = 0; // No service charge
    const amount = subtotal - discount;
    const total = amount + deliveryCharge + taxAmount + serviceCharge;
    
    return {
        subtotal,
        deliveryCharge,
        discount,
        taxAmount,
        serviceCharge,
        amount,
        total
    };
}

function updateEsewaFields() {
    // This function now just updates the cart UI since eSewa fields are handled by the backend
    const totals = calculateCartTotals();
    
    // Update summary fields if they exist
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryDelivery = document.getElementById('summaryDelivery');
    const summaryDiscount = document.getElementById('summaryDiscount');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (summarySubtotal) summarySubtotal.textContent = `Rs. ${totals.subtotal}`;
    if (summaryDelivery) summaryDelivery.textContent = `Rs. ${totals.deliveryCharge}`;
    if (summaryDiscount) summaryDiscount.textContent = `- Rs. ${totals.discount}`;
    if (summaryTotal) summaryTotal.textContent = `Rs. ${totals.total}`;
}

function validateCheckout() {
    // Validate cart is not empty
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return false;
    }
    
    // Validate location is selected
    if (!selectedLocation.district && !selectedLocation.coordinates) {
        showNotification('Please select a delivery location!');
        return false;
    }
    
    return true;
}

async function proceedToCheckout() {
    // Validate before proceeding
    if (!validateCheckout()) {
        return;
    }
    
    try {
        // Show loading notification
        showNotification('Preparing payment...');
        
        const totals = calculateCartTotals();
        const paymentData = {
            cart: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                qty: item.quantity,
                image: item.image
            })),
            location: selectedLocation,
            delivery_speed: document.querySelector('input[name="cartDelivery"]:checked')?.value || 'express',
            promo_code: document.getElementById('promoInput')?.value || ''
        };
        
        // Call Flask backend to initiate payment
        const response = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
            throw new Error(`Payment initiation failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Store order details for reference
            localStorage.setItem('pendingOrder', JSON.stringify({
                ...paymentData,
                transaction_uuid: result.transaction_uuid,
                timestamp: new Date().toISOString()
            }));
            
            // Create and submit eSewa form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = result.payment_url;
            
            // Add all eSewa fields
            for (const [key, value] of Object.entries(result.esewa_data)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            }
            
            document.body.appendChild(form);
            
            showNotification('Redirecting to eSewa payment gateway...');
            setTimeout(() => {
                form.submit();
            }, 500);
        } else {
            throw new Error(result.error || 'Payment initiation failed');
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification(`Payment error: ${error.message}`, 'error');
    }
}

function addMessage(text, isUser) {
    if (!elements.messageContent) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'admin'}`;
    messageDiv.innerHTML = `<p>${text}</p>`;
    elements.messageContent.appendChild(messageDiv);
    elements.messageContent.scrollTop = elements.messageContent.scrollHeight;
}

function sendMessage() {
    if (!elements.messageInput) return;
    
    const message = elements.messageInput.value.trim();
    if (message) {
        addMessage(message, true);
        elements.messageInput.value = '';
        
        setTimeout(() => {
            const responses = [
                "Thanks for your message! How can I assist you?",
                "We'll look into your query and get back to you shortly.",
                "Is there anything specific you'd like to know about our products?",
                "Our delivery time is usually within 30 minutes for Koteshwor-32.",
                "We offer free delivery for orders above Rs. 500.",
                "All our products are fresh and of the highest quality!",
                "You can track your order status in real-time.",
                "We accept cash on delivery and online payments."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessage(randomResponse, false);
        }, 1000);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
        max-width: 300px;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
            @keyframes bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

let currentSlide = 0;
let slideInterval;

function initSlider() {
    if (!elements.heroSlider) return;
    
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement('div');
        dot.className = i === 0 ? 'dot active' : 'dot';
        dot.addEventListener('click', () => goToSlide(i));
        elements.sliderDots.appendChild(dot);
    }
    
    if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', prevSlide);
    }
    
    if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', nextSlide);
    }
    
    startSlideShow();
    
    elements.heroSlider.addEventListener('mouseenter', stopSlideShow);
    elements.heroSlider.addEventListener('mouseleave', startSlideShow);
}

function showSlide(n) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;
    
    if (n >= slides.length) currentSlide = 0;
    if (n < 0) currentSlide = slides.length - 1;
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide--;
    showSlide(currentSlide);
}

function goToSlide(n) {
    currentSlide = n;
    showSlide(currentSlide);
}

function startSlideShow() {
    slideInterval = setInterval(() => {
        nextSlide();
    }, 4000);
}

function stopSlideShow() {
    clearInterval(slideInterval);
}

function scrollToProducts() {
    const productContainer = document.getElementById('productContainer');
    if (productContainer) {
        productContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function initCartPage() {
    if (!window.location.pathname.includes('cart')) return;
    
    renderCartPage();
    updateEsewaFields();
}

function renderCartPage() {
    const emptyMessage = document.getElementById('emptyCartMessage');
    const cartItemsList = document.getElementById('cartItemsList');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryDelivery = document.getElementById('summaryDelivery');
    const summaryDiscount = document.getElementById('summaryDiscount');
    const summaryTotal = document.getElementById('summaryTotal');
    const discountBadge = document.getElementById('discountBadge');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItemsList) return;
    
    if (cart.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        cartItemsList.style.display = 'none';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    cartItemsList.style.display = 'flex';
    
    cartItemsList.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item-card';
        cartItem.innerHTML = `
            <div class="cart-item-img">
                <img src="/static/images/kirana/${item.image}.jpg" alt="${item.name}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'%3E%3Crect fill=\\'%23f0f0f0\\' width=\\'100\\' height=\\'100\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23999\\' font-size=\\'12\\'%3EProduct%3C/text%3E%3C/svg%3E'" />
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">Rs. ${item.price}</div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <div class="qty-display">${item.quantity}</div>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="remove-item-btn" onclick="removeFromCart(${item.id})" title="Remove from cart">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        cartItemsList.appendChild(cartItem);
    });
    
    const totals = calculateCartTotals();
    
    if (totals.discount > 0) {
        if (discountBadge) {
            discountBadge.textContent = '20% OFF';
            discountBadge.style.display = 'inline-block';
        }
    } else {
        if (discountBadge) {
            discountBadge.style.display = 'none';
        }
    }
    
    if (summarySubtotal) summarySubtotal.textContent = `Rs. ${totals.subtotal}`;
    if (summaryDelivery) summaryDelivery.textContent = `Rs. ${totals.deliveryCharge}`;
    if (summaryDiscount) summaryDiscount.textContent = `- Rs. ${totals.discount}`;
    if (summaryTotal) summaryTotal.textContent = `Rs. ${totals.total}`;
    
    // Enable/disable checkout based on location
    if (checkoutBtn) {
        checkoutBtn.disabled = !(selectedLocation.district || selectedLocation.coordinates);
    }
}

function applyPromo() {
    const promoInput = document.getElementById('promoInput');
    if (!promoInput) return;
    
    const code = promoInput.value.trim().toUpperCase();
    
    if (code === 'SAVE10') {
        showNotification('Promo code applied! 10% discount added.');
    } else if (code === 'FREESHIP') {
        showNotification('Promo code applied! Free shipping added.');
    } else if (code) {
        showNotification('Invalid promo code.');
    }
    
    promoInput.value = '';
}

// Location Selector Functions
function setupLocationSelectors() {
    const districtSelect = document.getElementById('districtSelect');
    const areaSelect = document.getElementById('areaSelect');
    const mapBtn = document.getElementById('mapBtn');
    const mapModal = document.getElementById('mapModal');
    const closeMapModal = document.getElementById('closeMapModal');
    const confirmLocationBtn = document.getElementById('confirmLocationBtn');
    
    if (districtSelect) {
        districtSelect.addEventListener('change', function() {
            const district = this.value;
            areaSelect.innerHTML = '<option value="">Select Area</option>';
            
            if (district && areas[district]) {
                areaSelect.disabled = false;
                areas[district].forEach(area => {
                    const option = document.createElement('option');
                    option.value = area.toLowerCase().replace(/\s+/g, '-');
                    option.textContent = area;
                    areaSelect.appendChild(option);
                });
            } else {
                areaSelect.disabled = true;
            }
            
            updateSelectedLocation();
        });
    }
    
    if (areaSelect) {
        areaSelect.addEventListener('change', updateSelectedLocation);
    }
    
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            mapModal.style.display = 'block';
            setTimeout(initMap, 100);
        });
    }
    
    if (closeMapModal) {
        closeMapModal.addEventListener('click', () => {
            mapModal.style.display = 'none';
        });
    }
    
    if (confirmLocationBtn) {
        confirmLocationBtn.addEventListener('click', confirmMapLocation);
    }
    
    if (mapModal) {
        window.addEventListener('click', (e) => {
            if (e.target === mapModal) {
                mapModal.style.display = 'none';
            }
        });
    }
}

function updateSelectedLocation() {
    const districtSelect = document.getElementById('districtSelect');
    const areaSelect = document.getElementById('areaSelect');
    const selectedLocationDiv = document.getElementById('selectedLocation');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!districtSelect || !areaSelect) return;
    
    const district = districtSelect.options[districtSelect.selectedIndex].text;
    const area = areaSelect.options[areaSelect.selectedIndex].text;
    
    if (districtSelect.value && areaSelect.value) {
        selectedLocation.district = districtSelect.value;
        selectedLocation.area = areaSelect.value;
        selectedLocation.fullAddress = `${area}, ${district}`;
        
        selectedLocationDiv.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--secondary);"></i>
            <span><strong>${selectedLocation.fullAddress}</strong></span>
        `;
        
        if (cart && cart.length > 0) {
            checkoutBtn.disabled = false;
        }
    } else {
        selectedLocation.district = '';
        selectedLocation.area = '';
        selectedLocation.fullAddress = '';
        
        selectedLocationDiv.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>Please select your delivery location</span>
        `;
        
        checkoutBtn.disabled = true;
    }
}

function initMap() {
    if (map) {
        map.remove();
    }
    
    const kathmanduCenter = [27.7172, 85.3240];
    map = L.map('map').setView(kathmanduCenter, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    map.on('click', function(e) {
        if (marker) {
            map.removeLayer(marker);
        }
        
        marker = L.marker(e.latlng).addTo(map);
        mapSelectedCoords = e.latlng;
        
        document.getElementById('mapSelectedLocation').textContent = 
            `Latitude: ${e.latlng.lat.toFixed(6)}, Longitude: ${e.latlng.lng.toFixed(6)}`;
    });
}

function confirmMapLocation() {
    if (mapSelectedCoords) {
        selectedLocation.coordinates = mapSelectedCoords;
        selectedLocation.fullAddress = `Custom Location (${mapSelectedCoords.lat.toFixed(4)}, ${mapSelectedCoords.lng.toFixed(4)})`;
        selectedLocation.district = 'custom';
        
        document.getElementById('selectedLocation').innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--secondary);"></i>
            <span><strong>${selectedLocation.fullAddress}</strong></span>
        `;
        
        document.getElementById('mapModal').style.display = 'none';
        
        if (cart && cart.length > 0) {
            document.getElementById('checkoutBtn').disabled = false;
        }
        
        showNotification('Location selected successfully!');
    } else {
        showNotification('Please click on the map to select a location');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.style.objectFit = 'contain';
            this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16' font-family='Arial'%3ENo Image%3C/text%3E%3C/svg%3E";
        });
    });
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.proceedToCheckout = proceedToCheckout;
window.scrollToProducts = scrollToProducts;
window.applyPromo = applyPromo;