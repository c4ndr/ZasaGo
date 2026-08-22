<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MitraDetail extends Model
{
    // Jenis layanan yang bisa dipilih mitra untuk terima orderan
    public const ALL_SERVICES = ['zasago', 'jastip', 'zasafood', 'zasamart', 'zasaride', 'zasahome', 'zasaserv'];

    protected $fillable = [
        'user_id',
        'vehicle_plate',
        'vehicle_brand',
        'vehicle_year',
        'mode',
        'badge',
        'total_transactions',
        'average_rating',
        'is_online',
        'last_seen_at',
        'accepted_services',
    ];

    protected function casts(): array
    {
        return [
            'is_online'         => 'boolean',
            'last_seen_at'      => 'datetime',
            'accepted_services' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Null = belum diatur mitra → default terima semua layanan
    public function acceptsService(string $service): bool
    {
        return in_array($service, $this->accepted_services ?? self::ALL_SERVICES, true);
    }
}
