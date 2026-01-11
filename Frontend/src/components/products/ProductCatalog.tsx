
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiService, Product } from '@/services/api';
import { ProductDetail } from './ProductDetail';

interface ProductCatalogProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductCatalog = ({ onAddToCart }: ProductCatalogProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productData = await apiService.getProducts(100); // Fetch more products
        setProducts(productData);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.type === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.current_price - b.current_price;
      case 'price_high':
        return b.current_price - a.current_price;
      case 'title':
      default:
        return a.title.localeCompare(b.title);
    }
  });

  const paginatedProducts = sortedProducts.slice((currentPage - 1) * 20, currentPage * 20);
  const totalPages = Math.ceil(sortedProducts.length / 20);

  const handleAddToCart = (product: Product) => {
    const quantity = selectedQuantities[product.product_id] || 1;
    onAddToCart(product, quantity);
    setSelectedQuantities(prev => ({ ...prev, [product.product_id]: 1 }));
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'book': return '📚';
      case 'cd': return '💿';
      case 'lp': return '🎵';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

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
              <SelectItem value="lp">LP Records</SelectItem>
              <SelectItem value="dvd">DVDs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="title">Sort by Title</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-600">
          {filteredProducts.length} products found
        </div>
      </div>

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
                  {product.rush_order_eligibility && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">
                      Rush
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
                      ${product.current_price.toFixed(2)}
                    </p>
                    {product.value !== product.current_price && (
                      <p className="text-sm text-gray-500 line-through">
                        ${product.value.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Add to Cart
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
