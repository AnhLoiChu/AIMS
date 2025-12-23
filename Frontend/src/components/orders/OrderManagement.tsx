
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  subtotal: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  order_date: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 30;

  useEffect(() => {
    // Mock data
    const mockOrders: Order[] = [
      {
        id: '1',
        customer_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, State',
        subtotal: 45.97,
        total: 50.57,
        status: 'pending',
        order_date: '2024-01-20',
        items: [
          { product_name: 'The Great Gatsby', quantity: 2, price: 18.99 },
          { product_name: 'Abbey Road', quantity: 1, price: 15.99 }
        ]
      },
      {
        id: '2',
        customer_name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        address: '456 Oak Ave, City, State',
        subtotal: 29.99,
        total: 32.99,
        status: 'pending',
        order_date: '2024-01-21',
        items: [
          { product_name: 'Dark Side of the Moon', quantity: 1, price: 29.99 }
        ]
      }
    ];
    setOrders(mockOrders);
  }, []);

  const handleApproveOrder = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: 'approved' as const } : order
    ));
  };

  const handleRejectOrder = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: 'rejected' as const } : order
    ));
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const paginatedOrders = pendingOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="text-sm text-gray-600">
          Showing {pendingOrders.length} pending orders
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paginatedOrders.map((order) => (
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
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Customer Information</h4>
                  <p className="text-sm">{order.customer_name}</p>
                  <p className="text-sm text-gray-600">{order.email}</p>
                  <p className="text-sm text-gray-600">{order.phone}</p>
                  <p className="text-sm text-gray-600">{order.address}</p>
                </div>

                <div>
                  <h4 className="font-semibold">Order Items</h4>
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
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => handleApproveOrder(order.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectOrder(order.id)}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingOrders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 text-lg">No pending orders</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
