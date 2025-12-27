import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ShoppingCart, Loader2, Heart } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFade } from "./ImageWithFade";
import { useAuth } from "@/contexts/AuthContext";

interface ProductCardProps {
  id: number;
  title: string;
  price: string;
  category: string;
  image: { id: number, url?: string | null } | string | null;
  sellerId?: number;
  showActions?: boolean;
  isLoading?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddToCart?: () => void;
  onCardClick?: (id: number) => void;
}

export const ProductCard = ({
  id,
  title,
  price,
  category,
  image,
  sellerId,
  showActions,
  isLoading,
  onEdit,
  onDelete,
  onAddToCart,
  onCardClick,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking on a button inside the card
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onCardClick) {
      onCardClick(id);
    } else {
      navigate(`/products/${id}`);
    }
  }

  const imageUrl = typeof image === 'string'
    ? image
    : image?.url
      ? image.url
      : image?.id
        ? `http://localhost:5000/api/images/${image.id}`
        : 'https://placehold.co/600x400';

  const isOutOfStock = parseFloat(price) === 0;

  return (
    <Card
      className="card-premium group cursor-pointer overflow-hidden relative animate-slide-up"
      onClick={handleCardClick}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-primary/20 rounded-full animate-ping" />
            </div>
            <span className="text-sm font-semibold text-foreground">Loading...</span>
          </div>
        </div>
      )}

      {/* Image Container with Hover Effect */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent/30 to-accent/10">
        <ImageWithFade
          src={imageUrl}
          alt={title}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
          wrapperClassName="aspect-[4/3] p-4"
        />

        {/* Hover Overlay with Quick Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products/${id}`);
            }}
            className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-foreground font-semibold rounded-full px-6"
          >
            Quick View
          </Button>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="badge-eco capitalize backdrop-blur-md bg-white/90 text-primary border-0 shadow-sm">
            {category}
          </Badge>
        </div>

        {/* Wishlist Button (Future Enhancement) */}
        <button
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
        </button>
      </div>

      {/* Card Content */}
      <CardContent className="p-5 space-y-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors duration-200 h-12">
            {title}
          </h3>
        </div>

        <div className="flex items-end justify-between pt-2">
          <div className="space-y-0.5">
            {isOutOfStock ? (
              <>
                <p className="text-xs text-muted-foreground font-medium">Status</p>
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 px-3 py-1.5 text-sm font-semibold shadow-md">
                  Out of Stock
                </Badge>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground font-medium">Price</p>
                <p className="font-bold text-2xl text-primary">₹{price}</p>
              </>
            )}
          </div>

          {showActions ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                className="rounded-full"
              >
                Delete
              </Button>
            </div>
          ) : !isOutOfStock && user?.id !== sellerId ? (
            <Button
              size="sm"
              onClick={onAddToCart}
              className="bg-primary text-white rounded-full px-5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:scale-105 transition-all duration-200"
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Add
            </Button>
          ) : user?.id === sellerId ? (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 px-3 py-1.5 text-xs font-semibold shadow-md">
              Your Product
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};