<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AntarOrder;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AntarController extends Controller
{
    public function hitungTarif(Request $request): JsonResponse
    {
        $request->validate(['distance_km' => 'required|numeric|min:0.1']);
        $tarifDasar  = (float) Setting::get('tarif_dasar_antar', 8000);
        $tarifPerKm  = (float) Setting::get('tarif_per_km_antar', 4000);
        $harga       = $tarifDasar + ($request->distance_km * $tarifPerKm);
        return response()->json(['distance_km' => $request->distance_km, 'price' => $harga]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pickup_address'          => 'required|string',
            'pickup_latitude'         => 'nullable|numeric',
            'pickup_longitude'        => 'nullable|numeric',
            'destination_address'     => 'required|string',
            'destination_latitude'    => 'nullable|numeric',
            'destination_longitude'   => 'nullable|numeric',
            'distance_km'             => 'required|numeric|min:0.1',
            'jenis_barang'            => 'nullable|string',
            'berat_kg'                => 'nullable|numeric',
            'notes'                   => 'nullable|string',
            'payment_method'          => 'sometimes|in:tunai,dompet_digital,transfer',
        ]);

        $tarifDasar   = (float) Setting::get('tarif_dasar_antar', 8000);
        $tarifPerKm   = (float) Setting::get('tarif_per_km_antar', 4000);
        $komisiPersen = (float) Setting::get('komisi_antar', 10);
        $total        = $tarifDasar + ($data['distance_km'] * $tarifPerKm);
        $komisi       = $total * $komisiPersen / 100;

        $order = AntarOrder::create([
            ...$data,
            'order_code'       => 'ANT-' . strtoupper(Str::random(8)),
            'pelanggan_id'     => $request->user()->id,
            'total_price'      => $total,
            'komisi_platform'  => $komisi,
            'penghasilan_mitra'=> $total - $komisi,
        ]);

        return response()->json(['message' => 'Pesanan antar barang dibuat', 'order' => $order], 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->isMitra()) {
            $orders = AntarOrder::where('mitra_id', $user->id)->with('pelanggan')->latest()->paginate(15);
        } else {
            $orders = AntarOrder::where('pelanggan_id', $user->id)->with('mitra')->latest()->paginate(15);
        }
        return response()->json($orders);
    }

    public function availableOrders(): JsonResponse
    {
        $orders = AntarOrder::where('status', 'mencari_driver')->with('pelanggan')->latest()->paginate(15);
        return response()->json($orders);
    }

    public function accept(Request $request, AntarOrder $antarOrder): JsonResponse
    {
        if ($antarOrder->status !== 'mencari_driver') {
            return response()->json(['message' => 'Pesanan sudah tidak tersedia'], 422);
        }
        $antarOrder->update(['mitra_id' => $request->user()->id, 'status' => 'driver_ditemukan', 'accepted_at' => now()]);
        return response()->json(['message' => 'Pesanan diterima', 'order' => $antarOrder]);
    }

    public function updateStatus(Request $request, AntarOrder $antarOrder): JsonResponse
    {
        $request->validate(['status' => 'required|in:menuju_pickup,barang_dijemput,dalam_perjalanan,selesai,dibatalkan']);
        $updates = ['status' => $request->status];
        if ($request->status === 'selesai') { $updates['completed_at'] = now(); $updates['payment_status'] = 'sudah_bayar'; }
        $antarOrder->update($updates);
        return response()->json(['message' => 'Status diperbarui', 'order' => $antarOrder]);
    }
}
