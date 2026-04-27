/**
 * Restaurant Order Dashboard - Kitchen Display System
 * TODO: Implement the missing functions below
 * 
 * SELLING POINTS:
 * - Real-time order tracking
 * - Kitchen display system
 * - Simple status workflow
 * - LocalStorage persistence
 * - Revenue tracking
 */

// ========================================
// DOM Elements
// ========================================

const ordersGrid = document.getElementById('ordersGrid');
const totalOrdersSpan = document.getElementById('totalOrders');
const activeOrdersSpan = document.getElementById('activeOrders');
const revenueSpan = document.getElementById('revenue');
const settingsBtn = document.getElementById('settingsBtn');
const demoDataBtn = document.getElementById('demoDataBtn');
const settingsModal = document.getElementById('settingsModal');
const orderModal = document.getElementById('orderModal');
const settingsForm = document.getElementById('settingsForm');
const restaurantNameSpan = document.getElementById('restaurantName');
const restaurantNameInput = document.getElementById('restaurantNameInput');
const prepTimeInput = document.getElementById('prepTime');
const currencySelect = document.getElementById('currency');
const tabButtons = document.querySelectorAll('.tab-btn');
const modalCloseButtons = document.querySelectorAll('.modal-close');

// ========================================
// Application State
// ========================================

let orders = [];
let currentFilter = 'all';
let nextOrderId = 1;

// Restaurant settings
let restaurantSettings = {
    name: "Joe's Pizza",
    prepTime: 15,
    currency: '$'
};

// ========================================
// Customer Context - Add at top of script.js
// ========================================

// Get customer ID from URL or set default
function getCustomerId() {
    // Option 1: From URL (e.g., /joes-pizza)
    const path = window.location.pathname;
    const customerMatch = path.match(/\/([^\/]+)\/dashboard/);
    if (customerMatch) return customerMatch[1];
    
    // Option 2: From localStorage
    const saved = localStorage.getItem('currentCustomer');
    if (saved) return saved;
    
    // Option 3: Default for demo
    return 'demo';
}

// All localStorage keys should be customer-specific
function getStorageKey(baseKey) {
    const customerId = getCustomerId();
    return `${customerId}_${baseKey}`;
}

// Override your save/load functions
function saveToLocalStorage() {
    localStorage.setItem(getStorageKey('orders'), JSON.stringify(orders));
    localStorage.setItem(getStorageKey('settings'), JSON.stringify(restaurantSettings));
    localStorage.setItem(getStorageKey('nextOrderId'), JSON.stringify(nextOrderId));
}

function loadFromLocalStorage() {
    const savedOrders = localStorage.getItem(getStorageKey('orders'));
    const savedSettings = localStorage.getItem(getStorageKey('settings'));
    const savedNextOrderId = localStorage.getItem(getStorageKey('nextOrderId'));
    
    if (savedOrders) orders = JSON.parse(savedOrders);
    if (savedSettings) restaurantSettings = JSON.parse(savedSettings);
    if (savedNextOrderId) nextOrderId = JSON.parse(savedNextOrderId);
    
    applySettings();
}

// ========================================
// Helper: Close Modal
// ========================================
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ========================================
// Helper: Show Modal
// ========================================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

// ========================================
// TODO 1: Generate Order ID
// ========================================
function generateOrderNumber() {
    const orderNumber = nextOrderId.toString().padStart(3, '0');
    nextOrderId++;
    return `ORD-${orderNumber}`;
}

