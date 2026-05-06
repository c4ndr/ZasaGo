<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KebersihanOrder;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class KebersihanController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mitra_id'       => 'nullable|exists:users,id',
            'jenis_layanan'  => 'required|string',
            'durasi_jam'     => 'required|numeric|min:1',
            'harga_per_jam'  => 'required|numeric|min:0',
            'service_address'=> 'required|string',
            'schedule_date'  => 'nullable|date',
            'notes'          => 'nullable|string',
            'payment_method' => 'sometimes|in:tunai,dompet_digital,transfer',
        ]);

        $komisiPersen = (float) Setting::get('komisi_kebersihan', 10);
        $total        = $data['durasi_jam'] * $data['harga_per_jam'];
        $komisi       = $total * $komisiPersen / 100;

        $order = KebersihanOrder::create([
            ...$data,
            'order_code'       => 'KBR-' . strtoupper(Str::random(8)),
            'pelanggan_id'     => $request->user()->id,
            'total_price'      => $total,
            'komisi_platform'  => $komisi,
            'penghasilan_mitra'=> $total - $komisi,
        ]);

        return response()->json(['message' => 'Pesanan kebersihan dibuat', 'order' => $order], 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->isMitra()) {
            $orders = KebersihanOrder::where('mitra_id', $user->id)->with('pelanggan')->latest()->paginate(50);
        } else {
            $orders = KebersihanOrder::where('pelanggan_id', $user->id)->with('mitra')->latest()->paginate(50);
        }
        return response()->json($orders);
    }

    public function tersedia(): JsonResponse
    {
        $orders = KebersihanOrder::whereNull('mitra_id')
            ->where('status', 'menunggu')
            ->with('pelanggan')
            ->latest()
            ->paginate(20);
        return response()->json($orders);
    }

    public function accept(Request $request, KebersihanOrder $kebersihanOrder): JsonResponse
    {
        if ($kebersihanOrder->mitra_id !== null) {
            return response()->json(['message' => 'Pesanan sudah diambil mitra lain'], 422);
        }

        if ($kebersihanOrder->status !== 'menunggu') {
            return response()->json(['message' => 'Pesanan tidak dalam status menunggu'], 422);
        }

        $komisiPersen = (float) Setting::get('komisi_kebersihan', 10);
        $komisi       = $kebersihanOrder->total_price * $komisiPersen / 100;

        $kebersihanOrder->update([
            'mitra_id'          => $request->user()->id,
            'status'            => 'diterima',
            'accepted_at'       => now(),
            'komisi_platform'   => $komisi,
            'penghasilan_mitra' => $kebersihanOrder->total_price - $komisi,
        ]);

        return response()->json(['message' => 'Pesanan berhasil diambil', 'order' => $kebersihanOrder->fresh()->load('pelanggan')]);
    }

    public function updateStatus(Request $request, KebersihanOrder $kebersihanOrder): JsonResponse
    {
        if ($kebersihanOrder->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $request->validate(['status' => 'required|in:diterima,menuju_lokasi,sedang_berlangsung,selesai,dibatalkan']);

        $updates = ['status' => $request->status];
        if ($request->status === 'diterima') $updates['accepted_at']  = now();
        if ($request->status === 'selesai')  {
            $updates['completed_at']   = now();
            $updates['payment_status'] = 'sudah_bayar';
        }

        $kebersihanOrder->update($updates);
        return response()->json(['message' => 'Status diperbarui', 'order' => $kebersihanOrder]);
    }

    public function cancel(Request $request, KebersihanOrder $kebersihanOrder): JsonResponse
    {
        if ($kebersihanOrder->pelanggan_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if (in_array($kebersihanOrder->status, ['selesai', 'dibatalkan', 'sedang_berlangsung'])) {
            return response()->json(['message' => 'Pesanan tidak bisa dibatalkan di tahap ini'], 422);
        }

        $kebersihanOrder->update(['status' => 'dibatalkan']);
        return response()->json(['message' => 'Pesanan berhasil dibatalkan']);
    }
}
