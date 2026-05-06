<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KebersihanOrder extends Model
{
    protected $fillable = [
        'order_code','pelanggan_id','mitra_id','jenis_layanan','durasi_jam',
        'harga_per_jam','total_price','komisi_platform','penghasilan_mitra',
        'service_address','schedule_date','notes','status',
        'payment_method','payment_status','accepted_at','completed_at',
    ];

    protected $casts = ['schedule_date' => 'datetime', 'accepted_at' => 'datetime', 'completed_at' => 'datetime'];

    public function pelanggan(): BelongsTo { return $this->belongsTo(User::class, 'pelanggan_id'); }
    public function mitra(): BelongsTo     { return $this->belongsTo(User::class, 'mitra_id'); }
}
