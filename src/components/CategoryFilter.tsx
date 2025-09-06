import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) => {
  return (
    <div className="bg-card border-b border-border p-4">
      <div className="container mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => onCategoryChange("all")}
            className={selectedCategory === "all" ? "btn-eco" : "btn-eco-outline"}
            size="sm"
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => onCategoryChange(category)}
              className={selectedCategory === category ? "btn-eco" : "btn-eco-outline"}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};