// ========================================
// TODO 2: Create New Order
// ========================================
function createOrder(orderData) {
    // Calculate total from items if not provided
    let total = orderData.total;
    if (!total && orderData.items) {
        total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    const newOrder = {
        id: Date.now(), // Use timestamp for unique ID
        orderNumber: generateOrderNumber(),
        customerName: orderData.customerName,
        items: orderData.items,
        total: total,
        status: 'pending',
        timestamp: new Date().toISOString(),
        statusTimestamps: {
            pending: new Date().toISOString()
        },
        estimatedReadyTime: calculateEstimatedReadyTime(restaurantSettings.prepTime)
    };
    orders.push(newOrder);
    return newOrder;
}

// ========================================
// TODO 3: Add Sample/Demo Orders
// ========================================
function addDemoOrders() {
    const demoOrders = [
        {
            customerName: 'Alice Johnson',
            items: [
                { name: 'Margherita Pizza', price: 15.99, quantity: 1 },
                { name: 'Garlic Bread', price: 4.99, quantity: 2 },
                { name: 'Coca Cola', price: 2.50, quantity: 2 }
            ]
        },
        {
            customerName: 'Bob Smith',
            items: [
                { name: 'Pepperoni Pizza', price: 17.99, quantity: 1 },
                { name: 'Caesar Salad', price: 8.99, quantity: 1 },
                { name: 'Sparkling Water', price: 3.00, quantity: 1 }
            ]
        },
        {
            customerName: 'Carol Davis',
            items: [
                { name: 'Veggie Pizza', price: 16.99, quantity: 1 },
                { name: 'Buffalo Wings', price: 11.99, quantity: 1 },
                { name: 'French Fries', price: 4.99, quantity: 1 }
            ]
        },
        {
            customerName: 'David Wilson',
            items: [
                { name: 'Meat Lovers Pizza', price: 19.99, quantity: 1 },
                { name: 'Onion Rings', price: 5.99, quantity: 1 },
                { name: 'Milkshake', price: 5.50, quantity: 1 }
            ]
        },
        {
            customerName: 'Emma Brown',
            items: [
                { name: 'Hawaiian Pizza', price: 16.99, quantity: 1 },
                { name: 'Cheese Sticks', price: 6.99, quantity: 1 }
            ]
        }
    ];

    demoOrders.forEach(orderData => {
        createOrder(orderData);
    });
    
    saveToLocalStorage();
    renderOrders();
    updateStats();
}

// ========================================
// TODO 4: Update Order Status
// ========================================
function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        const oldStatus = order.status;
        order.status = newStatus;
        order.statusTimestamps = order.statusTimestamps || {};
        order.statusTimestamps[newStatus] = new Date().toISOString();
        
        // If moving to completed, add completed timestamp
        if (newStatus === 'completed') {
            order.completedAt = new Date().toISOString();
        }
        
        saveToLocalStorage();
        renderOrders();
        updateStats();
    }
}

// ========================================
// TODO 5: Calculate Estimated Ready Time
// ========================================
function calculateEstimatedReadyTime(prepTimeMinutes) {
    const now = new Date();
    const pendingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'ready').length;
    // Each pending order adds queue time
    const queueDelay = pendingOrders * prepTimeMinutes;
    const estimatedTime = new Date(now.getTime() + (prepTimeMinutes * 60000) + (queueDelay * 60000));
    return estimatedTime;
}

// ========================================
// TODO 6: Calculate Today's Revenue
// ========================================
function calculateTodayRevenue() {
    const today = new Date().toDateString();
    const completedOrders = orders.filter(o => {
        if (o.status !== 'completed') return false;
        const orderDate = new Date(o.timestamp).toDateString();
        return orderDate === today;
    });
    return completedOrders.reduce((total, order) => total + order.total, 0);
}

// ========================================
// TODO 7: Get Active Orders Count
// ========================================
function getActiveOrdersCount() {
    return orders.filter(o => o.status !== 'completed').length;
}

// ========================================
// TODO 8: Filter Orders by Status
// ========================================
function getFilteredOrders() {
    if (currentFilter === 'all') {
        return orders;
    } else {
        return orders.filter(o => o.status === currentFilter);
    }
}

