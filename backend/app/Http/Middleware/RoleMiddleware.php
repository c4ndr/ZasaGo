<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userRole = $request->user()?->role ?? null;

        if (! $userRole) {
            return response()->json(['message' => 'Akses ditolak. Anda tidak memiliki izin.'], 403);
        }

        foreach ($roles as $role) {
            if ($role === $userRole) return $next($request);
            // 'mitra' in middleware accepts all mitra_* role variants
            if ($role === 'mitra' && str_starts_with($userRole, 'mitra')) return $next($request);
        }

        return response()->json(['message' => 'Akses ditolak. Anda tidak memiliki izin.'], 403);
    }
}
