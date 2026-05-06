<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class UrutOrder extends Model
{
    protected $fillable = [
        'order_code', 'pelanggan_id', 'mitra_id', 'service_id',
        'address', 'latitude', 'longitude', 'scheduled_at',
        'price', 'mitra_earnings', 'status', 'payment_method', 'payment_status',
        'notes', 'cancellation_reason',
        'accepted_at', 'started_at', 'completed_at', 'cancelled_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'accepted_at'  => 'datetime',
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'price'          => 'decimal:2',
        'mitra_earnings' => 'decimal:2',
    ];

    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelanggan_id');
    }

    public function mitra(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mitra_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(UrutService::class, 'service_id');
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
