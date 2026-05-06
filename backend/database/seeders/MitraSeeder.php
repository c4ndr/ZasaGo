<?php

namespace Database\Seeders;

use App\Models\MitraProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MitraSeeder extends Seeder
{
    public function run(): void
    {
        $mitras = [
            [
                'phone'        => '081000000007',
                'role'         => 'mitra_urut',
                'service_type' => 'urut',
                'name'         => 'Dewi Terapis',
                'email'        => 'urut2@godesa.id',
                'bio'          => 'Terapis urut bersertifikat, pengalaman 3 tahun',
            ],
            [
                'phone'        => '081000000008',
                'role'         => 'mitra_laundry',
                'service_type' => 'laundry',
                'name'         => 'Laundry Bersih Jaya',
                'email'        => 'laundry@godesa.id',
                'bio'          => 'Laundry kiloan & satuan, antar jemput, 1-2 hari selesai',
                'store_name'   => 'Laundry Bersih Jaya',
            ],
            [
                'phone'        => '081000000009',
                'role'         => 'mitra_catering',
                'service_type' => 'catering',
                'name'         => 'Catering Bu Tini',
                'email'        => 'catering@godesa.id',
                'bio'          => 'Spesialis masakan Jawa & Padang, min 10 porsi',
                'store_name'   => 'Catering Bu Tini',
            ],
            [
                'phone'        => '081000000010',
                'role'         => 'mitra_kebersihan',
                'service_type' => 'kebersihan',
                'name'         => 'Bersih Kilat',
                'email'        => 'kebersihan@godesa.id',
                'bio'          => 'Jasa bersih rumah & kantor, peralatan lengkap',
            ],
            [
                'phone'        => '081000000011',
                'role'         => 'mitra_antar_barang',
                'service_type' => 'antar_barang',
                'name'         => 'Antar Cepat Express',
                'email'        => 'antar@godesa.id',
                'bio'          => 'Pengiriman dalam & antar kota, kapasitas hingga 500 kg',
                'vehicle_type'  => 'Motor',
                'vehicle_plate' => 'AB 5678 EF',
            ],
        ];

        foreach ($mitras as $m) {
            if (User::where('phone', $m['phone'])->exists()) {
                continue;
            }
            $user = User::create([
                'name'     => $m['name'],
                'email'    => $m['email'],
                'phone'    => $m['phone'],
                'password' => Hash::make('password'),
                'role'     => $m['role'],
            ]);
            MitraProfile::create([
                'user_id'       => $user->id,
                'service_type'  => $m['service_type'],
                'bio'           => $m['bio']           ?? null,
                'store_name'    => $m['store_name']    ?? null,
                'vehicle_type'  => $m['vehicle_type']  ?? null,
                'vehicle_plate' => $m['vehicle_plate'] ?? null,
                'is_available'  => true,
                'is_verified'   => false,
            ]);
        }
    }
}
