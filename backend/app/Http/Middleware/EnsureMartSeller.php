<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMartSeller
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || (!$user->martSeller && $user->role !== 'admin')) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        return $next($request);
    }
}
