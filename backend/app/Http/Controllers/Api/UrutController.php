<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UrutOrder;
use App\Models\UrutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UrutController extends Controller
{
    private const BAGI_HASIL = 0.80;

    // ── Layanan ──────────────────────────────────────────────────────────────

    public function services(Request $request): JsonResponse
    {
        $services = UrutService::with('mitra')
            ->where('is_active', true)
            ->when($request->mitra_id, fn ($q) => $q->where('mitra_id', $request->mitra_id))
            ->paginate(15);

        return response()->json($services);
    }

    public function storeService(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'duration_minutes' => 'required|integer|min:15',
            'price'            => 'required|numeric|min:0',
        ]);

        $service = UrutService::create([...$data, 'mitra_id' => $request->user()->id]);

        return response()->json(['message' => 'Layanan urut berhasil dibuat', 'service' => $service], 201);
    }

    public function updateService(Request $request, UrutService $urutService): JsonResponse
    {
        $data = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'description'      => 'nullable|string',
            'duration_minutes' => 'sometimes|integer|min:15',
            'price'            => 'sometimes|numeric|min:0',
            'is_active'        => 'sometimes|boolean',
        ]);

        $urutService->update($data);

        return response()->json(['message' => 'Layanan berhasil diperbarui', 'service' => $urutService]);
    }

    public function destroyService(UrutService $urutService): JsonResponse
    {
        $urutService->delete();

        return response()->json(['message' => 'Layanan berhasil dihapus']);
    }

    // ── Pesanan ──────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_id'     => 'required|exists:urut_services,id',
            'address'        => 'required|string',
            'latitude'       => 'nullable|numeric',
            'longitude'      => 'nullable|numeric',
            'scheduled_at'   => 'required|date|after:now',
            'payment_method' => 'sometimes|in:tunai,dompet_digital,transfer',
            'notes'          => 'nullable|string',
        ]);

        $service = UrutService::findOrFail($data['service_id']);

        $order = UrutOrder::create([
            ...$data,
            'order_code'     => 'URT-' . strtoupper(Str::random(8)),
            'pelanggan_id'   => $request->user()->id,
            'mitra_id'       => $service->mitra_id,
            'price'          => $service->price,
            'mitra_earnings' => $service->price * self::BAGI_HASIL,
        ]);

        return response()->json([
            'message' => 'Pesanan urut berhasil dibuat',
            'order'   => $order->load('service', 'mitra'),
        ], 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isMitra()) {
            $orders = UrutOrder::where('mitra_id', $user->id)
                ->with('service', 'pelanggan')
                ->latest()
                ->paginate(50);
        } else {
            $orders = UrutOrder::where('pelanggan_id', $user->id)
                ->with('service', 'mitra')
                ->latest()
                ->paginate(50);
        }

        return response()->json($orders);
    }

    public function tersedia(Request $request): JsonResponse
    {
        // Pesanan urut yang belum punya mitra (atau belum diterima) dari mitra ini
        $orders = UrutOrder::where('mitra_id', $request->user()->id)
            ->where('status', 'menunggu')
            ->with('service', 'pelanggan')
            ->latest()
            ->paginate(20);

        return response()->json($orders);
    }

    public function updateStatus(Request $request, UrutOrder $urutOrder): JsonResponse
    {
        // Hanya mitra yang ditugaskan yang boleh update status
        if ($urutOrder->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $request->validate([
            'status' => 'required|in:diterima,menuju_lokasi,sedang_berlangsung,selesai,dibatalkan',
            'reason' => 'nullable|string',
        ]);

        $updates = ['status' => $request->status];

        match ($request->status) {
            'diterima'           => $updates['accepted_at']   = now(),
            'sedang_berlangsung' => $updates['started_at']    = now(),
            'selesai'            => $updates['completed_at']  = now(),
            'dibatalkan'         => $updates['cancelled_at']  = now(),
            default              => null,
        };

        if ($request->status === 'dibatalkan') {
            $updates['cancellation_reason'] = $request->reason;
        }

        $urutOrder->update($updates);

        return response()->json(['message' => 'Status diperbarui', 'order' => $urutOrder]);
    }

    public function cancel(Request $request, UrutOrder $urutOrder): JsonResponse
    {
        if ($urutOrder->pelanggan_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if (in_array($urutOrder->status, ['selesai', 'dibatalkan', 'sedang_berlangsung'])) {
            return response()->json(['message' => 'Pesanan tidak bisa dibatalkan'], 422);
        }

        $urutOrder->update([
            'status'       => 'dibatalkan',
            'cancelled_at' => now(),
            'cancellation_reason' => $request->reason ?? 'Dibatalkan oleh pelanggan',
        ]);

        return response()->json(['message' => 'Pesanan berhasil dibatalkan']);
    }
}
