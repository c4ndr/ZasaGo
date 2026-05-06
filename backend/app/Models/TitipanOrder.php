<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TitipanOrder extends Model
{
    protected $fillable = [
        'order_code', 'session_id', 'pelanggan_id', 'mitra_id',
        'pickup_address', 'pickup_lat', 'pickup_lng',
        'destination_address', 'destination_lat', 'destination_lng',
        'distance_km', 'jenis_barang', 'berat_kg', 'catatan',
        'nama_pesanan', 'harga_barang',
        'harga_asli', 'diskon_persen', 'total_price',
        'komisi_platform', 'penghasilan_mitra',
        'status', 'payment_method', 'payment_status',
        'accepted_at', 'completed_at', 'tolak_alasan',
    ];

    protected $casts = ['accepted_at' => 'datetime', 'completed_at' => 'datetime'];

    public function pelanggan(): BelongsTo { return $this->belongsTo(User::class, 'pelanggan_id'); }
    public function mitra(): BelongsTo     { return $this->belongsTo(User::class, 'mitra_id'); }
    public function session(): BelongsTo   { return $this->belongsTo(TitipJalanSession::class, 'session_id'); }

    // Haversine distance antara dua koordinat (km)
    public static function hitungJarak(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r  = 6371;
        $dL = deg2rad($lat2 - $lat1);
        $dG = deg2rad($lng2 - $lng1);
        $a  = sin($dL / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dG / 2) ** 2;
        return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
