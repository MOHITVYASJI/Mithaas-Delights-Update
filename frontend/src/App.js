import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, User, Search, Menu, X, Star, ChevronRight, MapPin, Phone, Mail, Clock, Heart, LogOut, UserCircle, Package } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { AdminPanel } from "./components/AdminPanel";
import { CartDialog } from "./components/CartCheckout";
import { AuthModals } from "./components/auth/AuthModel";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { TermsAndConditions, PrivacyPolicy } from "./pages/Policies";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { BulkOrderPage } from "./pages/BulkOrderPage";
import { MediaGalleryPage } from "./pages/MediaGalleryPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { OrderTrackingPage } from "./pages/OrderTrackingPage";
import { loadCartFromLocalStorage, saveCartToLocalStorage, clearCartFromLocalStorage } from "./utils/cartStorage";
import { BannerCarousel } from "./components/BannerCarousel";
import { NotificationSystem } from "./components/NotificationSystem";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { UnifiedChatBot } from "./components/UnifiedChatBot";
import { AdvertisementSection } from "./components/AdvertisementSection";
import { MarqueeAnnouncements } from "./components/MarqueeAnnouncements";
import { HeaderLogo } from "./components/Logo";
import { TrustBadges } from "./components/TrustBadges";
import { SecurePaymentBadges } from "./components/SecurePaymentBadges";
import { CertificationShowcase } from "./components/CertificationShowcase";
import { SmoothScroll } from "./components/SmoothScroll";
import { AnimatedHeroSection } from "./components/AnimatedHeroSection";
import { AnimatedProductCard } from "./components/AnimatedProductCard";
import { AnimatedButton } from "./components/AnimatedButton";
import { AnimatedLogo3D } from "./components/AnimatedLogo3D";
import { AnimatedLogoGIF } from "./components/AnimatedLogoGIF";
import { HeroGIFBackground } from "./components/HeroGIFBackground";
import { AdvancedHeader } from "./components/AdvancedHeader";
import { motion } from "framer-motion";
import { useScrollAnimation, useStaggerAnimation } from "./hooks/useScrollAnimation";
import "./App.css";
import { suppressResizeObserverError } from "./utils/errorHandler";
import { LOGOS, PRODUCT_IMAGES, CERTIFICATES } from "./config/imageConfig";
import { AdminDataProvider } from "./contexts/AdminDataContext";

