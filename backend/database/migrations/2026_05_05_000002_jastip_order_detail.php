<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('titipan_orders', function (Blueprint $table) {
            $table->string('nama_pesanan')->nullable()->after('catatan');
            $table->decimal('harga_barang', 12, 2)->nullable()->after('nama_pesanan');
            $table->string('tolak_alasan')->nullable()->after('completed_at');
        });

        // Extend status enum to include 'ditolak'
        DB::statement("ALTER TABLE titipan_orders MODIFY COLUMN status
            ENUM('menunggu','diterima','dijemput','diantar','selesai','dibatalkan','ditolak')
            DEFAULT 'menunggu'");
    }

    public function down(): void
    {
        Schema::table('titipan_orders', function (Blueprint $table) {
            $table->dropColumn(['nama_pesanan', 'harga_barang', 'tolak_alasan']);
        });

        DB::statement("ALTER TABLE titipan_orders MODIFY COLUMN status
            ENUM('menunggu','diterima','dijemput','diantar','selesai','dibatalkan')
            DEFAULT 'menunggu'");
    }
};
