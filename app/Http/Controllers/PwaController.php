<?php

namespace App\Http\Controllers;

use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PwaController extends Controller
{
    /**
     * Serve the built service worker from the site root so it can control the
     * full "/" scope (Service-Worker-Allowed header).
     */
    public function serviceWorker(): BinaryFileResponse
    {
        $path = public_path('build/sw.js');
        abort_unless(file_exists($path), 404);

        return response()->file($path, [
            'Content-Type' => 'application/javascript',
            'Service-Worker-Allowed' => '/',
            'Cache-Control' => 'no-cache',
        ]);
    }

    /**
     * Serve the built web app manifest from the site root.
     */
    public function manifest(): BinaryFileResponse
    {
        $path = public_path('build/manifest.webmanifest');
        abort_unless(file_exists($path), 404);

        return response()->file($path, ['Content-Type' => 'application/manifest+json']);
    }
}
