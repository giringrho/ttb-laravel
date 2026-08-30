<?php

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Modules\Order\Http\Controllers\OrderController;

Route::get('/', [OrderController::class, 'index'])->name('order.index');
Route::post('/', [OrderController::class, 'uploadCsv'])->name('order.upload-csv');
Route::get('order/status', function (\Illuminate\Http\Request $request) {
    $key = $request->query('key');
    $cacheKey = $key ? 'csv-upload-status-' . $key : 'csv-upload-status';
    return Cache::get($cacheKey, ['status' => 'idle']);
})->name('order.status');
