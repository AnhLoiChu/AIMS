
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProductForm } from './ProductForm';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { formatVNDShort } from '@/utils/format';

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

  useEffect(() => {
    // Mock data
    const mockProducts: Product[] = [
      {
        id: '1',
        title: 'The Great Gatsby',
        category: 'book',
        value: 15.99,
        current_price: 18.99,
        quantity: 25,
        creation_date: '2024-01-15'
      },
      {
        id: '2',
        title: 'Abbey Road',
        category: 'cd',
        value: 12.99,
        current_price: 15.99,
        quantity: 15,
        creation_date: '2024-01-16'
      }
    ];
    setProducts(mockProducts);
  }, []);

  const handleAddProduct = (productData: any) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      creation_date: new Date().toISOString().split('T')[0]
    };
    setProducts(prev => [...prev, newProduct]);
    setShowForm(false);
  };

  const handleEditProduct = (productData: any) => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p
      ));
      setEditingProduct(null);
      setShowForm(false);
    }
  };

  const handleDeleteProducts = () => {
    if (selectedProducts.length > 10) {
      alert('Cannot delete more than 10 products at once');
      return;
    }
    setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
    setSelectedProducts([]);
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
