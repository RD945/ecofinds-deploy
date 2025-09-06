import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { CheckCircle, CreditCard, Calendar, Clock, Loader2, MapPin } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LocationPicker, DeliveryLocation } from "./LocationPicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "./ui/sonner";

interface PaymentConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => Promise<void>;
  orderTotal: number;
  itemCount: number;
}

export interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  deliveryLocation: DeliveryLocation | null;
}

export const PaymentConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  orderTotal, 
  itemCount 
}: PaymentConfirmationProps) => {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    deliveryLocation: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentTab, setCurrentTab] = useState("location");

  const handleLocationSelect = (location: DeliveryLocation) => {
    setPaymentData(prev => ({ ...prev, deliveryLocation: location }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that location is selected
    if (!paymentData.deliveryLocation) {
      toast.error('Delivery location required', {
        description: 'Please select a delivery location before proceeding to payment.'
      });
      setCurrentTab("location");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      await onConfirm(paymentData);
      setIsSuccess(true);
      
      // Auto close after success
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setCurrentTab("location");
        setPaymentData({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: '',
          deliveryLocation: null
        });
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceedToPayment = paymentData.deliveryLocation !== null;

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Your order has been confirmed and you'll receive an email confirmation shortly.
            </p>
            <div className="space-y-2 mb-4">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Order Total: ₹{orderTotal.toFixed(2)}
              </Badge>
              {paymentData.deliveryLocation && (
                <div className="bg-blue-50 p-3 rounded-md text-left">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Delivery Address:</p>
                      <p className="text-xs text-blue-700">{paymentData.deliveryLocation.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Complete Your Order</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Order Summary */}
          <div className="mb-6 bg-accent/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Order Summary
            </h3>
            <div className="flex justify-between items-center mb-2">
              <span>Items ({itemCount})</span>
              <span>₹{orderTotal.toFixed(2)}</span>
            </div>
            <Separator className="mb-2" />
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total</span>
              <span>₹{orderTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Main Content - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Side - Delivery Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Delivery Location</h3>
              </div>
              
              <LocationPicker 
                onLocationSelect={handleLocationSelect}
                initialLocation={paymentData.deliveryLocation}
              />
            </div>

            {/* Right Side - Payment Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Payment Details</h3>
              </div>
              
              {paymentData.deliveryLocation && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Delivery Address Confirmed</p>
                      <p className="text-xs text-green-700">{paymentData.deliveryLocation.address}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={paymentData.cardholderName}
                onChange={(e) => setPaymentData({...paymentData, cardholderName: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => {
                  // Simple formatting for demo
                  const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                  if (value.length <= 19) {
                    setPaymentData({...paymentData, cardNumber: value});
                  }
                }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    setPaymentData({...paymentData, expiryDate: value});
                  }}
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 3) {
                      setPaymentData({...paymentData, cvv: value});
                    }
                  }}
                  maxLength={3}
                  required
                />
              </div>
            </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isProcessing || !paymentData.deliveryLocation}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Complete Payment ₹{orderTotal.toFixed(2)}
                    </>
                  )}
                </Button>

                <div className="mt-4 text-xs text-muted-foreground text-center">
                  <p className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    This is a demo payment system. No real charges will be made.
                  </p>
                </div>
              </form>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full"
                  disabled={isProcessing}
                >
                  Cancel Order
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
