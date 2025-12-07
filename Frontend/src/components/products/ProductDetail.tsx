
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { apiService, ProductDetail as ProductDetailType } from '@/services/api';

interface ProductDetailProps {
  productId: number;
  onBack: () => void;
  onAddToCart: (product: any, quantity: number) => void;
}

export const ProductDetail = ({ productId, onBack, onAddToCart }: ProductDetailProps) => {
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const productData = await apiService.getProductDetail(productId);
        setProduct(productData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      onAddToCart(product, quantity);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading product details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Product not found</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  const renderTypeSpecificDetails = () => {
    switch (product.type) {
      case 'book':
        if (!product.book) return null;
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Book Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-medium">Author:</span> {product.book.author}</div>
              <div><span className="font-medium">Publisher:</span> {product.book.publisher}</div>
              <div><span className="font-medium">Genre:</span> {product.book.genre}</div>
              <div><span className="font-medium">Language:</span> {product.book.language}</div>
              <div><span className="font-medium">Cover Type:</span> {product.book.cover_type}</div>
              <div><span className="font-medium">Pages:</span> {product.book.number_of_pages}</div>
              <div className="col-span-2">
                <span className="font-medium">Publication Date:</span> {formatDate(product.book.publication_date)}
              </div>
            </div>
          </div>
        );

      case 'cd':
        if (!product.cd) return null;
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">CD Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-medium">Artist:</span> {product.cd.artist}</div>
              <div><span className="font-medium">Genre:</span> {product.cd.genre}</div>
              <div><span className="font-medium">Record Label:</span> {product.cd.record_label}</div>
              <div><span className="font-medium">Release Date:</span> {formatDate(product.cd.release_date)}</div>
            </div>
            <div>
              <span className="font-medium">Tracklist:</span>
              <p className="mt-1 text-sm text-gray-600">{product.cd.tracklist}</p>
            </div>
          </div>
        );

      case 'dvd':
        if (!product.dvd) return null;
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">DVD Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-medium">Director:</span> {product.dvd.director}</div>
              <div><span className="font-medium">Studio:</span> {product.dvd.studio}</div>
              <div><span className="font-medium">Genre:</span> {product.dvd.genre}</div>
              <div><span className="font-medium">Runtime:</span> {product.dvd.runtime}</div>
              <div><span className="font-medium">Language:</span> {product.dvd.language}</div>
              <div><span className="font-medium">Subtitles:</span> {product.dvd.subtitles}</div>
              <div><span className="font-medium">Disc Type:</span> {product.dvd.disc_type}</div>
              <div><span className="font-medium">Release Date:</span> {formatDate(product.dvd.release_date)}</div>
            </div>
          </div>
        );

      case 'lp':
        if (!product.lp) return null;
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">LP Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-medium">Artist:</span> {product.lp.artist}</div>
              <div><span className="font-medium">Genre:</span> {product.lp.genre}</div>
              <div><span className="font-medium">Record Label:</span> {product.lp.record_label}</div>
              <div><span className="font-medium">Release Date:</span> {formatDate(product.lp.release_date)}</div>
            </div>
            <div>
              <span className="font-medium">Tracklist:</span>
              <p className="mt-1 text-sm text-gray-600">{product.lp.tracklist}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button onClick={onBack} variant="outline" className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {getCategoryIcon(product.type)} {product.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{product.type.toUpperCase()}</Badge>
                <Badge variant="outline">{product.category}</Badge>
                {product.rush_order_eligibility && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Rush Eligible
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                ${product.current_price.toFixed(2)}
              </div>
              {product.value !== product.current_price && (
                <div className="text-lg text-gray-500 line-through">
                  ${product.value.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Stock:</span>
              <div className="text-lg font-semibold">{product.quantity}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Weight:</span>
              <div>{product.weight}kg</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Dimensions:</span>
              <div>{product.dimensions}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Barcode:</span>
              <div className="font-mono text-xs">{product.barcode}</div>
            </div>
          </div>

          <Separator />

          {renderTypeSpecificDetails()}

          <Separator />

          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="font-medium">Quantity:</label>
              <input
                id="quantity"
                type="number"
                min="1"
                max={product.quantity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-1 border border-gray-300 rounded-md text-center"
              />
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={product.quantity === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div>Created: {formatDate(product.creation_date)}</div>
            <div>Warehouse Entry: {formatDate(product.warehouse_entrydate)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
