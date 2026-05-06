<?php

namespace App\Events;

use App\Models\TitipanOrder;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JastipDiterima implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int   $ojekOrderId,
        public readonly int   $pelangganId,
        public readonly float $diskonBaru,      // total diskon_titipjalan setelah diterima
        public readonly float $masterCut,       // potongan dari titipan ini saja
        public readonly string $namaBarang,
        public readonly string $orderCode,
        public readonly float $ongkirEfektif,   // price - diskon_baru
    ) {}

    public function broadcastOn(): array
    {
        // Private channel per pelanggan (hanya pemilik order yang dengar)
        return [
            new PrivateChannel('ojek-order.' . $this->ojekOrderId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'jastip.diterima';
    }

    public function broadcastWith(): array
    {
        return [
            'ojek_order_id' => $this->ojekOrderId,
            'diskon_baru'   => $this->diskonBaru,
            'master_cut'    => $this->masterCut,
            'nama_barang'   => $this->namaBarang,
            'order_code'    => $this->orderCode,
            'ongkir_efektif'=> $this->ongkirEfektif,
        ];
    }
}
