
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Edit } from 'lucide-react';
import { ProductForm } from './ProductForm';
import { apiService } from '@/services/api';
import { formatVNDShort } from '@/utils/format';

interface Product {
  title: string;
  id: string;
  value: number;
  category: 'book' | 'cd' | 'news' | 'dvd';
  quantity: number;
  current_price: number;
  creation_date: string;
  is_active: boolean;
}

export const ProductManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiService.getProducts({ limit: 100, includeInactive: true });
      setProducts(data.map((p: any) => ({
        title: p.title,
        id: p.product_id.toString(),
        value: p.value,
        category: p.category,
        quantity: p.quantity,
        current_price: p.current_price,
        creation_date: new Date(p.creation_date).toISOString().split('T')[0],
        is_active: p.is_active,
      })));
    } catch (err: any) {
      console.error(err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (productData: any) => {
    if (!editingProduct) return;

    try {
      const payload = {
        value: productData.value,
        title: productData.title,
        current_price: productData.current_price,
        quantity: productData.quantity,
        type: productData.category,
        category: productData.category,
        weight: productData.weight || 1.0,
        description: productData.description || '',
        dimensions: productData.dimensions || '10x10x10',
        subtypeFields: buildSubtypeFields(productData)
      };

      await apiService.updateProduct(parseInt(editingProduct.id), payload);
      await fetchProducts();
      setShowForm(false);
      setEditingProduct(null);
    } catch (err: any) {
      alert('Failed to update product: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAddProduct = async (productData: any) => {
    try {
      // Get logged-in user's ID
      const user = apiService.getUser();
      const managerId = user?.user_id || user?.id || 1;

      const payload = {
        value: productData.value,
        title: productData.title,
        current_price: productData.current_price,
        quantity: productData.quantity,
        type: productData.category,
        category: productData.category,
        description: productData.description || '',
        barcode: `BAR${Date.now()}`,
        dimensions: productData.dimensions || '10x10x10',
        weight: productData.weight || 1.0,
        manager_id: managerId,
        warehouse_entrydate: new Date().toISOString(),
        subtypeFields: buildSubtypeFields(productData)
      };

      await apiService.createProduct(payload);
      await fetchProducts();
      setShowForm(false);
    } catch (err: any) {
      alert('Failed to create product: ' + (err.message || 'Unknown error'));
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
      case 'cd':
        return {
          record_label: data.record_label || '',
          artist: data.artist || '',
          release_date: data.release_date || new Date().toISOString().split('T')[0],
          tracklist: data.tracklist || '',
          genre: data.genre || ''
        };
      case 'book':
        return {
          cover_type: data.cover_type || 'paperback',
          author: data.author || '',
          publication_date: data.publication_date || new Date().toISOString().split('T')[0],
          publisher: data.publisher || '',
          language: data.language || 'English',
          number_of_pages: parseInt(data.number_of_pages) || 0,
          genre: data.genre || ''
        };
      case 'news':
        return {
          publisher: data.publisher || '',
          editor_in_chief: data.editor_in_chief || '',
          issue_number: data.issue_number || '1',
          publication_date: data.publication_date || new Date().toISOString().split('T')[0],
          issn: data.issn || '',
          publication_frequency: data.publication_frequency || 'monthly',
          sections: data.sections || '',
          language: data.language || 'English',
        };
      case 'dvd':
        return {
          runtime: data.runtime || '120',
          director: data.director || '',
          disc_type: data.disc_type || 'standard',
          studio: data.studio || '',
          language: data.language || 'English',
          subtitles: data.subtitles || 'English',
          genre: data.genre || '',
          release_date: data.release_date || new Date().toISOString().split('T')[0],
        };
      default:
        return {};
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          setEditingProduct(null);
          setShowForm(false);
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
                    {!product.is_active && (
                      <Badge variant="destructive" className="mt-1 ml-2">
                        NGỪNG KINH DOANH
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      // Fetch full product details including subtype fields
                      const fullProduct = await apiService.getProductDetail(parseInt(product.id));
                      setEditingProduct({
                        id: product.id,
                        category: fullProduct.category as 'book' | 'cd' | 'news' | 'dvd',
                        title: fullProduct.title,
                        current_price: fullProduct.current_price,
                        value: fullProduct.value,
                        weight: fullProduct.weight,
                        quantity: fullProduct.quantity,
                        dimensions: fullProduct.dimensions,
                        // Subtype fields
                        cover_type: fullProduct.cover_type,
                        author: fullProduct.author,
                        publication_date: fullProduct.publication_date,
                        publisher: fullProduct.publisher,
                        language: fullProduct.language,
                        number_of_pages: fullProduct.number_of_pages,
                        genre: fullProduct.genre,
                        record_label: fullProduct.record_label,
                        artist: fullProduct.artist,
                        release_date: fullProduct.release_date,
                        tracklist: fullProduct.tracklist,
                        runtime: fullProduct.runtime,
                        director: fullProduct.director,
                        disc_type: fullProduct.disc_type,
                        studio: fullProduct.studio,
                        subtitles: fullProduct.subtitles,
                        issue_number: fullProduct.issue_number,
                        editor_in_chief: fullProduct.editor_in_chief,
                        issn: fullProduct.issn,
                        publication_frequency: fullProduct.publication_frequency,
                        sections: fullProduct.sections,
                      } as any);
                      setShowForm(true);
                    } catch (err) {
                      alert('Failed to load product details');
                    }
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Price:</span>
                  <span className="font-semibold text-green-600">
                    {formatVNDShort(product.current_price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Value:</span>
                  <span>{formatVNDShort(product.value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stock:</span>
                  <span>{product.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={product.is_active ? "text-green-600" : "text-red-600"}>
                    {product.is_active ? "Kinh doanh" : "Ngừng kinh doanh"}
                  </span>
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
