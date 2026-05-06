<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','mitra','pelanggan','penjual') NOT NULL DEFAULT 'pelanggan'");

        Schema::create('service_categories', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('icon')->default('🔧');
            $table->text('deskripsi')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_categories');
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','mitra','pelanggan') NOT NULL DEFAULT 'pelanggan'");
    }
};
