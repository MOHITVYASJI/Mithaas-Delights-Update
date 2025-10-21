"""
PhonePe Payment Gateway Integration Utilities
Supports Standard Checkout flow with UAT/Production environments
"""
import os
import hmac
import hashlib
import base64
import json
from typing import Dict, Optional
import requests
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class PhonePeClient:
    """PhonePe Payment Gateway Client"""
    
    def __init__(self):
        """Initialize PhonePe client with environment variables"""
        self.merchant_id = os.environ.get('PHONEPE_MERCHANT_ID')
        self.client_id = os.environ.get('PHONEPE_CLIENT_ID')
        self.client_secret = os.environ.get('PHONEPE_CLIENT_SECRET')
        self.client_version = os.environ.get('PHONEPE_CLIENT_VERSION', '1')
        self.salt_key = os.environ.get('PHONEPE_SALT_KEY')
        self.salt_index = os.environ.get('PHONEPE_SALT_INDEX', '1')
        self.environment = os.environ.get('PHONEPE_ENVIRONMENT', 'SANDBOX')
        
        # Set base URL based on environment
        if self.environment == 'PRODUCTION':
            self.base_url = 'https://api.phonepe.com/apis/pg'
            self.auth_url = 'https://api.phonepe.com/apis/identity-manager'
        else:  # SANDBOX/UAT
            self.base_url = 'https://api-preprod.phonepe.com/apis/pg-sandbox'
            self.auth_url = 'https://api-preprod.phonepe.com/apis/identity-manager'
        
        # Validate credentials
        if not all([self.merchant_id, self.client_id, self.client_secret, self.salt_key]):
            raise HTTPException(
                status_code=500, 
                detail="PhonePe credentials not configured properly"
            )
        
        self.access_token = None
        self.token_expiry = None
    
    def get_authorization_token(self) -> str:
        """
        Get OAuth authorization token from PhonePe
        Tokens are cached and refreshed when expired
        """
        import time
        from datetime import datetime
        
        # Check if token is still valid (with 5 min buffer)
        if self.access_token and self.token_expiry:
            if time.time() < (self.token_expiry - 300):
                return self.access_token
        
        try:
            # Token endpoint
            token_url = f"{self.auth_url}/v1/oauth/token"
            
            # Request body (x-www-form-urlencoded)
            data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'client_version': self.client_version,
                'grant_type': 'client_credentials'
            }
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            response = requests.post(token_url, data=data, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # Store token and expiry
            self.access_token = result.get('access_token')
            expires_at = result.get('expires_at')  # Unix timestamp in milliseconds
            
            if expires_at:
                self.token_expiry = expires_at / 1000  # Convert to seconds
            
            logger.info("PhonePe authorization token obtained successfully")
            return self.access_token
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get PhonePe authorization token: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to authenticate with PhonePe: {str(e)}"
            )
    
    def generate_checksum(self, payload: Dict, endpoint: str) -> str:
        """
        Generate X-VERIFY checksum for PhonePe API requests
        
        Args:
            payload: Request payload dictionary
            endpoint: API endpoint path (e.g., '/v1/pay')
        
        Returns:
            Checksum string in format: hash###salt_index
        """
        try:
            # Convert payload to JSON and encode to base64
            payload_json = json.dumps(payload, separators=(',', ':'))
            payload_bytes = payload_json.encode('utf-8')
            payload_base64 = base64.b64encode(payload_bytes).decode('utf-8')
            
            # Create checksum string: base64_payload + endpoint + salt_key
            checksum_string = payload_base64 + endpoint + self.salt_key
            
            # Generate SHA256 hash
            checksum_hash = hashlib.sha256(checksum_string.encode('utf-8')).hexdigest()
            
            # Return in format: hash###salt_index
            return f"{checksum_hash}###{self.salt_index}"
            
        except Exception as e:
            logger.error(f"Error generating checksum: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate payment checksum")
    
    def create_payment_order(
        self,
        merchant_order_id: str,
        amount: float,
        redirect_url: str,
        customer_phone: Optional[str] = None,
        customer_email: Optional[str] = None
    ) -> Dict:
        """
        Create a PhonePe payment order
        
        Args:
            merchant_order_id: Unique order ID from merchant system
            amount: Amount in rupees (will be converted to paise)
            redirect_url: URL where customer is redirected after payment
            customer_phone: Customer phone number (optional)
            customer_email: Customer email (optional)
        
        Returns:
            PhonePe order response with redirect URL
        """
        try:
            # Get authorization token
            token = self.get_authorization_token()
            
            # Convert amount to paise (1 rupee = 100 paise)
            amount_paise = int(amount * 100)
            
            # Construct payment payload
            payload = {
                "merchantId": self.merchant_id,
                "merchantOrderId": merchant_order_id,
                "amount": amount_paise,
                "currency": "INR",
                "paymentFlow": {
                    "flow": "STANDARD_CHECKOUT",
                    "redirectUrl": redirect_url,
                    "redirectMode": "POST"
                },
                "expiresAt": 3600  # 1 hour expiry
            }
            
            # Add customer info if provided
            if customer_phone or customer_email:
                payload["customer"] = {}
                if customer_phone:
                    payload["customer"]["phoneNumber"] = customer_phone
                if customer_email:
                    payload["customer"]["email"] = customer_email
            
            # API endpoint
            endpoint = '/v1/pay'
            api_url = f"{self.base_url}{endpoint}"
            
            # Generate checksum
            checksum = self.generate_checksum(payload, endpoint)
            
            # Encode payload to base64 for API request
            payload_json = json.dumps(payload, separators=(',', ':'))
            payload_base64 = base64.b64encode(payload_json.encode('utf-8')).decode('utf-8')
            
            # Request body
            request_body = {
                "request": payload_base64
            }
            
            # Headers
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}',
                'X-VERIFY': checksum
            }
            
            # Make API request
            response = requests.post(api_url, json=request_body, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            logger.info(f"PhonePe order created successfully: {merchant_order_id}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create PhonePe order: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create PhonePe payment: {str(e)}"
            )
    
    def check_payment_status(self, merchant_order_id: str) -> Dict:
        """
        Check payment status for an order
        
        Args:
            merchant_order_id: Merchant order ID to check
        
        Returns:
            Payment status response
        """
        try:
            # Get authorization token
            token = self.get_authorization_token()
            
            # API endpoint
            endpoint = f'/v1/status/{self.merchant_id}/{merchant_order_id}'
            api_url = f"{self.base_url}{endpoint}"
            
            # Generate checksum for status check (empty payload)
            checksum_string = endpoint + self.salt_key
            checksum_hash = hashlib.sha256(checksum_string.encode('utf-8')).hexdigest()
            checksum = f"{checksum_hash}###{self.salt_index}"
            
            # Headers
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}',
                'X-VERIFY': checksum
            }
            
            # Make API request
            response = requests.get(api_url, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            logger.info(f"PhonePe status checked for order: {merchant_order_id}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to check PhonePe status: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to check payment status: {str(e)}"
            )
    
    def verify_webhook_signature(self, authorization_header: str) -> bool:
        """
        Verify webhook authorization signature
        
        Args:
            authorization_header: Authorization header from webhook request
        
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            # Get webhook credentials from environment
            webhook_username = os.environ.get('PHONEPE_WEBHOOK_USERNAME', 'webhook_user')
            webhook_password = os.environ.get('PHONEPE_WEBHOOK_PASSWORD', 'webhook_pass')
            
            # Generate expected signature: SHA256(username:password)
            credentials_string = f"{webhook_username}:{webhook_password}"
            expected_signature = hashlib.sha256(
                credentials_string.encode('utf-8')
            ).hexdigest()
            
            # Compare signatures (constant time comparison)
            return hmac.compare_digest(expected_signature, authorization_header)
            
        except Exception as e:
            logger.error(f"Webhook signature verification error: {str(e)}")
            return False
    
    def create_refund(
        self,
        merchant_refund_id: str,
        original_merchant_order_id: str,
        amount: float
    ) -> Dict:
        """
        Create a refund for a payment
        
        Args:
            merchant_refund_id: Unique refund ID
            original_merchant_order_id: Original order ID to refund
            amount: Refund amount in rupees
        
        Returns:
            Refund response
        """
        try:
            # Get authorization token
            token = self.get_authorization_token()
            
            # Convert amount to paise
            amount_paise = int(amount * 100)
            
            # Construct refund payload
            payload = {
                "merchantId": self.merchant_id,
                "merchantRefundId": merchant_refund_id,
                "originalMerchantOrderId": original_merchant_order_id,
                "amount": amount_paise,
                "currency": "INR"
            }
            
            # API endpoint
            endpoint = '/refund/v1/refund'
            api_url = f"{self.base_url}{endpoint}"
            
            # Generate checksum
            checksum = self.generate_checksum(payload, endpoint)
            
            # Encode payload to base64
            payload_json = json.dumps(payload, separators=(',', ':'))
            payload_base64 = base64.b64encode(payload_json.encode('utf-8')).decode('utf-8')
            
            # Request body
            request_body = {
                "request": payload_base64
            }
            
            # Headers
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}',
                'X-VERIFY': checksum
            }
            
            # Make API request
            response = requests.post(api_url, json=request_body, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            logger.info(f"PhonePe refund created: {merchant_refund_id}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create PhonePe refund: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create refund: {str(e)}"
            )


# Initialize PhonePe client
def get_phonepe_client():
    """Get PhonePe client instance"""
    return PhonePeClient()
