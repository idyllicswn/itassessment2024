const MENU = [
    { id: 1, name: 'Margherita', price: 500, img: 'margherita.jpg' },
    { id: 2, name: 'Pepperoni', price: 650, img: 'pepperoni.jpg' },
    { id: 3, name: 'Veggie Delight', price: 600, img: 'veggie.jpg' },
    { id: 4, name: 'BBQ Chicken', price: 750, img: 'bbq.jpg' },
    { id: 5, name: 'Hawaiian', price: 700, img: 'hawaiian.jpg' },
    { id: 6, name: 'Paneer Tikka', price: 680, img: 'paneertikka.jpg' },
    { id: 7, name: 'Coke 500 ml', price: 120, img: 'coke.jpg' },
    { id: 8, name: 'Sprite 500 ml', price: 120, img: 'sprite.jpg' },
    { id: 9, name: 'Chocolate Lava Cake', price: 280, img: 'cake.jpg' },
    { id: 10, name: 'Vanilla Ice‑Cream Cup', price: 150, img: 'icecream.jpg' },

];
const DELIVERY_FEE = 100;  
const READY_MINUTES = 30;   


function qs(sel, scope = document) { return scope.querySelector(sel); }
function qsa(sel, scope = document) { return [...scope.querySelectorAll(sel)]; }

// Discount check (30 % off on Friday/Saturday)
const day = new Date().getDay();   
const isDiscountDay = day === 5 || day === 6;

function getPrice(item) {
    return isDiscountDay ? Math.round(item.price * 0.7) : item.price;
}


let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)) }

function addToCart(id) {
    const found = cart.find(c => c.id === id);
    if (found) { found.qty += 1; } else { cart.push({ id, qty: 1 }); }
    saveCart();
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    saveCart();
    renderCart();
}

function cartTotal() {
    let total = cart.reduce((sum, it) => {
        const prod = MENU.find(m => m.id === it.id);
        return sum + getPrice(prod) * it.qty;
    }, 0);

    
    const delivType = qs('input[name="deliveryType"]:checked')?.value;
    if (delivType === 'delivery') total += DELIVERY_FEE;
    return total;
}

function renderCart() {
    const list = qs('#cartList');
    if (!list) return; 
    list.innerHTML = '';
    cart.forEach(it => {
        const prod = MENU.find(m => m.id === it.id);
        const li = document.createElement('li');
        li.innerHTML = `${prod.name} x${it.qty} <span>Rs ${getPrice(prod) * it.qty}</span>`;
        list.appendChild(li);
    });
    qs('#cartTotal').textContent = `Total: Rs ${cartTotal()}`;
}

qsa('input[name="deliveryType"]').forEach(r =>
    r.addEventListener('change', () =>
        qs('#cartTotal').textContent = `Total: Rs ${cartTotal()}`
    )
);



function renderMenu() {
    const wrap = qs('#menuItems');
    if (!wrap) return;
    MENU.forEach(item => {
        const price = getPrice(item);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<img src="images/${item.img}" alt="${item.name}"><h3>${item.name}</h3><p>Rs ${price}${isDiscountDay ? '<small class="strike"> Rs ' + item.price + '</small>' : ''}</p><button data-id="${item.id}">Add to Cart</button>`;
        wrap.appendChild(card);
    });
    wrap.addEventListener('click', e => {
        if (e.target.matches('button[data-id]')) {
            addToCart(+e.target.dataset.id);
        }
    });
}


function setupBuy() {
    const buyBtn = qs('#buyBtn');
    if (!buyBtn) return;
    buyBtn.addEventListener('click', () => {
        if (!cart.length) { alert('Cart is empty!'); return; }
        if (!confirm('Is your order confirm?')) return;
        showReceipt();
    });
}

function showReceipt() {
    const modal = qs('#receiptModal');
    const details = qs('#receiptDetails');
    const deliv = qs('input[name="deliveryType"]:checked').value;

   
    details.innerHTML = '<ul>' + cart.map(it => {
        const p = MENU.find(m => m.id === it.id);
        return `<li>${p.name} x${it.qty} – Rs ${getPrice(p) * it.qty}</li>`;
    }).join('') + '</ul>';

    
    if (deliv === 'pickup') {
        const ready = new Date(Date.now() + READY_MINUTES * 60_000)
            .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        details.innerHTML += `<p>🛍️ Your order will be **ready for pick‑up by ${ready}**. See you soon!</p>`;
    } else {
        details.innerHTML += `<p>🚚 Your order is on its way! (Delivery fee Rs ${DELIVERY_FEE})</p>`;
    }

   
    details.innerHTML += `<p><strong>Total: Rs ${cartTotal()}</strong></p>`;
    modal.classList.remove('hidden');
}


function modalLogic() {
    const modal = qs('#receiptModal');
    if (!modal) return;
    modal.addEventListener('click', e => {
        if (e.target.matches('.close')) modal.classList.add('hidden');
        if (e.target.matches('.pay')) {
            qs('#thankYouMsg').classList.remove('hidden');
            cart = []; saveCart(); renderCart();
        }
    });
}

// ========== Reviews ==========
function starMarkup(selected = 0) {
    return Array.from({ length: 5 }, (_, i) => `<span class="star ${i < selected ? 'selected' : ''}" data-val="${i + 1}">★</span>`).join('');
}

function setupStars() {
    const starGroup = qs('#starGroup');
    if (!starGroup) return;
    starGroup.innerHTML = starMarkup();
    starGroup.addEventListener('click', e => {
        if (e.target.matches('.star')) {
            const val = +e.target.dataset.val;
            starGroup.innerHTML = starMarkup(val);
            starGroup.dataset.rating = val;
        }
    });
}

function loadReviews() {
    const list = qs('#reviewList');
    if (!list) return;
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    list.innerHTML = reviews.map(r =>
        `<li>
    <div>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
    <p><strong>${r.name}</strong> – ${r.comment}</p>
  </li>`
    ).join('');
}

function setupReviewForm() {
    const form = qs('#reviewForm');
    if (!form) return;
    form.addEventListener('submit', e => {
        e.preventDefault();
        const rating = +qs('#starGroup').dataset.rating || 0;
        if (rating === 0) { alert('Please give a rating'); return; }
        const rev = { name: qs('#revName').value, rating, comment: qs('#revComment').value };
        const revs = JSON.parse(localStorage.getItem('reviews') || '[]');
        revs.push(rev);
        localStorage.setItem('reviews', JSON.stringify(revs));
        form.reset(); qs('#starGroup').innerHTML = starMarkup();
        loadReviews();
    });
}

// ========== Contact Validation ==========
function contactValidation() {
    const cform = qs('#contactForm');
    if (!cform) return;
    cform.addEventListener('submit', e => {
        e.preventDefault();
        alert('Thanks for reaching out! We will reply soon.');
        cform.reset();
    });
}


document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    renderCart();
    setupBuy();
    modalLogic();
    setupStars();
    loadReviews();
    setupReviewForm();
    contactValidation();
});

