<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MitraProfile;
use App\Models\WalletTopupRequest;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class WalletTopupController extends Controller
{
    // Mitra: buat permintaan isi saldo
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount'          => 'required|numeric|min:10000|max:10000000',
            'bukti_transfer'  => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $buktiPath = null;
        if ($request->hasFile('bukti_transfer')) {
            $buktiPath = $request->file('bukti_transfer')
                ->store('topup_bukti', 'public');
        }

        $topup = WalletTopupRequest::create([
            'mitra_id'        => $request->user()->id,
            'amount'          => $data['amount'],
            'bukti_transfer'  => $buktiPath,
            'status'          => 'pending',
        ]);

        return response()->json([
            'message' => 'Permintaan isi saldo berhasil dikirim. Menunggu konfirmasi admin.',
            'topup'   => $topup,
        ], 201);
    }

    // Mitra: riwayat permintaan isi saldo sendiri
    public function myRequests(Request $request): JsonResponse
    {
        $requests = WalletTopupRequest::where('mitra_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['data' => $requests]);
    }

    // Admin: list semua permintaan (filter by status)
    public function adminIndex(Request $request): JsonResponse
    {
        $q = WalletTopupRequest::with('mitra:id,name,phone')
            ->latest();

        if ($request->status) {
            $q->where('status', $request->status);
        }

        $requests = $q->paginate(20);
        return response()->json($requests);
    }

    // Admin: setujui topup → credit saldo mitra
    public function approve(Request $request, WalletTopupRequest $topupRequest): JsonResponse
    {
        if ($topupRequest->status !== 'pending') {
            return response()->json(['message' => 'Permintaan sudah diproses'], 422);
        }

        $request->validate([
            'admin_note' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, $topupRequest) {
            $profile = MitraProfile::where('user_id', $topupRequest->mitra_id)->lockForUpdate()->first();
            if (!$profile) {
                throw new \Exception('Profil mitra tidak ditemukan');
            }

            $balanceBefore = (float) $profile->balance;
            $balanceAfter  = $balanceBefore + (float) $topupRequest->amount;

            $profile->update(['balance' => $balanceAfter]);

            WalletTransaction::create([
                'user_id'         => $topupRequest->mitra_id,
                'type'            => 'kredit',
                'amount'          => $topupRequest->amount,
                'balance_before'  => $balanceBefore,
                'balance_after'   => $balanceAfter,
                'description'     => 'Isi saldo wallet via transfer — disetujui admin',
                'transactionable_id'   => $topupRequest->id,
                'transactionable_type' => WalletTopupRequest::class,
            ]);

            $topupRequest->update([
                'status'      => 'disetujui',
                'admin_note'  => $request->admin_note,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Saldo berhasil dikreditkan ke wallet mitra']);
    }

    // Pelanggan: saldo wallet + riwayat cashback
    public function saldoPelanggan(Request $request): JsonResponse
    {
        $user = $request->user();
        $transactions = \App\Models\WalletTransaction::where('user_id', $user->id)
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'wallet_balance' => (float) $user->wallet_balance,
            'transactions'   => $transactions,
        ]);
    }

    // Admin: tolak topup
    public function reject(Request $request, WalletTopupRequest $topupRequest): JsonResponse
    {
        if ($topupRequest->status !== 'pending') {
            return response()->json(['message' => 'Permintaan sudah diproses'], 422);
        }

        $request->validate([
            'admin_note' => 'required|string|max:255',
        ]);

        $topupRequest->update([
            'status'      => 'ditolak',
            'admin_note'  => $request->admin_note,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Permintaan topup ditolak']);
    }
}
