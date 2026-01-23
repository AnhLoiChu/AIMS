
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Receipt, User, MapPin, Phone, Calendar } from 'lucide-react';
import { getProvinceName } from '@/utils/provinces';

interface OrderSuccessProps {
  orderData: {
    items: any[];
    deliveryInfo: {
      recipient_name: string;
      email: string;
      phone: string;
      province: string;
      address: string;
    };

    pricing: {
      subtotal: number;
      vat: number;
      deliveryFees: {
        regular: number;
      };
      total: number;
    };
  };
  transactionData: {
    transactionId: string;
    transactionContent: string;
    transactionDateTime: string;
  };
  onBackToShopping: () => void;
}

export const OrderSuccess = ({ orderData, transactionData, onBackToShopping }: OrderSuccessProps) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Thank you for your order. Your payment has been processed successfully.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Order Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium">{orderData.deliveryInfo.recipient_name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{orderData.deliveryInfo.phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p className="font-medium">{orderData.deliveryInfo.address}</p>
                  <p className="text-sm text-gray-600">{getProvinceName(orderData.deliveryInfo.province)}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">{orderData.pricing.total.toLocaleString('vi-VN')} VND</p>
              </div>


            </CardContent>
          </Card>

          {/* Transaction Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Transaction Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded border">
                  {transactionData.transactionId}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Transaction Content</p>
                <p className="font-medium">{transactionData.transactionContent}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Transaction Date & Time</p>
                <p className="font-medium">{new Date(transactionData.transactionDateTime).toLocaleString()}</p>
              </div>

              <Separator />

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Please save your transaction ID for future reference.
                  You will receive an email confirmation shortly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <div>
                    <span className="font-medium">{item.title}</span>
                    <span className="text-gray-500 ml-2">(x{item.quantity})</span>
                  </div>
                  <span className="font-medium">{(item.current_price * item.quantity).toLocaleString('vi-VN')} VND</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal (excl. VAT):</span>
                <span>{orderData.pricing.subtotal.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (10%):</span>
                <span>{orderData.pricing.vat.toLocaleString('vi-VN')} VND</span>
              </div>
              {orderData.pricing.deliveryFees.regular > 0 && (
                <div className="flex justify-between">
                  <span>Regular Delivery:</span>
                  <span>{orderData.pricing.deliveryFees.regular.toLocaleString()} VND</span>
                </div>
              )}

              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{orderData.pricing.total.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button
            onClick={onBackToShopping}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};
