
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { apiService, Product } from '@/services/api';
import { ProductDetail } from './ProductDetail';
import { formatVNDShort } from '@/utils/format';

interface ProductCatalogProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductCatalog = ({ onAddToCart }: ProductCatalogProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('random'); // Default random
  const [filterCategory, setFilterCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]); // 0 to 500k VND default
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<[number, number]>([0, 500000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setLoading(true);
        const [minPrice, maxPrice] = debouncedPriceRange;

        const productData = await apiService.getProducts({
          limit: 100,
          search: searchQuery,
          category: filterCategory,
          sort: sortBy,
          minPrice,
          maxPrice
        });
        setProducts(productData);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    fetchProducts();
    fetchProducts();
  }, [debouncedSearchQuery, filterCategory, sortBy, debouncedPriceRange]); // Depend on debounced price range

  // Client-side pagination of filtered results
  const paginatedProducts = products.slice((currentPage - 1) * 20, currentPage * 20);
  const totalPages = Math.ceil(products.length / 20);

  const handleAddToCart = (product: Product) => {
    const quantity = selectedQuantities[product.product_id] || 1;
    onAddToCart(product, quantity);
    setSelectedQuantities(prev => ({ ...prev, [product.product_id]: 1 }));
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'book': return '📚';
      case 'cd': return '💿';
      case 'news': return '📰';
      case 'dvd': return '📀';
      default: return '📦';
    }
  };

  const handleProductClick = (productId: number) => {
    setSelectedProductId(productId);
  };

  const handleBackFromDetail = () => {
    setSelectedProductId(null);
  };

  if (selectedProductId) {
    return (
      <ProductDetail
        productId={selectedProductId}
        onBack={handleBackFromDetail}
        onAddToCart={onAddToCart}
      />
    );
  }

  // if (loading) removed to prevent unmounting filters

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="book">Books</SelectItem>
              <SelectItem value="cd">CDs</SelectItem>
              <SelectItem value="news">Newspapers</SelectItem>
              <SelectItem value="dvd">DVDs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="title">Sort by Title</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="random">Random</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-col gap-2 min-w-[350px]">
            <span className="text-sm font-medium">
              Price: {formatVNDShort(priceRange[0])} - {formatVNDShort(priceRange[1])}
            </span>
            <Slider
              defaultValue={[0, 500000]}
              max={500000}
              step={10000}
              value={priceRange}
              onValueChange={(val) => setPriceRange(val as [number, number])}
              onValueCommit={(val) => setDebouncedPriceRange(val as [number, number])}
              className="w-full"
            />
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {products.length} products found
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading products...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => (
            <Card key={product.product_id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle
                    className="text-lg line-clamp-2 cursor-pointer hover:text-blue-600"
                    onClick={() => handleProductClick(product.product_id)}
                  >
                    {getCategoryIcon(product.type)} {product.title}
                  </CardTitle>
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="ml-2">
                      {product.type.toUpperCase()}
                    </Badge>
                    {product.quantity <= 0 && (
                      <Badge variant="destructive" className="ml-2">
                        OUT OF STOCK
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="line-clamp-2">{product.description}</p>
                  <p className="mt-1 font-medium">{product.category}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-bold text-green-600">
                        {formatVNDShort(product.current_price)}
                      </p>
                      {product.value !== product.current_price && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatVNDShort(product.value)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${product.quantity > 0 ? 'text-gray-600' : 'text-red-600'}`}>
                        {product.quantity > 0 ? `Stock: ${product.quantity}` : 'Out of Stock'}
                      </p>
                      <p className="text-xs text-gray-500">{product.weight}kg</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      max={product.quantity}
                      value={selectedQuantities[product.product_id] || 1}
                      onChange={(e) => setSelectedQuantities(prev => ({
                        ...prev,
                        [product.product_id]: parseInt(e.target.value) || 1
                      }))}
                      className="w-20"
                    />
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.quantity === 0}
                      className={`flex-1 ${product.quantity === 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {product.quantity === 0 ? 'Unavailable' : 'Add to Cart'}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleProductClick(product.product_id)}
                    className="w-full text-sm"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              onClick={() => setCurrentPage(page)}
              size="sm"
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
