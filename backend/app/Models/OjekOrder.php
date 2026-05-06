<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class OjekOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_code', 'pelanggan_id', 'mitra_id',
        'pickup_address', 'pickup_latitude', 'pickup_longitude',
        'destination_address', 'destination_latitude', 'destination_longitude',
        'distance_km', 'price', 'driver_earnings', 'komisi_platform', 'status',
        'payment_method', 'payment_status', 'notes', 'cancellation_reason',
        'izin_titipjalan', 'diskon_titipjalan',
        'accepted_at', 'picked_up_at', 'completed_at', 'cancelled_at',
    ];

    protected $casts = [
        'accepted_at'  => 'datetime',
        'picked_up_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'price'            => 'decimal:2',
        'driver_earnings'  => 'decimal:2',
        'komisi_platform'  => 'decimal:2',
        'diskon_titipjalan'=> 'decimal:2',
        'distance_km'      => 'decimal:2',
        'izin_titipjalan'  => 'boolean',
    ];

    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelanggan_id');
    }

    public function mitra(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mitra_id');
    }

    public function review(): MorphOne
    {
        return $this->morphOne(Review::class, 'reviewable');
    }

    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'payable');
    }
}
