<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MitraDocument extends Model
{
    protected $fillable = [
        'mitra_profile_id', 'document_type', 'file_path', 'status', 'rejection_reason',
    ];

    public function mitraProfile(): BelongsTo
    {
        return $this->belongsTo(MitraProfile::class);
    }
}
