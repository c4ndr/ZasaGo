<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AntarOrder;
use App\Models\CateringOrder;
use App\Models\KebersihanOrder;
use App\Models\LaundryOrder;
use App\Models\MitraProfile;
use App\Models\OjekOrder;
use App\Models\ProductOrder;
use App\Models\TitipanOrder;
use App\Models\UrutOrder;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    private function mitraRoles(): array
    {
        return ['mitra', 'mitra_urut', 'mitra_laundry', 'mitra_catering', 'mitra_kebersihan', 'mitra_antar_barang'];
    }

    // ── Dashboard ringkas (lama) ────────────────────────────────────────────
    public function dashboard(): JsonResponse
    {
        return response()->json($this->buildStatistik());
    }

    // ── Statistik lengkap ───────────────────────────────────────────────────
    public function statistik(): JsonResponse
    {
        return response()->json($this->buildStatistik());
    }

    private function buildStatistik(): array
    {
        $today    = now()->toDateString();
        $allMitra = $this->mitraRoles();

        $revenueToday = (float)(
            OjekOrder::whereDate('created_at', $today)->where('status', 'selesai')->sum('price') +
            UrutOrder::whereDate('created_at', $today)->where('status', 'selesai')->sum('price') +
            ProductOrder::whereDate('created_at', $today)->where('status', 'selesai')->sum('total_amount')
        );

        $revenueWeek = (float)(
            OjekOrder::whereDate('created_at', '>=', now()->subDays(7))->where('status', 'selesai')->sum('price') +
            UrutOrder::whereDate('created_at', '>=', now()->subDays(7))->where('status', 'selesai')->sum('price') +
            ProductOrder::whereDate('created_at', '>=', now()->subDays(7))->where('status', 'selesai')->sum('total_amount')
        );

        $revenueMonth = (float)(
            OjekOrder::whereMonth('created_at', now()->month)->where('status', 'selesai')->sum('price') +
            UrutOrder::whereMonth('created_at', now()->month)->where('status', 'selesai')->sum('price') +
            ProductOrder::whereMonth('created_at', now()->month)->where('status', 'selesai')->sum('total_amount')
        );

        return [
            'users' => [
                'total'       => User::count(),
                'admin'       => User::where('role', 'admin')->count(),
                'pelanggan'   => User::where('role', 'pelanggan')->count(),
                'penjual'     => User::where('role', 'penjual')->count(),
                'mitra'       => User::whereIn('role', $allMitra)->count(),
            ],
            'mitra' => [
                'total'              => User::whereIn('role', $allMitra)->count(),
                'pending_verifikasi' => MitraProfile::where('is_verified', false)->count(),
                'online'             => MitraProfile::where('is_available', true)->count(),
                'per_layanan'        => MitraProfile::selectRaw('service_type, COUNT(*) as total, SUM(is_available) as online, SUM(is_verified) as verified')
                    ->groupBy('service_type')
                    ->get(),
            ],
            'pesanan' => [
                'ojek_total'   => OjekOrder::count(),
                'urut_total'   => UrutOrder::count(),
                'produk_total' => ProductOrder::count(),
                'ojek_aktif'   => OjekOrder::whereNotIn('status', ['selesai', 'dibatalkan'])->count(),
                'urut_aktif'   => UrutOrder::whereNotIn('status', ['selesai', 'dibatalkan'])->count(),
                'produk_aktif' => ProductOrder::whereNotIn('status', ['selesai', 'dibatalkan', 'refund'])->count(),
                'hari_ini'     => OjekOrder::whereDate('created_at', $today)->count()
                    + UrutOrder::whereDate('created_at', $today)->count()
                    + ProductOrder::whereDate('created_at', $today)->count(),
            ],
            'keuangan' => [
                'hari_ini' => $revenueToday,
                'minggu'   => $revenueWeek,
                'bulan'    => $revenueMonth,
            ],
            'verifikasi_pending' => MitraProfile::where('is_verified', false)->count(),
        ];
    }

    // ── Pengguna ────────────────────────────────────────────────────────────
    public function users(Request $request): JsonResponse
    {
        $users = User::when($request->role, function ($q) use ($request) {
                if ($request->role === 'mitra') {
                    return $q->whereIn('role', $this->mitraRoles());
                }
                return $q->where('role', $request->role);
            })
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            }))
            ->latest()
            ->paginate(25);

        return response()->json($users);
    }

    public function showUser(User $user): JsonResponse
    {
        return response()->json($user->load('mitraProfile'));
    }

    public function toggleUserStatus(User $user): JsonResponse
    {
        $user->update(['is_active' => ! $user->is_active]);
        return response()->json([
            'message'   => 'Status akun diperbarui',
            'is_active' => $user->is_active,
        ]);
    }

    // ── Mitra ───────────────────────────────────────────────────────────────
    public function mitraList(Request $request): JsonResponse
    {
        $query = MitraProfile::with('user')
            ->when($request->service_type, fn ($q) => $q->where('service_type', $request->service_type))
            ->when($request->status === 'pending',      fn ($q) => $q->where('is_verified', false))
            ->when($request->status === 'terverifikasi', fn ($q) => $q->where('is_verified', true))
            ->when($request->status === 'nonaktif', fn ($q) => $q->whereHas('user', fn ($u) => $u->where('is_active', false)));

        $mitras = $query->latest()->paginate(20);
        return response()->json($mitras);
    }

    public function mitraDetail(Request $request, $id): JsonResponse
    {
        $mitra = MitraProfile::with('user')->findOrFail($id);
        return response()->json($mitra);
    }

    public function pendingMitra(): JsonResponse
    {
        $mitras = MitraProfile::with('user')
            ->where('is_verified', false)
            ->latest()
            ->paginate(20);
        return response()->json($mitras);
    }

    public function verifyMitra(Request $request, MitraProfile $mitraProfile): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:setujui,tolak',
            'reason' => 'nullable|string',
        ]);

        if ($request->action === 'setujui') {
            $mitraProfile->update(['is_verified' => true]);
            return response()->json(['message' => 'Mitra berhasil diverifikasi', 'data' => $mitraProfile->fresh()]);
        }

        return response()->json(['message' => 'Verifikasi ditolak', 'reason' => $request->reason]);
    }

    // ── Pedagang ────────────────────────────────────────────────────────────
    public function pedagang(Request $request): JsonResponse
    {
        $sellers = User::where('role', 'penjual')
            ->with('mitraProfile')
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            }))
            ->latest()
            ->paginate(20);
        return response()->json($sellers);
    }

    // ── Pesanan ─────────────────────────────────────────────────────────────
    public function ojekOrders(Request $request): JsonResponse
    {
        $orders = OjekOrder::with(['pelanggan', 'mitra'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);
        return response()->json($orders);
    }

    public function urutOrders(Request $request): JsonResponse
    {
        $orders = UrutOrder::with(['pelanggan', 'mitra', 'service'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);
        return response()->json($orders);
    }

    public function productOrders(Request $request): JsonResponse
    {
        $orders = ProductOrder::with(['pelanggan', 'items.product'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);
        return response()->json($orders);
    }

    public function laundryOrders(Request $request): JsonResponse
    {
        $orders = LaundryOrder::with(['pelanggan', 'mitra'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);
        return response()->json($orders);
    }

    public function cateringOrders(Request $request): JsonResponse
    {
        $orders = CateringOrder::with(['pelanggan', 'mitra'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);
        return response()->json($orders);
    }

    public function kebersihanOrders(Request $request): JsonResponse
    {
        $orders = KebersihanOrder::with(['pelanggan', 'mitra'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);
        return response()->json($orders);
    }

    public function antarOrders(Request $request): JsonResponse
    {
        $orders = AntarOrder::with(['pelanggan', 'mitra'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);
        return response()->json($orders);
    }

    public function jastipOrders(Request $request): JsonResponse
    {
        $orders = TitipanOrder::with(['pelanggan', 'mitra'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);
        return response()->json($orders);
    }

    // ── Keuangan ────────────────────────────────────────────────────────────
    public function keuangan(): JsonResponse
    {
        $today = now()->toDateString();

        // Revenue per day last 7 days
        $grafik = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $rev  = (float)(
                OjekOrder::whereDate('created_at', $date)->where('status', 'selesai')->sum('price') +
                UrutOrder::whereDate('created_at', $date)->where('status', 'selesai')->sum('price') +
                ProductOrder::whereDate('created_at', $date)->where('status', 'selesai')->sum('total_amount')
            );
            $grafik[] = [
                'tanggal'    => $date,
                'label'      => now()->subDays($i)->format('d/m'),
                'pendapatan' => $rev,
            ];
        }

        // Revenue by service
        $perLayanan = [
            'ojek'   => (float) OjekOrder::where('status', 'selesai')->sum('price'),
            'urut'   => (float) UrutOrder::where('status', 'selesai')->sum('price'),
            'produk' => (float) ProductOrder::where('status', 'selesai')->sum('total_amount'),
        ];
        $totalRevenue = array_sum($perLayanan);

        // Recent ojek transactions
        $ojekTx = OjekOrder::with('pelanggan')
            ->where('status', 'selesai')
            ->latest()->take(5)->get()->map(fn ($o) => [
                'jenis'       => 'Ojek',
                'pelanggan'   => $o->pelanggan?->name,
                'nominal'     => (float) $o->price,
                'komisi'      => round((float) $o->price * 0.1),
                'tanggal'     => $o->created_at,
            ]);

        $urutTx = UrutOrder::with('pelanggan')
            ->where('status', 'selesai')
            ->latest()->take(5)->get()->map(fn ($o) => [
                'jenis'       => 'Urut',
                'pelanggan'   => $o->pelanggan?->name,
                'nominal'     => (float) $o->price,
                'komisi'      => round((float) $o->price * 0.1),
                'tanggal'     => $o->created_at,
            ]);

        $produkTx = ProductOrder::with('pelanggan')
            ->where('status', 'selesai')
            ->latest()->take(5)->get()->map(fn ($o) => [
                'jenis'       => 'Produk',
                'pelanggan'   => $o->pelanggan?->name,
                'nominal'     => (float) $o->total_amount,
                'komisi'      => round((float) $o->total_amount * 0.1),
                'tanggal'     => $o->created_at,
            ]);

        $transaksi = $ojekTx->merge($urutTx)->merge($produkTx)
            ->sortByDesc('tanggal')
            ->take(10)
            ->values();

        return response()->json([
            'ringkasan' => [
                'hari_ini'       => (float)(
                    OjekOrder::whereDate('created_at', $today)->where('status', 'selesai')->sum('price') +
                    UrutOrder::whereDate('created_at', $today)->where('status', 'selesai')->sum('price') +
                    ProductOrder::whereDate('created_at', $today)->where('status', 'selesai')->sum('total_amount')
                ),
                'minggu_ini'     => (float)(
                    OjekOrder::whereDate('created_at', '>=', now()->subDays(7))->where('status', 'selesai')->sum('price') +
                    UrutOrder::whereDate('created_at', '>=', now()->subDays(7))->where('status', 'selesai')->sum('price') +
                    ProductOrder::whereDate('created_at', '>=', now()->subDays(7))->where('status', 'selesai')->sum('total_amount')
                ),
                'bulan_ini'      => (float)(
                    OjekOrder::whereMonth('created_at', now()->month)->where('status', 'selesai')->sum('price') +
                    UrutOrder::whereMonth('created_at', now()->month)->where('status', 'selesai')->sum('price') +
                    ProductOrder::whereMonth('created_at', now()->month)->where('status', 'selesai')->sum('total_amount')
                ),
                'total_komisi'   => round($totalRevenue * 0.1),
            ],
            'grafik_7hari' => $grafik,
            'per_layanan'  => $perLayanan,
            'transaksi'    => $transaksi,
        ]);
    }
}
