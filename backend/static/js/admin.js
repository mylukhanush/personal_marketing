const API_URL = window.location.origin;
let token = localStorage.getItem('adminToken');
let editingProductId = null;

const loginModal = document.getElementById('loginModal');
const dashboardView = document.getElementById('dashboardView');
const logoutBtn = document.getElementById('logoutBtn');
const productModal = document.getElementById('productModal');

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    document.getElementById('openAddModalBtn').addEventListener('click', () => openModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('productForm').addEventListener('submit', handleSaveProduct);
    
    document.getElementById('productImage').addEventListener('change', previewImage);
});

function checkAuth() {
    if (token) {
        loginModal.classList.remove('active');
        dashboardView.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        fetchAdminProducts();
    } else {
        loginModal.classList.add('active');
        dashboardView.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) throw new Error('Invalid credentials');
        
        const data = await response.json();
        token = data.access_token;
        localStorage.setItem('adminToken', token);
        checkAuth();
    } catch (error) {
        alert(error.message);
    }
}

function handleLogout() {
    token = null;
    localStorage.removeItem('adminToken');
    checkAuth();
}

async function fetchAdminProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    document.getElementById('loader').classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        renderAdminProducts(products);
    } catch (error) {
        console.error(error);
    } finally {
        document.getElementById('loader').classList.add('hidden');
    }
}

function renderAdminProducts(products) {
    const grid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No products yet. Add your first product!</p>';
        return;
    }
    
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const imgUrl = p.image_url ? `${API_URL}${p.image_url}` : 'https://via.placeholder.com/300x250?text=No+Image';
        
        card.innerHTML = `
            <img src="${imgUrl}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <p class="product-desc">${p.description || ''}</p>
                <div class="product-footer">
                    <span class="product-price">₹${p.price.toFixed(2)}</span>
                </div>
                <div class="admin-actions" style="margin-top: 15px;">
                    <button class="btn edit-btn" style="flex: 1; background: #f59e0b;">Edit</button>
                    <button class="btn btn-danger del-btn" style="flex: 1;">Delete</button>
                </div>
            </div>
        `;
        
        card.querySelector('.edit-btn').addEventListener('click', () => openModal(p));
        card.querySelector('.del-btn').addEventListener('click', () => deleteProduct(p.id));
        
        grid.appendChild(card);
    });
}

function previewImage(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    }
}

function openModal(product = null) {
    editingProductId = product ? product.id : null;
    document.getElementById('modalTitle').innerText = product ? 'Edit Product' : 'Add Product';
    document.getElementById('productId').value = product ? product.id : '';
    document.getElementById('productName').value = product ? product.name : '';
    document.getElementById('productPrice').value = product ? product.price : '';
    document.getElementById('productDesc').value = product ? product.description || '' : '';
    document.getElementById('productImage').value = '';
    
    const preview = document.getElementById('imagePreview');
    if (product && product.image_url) {
        preview.src = `${API_URL}${product.image_url}`;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
    
    productModal.classList.add('active');
}

function closeModal() {
    productModal.classList.remove('active');
}

async function handleSaveProduct(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('productName').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('description', document.getElementById('productDesc').value);
    
    const fileInput = document.getElementById('productImage');
    if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const url = editingProductId ? `${API_URL}/products/${editingProductId}` : `${API_URL}/products`;
        const method = editingProductId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            if (response.status === 401) handleLogout();
            throw new Error('Failed to save product');
        }
        
        closeModal();
        fetchAdminProducts();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        fetchAdminProducts();
    } catch (error) {
        alert(error.message);
    }
}
