<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TitipJalanSession extends Model
{
    protected $table = 'titipjalan_sessions';

    protected $fillable = [
        'mitra_id', 'ojek_order_id', 'mode',
        'asal_address', 'asal_lat', 'asal_lng',
        'tujuan_address', 'tujuan_lat', 'tujuan_lng',
        'radius_meter', 'max_titipan', 'max_berat_kg', 'jenis_barang_diterima',
        'status', 'started_at', 'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at'   => 'datetime',
    ];

    public function mitra(): BelongsTo      { return $this->belongsTo(User::class, 'mitra_id'); }
    public function ojekOrder(): BelongsTo  { return $this->belongsTo(OjekOrder::class); }
    public function titipan(): HasMany      { return $this->hasMany(TitipanOrder::class, 'session_id'); }

    public function titipanAktif(): HasMany
    {
        return $this->hasMany(TitipanOrder::class, 'session_id')
            ->whereNotIn('status', ['selesai', 'dibatalkan', 'ditolak']);
    }

    // Cek apakah sebuah titik (lat,lng) masuk dalam koridor rute sesi ini
    public function dalamKoridor(float $lat, float $lng): bool
    {
        return self::hitungJarakKeGaris(
            $lat, $lng,
            $this->asal_lat, $this->asal_lng,
            $this->tujuan_lat, $this->tujuan_lng
        ) <= $this->radius_meter;
    }

    // Jarak (meter) dari titik P ke segmen garis A→B (equirectangular approximation)
    public static function hitungJarakKeGaris(
        float $pLat, float $pLng,
        float $aLat, float $aLng,
        float $bLat, float $bLng
    ): float {
        $cosLat = cos(deg2rad(($aLat + $bLat) / 2));

        // Konversi ke meter relatif terhadap titik A
        $ax = 0;          $ay = 0;
        $bx = ($bLng - $aLng) * $cosLat * 111320;
        $by = ($bLat - $aLat) * 110540;
        $px = ($pLng - $aLng) * $cosLat * 111320;
        $py = ($pLat - $aLat) * 110540;

        $dx = $bx - $ax;
        $dy = $by - $ay;
        $lenSq = $dx * $dx + $dy * $dy;

        if ($lenSq == 0) {
            return sqrt($px * $px + $py * $py);
        }

        // Proyeksi titik P ke garis, clamped ke [0,1]
        $t = max(0, min(1, ($px * $dx + $py * $dy) / $lenSq));
        $nearX = $ax + $t * $dx;
        $nearY = $ay + $t * $dy;

        return sqrt(($px - $nearX) ** 2 + ($py - $nearY) ** 2);
    }
}
