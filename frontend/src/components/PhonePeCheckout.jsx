/**
 * PhonePe Payment Integration Component
 */
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const PhonePeCheckout = ({ 
  amount, 
  orderId, 
  userDetails, 
  onSuccess, 
  onFailure,
  buttonText = "Pay with PhonePe",
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Generate unique merchant order ID
      const merchantOrderId = `ORDER_${orderId}_${Date.now()}`;

      // Create PhonePe payment order
      const orderResponse = await axios.post(`${API}/phonepe/create-order`, {
        amount: amount,
        merchant_order_id: merchantOrderId,
        customer_phone: userDetails.phone || null,
        customer_email: userDetails.email || null
      });

      if (orderResponse.data.success && orderResponse.data.payment_url) {
        // Store order details in session storage for verification after redirect
        sessionStorage.setItem('phonepe_payment_data', JSON.stringify({
          merchant_order_id: merchantOrderId,
          order_id: orderId,
          amount: amount
        }));

        // Redirect to PhonePe payment page
        window.location.href = orderResponse.data.payment_url;
      } else {
        throw new Error(orderResponse.data.message || 'Failed to create payment order');
      }

    } catch (error) {
      console.error('PhonePe error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to initiate payment';
      toast.error(errorMessage);
      setLoading(false);
      onFailure && onFailure(error);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      data-testid="phonepe-payment-button"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirecting to PhonePe...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
};

export default PhonePeCheckout;
