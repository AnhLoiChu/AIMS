import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Checkout } from '@/components/checkout/Checkout';
import { on } from 'events';
import { User } from '@/pages/Index';
import { apiService } from '@/services/api';
import { set } from 'date-fns';
interface CartItem {
  id: string;
  title: string;
  category: string;
  current_price: number;
  quantity: number;
  maxQuantity: number;
  weight: number;
  rush_eligible?: boolean;
}

interface ShoppingCartProps {
  items: CartItem[];
  user: User;
  onUpdateItem: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onOrderCreate: (orderData: any) => void;
  onDeliveryInfoCreate: (deliveryInfo: any) => void;
  onOrderComplete: (orderData: any) => void;
}

export const ShoppingCart = ({ items, user, onUpdateItem, onClearCart, onOrderCreate, onDeliveryInfoCreate, onOrderComplete }: ShoppingCartProps) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const subtotal = items.reduce((sum, item) => sum + (item.current_price * item.quantity), 0);
  const vat = subtotal * 0.1; // 10% VAT
  const total = subtotal + vat;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    onUpdateItem(productId, newQuantity);
  };
  const handleCheckout = async () => {
    // Example: assuming you have cartId and productIds available
    // You may need to adjust how you get these values
    const cartId = Number(user.id);
    const productIds = items.map(item => Number(item.id));
    console.log(user);
    try {
      // Replace `api` with your actual API service instance

      const res = await apiService.createOrder(cartId, productIds);
      setResponse(res);
      // You can handle the response as needed, e.g., show checkout or update state
      setShowCheckout(true);
    } catch (error) {
      // Handle error (show notification, etc.)
      console.error('Order creation failed:', error);
    }
  };

  const handleOrderComplete = (orderData: any) => {
    onOrderComplete(orderData);
    setShowCheckout(false);
  };



  if (showCheckout) {
    return (
      <Checkout
        cartItems={items}
        rushable={items.some(item => item.rush_eligible)}
        orderId={response.order.order_id}
        onBack={() => setShowCheckout(false)}
        onOrderComplete={handleOrderComplete}
      />
    );
  }

  if (items.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Your cart is empty</p>
          <p className="text-gray-400 mt-2">Add some products to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shopping Cart</h2>
        <Button
          variant="outline"
          onClick={onClearCart}
          className="text-red-600 hover:text-red-700"
        >
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary">
                        {item.category.toUpperCase()}
                      </Badge>
                      {item.rush_eligible && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          Rush Eligible
                        </Badge>
                      )}
                    </div>
                    <p className="text-green-600 font-semibold mt-2">
                      ${item.current_price.toFixed(2)} each
                    </p>
                    <p className="text-xs text-gray-500">Weight: {item.weight}kg</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                        min="1"
                        max={item.maxQuantity}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                      >
                        +
                      </Button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="font-semibold">
                        ${(item.current_price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateItem(item.id, 0)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal (excl. VAT)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (10%)</span>
                <span>${vat.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Delivery fees will be calculated at checkout
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
