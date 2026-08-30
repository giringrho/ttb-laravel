<?php

namespace Modules\Order\Actions;

use Illuminate\Support\Facades\DB;
use Modules\Order\Models\Order;

class OrderSave
{
    public function handle(&$validated)
    {
        foreach ($validated as $k => $data) {
            if ($data['error'] === []) {
                $order = Order::where('order_number', $data['data']['order_number'])->first();
                if (empty($order)) {
                    DB::transaction(function () use ($data) {
                        Order::create($data['data']);
                    });
                } else {
                    DB::transaction(function () use ($data, $order) {
                        $order->update(array_merge($data['data'], ['updated_at' => now()]));
                    });
                    $validated[$k]['error'][] = 'Order already exists, updated';
                }
            }
        }
    }
}