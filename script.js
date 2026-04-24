import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCf6_DCNSh4a3IiOtTv5Uf_N8YaxQtBczw",
    authDomain: "loja-a33e1.firebaseapp.com",
    databaseURL: "https://loja-a33e1-default-rtdb.firebaseio.com",
    projectId: "loja-a33e1",
    storageBucket: "loja-a33e1.firebasestorage.app",
    messagingSenderId: "304798626706",
    appId: "1:304798626706:web:23a0672e6a98ae432c474b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let cart = [];
let products = [];

// CARREGAR PRODUTOS DO FIREBASE
onValue(ref(db, 'produtos'), (snap) => {
    const data = snap.val();
    const grid = document.getElementById('product-grid');
    const admList = document.getElementById('adm-product-list');
    grid.innerHTML = ''; admList.innerHTML = '';
    products = [];

    for (let id in data) {
        const p = { id, ...data[id] };
        products.push(p);
        const outOfStock = p.stock <= 0;

        // Renderização na Loja
        grid.innerHTML += `
            <div class="box-loja" style="${outOfStock ? 'opacity:0.6' : ''}">
                <div class="led-frete">Frete Grátis - Chega amanhã 🚚</div>
                <img src="${p.img}" onclick="window.zoomImg('${p.img}')">
                <div class="info">
                    <div class="p-title">${p.title}</div>
                    <div class="p-price">${outOfStock ? 'ESGOTADO' : 'R$ '+parseFloat(p.price).toFixed(2)}</div>
                    <button class="btn-details" onclick="window.showDetails('${p.id}')">DETALHES DO PRODUTO</button>
                    <button class="btn-add" onclick="window.addToCart('${p.id}')" ${outOfStock ? 'disabled' : ''}>ADICIONAR AO CARRINHO</button>
                </div>
            </div>`;

        // Renderização no ADM (Com campo de LINK de imagem adicionado)
        admList.innerHTML += `
            <div class="adm-row" style="display: flex; gap: 5px; align-items: center; margin-bottom: 10px; background: #f9f9f9; padding: 10px; border-radius: 5px;">
                <img src="${p.img}" style="width:40px; height: 40px; object-fit: cover; border-radius: 4px;">
                <input type="text" id="et-${id}" value="${p.title}" title="Título" style="flex: 2;">
                <input type="text" id="ep-${id}" value="${p.price}" title="Preço" style="flex: 1; width: 70px;">
                <input type="number" id="es-${id}" value="${p.stock}" title="Estoque" style="width: 60px;">
                <input type="text" id="ei-${id}" value="${p.img}" title="Link da Imagem" style="flex: 2;" placeholder="URL da Imagem">
                <button onclick="window.quickSave('${id}')" style="background: #27ae60; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">💾</button>
                <button onclick="window.deleteProduct('${id}')" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">🗑️</button>
            </div>`;
    }
});

// QUICK SAVE (Agora salva o LINK da imagem também)
window.quickSave = (id) => {
    const updates = {
        title: document.getElementById('et-' + id).value,
        price: parseFloat(document.getElementById('ep-' + id).value.toString().replace(',', '.')),
        stock: parseInt(document.getElementById('es-' + id).value),
        img: document.getElementById('ei-' + id).value // Captura o novo link da imagem
    };

    update(ref(db, 'produtos/' + id), updates)
    .then(() => alert("Produto atualizado com sucesso!"))
    .catch((error) => alert("Erro ao atualizar: " + error));
};

// DELETAR PRODUTO
window.deleteProduct = (id) => {
    if(confirm("Tem certeza que deseja excluir este produto permanentemente?")) {
        remove(ref(db, 'produtos/' + id));
    }
};

// CARRINHO LÓGICA
window.addToCart = (id) => {
    const p = products.find(x => x.id === id);
    const inCart = cart.find(x => x.id === id);
    if(inCart) inCart.qtd++; else cart.push({...p, qtd: 1});
    updateCartUI();
};

window.updateCartUI = () => {
    const list = document.getElementById('cart-items-list');
    let total = 0, count = 0;
    list.innerHTML = '';
    cart.forEach((item, idx) => {
        total += item.price * item.qtd;
        count += item.qtd;
        list.innerHTML += `
            <div class="cart-item-row">
                <img src="${item.img}">
                <div style="flex:1">
                    <div style="font-weight:bold; font-size:12px;">${item.title}</div>
                    <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                        <button onclick="window.changeQtd(${idx}, -1)">-</button>
                        <span>${item.qtd}</span>
                        <button onclick="window.changeQtd(${idx}, 1)">+</button>
                    </div>
                </div>
                <div style="color:var(--shopee-orange); font-weight:bold;">R$ ${(item.price * item.qtd).toFixed(2)}</div>
            </div>`;
    });
    document.getElementById('cart-total').innerText = 'R$ ' + total.toFixed(2);
    document.getElementById('badge-count').innerText = count;
};

