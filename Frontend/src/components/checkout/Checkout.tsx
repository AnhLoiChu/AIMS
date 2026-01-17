
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Truck, QrCode, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiService } from '@/services/api';
import { formatVNDShort } from '@/utils/format';

interface CartItem {
  id: string;
  title: string;
  category: string;
  current_price: number;
  quantity: number;
  weight: number;
}

interface DeliveryInfo {
  recipient_name: string;
  email: string;
  phone: string;
  province: string;
  address: string;
}

interface CheckoutProps {
  cartItems: CartItem[];
  orderId: number;
  onBack: () => void;
  onOrderComplete: (orderData: any) => void;
}

export const Checkout = ({ cartItems, orderId, onBack, onOrderComplete }: CheckoutProps) => {
  const [step, setStep] = useState<'delivery' | 'payment'>('delivery');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    recipient_name: '',
    email: '',
    phone: '',
    province: '',
    address: ''
  });
  const [deliveryFees, setDeliveryFees] = useState({
    fee: 0,
    originalFee: 0,
    discount: 0
  });
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'PAYPAL'>('VIETQR');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  const [errors, setErrors] = useState<string[]>([]);
  const [isExternalPayment, setIsExternalPayment] = useState(false);

  // Province/City selection
  interface Province {
    code: number;
    name: string;
    codename: string;
  }
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  // Fetch provinces on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const response = await fetch('https://provinces.open-api.vn/api/p/');
        if (response.ok) {
          const data = await response.json();
          setProvinces(data);
        }
      } catch (error) {
        console.error('Failed to fetch provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Calculate delivery fees
  const calculateDeliveryFees = () => {
    const isHanoiOrHCM = deliveryInfo.province === 'thanh_pho_ha_noi' ||
      deliveryInfo.province === 'thanh_pho_ho_chi_minh';

    // Calculate total weight of order
    const totalWeight = cartItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

    let baseFee = 0;
    let additionalFee = 0;

    if (isHanoiOrHCM) {
      // Hanoi/HCMC: 22,000 VND for first 3kg
      baseFee = 22000;
      if (totalWeight > 3) {
        // 2,500 VND per additional 0.5kg
        additionalFee = Math.ceil((totalWeight - 3) / 0.5) * 2500;
      }
    } else {
      // Other areas: 30,000 VND for first 0.5kg
      baseFee = 30000;
      if (totalWeight > 0.5) {
        // 2,500 VND per additional 0.5kg
        additionalFee = Math.ceil((totalWeight - 0.5) / 0.5) * 2500;
      }
    }

    const originalFee = baseFee + additionalFee;
    let discount = 0;
    let finalFee = originalFee;

    // Free shipping for orders > 100,000 VND (max discount 25,000 VND)
    const itemsTotal = cartItems.reduce((sum, item) => sum + (item.current_price * item.quantity), 0);
    if (itemsTotal > 100000) {
      discount = Math.min(25000, originalFee);
      finalFee = Math.max(0, originalFee - 25000);
    }

    setDeliveryFees({
      fee: finalFee,
      originalFee,
      discount
    });
  };

  useEffect(() => {
    if (deliveryInfo.province) {
      calculateDeliveryFees();
    }
  }, [deliveryInfo.province, cartItems]);

  const validateDeliveryInfo = () => {
    const newErrors: string[] = [];

    if (!deliveryInfo.recipient_name.trim()) newErrors.push('Recipient name is required');
    if (!deliveryInfo.email.trim()) newErrors.push('Email is required');
    if (!deliveryInfo.phone.trim()) newErrors.push('Phone number is required');
    if (!deliveryInfo.province.trim()) newErrors.push('Province is required');
    if (!deliveryInfo.address.trim()) newErrors.push('Address is required');

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.current_price * item.quantity), 0);
  const vat = subtotal * 0.1;
  const total = subtotal + vat + deliveryFees.fee;

  const handleProceedToPayment = () => {
    if (!validateDeliveryInfo()) return;

    apiService.createNormalOrderDeliveryInfo({
      order_id: orderId,
      recipient_name: deliveryInfo.recipient_name,
      email: deliveryInfo.email,
      phone: deliveryInfo.phone,
      province: deliveryInfo.province,
      address: deliveryInfo.address
    }).then(() => {
      setStep('payment');
    });
  };

  // Polling for payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if ((qrCodeUrl || isExternalPayment) && paymentStatus === 'PENDING') {
      const checkStatus = async () => {
        try {
          const res = await apiService.checkPaymentStatus(orderId);
          console.log("Checking payment status for order", orderId, "Status:", res.data?.status);
          if (res.success && res.data.status === 'SUCCESS') {
            setPaymentStatus('SUCCESS');
            setIsPolling(false);
            clearInterval(interval);

            // Empty cart after successful payment
            try {
              // We need cartId or userId. Since checkout props doesn't have it directly, 
              // we might need to rely on backend doing it or accessible via user context.
              // Assuming apiService.getUser() works.
              const user = apiService.getUser();
              if (user && user.id) {
                await apiService.emptyCart(user.id);
              }
            } catch (err) {
              console.error("Failed to empty cart", err);
            }

            // Wait a bit to show success message then complete
            setTimeout(() => {
              onOrderComplete({
                orderId,
                // We can fetch more details if needed
                status: 'SUCCESS'
              });
            }, 2000);
          }
        } catch (error) {
          console.error("Error checking payment status", error);
        }
      };

      setIsPolling(true);
      interval = setInterval(checkStatus, 3000); // Check every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrCodeUrl, isExternalPayment, paymentStatus, orderId, onOrderComplete]);


  const handleCompleteOrder = async () => {
    try {
      const res = await apiService.createPaymentTransaction({
        order_id: orderId,
        orderDescription: "Payment for order " + orderId,
        orderType: "billpayment",
        bankCode: "", // Optional/Default
        method: paymentMethod, // Pass selected payment method
      });

      if (res.type === 'REDIRECT' && res.paymentUrl) {
        // Open payment in new window/tab
        window.open(res.paymentUrl, '_blank', 'width=800,height=800,scrollbars=yes,resizable=yes');
        setIsExternalPayment(true);
        setIsPolling(true);
        setPaymentStatus('PENDING');
      } else if (res.type === 'QR_IMAGE' && res.paymentUrl) {
        setQrCodeUrl(res.paymentUrl);
        setIsPolling(true); // Ensure polling is on
      } else if (res.paymentUrl) {
        // Fallback catch-all
        window.location.href = res.paymentUrl;
      }
    } catch (error) {
      console.error("Payment creation failed", error);
      setErrors(["Failed to initiate payment"]);
    }
  };

  if (step === 'payment') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setStep('delivery')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Delivery
          </Button>
          <h2 className="text-2xl font-bold">Payment</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-sm">{item.title} (x{item.quantity})</span>
                    <span className="text-sm">{formatVNDShort(item.current_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal (excl. VAT):</span>
                  <span>{formatVNDShort(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (10%):</span>
                  <span>{formatVNDShort(vat)}</span>
                </div>
                {deliveryFees.originalFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <div className="text-right">
                      {deliveryFees.discount > 0 ? (
                        <>
                          <span className="line-through text-gray-400 mr-2">{formatVNDShort(deliveryFees.originalFee)}</span>
                          <span>{formatVNDShort(deliveryFees.fee)}</span>
                        </>
                      ) : (
                        <span>{formatVNDShort(deliveryFees.fee)}</span>
                      )}
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>{formatVNDShort(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 ${paymentMethod === 'VIETQR' ? 'border-green-600 bg-green-50' : ''}`}
                  onClick={() => setPaymentMethod('VIETQR')}
                >
                  <QrCode className="h-8 w-8 text-green-600" />
                  <span className="font-semibold">VietQR</span>
                </div>
                {/* PayPal Payment Option */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 ${paymentMethod === 'PAYPAL' ? 'border-blue-600 bg-blue-50' : ''}`}
                  onClick={() => setPaymentMethod('PAYPAL')}
                >
                  <CreditCard className="h-8 w-8 text-blue-600" />
                  <span className="font-semibold">PayPal</span>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  {paymentMethod === 'VIETQR'
                    ? "Scan the QR code with your banking app to pay instantly."
                    : "You will be redirected to complete the transaction."}
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleCompleteOrder}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!!qrCodeUrl} // Disable if QR is already generated
              >
                {qrCodeUrl ? 'Scan QR Code below' : 'Proceed to Pay'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* QR Code Dialog / Modal */}
        <Dialog open={!!qrCodeUrl || isExternalPayment} onOpenChange={(open) => {
          if (!open && paymentStatus !== 'SUCCESS') {
            setQrCodeUrl(null);
            setIsExternalPayment(false);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">{paymentStatus === 'SUCCESS' ? 'Payment Successful!' : 'Scan QR to Pay'}</DialogTitle>
              <DialogDescription className="text-center">
                {paymentStatus === 'SUCCESS'
                  ? 'Your order has been confirmed.'
                  : `Order #${orderId} - ${formatVNDShort(total)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              {paymentStatus === 'SUCCESS' ? (
                <CheckCircle className="h-24 w-24 text-green-500 animate-bounce" />
              ) : (
                <>
                  {qrCodeUrl && (
                    <div className="border-4 border-white shadow-lg rounded-lg overflow-hidden">
                      <img src={qrCodeUrl} alt="VietQR" className="w-64 h-64 object-contain" />
                    </div>
                  )}
                  {isExternalPayment && (
                    <div className="text-center space-y-2">
                      <p className="font-semibold text-lg">Payment Window Opened</p>
                      <p className="text-sm text-gray-500">Please complete the payment in the new window.</p>
                      <Button variant="outline" size="sm" onClick={() => window.open(qrCodeUrl || '#', '_blank')}>
                        Re-open Payment Window
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-500 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Waiting for payment...</span>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
        <h2 className="text-2xl font-bold">Delivery Information</h2>
      </div>

      {errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-red-700">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipient_name">Recipient Name *</Label>
                <Input
                  id="recipient_name"
                  value={deliveryInfo.recipient_name}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, recipient_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={deliveryInfo.phone}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={deliveryInfo.email}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="province">Province/City *</Label>
              <select
                id="province"
                value={deliveryInfo.province}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, province: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loadingProvinces}
              >
                <option value="">
                  {loadingProvinces ? 'Loading...' : '-- Select Province/City --'}
                </option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.codename}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                value={deliveryInfo.address}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-sm">{item.title} (x{item.quantity})</span>
                  <span className="text-sm">{formatVNDShort(item.current_price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal (excl. VAT):</span>
                <span>{formatVNDShort(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (10%):</span>
                <span>{formatVNDShort(vat)}</span>
              </div>
              {deliveryFees.originalFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <div className="text-right">
                    {deliveryFees.discount > 0 ? (
                      <>
                        <span className="line-through text-gray-400 mr-2">{formatVNDShort(deliveryFees.originalFee)}</span>
                        <span>{formatVNDShort(deliveryFees.fee)}</span>
                      </>
                    ) : (
                      <span>{formatVNDShort(deliveryFees.fee)}</span>
                    )}
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{formatVNDShort(total)}</span>
              </div>
            </div>

            <Button
              onClick={handleProceedToPayment}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Truck className="h-4 w-4 mr-2" />
              Proceed to Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
