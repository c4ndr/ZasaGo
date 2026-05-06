<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Expand users.role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'admin','mitra','pelanggan','penjual',
            'mitra_urut','mitra_laundry','mitra_catering','mitra_kebersihan','mitra_antar_barang'
        ) NOT NULL DEFAULT 'pelanggan'");

        // Expand mitra_profiles.service_type enum
        DB::statement("ALTER TABLE mitra_profiles MODIFY COLUMN service_type ENUM(
            'ojek','urut','produk','semua','laundry','catering','kebersihan','antar_barang'
        ) DEFAULT 'ojek'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE mitra_profiles MODIFY COLUMN service_type ENUM(
            'ojek','urut','produk','semua'
        ) DEFAULT 'ojek'");

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'admin','mitra','pelanggan','penjual'
        ) NOT NULL DEFAULT 'pelanggan'");
    }
};
