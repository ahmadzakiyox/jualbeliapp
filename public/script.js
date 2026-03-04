document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. SISTEM TOAST NOTIFICATION
  // ==========================================
  window.showToast = function (message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast glass";
    toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color: var(--accent-color); font-size: 1.2rem; margin-right: 8px;"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  // ==========================================
  // 2. SISTEM TEMA GELAP/TERANG
  // ==========================================
  const themeBtn = document.getElementById("theme-toggle");
  const body = document.body;
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    if (themeBtn)
      themeBtn.querySelector("i").classList.replace("fa-moon", "fa-sun");
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      body.classList.toggle("dark-mode");
      const isDark = body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      const icon = themeBtn.querySelector("i");
      if (isDark) icon.classList.replace("fa-moon", "fa-sun");
      else icon.classList.replace("fa-sun", "fa-moon");
    });
  }

  // ==========================================
  // 3. MANAJEMEN SESI, DROPDOWN & LOGOUT
  // ==========================================
  const token = localStorage.getItem("tokenJualBeli");
  const userDataString = localStorage.getItem("userData");

  const userNameElement = document.getElementById("user-name");
  const userAvatar = document.getElementById("user-avatar");
  const menuJualan = document.getElementById("menu-jualan");
  const dropdownBtn = document.getElementById("profile-dropdown-btn");
  const dropdownMenu = document.getElementById("profile-dropdown-menu");

  // Buka/Tutup Dropdown
  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isShowing = dropdownMenu.style.display === "block";
      dropdownMenu.style.display = isShowing ? "none" : "block";
    });
    window.addEventListener("click", () => {
      dropdownMenu.style.display = "none";
    });
  }

  // Global Logout
  window.prosesLogout = function (e) {
    if (e) e.preventDefault();
    localStorage.removeItem("tokenJualBeli");
    localStorage.removeItem("userData");
    showToast("👋 Anda berhasil keluar.");
    setTimeout(() => (window.location.href = "/portal/masuk"), 1500);
  };

  // Proteksi Halaman Akun
  if (window.location.pathname.startsWith("/akun") && !token) {
    window.location.href = "/portal/masuk";
  }

  if (token && userDataString) {
    // --- JIKA USER SUDAH LOGIN ---
    const userData = JSON.parse(userDataString);

    // Ubah UI Navbar
    if (userNameElement) userNameElement.innerText = userData.namaLengkap;
    if (userAvatar)
      userAvatar.src = `https://ui-avatars.com/api/?name=${userData.namaLengkap}&background=4facfe&color=fff`;
    if (menuJualan)
      menuJualan.style.display =
        userData.role === "member" ? "inline-block" : "none";

    // Tampilkan tombol Tambah Produk (di Dasbor)
    const btnTambahProduk = document.getElementById("btn-tambah-produk");
    if (btnTambahProduk && userData.role === "member") {
      btnTambahProduk.style.display = "inline-block";
    }

    // Isi Dropdown
    if (dropdownMenu) {
      dropdownMenu.innerHTML = `
                <div style="padding: 10px 15px; border-bottom: 1px solid var(--glass-border); margin-bottom: 5px;">
                    <p style="margin:0; font-weight:bold; font-size: 0.95rem;">${userData.namaLengkap}</p>
                    <p style="margin:0; font-size: 0.8rem; opacity: 0.7;">${userData.role === "member" ? "Penjual Pro" : "Pembeli Biasa"}</p>
                </div>
                <a href="/akun/dasbor" class="dropdown-item"><i class="fa-solid fa-clipboard-list" style="width: 20px;"></i> Dashboard Saya</a>
                <a href="/akun/favorit" class="dropdown-item"><i class="fa-solid fa-heart" style="width: 20px;"></i> Wishlist</a>
                <a href="/akun/pengaturan" class="dropdown-item"><i class="fa-solid fa-gear" style="width: 20px;"></i> Pengaturan Akun</a>
                <div style="height: 1px; background: var(--glass-border); margin: 5px 0;"></div>
                <a href="#" onclick="prosesLogout(event)" class="dropdown-item" style="color: #ef4444;"><i class="fa-solid fa-right-from-bracket" style="width: 20px;"></i> Keluar</a>
            `;
    }

    // AMBIL DATA PROFIL API (DENGAN PEREDAM ERROR)
    if (window.location.pathname.startsWith("/akun")) {
      fetch("/api/v1/user/profil", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("API/Server 404");
          return res.json();
        })
        .then((result) => {
          if (result.success) {
            const user = result.data;

            // Isi form profil jika ada
            const formNama = document.getElementById("profil-nama");
            if (formNama) formNama.value = user.namaLengkap;
            const formEmail = document.getElementById("profil-email");
            if (formEmail) formEmail.value = user.email;
            const formHp = document.getElementById("profil-hp");
            if (formHp) formHp.value = user.noHp || "";
            const formAlamat = document.getElementById("profil-alamat");
            if (formAlamat) formAlamat.value = user.alamat || "";

            // Update UI Sidebar
            const sidebarName = document.querySelector(".profile-sidebar h2");
            const sidebarEmail = document.querySelector(".profile-sidebar p");
            if (sidebarName) sidebarName.innerText = user.namaLengkap;
            if (sidebarEmail) sidebarEmail.innerText = user.email;
          }
        })
        .catch((err) =>
          console.warn(
            "Peringatan: Data profil gagal dimuat. Pastikan server aktif.",
          ),
        );
    }
  } else {
    // --- JIKA GUEST (BELUM LOGIN) ---
    if (userNameElement) userNameElement.innerText = "Guest";
    if (menuJualan) menuJualan.style.display = "none";

    if (dropdownMenu) {
      dropdownMenu.innerHTML = `
                <a href="/portal/masuk" class="dropdown-item"><i class="fa-solid fa-right-to-bracket" style="width: 20px;"></i> Masuk Akun</a>
                <a href="/portal/daftar" class="dropdown-item"><i class="fa-solid fa-user-plus" style="width: 20px;"></i> Daftar Baru</a>
            `;
    }
  }

  // ==========================================
  // 4. SATPAM FRONTEND & DETAIL PRODUK (QUICK VIEW)
  // ==========================================
  window.cekAksesTransaksi = function () {
    if (!localStorage.getItem("tokenJualBeli")) {
      showToast(
        "🔒 Akses Ditolak: Silakan Masuk atau Daftar untuk berbelanja!",
      );
      setTimeout(() => (window.location.href = "/portal/masuk"), 2000);
      return false;
    }
    return true;
  };

  document.addEventListener("click", (e) => {
    // Tombol Keranjang
    const btnKeranjang = e.target.closest(".tambah-keranjang-btn");
    if (btnKeranjang) {
      e.preventDefault();
      if (!cekAksesTransaksi()) return;
      showToast("🛒 Produk ditambahkan ke keranjang!");
    }

    // Tombol Wishlist
    const btnWishlist = e.target.closest(".tambah-wishlist-btn");
    if (btnWishlist) {
      e.preventDefault();
      if (!cekAksesTransaksi()) return;
      showToast("❤️ Produk disimpan ke Wishlist!");
    }

    // --- LOGIKA MUNCULIN DETAIL PRODUK ---
    const btnQuickView = e.target.closest(".quick-view-btn");
    if (btnQuickView) {
      e.preventDefault();
      e.stopPropagation();
      
      const modal = document.getElementById("quick-view-modal");
      const modalDetails = document.getElementById("modal-details");
      
      if (modal && modalDetails) {
          // 1. Ambil data dari Kartu Produk yang diklik
          const card = btnQuickView.closest('.product-card');
          const bgStyle = card.querySelector('.product-img').style.backgroundImage;
          const imgUrl = bgStyle.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''); 
          const title = card.querySelector('.product-title').innerText;
          const price = card.querySelector('.price').innerText;
          const desc = card.querySelector('.hidden-desc').innerHTML;
          
          // 2. Suntikkan data ke dalam Modal Pop-up
          modalDetails.innerHTML = `
              <div style="text-align: center;">
                  <img src="${imgUrl}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 12px; margin-bottom: 15px; border: 1px solid var(--glass-border);">
              </div>
              <h2 style="margin: 0 0 10px 0; color: var(--accent-color);">${title}</h2>
              <h3 style="margin: 0 0 15px 0; color: #10b981; font-size: 1.5rem;">${price}</h3>
              <div style="background: rgba(0,0,0,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; max-height: 250px; overflow-y: auto; text-align: left;">${desc}</div>
              <button class="glass-btn primary tambah-keranjang-btn" style="width: 100%; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 1.05rem;">
                  <i class="fa-solid fa-cart-plus"></i> Masukkan Keranjang
              </button>
          `;
          
          // 3. Tampilkan Modal
          modal.classList.add("show");
          modal.style.display = "flex";
      }
    }
  });

  // --- LOGIKA TUTUP MODAL DETAIL ---
  const modalView = document.getElementById("quick-view-modal");
  if (modalView) {
    // Fungsi untuk mengembalikan efek loading saat ditutup
    const resetModal = () => {
        modalView.classList.remove("show");
        modalView.style.display = "none";
        setTimeout(() => {
            document.getElementById("modal-details").innerHTML = `
              <div style="text-align: center; padding: 40px;">
                  <i class="fa-solid fa-spinner fa-spin fa-3x" style="color: var(--accent-color);"></i>
                  <p style="margin-top: 15px;">Memuat detail produk...</p>
              </div>`;
        }, 300); // Jeda sedikit agar animasinya mulus
    };

    // Jika tombol X diklik
    document.addEventListener("click", (e) => {
       if (e.target.closest(".close-modal")) resetModal();
    });
    
    // Jika area hitam di luar modal diklik
    window.addEventListener("click", (e) => {
      if (e.target === modalView) resetModal();
    });
  }

  // ==========================================
  // 5. LOGIKA FORM AUTH & PENGATURAN
  // ==========================================

  // REGISTER
  const formRegister = document.getElementById("form-register");
  if (formRegister) {
    formRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      const namaLengkap = document.getElementById("reg-nama").value;
      const email = document.getElementById("reg-email").value;
      const role = document.getElementById("reg-role").value;
      const password = document.getElementById("reg-password").value;
      const confirmPassword = document.getElementById("reg-confirm").value;

      if (password !== confirmPassword)
        return showToast("❌ Konfirmasi password tidak cocok!");
      showToast("⏳ Memproses pendaftaran...");

      try {
        const response = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namaLengkap, email, role, password }),
        });
        const data = await response.json();
        if (data.success) {
          showToast(`✅ ${data.message}`);
          localStorage.setItem("pendingEmail", email);
          setTimeout(() => (window.location.href = "/portal/verifikasi"), 2000);
        } else {
          showToast(`❌ ${data.message}`);
        }
      } catch (error) {
        showToast("❌ Gagal menghubungi server!");
      }
    });
  }

  // VERIFIKASI OTP (6 KOTAK)
  const formVerify = document.getElementById("form-verify");
  const displayEmail = document.getElementById("display-email");
  const pendingEmail = localStorage.getItem("pendingEmail");
  if (displayEmail && pendingEmail) displayEmail.innerText = pendingEmail;

  const otpInputs = document.querySelectorAll(".otp-digit");
  if (otpInputs.length > 0) {
    otpInputs.forEach((input, index) => {
      input.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "");
        if (e.target.value !== "" && index < otpInputs.length - 1)
          otpInputs[index + 1].focus();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && e.target.value === "" && index > 0)
          otpInputs[index - 1].focus();
      });
    });
  }

  if (formVerify) {
    formVerify.addEventListener("submit", async (e) => {
      e.preventDefault();
      let otp = "";
      otpInputs.forEach((input) => (otp += input.value));

      if (otp.length !== 6) return showToast("❌ Harap isi 6 digit kode!");
      if (!pendingEmail) {
        showToast("❌ Sesi hilang, daftar ulang.");
        setTimeout(() => (window.location.href = "/portal/daftar"), 2000);
        return;
      }
      showToast("⏳ Memverifikasi...");
      try {
        const response = await fetch("/api/v1/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingEmail, otp }),
        });
        const data = await response.json();
        if (data.success) {
          showToast(`✅ ${data.message}`);
          localStorage.removeItem("pendingEmail");
          setTimeout(() => (window.location.href = "/portal/masuk"), 2000);
        } else {
          showToast(`❌ ${data.message}`);
          otpInputs.forEach((input) => (input.value = ""));
          otpInputs[0].focus();
        }
      } catch (error) {
        showToast("❌ Gagal!");
      }
    });
  }

  // LOGIN
  const formLogin = document.getElementById("form-form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      showToast("⏳ Sedang memverifikasi...");
      try {
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (data.success) {
          localStorage.setItem("tokenJualBeli", data.token);
          localStorage.setItem("userData", JSON.stringify(data.userData));
          showToast(`✅ Selamat datang!`);
          setTimeout(() => (window.location.href = "/beranda"), 1500);
        } else {
          showToast(`❌ ${data.message}`);
        }
      } catch (error) {
        showToast("❌ Gagal menghubungi server!");
      }
    });
  }

  // UPDATE PENGATURAN PROFIL
  const formProfil = document.getElementById("form-edit-profil");
  if (formProfil) {
    formProfil.addEventListener("submit", async (e) => {
      e.preventDefault();
      showToast("⏳ Menyimpan pengaturan...");
      const namaLengkap = document.getElementById("profil-nama").value;
      const noHp = document.getElementById("profil-hp").value;
      const alamat = document.getElementById("profil-alamat").value;

      try {
        const response = await fetch("/api/v1/user/profil", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ namaLengkap, noHp, alamat }),
        });
        const data = await response.json();
        if (data.success) {
          showToast(`✅ ${data.message}`);
          const updatedUserData = JSON.parse(localStorage.getItem("userData"));
          updatedUserData.namaLengkap = namaLengkap;
          localStorage.setItem("userData", JSON.stringify(updatedUserData));

          if (userNameElement) userNameElement.innerText = namaLengkap;
          const sidebarName = document.querySelector(".profile-sidebar h2");
          if (sidebarName) sidebarName.innerText = namaLengkap;
        } else {
          showToast(`❌ ${data.message}`);
        }
      } catch (error) {
        showToast("❌ Gagal menghubungi server!");
      }
    });
  }

  // ==========================================
  // 6. LOGIKA TAMBAH PRODUK (DASHBOARD PENJUAL)
  // ==========================================
  const modalTambahProduk = document.getElementById("modal-tambah-produk");
  const formTambahProduk = document.getElementById("form-tambah-produk");

  // KLIK TEMBAK LANGSUNG (ANTI-MACET)
  document.addEventListener("click", (e) => {
    if (e.target.closest("#btn-tambah-produk")) {
      e.preventDefault();
      if (modalTambahProduk) modalTambahProduk.style.display = "flex";
    }
    if (e.target.closest(".close-modal-produk")) {
      if (modalTambahProduk) modalTambahProduk.style.display = "none";
    }
  });

  // Tutup Modal Area Gelap
  if (modalTambahProduk) {
    window.addEventListener("click", (e) => {
      if (e.target === modalTambahProduk)
        modalTambahProduk.style.display = "none";
    });
  }

  // Submit Tambah Produk Digital
  if (formTambahProduk) {
    formTambahProduk.addEventListener("submit", async (e) => {
      e.preventDefault();
      showToast("⏳ Mengupload produk digital ke server...");

      const dataProduk = {
        namaProduk: document.getElementById("prod-nama").value,
        harga: document.getElementById("prod-harga").value,
        stok: document.getElementById("prod-stok").value,
        kategori: document.getElementById("prod-kategori").value,
        gambarUrl:
          document.getElementById("prod-gambar").value ||
          "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=300&q=80",
        deskripsi: document.getElementById("prod-deskripsi").value,
      };

      try {
        const response = await fetch("/api/v1/produk/tambah", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("tokenJualBeli")}`,
          },
          body: JSON.stringify(dataProduk),
        });

        const data = await response.json();
        if (data.success) {
          showToast(`✅ ${data.message}`);
          modalTambahProduk.style.display = "none";
          formTambahProduk.reset();
          setTimeout(() => window.location.reload(), 1500); // Otomatis refresh tabel
        } else {
          showToast(`❌ ${data.message}`);
        }
      } catch (error) {
        showToast("❌ Gagal menghubungi server!");
      }
    });
  }

  // ==========================================
  // 7. TARIK & TAMPILKAN PRODUK DI BERANDA
  // ==========================================
  const katalogContainer = document.getElementById("katalog-produk");

  if (katalogContainer) {
    async function muatProdukBeranda() {
      try {
        const response = await fetch("/api/v1/produk");
        if (!response.ok) throw new Error("Gagal mengambil data produk");
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          katalogContainer.innerHTML = ""; // Hapus skeleton loader

          result.data.forEach((produk) => {
            const hargaRp = new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(produk.harga);

            const card = document.createElement("div");
            card.className = "product-card glass fade-in";
            // KITA TAMBAHKAN ONCLICK PADA GAMBAR & LINK PADA JUDUL
            card.innerHTML = `
                <div class="product-img" onclick="window.location.href='/katalog/item?id=${produk._id}'" style="background-image: url('${produk.gambarUrl}'); background-size: cover; background-position: center; height: 160px; border-radius: 8px 8px 0 0; position: relative; cursor: pointer;">
                    <button class="quick-view-btn" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); border: none; color: white; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; transition: 0.3s;"><i class="fa-solid fa-eye"></i></button>
                </div>
                <div style="padding: 15px;">
                    <p style="font-size: 0.8rem; opacity: 0.7; margin: 0 0 5px 0; color: var(--accent-color); font-weight: bold;">${produk.kategori}</p>
                    
                    <a href="/katalog/item?id=${produk._id}" style="text-decoration: none; color: inherit;">
                        <h3 class="product-title" style="margin: 0 0 10px 0; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--accent-color)'" onmouseout="this.style.color='inherit'" title="${produk.namaProduk}">${produk.namaProduk}</h3>
                    </a>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 0.85rem; opacity: 0.8;">
                        <span><i class="fa-solid fa-star" style="color: #f59e0b;"></i> 5.0</span>
                        <span>Sisa: ${produk.stok}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="price" style="font-weight: bold; color: var(--accent-color); font-size: 1.15rem;">${hargaRp}</span>
                        <button class="glass-btn primary tambah-keranjang-btn" style="padding: 8px 15px; width: auto;"><i class="fa-solid fa-cart-plus"></i></button>
                    </div>
                </div>
                <span class="hidden-desc" style="display:none;">${produk.deskripsi}</span>
            `;
            katalogContainer.appendChild(card);
          });
        } else {
          katalogContainer.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; opacity: 0.6;" class="glass fade-in">
                            <i class="fa-solid fa-box-open fa-3x" style="margin-bottom: 15px;"></i>
                            <p>Belum ada produk digital yang dijual saat ini.</p>
                        </div>
                    `;
        }
      } catch (error) {
        katalogContainer.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: #ef4444;">Peringatan: Gagal memuat katalog. Pastikan server Node.js sudah aktif.</p>`;
      }
    }
    muatProdukBeranda();
  }

  // Fungsi Muat Tabel Produk Saya di Dasbor
