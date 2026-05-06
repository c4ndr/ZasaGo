<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CateringOrder extends Model
{
    protected $fillable = [
        'order_code','pelanggan_id','mitra_id','jenis_acara','jumlah_porsi',
        'harga_per_porsi','total_price','komisi_platform','penghasilan_mitra',
        'delivery_address','event_date','menu_notes','notes','status',
        'payment_method','payment_status','accepted_at','completed_at',
    ];

    protected $casts = ['event_date' => 'datetime', 'accepted_at' => 'datetime', 'completed_at' => 'datetime'];

    public function pelanggan(): BelongsTo { return $this->belongsTo(User::class, 'pelanggan_id'); }
    public function mitra(): BelongsTo     { return $this->belongsTo(User::class, 'mitra_id'); }
}
