"# Thapa Gas & Kirana Pasal - eSewa Payment Integration

A complete e-commerce website for Thapa Gas & Kirana Pasal with integrated eSewa payment gateway using Flask backend and responsive frontend.

## 🚀 Features

- **Modern E-commerce Interface**: Responsive design with product catalog, cart functionality, and user-friendly interface
- **eSewa Payment Integration**: Complete implementation of eSewa ePay API with HMAC-SHA256 signature verification
- **Location-based Delivery**: Interactive map for location selection with delivery charges calculation
- **Real-time Cart Management**: Add/remove items, quantity controls, promo code support
- **Secure Backend**: Flask application with proper error handling, logging, and transaction management
- **Test Environment**: Complete testing setup with eSewa sandbox integration

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- pip (Python package installer)

### 1. Setup Virtual Environment

```bash
cd "E-commerce"
python3 -m venv esewa_env
source esewa_env/bin/activate  # On Windows: esewa_env\\Scripts\\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python app.py
```

The application will be available at `http://localhost:5002`

## 🧪 Testing

### Run Integration Tests

```bash
# Make sure the Flask server is running first
python test_integration.py
```

## 🏪 Using the Application

### Adding Products to Cart
1. Visit `http://localhost:5002`
2. Browse products and click "Add to Cart"
3. Cart count updates in real-time

### Completing Purchase
1. Click cart icon to go to cart page
2. Review items and adjust quantities
3. Select delivery location (district and area)
4. Choose delivery speed (Express/Standard/Scheduled)
5. Apply promo code if available:
   - `THAPA10`: 10% discount
   - `FLAT50`: Rs. 50 flat discount
6. Click "Pay with eSewa"

### Test Payment Credentials (eSewa Sandbox)
- **eSewa ID**: 9806800001, 9806800002, 9806800003, 9806800004, 9806800005
- **Password**: Nepal@123
- **MPIN**: 1234

## ✅ Project Status

**COMPLETED:**
- ✅ Flask backend with eSewa ePay integration
- ✅ Proper Flask project structure (templates/static folders)
- ✅ Frontend cart functionality with backend integration
- ✅ HMAC-SHA256 signature generation following eSewa specification
- ✅ Payment initiation, success/failure handling
- ✅ Comprehensive testing suite
- ✅ Production-ready code with error handling

**READY FOR PRODUCTION:**
The eSewa payment integration is complete and working. Simply update the environment variables with production eSewa credentials when ready to go live.

---
**Developed with ❤️ in Nepal**" 