// Fungsi Muat Tabel Produk Saya di Dasbor
async function refreshTabelProduk() {
    const tabel = document.getElementById('tabel-data-dinamis');
    if (!tabel) return;

    try {
        const res = await fetch('/api/v1/produk/saya', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('tokenJualBeli')}` }
        });
        const result = await res.json();

        if (result.success) {
            if (result.data.length === 0) {
                tabel.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; opacity: 0.6;">Belum ada produk.</td></tr>';
                return;
            }

            tabel.innerHTML = '';
            result.data.forEach(p => {
                const hargaStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.harga);
                
                // DI SINI TEMPATNYA: Bagian ini yang menyusun tampilan tabel
                tabel.innerHTML += `
                    <tr>
                        <td>${p.namaProduk}</td>
                        <td>${hargaStr}</td>
                        <td><b>${p.stok}</b> Akun Ready</td>
                        <td style="text-align: center;">
                            <button class="glass-btn" onclick="openInputStok('${p._id}')" style="background:#10b981; color:white; border:none; padding:8px 12px; border-radius: 8px; cursor: pointer;">
                                + Akun
                            </button>
                            
                            <button class="glass-btn" onclick="hapusProduk('${p._id}')" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius: 8px; cursor: pointer; margin-left: 5px;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        console.error('Gagal memuat tabel:', err);
    }
}

