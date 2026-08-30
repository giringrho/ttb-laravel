<?php

namespace Modules\Order\Actions;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class OrderValidateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public array $validated = [];

    public function __construct(
        public string $filePath,
        public string $originalName,
    ) {}

    public function handle(): void
    {
        $cacheKey = 'csv-upload-status-' . md5($this->filePath);
        Cache::put($cacheKey, [
            'status' => 'processing',
            'file' => $this->originalName,
        ], now()->addMinutes(5));

        $handle = fopen(Storage::path($this->filePath), 'r');
        $header = fgetcsv($handle);

        while (($row = fgetcsv($handle)) !== false) {
            $this->validated[] = $this->validateData(array_combine($header, $row));
        }
        fclose($handle);

        $orderSave = new OrderSave();
        $orderSave->handle($this->validated);

        Cache::put($cacheKey, [
            'status' => 'completed',
            'file' => $this->originalName,
            'validated' => $this->validated,
        ], now()->addMinutes(5));
    }

    private function validateData($data): array
    {
        $validatedData = [
            'data' => $data,
            'error' => []
        ];

        if (empty($data['order_number'])) {
            $validatedData['error'][] = 'Order number is required';
        }
        if (empty($data['sku'])) {
            $validatedData['error'][] = 'SKU is required';
        }
        if (!isset($data['qty']) || $data['qty'] <= 0) {
            $validatedData['error'][] = 'Quantity must be greater than 0';
        }
        if (!isset($data['price']) || $data['price'] < 0) {
            $validatedData['error'][] = 'Price must be greater than or equal to 0';
        }

        return $validatedData;
    }
}