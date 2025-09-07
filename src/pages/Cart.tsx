import { useState, useEffect } from "react";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { PaymentConfirmation, PaymentData } from "@/components/PaymentConfirmation";
import { ImageWithFade } from "@/components/ImageWithFade";


interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    price: string;
    images: Array<{
      id: number;
      url?: string | null;
      imageData?: Buffer;
      mimetype?: string;
    }>;
  };
}

export const Cart = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        const fetchCartItems = async () => {
            if (user) {
                try {
                    const { data } = await api.get('/cart');
                    console.log("Cart data received:", data);
                    setCartItems(data);
                } catch (error) {
                    console.error("Failed to fetch cart items", error);
                }
            }
        };
        fetchCartItems();
    }, [user]);

    const handleRemoveItem = async (productId: number) => {
        try {
            await api.delete(`/cart/${productId}`);
            setCartItems(cartItems.filter(item => item.product.id !== productId));
        } catch (error) {
            console.error("Failed to remove item from cart", error);
        }
    };

    const handleCheckout = () => {
        setShowPayment(true);
    };

    const handlePaymentConfirm = async (paymentData: PaymentData) => {
        try {
            // Process the actual checkout with delivery location
            await api.post('/orders/checkout', {
                deliveryLocation: paymentData.deliveryLocation
            });
            
            // Send payment confirmation email
            await api.post('/auth/send-payment-confirmation', {
                email: user?.email,
                orderTotal: total,
                itemCount: cartItems.length,
                paymentData: {
                    cardNumber: paymentData.cardNumber,
                    cardholderName: paymentData.cardholderName,
                },
                deliveryLocation: paymentData.deliveryLocation
            });
            
            setShowPayment(false);
            navigate('/dashboard');
        } catch (error) {
            console.error("Checkout failed", error);
            throw error;
        }
    };

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0);
  const tax = subtotal * 0.1; // Example 10% tax
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Shopping Cart</h1>
          <span className="text-muted-foreground">
            ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          // Empty Cart State
          <div className="max-w-md mx-auto text-center">
            <Card className="card-eco">
              <CardContent className="p-12">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Discover amazing eco-friendly products from our community
                </p>
                <Button
                  className="btn-eco"
                  onClick={() => navigate("/")}
                >
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Cart with Items
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Cart Items</h2>
              
              {cartItems.map((item) => (
                <Card key={item.id} className="card-eco">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-accent rounded-lg flex-shrink-0 overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <ImageWithFade
                            src={
                              item.product.images[0].url || 
                              `${item.product.images[0].url || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/images/${item.product.images[0].id}`}`
                            } 
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                            wrapperClassName="w-full h-full"
                            onError={(e) => {
                              console.error("Image failed to load:", e);
                              console.log("Image data:", item.product.images[0]);
                              console.log("Constructed URL:", item.product.images[0].url || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/images/${item.product.images[0].id}`);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {item.product.title}
                        </h3>
                        <p className="text-muted-foreground text-sm capitalize mb-1">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-primary font-semibold">
                          ${item.product.price} each
                        </p>
                      </div>

                      {/* Quantity Controls & Remove */}
                      <div className="flex flex-col items-end gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {/* Quantity decrement not implemented */}}
                            className="h-8 w-8"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {/* Quantity increment not implemented */}}
                            className="h-8 w-8"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-lg">
                            ₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="card-eco sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes (10%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    className="btn-eco w-full"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>

                  {/* Trust Indicators */}
                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-success">✓</span>
                      Secure checkout
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-success">✓</span>
                      30-day return policy
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-success">✓</span>
                      Eco-friendly packaging
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <PaymentConfirmation
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onConfirm={handlePaymentConfirm}
        orderTotal={total}
        itemCount={cartItems.length}
      />
    </div>
  );
};