window.changeQtd = (idx, val) => {
    cart[idx].qtd += val;
    if(cart[idx].qtd <= 0) cart.splice(idx, 1);
    updateCartUI();
};

window.finalizeOrder = () => {
    const u = {
        n: document.getElementById('u_nome').value,
        r: document.getElementById('u_rua').value,
        b: document.getElementById('u_bairro').value,
        p: document.getElementById('u_pag').value,
        t: document.getElementById('u_troco').value,
        o: document.getElementById('u_obs').value
    };
    if(!u.n || cart.length === 0) return alert("Preencha os dados!");

    localStorage.setItem('rn_shop_user', JSON.stringify(u));

    let msg = `*PEDIDO RIO NEGRINHO SHOP*\n\n*Cliente:* ${u.n}\n*Endereço:* ${u.r}, ${u.b}\n*Pagamento:* ${u.p}${u.t ? ' (Troco: '+u.t+')' : ''}\n\n*ITENS:*\n`;
    let total = 0;
    cart.forEach(i => {
        msg += `• ${i.qtd}x ${i.title} - R$ ${(i.price * i.qtd).toFixed(2)}\n`;
        total += i.price * i.qtd;
        update(ref(db, 'produtos/'+i.id), { stock: i.stock - i.qtd });
    });
    msg += `\n*TOTAL: R$ ${total.toFixed(2)}*`;
    window.open(`https://wa.me/5547988771313?text=${encodeURIComponent(msg)}`);
};

// DRAGGABLE FLUTUANTE
const dragItem = document.getElementById("cart-float");
let active = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

dragItem.addEventListener("touchstart", (e) => {
    initialX = e.touches[0].clientX - xOffset;
    initialY = e.touches[0].clientY - yOffset;
    active = true;
}, false);

document.addEventListener("touchend", () => active = false, false);

document.addEventListener("touchmove", (e) => {
    if (active) {
        e.preventDefault();
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
        xOffset = currentX; yOffset = currentY;
        dragItem.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
}, {passive: false});

dragItem.onclick = () => { if(!active) toggleCart(true); };

// UTILITÁRIOS
window.toggleCart = (st) => document.getElementById('cart-sidebar').classList.toggle('active', st);
window.zoomImg = (src) => { document.getElementById('zoomImg').src = src; document.getElementById('zoomLayer').style.display='flex'; };
window.showDetails = (id) => {
    const p = products.find(x => x.id === id);
    document.getElementById('modal-title').innerText = p.title;
    document.getElementById('modal-desc').innerText = p.desc;
    document.getElementById('modalDetails').style.display = 'flex';
};
window.closeModal = () => document.getElementById('modalDetails').style.display = 'none';
window.checkTroco = (v) => document.getElementById('u_troco').style.display = v === 'Dinheiro' ? 'block' : 'none';
window.enterAdmin = () => { if(prompt("Senha:") === "848218") document.getElementById('admin-panel').style.display='block'; };
window.exitAdmin = () => document.getElementById('admin-panel').style.display='none';

window.saveNewProduct = () => {
    const p = {
        title: document.getElementById('p_title').value,
        price: parseFloat(document.getElementById('p_price').value.toString().replace(',', '.')),
        img: document.getElementById('p_img').value,
        stock: parseInt(document.getElementById('p_stock').value),
        desc: document.getElementById('p_desc').value
    };
    push(ref(db, 'produtos'), p).then(() => {
        alert("Salvo!");
        // Limpa os campos após salvar
        document.getElementById('p_title').value = '';
        document.getElementById('p_price').value = '';
        document.getElementById('p_img').value = '';
        document.getElementById('p_stock').value = '';
        document.getElementById('p_desc').value = '';
    });
};

// AUTO-FILL COOKIES
const saved = JSON.parse(localStorage.getItem('rn_shop_user') || '{}');
if(saved.n){
    document.getElementById('u_nome').value = saved.n;
    document.getElementById('u_rua').value = saved.r;
    document.getElementById('u_bairro').value = saved.b;
}