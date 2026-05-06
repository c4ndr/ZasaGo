<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MitraProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'service_type', 'bio', 'ktp_number',
        'vehicle_type', 'vehicle_plate', 'rating', 'total_reviews',
        'total_orders', 'is_available', 'is_verified', 'balance',
        'ktp_image', 'sim_image', 'store_name', 'store_desc',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'is_verified'  => 'boolean',
        'rating'       => 'decimal:2',
        'balance'      => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(MitraDocument::class);
    }
}
