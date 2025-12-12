# Firebase to PHP Migration Guide

## Overview
We're migrating from Firebase Realtime Database to a PHP + MySQL backend on your cPanel hosting.

## What's Changed

### Backend
✅ **Before**: Firebase (Cloud-hosted)
✅ **After**: PHP API (Your cPanel server)

### Database
✅ **Before**: Firebase Realtime Database
✅ **After**: MySQL Database (included with cPanel)

### Authentication
✅ **Before**: Firebase Auth
✅ **After**: Custom PHP authentication with JWT-like tokens

## Migration Steps

### 1. Database Setup

**On Local Machine (XAMPP/WAMP):**
```bash
# Navigate to your datasite folder
cd c:\Users\HIGHEST\Desktop\Codes\datasite

# Open browser and go to:
http://localhost/datasite/api/db-setup.php
```

**On cPanel Server:**
```bash
# Create database in cPanel MySQL
1. Go to cPanel → MySQL Databases
2. Create database: highest_data_hub
3. Create user with all privileges
4. Update api/config.php with credentials
5. Run: php api/db-setup.php via SSH or File Manager
```

### 2. Update Configuration

**Edit `api/config.php`:**
```php
$DB_HOST = 'localhost';
$DB_USER = 'your_cpanel_mysql_user';
$DB_PASSWORD = 'your_cpanel_mysql_password';
$DB_NAME = 'highest_data_hub';
```

### 3. Replace JavaScript

**Old file:** `script.js` (Firebase-based)
**New file:** `script-new.php.js` (PHP API-based)

Replace in `index.html`:
```html
<!-- OLD -->
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js"></script>
<script src="script.js"></script>

<!-- NEW -->
<script src="script-new.php.js"></script>
```

### 4. Update .htaccess (if needed)

Create `.htaccess` in your `api/` folder for clean URLs:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php?request=$1 [QSA,L]
</IfModule>
```

## File Structure

```
datasite/
├── api/
│   ├── config.php               (Database connection)
│   ├── db-setup.php             (Database setup - RUN ONCE)
│   ├── auth.php                 (Register/Login/Logout)
│   ├── user.php                 (User profile/balance)
│   ├── transactions.php          (Wallet top-ups)
│   ├── purchases.php             (Data purchases)
│   └── .htaccess               (Optional)
├── index.html
├── script-new.php.js             (REPLACE script.js)
├── styles.css
├── auth-styles.css
├── API_SETUP_GUIDE.md
└── MIGRATION_GUIDE.md
```

## API Endpoints Reference

All requests require authentication token (from login).

### Authentication
- **Register**: `POST /api/auth.php?action=register`
- **Login**: `POST /api/auth.php?action=login`
- **Logout**: `POST /api/auth.php?action=logout`

### User Management
- **Get Profile**: `GET /api/user.php?action=profile&token=...`
- **Get Balance**: `GET /api/user.php?action=balance&token=...`
- **Update Balance**: `POST /api/user.php?action=update-balance&token=...`

### Wallet
- **List Transactions**: `GET /api/transactions.php?action=list&token=...`
- **Create Transaction**: `POST /api/transactions.php?action=create&token=...`
- **Verify Transaction**: `POST /api/transactions.php?action=verify&token=...`

### Data Purchases
- **List Purchases**: `GET /api/purchases.php?action=list&token=...`
- **Create Purchase**: `POST /api/purchases.php?action=create&token=...`

## Data Migration (Firebase → MySQL)

If you have existing Firebase data:

### Export Firebase Data
1. Go to Firebase Console
2. Download data as JSON
3. Parse JSON structure

### Import to MySQL
Create a script to convert Firebase JSON to MySQL inserts:

```php
// Example: Import users from Firebase export
$firebaseUsers = json_decode(file_get_contents('firebase_export.json'), true);

foreach ($firebaseUsers['users'] as $id => $user) {
    $stmt = $conn->prepare('INSERT INTO users (user_id, email, password, name, balance, referral_code) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('isssds', $id, $user['email'], $user['password'], $user['name'], $user['balance'], $user['referral_code']);
    $stmt->execute();
}
```

## Testing

### Test API Locally
```bash
# Register
curl -X POST http://localhost/datasite/api/auth.php?action=register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost/datasite/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get Profile (replace TOKEN)
curl "http://localhost/datasite/api/user.php?action=profile&token=TOKEN"
```

### Test in Browser
1. Open `http://localhost/datasite/index.html`
2. Register a new account
3. Check browser DevTools Console for errors
4. Test wallet top-up and data purchase

## Troubleshooting

### "Database connection failed"
- ✓ Check credentials in `api/config.php`
- ✓ Ensure MySQL server is running
- ✓ Verify database name is correct

### "Token invalid" or "Unauthorized"
- ✓ User needs to log in again
- ✓ Token may have expired (30 days)
- ✓ Check localStorage in DevTools

### "API endpoint not found"
- ✓ Check URL structure in browser Network tab
- ✓ Verify all API files are uploaded
- ✓ Check file permissions (644 for .php files)

### Users can't purchase data
- ✓ Check wallet balance is updating
- ✓ Verify recipient phone format (10 digits)
- ✓ Check MySQL purchases table has records

## Next Steps

After migration:
1. Test all features thoroughly
2. Update Paystack API key if needed
3. Set up regular MySQL backups
4. Monitor PHP error logs
5. Update your domain DNS if needed

## Support

For issues:
1. Check PHP error logs: `var/log/error_log`
2. Check browser Console (F12)
3. Check Network tab for failed requests
4. Verify MySQL user has proper permissions
