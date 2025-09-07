import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Navigation } from "@/components/Navigation";
import { CategoryFilter } from "@/components/CategoryFilter";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import heroImage from "@/assets/hero-image.jpg";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ServerCrash, RefreshCw, LayoutDashboard } from "lucide-react";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { toast } from "@/hooks/use-toast";


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
  seller: { id: number; username: string };
}

const categories = ["kitchen", "accessories", "electronics", "personal care", "home", "clothing"];

export const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartCount, setCartCount] = useState(0); 
  const [serverError, setServerError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProductId, setLoadingProductId] = useState<number | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    setIsSearching(true);
    setServerError(false);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(data);
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      if (error.code === 'ERR_NETWORK') {
        setServerError(true);
      }
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

   useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        try {
          const { data } = await api.get('/cart');
          setCartCount(data.reduce((sum: number, item: any) => sum + item.quantity, 0));
        } catch (error) {
          console.error("Failed to fetch cart:", error);
        }
      } else {
        setCartCount(0);
      }
    };
    fetchCart();
  }, [user]);

  const handleAddToCart = async (productId: number) => {
    if (!user) {
        navigate('/auth');
        return;
    }
    
    setAddingToCartId(productId);
    
    try {
        // Add to cart first (fast operation)
        await api.post('/cart', { productId, quantity: 1});
        
        // Update cart count immediately
        const { data } = await api.get('/cart');
        setCartCount(data.reduce((sum: number, item: any) => sum + item.quantity, 0));
        
        // Find product details for notification
        const product = products.find(p => p.id === productId);
        
        // Show success toast notification
        toast({
          title: "Added to Cart! 🛒",
          description: `${product?.title || 'Product'} has been added to your cart`,
          duration: 3000,
        });
        
        // Send email notification in background (don't wait for it)
        if (product && user.email) {
            // Fire and forget - don't await this
            api.post('/auth/send-cart-notification', {
                email: user.email,
                productName: product.title,
                productPrice: product.price,
            }).catch(emailError => {
                console.error("Failed to send cart notification email:", emailError);
                // Email failure doesn't affect user experience
            });
        }
        
    } catch (error) {
        console.error("Failed to add to cart", error);
        
        // Show error toast
        toast({
          title: "Failed to Add to Cart",
          description: "There was an error adding the item to your cart. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
        
        if ((error as any).response?.status === 401) {
            navigate('/auth');
        }
    } finally {
        setAddingToCartId(null);
    }
  };

  const handleCardClick = async (productId: number) => {
    setLoadingProductId(productId);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate(`/products/${productId}`);
    } finally {
      setLoadingProductId(null);
    }
  };

  const filteredProducts = products;

  return (
    <div className="min-h-screen bg-background">
      {/* Loading Overlay for search/filter operations */}
      {isSearching && !isLoading && <LoadingOverlay message="Searching products..." />}
      
      <Navigation
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
      />

      {/* Hero Section */}
      {!searchQuery && !serverError && (
        <section className="relative bg-gradient-to-b from-accent/30 to-background">
          <div className="container mx-auto px-4 py-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Discover
                  <span className="text-primary"> Sustainable</span>
                  <br />
                  Products for a Better Tomorrow
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Join our community of eco-conscious shoppers and sellers. 
                  Find unique, sustainable products that make a difference.
                </p>
                <div className="flex gap-4">
                  {!user ? (
                    <>
                      <Button 
                        size="lg"
                        onClick={() => navigate('/auth?mode=signup')}
                      >
                        Start Shopping
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/add-product')}
                      >
                        Sell Your Items
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="lg"
                        onClick={() => navigate('/add-product')}
                      >
                        Sell Your Items
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                      >
                        <LayoutDashboard className="w-5 h-5 mr-2" />
                        My Dashboard
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="order-first lg:order-last">
                <img
                  src={heroImage}
                  alt="Eco-friendly products"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {!serverError && (
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}

      {/* Products Grid / Error States */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-6">
            {/* Loading Header */}
            <div className="text-center py-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
                <div className="w-8 h-8 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-8 h-8 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Loading Products</h2>
              <p className="text-muted-foreground">Fetching the latest sustainable products for you...</p>
            </div>
            
            {/* Loading Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : serverError ? (
          <div className="text-center py-12">
            <div className="w-32 h-32 bg-destructive/10 rounded-full mx-auto mb-4 flex items-center justify-center">
              <ServerCrash className="w-16 h-16 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-destructive mb-2">
              Server is Offline
            </h3>
            <p className="text-muted-foreground mb-4">
              We couldn't connect to the server. Please make sure the backend is running.
            </p>
            <Button onClick={fetchProducts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-32 h-32 bg-accent rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">🌱</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No products found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or browse different categories
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                category={product.category.name}
                image={product.images && product.images.length > 0 ? product.images[0] : null}
                sellerId={product.seller.id}
                isLoading={loadingProductId === product.id || addingToCartId === product.id}
                onAddToCart={() => handleAddToCart(product.id)}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};