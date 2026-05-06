<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AntarOrder extends Model
{
    protected $fillable = [
        'order_code','pelanggan_id','mitra_id','pickup_address','pickup_latitude','pickup_longitude',
        'destination_address','destination_latitude','destination_longitude','distance_km',
        'jenis_barang','berat_kg','total_price','komisi_platform','penghasilan_mitra',
        'notes','status','payment_method','payment_status','accepted_at','completed_at',
    ];

    protected $casts = ['accepted_at' => 'datetime', 'completed_at' => 'datetime'];

    public function pelanggan(): BelongsTo { return $this->belongsTo(User::class, 'pelanggan_id'); }
    public function mitra(): BelongsTo     { return $this->belongsTo(User::class, 'mitra_id'); }
}
