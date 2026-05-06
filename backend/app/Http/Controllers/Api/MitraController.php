<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AntarOrder;
use App\Models\CateringOrder;
use App\Models\KebersihanOrder;
use App\Models\LaundryOrder;
use App\Models\MitraProfile;
use App\Models\OjekOrder;
use App\Models\UrutOrder;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MitraController extends Controller
{
    public function toggleOnline(Request $request): JsonResponse
    {
        $profile = $request->user()->mitraProfile;

        if (! $profile) {
            return response()->json(['message' => 'Profil mitra tidak ditemukan'], 404);
        }

        $profile->update(['is_available' => ! $profile->is_available]);

        return response()->json([
            'message'      => $profile->is_available ? 'Status online' : 'Status offline',
            'is_available' => $profile->is_available,
        ]);
    }

    public function tersedia(Request $request): JsonResponse
    {
        $serviceType = $request->query('service_type');

        $mitras = User::whereIn('role', [
                'mitra', 'mitra_urut', 'mitra_laundry', 'mitra_catering',
                'mitra_kebersihan', 'mitra_antar_barang',
            ])
            ->whereHas('mitraProfile', function ($q) use ($serviceType) {
                $q->where('is_available', true)->where('is_verified', true);
                if ($serviceType) {
                    $q->where('service_type', $serviceType);
                }
            })
            ->with('mitraProfile')
            ->get();

        return response()->json($mitras);
    }

    // All orders for a pelanggan across all services
    public function allOrders(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $ojek = OjekOrder::where('pelanggan_id', $userId)->with('mitra')->latest()->get()->map(fn ($o) => array_merge($o->toArray(), ['jenis' => 'ojek']));
        $urut = UrutOrder::where('pelanggan_id', $userId)->with('mitra')->latest()->get()->map(fn ($o) => array_merge($o->toArray(), ['jenis' => 'urut']));
        $laundry = LaundryOrder::where('pelanggan_id', $userId)->with('mitra')->latest()->get()->map(fn ($o) => array_merge($o->toArray(), ['jenis' => 'laundry']));
        $catering = CateringOrder::where('pelanggan_id', $userId)->with('mitra')->latest()->get()->map(fn ($o) => array_merge($o->toArray(), ['jenis' => 'catering']));
        $kebersihan = KebersihanOrder::where('pelanggan_id', $userId)->with('mitra')->latest()->get()->map(fn ($o) => array_merge($o->toArray(), ['jenis' => 'kebersihan']));
        $antar = AntarOrder::where('pelanggan_id', $userId)->with('mitra')->latest()->get()->map(fn ($o) => array_merge($o->toArray(), ['jenis' => 'antar']));

        $all = $ojek->merge($urut)->merge($laundry)->merge($catering)->merge($kebersihan)->merge($antar)
            ->sortByDesc('created_at')
            ->values();

        return response()->json($all);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user    = $request->user();
        $profile = $user->mitraProfile;
        $serviceType = $profile?->service_type ?? 'ojek';

        // Get stats by service type
        $stats = match ($serviceType) {
            'ojek'         => $this->ojekStats($user->id),
            'urut'         => $this->urutStats($user->id),
            'laundry'      => $this->laundryStats($user->id),
            'catering'     => $this->cateringStats($user->id),
            'kebersihan'   => $this->kebersihanStats($user->id),
            'antar_barang' => $this->antarStats($user->id),
            default        => [],
        };

        return response()->json([
            'user'         => $user,
            'profile'      => $profile,
            'service_type' => $serviceType,
            'stats'        => $stats,
        ]);
    }

    private function ojekStats(int $mitraId): array
    {
        return [
            'total'    => OjekOrder::where('mitra_id', $mitraId)->count(),
            'selesai'  => OjekOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->count(),
            'aktif'    => OjekOrder::where('mitra_id', $mitraId)->whereNotIn('status', ['selesai', 'dibatalkan'])->count(),
            'pendapatan' => (float) OjekOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->sum('driver_earnings'),
        ];
    }

    private function urutStats(int $mitraId): array
    {
        return [
            'total'      => UrutOrder::where('mitra_id', $mitraId)->count(),
            'selesai'    => UrutOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->count(),
            'aktif'      => UrutOrder::where('mitra_id', $mitraId)->whereNotIn('status', ['selesai', 'dibatalkan'])->count(),
            'pendapatan' => (float) UrutOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->sum('penghasilan_mitra'),
        ];
    }

    private function laundryStats(int $mitraId): array
    {
        return [
            'total'      => LaundryOrder::where('mitra_id', $mitraId)->count(),
            'selesai'    => LaundryOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->count(),
            'aktif'      => LaundryOrder::where('mitra_id', $mitraId)->whereNotIn('status', ['selesai', 'dibatalkan'])->count(),
            'pendapatan' => (float) LaundryOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->sum('penghasilan_mitra'),
        ];
    }

    private function cateringStats(int $mitraId): array
    {
        return [
            'total'      => CateringOrder::where('mitra_id', $mitraId)->count(),
            'selesai'    => CateringOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->count(),
            'aktif'      => CateringOrder::where('mitra_id', $mitraId)->whereNotIn('status', ['selesai', 'dibatalkan'])->count(),
            'pendapatan' => (float) CateringOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->sum('penghasilan_mitra'),
        ];
    }

    private function kebersihanStats(int $mitraId): array
    {
        return [
            'total'      => KebersihanOrder::where('mitra_id', $mitraId)->count(),
            'selesai'    => KebersihanOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->count(),
            'aktif'      => KebersihanOrder::where('mitra_id', $mitraId)->whereNotIn('status', ['selesai', 'dibatalkan'])->count(),
            'pendapatan' => (float) KebersihanOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->sum('penghasilan_mitra'),
        ];
    }

    private function antarStats(int $mitraId): array
    {
        return [
            'total'      => AntarOrder::where('mitra_id', $mitraId)->count(),
            'selesai'    => AntarOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->count(),
            'aktif'      => AntarOrder::where('mitra_id', $mitraId)->whereNotIn('status', ['selesai', 'dibatalkan'])->count(),
            'pendapatan' => (float) AntarOrder::where('mitra_id', $mitraId)->where('status', 'selesai')->sum('penghasilan_mitra'),
        ];
    }
}
