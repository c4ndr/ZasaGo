<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Pelanggan hanya bisa subscribe channel ojek order miliknya sendiri
Broadcast::channel('ojek-order.{ojekOrderId}', function ($user, $ojekOrderId) {
    return \App\Models\OjekOrder::where('id', $ojekOrderId)
        ->where('pelanggan_id', $user->id)
        ->exists();
});
