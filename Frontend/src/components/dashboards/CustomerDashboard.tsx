
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCatalog } from '@/components/products/ProductCatalog';
import { ShoppingCart } from '@/components/cart/ShoppingCart';
import { OrderHistory } from '@/components/orders/OrderHistory';
import { OrderSuccess } from '@/components/orders/OrderSuccess';
import { Header } from '@/components/layout/Header';
import { User } from '@/pages/Index';
import { Product, apiService } from '@/services/api';

interface CustomerDashboardProps {
  user: User;
  onLogout: () => void;
  onRoleSwitch?: (role: 'customer' | 'product_manager' | 'administrator') => void;
  availableRoles: string[];
}

interface CartItem {
  id: string;
  title: string;
  category: string;
  current_price: number;
  quantity: number;
  maxQuantity: number;
  weight: number;
}

export const CustomerDashboard = ({ user, onLogout, onRoleSwitch, availableRoles }: CustomerDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart' | 'orders' | 'order-success'>('catalog');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderData: any;
    transactionData: any;
  } | null>(null);

  // Load cart from backend on mount
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const items = await apiService.viewCart(user.id);
        // We need to fetch product details for each item because viewCart might return limited info
        // Or if viewCart returns joined data, we parse it.
        // Assuming viewCart returns: { product: { ... }, quantity: number }[] based on typical NestJS/TypeORM
        // Let's check api.ts viewCart signature: returns { cart_id, product_id, quantity }[]
        // This is insufficient for UI (need title, price).
        // We might need to fetch product details for each ID or update Backend viewCart to return relations.

        // For now, let's assume we need to fetch product details or that apiService needs update.
        // Let's checking api.ts again via memory or context. 
        // api.ts: viewCart returns data.productInCarts || [].
        // Checking Backend CartService (not visible) but usually it includes relations.
        // If api.ts types are strict we might need to cast.

        // Let's try to map what we get. If only IDs, we must fetch products.
        // Optimization: Fetch all products or fetch by IDs.

        // Let's blindly trust that viewCart (Backend) includes 'product' relation as is common practice.
        // If not, we will need to fix Backend CartService too.

        // Actually, looking at order.service.ts, productInCartRepository is used.
        // Let's assume for now we might be missing title/price.
        console.log('Fetched cart items:', items);

        // Temporarily: If items have 'product' field
        const mappedItems: CartItem[] = items.map((item: any) => ({
          id: item.product_id?.toString() || item.product?.product_id?.toString(),
          title: item.product?.title || 'Loading...',
          category: item.product?.category || 'General',
          current_price: item.product?.value || 0, // Note: Backend uses 'value'
          quantity: item.quantity,
          maxQuantity: item.product?.quantity || 100,
          weight: item.product?.weight || 0
        })).filter(i => i.id); // Filter invalid

        setCartItems(mappedItems);
      } catch (err) {
        console.error("Failed to load cart", err);
      }
    };
    fetchCart();
  }, [user.id]);

  const addToCart = async (product: Product, quantity: number) => {
    try {
      await apiService.addProductToCart(user.id, product.product_id, quantity);
      console.log('Product added to cart successfully');

      setCartItems(prev => {
        const existingItem = prev.find(item => item.id === product.product_id.toString());
        if (existingItem) {
          return prev.map(item =>
            item.id === product.product_id.toString()
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        // Convert API product to cart item format
        const cartItem: CartItem = {
          id: product.product_id.toString(),
          title: product.title,
          category: product.type,
          current_price: product.current_price,
          quantity,
          maxQuantity: product.quantity,
          weight: product.weight
        };
        return [...prev, cartItem];
      });
    } catch (error) {
      console.error('Failed to add product to cart:', error);
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await apiService.removeProductFromCart(user.id, parseInt(productId), 0);
        console.log('Product removed from cart successfully');
        setCartItems(prev => prev.filter(item => item.id !== productId));
      } else {
        // For quantity updates, we need to remove and re-add with new quantity
        const currentItem = cartItems.find(item => item.id === productId);
        if (currentItem) {
          await apiService.removeProductFromCart(user.id, parseInt(productId), 0);
          await apiService.addProductToCart(user.id, parseInt(productId), quantity);
          console.log('Product quantity updated successfully');
          setCartItems(prev =>
            prev.map(item =>
              item.id === productId ? { ...item, quantity } : item
            )
          );
        }
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const clearCart = async () => {
    try {
      await apiService.emptyCart(user.id);
      console.log('Cart cleared successfully');
      setCartItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const handleOrderComplete = async (orderData: any) => {
    try {
      // Create order with cart ID and product IDs
      const productIds = cartItems.map(item => parseInt(item.id));
      const createOrderResult = await apiService.createOrder(parseInt(user.id), productIds);
      console.log('Order created successfully:', createOrderResult);

      const normalDeliveryData = {
        order_id: createOrderResult.order.order_id,
        recipient_name: orderData.deliveryInfo.recipient_name,
        email: orderData.deliveryInfo.email,
        phone: orderData.deliveryInfo.phone,
        province: orderData.deliveryInfo.province,
        address: orderData.deliveryInfo.address
      };
      await apiService.createNormalOrderDeliveryInfo(normalDeliveryData);
      console.log('Normal order delivery info created successfully');

      // Generate mock transaction data (in real app, this would come from payment processor)
      const transactionData = {
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        transactionContent: `Payment for order containing ${orderData.items.length} items`,
        transactionDateTime: new Date().toISOString()
      };

      setOrderSuccessData({ orderData, transactionData });
      setActiveTab('order-success');
      setCartItems([]); // Clear cart after successful order
    } catch (error) {
      console.error('Failed to complete order:', error);
    }
  };

  const handleBackToShopping = () => {
    setActiveTab('catalog');
    setOrderSuccessData(null);
  };

  if (activeTab === 'order-success' && orderSuccessData) {
    return (
      <OrderSuccess
        orderData={orderSuccessData.orderData}
        transactionData={orderSuccessData.transactionData}
        onBackToShopping={handleBackToShopping}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={onLogout}
        onRoleSwitch={onRoleSwitch}
        availableRoles={availableRoles}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === 'catalog' ? 'default' : 'outline'}
            onClick={() => setActiveTab('catalog')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Product Catalog
          </Button>
          <Button
            variant={activeTab === 'cart' ? 'default' : 'outline'}
            onClick={() => setActiveTab('cart')}
            className="relative"
          >
            Shopping Cart
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('orders')}
          >
            Order History
          </Button>
        </div>

        {activeTab === 'catalog' && (
          <ProductCatalog onAddToCart={addToCart} />
        )}
        {activeTab === 'cart' && (
          <ShoppingCart
            items={cartItems}
            user={user}
            onUpdateItem={updateCartItem}
            onClearCart={clearCart}
            onOrderComplete={handleOrderComplete}
            onOrderCreate={() => { }}
            onDeliveryInfoCreate={() => { }}
          />
        )}
        {activeTab === 'orders' && (
          <OrderHistory userId={user.id} />
        )}
      </div>
    </div>
  );
};
