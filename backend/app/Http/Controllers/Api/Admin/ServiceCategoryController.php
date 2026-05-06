<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ServiceCategory::orderBy('urutan')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama'      => 'required|string|max:100',
            'icon'      => 'required|string|max:10',
            'deskripsi' => 'nullable|string',
            'urutan'    => 'sometimes|integer|min:0',
        ]);

        $cat = ServiceCategory::create($data);

        return response()->json(['message' => 'Layanan berhasil ditambahkan', 'data' => $cat], 201);
    }

    public function update(Request $request, ServiceCategory $layanan): JsonResponse
    {
        $data = $request->validate([
            'nama'      => 'sometimes|string|max:100',
            'icon'      => 'sometimes|string|max:10',
            'deskripsi' => 'nullable|string',
            'urutan'    => 'sometimes|integer|min:0',
        ]);

        $layanan->update($data);

        return response()->json(['message' => 'Layanan berhasil diperbarui', 'data' => $layanan]);
    }

    public function toggle(ServiceCategory $layanan): JsonResponse
    {
        $layanan->update(['is_active' => ! $layanan->is_active]);

        return response()->json(['message' => 'Status layanan diperbarui', 'data' => $layanan]);
    }

    public function destroy(ServiceCategory $layanan): JsonResponse
    {
        $layanan->delete();

        return response()->json(['message' => 'Layanan berhasil dihapus']);
    }

    // Endpoint publik: layanan aktif untuk pelanggan dashboard
    public function aktif(): JsonResponse
    {
        return response()->json(ServiceCategory::where('is_active', true)->orderBy('urutan')->get());
    }
}
