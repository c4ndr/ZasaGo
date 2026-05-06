<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Settings table
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value');
            $table->string('label')->nullable();
            $table->string('group')->default('umum');
            $table->timestamps();
        });

        // Laundry orders
        Schema::create('laundry_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->foreignId('pelanggan_id')->constrained('users');
            $table->foreignId('mitra_id')->nullable()->constrained('users');
            $table->string('jenis_layanan');
            $table->decimal('berat_kg', 8, 2)->nullable();
            $table->decimal('harga_per_kg', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->decimal('komisi_platform', 12, 2)->default(0);
            $table->decimal('penghasilan_mitra', 12, 2)->default(0);
            $table->string('pickup_address')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['menunggu','diterima','diproses','siap','dikirim','selesai','dibatalkan'])->default('menunggu');
            $table->enum('payment_method', ['tunai','dompet_digital','transfer'])->default('tunai');
            $table->enum('payment_status', ['belum_bayar','sudah_bayar'])->default('belum_bayar');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // Catering orders
        Schema::create('catering_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->foreignId('pelanggan_id')->constrained('users');
            $table->foreignId('mitra_id')->nullable()->constrained('users');
            $table->string('jenis_acara')->nullable();
            $table->integer('jumlah_porsi')->default(1);
            $table->decimal('harga_per_porsi', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->decimal('komisi_platform', 12, 2)->default(0);
            $table->decimal('penghasilan_mitra', 12, 2)->default(0);
            $table->string('delivery_address')->nullable();
            $table->dateTime('event_date')->nullable();
            $table->text('menu_notes')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['menunggu','diterima','diproses','dikirim','selesai','dibatalkan'])->default('menunggu');
            $table->enum('payment_method', ['tunai','dompet_digital','transfer'])->default('tunai');
            $table->enum('payment_status', ['belum_bayar','sudah_bayar'])->default('belum_bayar');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // Kebersihan orders
        Schema::create('kebersihan_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->foreignId('pelanggan_id')->constrained('users');
            $table->foreignId('mitra_id')->nullable()->constrained('users');
            $table->string('jenis_layanan');
            $table->decimal('durasi_jam', 8, 2)->default(2);
            $table->decimal('harga_per_jam', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->decimal('komisi_platform', 12, 2)->default(0);
            $table->decimal('penghasilan_mitra', 12, 2)->default(0);
            $table->string('service_address');
            $table->dateTime('schedule_date')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['menunggu','diterima','menuju_lokasi','sedang_berlangsung','selesai','dibatalkan'])->default('menunggu');
            $table->enum('payment_method', ['tunai','dompet_digital','transfer'])->default('tunai');
            $table->enum('payment_status', ['belum_bayar','sudah_bayar'])->default('belum_bayar');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // Antar barang orders
        Schema::create('antar_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->foreignId('pelanggan_id')->constrained('users');
            $table->foreignId('mitra_id')->nullable()->constrained('users');
            $table->string('pickup_address');
            $table->decimal('pickup_latitude', 10, 7)->nullable();
            $table->decimal('pickup_longitude', 10, 7)->nullable();
            $table->string('destination_address');
            $table->decimal('destination_latitude', 10, 7)->nullable();
            $table->decimal('destination_longitude', 10, 7)->nullable();
            $table->decimal('distance_km', 8, 2);
            $table->string('jenis_barang')->nullable();
            $table->decimal('berat_kg', 8, 2)->nullable();
            $table->decimal('total_price', 12, 2);
            $table->decimal('komisi_platform', 12, 2)->default(0);
            $table->decimal('penghasilan_mitra', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->enum('status', ['mencari_driver','driver_ditemukan','menuju_pickup','barang_dijemput','dalam_perjalanan','selesai','dibatalkan'])->default('mencari_driver');
            $table->enum('payment_method', ['tunai','dompet_digital','transfer'])->default('tunai');
            $table->enum('payment_status', ['belum_bayar','sudah_bayar'])->default('belum_bayar');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // Add komisi columns to existing tables
        Schema::table('ojek_orders', function (Blueprint $table) {
            $table->decimal('komisi_platform', 12, 2)->default(0)->after('driver_earnings');
        });

        Schema::table('urut_orders', function (Blueprint $table) {
            $table->decimal('komisi_platform', 12, 2)->default(0)->after('price');
            $table->decimal('penghasilan_mitra', 12, 2)->default(0)->after('komisi_platform');
        });
    }

    public function down(): void
    {
        Schema::table('urut_orders', function (Blueprint $table) {
            $table->dropColumn(['komisi_platform', 'penghasilan_mitra']);
        });
        Schema::table('ojek_orders', function (Blueprint $table) {
            $table->dropColumn('komisi_platform');
        });
        Schema::dropIfExists('antar_orders');
        Schema::dropIfExists('kebersihan_orders');
        Schema::dropIfExists('catering_orders');
        Schema::dropIfExists('laundry_orders');
        Schema::dropIfExists('settings');
    }
};