// Jalankan saat buka Dashboard
if (window.location.pathname === '/akun/dasbor') refreshTabelProduk();

// Fungsi Klik Simpan Detail Stok
const formDetail = document.getElementById('form-detail-stok');
if (formDetail) {
    formDetail.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            productId: document.getElementById('stok-prod-id').value,
            email: document.getElementById('stok-email').value,
            username: document.getElementById('stok-user').value,
            password: document.getElementById('stok-pass').value,
            twoFactorEmail: document.getElementById('stok-2fa-mail').value,
            twoFactorApp: document.getElementById('stok-2fa-app').value
        };

        const res = await fetch('/api/v1/stok/tambah-detail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        
        if ((await res.json()).success) {
            showToast('✅ Akun berhasil masuk stok!');
            document.getElementById('modal-tambah-stok').style.display = 'none';
            refreshTabelProduk();
        }
    });
}

window.openInputStok = (id) => {
    document.getElementById('stok-prod-id').value = id;
    document.getElementById('modal-tambah-stok').style.display = 'flex';
};

});

window.hapusProduk = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini? Semua stok tersisa juga akan hilang.')) return;
    
    try {
        const res = await fetch(`/api/v1/produk/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('tokenJualBeli')}` }
        });
        const result = await res.json();
        if (result.success) {
            showToast('✅ Produk berhasil dihapus!');
            refreshTabelProduk(); // Memperbarui tabel secara instan
        }
    } catch (err) { showToast('❌ Gagal menghapus!'); }
};