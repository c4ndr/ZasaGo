<?php

namespace Database\Seeders;

use App\Models\MitraProfile;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ServiceCategory;
use App\Models\UrutService;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // ── Admin ─────────────────────────────────────────────────────────────
        User::create([
            'name'     => 'Admin GoDesa',
            'email'    => 'admin@godesa.id',
            'phone'    => '081000000001',
            'password' => Hash::make('password'),
            'role'     => 'admin',
        ]);

        // ── Mitra Ojek ────────────────────────────────────────────────────────
        $mitraOjek = User::create([
            'name'     => 'Budi Santoso',
            'email'    => 'ojek@godesa.id',
            'phone'    => '081000000002',
            'password' => Hash::make('password'),
            'role'     => 'mitra',
        ]);
        MitraProfile::create([
            'user_id'       => $mitraOjek->id,
            'service_type'  => 'ojek',
            'bio'           => 'Driver ojek berpengalaman 5 tahun',
            'vehicle_type'  => 'Motor Bebek',
            'vehicle_plate' => 'AB 1234 CD',
            'is_available'  => true,
            'is_verified'   => true,
        ]);

        // ── Mitra Urut ────────────────────────────────────────────────────────
        $mitraUrut = User::create([
            'name'     => 'Siti Rahayu',
            'email'    => 'urut@godesa.id',
            'phone'    => '081000000003',
            'password' => Hash::make('password'),
            'role'     => 'mitra',
        ]);
        MitraProfile::create([
            'user_id'      => $mitraUrut->id,
            'service_type' => 'urut',
            'bio'          => 'Terapis urut tradisional Jawa bersertifikat',
            'is_available' => true,
            'is_verified'  => true,
        ]);
        UrutService::insert([
            [
                'mitra_id'         => $mitraUrut->id,
                'name'             => 'Urut Badan Penuh',
                'description'      => 'Pijat urut seluruh badan menggunakan teknik tradisional Jawa',
                'duration_minutes' => 90,
                'price'            => 120000,
                'is_active'        => true,
                'created_at'       => now(),
                'updated_at'       => now(),
            ],
            [
                'mitra_id'         => $mitraUrut->id,
                'name'             => 'Urut Punggung & Bahu',
                'description'      => 'Fokus pada punggung dan bahu untuk mengurangi pegal',
                'duration_minutes' => 45,
                'price'            => 70000,
                'is_active'        => true,
                'created_at'       => now(),
                'updated_at'       => now(),
            ],
            [
                'mitra_id'         => $mitraUrut->id,
                'name'             => 'Urut Kaki & Refleksi',
                'description'      => 'Urut refleksi kaki untuk melancarkan peredaran darah',
                'duration_minutes' => 60,
                'price'            => 80000,
                'is_active'        => true,
                'created_at'       => now(),
                'updated_at'       => now(),
            ],
        ]);

        // ── Mitra Produk ──────────────────────────────────────────────────────
        $mitraProduk = User::create([
            'name'     => 'Warung Pak Joko',
            'email'    => 'produk@godesa.id',
            'phone'    => '081000000004',
            'password' => Hash::make('password'),
            'role'     => 'mitra',
        ]);
        MitraProfile::create([
            'user_id'      => $mitraProduk->id,
            'service_type' => 'produk',
            'bio'          => 'Warung serba ada, menjual kebutuhan sehari-hari',
            'is_verified'  => true,
        ]);

        // ── Pelanggan Demo ────────────────────────────────────────────────────
        User::create([
            'name'     => 'Pelanggan Demo',
            'email'    => 'pelanggan@godesa.id',
            'phone'    => '081000000005',
            'password' => Hash::make('password'),
            'role'     => 'pelanggan',
        ]);

        // ── Penjual Demo ──────────────────────────────────────────────────────
        User::create([
            'name'    => 'Toko Berkah Jaya',
            'email'   => 'penjual@godesa.id',
            'phone'   => '081000000006',
            'password'=> Hash::make('password'),
            'role'    => 'penjual',
            'address' => 'Jl. Pasar Baru No. 12, Desa Sukamaju',
        ]);

        // ── Kategori Produk ───────────────────────────────────────────────────
        $kategoris = [
            ['name' => 'Makanan & Minuman', 'slug' => 'makanan-minuman',    'icon' => 'food'],
            ['name' => 'Pertanian',          'slug' => 'pertanian',          'icon' => 'farm'],
            ['name' => 'Kerajinan Tangan',   'slug' => 'kerajinan-tangan',   'icon' => 'craft'],
            ['name' => 'Sembako',            'slug' => 'sembako',            'icon' => 'grocery'],
            ['name' => 'Elektronik',         'slug' => 'elektronik',         'icon' => 'electronic'],
            ['name' => 'Pakaian & Fashion',  'slug' => 'pakaian-fashion',    'icon' => 'clothing'],
        ];
        foreach ($kategoris as $k) {
            ProductCategory::create($k);
        }

        // ── Produk Sample ─────────────────────────────────────────────────────
        $categoryId = ProductCategory::where('slug', 'sembako')->value('id');
        $produkSample = [
            ['name' => 'Beras 5 Kg',    'price' => 65000,  'stock' => 50],
            ['name' => 'Minyak Goreng 2L', 'price' => 32000, 'stock' => 30],
            ['name' => 'Gula Pasir 1 Kg', 'price' => 17000, 'stock' => 100],
        ];
        foreach ($produkSample as $p) {
            Product::create([
                'mitra_id'    => $mitraProduk->id,
                'category_id' => $categoryId,
                'name'        => $p['name'],
                'slug'        => Str::slug($p['name']) . '-' . Str::random(4),
                'price'       => $p['price'],
                'stock'       => $p['stock'],
                'unit'        => 'pcs',
                'is_active'   => true,
            ]);
        }

        // ── Service Categories (Layanan Jasa) ─────────────────────────────────
        $layananDefault = [
            ['nama' => 'Ojek',        'icon' => '🛵', 'deskripsi' => 'Layanan antar jemput cepat & aman',   'urutan' => 1],
            ['nama' => 'Urut/Pijat',  'icon' => '💆', 'deskripsi' => 'Pijat tradisional & terapi ke rumah', 'urutan' => 2],
            ['nama' => 'Laundry',     'icon' => '👕', 'deskripsi' => 'Cuci, setrika & antar jemput pakaian','urutan' => 3],
            ['nama' => 'Catering',    'icon' => '🍱', 'deskripsi' => 'Katering harian & pesanan acara',     'urutan' => 4],
            ['nama' => 'Kebersihan',  'icon' => '🧹', 'deskripsi' => 'Jasa bersih-bersih rumah & kantor',   'urutan' => 5],
            ['nama' => 'Antar Barang','icon' => '📦', 'deskripsi' => 'Kirim & antar barang dalam kota',     'urutan' => 6],
        ];
        foreach ($layananDefault as $l) {
            ServiceCategory::create([...$l, 'is_active' => true]);
        }
    }
}
