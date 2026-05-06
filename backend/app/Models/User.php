<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'phone', 'password', 'role',
        'avatar', 'address', 'latitude', 'longitude', 'is_active',
        'gender', 'birth_date', 'wallet_balance',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'is_active'         => 'boolean',
        'latitude'          => 'decimal:8',
        'longitude'         => 'decimal:8',
        'birth_date'        => 'date',
        'wallet_balance'    => 'decimal:2',
    ];

    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function isMitra(): bool { return str_starts_with($this->role ?? '', 'mitra'); }
    public function isPelanggan(): bool { return $this->role === 'pelanggan'; }
    public function isPenjual(): bool { return $this->role === 'penjual'; }

    public function mitraServiceType(): string
    {
        return match ($this->role) {
            'mitra'             => 'ojek',
            'mitra_urut'        => 'urut',
            'mitra_laundry'     => 'laundry',
            'mitra_catering'    => 'catering',
            'mitra_kebersihan'  => 'kebersihan',
            'mitra_antar_barang'=> 'antar_barang',
            default             => 'ojek',
        };
    }

    public function mitraProfile(): HasOne
    {
        return $this->hasOne(MitraProfile::class);
    }

    public function ojekOrdersAsPelanggan(): HasMany
    {
        return $this->hasMany(OjekOrder::class, 'pelanggan_id');
    }

    public function ojekOrdersAsMitra(): HasMany
    {
        return $this->hasMany(OjekOrder::class, 'mitra_id');
    }

    public function urutServices(): HasMany
    {
        return $this->hasMany(UrutService::class, 'mitra_id');
    }

    public function urutOrdersAsPelanggan(): HasMany
    {
        return $this->hasMany(UrutOrder::class, 'pelanggan_id');
    }

    public function urutOrdersAsMitra(): HasMany
    {
        return $this->hasMany(UrutOrder::class, 'mitra_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'mitra_id');
    }

    public function productOrders(): HasMany
    {
        return $this->hasMany(ProductOrder::class, 'pelanggan_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }
}
