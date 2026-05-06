<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mitra_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_profile_id')->constrained()->onDelete('cascade');
            $table->enum('document_type', ['ktp', 'sim', 'stnk', 'foto_kendaraan', 'foto_diri', 'sertifikat']);
            $table->string('file_path');
            $table->enum('status', ['pending', 'disetujui', 'ditolak'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mitra_documents');
    }
};
