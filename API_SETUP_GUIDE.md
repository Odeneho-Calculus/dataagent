# PHP Backend API Setup Guide

## Step 1: Database Creation

### Local Testing (Using XAMPP/WAMP):

1. **Run the database setup script:**
   - Go to: `http://localhost/datasite/api/db-setup.php`
   - This will create the database and all tables automatically

### On cPanel (Live Server):

1. **Create a database in cPanel:**
   - Go to cPanel → MySQL Databases
   - Create new database: `highest_data_hub`
   - Create new user with password
   - Grant all privileges to the user

2. **Run setup via SSH or File Manager:**
   - Download `api/db-setup.php` to your cPanel account
   - Update the database credentials in the script
   - Run: `php db-setup.php`

## Step 2: Configure Database Connection

**Edit `api/config.php`:**

```php
$DB_HOST = 'localhost';
$DB_USER = 'your_cpanel_username';      // Your cPanel MySQL username
$DB_PASSWORD = 'your_cpanel_password';  // Your cPanel MySQL password
$DB_NAME = 'highest_data_hub';          // Database name
```

## Step 3: Database Schema

The following tables are automatically created:

### **users**
- `user_id` - Primary key
- `email` - Unique, required
- `password` - Hashed
- `name` - User's name
- `phone` - Phone number
- `balance` - Wallet balance
- `referral_code` - Unique referral code
- `referral_earnings` - Earnings from referrals
- `created_at`, `updated_at` - Timestamps

### **sessions**
- `session_id` - Primary key
- `user_id` - Foreign key to users
- `token` - Session token for authentication
- `expires_at` - Token expiration
- `created_at` - Creation timestamp

### **transactions**
- `txn_id` - Primary key
- `user_id` - Foreign key to users
- `type` - 'wallet_topup' or 'purchase_refund'
- `amount` - Transaction amount
- `reference` - Unique transaction reference
- `paystack_reference` - Paystack transaction ID
- `status` - 'pending', 'completed', 'failed'
- `created_at`, `updated_at` - Timestamps

### **purchases**
- `purchase_id` - Primary key
- `user_id` - Foreign key to users
- `network` - 'MTN', 'TELECEL', 'AIRTELTIGO'
- `gb` - Data amount in GB
- `price` - Purchase price
- `recipient` - Phone number
- `reference` - Unique purchase reference
- `status` - 'pending', 'completed', 'failed'
- `created_at`, `updated_at` - Timestamps

## Step 4: API Endpoints

All endpoints require a `token` parameter (from login response).

### **Authentication**

**POST** `/api/auth.php?action=register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
Response:
```json
{
  "success": true,
  "token": "sha256_hash",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "balance": 0.00
  }
}
```

**POST** `/api/auth.php?action=login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**POST** `/api/auth.php?action=logout`
```json
{
  "token": "sha256_hash"
}
```

### **User Profile**

**GET** `/api/user.php?action=profile&token=sha256_hash`
Returns: User profile data

**GET** `/api/user.php?action=balance&token=sha256_hash`
Returns: Current wallet balance

**POST** `/api/user.php?action=update-balance&token=sha256_hash`
```json
{
  "amount": 50.00,
  "type": "add"  // or "subtract"
}
```

### **Transactions**

**GET** `/api/transactions.php?action=list&token=sha256_hash&limit=10&offset=0`
Returns: List of transactions

**POST** `/api/transactions.php?action=create&token=sha256_hash`
```json
{
  "type": "wallet_topup",
  "amount": 100.00,
  "reference": "REF-12345"
}
```

**POST** `/api/transactions.php?action=verify&token=sha256_hash`
```json
{
  "reference": "REF-12345",
  "paystack_reference": "paystack_ref_id"
}
```

### **Purchases**

**GET** `/api/purchases.php?action=list&token=sha256_hash&limit=10&offset=0`
Returns: List of purchases

**POST** `/api/purchases.php?action=create&token=sha256_hash`
```json
{
  "network": "MTN",
  "gb": 1.0,
  "price": 2.50,
  "recipient": "0501234567"
}
```

## Step 5: Testing with cURL

```bash
# Register
curl -X POST http://localhost/datasite/api/auth.php?action=register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test User"}'

# Login
curl -X POST http://localhost/datasite/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Get Profile
curl "http://localhost/datasite/api/user.php?action=profile&token=YOUR_TOKEN_HERE"

# Get Balance
curl "http://localhost/datasite/api/user.php?action=balance&token=YOUR_TOKEN_HERE"
```

## Step 6: File Structure

```
datasite/
├── api/
│   ├── config.php           (Database connection)
│   ├── db-setup.php         (Database creation)
│   ├── auth.php             (Login/Register)
│   ├── user.php             (User profile)
│   ├── transactions.php      (Wallet top-ups)
│   └── purchases.php         (Data purchases)
├── index.html
├── script.js
├── styles.css
└── auth-styles.css
```

## Troubleshooting

**Error: Database connection failed**
- Check DB credentials in `config.php`
- Ensure MySQL server is running
- Verify database name is correct

**Error: Unknown error in db-setup.php**
- Check file permissions
- Ensure you have MySQL access
- Try creating database manually in cPanel

**Error: Token invalid**
- Token may have expired (30 days)
- User needs to login again

## Next Steps

After setup is complete, we'll update the frontend JavaScript to use these PHP API endpoints instead of Firebase.
