const API_URL = window.location.origin;
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterProducts(e.target.value);
    });
});

async function fetchProducts() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    loader.classList.remove('hidden');
    grid.classList.add('hidden');
    noProducts.classList.add('hidden');

    try {
        const response = await fetch(`${API_URL}/products`);
        allProducts = await response.json();
        renderProducts(allProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        noProducts.innerText = 'Error loading products. Is the server running?';
        noProducts.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.classList.add('hidden');
        noProducts.classList.remove('hidden');
        return;
    }
    
    grid.classList.remove('hidden');
    noProducts.classList.add('hidden');

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const imgUrl = p.image_url ? `${API_URL}${p.image_url}` : 'https://via.placeholder.com/300x250?text=No+Image';
        
        card.innerHTML = `
            <img src="${imgUrl}" alt="${p.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <p class="product-desc">${p.description || 'No description available.'}</p>
                <div class="product-footer">
                    <span class="product-price">₹${p.price.toFixed(2)}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterProducts(query) {
    const q = query.toLowerCase();
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
    );
    renderProducts(filtered);
}
