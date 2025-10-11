import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingCart, User, Search, Menu, X, UserCircle, Package, LogOut } from 'lucide-react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { CartDialog } from "./CartCheckout";
import { AuthModals } from "./auth/AuthModel";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../App";
import { toast } from "sonner";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { NotificationSystem } from "./NotificationSystem";
import { AnimatedLogoGIF } from "./AnimatedLogoGIF";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Shared Header Component for all pages
export const SharedHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { cartCount } = useCart();
  const { user, logout, isAuthenticated, loading } = useAuth();

  // Handle window resize for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      console.log('Screen width:', window.innerWidth, 'Mobile:', mobile);
      setIsMobile(mobile);
      if (!mobile) {
        setIsMenuOpen(false); // Close mobile menu on desktop
      }
    };
    
    // Check on mount with delay to ensure DOM is ready
    setTimeout(checkMobile, 100);

    const handleResize = () => {
      checkMobile();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuthClick = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`${API}/products/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{marginLeft: '20px', marginRight: '20px'}}>
      <div className="mx-auto px-5 py-2 rounded-b-2xl border border-white/20 shadow-lg" style={{
        background: 'rgba(255, 255, 255, 0)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
      }}>
        <div className="flex items-center justify-between">
          {/* Animated Logo - Toggle between 3D and GIF */}
          <a href="/" className="flex items-center">
            <AnimatedLogoGIF className="mr-2" gifPath="/animated-logo.mp4" />
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent drop-shadow-lg">
              Mithaas Delights
            </span>
          </a>

          {/* Desktop Navigation - Force hide on mobile */}
          <nav className="desktop-nav" style={{display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '1.5rem'}}>
            <a href="/" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Home</a>
            <a href="/#products" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Products</a>
            <a href="/bulk-orders" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Bulk Orders</a>
            <a href="/gallery" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Gallery</a>
            <a href="/#about" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>About</a>
            <a href="/#contact" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Contact</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1">
              <ThemeSwitcher />
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1">
              <NotificationSystem isAuthenticated={isAuthenticated} />
            </div>
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="search-button" className="bg-white/90 backdrop-blur-sm rounded-full hover:bg-white">
                  <Search className="w-5 h-5 text-gray-700" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Search Products</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search for sweets, namkeen, or snacks..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                    data-testid="search-input"
                  />
                  {searchLoading && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </div>
                  )}
                  {!searchLoading && searchResults.length > 0 && (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-4 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => {
                            setSearchOpen(false);
                            window.location.href = `/#products`;
                          }}
                        >
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{product.name}</h4>
                            <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {product.variants && product.variants.length > 0 && (
                                <span className="text-sm font-semibold text-orange-600">
                                  From ₹{Math.min(...product.variants.map(v => v.price))}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No products found for "{searchQuery}"
                    </div>
                  )}
                  {searchQuery.length > 0 && searchQuery.length < 2 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      Type at least 2 characters to search
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Authentication Section */}
            {loading ? (
              <Button variant="ghost" size="sm" disabled className="bg-white/90 backdrop-blur-sm rounded-full">
                <User className="w-5 h-5 text-gray-700" />
              </Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="user-menu-trigger" className="bg-white/90 backdrop-blur-sm rounded-full hover:bg-white">
                    <UserCircle className="w-5 h-5 text-gray-700" />
                    <span className="ml-2 hidden sm:inline text-gray-700">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/orders'}>
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                      <User className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAuthClick('login')}
                  data-testid="login-button"
                  className="bg-white/90 backdrop-blur-sm rounded-full hover:bg-white text-gray-700"
                >
                  Login
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAuthClick('register')}
                  className="hidden sm:inline-flex bg-white/90 backdrop-blur-sm rounded-full hover:bg-white text-gray-700 border-gray-300"
                  data-testid="signup-button"
                >
                  Sign Up
                </Button>
              </div>
            )}

            <CartDialog>
              <Button variant="ghost" size="sm" className="relative bg-white/90 backdrop-blur-sm rounded-full hover:bg-white" data-testid="cart-button">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-500 text-xs p-0 flex items-center justify-center">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </CartDialog>
            
            {/* Mobile Menu Button - Force show on mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="mobile-menu-btn bg-white/90 backdrop-blur-sm rounded-full hover:bg-white"
              style={{display: isMobile ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center'}}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="mt-4 pb-4 border-t border-white/20 pt-4 bg-black/20 rounded-lg" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)'}}>
            <div className="flex flex-col space-y-3 px-4">
              <a href="/" className="text-black hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Home</a>
              <a href="/#products" className="text-black/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Products</a>
              <a href="/bulk-orders" className="text-black hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Bulk Orders</a>
              <a href="/gallery" className="text-black hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Gallery</a>
              <a href="/#about" className="text-black hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>About</a>
              <a href="/#contact" className="text-black hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Contact</a>
              {!isAuthenticated && (
                <div className="flex flex-col space-y-2 pt-2 border-t border-white/20">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleAuthClick('login')}
                    className="justify-start bg-white/90 backdrop-blur-sm rounded-full hover:bg-white text-gray-700"
                  >
                    Login
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAuthClick('register')}
                    className="justify-start bg-white/90 backdrop-blur-sm rounded-full hover:bg-white text-gray-700 border-gray-300"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModals 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </header>
  );
};

export default SharedHeader;