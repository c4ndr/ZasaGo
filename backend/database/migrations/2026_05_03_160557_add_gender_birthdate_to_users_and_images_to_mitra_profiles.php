<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('gender', ['pria', 'wanita'])->nullable()->after('address');
            $table->date('birth_date')->nullable()->after('gender');
        });

        Schema::table('mitra_profiles', function (Blueprint $table) {
            $table->longText('ktp_image')->nullable()->after('ktp_number');
            $table->longText('sim_image')->nullable()->after('ktp_image');
            $table->string('store_name')->nullable()->after('sim_image');
            $table->text('store_desc')->nullable()->after('store_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['gender', 'birth_date']);
        });
        Schema::table('mitra_profiles', function (Blueprint $table) {
            $table->dropColumn(['ktp_image', 'sim_image', 'store_name', 'store_desc']);
        });
    }
};
