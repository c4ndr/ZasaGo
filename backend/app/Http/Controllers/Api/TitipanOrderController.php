<?php

namespace App\Http\Controllers\Api;

use App\Events\JastipDiterima;
use App\Http\Controllers\Controller;
use App\Models\MitraProfile;
use App\Models\Setting;
use App\Models\TitipanOrder;
use App\Models\TitipJalanSession;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TitipanOrderController extends Controller
{
    // Pelanggan buat order titipan ke sesi mitra tertentu
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'session_id'          => 'required|exists:titipjalan_sessions,id',
            'pickup_address'      => 'required|string',
            'pickup_lat'          => 'required|numeric',
            'pickup_lng'          => 'required|numeric',
            'destination_address' => 'required|string',
            'destination_lat'     => 'required|numeric',
            'destination_lng'     => 'required|numeric',
            'nama_pesanan'        => 'required|string|max:255',
            'harga_barang'        => 'nullable|numeric|min:0',
            'jenis_barang'        => 'nullable|string',
            'berat_kg'            => 'nullable|numeric|min:0.1',
            'catatan'             => 'nullable|string',
            'payment_method'      => 'sometimes|in:tunai,dompet_digital,transfer',
        ]);

        $session = TitipJalanSession::where('id', $data['session_id'])
            ->where('status', 'aktif')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Sesi Jastip tidak aktif atau tidak ditemukan'], 422);
        }

        if ($session->titipanAktif()->count() >= $session->max_titipan) {
            return response()->json(['message' => 'Slot sesi ini sudah penuh'], 422);
        }

        $tarifDasar   = (float) Setting::get('tarif_titipan_dasar', 5000);
        $tarifPerKm   = (float) Setting::get('tarif_titipan_per_km', 2000);
        $komisiPersen = (float) Setting::get('komisi_titipjalan', 10);
        // diskon_titipjalan_persen = potongan ongkir master, bukan diskon jastip pelanggan
        $masterPersen = (float) Setting::get('diskon_titipjalan_persen', 2);

        $distKm    = TitipanOrder::hitungJarak(
            $data['pickup_lat'], $data['pickup_lng'],
            $data['destination_lat'], $data['destination_lng']
        );
        // Jastip pelanggan membayar harga penuh (tanpa diskon di sini)
        $total   = round($tarifDasar + ($distKm * $tarifPerKm), 2);
        $komisi  = round($total * $komisiPersen / 100, 2);

        $order = TitipanOrder::create([
            ...$data,
            'order_code'        => 'TJP-' . strtoupper(Str::random(8)),
            'pelanggan_id'      => $request->user()->id,
            'mitra_id'          => $session->mitra_id,
            'distance_km'       => round($distKm, 2),
            'harga_asli'        => $total,
            'diskon_persen'     => $masterPersen,   // persentase potongan untuk master, dicatat saja
            'total_price'       => $total,
            'komisi_platform'   => $komisi,
            'penghasilan_mitra' => $total - $komisi, // akan dikurangi master_cut saat accept
        ]);

        return response()->json(['message' => 'Titipan berhasil dibuat', 'order' => $order], 201);
    }

    // Semua titipan milik pelanggan atau mitra (riwayat)
    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->isMitra()) {
            $orders = TitipanOrder::where('mitra_id', $user->id)
                ->with('pelanggan')
                ->latest()
                ->paginate(20);
        } else {
            $orders = TitipanOrder::where('pelanggan_id', $user->id)
                ->with('mitra')
                ->latest()
                ->paginate(20);
        }
        return response()->json($orders);
    }

    // Titipan menunggu konfirmasi mitra (dari sesi aktif mitra)
    public function pendingMitra(Request $request): JsonResponse
    {
        $session = TitipJalanSession::where('mitra_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if (!$session) {
            return response()->json(['data' => [], 'session' => null]);
        }

        $pending = TitipanOrder::where('session_id', $session->id)
            ->where('status', 'menunggu')
            ->with('pelanggan:id,name,phone')
            ->latest()
            ->get();

        return response()->json(['data' => $pending, 'session' => $session]);
    }

    // Mitra terima titipan
    public function accept(Request $request, TitipanOrder $titipanOrder): JsonResponse
    {
        if ($titipanOrder->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if ($titipanOrder->status !== 'menunggu') {
            return response()->json(['message' => 'Titipan sudah diproses'], 422);
        }

        $session = TitipJalanSession::where('mitra_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Tidak ada sesi Jastip aktif'], 422);
        }

        if ($session->titipanAktif()->count() >= $session->max_titipan) {
            return response()->json(['message' => 'Kapasitas titipan sesi sudah penuh'], 422);
        }

        $masterDiskon = 0;

        DB::transaction(function () use ($session, $titipanOrder, &$masterDiskon) {
            $totalPrice   = (float) $titipanOrder->total_price;
            $komisiPersen = (float) Setting::get('komisi_titipjalan', 10);
            $diskonPersen = (float) Setting::get('diskon_titipjalan_persen', 2);

            // ── Split keuangan dari total_price ────────────────────────
            // Hitung ulang berdasarkan total_price:
            //   master_cut  = diskon_persen% → potong ongkir ojek master
            //   admin_komisi = komisi_persen% → platform
            //   mitra_net    = sisanya
            $masterCut   = round($totalPrice * $diskonPersen / 100, 2);
            $adminKomisi = round($totalPrice * $komisiPersen / 100, 2);
            $mitraNeto   = round($totalPrice - $masterCut - $adminKomisi, 2);

            // Update penghasilan_mitra dan komisi_platform di titipan order
            $titipanOrder->update([
                'status'            => 'diterima',
                'accepted_at'       => now(),
                'penghasilan_mitra' => $mitraNeto,
                'komisi_platform'   => $adminKomisi,
            ]);

            // ── Potong ongkir master jika mode hybrid ──────────────────
            if ($session->ojek_order_id) {
                $ojekOrder = $session->ojekOrder;
                if ($ojekOrder && $ojekOrder->izin_titipjalan && $masterCut > 0) {
                    $diskonBaru = min(
                        (float) $ojekOrder->diskon_titipjalan + $masterCut,
                        (float) $ojekOrder->price // tidak melebihi ongkir penuh
                    );
                    $ojekOrder->update(['diskon_titipjalan' => $diskonBaru]);
                    $masterDiskon = $masterCut;

                    // Riwayat diskon untuk master (balance_before/after 0 = ini bukan wallet, ini diskon)
                    WalletTransaction::create([
                        'user_id'              => $ojekOrder->pelanggan_id,
                        'type'                 => 'kredit',
                        'amount'               => $masterCut,
                        'balance_before'       => 0,
                        'balance_after'        => 0,
                        'description'          => "Diskon ongkir {$diskonPersen}% dari jastip #{$titipanOrder->order_code} "
                                                . "(ongkir jastip: " . number_format($totalPrice, 0, ',', '.') . " | "
                                                . "mitra: " . number_format($mitraNeto, 0, ',', '.') . " | "
                                                . "komisi: " . number_format($adminKomisi, 0, ',', '.') . ")",
                        'transactionable_id'   => $titipanOrder->id,
                        'transactionable_type' => TitipanOrder::class,
                    ]);
                }
            }
        });

        // Broadcast real-time ke pelanggan master jika ada diskon
        if ($masterDiskon > 0 && $session->ojek_order_id) {
            $ojekOrder = $session->ojekOrder->fresh();
            broadcast(new JastipDiterima(
                ojekOrderId:   $session->ojek_order_id,
                pelangganId:   $ojekOrder->pelanggan_id,
                diskonBaru:    (float) $ojekOrder->diskon_titipjalan,
                masterCut:     $masterDiskon,
                namaBarang:    $titipanOrder->nama_pesanan,
                orderCode:     $titipanOrder->order_code,
                ongkirEfektif: max(0, (float) $ojekOrder->price - (float) $ojekOrder->diskon_titipjalan),
            ));
        }

        return response()->json([
            'message'      => 'Titipan berhasil diterima',
            'order'        => $titipanOrder->fresh()->load('pelanggan'),
            'master_diskon'=> $masterDiskon,
        ]);
    }

    // Mitra tolak titipan dengan alasan
    public function reject(Request $request, TitipanOrder $titipanOrder): JsonResponse
    {
        if ($titipanOrder->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if ($titipanOrder->status !== 'menunggu') {
            return response()->json(['message' => 'Titipan sudah diproses'], 422);
        }

        $request->validate([
            'alasan' => 'required|string|max:255',
        ]);

        $titipanOrder->update([
            'status'       => 'ditolak',
            'tolak_alasan' => $request->alasan,
        ]);

        return response()->json([
            'message' => 'Titipan ditolak',
            'order'   => $titipanOrder->fresh(),
        ]);
    }

    // Mitra update status titipan yang sudah diterima
    public function updateStatus(Request $request, TitipanOrder $titipanOrder): JsonResponse
    {
        if ($titipanOrder->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $request->validate([
            'status' => 'required|in:diterima,dijemput,diantar,selesai,dibatalkan',
        ]);

        if ($request->status !== 'selesai') {
            $titipanOrder->update(['status' => $request->status]);
            return response()->json(['message' => 'Status diperbarui', 'order' => $titipanOrder->fresh()]);
        }

        // Selesai: settlement pembayaran terintegrasi
        DB::transaction(function () use ($titipanOrder) {
            $titipanOrder->update([
                'status'         => 'selesai',
                'completed_at'   => now(),
                'payment_status' => 'sudah_bayar',
            ]);

            $totalPrice      = (float) $titipanOrder->total_price;
            $penghasilanMitra = (float) $titipanOrder->penghasilan_mitra;
            $komisi          = (float) $titipanOrder->komisi_platform;

            // Credit mitra
            $mitraProfile = MitraProfile::where('user_id', $titipanOrder->mitra_id)->lockForUpdate()->first();
            if ($mitraProfile) {
                $before = (float) $mitraProfile->balance;
                $after  = $before + $penghasilanMitra;
                $mitraProfile->update(['balance' => $after]);

                WalletTransaction::create([
                    'user_id'              => $titipanOrder->mitra_id,
                    'type'                 => 'kredit',
                    'amount'               => $penghasilanMitra,
                    'balance_before'       => $before,
                    'balance_after'        => $after,
                    'description'          => "Penghasilan jastip #{$titipanOrder->order_code}",
                    'transactionable_id'   => $titipanOrder->id,
                    'transactionable_type' => TitipanOrder::class,
                ]);
            }

            // Catat pembayaran dari jastip pelanggan (debit wallet jastip pelanggan jika pakai wallet)
            // Untuk sekarang hanya catat riwayat transaksi (tunai/transfer = tidak debit wallet)
            WalletTransaction::create([
                'user_id'              => $titipanOrder->pelanggan_id,
                'type'                 => 'debit',
                'amount'               => $totalPrice,
                'balance_before'       => 0,
                'balance_after'        => 0,
                'description'          => "Pembayaran jastip #{$titipanOrder->order_code}",
                'transactionable_id'   => $titipanOrder->id,
                'transactionable_type' => TitipanOrder::class,
            ]);
        });

        return response()->json(['message' => 'Titipan selesai', 'order' => $titipanOrder->fresh()]);
    }

    // Pelanggan batalkan titipan
    public function cancel(Request $request, TitipanOrder $titipanOrder): JsonResponse
    {
        if ($titipanOrder->pelanggan_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if (in_array($titipanOrder->status, ['dijemput', 'diantar', 'selesai', 'dibatalkan', 'ditolak'])) {
            return response()->json(['message' => 'Titipan tidak bisa dibatalkan di tahap ini'], 422);
        }

        $titipanOrder->update(['status' => 'dibatalkan']);
        return response()->json(['message' => 'Titipan berhasil dibatalkan']);
    }
}
