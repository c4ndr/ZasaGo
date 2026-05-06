<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CateringOrder;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CateringController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mitra_id'        => 'nullable|exists:users,id',
            'jenis_acara'     => 'nullable|string',
            'jumlah_porsi'    => 'required|integer|min:1',
            'harga_per_porsi' => 'required|numeric|min:0',
            'delivery_address'=> 'nullable|string',
            'event_date'      => 'nullable|date',
            'menu_notes'      => 'nullable|string',
            'notes'           => 'nullable|string',
            'payment_method'  => 'sometimes|in:tunai,dompet_digital,transfer',
        ]);

        $komisiPersen = (float) Setting::get('komisi_catering', 10);
        $total        = $data['jumlah_porsi'] * $data['harga_per_porsi'];
        $komisi       = $total * $komisiPersen / 100;

        $order = CateringOrder::create([
            ...$data,
            'order_code'       => 'CTR-' . strtoupper(Str::random(8)),
            'pelanggan_id'     => $request->user()->id,
            'total_price'      => $total,
            'komisi_platform'  => $komisi,
            'penghasilan_mitra'=> $total - $komisi,
        ]);

        return response()->json(['message' => 'Pesanan catering dibuat', 'order' => $order], 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->isMitra()) {
            $orders = CateringOrder::where('mitra_id', $user->id)->with('pelanggan')->latest()->paginate(50);
        } else {
            $orders = CateringOrder::where('pelanggan_id', $user->id)->with('mitra')->latest()->paginate(50);
        }
        return response()->json($orders);
    }

    public function tersedia(): JsonResponse
    {
        $orders = CateringOrder::whereNull('mitra_id')
            ->where('status', 'menunggu')
            ->with('pelanggan')
            ->latest()
            ->paginate(20);
        return response()->json($orders);
    }

    public function accept(Request $request, CateringOrder $cateringOrder): JsonResponse
    {
        if ($cateringOrder->mitra_id !== null) {
            return response()->json(['message' => 'Pesanan sudah diambil mitra lain'], 422);
        }

        if ($cateringOrder->status !== 'menunggu') {
            return response()->json(['message' => 'Pesanan tidak dalam status menunggu'], 422);
        }

        $komisiPersen = (float) Setting::get('komisi_catering', 10);
        $komisi       = $cateringOrder->total_price * $komisiPersen / 100;

        $cateringOrder->update([
            'mitra_id'          => $request->user()->id,
            'status'            => 'diterima',
            'accepted_at'       => now(),
            'komisi_platform'   => $komisi,
            'penghasilan_mitra' => $cateringOrder->total_price - $komisi,
        ]);

        return response()->json(['message' => 'Pesanan berhasil diambil', 'order' => $cateringOrder->fresh()->load('pelanggan')]);
    }

    public function updateStatus(Request $request, CateringOrder $cateringOrder): JsonResponse
    {
        if ($cateringOrder->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $request->validate(['status' => 'required|in:diterima,diproses,dikirim,selesai,dibatalkan']);

        $updates = ['status' => $request->status];
        if ($request->status === 'diterima') $updates['accepted_at']  = now();
        if ($request->status === 'selesai')  {
            $updates['completed_at']   = now();
            $updates['payment_status'] = 'sudah_bayar';
        }

        $cateringOrder->update($updates);
        return response()->json(['message' => 'Status diperbarui', 'order' => $cateringOrder]);
    }

    public function cancel(Request $request, CateringOrder $cateringOrder): JsonResponse
    {
        if ($cateringOrder->pelanggan_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if (in_array($cateringOrder->status, ['selesai', 'dibatalkan', 'diproses', 'dikirim'])) {
            return response()->json(['message' => 'Pesanan tidak bisa dibatalkan di tahap ini'], 422);
        }

        $cateringOrder->update(['status' => 'dibatalkan']);
        return response()->json(['message' => 'Pesanan berhasil dibatalkan']);
    }
}
