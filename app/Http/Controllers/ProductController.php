<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->with('category:id,name')
            ->when($request->string('search')->toString(), fn ($q, $s) => $q
                ->where('name', 'like', "%{$s}%")->orWhere('sku', 'like', "%{$s}%"))
            ->when($request->input('category_id'), fn ($q, $v) => $q->where('category_id', $v))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Sales/Products', [
            'products' => $products,
            'categories' => Category::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        Product::create($request->validated());

        return back()->with('success', 'Product created.');
    }

    public function update(StoreProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return back()->with('success', 'Product updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return back()->with('success', 'Product deleted.');
    }
}
