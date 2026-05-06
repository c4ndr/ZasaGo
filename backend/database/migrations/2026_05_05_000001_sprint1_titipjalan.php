<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Tambah kolom ke ojek_orders ──────────────────────────────────
        Schema::table('ojek_orders', function (Blueprint $table) {
            $table->boolean('izin_titipjalan')->default(false)->after('notes');
            $table->decimal('diskon_titipjalan', 12, 2)->default(0)->after('izin_titipjalan');
        });

        // ── 2. Sesi TitipJalan mitra ─────────────────────────────────────────
        // Mitra buka sesi saat mau berangkat, deklarasikan rute & kapasitas
        Schema::create('titipjalan_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_id')->constrained('users');
            $table->foreignId('ojek_order_id')->nullable()->constrained('ojek_orders'); // diisi jika mode hybrid
            $table->enum('mode', ['murni', 'hybrid'])->default('murni');
            $table->string('asal_address');
            $table->decimal('asal_lat', 10, 7);
            $table->decimal('asal_lng', 10, 7);
            $table->string('tujuan_address');
            $table->decimal('tujuan_lat', 10, 7);
            $table->decimal('tujuan_lng', 10, 7);
            $table->integer('radius_meter')->default(200);
            $table->integer('max_titipan')->default(3);
            $table->decimal('max_berat_kg', 8, 2)->nullable();
            $table->string('jenis_barang_diterima')->nullable();
            $table->enum('status', ['aktif', 'selesai', 'dibatalkan'])->default('aktif');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });

        // ── 3. Order titipan ─────────────────────────────────────────────────
        // Dibuat pelanggan jastip, dicocokkan ke sesi mitra yang searah
        Schema::create('titipan_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->foreignId('session_id')->nullable()->constrained('titipjalan_sessions');
            $table->foreignId('pelanggan_id')->constrained('users');
            $table->foreignId('mitra_id')->nullable()->constrained('users');
            $table->string('pickup_address');
            $table->decimal('pickup_lat', 10, 7);
            $table->decimal('pickup_lng', 10, 7);
            $table->string('destination_address');
            $table->decimal('destination_lat', 10, 7);
            $table->decimal('destination_lng', 10, 7);
            $table->decimal('distance_km', 8, 2)->default(0);
            $table->string('jenis_barang')->nullable();
            $table->decimal('berat_kg', 8, 2)->nullable();
            $table->text('catatan')->nullable();
            $table->decimal('harga_asli', 12, 2);       // harga sebelum diskon
            $table->decimal('diskon_persen', 5, 2)->default(2);
            $table->decimal('total_price', 12, 2);       // harga setelah diskon
            $table->decimal('komisi_platform', 12, 2)->default(0);
            $table->decimal('penghasilan_mitra', 12, 2)->default(0);
            $table->enum('status', [
                'menunggu', 'diterima', 'dijemput', 'diantar', 'selesai', 'dibatalkan'
            ])->default('menunggu');
            $table->enum('payment_method', ['tunai', 'dompet_digital', 'transfer'])->default('tunai');
            $table->enum('payment_status', ['belum_bayar', 'sudah_bayar'])->default('belum_bayar');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // ── 4. Seed default settings ─────────────────────────────────────────
        $settings = [
            ['key' => 'komisi_titipjalan',        'value' => '10',    'label' => 'Komisi Platform TitipJalan (%)',       'group' => 'titipjalan'],
            ['key' => 'diskon_titipjalan_persen',  'value' => '2',     'label' => 'Diskon Pelanggan Ojek Izin TitipJalan (%)', 'group' => 'titipjalan'],
            ['key' => 'titipjalan_radius_default', 'value' => '200',   'label' => 'Radius Koridor Default (meter)',       'group' => 'titipjalan'],
            ['key' => 'titipjalan_max_titipan',    'value' => '3',     'label' => 'Maksimal Titipan per Sesi',            'group' => 'titipjalan'],
            ['key' => 'titipjalan_saldo_minimum',  'value' => '10000', 'label' => 'Saldo Minimum Wallet Mitra (Rp)',      'group' => 'titipjalan'],
            ['key' => 'tarif_titipan_dasar',       'value' => '5000',  'label' => 'Tarif Dasar Titipan (Rp)',             'group' => 'titipjalan'],
            ['key' => 'tarif_titipan_per_km',      'value' => '2000',  'label' => 'Tarif per KM Titipan (Rp)',            'group' => 'titipjalan'],
        ];

        foreach ($settings as $s) {
            DB::table('settings')->updateOrInsert(['key' => $s['key']], array_merge($s, [
                'created_at' => now(), 'updated_at' => now(),
            ]));
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'komisi_titipjalan', 'diskon_titipjalan_persen', 'titipjalan_radius_default',
            'titipjalan_max_titipan', 'titipjalan_saldo_minimum', 'tarif_titipan_dasar', 'tarif_titipan_per_km',
        ])->delete();

        Schema::dropIfExists('titipan_orders');
        Schema::dropIfExists('titipjalan_sessions');

        Schema::table('ojek_orders', function (Blueprint $table) {
            $table->dropColumn(['izin_titipjalan', 'diskon_titipjalan']);
        });
    }
};
