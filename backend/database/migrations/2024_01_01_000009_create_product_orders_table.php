<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->foreignId('pelanggan_id')->constrained('users')->onDelete('cascade');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('shipping_cost', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->enum('status', [
                'menunggu_pembayaran',
                'pembayaran_dikonfirmasi',
                'diproses',
                'dikirim',
                'selesai',
                'dibatalkan',
                'refund',
            ])->default('menunggu_pembayaran');
            $table->enum('payment_method', ['tunai', 'transfer', 'dompet_digital', 'cod'])->default('cod');
            $table->enum('payment_status', ['belum_bayar', 'sudah_bayar', 'refunded'])->default('belum_bayar');
            $table->text('shipping_address');
            $table->string('recipient_name');
            $table->string('recipient_phone', 20);
            $table->string('tracking_number')->nullable();
            $table->text('notes')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_orders');
    }
};
