<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaundryOrder extends Model
{
    protected $fillable = [
        'order_code','pelanggan_id','mitra_id','jenis_layanan','berat_kg',
        'harga_per_kg','total_price','komisi_platform','penghasilan_mitra',
        'pickup_address','notes','status','payment_method','payment_status',
        'accepted_at','completed_at',
    ];

    protected $casts = ['accepted_at' => 'datetime', 'completed_at' => 'datetime'];

    public function pelanggan(): BelongsTo { return $this->belongsTo(User::class, 'pelanggan_id'); }
    public function mitra(): BelongsTo     { return $this->belongsTo(User::class, 'mitra_id'); }
}
