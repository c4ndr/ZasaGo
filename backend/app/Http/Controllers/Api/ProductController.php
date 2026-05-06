<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductOrder;
use App\Models\ProductOrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private const ONGKOS_KIRIM = 10000;

    // ── Kategori ─────────────────────────────────────────────────────────────

    public function categories(): JsonResponse
    {
        return response()->json(ProductCategory::where('is_active', true)->get());
    }

    // ── Produk ───────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $products = Product::with(['mitra', 'category'])
            ->where('is_active', true)
            ->where('stock', '>', 0)
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->mitra_id,    fn ($q) => $q->where('mitra_id', $request->mitra_id))
            ->when($request->search,      fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->min_price,   fn ($q) => $q->where('price', '>=', $request->min_price))
            ->when($request->max_price,   fn ($q) => $q->where('price', '<=', $request->max_price))
            ->paginate(15);

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load(['mitra', 'category', 'reviews.user']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:product_categories,id',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'sale_price'  => 'nullable|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'unit'        => 'nullable|string|max:20',
            'weight_gram' => 'nullable|numeric|min:0',
        ]);

        $product = Product::create([
            ...$data,
            'mitra_id' => $request->user()->id,
            'slug'     => Str::slug($data['name']) . '-' . Str::random(6),
        ]);

        return response()->json(['message' => 'Produk berhasil dibuat', 'product' => $product], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:product_categories,id',
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'sometimes|numeric|min:0',
            'sale_price'  => 'nullable|numeric|min:0',
            'stock'       => 'sometimes|integer|min:0',
            'unit'        => 'nullable|string|max:20',
            'is_active'   => 'sometimes|boolean',
        ]);

        $product->update($data);

        return response()->json(['message' => 'Produk berhasil diperbarui', 'product' => $product]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus']);
    }

    // ── Pesanan Produk ────────────────────────────────────────────────────────

    public function createOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items'                 => 'required|array|min:1',
            'items.*.product_id'   => 'required|exists:products,id',
            'items.*.quantity'     => 'required|integer|min:1',
            'shipping_address'     => 'required|string',
            'recipient_name'       => 'required|string',
            'recipient_phone'      => 'required|string|max:20',
            'payment_method'       => 'sometimes|in:tunai,transfer,dompet_digital,cod',
            'notes'                => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $subtotal   = 0;
            $orderItems = [];

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    return response()->json([
                        'message' => "Stok produk \"{$product->name}\" tidak mencukupi.",
                    ], 422);
                }

                $hargaSatuan = $product->effective_price;
                $itemSubtotal = $hargaSatuan * $item['quantity'];
                $subtotal    += $itemSubtotal;

                $orderItems[] = [
                    'product_id'   => $product->id,
                    'mitra_id'     => $product->mitra_id,
                    'product_name' => $product->name,
                    'price'        => $hargaSatuan,
                    'quantity'     => $item['quantity'],
                    'subtotal'     => $itemSubtotal,
                ];

                $product->decrement('stock', $item['quantity']);
            }

            $order = ProductOrder::create([
                'order_code'      => 'PRD-' . strtoupper(Str::random(8)),
                'pelanggan_id'    => $request->user()->id,
                'subtotal'        => $subtotal,
                'shipping_cost'   => self::ONGKOS_KIRIM,
                'discount_amount' => 0,
                'total_amount'    => $subtotal + self::ONGKOS_KIRIM,
                'shipping_address' => $data['shipping_address'],
                'recipient_name'  => $data['recipient_name'],
                'recipient_phone' => $data['recipient_phone'],
                'payment_method'  => $data['payment_method'] ?? 'cod',
                'notes'           => $data['notes'] ?? null,
            ]);

            $order->items()->createMany($orderItems);
            DB::commit();

            return response()->json([
                'message' => 'Pesanan produk berhasil dibuat',
                'order'   => $order->load('items'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Gagal membuat pesanan: ' . $e->getMessage()], 500);
        }
    }

    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isMitra()) {
            $orderIds = ProductOrderItem::where('mitra_id', $user->id)
                ->pluck('product_order_id')
                ->unique();
            $orders = ProductOrder::whereIn('id', $orderIds)
                ->with('items.product')
                ->latest()
                ->paginate(15);
        } else {
            $orders = ProductOrder::where('pelanggan_id', $user->id)
                ->with('items.product')
                ->latest()
                ->paginate(15);
        }

        return response()->json($orders);
    }

    public function updateOrderStatus(Request $request, ProductOrder $productOrder): JsonResponse
    {
        $request->validate([
            'status'          => 'required|in:pembayaran_dikonfirmasi,diproses,dikirim,selesai,dibatalkan',
            'tracking_number' => 'nullable|string',
        ]);

        $updates = ['status' => $request->status];

        if ($request->tracking_number) {
            $updates['tracking_number'] = $request->tracking_number;
        }

        match ($request->status) {
            'pembayaran_dikonfirmasi' => $updates['paid_at']       = now(),
            'dikirim'                 => $updates['shipped_at']    = now(),
            'selesai'                 => $updates['delivered_at']  = now(),
            'dibatalkan'              => $updates['cancelled_at']  = now(),
            default                   => null,
        };

        $productOrder->update($updates);

        return response()->json(['message' => 'Status pesanan diperbarui', 'order' => $productOrder]);
    }

    public function review(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $review = $product->reviews()->updateOrCreate(
            ['user_id' => $request->user()->id],
            $data
        );

        return response()->json(['message' => 'Ulasan berhasil disimpan', 'review' => $review]);
    }
}
