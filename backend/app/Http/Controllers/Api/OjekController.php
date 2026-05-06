<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OjekOrder;
use App\Models\Setting;
use App\Models\TitipJalanSession;
use App\Models\TitipanOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OjekController extends Controller
{
    private function tarifDasar(): float  { return (float) Setting::get('tarif_dasar_ojek', 5000); }
    private function tarifPerKm(): float  { return (float) Setting::get('tarif_per_km_ojek', 3000); }
    private function komisiPersen(): float { return (float) Setting::get('komisi_ojek', 10); }

    public function hitungTarif(Request $request): JsonResponse
    {
        $request->validate(['distance_km' => 'required|numeric|min:0.1']);

        $harga = $this->tarifDasar() + ($request->distance_km * $this->tarifPerKm());

        return response()->json([
            'distance_km'  => $request->distance_km,
            'price'        => $harga,
            'tarif_dasar'  => $this->tarifDasar(),
            'tarif_per_km' => $this->tarifPerKm(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pickup_address'         => 'required|string',
            'pickup_latitude'        => 'nullable|numeric',
            'pickup_longitude'       => 'nullable|numeric',
            'destination_address'    => 'required|string',
            'destination_latitude'   => 'nullable|numeric',
            'destination_longitude'  => 'nullable|numeric',
            'distance_km'            => 'required|numeric|min:0.1',
            'payment_method'         => 'sometimes|in:tunai,dompet_digital,transfer',
            'notes'                  => 'nullable|string',
            'izin_titipjalan'        => 'sometimes|boolean',
        ]);

        $harga  = $this->tarifDasar() + ($data['distance_km'] * $this->tarifPerKm());
        $komisi = $harga * $this->komisiPersen() / 100;

        $order = OjekOrder::create([
            ...$data,
            'order_code'       => 'OJK-' . strtoupper(Str::random(8)),
            'pelanggan_id'     => $request->user()->id,
            'price'            => $harga,
            'driver_earnings'  => $harga - $komisi,
            'komisi_platform'  => $komisi,
        ]);

        return response()->json([
            'message' => 'Pesanan ojek berhasil dibuat',
            'order'   => $order,
        ], 201);
    }

    public function show(OjekOrder $ojekOrder): JsonResponse
    {
        return response()->json($ojekOrder->load(['pelanggan', 'mitra', 'review']));
    }

    // Titipan yang sudah diterima selama ride ini (untuk transparansi master pelanggan)
    public function jastipByOjekOrder(Request $request, OjekOrder $ojekOrder): JsonResponse
    {
        // Hanya pelanggan pemilik order ini yang boleh akses
        if ($ojekOrder->pelanggan_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $session = TitipJalanSession::where('ojek_order_id', $ojekOrder->id)->first();
        if (!$session) {
            return response()->json(['data' => [], 'total_diskon' => 0]);
        }

        $titipan = TitipanOrder::where('session_id', $session->id)
            ->whereIn('status', ['diterima', 'dijemput', 'diantar', 'selesai'])
            ->select(['id', 'order_code', 'nama_pesanan', 'total_price', 'status', 'accepted_at'])
            ->latest('accepted_at')
            ->get();

        return response()->json([
            'data'        => $titipan,
            'total_diskon'=> (float) $ojekOrder->diskon_titipjalan,
        ]);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isMitra()) {
            $orders = OjekOrder::where('mitra_id', $user->id)
                ->with('pelanggan')
                ->latest()
                ->paginate(15);
        } else {
            $orders = OjekOrder::where('pelanggan_id', $user->id)
                ->with('mitra')
                ->latest()
                ->paginate(15);
        }

        return response()->json($orders);
    }

    public function availableOrders(): JsonResponse
    {
        $orders = OjekOrder::where('status', 'mencari_driver')
            ->with('pelanggan')
            ->latest()
            ->paginate(15);

        return response()->json($orders);
    }

    public function accept(Request $request, OjekOrder $ojekOrder): JsonResponse
    {
        if ($ojekOrder->status !== 'mencari_driver') {
            return response()->json(['message' => 'Pesanan sudah tidak tersedia'], 422);
        }

        $statusAktif = ['driver_ditemukan', 'menuju_pickup', 'pelanggan_dijemput', 'dalam_perjalanan'];
        $orderAktif  = OjekOrder::where('mitra_id', $request->user()->id)
            ->whereIn('status', $statusAktif)
            ->exists();

        if ($orderAktif) {
            return response()->json(['message' => 'Selesaikan pesanan aktif terlebih dahulu sebelum menerima pesanan baru'], 422);
        }

        $ojekOrder->update([
            'mitra_id'    => $request->user()->id,
            'status'      => 'driver_ditemukan',
            'accepted_at' => now(),
        ]);

        return response()->json(['message' => 'Pesanan berhasil diterima', 'order' => $ojekOrder]);
    }

    public function updateStatus(Request $request, OjekOrder $ojekOrder): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:menuju_pickup,pelanggan_dijemput,dalam_perjalanan,selesai',
        ]);

        $updates = ['status' => $request->status];

        if ($request->status === 'pelanggan_dijemput') {
            $updates['picked_up_at'] = now();
        }
        if ($request->status === 'selesai') {
            $updates['completed_at']   = now();
            $updates['payment_status'] = 'sudah_bayar';
        }

        $ojekOrder->update($updates);

        return response()->json(['message' => 'Status diperbarui', 'order' => $ojekOrder]);
    }

    public function cancel(Request $request, OjekOrder $ojekOrder): JsonResponse
    {
        if (in_array($ojekOrder->status, ['selesai', 'dibatalkan'])) {
            return response()->json(['message' => 'Pesanan tidak bisa dibatalkan'], 422);
        }

        $ojekOrder->update([
            'status'              => 'dibatalkan',
            'cancellation_reason' => $request->reason,
            'cancelled_at'        => now(),
        ]);

        return response()->json(['message' => 'Pesanan berhasil dibatalkan']);
    }
}
