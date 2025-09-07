import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductDetailSkeleton } from "@/components/ProductDetailSkeleton";
import { cn } from "@/lib/utils";
import { ImageWithFade } from "@/components/ImageWithFade";
import { toast } from "@/hooks/use-toast";

interface ProductImage {
    id: number;
    url: string | null;
}

interface Product {
  id: number;
  title: string;
  description: string;
  price: string;
  images: ProductImage[];
  category: { name: string };
  seller: { id: number; username: string };
  quantity: number;
  condition: string;
  brand: string | null;
  model: string | null;
  year_of_manufacture: number | null;
  material: string | null;
  color: string | null;
  dimension_l: string | null;
  dimension_w: string | null;
  dimension_h: string | null;
  is_original: boolean;
  has_manual: boolean;
  working_condition: string | null;
}

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        if (data.images && data.images.length > 0) {
            const firstImage = data.images[0];
            setActiveImage(firstImage.url || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/images/${firstImage.id}`);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        // Optional: navigate to a 404 page if product not found
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
    }
  }, [product]);

  const handleAddToCart = async () => {
    if (!user) {
        navigate('/auth');
        return;
    }
    
    setAddingToCart(true);
    
    try {
      await api.post('/cart', { productId: product!.id, quantity: 1 });
      
      // Show success toast notification
      toast({
        title: "Added to Cart! 🛒",
        description: `${product!.title} has been added to your cart`,
        duration: 3000,
      });
      
      // Send email notification in background (don't wait for it)
      if (user.email) {
          api.post('/auth/send-cart-notification', {
              email: user.email,
              productName: product!.title,
              productPrice: product!.price,
          }).catch(emailError => {
              console.error("Failed to send cart notification email:", emailError);
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
        setAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="container mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to products
          </Button>
        </div>
      </header>

      <main>
        {isLoading ? (
          <ProductDetailSkeleton />
        ) : !product ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">Product not found</h2>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Product content from before */}
                <div className="space-y-4">
                    <ImageWithFade
                        src={activeImage || 'https://placehold.co/600x400'}
                        alt={product.title}
                        className="w-full h-full object-contain transition-opacity duration-300"
                        wrapperClassName="aspect-square bg-accent rounded-lg p-4"
                    />
                    {product.images && product.images.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {product.images.map((image) => {
                                const imageUrl = image.url || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/images/${image.id}`;
                                return (
                                <button
                                    key={image.id}
                                    className={cn(
                                        "aspect-square bg-accent rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                        activeImage === imageUrl && "ring-2 ring-primary"
                                    )}
                                    onMouseOver={() => setActiveImage(imageUrl)}
                                    onClick={() => setActiveImage(imageUrl)}
                                >
                                    <ImageWithFade src={imageUrl} alt={`${product.title} thumbnail`} className="w-full h-full object-contain"/>
                                </button>
                            )})}
                        </div>
                    )}
                </div>


                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-muted-foreground capitalize mb-2">
                        {product.category.name} / Sold by {product.seller.username}
                        </p>
                        <h1 className="text-4xl font-bold">{product.title}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{product.condition}</Badge>
                            <Badge variant={product.quantity > 0 ? "default" : "destructive"}>
                                {product.quantity > 0 ? `${product.quantity} in stock` : "Out of Stock"}
                            </Badge>
                        </div>
                    </div>

                    <p className="text-3xl font-bold text-primary">₹{product.price}</p>

                    <p className="text-lg text-muted-foreground">{product.description}</p>
                    
                    {product.working_condition && (
                        <Card className="bg-accent/50 border-l-4 border-primary">
                            <CardContent className="p-4">
                                <p className="font-semibold mb-1">Working Condition</p>
                                <p className="text-sm text-muted-foreground">{product.working_condition}</p>
                            </CardContent>
                        </Card>
                    )}

                    { user?.id !== product.seller.id && (
                        <Button 
                            size="lg" 
                            className="w-full" 
                            onClick={handleAddToCart} 
                            disabled={product.quantity === 0 || addingToCart}
                        >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            {addingToCart ? "Adding..." : product.quantity > 0 ? "Add to Cart" : "Out of Stock"}
                        </Button>
                    )}

                    <Card>
                        <CardContent className="p-6 grid grid-cols-2 gap-4 text-sm">
                            {product.brand && <DetailItem label="Brand" value={product.brand} />}
                            {product.model && <DetailItem label="Model" value={product.model} />}
                            {product.year_of_manufacture && <DetailItem label="Year" value={String(product.year_of_manufacture)} />}
                            {product.material && <DetailItem label="Material" value={product.material} />}
                            {product.color && <DetailItem label="Color" value={product.color} />}
                            {(product.dimension_l && product.dimension_w && product.dimension_h) && 
                                <DetailItem label="Dimensions" value={`${product.dimension_l} x ${product.dimension_w} x ${product.dimension_h} cm`} />
                            }
                            <DetailItem label="Original" value={product.is_original ? "Yes" : "No"} />
                            <DetailItem label="Manual Included" value={product.has_manual ? "Yes" : "No"} />
                        </CardContent>
                    </Card>

                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};


const DetailItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
    </div>
);
