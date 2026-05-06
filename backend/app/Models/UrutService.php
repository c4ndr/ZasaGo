<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class UrutService extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'mitra_id', 'name', 'description', 'duration_minutes', 'price', 'images', 'is_active',
    ];

    protected $casts = [
        'images'    => 'array',
        'is_active' => 'boolean',
        'price'     => 'decimal:2',
    ];

    public function mitra(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mitra_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(UrutOrder::class, 'service_id');
    }
}