// ========================================
// TODO 9: Render Orders Grid
// ========================================
function renderOrders() {
    const filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
        ordersGrid.innerHTML = `
            <div class="empty-state">
                <p>📭 No orders yet</p>
                <p class="empty-sub">Click "Load Demo Orders" to see examples</p>
            </div>
        `;
        return;
    }
    
    ordersGrid.innerHTML = filteredOrders.map(order => {
        const itemsList = order.items.map(item => 
            `<div class="order-item">
                <span>${item.quantity}x ${item.name}</span>
                <span>${restaurantSettings.currency}${(item.price * item.quantity).toFixed(2)}</span>
            </div>`
        ).join('');
        
        const statusClass = `status-${order.status}`;
        const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
        
        const estimatedTime = new Date(order.estimatedReadyTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Only show action buttons for non-completed orders
        const actionButtons = order.status !== 'completed' ? `
            <div class="order-actions">
                ${order.status === 'pending' ? `<button class="status-btn" onclick="updateOrderStatus(${order.id}, 'preparing')">👨‍🍳 Start Preparing</button>` : ''}
                ${order.status === 'preparing' ? `<button class="status-btn" onclick="updateOrderStatus(${order.id}, 'ready')">✅ Mark Ready</button>` : ''}
                ${order.status === 'ready' ? `<button class="status-btn" onclick="updateOrderStatus(${order.id}, 'completed')">🎉 Complete</button>` : ''}
                <button class="status-btn" onclick="showOrderDetails(${order.id})">📋 Details</button>
            </div>
        ` : `
            <div class="order-actions">
                <button class="status-btn" onclick="showOrderDetails(${order.id})">📋 View Receipt</button>
            </div>
        `;
        
        return `
            <div class="order-card" data-status="${order.status}">
                <div class="order-header">
                    <span class="order-number">${order.orderNumber}</span>
                    <span class="order-time">${new Date(order.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="order-customer">
                    <strong>${escapeHtml(order.customerName)}</strong>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-items">
                    ${itemsList}
                </div>
                <div class="order-total">
                    Total: ${restaurantSettings.currency}${order.total.toFixed(2)}
                </div>
                ${order.status !== 'completed' ? `<div class="order-estimate">⏱️ Est. ready: ${estimatedTime}</div>` : ''}
                ${actionButtons}
            </div>
        `;
    }).join('');
}

// ========================================
// TODO 10: Update Dashboard Stats
// ========================================
function updateStats() {
    totalOrdersSpan.textContent = orders.length;
    activeOrdersSpan.textContent = getActiveOrdersCount();
    revenueSpan.textContent = `${restaurantSettings.currency}${calculateTodayRevenue().toFixed(2)}`;
}

