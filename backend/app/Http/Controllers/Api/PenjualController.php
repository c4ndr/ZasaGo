<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PenjualController extends Controller
{
    // ── Dashboard stats ──────────────────────────────────────────────────────

    public function dashboard(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $totalProduk   = Product::where('mitra_id', $userId)->count();
        $totalTerjual  = Product::where('mitra_id', $userId)->sum('total_sold');
        $produkAktif   = Product::where('mitra_id', $userId)->where('is_active', true)->count();

        $totalPendapatan = ProductOrder::whereHas('items.product', fn ($q) => $q->where('mitra_id', $userId))
            ->where('status', 'selesai')
            ->sum('total_amount');

        $pesananBaru = ProductOrder::whereHas('items.product', fn ($q) => $q->where('mitra_id', $userId))
            ->whereIn('status', ['pending', 'dibayar'])
            ->count();

        return response()->json([
            'total_produk'     => $totalProduk,
            'produk_aktif'     => $produkAktif,
            'total_terjual'    => $totalTerjual,
            'total_pendapatan' => $totalPendapatan,
            'pesanan_baru'     => $pesananBaru,
        ]);
    }

    // ── Produk ───────────────────────────────────────────────────────────────

    public function produkIndex(Request $request): JsonResponse
    {
        $products = Product::with('category')
            ->where('mitra_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['data' => $products]);
    }

    public function produkStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:product_categories,id',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'unit'        => 'nullable|string|max:20',
        ]);

        $product = Product::create([
            ...$data,
            'mitra_id'  => $request->user()->id,
            'slug'      => Str::slug($data['name']) . '-' . Str::random(4),
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Produk berhasil ditambahkan', 'data' => $product->load('category')], 201);
    }

    public function produkUpdate(Request $request, Product $product): JsonResponse
    {
        if ($product->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $data = $request->validate([
            'category_id' => 'nullable|exists:product_categories,id',
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'sometimes|numeric|min:0',
            'stock'       => 'sometimes|integer|min:0',
            'unit'        => 'nullable|string|max:20',
            'is_active'   => 'sometimes|boolean',
        ]);

        $product->update($data);

        return response()->json(['message' => 'Produk diperbarui', 'data' => $product->load('category')]);
    }

    public function produkDestroy(Request $request, Product $product): JsonResponse
    {
        if ($product->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Produk dihapus']);
    }

    // ── Pesanan masuk ────────────────────────────────────────────────────────

    public function pesananIndex(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $orders = ProductOrder::with(['pelanggan', 'items.product'])
            ->whereHas('items.product', fn ($q) => $q->where('mitra_id', $userId))
            ->latest()
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function pesananUpdate(Request $request, ProductOrder $order): JsonResponse
    {
        $request->validate(['status' => 'required|string']);
        $order->update(['status' => $request->status]);

        return response()->json(['message' => 'Status pesanan diperbarui', 'data' => $order]);
    }

    // ── Laporan ───────────────────────────────────────────────────────────────

    public function laporan(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $topProduk = Product::where('mitra_id', $userId)
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get(['id', 'name', 'price', 'total_sold', 'stock']);

        $totalPendapatan = ProductOrder::whereHas('items.product', fn ($q) => $q->where('mitra_id', $userId))
            ->where('status', 'selesai')
            ->sum('total_amount');

        $pesananPerStatus = ProductOrder::whereHas('items.product', fn ($q) => $q->where('mitra_id', $userId))
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'top_produk'         => $topProduk,
            'total_pendapatan'   => $totalPendapatan,
            'pesanan_per_status' => $pesananPerStatus,
        ]);
    }
}
