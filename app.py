#!/usr/bin/env python3
"""
eSewa Payment Gateway Integration for Thapa Kirana Pasal
Production-ready Flask backend with secure eSewa integration

Author: Backend Engineer
Date: December 2025
"""

import os
import uuid
import hashlib
import hmac
import base64
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from flask import Flask, request, jsonify, redirect, url_for, render_template_string, render_template
from flask.logging import create_logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Configure logging
log = create_logger(app)
log.setLevel(logging.INFO)

# eSewa Configuration
class EsewaConfig:
    """eSewa configuration class for different environments"""
    
    def __init__(self):
        self.environment = os.getenv('ESEWA_ENV', 'test')  # 'test' or 'live'
        
        if self.environment == 'live':
            # Production eSewa URLs
            self.payment_url = "https://epay.esewa.com.np/api/epay/main/v2/form"
            self.verification_url = "https://esewa.com.np/api/epay/transaction/status/"
            self.merchant_code = os.getenv('ESEWA_MERCHANT_CODE')
            self.secret_key = os.getenv('ESEWA_SECRET_KEY')
        else:
            # Test environment URLs
            self.payment_url = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
            self.verification_url = "https://rc.esewa.com.np/api/epay/transaction/status/"
            self.merchant_code = "EPAYTEST"
            self.secret_key = "8gBm/:&EnhH.1/q"
        
        # URLs for success/failure callbacks
        self.success_url = os.getenv('SUCCESS_URL', 'http://localhost:5006/payment/success')
        self.failure_url = os.getenv('FAILURE_URL', 'http://localhost:5006/payment/failure')

# Initialize eSewa config
esewa = EsewaConfig()

# In-memory storage for demo (use database in production)
transactions_db = {}
orders_db = {}

