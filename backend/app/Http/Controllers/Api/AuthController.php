<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MitraProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $role = $request->input('role', 'pelanggan');

        // Validasi dasar (semua role)
        $allMitraRoles = 'mitra,mitra_urut,mitra_laundry,mitra_catering,mitra_kebersihan,mitra_antar_barang';

        $base = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users',
            'phone'      => 'required|string|max:20|unique:users',
            'password'   => ['required', 'confirmed', Password::min(8)],
            'role'       => 'sometimes|in:pelanggan,penjual,' . $allMitraRoles,
            'address'    => 'sometimes|string',
            'gender'     => 'sometimes|nullable|in:pria,wanita',
            'birth_date' => 'sometimes|nullable|date',
        ]);

        // Validasi tambahan per role
        $extra = [];
        if (str_starts_with($role, 'mitra')) {
            $extra = $request->validate([
                'vehicle_type'  => 'sometimes|nullable|string|max:50',
                'vehicle_plate' => 'sometimes|nullable|string|max:20',
                'ktp_image'     => 'sometimes|nullable|string',
                'sim_image'     => 'sometimes|nullable|string',
                'store_name'    => 'sometimes|nullable|string|max:255',
                'store_desc'    => 'sometimes|nullable|string',
                'bio'           => 'sometimes|nullable|string',
            ]);
        } elseif ($role === 'penjual') {
            $extra = $request->validate([
                'store_name' => 'sometimes|string|max:255',
                'store_desc' => 'sometimes|string',
            ]);
        }

        $user = User::create([
            'name'       => $base['name'],
            'email'      => $base['email'],
            'phone'      => $base['phone'],
            'password'   => Hash::make($base['password']),
            'role'       => $base['role'] ?? 'pelanggan',
            'address'    => $base['address'] ?? null,
            'gender'     => $base['gender'] ?? null,
            'birth_date' => $base['birth_date'] ?? null,
        ]);

        if ($user->isMitra()) {
            MitraProfile::create([
                'user_id'       => $user->id,
                'service_type'  => $user->mitraServiceType(),
                'vehicle_type'  => $extra['vehicle_type']  ?? null,
                'vehicle_plate' => $extra['vehicle_plate'] ?? null,
                'ktp_image'     => $extra['ktp_image']     ?? null,
                'sim_image'     => $extra['sim_image']      ?? null,
                'store_name'    => $extra['store_name']    ?? null,
                'store_desc'    => $extra['store_desc']    ?? null,
                'bio'           => $extra['bio']           ?? null,
            ]);
        }

        if ($user->isPenjual()) {
            MitraProfile::create([
                'user_id'      => $user->id,
                'service_type' => 'produk',
                'store_name'   => $extra['store_name'] ?? null,
                'store_desc'   => $extra['store_desc']  ?? null,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Registrasi berhasil',
            'user'       => $user->load('mitraProfile'),
            'token'      => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->login)
            ->orWhere('phone', $request->login)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Email/nomor HP atau password salah.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Akun Anda telah dinonaktifkan.'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Login berhasil',
            'user'       => $user->load('mitraProfile'),
            'token'      => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('mitraProfile'));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'phone'      => 'sometimes|string|max:20|unique:users,phone,' . $user->id,
            'address'    => 'sometimes|nullable|string',
            'gender'     => 'sometimes|nullable|in:pria,wanita',
            'birth_date' => 'sometimes|nullable|date',
            'latitude'   => 'sometimes|numeric',
            'longitude'  => 'sometimes|numeric',
        ]);

        $user->update($data);

        return response()->json(['message' => 'Profil diperbarui', 'user' => $user->fresh()]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($request->current_password, $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password lama tidak sesuai.'],
            ]);
        }

        $request->user()->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password berhasil diubah']);
    }
}
