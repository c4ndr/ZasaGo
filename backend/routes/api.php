<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\ServiceCategoryController;
use App\Http\Controllers\Api\AntarController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TitipJalanSessionController;
use App\Http\Controllers\Api\TitipanOrderController;
use App\Http\Controllers\Api\CateringController;
use App\Http\Controllers\Api\KebersihanController;
use App\Http\Controllers\Api\LaundryController;
use App\Http\Controllers\Api\MitraController;
use App\Http\Controllers\Api\OjekController;
use App\Http\Controllers\Api\PenjualController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\WalletTopupController;
use App\Http\Controllers\Api\UrutController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

// Broadcasting auth — Bearer token Sanctum, terpisah dari auto-route Laravel
Route::post('/v1/broadcasting/auth', function (\Illuminate\Http\Request $request) {
    return Broadcast::auth($request);
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {

    // ── Publik ───────────────────────────────────────────────────────────────

    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);

    Route::get('/ojek/tarif',            [OjekController::class,  'hitungTarif']);
    Route::get('/antar/tarif',           [AntarController::class, 'hitungTarif']);
    Route::get('/urut/layanan',          [UrutController::class,  'services']);
    Route::get('/produk',                [ProductController::class, 'index']);
    Route::get('/produk/{product}',      [ProductController::class, 'show']);
    Route::get('/produk/kategori/list',  [ProductController::class, 'categories']);
    Route::get('/layanan/aktif',         [ServiceCategoryController::class, 'aktif']);
    Route::get('/settings/publik',       [SettingController::class, 'publik']);

    // ── Memerlukan Login ─────────────────────────────────────────────────────

    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('/logout',          [AuthController::class, 'logout']);
        Route::get('/profil',           [AuthController::class, 'me']);
        Route::post('/profil',          [AuthController::class, 'updateProfile']);
        Route::put('/profil',           [AuthController::class, 'updateProfile']);
        Route::post('/ganti-password',  [AuthController::class, 'changePassword']);

        // Mitra (semua jenis)
        Route::middleware('role:mitra')->group(function () {
            Route::patch('/mitra/toggle-online',     [MitraController::class, 'toggleOnline']);
            Route::get('/mitra/tersedia',            [MitraController::class, 'tersedia']);
        });

        // Pelanggan: semua pesanan gabungan
        Route::get('/pelanggan/pesanan/semua',   [MitraController::class, 'allOrders']);

        // ── Ojek ─────────────────────────────────────────────────────────────
        Route::prefix('ojek')->group(function () {
            Route::post('/',                                   [OjekController::class, 'store']);
            Route::get('/pesanan',                             [OjekController::class, 'myOrders']);
            Route::get('/pesanan/{ojekOrder}',                 [OjekController::class, 'show']);
            Route::get('/pesanan/{ojekOrder}/jastip',          [OjekController::class, 'jastipByOjekOrder']);
            Route::post('/pesanan/{ojekOrder}/batal',          [OjekController::class, 'cancel']);

            Route::middleware('role:mitra')->group(function () {
                Route::get('/tersedia',                         [OjekController::class, 'availableOrders']);
                Route::post('/pesanan/{ojekOrder}/terima',      [OjekController::class, 'accept']);
                Route::patch('/pesanan/{ojekOrder}/status',     [OjekController::class, 'updateStatus']);
            });
        });

        // ── Urut ─────────────────────────────────────────────────────────────
        Route::prefix('urut')->group(function () {
            Route::post('/pesanan',                       [UrutController::class, 'store']);
            Route::get('/pesanan',                        [UrutController::class, 'myOrders']);
            Route::post('/pesanan/{urutOrder}/batal',     [UrutController::class, 'cancel']);

            Route::middleware('role:mitra')->group(function () {
                Route::post('/layanan',                        [UrutController::class, 'storeService']);
                Route::put('/layanan/{urutService}',           [UrutController::class, 'updateService']);
                Route::delete('/layanan/{urutService}',        [UrutController::class, 'destroyService']);
                Route::get('/tersedia',                        [UrutController::class, 'tersedia']);
                Route::patch('/pesanan/{urutOrder}/status',    [UrutController::class, 'updateStatus']);
            });
        });

        // ── Laundry ──────────────────────────────────────────────────────────
        Route::prefix('laundry')->group(function () {
            Route::post('/pesanan',                        [LaundryController::class, 'store']);
            Route::get('/pesanan',                         [LaundryController::class, 'myOrders']);
            Route::post('/pesanan/{laundryOrder}/batal',   [LaundryController::class, 'cancel']);

            Route::middleware('role:mitra')->group(function () {
                Route::get('/tersedia',                          [LaundryController::class, 'tersedia']);
                Route::post('/pesanan/{laundryOrder}/terima',    [LaundryController::class, 'accept']);
                Route::patch('/pesanan/{laundryOrder}/status',   [LaundryController::class, 'updateStatus']);
            });
        });

        // ── Catering ─────────────────────────────────────────────────────────
        Route::prefix('catering')->group(function () {
            Route::post('/pesanan',                         [CateringController::class, 'store']);
            Route::get('/pesanan',                          [CateringController::class, 'myOrders']);
            Route::post('/pesanan/{cateringOrder}/batal',   [CateringController::class, 'cancel']);

            Route::middleware('role:mitra')->group(function () {
                Route::get('/tersedia',                           [CateringController::class, 'tersedia']);
                Route::post('/pesanan/{cateringOrder}/terima',    [CateringController::class, 'accept']);
                Route::patch('/pesanan/{cateringOrder}/status',   [CateringController::class, 'updateStatus']);
            });
        });

        // ── Kebersihan ────────────────────────────────────────────────────────
        Route::prefix('kebersihan')->group(function () {
            Route::post('/pesanan',                           [KebersihanController::class, 'store']);
            Route::get('/pesanan',                            [KebersihanController::class, 'myOrders']);
            Route::post('/pesanan/{kebersihanOrder}/batal',   [KebersihanController::class, 'cancel']);

            Route::middleware('role:mitra')->group(function () {
                Route::get('/tersedia',                              [KebersihanController::class, 'tersedia']);
                Route::post('/pesanan/{kebersihanOrder}/terima',     [KebersihanController::class, 'accept']);
                Route::patch('/pesanan/{kebersihanOrder}/status',    [KebersihanController::class, 'updateStatus']);
            });
        });

        // ── Antar Barang ──────────────────────────────────────────────────────
        Route::prefix('antar')->group(function () {
            Route::post('/pesanan',                        [AntarController::class, 'store']);
            Route::get('/pesanan',                         [AntarController::class, 'myOrders']);
            Route::patch('/pesanan/{antarOrder}/status',   [AntarController::class, 'updateStatus']);

            Route::middleware('role:mitra')->group(function () {
                Route::get('/tersedia',                        [AntarController::class, 'availableOrders']);
                Route::post('/pesanan/{antarOrder}/terima',    [AntarController::class, 'accept']);
            });
        });

        // ── Wallet ───────────────────────────────────────────────────────────
        Route::middleware('role:mitra')->group(function () {
            Route::post('/wallet/topup',  [WalletTopupController::class, 'store']);
            Route::get('/wallet/topup',   [WalletTopupController::class, 'myRequests']);
        });
        // Saldo & riwayat transaksi wallet untuk pelanggan
        Route::get('/wallet/saldo', [WalletTopupController::class, 'saldoPelanggan']);

        // ── TitipJalan / Jastip ───────────────────────────────────────────────
        // Semua sesi aktif untuk pelanggan browsing
        Route::get('/jastip/sesi', [TitipJalanSessionController::class, 'semuaAktif']);

        // Pelanggan: buat & kelola titipan
        Route::prefix('titipan')->group(function () {
            Route::post('/',                              [TitipanOrderController::class, 'store']);
            Route::get('/',                               [TitipanOrderController::class, 'myOrders']);
            Route::post('/{titipanOrder}/batal',          [TitipanOrderController::class, 'cancel']);

            Route::middleware('role:mitra')->group(function () {
                Route::get('/mitra/pending',              [TitipanOrderController::class, 'pendingMitra']);
                Route::post('/{titipanOrder}/terima',     [TitipanOrderController::class, 'accept']);
                Route::post('/{titipanOrder}/tolak',      [TitipanOrderController::class, 'reject']);
                Route::patch('/{titipanOrder}/status',    [TitipanOrderController::class, 'updateStatus']);
            });
        });

        // Mitra: kelola sesi TitipJalan
        Route::prefix('titipjalan/sesi')->middleware('role:mitra')->group(function () {
            Route::post('/',        [TitipJalanSessionController::class, 'store']);
            Route::get('/aktif',    [TitipJalanSessionController::class, 'aktif']);
            Route::get('/tersedia', [TitipJalanSessionController::class, 'titipanTersedia']);
            Route::post('/tutup',   [TitipJalanSessionController::class, 'tutup']);
        });

        // ── Produk ───────────────────────────────────────────────────────────
        Route::prefix('produk')->group(function () {
            Route::post('/pesanan',                        [ProductController::class, 'createOrder']);
            Route::get('/pesanan/saya',                    [ProductController::class, 'myOrders']);
            Route::patch('/pesanan/{productOrder}/status', [ProductController::class, 'updateOrderStatus']);
            Route::post('/{product}/ulasan',               [ProductController::class, 'review']);

            Route::middleware('role:mitra')->group(function () {
                Route::post('/',            [ProductController::class, 'store']);
                Route::put('/{product}',    [ProductController::class, 'update']);
                Route::delete('/{product}', [ProductController::class, 'destroy']);
            });
        });

        // ── Penjual ───────────────────────────────────────────────────────────
        Route::prefix('penjual')->middleware('role:penjual')->group(function () {
            Route::get('/dashboard',                    [PenjualController::class, 'dashboard']);
            Route::get('/produk',                       [PenjualController::class, 'produkIndex']);
            Route::post('/produk',                      [PenjualController::class, 'produkStore']);
            Route::put('/produk/{product}',             [PenjualController::class, 'produkUpdate']);
            Route::delete('/produk/{product}',          [PenjualController::class, 'produkDestroy']);
            Route::get('/pesanan',                      [PenjualController::class, 'pesananIndex']);
            Route::patch('/pesanan/{order}/status',     [PenjualController::class, 'pesananUpdate']);
            Route::get('/laporan',                      [PenjualController::class, 'laporan']);
        });

        // ── Admin ─────────────────────────────────────────────────────────────
        Route::prefix('admin')->middleware('role:admin')->group(function () {
            Route::get('/dashboard',                        [AdminController::class, 'dashboard']);
            Route::get('/statistik',                        [AdminController::class, 'statistik']);

            // Pengguna
            Route::get('/users',                            [AdminController::class, 'users']);
            Route::get('/users/{user}',                     [AdminController::class, 'showUser']);
            Route::patch('/users/{user}/toggle-status',     [AdminController::class, 'toggleUserStatus']);

            // Mitra
            Route::get('/mitra',                            [AdminController::class, 'mitraList']);
            Route::get('/mitra/pending',                    [AdminController::class, 'pendingMitra']);
            Route::get('/mitra/{id}/detail',                [AdminController::class, 'mitraDetail']);
            Route::post('/mitra/{mitraProfile}/verifikasi', [AdminController::class, 'verifyMitra']);

            // Pedagang
            Route::get('/pedagang',                         [AdminController::class, 'pedagang']);

            // Pesanan
            Route::get('/pesanan/ojek',                     [AdminController::class, 'ojekOrders']);
            Route::get('/pesanan/urut',                     [AdminController::class, 'urutOrders']);
            Route::get('/pesanan/produk',                   [AdminController::class, 'productOrders']);
            Route::get('/pesanan/laundry',                  [AdminController::class, 'laundryOrders']);
            Route::get('/pesanan/catering',                 [AdminController::class, 'cateringOrders']);
            Route::get('/pesanan/kebersihan',               [AdminController::class, 'kebersihanOrders']);
            Route::get('/pesanan/antar',                    [AdminController::class, 'antarOrders']);
            Route::get('/pesanan/jastip',                   [AdminController::class, 'jastipOrders']);

            // Keuangan
            Route::get('/keuangan',                         [AdminController::class, 'keuangan']);

            // Wallet topup
            Route::get('/wallet/topup',                               [WalletTopupController::class, 'adminIndex']);
            Route::post('/wallet/topup/{topupRequest}/setujui',       [WalletTopupController::class, 'approve']);
            Route::post('/wallet/topup/{topupRequest}/tolak',         [WalletTopupController::class, 'reject']);

            // Settings
            Route::get('/settings',                         [SettingController::class, 'index']);
            Route::put('/settings',                         [SettingController::class, 'update']);

            // Layanan jasa
            Route::get('/layanan',                          [ServiceCategoryController::class, 'index']);
            Route::post('/layanan',                         [ServiceCategoryController::class, 'store']);
            Route::put('/layanan/{layanan}',                [ServiceCategoryController::class, 'update']);
            Route::patch('/layanan/{layanan}/toggle',       [ServiceCategoryController::class, 'toggle']);
            Route::delete('/layanan/{layanan}',             [ServiceCategoryController::class, 'destroy']);
        });
    });
});
