import { useState, useEffect } from "react";
import { ArrowLeft, User, Package, ShoppingBag, ShieldCheck, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { LocationPicker, DeliveryLocation } from "@/components/LocationPicker";

interface ProductImage {
    id: number;
    url: string | null;
}

interface Product {
  id: number;
  title: string;
  price: string;
  category: { name: string };
  images: ProductImage[];
  seller_id: number;
}

interface OrderItem {
    id: number;
    product: Product;
    quantity: number;
    price: string;
}

interface Order {
    id: number;
    order_date: string;
    total_amount: string;
    orderItems: OrderItem[];
}

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("listings");
  const [userListings, setUserListings] = useState<Product[]>([]);
  const [userPurchases, setUserPurchases] = useState<Order[]>([]);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<(DeliveryLocation & { id: number })[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleAddAddress = (location: DeliveryLocation) => {
    const addressWithId = { ...location, id: Date.now() };
    setSavedAddresses(prev => [...prev, addressWithId]);
    setShowAddressForm(false);
    toast.success('Address saved successfully!', {
      description: 'Your new delivery address has been added.'
    });
  };

  const handleRemoveAddress = (addressId: number) => {
    setSavedAddresses(prev => prev.filter(a => a.id !== addressId));
    toast.success('Address removed successfully!');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        try {
            const { data: products } = await api.get<Product[]>('/products');
            setUserListings(products.filter((p: Product) => p.seller_id === user.id));

            const { data: orders } = await api.get('/orders/history');
            setUserPurchases(orders);

            // You would typically fetch this as part of the initial user object
            // For now, a separate fetch is fine for demonstration.
            const { data: userData } = await api.get('/auth/me');
            setIsTwoFactorEnabled(userData.two_factor_enabled);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        }
      }
    };
    fetchDashboardData();
  }, [user]);


  const handleToggleTwoFactor = async (enabled: boolean) => {
      try {
          await api.post('/auth/2fa/status', { enabled });
          setIsTwoFactorEnabled(enabled);
          // You might want to show a success toast here
      } catch (error) {
          console.error("Failed to update 2FA status:", error);
          // Show an error toast
      }
  };

  const handleSendSuggestions = async () => {
    try {
      // Sample suggestions based on available categories
      const sampleSuggestions = [
        { title: "Bamboo Toothbrush Set", price: "299", category: "personal care" },
        { title: "Organic Cotton Tote Bag", price: "399", category: "accessories" },
        { title: "Solar Phone Charger", price: "1299", category: "electronics" },
        { title: "Reusable Food Wraps", price: "499", category: "kitchen" },
      ];

      await api.post('/auth/send-suggestions', {
        email: user?.email,
        suggestions: sampleSuggestions,
      });

      toast.success('Personalized product suggestions sent to your email!', {
        description: 'Check your inbox for curated product recommendations.'
      });
    } catch (error) {
      console.error("Failed to send suggestions:", error);
      toast.error('Failed to send suggestions', {
        description: 'Please try again or check your connection.'
      });
    }
  };

  const handleEditProduct = (productId: number) => {
    navigate(`/edit-product/${productId}`);
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
        await api.delete(`/products/${productId}`);
        setUserListings(userListings.filter(p => p.id !== productId));
    } catch (error) {
        console.error("Failed to delete product", error);
    }
  };

  const stats = {
    totalListings: userListings.length,
    totalPurchases: userPurchases.length,
    totalEarnings: userListings.reduce((sum, item) => {
      return sum + parseFloat(item.price);
    }, 0),
  };

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">My Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user?.username || "User"}!
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Profile & Navigation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="card-eco">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{user?.username || "User"}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {user?.email || "user@example.com"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-eco-outline"
                  onClick={() => console.log("Edit profile")}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="space-y-4">
              <Card className="card-eco">
                <CardContent className="p-4 flex items-center gap-3">
                  <Package className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Listings</p>
                    <p className="text-xl font-bold">{stats.totalListings}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-eco">
                <CardContent className="p-4 flex items-center gap-3">
                  <ShoppingBag className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Purchases</p>
                    <p className="text-xl font-bold">{stats.totalPurchases}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-eco">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-sm text-muted-foreground">Potential Earnings</p>
                    <p className="text-xl font-bold text-success">
                      ₹{stats.totalEarnings.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="listings" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  My Listings
                </TabsTrigger>
                <TabsTrigger value="purchases" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  My Purchases
                </TabsTrigger>
                <TabsTrigger value="addresses" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Addresses
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* My Listings Tab */}
              <TabsContent value="listings" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold">My Listings</h2>
                    <p className="text-muted-foreground">
                      Manage your products and track their performance
                    </p>
                  </div>
                  <Button
                    className="btn-eco"
                    onClick={() => navigate("/add-product")}
                  >
                    Add New Product
                  </Button>
                </div>

                {userListings.length === 0 ? (
                  <Card className="card-eco">
                    <CardContent className="p-12 text-center">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start selling your eco-friendly items today!
                      </p>
                      <Button
                        className="btn-eco"
                        onClick={() => navigate("/add-product")}
                      >
                        Create Your First Listing
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userListings.map((product) => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        title={product.title}
                        price={product.price}
                        category={product.category.name}
                        image={product.images && product.images.length > 0 ? product.images[0] : null}
                        showActions={true}
                        onEdit={() => handleEditProduct(product.id)}
                        onDelete={() => handleDeleteProduct(product.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* My Purchases Tab */}
              <TabsContent value="purchases" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">My Purchases</h2>
                  <p className="text-muted-foreground">
                    View your purchase history and track orders
                  </p>
                </div>

                {userPurchases.length === 0 ? (
                  <Card className="card-eco">
                    <CardContent className="p-12 text-center">
                      <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Discover amazing eco-friendly products from our community!
                      </p>
                      <Button
                        className="btn-eco"
                        onClick={() => navigate("/")}
                      >
                        Start Shopping
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {userPurchases.map((purchase) => (
                      <Card key={purchase.id} className="card-eco">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-accent rounded-lg flex-shrink-0"></div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{purchase.orderItems.map(i => i.product.title).join(', ')}</h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {purchase.orderItems.length} items
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Purchased on {new Date(purchase.order_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                ₹{purchase.total_amount}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Delivery Addresses Tab */}
              <TabsContent value="addresses" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold">Delivery Addresses</h2>
                    <p className="text-muted-foreground">
                      Manage your saved delivery locations for faster checkout
                    </p>
                  </div>
                  <Button
                    className="btn-eco"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Add New Address
                  </Button>
                </div>

                {showAddressForm ? (
                  <Card className="card-eco">
                    <CardHeader>
                      <CardTitle>Add New Delivery Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LocationPicker 
                        onLocationSelect={handleAddAddress}
                      />
                      <div className="flex gap-3 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddressForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {savedAddresses.length === 0 ? (
                      <Card className="card-eco">
                        <CardContent className="p-12 text-center">
                          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No saved addresses</h3>
                          <p className="text-muted-foreground mb-4">
                            Save your delivery addresses for quick and easy checkout
                          </p>
                          <Button
                            className="btn-eco"
                            onClick={() => setShowAddressForm(true)}
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Add Your First Address
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedAddresses.map((address) => (
                          <Card key={address.id} className="card-eco">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <h4 className="font-medium">Delivery Address</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {address.address}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {address.city}, {address.state} {address.postalCode}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAddress(address.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                 <div>
                    <h2 className="text-2xl font-semibold">Security & Preferences</h2>
                    <p className="text-muted-foreground">
                        Manage your account's security settings and communication preferences
                    </p>
                </div>
                 <Card className="card-eco">
                    <CardHeader>
                        <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Protect your account with an extra layer of security. When enabled, you will be required to enter a one-time code sent to your email during login.
                        </p>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="2fa-switch"
                                checked={isTwoFactorEnabled}
                                onCheckedChange={handleToggleTwoFactor}
                            />
                            <Label htmlFor="2fa-switch">
                                {isTwoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-eco">
                    <CardHeader>
                        <CardTitle>Email Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Get personalized product recommendations based on your interests and recent activity.
                        </p>
                        <Button onClick={handleSendSuggestions} className="btn-eco">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Product Suggestions
                        </Button>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};