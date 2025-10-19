/**
 * Payment Status Page - Handles PhonePe payment redirect
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentStatusPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, failed, pending
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get payment data from session storage
      const paymentDataStr = sessionStorage.getItem('phonepe_payment_data');
      
      if (!paymentDataStr) {
        setStatus('failed');
        setMessage('Payment information not found. Please try again.');
        return;
      }

      const paymentData = JSON.parse(paymentDataStr);
      
      // Add retry logic with delays
      let attempts = 0;
      const maxAttempts = 5;
      const retryDelay = 3000; // 3 seconds

      const attemptVerification = async () => {
        attempts++;
        
        try {
          // Verify payment with backend
          const verifyResponse = await axios.post(`${API}/phonepe/verify-payment`, {
            merchant_order_id: paymentData.merchant_order_id,
            order_id: paymentData.order_id
          });

          if (verifyResponse.data.success && verifyResponse.data.status === 'COMPLETED') {
            setStatus('success');
            setMessage('Payment successful! Your order has been confirmed.');
            toast.success('Payment completed successfully!');
            
            // Clear session storage
            sessionStorage.removeItem('phonepe_payment_data');
            
            // Redirect to order success page after 3 seconds
            setTimeout(() => {
              navigate(`/order-success/${paymentData.order_id}`);
            }, 3000);
            
          } else if (verifyResponse.data.status === 'FAILED') {
            setStatus('failed');
            setMessage('Payment failed. Please try again or choose a different payment method.');
            toast.error('Payment failed');
            sessionStorage.removeItem('phonepe_payment_data');
            
          } else if (verifyResponse.data.status === 'PENDING') {
            if (attempts < maxAttempts) {
              setMessage(`Verifying payment... (Attempt ${attempts}/${maxAttempts})`);
              setTimeout(attemptVerification, retryDelay);
            } else {
              setStatus('pending');
              setMessage('Payment verification is taking longer than expected. Please check your order status.');
            }
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          
          if (attempts < maxAttempts) {
            setTimeout(attemptVerification, retryDelay);
          } else {
            setStatus('failed');
            const errorMsg = error.response?.data?.detail || 'Failed to verify payment. Please contact support.';
            setMessage(errorMsg);
            toast.error('Payment verification failed');
          }
        }
      };

      // Start verification
      await attemptVerification();

    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage('An error occurred while verifying your payment. Please contact support.');
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'verifying':
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  const renderActions = () => {
    if (status === 'failed') {
      return (
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/cart')}
            variant="outline"
            data-testid="back-to-cart-button"
          >
            Back to Cart
          </Button>
          <Button
            onClick={() => window.location.reload()}
            data-testid="retry-payment-button"
          >
            Retry Payment
          </Button>
        </div>
      );
    }

    if (status === 'pending') {
      return (
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/profile')}
            variant="outline"
            data-testid="view-orders-button"
          >
            View My Orders
          </Button>
          <Button
            onClick={() => window.location.reload()}
            data-testid="check-again-button"
          >
            Check Again
          </Button>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <Button
          onClick={() => navigate('/')}
          data-testid="continue-shopping-button"
        >
          Continue Shopping
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            {renderIcon()}
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {status === 'verifying' && 'Verifying Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
            {status === 'pending' && 'Payment Pending'}
          </h1>

          <p className="text-gray-600 mb-8">
            {message}
          </p>

          {renderActions()}
        </div>

        {status === 'verifying' && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Please do not close this page or press the back button.</p>
            <p className="mt-2">This may take a few moments...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
