async function apiGet(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function currency(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(v || 0);
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = '<div class="col-12"><div class="alert alert-warning">Produk belum tersedia.</div></div>';
    return;
  }

  grid.innerHTML = products
    .map((p) => `
      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card h-100 shadow-sm border-0">
          <div class="card-body d-flex flex-column">
            <span class="badge text-bg-primary align-self-start mb-2">${p.type || 'digital'}</span>
            <h5 class="card-title">${p.name}</h5>
            <p class="card-text text-muted small flex-grow-1">${p.description || '-'}</p>
            <div class="fw-bold fs-5 mb-3">${currency(p.price)}</div>
            <a class="btn btn-outline-primary w-100" href="/katalog/item?id=${p._id}">Lihat Detail</a>
          </div>
        </div>
      </div>`)
    .join('');
}

async function loadCatalog() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  try {
    const data = await apiGet('/api/products');
    const allProducts = data.data || [];
    renderProducts(allProducts);

    const input = document.getElementById('searchInput');
    if (input) {
      input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        const filtered = allProducts.filter((p) =>
          [p.name, p.description, p.type].join(' ').toLowerCase().includes(q)
        );
        renderProducts(filtered);
      });
    }
  } catch (error) {
    grid.innerHTML = '<div class="col-12"><div class="alert alert-danger">Gagal memuat katalog.</div></div>';
  }
}

async function loadDetail() {
  const mount = document.getElementById('detailPage');
  if (!mount) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    mount.innerHTML = '<div class="alert alert-warning">ID produk tidak valid.</div>';
    return;
  }

  try {
    const result = await apiGet('/api/products');
    const product = (result.data || []).find((p) => p._id === id);

    if (!product) {
      mount.innerHTML = '<div class="alert alert-warning">Produk tidak ditemukan.</div>';
      return;
    }

    mount.innerHTML = `
      <div class="row g-4">
        <div class="col-12 col-lg-8">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <span class="badge text-bg-primary mb-2">${product.type}</span>
              <h1 class="h3">${product.name}</h1>
              <p class="text-muted">${product.description}</p>
              <div class="fs-4 fw-bold">${currency(product.price)}</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-4">
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h2 class="h5">Checkout QRIS</h2>
              <form id="checkoutForm" class="d-grid gap-2">
                <input type="email" class="form-control" name="customerEmail" placeholder="Email aktif" required>
                <button class="btn btn-primary" type="submit">Bayar Sekarang</button>
              </form>
              <div id="checkoutResult" class="small mt-3"></div>
            </div>
          </div>
        </div>
      </div>`;

    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = new FormData(e.target).get('customerEmail');
      const out = document.getElementById('checkoutResult');
      out.innerHTML = 'Memproses pembayaran...';
      try {
        const r = await fetch('/api/orders/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product._id, customerEmail: email }),
        });
        const payload = await r.json();
        if (!r.ok) throw new Error(payload.message || 'Checkout gagal');
        out.innerHTML = `Invoice: <b>${payload.invoiceNo}</b><br>Status: ${payload.status}<br><a href="/api/orders/success/${payload.invoiceNo}">Cek halaman success</a>`;
      } catch (err) {
        out.innerHTML = `<span class="text-danger">${err.message}</span>`;
      }
    });
  } catch (error) {
    mount.innerHTML = '<div class="alert alert-danger">Gagal memuat detail produk.</div>';
  }
}

loadCatalog();
loadDetail();
