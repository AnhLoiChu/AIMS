
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Order {
  id: string;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered';
  order_date: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

interface OrderHistoryProps {
  userId: string;
}

export const OrderHistory = ({ userId }: OrderHistoryProps) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Mock data - in real app, fetch user's orders
    const mockOrders: Order[] = [
      {
        id: '1001',
        total: 50.57,
        status: 'delivered',
        order_date: '2024-01-15',
        items: [
          { product_name: 'The Great Gatsby', quantity: 1, price: 18.99 },
          { product_name: 'Abbey Road', quantity: 1, price: 15.99 }
        ]
      },
      {
        id: '1002',
        total: 32.99,
        status: 'shipped',
        order_date: '2024-01-18',
        items: [
          { product_name: 'Inception', quantity: 1, price: 22.99 }
        ]
      }
    ];
    setOrders(mockOrders);
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (orders.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-gray-500 text-lg">No order history</p>
          <p className="text-gray-400 mt-2">Your completed orders will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order History</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <p className="text-sm text-gray-600">{order.order_date}</p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Items</h4>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product_name} (x{item.quantity})</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
