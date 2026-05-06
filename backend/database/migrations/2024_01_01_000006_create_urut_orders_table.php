<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('urut_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->foreignId('pelanggan_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('mitra_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('service_id')->constrained('urut_services')->onDelete('cascade');
            $table->text('address');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamp('scheduled_at');
            $table->decimal('price', 12, 2);
            $table->decimal('mitra_earnings', 12, 2)->nullable();
            $table->enum('status', [
                'menunggu',
                'diterima',
                'menuju_lokasi',
                'sedang_berlangsung',
                'selesai',
                'dibatalkan',
            ])->default('menunggu');
            $table->enum('payment_method', ['tunai', 'dompet_digital', 'transfer'])->default('tunai');
            $table->enum('payment_status', ['belum_bayar', 'sudah_bayar'])->default('belum_bayar');
            $table->text('notes')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('urut_orders');
    }
};
