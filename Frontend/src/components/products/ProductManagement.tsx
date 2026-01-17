
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProductForm } from './ProductForm';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { formatVNDShort } from '@/utils/format';
import { apiService } from '@/services/api';

interface Product {
  id: string;
  title: string;
  category: 'book' | 'cd' | 'news' | 'dvd';
  value: number;
  current_price: number;
  quantity: number;
  creation_date: string;
}

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProducts({ limit: 100 });
      setProducts(data.map((p: any) => ({
        id: p.product_id.toString(),
        title: p.title,
        category: p.category,
        value: p.value,
        current_price: p.current_price,
        quantity: p.quantity,
        creation_date: new Date(p.creation_date).toISOString().split('T')[0]
      })));
    } catch (err: any) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData: any) => {
    try {
      const payload = {
        title: productData.title,
        value: productData.value,
        quantity: productData.quantity,
        current_price: productData.current_price,
        category: productData.category,
        type: productData.category,
        barcode: `BAR${Date.now()}`,
        description: productData.description || '',
        weight: productData.weight || 1.0,
        dimensions: productData.dimensions || '10x10x10',
        warehouse_entrydate: new Date().toISOString(),
        manager_id: 1, // TODO: Get from auth context
        subtypeFields: buildSubtypeFields(productData)
      };
      
      await apiService.createProduct(payload);
      await fetchProducts();
      setShowForm(false);
    } catch (err: any) {
      alert('Failed to create product: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEditProduct = async (productData: any) => {
    if (!editingProduct) return;
    
    try {
      const payload = {
        title: productData.title,
        value: productData.value,
        quantity: productData.quantity,
        current_price: productData.current_price,
        category: productData.category,
        type: productData.category,
        description: productData.description || '',
        weight: productData.weight || 1.0,
        dimensions: productData.dimensions || '10x10x10',
        subtypeFields: buildSubtypeFields(productData)
      };
      
      await apiService.updateProduct(parseInt(editingProduct.id), payload);
      await fetchProducts();
      setEditingProduct(null);
      setShowForm(false);
    } catch (err: any) {
      alert('Failed to update product: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteProducts = async () => {
    if (selectedProducts.length > 10) {
      alert('Cannot delete more than 10 products at once');
      return;
    }
    
    try {
      const productIds = selectedProducts.map(id => parseInt(id));
      await apiService.deleteProducts(productIds);
      await fetchProducts();
      setSelectedProducts([]);
    } catch (err: any) {
      alert('Failed to delete products: ' + (err.message || 'Unknown error'));
    }
  };

  const buildSubtypeFields = (data: any) => {
    switch (data.category) {
      case 'book':
        return {
          author: data.author || '',
          cover_type: data.cover_type || 'paperback',
          publisher: data.publisher || '',
          publication_date: data.publication_date || new Date().toISOString().split('T')[0],
          number_of_pages: parseInt(data.number_of_pages) || 0,
          language: data.language || 'English',
          genre: data.genre || ''
        };
      case 'cd':
        return {
          artist: data.artist || '',
          record_label: data.record_label || '',
          tracklist: data.tracklist || '',
          release_date: data.release_date || new Date().toISOString().split('T')[0],
          genre: data.genre || ''
        };
      case 'dvd':
        return {
          director: data.director || '',
          runtime: data.runtime || '120',
          studio: data.studio || '',
          disc_type: data.disc_type || 'standard',
          subtitles: data.subtitles || 'English',
          language: data.language || 'English',
          release_date: data.release_date || new Date().toISOString().split('T')[0],
          genre: data.genre || ''
        };
      case 'news':
        return {
          editor_in_chief: data.editor_in_chief || '',
          publisher: data.publisher || '',
          publication_date: data.publication_date || new Date().toISOString().split('T')[0],
          issue_number: data.issue_number || '1',
          publication_frequency: data.publication_frequency || 'monthly',
          issn: data.issn || '',
          language: data.language || 'English',
          sections: data.sections || ''
        };
      default:
        return {};
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        {error}
        <Button onClick={fetchProducts} className="ml-4">Retry</Button>
      </div>
    );
  }

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSave={editingProduct ? handleEditProduct : handleAddProduct}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <div className="flex space-x-2">
          {selectedProducts.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteProducts}
              disabled={selectedProducts.length > 10}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedProducts.length})
            </Button>
          )}
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="flex space-x-4">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="mt-1"
                  />
                  <div>
                    <CardTitle className="text-lg">{product.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {product.category.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProduct(product);
                    setShowForm(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Value:</span>
                  <span>{formatVNDShort(product.value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Price:</span>
                  <span className="font-semibold text-green-600">
                    {formatVNDShort(product.current_price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stock:</span>
                  <span>{product.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm">{product.creation_date}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProducts.length > 10 && (
        <div className="text-red-600 text-sm">
          Cannot delete more than 10 products at once for security reasons.
        </div>
      )}
    </div>
  );
};