// Suppress ResizeObserver errors on app load
suppressResizeObserverError();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for cart management with proper variant support
const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = loadCartFromLocalStorage();
    if (savedCart && savedCart.length > 0) {
      setCartItems(savedCart);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length >= 0) {
      saveCartToLocalStorage(cartItems);
    }
  }, [cartItems]);

  // Generate unique cart item key: product_id + variant_weight
  const getCartItemKey = (item) => `${item.id}-${item.weight || 'default'}`;

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const productKey = getCartItemKey(product);
      const existingItem = prevItems.find(item => getCartItemKey(item) === productKey);
      
      if (existingItem) {
        // Item with same product ID and variant exists, update quantity
        const updatedItems = prevItems.map(item =>
          getCartItemKey(item) === productKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        return updatedItems;
      } else {
        // New item (or same product with different variant)
        return [...prevItems, { ...product, quantity }];
      }
    });
    
    const variantText = product.weight ? ` (${product.weight})` : '';
    toast.success(`${product.name}${variantText} added to cart!`);
  };

  const removeFromCart = (productKey) => {
    setCartItems(prevItems => prevItems.filter(item => getCartItemKey(item) !== productKey));
  };

  const updateQuantity = (productKey, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productKey);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        getCartItemKey(item) === productKey ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    clearCartFromLocalStorage();
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  useEffect(() => {
    setCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Header Component with Authentication
const Header = () => {
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
            {/* 
              GIF Logo लगाने के लिए:
              1. /app/frontend/public/ में अपनी GIF रखें
              2. नीचे AnimatedLogo3D की जगह AnimatedLogoGIF लिखें
              3. gifPath में अपनी GIF का नाम डालें
              
              उदाहरण: <AnimatedLogoGIF className="mr-2" gifPath="/my-logo.gif" />
            */}
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
              <a href="#home" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Home</a>
              <a href="#products" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Products</a>
              <a href="/bulk-orders" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Bulk Orders</a>
              <a href="/gallery" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Gallery</a>
              <a href="#about" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>About</a>
              <a href="#contact" className="text-white/90 hover:text-orange-300 transition-colors px-4 py-2 rounded-full" style={{backdropFilter: 'blur(60%)', WebkitBackdropFilter: 'blur(60%)', background: 'rgba(255, 255, 255, 0.1)'}}>Contact</a>
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

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/" replace />;
  }

  return children;
};

// Enhanced Product Card Component with Offers Support and Sold Out functionality
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [activeOffers, setActiveOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.wishlist) {
      setIsInWishlist(user.wishlist.includes(product.id));
    }
  }, [user, product.id]);
  useEffect(() => {
    fetchActiveOffers();
  }, [product.id]);

  const fetchActiveOffers = async () => {
    try {
      const response = await axios.get(`${API}/offers/active?product_id=${product.id}`);
      setActiveOffers(response.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setActiveOffers([]);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (isInWishlist) {
        await axios.delete(`${API}/wishlist/remove/${product.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Removed from wishlist');
        setIsInWishlist(false);
      } else {
        await axios.post(`${API}/wishlist/add/${product.id}`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Added to wishlist');
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  // Get the minimum price from variants
  const getMinPrice = () => {
    if (product.variants && product.variants.length > 0) {
      return Math.min(...product.variants.map(v => v.price));
    }
    return product.price || 0;
  };
  // Calculate offer discount
  const calculateBestOffer = () => {
    if (activeOffers.length === 0) return null;
    
    const minPrice = getMinPrice();
    let bestDiscount = 0;
    let bestOffer = null;

    activeOffers.forEach(offer => {
      let discount = 0;
      if (offer.offer_type === 'percentage') {
        discount = (minPrice * offer.discount_percentage) / 100;
        if (offer.max_discount && discount > offer.max_discount) {
          discount = offer.max_discount;
        }
      } else if (offer.offer_type === 'flat_discount') {
        discount = Math.min(offer.discount_amount, minPrice);
      }
      
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    });

    return bestOffer ? { offer: bestOffer, discount: bestDiscount } : null;
  };

  const bestOffer = calculateBestOffer();
  const finalPrice = bestOffer ? getMinPrice() - bestOffer.discount : getMinPrice();

  const handleViewDetails = () => {
    window.location.href = `/product/${product.id}`;
  };
  const getBadgeText = (offer) => {
    if (offer.badge_text) return offer.badge_text;
    
    switch (offer.offer_type) {
      case 'percentage':
        return `${offer.discount_percentage}% OFF`;
      case 'flat_discount':
        return `₹${offer.discount_amount} OFF`;
      case 'buy_x_get_y':
        return `Buy ${offer.buy_quantity} Get ${offer.get_quantity}`;
      default:
        return 'OFFER';
    }
  };

  // Check if product is sold out or not available
  const isSoldOut = product.is_sold_out || !product.is_available || 
    (product.variants && product.variants.every(v => !v.is_available || v.stock === 0));
  return (
    <Card className={`group overflow-hidden transition-all duration-300 bg-white border border-amber-100 relative card-float ${
      isSoldOut ? 'opacity-90' : 'hover:border-orange-200'
    }`} data-testid="product-card">
      <div 
        className="relative overflow-hidden cursor-pointer"
        onClick={handleViewDetails}
      >
        <img 
          src={product.image_url} 
          alt={product.name}
          className={`w-full h-40 sm:h-44 md:h-48 object-cover transition-transform duration-300 ${
            isSoldOut ? 'filter grayscale' : 'group-hover:scale-105'
          }`}
        />
        
        {/* Offer Badges */}
        {activeOffers.length > 0 && !isSoldOut && (
          <div className="absolute top-2 left-2 z-10">
            <Badge 
              className="mb-1 shadow-lg font-bold text-xs px-2 py-1 offer-badge animate-pulse"
              style={{ 
                backgroundColor: activeOffers[0].badge_color || '#f97316',
                color: '#ffffff'
              }}
            >
              {getBadgeText(activeOffers[0])}
            </Badge>
            {activeOffers.length > 1 && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 shadow-lg animate-bounce">
                +{activeOffers.length - 1} more
              </Badge>
            )}
          </div>
        )}

        {/* Discount Badges */}
        <div className="absolute top-2 right-2 space-y-1">
          {product.discount_percentage && !isSoldOut && (
            <Badge className="bg-red-500 text-white shadow-lg font-bold animate-pulse">
              {product.discount_percentage}% OFF
            </Badge>
          )}
          {product.is_featured && !isSoldOut && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
              ⭐ Featured
            </Badge>
          )}
        </div>
        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20">
            <div className="text-center">
              <Badge className="bg-red-600 text-white text-lg px-6 py-3 shadow-xl animate-pulse font-bold">
                SOLD OUT
              </Badge>
              <p className="text-white text-sm mt-2 font-medium">Out of Stock</p>
            </div>
          </div>
        )}
        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          className={`absolute bottom-2 right-2 bg-white/90 hover:bg-white rounded-full w-8 h-8 p-0 shadow-lg transition-all duration-200 hover:scale-105 ${
            isSoldOut ? 'opacity-50' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist();
          }}
          data-testid="wishlist-toggle-button"
        >
          <Heart className={`w-4 h-4 transition-all duration-200 ${
            loading ? 'animate-pulse text-gray-400' : 
            isInWishlist ? 'fill-red-500 text-red-500 animate-pulse' : 'text-gray-600 hover:text-red-500'
          }`} />
        </Button>
      </div>
      <CardContent className="p-3 sm:p-4">
        <h3 
          className={`font-semibold text-base sm:text-lg mb-2 cursor-pointer transition-colors line-clamp-1 ${
            isSoldOut ? 'text-gray-500' : 'text-gray-800 hover:text-orange-600'
          }`} 
          data-testid="product-name"
          onClick={handleViewDetails}
        >
          {product.name}
        </h3>
        <p className={`text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed ${
          isSoldOut ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            {bestOffer && !isSoldOut ? (
              <>
                <span className="text-lg sm:text-xl font-bold text-orange-600" data-testid="product-price">
                  ₹{finalPrice.toFixed(0)}
                </span>
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  ₹{getMinPrice()}
                </span>
              </>
            ) : (
              <span className={`text-lg sm:text-xl font-bold ${
                isSoldOut ? 'text-gray-400' : 'text-orange-600'
              }`} data-testid="product-price">
                From ₹{getMinPrice()}
              </span>
            )}
          </div>
          {product.variants && product.variants.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {product.variants.length} options
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating || 4.5) 
                      ? (isSoldOut ? 'fill-gray-300 text-gray-300' : 'fill-amber-400 text-amber-400') 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
            <span className={`text-xs ml-1 ${
              isSoldOut ? 'text-gray-400' : 'text-gray-600'
            }`}>
              ({product.review_count || 0})
            </span>
          </div>
          
          <Button 
            size="sm" 
            onClick={handleViewDetails}
            disabled={isSoldOut}
            className={`text-xs sm:text-sm px-2 sm:px-3 py-1 transition-all duration-200 shadow-lg ${
              isSoldOut 
                ? 'bg-gray-400 hover:bg-gray-400 text-white cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:scale-105 btn-premium'
            }`}
            data-testid="view-details-button"
          >
            {isSoldOut ? 'Out of Stock' : 'View Details'}
          </Button>
        </div>
        
        {bestOffer && !isSoldOut && (
          <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full text-center font-medium animate-pulse">
            💰 Save ₹{bestOffer.discount.toFixed(0)} with this offer!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Hero Section Component - Using AnimatedHeroSection with 3D background and advanced animations
const HeroSection = () => {
  return (
    <AnimatedHeroSection 
      onCTAClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
    />
  );
};

// Products Section
const ProductsSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([{ value: 'all', label: 'All Products' }]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleViewDetails = (product) => {
    window.location.href = `/product/${product.id}`;
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories?active_only=true`);
      const fetchedCategories = response.data.map(cat => ({
        value: cat.name,
        label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1).replace(/_/g, ' ')
      }));
      setCategories([{ value: 'all', label: 'All Products' }, ...fetchedCategories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories
      setCategories([
        { value: 'all', label: 'All Products' },
        { value: 'mithai', label: 'Mithai' },
        { value: 'namkeen', label: 'Namkeen' },
        { value: 'laddu', label: 'Laddu' }
      ]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all' 
        ? `${API}/products`
        : `${API}/products?category=${selectedCategory}`;
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-20 bg-white" id="products">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <Badge className="bg-orange-100 text-orange-700 mb-3 md:mb-4 text-xs md:text-sm">Our Products</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 md:mb-4">
            Premium Collection of
            <span className="block bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Sweets & Snacks
            </span>
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-4">
            Discover our handcrafted selection of traditional Indian sweets and savory snacks, 
            made with authentic recipes and the finest ingredients.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 md:mb-12">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className={`text-xs md:text-sm ${selectedCategory === category.value 
                ? "bg-orange-500 hover:bg-orange-600" 
                : "border-orange-200 text-orange-700 hover:bg-orange-50"
              }`}
              data-testid={`category-filter-${category.value}`}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 md:h-48 bg-gray-200"></div>
                <CardContent className="p-3 md:p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" data-testid="products-grid">
            {products.map((product, index) => (
              <AnimatedProductCard 
                key={product.id} 
                product={product} 
                delay={index * 0.1}
                onAddToCart={addToCart}
                onClick={handleViewDetails}
              />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-500 text-sm md:text-base">No products found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

// About Section with Animations
const AboutSection = () => {
  const sectionRef = useScrollAnimation({ delay: 0.2 });
  const statsRef = useStaggerAnimation({ stagger: 0.15 });

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50" id="about">
      <div className="container mx-auto px-4">
        <motion.div 
          ref={sectionRef}
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Badge className="bg-orange-100 text-orange-700 mb-4">About Us</Badge>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Crafting Sweet Memories Since
              <span className="block bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Three Generations
              </span>
            </h2>
            <p className="text-gray-600 mb-6">
              At Mithaas Delights, we believe in preserving the authentic taste of traditional Indian sweets 
              while embracing modern quality standards. Our master chefs use time-honored recipes passed down 
              through generations, combined with the finest ingredients sourced from across India.
            </p>
            <p className="text-gray-600 mb-8">
              From the rich, creamy texture of our Kaju Katli to the perfectly spiced Masala Mixture, 
              every product is crafted with love, care, and attention to detail. We're not just making sweets; 
              we're creating moments of joy and celebration.
            </p>
            
            <div ref={statsRef} className="grid grid-cols-2 gap-6">
              <motion.div 
                className="text-center p-4 bg-white rounded-lg border border-orange-100"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(249,115,22,0.2)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-2xl font-bold text-orange-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Pure Ingredients</div>
              </motion.div>
              <motion.div 
                className="text-center p-4 bg-white rounded-lg border border-orange-100"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(249,115,22,0.2)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-2xl font-bold text-orange-600 mb-2">0</div>
                <div className="text-sm text-gray-600">Artificial Colors</div>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="space-y-4">
              <motion.img 
                src={PRODUCT_IMAGES.traditional}
                alt="Traditional sweet making"
                className="rounded-lg shadow-md"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <motion.img 
                src={PRODUCT_IMAGES.premium}
                alt="Premium ingredients"
                className="rounded-lg shadow-md"
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </div>
            <div className="space-y-4 mt-8">
              <motion.img 
                src={PRODUCT_IMAGES.handSweets}
                alt="Handcrafted sweets"
                className="rounded-lg shadow-md"
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ type: "spring", stiffness:300 }}
              />
              <motion.img 
                src={PRODUCT_IMAGES.foodSafety}
                alt="Quality testing"
                className="rounded-lg shadow-md"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/contact`, contactData);
      toast.success('Message sent successfully! We will get back to you soon.');
      setContactData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-12 md:py-20 bg-white" id="contact">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <Badge className="bg-orange-100 text-orange-700 mb-3 md:mb-4 text-xs md:text-sm">Get In Touch</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 md:mb-4">
            Contact
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent"> Us</span>
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-4">
            Have questions about our products or need help with your order? 
            We're here to help you every step of the way.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Visit Our Store</h3>
                <p className="text-gray-600">64, Kaveri Nagar, Indore, Madhya Pradesh 452006, India</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Call Us</h3>
                <p className="text-gray-600">+91 8989549544</p>
                <p className="text-gray-600">+91 9754681201</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Email Us</h3>
                <p className="text-gray-600">mithaasdelightsofficial@gmail.com</p>
                <p className="text-gray-600">support@mithaasdelights.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Store Hours</h3>
                <p className="text-gray-600">Mon - Sat: 9:00 AM - 9:00 PM</p>
                <p className="text-gray-600">Sunday: 10:00 AM - 8:00 PM</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    placeholder="Your Name" 
                    value={contactData.name}
                    onChange={(e) => setContactData({...contactData, name: e.target.value})}
                    required
                    data-testid="contact-name-input" 
                  />
                  <Input 
                    placeholder="Your Email" 
                    type="email" 
                    value={contactData.email}
                    onChange={(e) => setContactData({...contactData, email: e.target.value})}
                    required
                    data-testid="contact-email-input" 
                  />
                </div>
                <Input 
                  placeholder="Subject" 
                  value={contactData.subject}
                  onChange={(e) => setContactData({...contactData, subject: e.target.value})}
                  required
                  data-testid="contact-subject-input" 
                />
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="4"
                  placeholder="Your Message"
                  value={contactData.message}
                  onChange={(e) => setContactData({...contactData, message: e.target.value})}
                  required
                  data-testid="contact-message-input"
                ></textarea>
                <Button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  data-testid="send-message-button"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          <div>
            <div className="mb-4">
              <img 
                src={LOGOS.main} 
                alt="Mithaas Delights Logo" 
                className="w-16 h-16 object-contain mb-2"
              />
              <span className=" text-white mb-4 text-xl font-bold block">Mithaas Delights</span>
            </div>
            <p className="text-white mb-4">
              Premium Indian sweets and snacks crafted with love and tradition.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-white">
              <li><a href="#home" className=" text-white hover:text-orange-400 transition-colors">Home</a></li>
              <li><a href="#products" className=" text-white hover:text-orange-400 transition-colors">Products</a></li>
              <li><a href="#about" className=" text-white hover:text-orange-400 transition-colors">About</a></li>
              <li><a href="#contact" className=" text-white hover:text-orange-400 transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 underline-offset-0 text-white">Legal</h4>
            <ul className="space-y-2 text-white">
              <li><a href="/terms" className=" text-white hover:text-orange-400 transition-colors">Terms & Conditions</a></li>
              <li><a href="/privacy" className=" text-white hover:text-orange-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/track-order" className=" text-white , hover:text-orange-400 transition-colors">Track Order</a></li>
              <li><a href="#contact" className=" text-white , hover:text-orange-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Connect</h4>
            <ul className="space-y-2 text-white">
              <li><a href="https://www.instagram.com/mithaasdelightsofficial?igsh=aW85Z2h6bTEwazJv" className=" text-white hover:text-orange-400 transition-colors">Instagram</a></li>
              <li><a href="https://wa.me/918989549544" target="_blank" rel="noopener noreferrer" className=" text-white hover:text-orange-400 transition-colors">WhatsApp</a></li>
              <li><a href="#" className=" text-white hover:text-orange-400 transition-colors">Facebook</a></li>
              <li><a href="#" className=" text-white hover:text-orange-400 transition-colors">Twitter</a></li>
            </ul>
          </div>
        </div>

        {/* Certificates Section - Simple and Clean */}
        <div className="border-t border-white/20 pt-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <img 
              src={CERTIFICATES.fssai} 
              alt="FSSAI Certificate - License 21425850011554" 
              className="h-32 md:h-40 w-auto object-contain rounded-lg shadow-lg hover:scale-105 transition-transform cursor-pointer"
            />
            <img 
              src={CERTIFICATES.msme} 
              alt="MSME Certificate - UDYAM-MP-23-0235652" 
              className="h-32 md:h-40 w-auto object-contain rounded-lg shadow-lg hover:scale-105 transition-transform cursor-pointer"
            />
          </div>
        </div>
        
        <div className="border-t border-white pt-8 text-center text-white">
          <p className="text-white">&copy; 2025 Mithaas Delights. All rights reserved. Made with ❤️ in India 🇮🇳</p>
          <p className="text-xs mt-2 text-white">Certified by Food Safety and Standards Authority of India</p>
        </div>
      </div>
    </footer>
  );
};

// User Profile Page
const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'wishlist') {
      fetchWishlist();
    }
  }, [activeTab]);
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders/user/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setWishlistProducts(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/auth/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/wishlist/remove/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/orders/${orderId}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success(response.data.message);
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.detail || 'Failed to cancel order');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <AdvancedHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'profile' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                      data-testid="profile-tab"
                    >
                      Profile Information
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'orders' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                      data-testid="orders-tab"
                    >
                      My Orders
                    </button>
                    <button
                      onClick={() => setActiveTab('wishlist')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'wishlist' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                      data-testid="wishlist-tab"
                    >
                      Wishlist
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'profile' && (
                <Card data-testid="profile-content">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <Input 
                          value={profileData.name} 
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          disabled={!isEditingProfile}
                          data-testid="profile-name-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input value={user?.email || ''} readOnly className="bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone</label>
                        <Input 
                          value={profileData.phone} 
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          disabled={!isEditingProfile}
                          placeholder="Add phone number"
                          data-testid="profile-phone-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Role</label>
                        <Input value={user?.role || ''} readOnly className="bg-gray-50" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {!isEditingProfile ? (
                        <Button 
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => setIsEditingProfile(true)}
                          data-testid="edit-profile-button"
                        >
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button 
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={handleProfileUpdate}
                            data-testid="save-profile-button"
                          >
                            Save Changes
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setIsEditingProfile(false);
                              setProfileData({
                                name: user?.name || '',
                                phone: user?.phone || ''
                              });
                            }}
                            data-testid="cancel-edit-button"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'orders' && (
                <Card data-testid="orders-content">
                  <CardHeader>
                    <CardTitle>My Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No orders found</p>
                        <Button 
                          onClick={() => window.location.href = '/#products'}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          Start Shopping
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Order ID</p>
                                <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded" data-testid="order-id-display">
                                  {order.id}
                                </code>
                                <p className="text-sm text-gray-600 mt-2">
                                  Placed on {new Date(order.created_at).toLocaleString()}
                                </p>
                              </div>
                              <Badge className={`${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {order.status.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              <div className="border-t pt-3">
                                <p className="text-sm text-gray-600 mb-2 font-medium">Order Items:</p>
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm py-1">
                                    <span className="text-black">{item.variant_weight} × {item.quantity}</span>
                                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Payment Method:</span>
                                <span className="text-sm font-medium">{order.payment_method.toUpperCase()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Payment Status:</span>
                                <Badge variant="outline" className={`text-xs ${
                                  order.payment_status === 'completed' ? 'border-green-500 text-green-700' : 
                                  order.payment_status === 'failed' ? 'border-red-500 text-red-700' :
                                  order.payment_status === 'refunded' ? 'border-blue-500 text-blue-700' :
                                  'border-orange-500 text-orange-700'
                                }`}>
                                  {order.payment_status}
                                </Badge>
                              </div>
                              {order.discount_amount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Discount Applied:</span>
                                  <span className="text-sm text-green-600 font-medium">-₹{order.discount_amount}</span>
                                </div>
                              )}
                            </div>

                            <div className="border-t pt-3 mb-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Total Amount:</span>
                                <span className="text-xl font-bold text-orange-600">₹{order.final_amount || order.total_amount}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {order.whatsapp_link && (
                                <a
                                  href={order.whatsapp_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Contact via WhatsApp
                                </a>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="text-red-600 hover:text-red-700 border-red-300"
                                  data-testid="cancel-order-button"
                                >
                                  Cancel Order
                                </Button>
                              )}
                            </div>

                            <div className="border-t pt-3 mt-3">
                              <p className="text-xs text-gray-500">
                                Delivery Address: {order.delivery_address}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'wishlist' && (
                <Card data-testid="wishlist-content">
                  <CardHeader>
                    <CardTitle>My Wishlist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      </div>
                    ) : wishlistProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Your wishlist is empty</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlistProducts.map((product) => (
                          <Card key={product.id} className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveFromWishlist(product.id)}
                              data-testid="remove-wishlist-button"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <div className="relative overflow-hidden">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-orange-600">
                                  From ₹{product.variants && product.variants.length > 0 
                                    ? Math.min(...product.variants.map(v => v.price))
                                    : product.price || 0}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => window.location.href = `/product/${product.id}`}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Home Component
const Home = () => {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // Initialize sample data and admin user
    const initializeData = async () => {
      try {
        await axios.post(`${API}/init-sample-data`);
        await axios.post(`${API}/init-admin`);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    
    initializeData();
  }, []);

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-white">
        <AdvancedHeader />
        <MarqueeAnnouncements />
        <HeroSection />
        <div className="container mx-auto px-4 py-8">
          <BannerCarousel />
        </div>
        <ProductsSection />
        <AdvertisementSection />
        <AboutSection />
        <ContactSection />
        <Footer />
        <UnifiedChatBot />
      </div>
    </SmoothScroll>
  );
};

// Order Tracking Page Component
const OrderTracking = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const trackOrder = async () => {
    if (!orderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      toast.error('Order not found');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <AdvancedHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Track Your Order</h1>
            <p className="text-gray-600">Enter your order ID to track the status of your delivery</p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter Order ID (e.g., ORD-123456)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="flex-1"
                  data-testid="order-id-input"
                />
                <Button 
                  onClick={trackOrder}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="track-order-button"
                >
                  {loading ? 'Tracking...' : 'Track Order'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {order && (
            <Card data-testid="order-details">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-semibold">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className="bg-orange-100 text-orange-700 capitalize">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold">₹{order.total_amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-semibold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Delivery Address</p>
                    <p className="font-semibold">{order.delivery_address}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Items Ordered</p>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>Product ID: {item.product_id} (Qty: {item.quantity})</span>
                          <span>₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Protected Admin Panel Component  
const ProtectedAdminPanel = () => {
  return (
    <ProtectedRoute adminOnly={true}>
      <AdminPanel />
    </ProtectedRoute>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AdminDataProvider>
          <div className="App">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:productId" element={<ProductDetailPage Header={Header} Footer={Footer} />} />
                <Route path="/track-order" element={<OrderTracking />} />
                <Route path="/track-order/:orderId" element={<OrderTrackingPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="/bulk-orders" element={<BulkOrderPage />} />
                <Route path="/gallery" element={<MediaGalleryPage />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/admin" element={<ProtectedAdminPanel />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
          </div>
        </AdminDataProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;