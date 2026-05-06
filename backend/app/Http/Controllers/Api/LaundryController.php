<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LaundryOrder;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LaundryController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mitra_id'      => 'nullable|exists:users,id',
            'jenis_layanan' => 'required|string',
            'berat_kg'      => 'nullable|numeric|min:0.5',
            'harga_per_kg'  => 'required|numeric|min:0',
            'pickup_address'=> 'nullable|string',
            'notes'         => 'nullable|string',
            'payment_method'=> 'sometimes|in:tunai,dompet_digital,transfer',
        ]);

        $komisiPersen = (float) Setting::get('komisi_laundry', 10);
        $total        = ($data['berat_kg'] ?? 1) * $data['harga_per_kg'];
        $komisi       = $total * $komisiPersen / 100;

        $order = LaundryOrder::create([
            ...$data,
            'order_code'       => 'LDR-' . strtoupper(Str::random(8)),
            'pelanggan_id'     => $request->user()->id,
            'total_price'      => $total,
            'komisi_platform'  => $komisi,
            'penghasilan_mitra'=> $total - $komisi,
        ]);

        return response()->json(['message' => 'Pesanan laundry dibuat', 'order' => $order], 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->isMitra()) {
            $orders = LaundryOrder::where('mitra_id', $user->id)->with('pelanggan')->latest()->paginate(50);
        } else {
            $orders = LaundryOrder::where('pelanggan_id', $user->id)->with('mitra')->latest()->paginate(50);
        }
        return response()->json($orders);
    }

    public function tersedia(): JsonResponse
    {
        // Hanya pesanan tanpa mitra yang bisa diambil
        $orders = LaundryOrder::whereNull('mitra_id')
            ->where('status', 'menunggu')
            ->with('pelanggan')
            ->latest()
            ->paginate(20);
        return response()->json($orders);
    }

    public function accept(Request $request, LaundryOrder $laundryOrder): JsonResponse
    {
        if ($laundryOrder->mitra_id !== null) {
            return response()->json(['message' => 'Pesanan sudah diambil mitra lain'], 422);
        }

        if ($laundryOrder->status !== 'menunggu') {
            return response()->json(['message' => 'Pesanan tidak dalam status menunggu'], 422);
        }

        $komisiPersen = (float) Setting::get('komisi_laundry', 10);
        $komisi       = $laundryOrder->total_price * $komisiPersen / 100;

        $laundryOrder->update([
            'mitra_id'          => $request->user()->id,
            'status'            => 'diterima',
            'accepted_at'       => now(),
            'komisi_platform'   => $komisi,
            'penghasilan_mitra' => $laundryOrder->total_price - $komisi,
        ]);

        return response()->json(['message' => 'Pesanan berhasil diambil', 'order' => $laundryOrder->fresh()->load('pelanggan')]);
    }

    public function updateStatus(Request $request, LaundryOrder $laundryOrder): JsonResponse
    {
        if ($laundryOrder->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $request->validate(['status' => 'required|in:diterima,diproses,siap,dikirim,selesai,dibatalkan']);

        $updates = ['status' => $request->status];
        if ($request->status === 'diterima') $updates['accepted_at']  = now();
        if ($request->status === 'selesai')  {
            $updates['completed_at']   = now();
            $updates['payment_status'] = 'sudah_bayar';
        }

        $laundryOrder->update($updates);
        return response()->json(['message' => 'Status diperbarui', 'order' => $laundryOrder]);
    }

    public function cancel(Request $request, LaundryOrder $laundryOrder): JsonResponse
    {
        if ($laundryOrder->pelanggan_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if (in_array($laundryOrder->status, ['selesai', 'dibatalkan', 'diproses'])) {
            return response()->json(['message' => 'Pesanan tidak bisa dibatalkan di tahap ini'], 422);
        }

        $laundryOrder->update(['status' => 'dibatalkan']);
        return response()->json(['message' => 'Pesanan berhasil dibatalkan']);
    }
}