// ========================================
// TODO 11: Show Order Details Modal
// ========================================
function showOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const itemsList = order.items.map(item => 
        `<div class="order-item" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
            <span>${item.quantity}x ${item.name}</span>
            <span>${restaurantSettings.currency}${(item.price * item.quantity).toFixed(2)}</span>
        </div>`
    ).join('');
    
    const statusTimeline = Object.entries(order.statusTimestamps || {})
        .map(([status, time]) => {
            const statusEmoji = {
                pending: '⏳',
                preparing: '👨‍🍳',
                ready: '✅',
                completed: '🎉'
            }[status] || '📋';
            return `<div style="padding: 6px 0; border-left: 3px solid #e94560; padding-left: 12px; margin: 8px 0;">
                ${statusEmoji} <strong>${status.toUpperCase()}</strong> at ${new Date(time).toLocaleTimeString()}
            </div>`;
        }).join('');
    
    const detailHTML = `
        <div style="padding: 10px;">
            <h2 style="color: #e94560; margin-bottom: 10px;">${order.orderNumber}</h2>
            <p><strong>Customer:</strong> ${escapeHtml(order.customerName)}</p>
            <p><strong>Ordered:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            
            <h3 style="margin: 20px 0 10px 0;">Items</h3>
            ${itemsList}
            
            <div style="margin-top: 15px; padding-top: 10px; border-top: 2px solid #eee;">
                <strong>Total: ${restaurantSettings.currency}${order.total.toFixed(2)}</strong>
            </div>
            
            <h3 style="margin: 20px 0 10px 0;">Status Timeline</h3>
            ${statusTimeline}
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="printTicketById(${order.id})" class="status-btn" style="background: #2c3e50; color: white;">🖨️ Print Ticket</button>
                <button onclick="closeModal('orderModal')" class="status-btn">Close</button>
            </div>
        </div>
    `;
    
    const modalContent = orderModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = `
            <span class="modal-close">&times;</span>
            ${detailHTML}
        `;
        // Re-attach close event
        const newCloseBtn = modalContent.querySelector('.modal-close');
        if (newCloseBtn) {
            newCloseBtn.onclick = () => closeModal('orderModal');
        }
    } else {
        orderModal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                ${detailHTML}
            </div>
        `;
        const newCloseBtn = orderModal.querySelector('.modal-close');
        if (newCloseBtn) {
            newCloseBtn.onclick = () => closeModal('orderModal');
        }
    }
    
    showModal('orderModal');
}

// ========================================
// Print Ticket by ID
// ========================================
function printTicketById(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        printTicket(order);
    }
}

// ========================================
// TODO 12: Save to LocalStorage
// ========================================
function saveToLocalStorage() {
    localStorage.setItem('restaurant_orders', JSON.stringify(orders));
    localStorage.setItem('restaurant_settings', JSON.stringify(restaurantSettings));
    localStorage.setItem('restaurant_nextOrderId', JSON.stringify(nextOrderId));
}

// ========================================
// TODO 13: Load from LocalStorage
// ========================================
function loadFromLocalStorage() {
    const savedOrders = localStorage.getItem('restaurant_orders');
    const savedSettings = localStorage.getItem('restaurant_settings');
    const savedNextOrderId = localStorage.getItem('restaurant_nextOrderId');
    
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
    if (savedSettings) {
        restaurantSettings = JSON.parse(savedSettings);
    }
    if (savedNextOrderId) {
        nextOrderId = JSON.parse(savedNextOrderId);
    }
    applySettings();
}

// ========================================
// TODO 14: Update Restaurant Settings UI
// ========================================
function applySettings() {
    restaurantNameSpan.textContent = restaurantSettings.name;
    restaurantNameInput.value = restaurantSettings.name;
    prepTimeInput.value = restaurantSettings.prepTime;
    currencySelect.value = restaurantSettings.currency;
    renderOrders();
    updateStats();
}

// ========================================
// TODO 15: Handle Settings Save
// ========================================
function handleSettingsSave(e) {
    e.preventDefault();
    restaurantSettings.name = restaurantNameInput.value;
    restaurantSettings.prepTime = parseInt(prepTimeInput.value);
    restaurantSettings.currency = currencySelect.value;
    saveToLocalStorage();
    applySettings();
    closeModal('settingsModal');
}

// ========================================
// Escape HTML (Prevent XSS)
// ========================================
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========================================
// BONUS: Print Ticket Feature
// ========================================
function printTicket(order) {
    const itemsList = order.items.map(item => 
        `<tr>
            <td>${item.quantity}x</td>
            <td>${item.name}</td>
            <td>${restaurantSettings.currency}${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    ).join('');
    
    const printWindow = window.open('', '', 'width=400,height=500');
    printWindow.document.write(`
        <html>
            <head>
                <title>Kitchen Ticket - ${order.orderNumber}</title>
                <style>
                    body { font-family: monospace; padding: 20px; }
                    h1 { text-align: center; }
                    .ticket { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
                    table { width: 100%; }
                    th, td { text-align: left; padding: 5px; }
                    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 10px; }
                </style>
            </head>
            <body>
                <h1>${restaurantSettings.name}</h1>
                <p style="text-align: center">Kitchen Ticket</p>
                <div class="ticket">
                    <p><strong>Order #:</strong> ${order.orderNumber}</p>
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Time:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
                </div>
                <table>
                    <tr>
                        <th>Qty</th>
                        <th>Item</th>
                        <th>Price</th>
                    </tr>
                    ${itemsList}
                </table>
                <div class="total">
                    TOTAL: ${restaurantSettings.currency}${order.total.toFixed(2)}
                </div>
                <p style="text-align: center; margin-top: 30px;">Thank you!</p>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ========================================
// TODO 16: Set Up Event Listeners
// ========================================
function setupEventListeners() {
    // Settings button
    settingsBtn.addEventListener('click', () => {
        showModal('settingsModal');
    });
    
    // Demo data button
    demoDataBtn.addEventListener('click', () => {
        if (confirm('Load demo orders? This will replace any existing orders.')) {
            orders = [];
            nextOrderId = 1;
            addDemoOrders();
            saveToLocalStorage();
            renderOrders();
            updateStats();
        }
    });
    
    // Tab buttons
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active class
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Update filter
            currentFilter = btn.getAttribute('data-status');
            renderOrders();
        });
    });
    
    // Settings form
    settingsForm.addEventListener('submit', handleSettingsSave);
    
    // Modal close buttons
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal('settingsModal');
            closeModal('orderModal');
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeModal('settingsModal');
        }
        if (e.target === orderModal) {
            closeModal('orderModal');
        }
    });
}

// ========================================
// TODO 17: Initialize App
// ========================================
function init() {
    setupEventListeners();
    loadFromLocalStorage();
    
    if (orders.length === 0) {
        addDemoOrders();
    } else {
        renderOrders();
        updateStats();
    }
}

// Make functions global for onclick handlers
window.updateOrderStatus = updateOrderStatus;
window.showOrderDetails = showOrderDetails;
window.printTicketById = printTicketById;
window.closeModal = closeModal;

// Start the app
init();