import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ShoppingCart, UserCircle, Search, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
}

export const Navigation = ({ searchQuery, onSearchChange, cartCount }: NavigationProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="group"
            >
              <span className="text-2xl font-bold text-primary transition-colors duration-200 group-hover:text-primary/80">
                EcoFinds
              </span>
            </a>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              <Input
                type="search"
                placeholder="Search for sustainable products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 pr-4 h-12 rounded-full border-2 border-border bg-background/50 backdrop-blur-sm
                         focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20
                         transition-all duration-200 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/dashboard')}
                  className="relative h-11 w-11 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/cart')}
                  className="relative h-11 w-11 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  title="Shopping Cart"
                >
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-emerald-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse-slow">
                        {cartCount}
                      </span>
                    )}
                  </div>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-11 w-11 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    >
                      <UserCircle className="w-6 h-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuLabel className="font-semibold">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate('/dashboard')}
                      className="cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth?mode=login')}
                  className="hidden sm:inline-flex rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/auth?mode=signup')}
                  className="bg-primary text-white rounded-full px-6 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-200"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search - Show on small screens */}
        <div className="md:hidden pb-4">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 pr-4 h-10 rounded-full border-2 border-border bg-background/50 backdrop-blur-sm
                       focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20
                       transition-all duration-200 text-sm placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};