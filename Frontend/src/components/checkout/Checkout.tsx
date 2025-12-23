
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Truck } from 'lucide-react';
import { apiService } from '@/services/api'; // Adjust the import path as necessary

interface CartItem {
  id: string;
  title: string;
  category: string;
  current_price: number;
  quantity: number;
  weight: number;
  rush_eligible?: boolean;
}

interface DeliveryInfo {
  recipient_name: string;
  email: string;
  phone: string;
  province: string;
  address: string;
}

interface RushOrderInfo {
  delivery_time: string;
  delivery_instructions: string;
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
  const [enableRushOrder, setEnableRushOrder] = useState(false);
  const [rushOrderInfo, setRushOrderInfo] = useState<RushOrderInfo>({
    delivery_time: '',
    delivery_instructions: ''
  });
  const [selectedRushItems, setSelectedRushItems] = useState<string[]>([]);
  const [deliveryFees, setDeliveryFees] = useState({
    regular: 0,
    rush: 0
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Check if current address supports rush delivery
  const isRushDeliveryAvailable = () => {
    return true; // For simplicity, assume rush delivery is available for all addresses
  };

  // Get rush eligible items
  const rushEligibleItems = cartItems.filter(item => item.rush_eligible);

  // Calculate delivery fees
  const calculateDeliveryFees = () => {
    const isHanoiOrHCM = deliveryInfo.province.toLowerCase().includes('HN') ||
      deliveryInfo.province.toLowerCase().includes('hồ chí minh');

    let regularItems = cartItems;
    let rushItems: CartItem[] = [];

    if (enableRushOrder && isRushDeliveryAvailable()) {
      rushItems = cartItems.filter(item => selectedRushItems.includes(item.id));
      regularItems = cartItems.filter(item => !selectedRushItems.includes(item.id));
    }

    const calculateFeeForItems = (items: CartItem[], isRush = false) => {
      if (items.length === 0) return 0;

      const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      const heaviestWeight = Math.max(...items.map(item => item.weight));

      let baseFee = 0;
      let additionalFee = 0;

      if (isHanoiOrHCM) {
        baseFee = 22000; // First 3kg
        if (heaviestWeight > 3) {
          additionalFee = Math.ceil((heaviestWeight - 3) / 0.5) * 2500;
        }
      } else {
        baseFee = 30000; // First 0.5kg
        if (heaviestWeight > 0.5) {
          additionalFee = Math.ceil((heaviestWeight - 0.5) / 0.5) * 2500;
        }
      }

      let totalFee = baseFee + additionalFee;

      // Rush order additional fee
      if (isRush) {
        totalFee += items.length * 10000; // 10,000 VND per rush item
      }

      // Free shipping for orders over 100,000 VND (excluding rush items)
      if (!isRush) {
        const itemsTotal = items.reduce((sum, item) => sum + (item.current_price * item.quantity), 0);
        if (itemsTotal > 100000) {
          totalFee = Math.max(0, totalFee - 25000);
        }
      }

      return totalFee;
    };

    const regularFee = calculateFeeForItems(regularItems, false);
    const rushFee = calculateFeeForItems(rushItems, true);

    setDeliveryFees({ regular: regularFee, rush: rushFee });
  };

  useEffect(() => {
    if (deliveryInfo.province) {
      calculateDeliveryFees();
    }
  }, [deliveryInfo, enableRushOrder, selectedRushItems]);

  const validateDeliveryInfo = () => {
    const newErrors: string[] = [];

    if (!deliveryInfo.recipient_name.trim()) newErrors.push('Recipient name is required');
    if (!deliveryInfo.email.trim()) newErrors.push('Email is required');
    if (!deliveryInfo.phone.trim()) newErrors.push('Phone number is required');
    if (!deliveryInfo.province.trim()) newErrors.push('Province is required');
    if (!deliveryInfo.address.trim()) newErrors.push('Address is required');

    if (enableRushOrder) {
      if (!rushOrderInfo.delivery_time) {
        newErrors.push('Rush delivery time is required');
      }
      if (!rushOrderInfo.delivery_instructions.trim()) {
        newErrors.push('Rush delivery instructions are required');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleRushItemToggle = (itemId: string) => {
    setSelectedRushItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.current_price * item.quantity), 0);
  const vat = subtotal * 0.1;
  const total = subtotal + vat + deliveryFees.regular + deliveryFees.rush;

  const handleProceedToPayment = () => {
    let deliveryInfoPromise: Promise<any>;

    if (enableRushOrder) {
      deliveryInfoPromise = apiService.createRushedOrderDeliveryInfo({
        order_id: orderId,
        recipient_name: deliveryInfo.recipient_name,
        email: deliveryInfo.email,
        phone: deliveryInfo.phone,
        province: deliveryInfo.province,
        address: deliveryInfo.address,
        instruction: rushOrderInfo.delivery_instructions || null,
        delivery_time: rushOrderInfo.delivery_time ? new Date(rushOrderInfo.delivery_time) : null
      });
    } else {
      deliveryInfoPromise = apiService.createNormalOrderDeliveryInfo({
        order_id: orderId,
        recipient_name: deliveryInfo.recipient_name,
        email: deliveryInfo.email,
        phone: deliveryInfo.phone,
        province: deliveryInfo.province,
        address: deliveryInfo.address
      });
    }

    deliveryInfoPromise.then(() => {


      setStep('payment');
    });
    return;
  };


  const handleCompleteOrder = () => {
    const redirectUrl = apiService.createPaymentTransaction({
      order_id: orderId,
      orderDescription: "Payment for order " + orderId,
      orderType: "billpayment",
      bankCode: ""
    });

    redirectUrl.then((url) => {
      window.location.href = url.paymentUrl;
    });
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
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{item.title} (x{item.quantity})</span>
                      {selectedRushItems.includes(item.id) && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Rush
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm">${(item.current_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal (excl. VAT):</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (10%):</span>
                  <span>${vat.toFixed(2)}</span>
                </div>
                {deliveryFees.regular > 0 && (
                  <div className="flex justify-between">
                    <span>Regular Delivery:</span>
                    <span>${(deliveryFees.regular / 1000).toFixed(2)}</span>
                  </div>
                )}
                {deliveryFees.rush > 0 && (
                  <div className="flex justify-between">
                    <span>Rush Delivery:</span>
                    <span>${(deliveryFees.rush / 1000).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Payment will be processed through VNPay. You will be redirected to complete the transaction.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleCompleteOrder}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Complete Order
              </Button>
            </CardContent>
          </Card>
        </div>
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
        <div className="space-y-6">
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
                <Input
                  id="province"
                  value={deliveryInfo.province}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, province: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea
                  id="address"
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              {/* Rush Order Checkbox in Delivery Information */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rush-order"
                    checked={enableRushOrder}
                    onCheckedChange={(checked) => setEnableRushOrder(checked === true)}
                  />
                  <Label htmlFor="rush-order" className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Rush Order Delivery (2 Hours - Additional 10,000 VND per item)</span>
                  </Label>
                </div>

                {enableRushOrder && (
                  <div className="space-y-4 ml-6">
                    {!isRushDeliveryAvailable() && (
                      <Alert>
                        <AlertDescription>
                          Rush delivery is only available for addresses within Hanoi.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isRushDeliveryAvailable() && (
                      <>
                        <div>
                          <Label htmlFor="delivery_time">Delivery Time *</Label>
                          <Input
                            id="delivery_time"
                            type="datetime-local"
                            value={rushOrderInfo.delivery_time}
                            onChange={(e) => setRushOrderInfo(prev => ({ ...prev, delivery_time: e.target.value }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="delivery_instructions">Delivery Instructions *</Label>
                          <Textarea
                            id="delivery_instructions"
                            value={rushOrderInfo.delivery_instructions}
                            onChange={(e) => setRushOrderInfo(prev => ({ ...prev, delivery_instructions: e.target.value }))}
                            placeholder="Special instructions for rush delivery..."
                          />
                        </div>

                        {rushEligibleItems.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Select items for rush delivery:</Label>
                            <div className="mt-2 space-y-2">
                              {rushEligibleItems.map(item => (
                                <div key={item.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={selectedRushItems.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked === true) {
                                        handleRushItemToggle(item.id);
                                      } else {
                                        setSelectedRushItems(prev => prev.filter(id => id !== item.id));
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{item.title} (${item.current_price})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{item.title} (x{item.quantity})</span>
                    {selectedRushItems.includes(item.id) && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Rush
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm">${(item.current_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal (excl. VAT):</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (10%):</span>
                <span>${vat.toFixed(2)}</span>
              </div>
              {deliveryFees.regular > 0 && (
                <div className="flex justify-between">
                  <span>Regular Delivery:</span>
                  <span>{deliveryFees.regular.toLocaleString()} VND</span>
                </div>
              )}
              {deliveryFees.rush > 0 && (
                <div className="flex justify-between">
                  <span>Rush Delivery:</span>
                  <span>{deliveryFees.rush.toLocaleString()} VND</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
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
