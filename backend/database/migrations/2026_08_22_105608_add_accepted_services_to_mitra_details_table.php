<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('mitra_details', function (Blueprint $table) {
            // Null = terima semua layanan (default). Diisi array jenis layanan yang dipilih mitra.
            $table->json('accepted_services')->nullable()->after('mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mitra_details', function (Blueprint $table) {
            $table->dropColumn('accepted_services');
        });
    }
};
