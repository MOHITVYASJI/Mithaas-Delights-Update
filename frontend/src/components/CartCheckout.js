import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, User, MapPin, Phone, X, Truck, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useCart } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { RazorpayCheckout } from './RazorpayCheckout';
import { CheckoutSecurityBadge } from './SecurePaymentBadges';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Cart Dialog Component
export const CartDialog = ({ children }) => {
  const { cartItems, cartCount, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (cartCount === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-4">Add some delicious items to get started!</p>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => setIsOpen(false)}
              data-testid="continue-shopping-empty"
            >
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-base sm:text-lg">Your Cart ({cartCount} items)</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 self-end sm:self-auto"
              data-testid="clear-cart-button"
            >
              Clear All
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {cartItems.map((item) => (
            <CartItem 
              key={`${item.id}-${item.weight}`} 
              item={item} 
              updateQuantity={updateQuantity} 
              removeFromCart={removeFromCart} 
            />
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span className="text-orange-600" data-testid="cart-total">₹{getTotalPrice().toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsOpen(false)}
              data-testid="continue-shopping-button"
            >
              Continue Shopping
            </Button>
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-orange-500 hover:bg-orange-600" data-testid="proceed-checkout-button">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
                <CheckoutForm 
                  cartItems={cartItems} 
                  totalAmount={getTotalPrice()} 
                  onSuccess={() => {
                    setIsCheckoutOpen(false);
                    setIsOpen(false);
                    clearCart();
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Cart Item Component - Shows individual product variant
const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  // Unique key for variant: product_id + weight
  const itemKey = `${item.id}-${item.weight}`;
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow" data-testid="cart-item">
      <img 
        src={item.image_url} 
        alt={item.name}
        className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-lg"
      />
      
      <div className="flex-1">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-1" data-testid="cart-item-name">{item.name}</h3>
        <div className="flex items-center flex-wrap gap-2 mt-1">
          <Badge variant="outline" className="text-xs">{item.weight}</Badge>
          {item.variant?.sku && (
            <span className="text-xs text-gray-500">SKU: {item.variant.sku}</span>
          )}
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-base sm:text-lg font-bold text-orange-600" data-testid="cart-item-price">₹{item.price}</span>
          {item.original_price && item.original_price > item.price && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">₹{item.original_price}</span>
          )}
        </div>
      </div>

      <div className="flex flex-row sm:flex-col items-center justify-between w-full sm:w-auto gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
          disabled={item.quantity <= 1}
          data-testid="decrease-quantity-button"
        >
          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
          <span className="w-8 sm:w-10 text-center font-semibold text-sm sm:text-base" data-testid="cart-item-quantity">{item.quantity}</span>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
          data-testid="increase-quantity-button"
        >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => removeFromCart(itemKey)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 ml-1 sm:ml-2"
          data-testid="remove-item-button"
        >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

        <div className="text-right">
          <div className="font-semibold text-sm sm:text-base text-gray-900" data-testid="cart-item-total">
            ₹{(item.price * item.quantity).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            ₹{item.price} × {item.quantity}
          </div>
        </div>
      </div>
    </div>
  );
};

// Checkout Form Component
const CheckoutForm = ({ cartItems, totalAmount, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Customer Details
    name: '',
    email: '',
    phone: '',
    
    // Delivery Address
    address: '',
    city: '',
    state: '',
    pincode: '',
    deliveryType: 'delivery', // 'delivery' or 'pickup'
    
    // Payment Details
    paymentMethod: 'cod', // cod, razorpay
    
    // Coupon
    couponCode: '',
  });

  const [loading, setLoading] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [customerCoordinates, setCustomerCoordinates] = useState(null);
  
  // Pre-fill user data if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!formData.couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      const response = await axios.post(`${API}/coupons/apply`, {
        code: formData.couponCode,
        order_amount: totalAmount
      });

      if (response.data.valid) {
        setDiscount(response.data.discount_amount);
        setCouponApplied(true);
        toast.success(`Coupon applied! You saved ₹${response.data.discount_amount}`);
      }
    } catch (error) {
      console.error('Coupon error:', error);
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
    }
  };

  // Calculate delivery charge using actual backend API
  const calculateDelivery = async () => {
    if (formData.deliveryType === 'pickup') {
      setDeliveryCharge(0);
      setCustomerCoordinates(null);
      toast.success('Pickup selected - No delivery charge');
      return;
    }

    if (!formData.pincode || formData.pincode.length !== 6) {
      return;
    }

    try {
      // Call backend delivery calculation API
      const response = await axios.post(`${API}/delivery/calculate`, {
        pincode: formData.pincode,
        address: `${formData.address}, ${formData.city}, ${formData.state}`,
        order_amount: totalAmount,
        delivery_type: formData.deliveryType
      });

      const deliveryInfo = response.data;
      
      // Store coordinates
      if (deliveryInfo.customer_lat && deliveryInfo.customer_lon) {
        setCustomerCoordinates({
          lat: deliveryInfo.customer_lat,
          lon: deliveryInfo.customer_lon
        });
      }

      setDeliveryCharge(deliveryInfo.delivery_charge || 0);
      
      if (deliveryInfo.error) {
        toast.error(deliveryInfo.error);
      } else if (deliveryInfo.delivery_charge === 0 && deliveryInfo.is_free_delivery) {
        toast.success(deliveryInfo.message || 'Congratulations! You qualify for FREE delivery');
      } else if (deliveryInfo.delivery_charge > 0) {
        toast.info(`Delivery charge: ₹${deliveryInfo.delivery_charge} (${deliveryInfo.distance_km}km at ₹19/km)`);
      }
    } catch (error) {
      console.error('Delivery calculation error:', error);
      // Fallback to estimated delivery charge
      const estimatedCharge = 95; // Approximate for Indore city
      setDeliveryCharge(estimatedCharge);
      toast.warning(`Using estimated delivery charge: ₹${estimatedCharge}`);
    }
  };

  // Calculate delivery when pincode changes
  useEffect(() => {
    if (formData.pincode && formData.pincode.length === 6) {
      calculateDelivery();
    }
  }, [formData.pincode, formData.deliveryType, totalAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalAmount = totalAmount - discount + deliveryCharge;
      
      const orderData = {
        user_id: user?.id || formData.email,
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          variant_weight: item.weight,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: totalAmount,
        discount_amount: discount,
        delivery_charge: deliveryCharge,
        tax_amount: 0,
        final_amount: finalAmount,
        coupon_code: couponApplied ? formData.couponCode : null,
        delivery_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        delivery_type: formData.deliveryType,
        customer_lat: customerCoordinates?.lat,
        customer_lon: customerCoordinates?.lon,
        phone_number: formData.phone,
        email: formData.email,
        payment_method: formData.paymentMethod
      };

      const response = await axios.post(`${API}/orders`, orderData);
      setCreatedOrderId(response.data.id);
      
      if (formData.paymentMethod === 'cod') {
        // Cash on Delivery - Order complete
        toast.success(`Order placed successfully! Order ID: ${response.data.id.slice(0, 8)}`);
        
        // Open WhatsApp link if available
        if (response.data.whatsapp_link) {
          setTimeout(() => {
            window.open(response.data.whatsapp_link, '_blank');
            toast.info('Opening WhatsApp to confirm your order...');
          }, 1000);
        }
        
        // Redirect to order success page
        setTimeout(() => {
          window.location.href = `/order-success?orderId=${response.data.id}`;
        }, 2000);
        
        onSuccess();
      }
      // If Razorpay, the RazorpayCheckout component will handle the payment
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpaySuccess = (paymentResponse) => {
    toast.success('Payment successful!');
    
    setTimeout(() => {
      window.location.href = `/order-success?orderId=${createdOrderId}`;
    }, 1500);
    
    onSuccess();
  };

  const handleRazorpayFailure = (error) => {
    console.error('Payment failed:', error);
    toast.error('Payment failed. Your order is saved, you can retry payment from order history.');
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div>
      {/* Authentication Check */}
      {!isAuthenticated && (
        <div className="text-center py-12">
          <User className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">
            Please login or create an account to complete your purchase.
          </p>
          <Button 
            onClick={() => {
              toast.info('Please login from the header to continue');
            }}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Close & Login
          </Button>
        </div>
      )}

      {isAuthenticated && (
      <>
      <DialogHeader>
        <DialogTitle>Checkout</DialogTitle>
      </DialogHeader>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-6 sm:mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold
              ${step <= currentStep ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${step < currentStep ? 'bg-orange-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Customer Details */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        data-testid="customer-name-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                        data-testid="customer-email-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number *</label>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      required
                      data-testid="customer-phone-input"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Delivery Address */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House/Flat No., Building Name, Street Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows="3"
                      required
                      data-testid="delivery-address-input"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City *</label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Mumbai"
                        required
                        data-testid="delivery-city-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State *</label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Maharashtra"
                        required
                        data-testid="delivery-state-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">PIN Code *</label>
                      <Input
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="400001"
                        required
                        data-testid="delivery-pincode-input"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2.5: Delivery Type & Coupon */}
            {currentStep === 2 && (
              <>
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      Delivery Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="delivery"
                        checked={formData.deliveryType === 'delivery'}
                        onChange={handleChange}
                        className="text-orange-600"
                      />
                      <div>
                        <div className="font-medium">Home Delivery</div>
                        <div className="text-sm text-gray-600">
                          {deliveryCharge === 0 ? 'FREE delivery' : `₹${deliveryCharge} delivery charge`}
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="pickup"
                        checked={formData.deliveryType === 'pickup'}
                        onChange={handleChange}
                        className="text-orange-600"
                      />
                      <div>
                        <div className="font-medium">Store Pickup</div>
                        <div className="text-sm text-gray-600">Pick up from our store - FREE</div>
                      </div>
                    </label>
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Tag className="w-5 h-5 mr-2" />
                      Apply Coupon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        name="couponCode"
                        value={formData.couponCode}
                        onChange={handleChange}
                        placeholder="Enter coupon code"
                        disabled={couponApplied}
                        className="uppercase"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponApplied}
                        variant={couponApplied ? "outline" : "default"}
                        className={!couponApplied ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        {couponApplied ? '✓ Applied' : 'Apply'}
                      </Button>
                    </div>
                    {couponApplied && (
                      <div className="mt-2 text-sm text-green-600 flex items-center">
                        <Badge className="bg-green-100 text-green-700">
                          Coupon applied! You saved ₹{discount}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={handleChange}
                          className="text-orange-600"
                          data-testid="cod-payment-radio"
                        />
                        <div>
                          <div className="font-medium">Cash on Delivery</div>
                          <div className="text-sm text-gray-600">Pay when your order arrives</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="razorpay"
                          checked={formData.paymentMethod === 'razorpay'}
                          onChange={handleChange}
                          className="text-orange-600"
                          data-testid="razorpay-payment-radio"
                        />
                        <div>
                          <div className="font-medium">Online Payment (Razorpay)</div>
                          <div className="text-sm text-gray-600">Pay securely with UPI, Cards, Netbanking</div>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Security Badge */}
                <CheckoutSecurityBadge className="mt-4" />
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                data-testid="previous-step-button"
              >
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="next-step-button"
                >
                  Next
                </Button>
              ) : (
                <>
                  {formData.paymentMethod === 'cod' ? (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-orange-500 hover:bg-orange-600"
                      data-testid="place-order-button"
                    >
                      {loading ? 'Placing Order...' : 'Place Order'}
                    </Button>
                  ) : (
                    <>
                      {!createdOrderId ? (
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-orange-500 hover:bg-orange-600"
                          data-testid="create-order-button"
                        >
                          {loading ? 'Creating Order...' : 'Create Order & Pay'}
                        </Button>
                      ) : (
                        <RazorpayCheckout
                          amount={totalAmount - discount + deliveryCharge}
                          orderId={createdOrderId}
                          userDetails={{
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone
                          }}
                          onSuccess={handleRazorpaySuccess}
                          onFailure={handleRazorpayFailure}
                          buttonText="Pay Now"
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.weight}`} className="flex justify-between text-sm border-b pb-2">
                    <div className="flex-1">
                      <span className="font-medium">{item.name}</span>
                      <div className="text-gray-600">
                        {item.weight} × {item.quantity}
                      </div>
                    </div>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  {deliveryCharge === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    <span>₹{deliveryCharge.toFixed(2)}</span>
                  )}
                </div>
                
                {totalAmount >= 1500 && deliveryCharge === 0 && (
                  <div className="text-xs text-green-600 italic">
                    🎉 Free delivery on orders above ₹1500!
                  </div>
                )}
                
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600" data-testid="order-total">
                    ₹{(totalAmount - discount + deliveryCharge).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default CartDialog;
