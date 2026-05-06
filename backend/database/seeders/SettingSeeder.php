<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Tarif Ojek
            ['key' => 'tarif_dasar_ojek',    'value' => '5000',  'label' => 'Tarif Dasar Ojek (Rp)',    'group' => 'ojek'],
            ['key' => 'tarif_per_km_ojek',   'value' => '3000',  'label' => 'Tarif per KM Ojek (Rp)',   'group' => 'ojek'],
            // Tarif Antar Barang
            ['key' => 'tarif_dasar_antar',   'value' => '8000',  'label' => 'Tarif Dasar Antar (Rp)',   'group' => 'antar'],
            ['key' => 'tarif_per_km_antar',  'value' => '4000',  'label' => 'Tarif per KM Antar (Rp)',  'group' => 'antar'],
            // Komisi Platform
            ['key' => 'komisi_ojek',         'value' => '15',    'label' => 'Komisi Ojek (%)',          'group' => 'komisi'],
            ['key' => 'komisi_urut',         'value' => '15',    'label' => 'Komisi Urut (%)',          'group' => 'komisi'],
            ['key' => 'komisi_laundry',      'value' => '10',    'label' => 'Komisi Laundry (%)',       'group' => 'komisi'],
            ['key' => 'komisi_catering',     'value' => '10',    'label' => 'Komisi Catering (%)',      'group' => 'komisi'],
            ['key' => 'komisi_kebersihan',   'value' => '15',    'label' => 'Komisi Kebersihan (%)',    'group' => 'komisi'],
            ['key' => 'komisi_antar',        'value' => '12',    'label' => 'Komisi Antar Barang (%)',  'group' => 'komisi'],
            ['key' => 'komisi_produk',       'value' => '8',     'label' => 'Komisi Produk (%)',        'group' => 'komisi'],
            // Minimum jarak ojek
            ['key' => 'ojek_min_distance',   'value' => '1',     'label' => 'Jarak Minimum Ojek (KM)', 'group' => 'ojek'],
        ];

        foreach ($settings as $s) {
            Setting::updateOrCreate(['key' => $s['key']], $s);
        }
    }
}
