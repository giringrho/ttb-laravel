<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Order\Actions\OrderValidateJob;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('order');
    }

    public function uploadCsv(Request $request): Response
    {
        $request->validate([
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:csv,txt|max:2048',
        ]);
    
        $jobKeys = [];
    
        foreach ($request->file('files') as $file) {
            $path = $file->store('csv-uploads');
            $key = md5($path);
    
            OrderValidateJob::dispatch($path, $file->getClientOriginalName());
            $jobKeys[] = $key;
        }
    
        return Inertia::render('order', [
            'jobKeys' => $jobKeys,
        ]);
    }
}
