import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => {
  return (
    <Card className="card-eco group overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-10 w-2/5" />
        </div>
      </CardContent>
    </Card>
  );
};
