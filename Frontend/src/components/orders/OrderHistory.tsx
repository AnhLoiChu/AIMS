import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';

interface Order {
  order_id: string; // Updated to match backend
  subtotal: number;
  delivery_fee: number;
  status: string;
  accept_date: string | null;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        console.log("OrderHistory: Fetching history for userId:", userId);
        const data = await apiService.getOrderHistory(userId);
        console.log("OrderHistory: Received data:", data);
        setOrders(data);
      } catch (error) {
        console.error("OrderHistory: Failed to fetch order history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;

    try {
      await apiService.cancelOrder(orderId, userId);
      // Refresh orders
      const data = await apiService.getOrderHistory(userId);
      setOrders(data);
      alert('Đơn hàng đã được hủy thành công.');
    } catch (error: any) {
      console.error("OrderHistory: Failed to cancel order:", error);
      alert('Hủy đơn hàng thất bại: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting for Payment': return 'bg-orange-100 text-orange-800';
      case 'Waiting for Approval': return 'bg-yellow-100 text-yellow-800';
      case 'Shipping': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Cancelled by Customer': return 'bg-red-50 text-red-600 border border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-gray-500 text-lg">Loading order history...</p>
        </CardContent>
      </Card>
    );
  }

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
          <Card key={order.order_id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{order.order_id}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {order.accept_date ? new Date(order.accept_date).toLocaleDateString() : 'N/A'}
                  </p>
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
                        <span>{item.price.toLocaleString()} VND</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{order.subtotal.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee:</span>
                    <span>{order.delivery_fee.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t mt-1 pt-1">
                    <span>Total:</span>
                    <span>{(order.subtotal + order.delivery_fee).toLocaleString()} VND</span>
                  </div>
                </div>
                {(order.status === 'Waiting for Approval' || order.status === 'Waiting for Payment') && (
                  <div className="pt-2 border-t">
                    <button
                      onClick={() => handleCancelOrder(order.order_id)}
                      className="w-full py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Hủy đơn hàng
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
