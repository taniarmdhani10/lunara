# LUNARA Food & Drinks

Website pemesanan restoran cepat saji dengan dashboard admin. Dibuat sebagai tugas kuliah untuk mendemokan **komponen utama dan fitur dalam platform e-commerce**. Dibangun dengan HTML, CSS, dan JavaScript murni, tanpa framework dan tanpa server.

<!-- Tambahkan tangkapan layar di folder docs/, lalu hapus tanda komentar di bawah -->
<!-- ![Beranda](docs/beranda.png) -->

## Demo

Live demo: _isi tautan GitHub Pages di sini_

Akun demo (data tersimpan di browser masing-masing):

| Peran | PIN |
|---|---|
| Pelanggan | `2007` |
| Admin | `6789` |

Pindah antara tampilan Pelanggan dan Dashboard Admin lewat tab di bagian atas layar.

## Fitur berdasarkan 8 komponen e-commerce

| No | Komponen | Fitur |
|---|---|---|
| 1 | Desain situs web | Tampilan responsif ala aplikasi HP, navigasi bawah, halaman bantuan dan kontak |
| 2 | Manajemen produk | Tambah, ubah, hapus produk, kategori, harga, diskon, aktif atau nonaktif, paket hemat, galeri foto, aksi massal, ekspor CSV |
| 3 | Sistem pemesanan | Keranjang, checkout (Dine In, Take Away, Delivery), voucher, status pesanan bertahap, riwayat, pesan ulang, chat dengan toko |
| 4 | Pengelolaan stok | Stok berkurang otomatis, peringatan stok menipis, barang masuk dan keluar, stok opname, riwayat stok, saran restock, daftar belanja |
| 5 | Sistem pembayaran | Tunai, QRIS, dan transfer (simulasi), konfirmasi atau penolakan oleh admin, status refund |
| 6 | Analisis data | Ringkasan penjualan, produk terlaris, laporan per periode |
| 7 | Pengiriman dan logistik | Pilihan layanan antar, ongkir dan estimasi, penugasan kurir, pelacakan pengantaran untuk pelanggan |
| 8 | Manajemen pelanggan | Daftar dan segmen pelanggan (Baru, Langganan, VIP, Tidak Aktif), catatan, pesan promo, ekspor CSV |

Tambahan: modul pemasaran (flash sale, banner, kinerja voucher) dan galeri gambar.

## Cara menjalankan

1. Unduh atau clone repositori ini.
2. Pastikan folder `images/` berisi foto menu (nama file harus sama persis dengan nama menu, termasuk huruf besar dan kecil).
3. Buka `index.html` di browser. Tidak perlu instalasi apa pun.

## Struktur folder

```
lunara/
├── index.html
├── style.css
├── script.js
├── images/        foto menu
└── docs/          tangkapan layar dan dokumen presentasi (opsional)
```

## Keterbatasan

- Data (produk, pesanan, chat, stok) disimpan di browser (localStorage), jadi tidak tersinkron antar perangkat.
- Pembayaran masih simulasi dan belum terhubung ke payment gateway.
- Login memakai PIN di sisi browser, belum ada akun pelanggan dengan verifikasi.
- Pelacakan pengantaran berbasis status, bukan posisi di peta.

## Rencana pengembangan

- Database dan server (backend) supaya data tersinkron
- Pembayaran sungguhan lewat payment gateway
- Akun pelanggan dan verifikasi
- Notifikasi status pesanan (WhatsApp atau email)
- Analisis data yang lebih lengkap (grafik tren, per kategori, jam tersibuk)

## Pembuat

[Nama], [Nama], [Nama] - [Mata kuliah], [Kampus]

## Lisensi

MIT, lihat berkas [LICENSE](LICENSE).
