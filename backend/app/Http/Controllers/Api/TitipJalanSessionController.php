<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OjekOrder;
use App\Models\Setting;
use App\Models\TitipanOrder;
use App\Models\TitipJalanSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TitipJalanSessionController extends Controller
{
    // Buka sesi baru
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Cek saldo minimum wallet
        $saldoMin = (float) Setting::get('titipjalan_saldo_minimum', 10000);
        if ($user->mitraProfile->balance < $saldoMin) {
            return response()->json([
                'message' => "Saldo wallet kurang. Minimum Rp " . number_format($saldoMin, 0, ',', '.') . " untuk aktifkan Jastip.",
            ], 422);
        }

        // Cek apakah ada sesi aktif
        $aktif = TitipJalanSession::where('mitra_id', $user->id)->where('status', 'aktif')->first();
        if ($aktif) {
            return response()->json(['message' => 'Sudah ada sesi Jastip aktif', 'session' => $aktif], 422);
        }

        $data = $request->validate([
            'mode'                  => 'sometimes|in:murni,hybrid',
            'ojek_order_id'         => 'nullable|exists:ojek_orders,id',
            'asal_address'          => 'required|string',
            'asal_lat'              => 'required|numeric',
            'asal_lng'              => 'required|numeric',
            'tujuan_address'        => 'required|string',
            'tujuan_lat'            => 'required|numeric',
            'tujuan_lng'            => 'required|numeric',
            'max_berat_kg'          => 'nullable|numeric|min:0.1',
            'jenis_barang_diterima' => 'nullable|string',
        ]);

        // Radius dan max titipan selalu dari setting admin, mitra tidak bisa ubah
        $radiusDefault = (int) Setting::get('titipjalan_radius_default', 200);
        $maxTitipanDef = (int) Setting::get('titipjalan_max_titipan', 3);

        // Auto-link ojek order aktif saat mode hybrid
        $ojekOrderId = $data['ojek_order_id'] ?? null;
        $mode = $data['mode'] ?? 'murni';
        if ($mode === 'hybrid' && !$ojekOrderId) {
            $activeOjek = OjekOrder::where('mitra_id', $user->id)
                ->whereIn('status', ['driver_ditemukan', 'menuju_pickup', 'pelanggan_dijemput', 'dalam_perjalanan'])
                ->latest()
                ->first();
            $ojekOrderId = $activeOjek?->id;
        }

        $session = TitipJalanSession::create([
            ...$data,
            'mitra_id'       => $user->id,
            'mode'           => $mode,
            'ojek_order_id'  => $ojekOrderId,
            'radius_meter'   => $radiusDefault,
            'max_titipan'    => $maxTitipanDef,
            'status'         => 'aktif',
        ]);

        return response()->json(['message' => 'Sesi Jastip dibuka', 'session' => $session], 201);
    }

    // Semua sesi Jastip aktif (untuk pelanggan browsing)
    public function semuaAktif(): JsonResponse
    {
        $sessions = TitipJalanSession::where('status', 'aktif')
            ->with(['mitra:id,name', 'titipanAktif'])
            ->get()
            ->map(function ($s) {
                return [
                    'id'                    => $s->id,
                    'mode'                  => $s->mode,
                    'mitra'                 => $s->mitra,
                    'asal_address'          => $s->asal_address,
                    'asal_lat'              => $s->asal_lat,
                    'asal_lng'              => $s->asal_lng,
                    'tujuan_address'        => $s->tujuan_address,
                    'tujuan_lat'            => $s->tujuan_lat,
                    'tujuan_lng'            => $s->tujuan_lng,
                    'radius_meter'          => $s->radius_meter,
                    'max_titipan'           => $s->max_titipan,
                    'slot_tersisa'          => $s->max_titipan - $s->titipanAktif->count(),
                    'max_berat_kg'          => $s->max_berat_kg,
                    'jenis_barang_diterima' => $s->jenis_barang_diterima,
                    'created_at'            => $s->created_at,
                ];
            });

        return response()->json(['data' => $sessions]);
    }

    // Sesi aktif milik mitra ini
    public function aktif(Request $request): JsonResponse
    {
        $session = TitipJalanSession::where('mitra_id', $request->user()->id)
            ->where('status', 'aktif')
            ->with('titipan.pelanggan')
            ->first();

        return response()->json(['session' => $session]);
    }

    // Titipan yang cocok dengan koridor sesi aktif
    public function titipanTersedia(Request $request): JsonResponse
    {
        $session = TitipJalanSession::where('mitra_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Tidak ada sesi aktif', 'data' => []], 200);
        }

        // Cek apakah sesi masih bisa terima titipan
        $jumlahAktif = $session->titipanAktif()->count();
        if ($jumlahAktif >= $session->max_titipan) {
            return response()->json(['data' => [], 'message' => 'Kapasitas titipan penuh']);
        }

        // Ambil titipan menunggu untuk sesi ini (pelanggan sudah assign ke sesi ini saat order)
        $cocok = TitipanOrder::where('session_id', $session->id)
            ->where('status', 'menunggu')
            ->with('pelanggan:id,name,phone')
            ->latest()
            ->get();

        return response()->json(['data' => $cocok, 'session' => $session]);
    }

    // Tutup sesi
    public function tutup(Request $request): JsonResponse
    {
        $session = TitipJalanSession::where('mitra_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Tidak ada sesi aktif'], 404);
        }

        $session->update(['status' => 'selesai', 'ended_at' => now()]);
        return response()->json(['message' => 'Sesi Jastip ditutup']);
    }
}
