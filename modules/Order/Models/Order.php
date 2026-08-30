<?php

namespace Modules\Order\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

/**
 * @property int $id
 * @property string $order_number
 * @property string $sku
 * @property int $qty
 * @property float $price
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['order_number', 'sku', 'qty', 'price', 'created_at', 'updated_at'])]
class Order extends Model
{
    
}
