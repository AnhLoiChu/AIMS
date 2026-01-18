import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/api';

interface Order {
  subtotal: number;
  order_id: string;
  status: string;
  delivery_fee: number;
  accept_date: string | null;
  orderItems: Array<{
    quantity: number;
    product: { title: string };
    product_id: number;
  }>;
  deliveryInfo: {
    email: string;
    recipient_name: string;
    address: string;
    phone: string;
    province: string;
  };
  paymentTransaction: any;
}

export const OrderManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const ordersPerPage = 30;

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getPendingOrders();
      // Handle nested response from Backend
      setOrders(response.orders || []);
    } catch (error) {
      toast.error("Failed to fetch pending orders");
      console.error("Failed to fetch pending orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRejectOrder = async (orderId: string) => {
    try {
      await apiService.approveOrder(orderId, 'Cancelled');
      toast.success(`Order #${orderId} rejected`);
      fetchOrders(); // Refresh list
    } catch (error) {
      toast.error("Failed to reject order");
      console.error("Failed to reject order:", error);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      await apiService.approveOrder(orderId, 'Shipping');
      toast.success(`Order #${orderId} approved`);
      fetchOrders(); // Refresh list
    } catch (error: any) {
      // Attempt to get backend error message
      const message = error.message || "Failed to approve order";
      toast.error(message);
      console.error("Failed to approve order:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Shipping': return 'bg-green-100 text-green-800';
      case 'Waiting for Approval': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled by Customer': return 'bg-red-50 text-red-600 border border-red-200';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const paginatedOrders = orders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  if (isLoading) {
    return <div className="text-center py-12">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="text-sm text-gray-600">
          Showing {orders.length} pending orders
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paginatedOrders.map((order) => (
          <Card key={order.order_id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{order.order_id}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {order.accept_date ? new Date(order.accept_date).toLocaleDateString() : 'New Order'}
                  </p>
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
                  <p className="text-sm">{order.deliveryInfo?.recipient_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{order.deliveryInfo?.email || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{order.deliveryInfo?.phone || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    {order.deliveryInfo?.address}, {order.deliveryInfo?.province}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">Order Items</h4>
                  <div className="space-y-1">
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product.title} (x{item.quantity})</span>
                        {/* Note: Price might not be directly available in orderItems based on Backend DTO, 
                            but we show what we have */}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{order.subtotal.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{(order.subtotal + order.delivery_fee).toLocaleString()} VND</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={() => handleApproveOrder(order.order_id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectOrder(order.order_id)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 text-lg">No pending orders</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