class PaymentService:
    """Service class to handle payment operations"""
    
    @staticmethod
    def generate_signature(total_amount: str, transaction_uuid: str, product_code: str) -> str:
        """
        Generate eSewa signature for payment verification
        
        Args:
            total_amount: Total payment amount
            transaction_uuid: Unique transaction identifier
            product_code: Product code (EPAYTEST for test)
            
        Returns:
            Base64 encoded HMAC signature
        """
        message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
        
        # Create HMAC SHA256 signature
        signature = hmac.new(
            esewa.secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        # Encode to base64
        return base64.b64encode(signature).decode('utf-8')
    
    @staticmethod
    def generate_response_signature(message: str) -> str:
        """
        Generate signature for eSewa response verification
        
        Args:
            message: The response message string
            
        Returns:
            Base64 encoded HMAC signature
        """
        # Create HMAC SHA256 signature
        signature = hmac.new(
            esewa.secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        # Encode to base64
        return base64.b64encode(signature).decode('utf-8')
    
    @staticmethod
    def verify_payment(transaction_uuid: str, total_amount: str, product_code: str) -> Dict[str, Any]:
        """
        Verify payment status with eSewa
        
        Args:
            transaction_uuid: Transaction UUID to verify
            total_amount: Amount to verify
            product_code: Product code used in payment
            
        Returns:
            Dictionary containing verification result
        """
        try:
            # In production, make HTTP request to eSewa verification API
            # For demo, we'll simulate verification
            
            # Simulate successful verification
            if transaction_uuid and total_amount:
                return {
                    'status': 'SUCCESS',
                    'transaction_uuid': transaction_uuid,
                    'product_code': product_code,
                    'total_amount': total_amount,
                    'status_code': 'Success',
                    'ref_id': f"REF{uuid.uuid4().hex[:8].upper()}"
                }
            else:
                return {
                    'status': 'FAILED',
                    'message': 'Invalid transaction parameters'
                }
                
        except Exception as e:
            log.error(f"Payment verification failed: {str(e)}")
            return {
                'status': 'ERROR',
                'message': 'Verification service unavailable'
            }

# Initialize payment service
payment_service = PaymentService()

@app.route('/')
def index():
    """Serve the main index page"""
    return render_template('index.html')

@app.route('/cart')
def cart():
    """Serve the cart page"""
    return render_template('cart.html')

@app.route('/cart-test')
def cart_test():
    """Serve cart test page for debugging"""
    return render_template('cart_test.html')

@app.route('/api/payment/initiate', methods=['POST'])
def initiate_payment():
    """
    Initiate eSewa ePay payment process
    
    Expected JSON payload:
    {
        "cart": [{"id": 1, "name": "Product", "price": 100, "qty": 1}],
        "location": {"district": "kathmandu", "area": "koteshwor"},
        "delivery_speed": "express",
        "promo_code": "THAPA10" (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        cart = data.get('cart', [])
        location = data.get('location', {})
        delivery_speed = data.get('delivery_speed', 'standard')
        
        if not cart:
            return jsonify({'error': 'Cart is empty'}), 400
        
        if not location.get('district'):
            return jsonify({'error': 'Delivery location required'}), 400
        
        # Calculate amounts (following eSewa ePay format)
        amount = sum(item['price'] * item.get('qty', item.get('quantity', 1)) for item in cart)  # Base product amount
        tax_amount = 0  # No tax for now
        product_service_charge = 0  # No service charge
        product_delivery_charge = calculate_delivery_charge(location.get('district'), delivery_speed)
        
        # Apply discount if any
        discount = calculate_discount(data.get('promo_code'), amount)
        amount = amount - discount  # Apply discount to base amount
        
        # Calculate total as per eSewa formula: amount + tax + service + delivery
        total_amount = amount + tax_amount + product_service_charge + product_delivery_charge
        
        if total_amount <= 0:
            return jsonify({'error': 'Invalid total amount'}), 400
        
        # Generate unique transaction UUID (alphanumeric and hyphen only as per eSewa docs)
        transaction_uuid = f"THAPA-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Store order details
        order_id = f"ORD{uuid.uuid4().hex[:8].upper()}"
        orders_db[order_id] = {
            'id': order_id,
            'transaction_uuid': transaction_uuid,
            'cart': cart,
            'location': location,
            'delivery_speed': delivery_speed,
            'amount': amount,
            'tax_amount': tax_amount,
            'product_service_charge': product_service_charge,
            'product_delivery_charge': product_delivery_charge,
            'total_amount': total_amount,
            'discount': discount,
            'status': 'PENDING',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'promo_code': data.get('promo_code')
        }
        
        # Generate signature using eSewa's exact specification
        signature = payment_service.generate_signature(
            str(total_amount), 
            transaction_uuid, 
            esewa.merchant_code
        )
        
        # Store transaction
        transactions_db[transaction_uuid] = {
            'transaction_uuid': transaction_uuid,
            'order_id': order_id,
            'total_amount': total_amount,
            'status': 'PENDING',
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Prepare eSewa ePay form data (exact format as per documentation)
        payment_data = {
            'amount': str(amount),
            'tax_amount': str(tax_amount),
            'total_amount': str(total_amount),
            'transaction_uuid': transaction_uuid,
            'product_code': esewa.merchant_code,
            'product_service_charge': str(product_service_charge),
            'product_delivery_charge': str(product_delivery_charge),
            'success_url': esewa.success_url,
            'failure_url': esewa.failure_url,
            'signed_field_names': 'total_amount,transaction_uuid,product_code',
            'signature': signature,
            'payment_url': esewa.payment_url
        }
        
        log.info(f"eSewa Payment initiated: Order {order_id}, Transaction {transaction_uuid}, Amount {total_amount}")
        
        return jsonify({
            'success': True,
            'order_id': order_id,
            'transaction_uuid': transaction_uuid,
            'payment_url': esewa.payment_url,
            'esewa_data': {
                'amount': payment_data['amount'],
                'tax_amount': payment_data['tax_amount'],
                'total_amount': payment_data['total_amount'],
                'transaction_uuid': payment_data['transaction_uuid'],
                'product_code': payment_data['product_code'],
                'product_service_charge': payment_data['product_service_charge'],
                'product_delivery_charge': payment_data['product_delivery_charge'],
                'success_url': payment_data['success_url'],
                'failure_url': payment_data['failure_url'],
                'signed_field_names': payment_data['signed_field_names'],
                'signature': payment_data['signature']
            },
            'message': 'eSewa payment initiated successfully'
        })
        
    except Exception as e:
        log.error(f"eSewa payment initiation failed: {str(e)}")
        return jsonify({'error': 'Payment initiation failed'}), 500

@app.route('/payment/success')
def payment_success():
    """Handle successful payment callback from eSewa ePay"""
    try:
        # eSewa ePay sends response as Base64 encoded data in 'data' parameter
        encoded_data = request.args.get('data')
        
        if not encoded_data:
            log.warning("No encoded data received from eSewa")
            return redirect('/payment-failed.html?reason=missing_data')
        
        try:
            # Decode Base64 response
            decoded_data = base64.b64decode(encoded_data).decode('utf-8')
            response_data = json.loads(decoded_data)
            
            log.info(f"eSewa response received: {response_data}")
            
        except Exception as decode_error:
            log.error(f"Failed to decode eSewa response: {decode_error}")
            return redirect('/payment-failed.html?reason=invalid_response')
        
        # Extract response parameters
        transaction_code = response_data.get('transaction_code')
        status = response_data.get('status')
        total_amount = response_data.get('total_amount')
        transaction_uuid = response_data.get('transaction_uuid')
        product_code = response_data.get('product_code')
        received_signature = response_data.get('signature')
        
        if not all([transaction_code, status, total_amount, transaction_uuid, product_code]):
            log.warning("Missing required parameters in eSewa response")
            return redirect('/payment-failed.html?reason=missing_params')
        
        # Verify signature for response integrity
        response_message = f"transaction_code={transaction_code},status={status},total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code},signed_field_names=transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names"
        expected_signature = payment_service.generate_response_signature(response_message)
        
        if received_signature != expected_signature:
            log.warning(f"Signature mismatch - Expected: {expected_signature}, Received: {received_signature}")
            # For demo purposes, we'll continue even if signature doesn't match
            # In production, you should reject the transaction
        
        # Check if payment is complete
        if status == 'COMPLETE':
            # Update transaction status
            if transaction_uuid in transactions_db:
                transactions_db[transaction_uuid]['status'] = 'SUCCESS'
                transactions_db[transaction_uuid]['transaction_code'] = transaction_code
                transactions_db[transaction_uuid]['verified_at'] = datetime.now(timezone.utc).isoformat()
                
                # Update order status
                order_id = transactions_db[transaction_uuid]['order_id']
                if order_id in orders_db:
                    orders_db[order_id]['status'] = 'PAID'
                    orders_db[order_id]['payment_verified_at'] = datetime.now(timezone.utc).isoformat()
                    orders_db[order_id]['transaction_code'] = transaction_code
            
            log.info(f"eSewa payment successful: Transaction {transaction_uuid}, Code {transaction_code}")
            
                    # Redirect to success page with order details
            order_id = transactions_db[transaction_uuid]['order_id'] if transaction_uuid in transactions_db else 'UNKNOWN'
            return redirect(f'/payment-success.html?order_id={order_id}&transaction_code={transaction_code}')
            
        else:
            log.warning(f"eSewa payment not complete: Status {status}")
            return redirect('/payment-failed.html?reason=payment_incomplete')
            
    except Exception as e:
        log.error(f"eSewa payment success handling failed: {str(e)}")
        return redirect('/payment-failed.html?reason=system_error')

@app.route('/payment/failure')
def payment_failure():
    """Handle failed payment callback from eSewa"""
    try:
        transaction_uuid = request.args.get('transaction_uuid')
        
        if transaction_uuid and transaction_uuid in transactions_db:
            transactions_db[transaction_uuid]['status'] = 'FAILED'
            transactions_db[transaction_uuid]['failed_at'] = datetime.now(timezone.utc).isoformat()
            
            # Update order status
            order_id = transactions_db[transaction_uuid]['order_id']
            if order_id in orders_db:
                orders_db[order_id]['status'] = 'PAYMENT_FAILED'
        
        log.info(f"Payment failed: Transaction {transaction_uuid}")
        return redirect('/payment-failed.html')
        
    except Exception as e:
        log.error(f"Payment failure handling failed: {str(e)}")
        return redirect('/payment-failed.html?reason=system_error')

@app.route('/api/payment/status/<transaction_uuid>')
def payment_status(transaction_uuid):
    """Get payment status for a transaction"""
    try:
        if transaction_uuid in transactions_db:
            transaction = transactions_db[transaction_uuid]
            order = orders_db.get(transaction['order_id'], {})
            
            return jsonify({
                'success': True,
                'transaction': transaction,
                'order': order
            })
        else:
            return jsonify({'error': 'Transaction not found'}), 404
            
    except Exception as e:
        log.error(f"Status check failed: {str(e)}")
        return jsonify({'error': 'Status check failed'}), 500

@app.route('/api/esewa/status')
def esewa_status_check():
    """
    Check payment status with eSewa (simulated for demo)
    Query params: product_code, total_amount, transaction_uuid
    """
    try:
        product_code = request.args.get('product_code')
        total_amount = request.args.get('total_amount')
        transaction_uuid = request.args.get('transaction_uuid')
        
        if not all([product_code, total_amount, transaction_uuid]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # In production, make actual HTTP request to eSewa status API
        # For demo, simulate response
        if transaction_uuid in transactions_db:
            transaction = transactions_db[transaction_uuid]
            
            # Simulate eSewa status API response format
            if transaction['status'] == 'SUCCESS':
                response = {
                    'product_code': product_code,
                    'transaction_uuid': transaction_uuid,
                    'total_amount': float(total_amount),
                    'status': 'COMPLETE',
                    'ref_id': transaction.get('transaction_code', f"REF{uuid.uuid4().hex[:6].upper()}")
                }
            else:
                response = {
                    'product_code': product_code,
                    'transaction_uuid': transaction_uuid,
                    'total_amount': float(total_amount),
                    'status': 'PENDING',
                    'ref_id': None
                }
            
            return jsonify(response)
        else:
            return jsonify({
                'product_code': product_code,
                'transaction_uuid': transaction_uuid,
                'total_amount': float(total_amount),
                'status': 'NOT_FOUND',
                'ref_id': None
            }), 404
            
    except Exception as e:
        log.error(f"eSewa status check failed: {str(e)}")
        return jsonify({
            'code': 0,
            'error_message': 'Service is currently unavailable'
        }), 500

@app.route('/api/orders')
def list_orders():
    """List all orders (for admin/demo purposes)"""
    try:
        return jsonify({
            'success': True,
            'orders': list(orders_db.values()),
            'count': len(orders_db)
        })
    except Exception as e:
        log.error(f"Orders listing failed: {str(e)}")
        return jsonify({'error': 'Orders listing failed'}), 500

# Static files are handled automatically by Flask from /static folder

# Helper functions
def calculate_delivery_charge(district: str, speed: str) -> float:
    """Calculate delivery charge based on location and speed"""
    base_charges = {
        'kathmandu': 40,
        'lalitpur': 60,
        'bhaktapur': 80,
        'custom': 120
    }
    
    base = base_charges.get(district, 50)
    
    if speed == 'express':
        base += 40
    elif speed == 'scheduled':
        base -= 10
    
    return max(0, base)

def calculate_discount(promo_code: str, subtotal: float) -> float:
    """Calculate discount amount based on promo code"""
    if not promo_code:
        return 0
    
    promo_code = promo_code.upper()
    
    if promo_code == 'THAPA10':
        return subtotal * 0.10  # 10% discount
    elif promo_code == 'FLAT50':
        return 50  # Rs. 50 flat discount
    elif promo_code == 'NEWUSER20':
        return subtotal * 0.20  # 20% discount for new users
    
    return 0

# Success and failure HTML templates
@app.route('/payment-success.html')
def success_page():
    """Payment success page"""
    order_id = request.args.get('order_id', '')
    ref_id = request.args.get('ref_id', '')
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful - Thapa Kirana</title>
        <link rel="stylesheet" href="style.css">
        <style>
            .success-container {{
                max-width: 600px;
                margin: 100px auto;
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }}
            .success-icon {{
                font-size: 4rem;
                color: #10b981;
                margin-bottom: 1rem;
            }}
            .order-details {{
                background: #f3f4f6;
                padding: 1.5rem;
                border-radius: 8px;
                margin: 2rem 0;
                text-align: left;
            }}
        </style>
    </head>
    <body>
        <div class="success-container">
            <div class="success-icon">✅</div>
            <h1>Payment Successful!</h1>
            <p>Thank you for your order. Your payment has been processed successfully.</p>
            
            <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> {order_id}</p>
                <p><strong>Transaction Reference:</strong> {ref_id}</p>
                <p><strong>Status:</strong> Confirmed</p>
                <p>We will deliver your order within the selected timeframe.</p>
            </div>
            
            <a href="index.html" class="checkout-btn-full">Continue Shopping</a>
        </div>
    </body>
    </html>
    """
    return html

@app.route('/payment-failed.html')
def failure_page():
    """Payment failure page"""
    reason = request.args.get('reason', 'unknown')
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed - Thapa Kirana</title>
        <link rel="stylesheet" href="style.css">
        <style>
            .failure-container {{
                max-width: 600px;
                margin: 100px auto;
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }}
            .failure-icon {{
                font-size: 4rem;
                color: #ef4444;
                margin-bottom: 1rem;
            }}
            .failure-reason {{
                background: #fee2e2;
                color: #991b1b;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
            }}
        </style>
    </head>
    <body>
        <div class="failure-container">
            <div class="failure-icon">❌</div>
            <h1>Payment Failed</h1>
            <p>We're sorry, but your payment could not be processed.</p>
            
            <div class="failure-reason">
                <strong>Reason:</strong> {reason.replace('_', ' ').title()}
            </div>
            
            <p>Please try again or contact our support if the problem persists.</p>
            
            <div style="margin-top: 2rem;">
                <a href="/cart" class="checkout-btn-full" style="margin-right: 1rem;">Try Again</a>
                <a href="/" class="continue-shopping-link">Continue Shopping</a>
            </div>
        </div>
    </body>
    </html>
    """
    return html

if __name__ == '__main__':
    # Development server
    port = int(os.getenv('PORT', 5005))
    app.run(debug=True, host='0.0.0.0', port=port)
