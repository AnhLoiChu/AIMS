# Hướng dẫn tích hợp PayPal vào AIMS

## Tổng quan
Hệ thống AIMS hiện đã hỗ trợ 2 phương thức thanh toán:
- **VietQR**: Thanh toán qua QR Code (mặc định)
- **PayPal**: Thanh toán quốc tế qua PayPal

## Cấu hình PayPal

### 1. Tạo PayPal Developer Account
1. Truy cập https://developer.paypal.com
2. Đăng ký/Đăng nhập tài khoản
3. Vào **Dashboard** → **Apps & Credentials**

### 2. Tạo PayPal App
1. Click **Create App**
2. Chọn **Merchant** app type
3. Đặt tên app (ví dụ: "AIMS Payment")
4. Copy **Client ID** và **Secret**

### 3. Cấu hình Backend
Thêm các biến sau vào file `.env`:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_MODE=sandbox  # hoặc 'live' cho production
PAYPAL_RETURN_URL=http://localhost:8080/payment/success
PAYPAL_CANCEL_URL=http://localhost:8080/payment/cancel
```

### 4. Cấu hình Sandbox (Testing)
1. Vào **Sandbox** → **Accounts**
2. Tạo 2 tài khoản test:
   - **Business Account**: Nhận tiền (merchant)
   - **Personal Account**: Trả tiền (customer)
3. Sử dụng thông tin đăng nhập sandbox để test

## Kiến trúc

### Backend
```
payment-transaction/
├── paypal.service.ts          # PayPal payment gateway implementation
├── paypal.controller.ts       # Handle PayPal callbacks
├── payment-gateway.factory.ts # Factory pattern để chọn gateway
└── payment-transaction.service.ts
```

### Flow thanh toán PayPal
1. User chọn PayPal tại checkout
2. Frontend gọi API `/payorder/create-payment-url` với `method: 'PAYPAL'`
3. Backend tạo PayPal Order và trả về `approveLink`
4. Frontend mở popup với `approveLink`
5. User đăng nhập PayPal và xác nhận thanh toán
6. PayPal redirect về `/paypal/success?token=xxx&orderId=xxx`
7. Backend capture payment và cập nhật transaction status
8. Frontend polling nhận được status SUCCESS và hiển thị thông báo

## Test E2E

### Với Sandbox Account
1. Chọn PayPal tại trang checkout
2. Click "Proceed to Pay"
3. Đăng nhập bằng **Personal Sandbox Account**
4. Xác nhận thanh toán
5. Hệ thống tự động redirect về trang success

### Lưu ý
- Số tiền sẽ được chuyển đổi từ VND sang USD (tỷ giá: 1 USD = 25,000 VND)
- PayPal chỉ hỗ trợ thanh toán bằng USD, EUR, và các đơn vị tiền tệ quốc tế khác
- Trong sandbox mode, không có tiền thật được chuyển

## API Endpoints

### Create Payment
```
POST /payorder/create-payment-url
Body: {
  "order_id": 123,
  "orderDescription": "Payment for order 123",
  "orderType": "billpayment",
  "method": "PAYPAL"
}
```

### PayPal Callbacks
```
GET /paypal/success?token=xxx&PayerID=xxx&orderId=123
GET /paypal/cancel?token=xxx&orderId=123
```

### Check Payment Status
```
GET /payorder/transaction/:orderId
```

## Troubleshooting

### Lỗi "Invalid credentials"
- Kiểm tra PAYPAL_CLIENT_ID và PAYPAL_CLIENT_SECRET
- Đảm bảo đang dùng đúng credentials cho sandbox/live

### Lỗi "Payment capture failed"
- Kiểm tra tài khoản sandbox có đủ số dư
- Xem log backend để biết chi tiết lỗi

### Frontend không nhận được callback
- Kiểm tra PAYPAL_RETURN_URL và PAYPAL_CANCEL_URL
- Đảm bảo URL accessible từ browser

## Production Deployment

### Chuyển sang Live Mode
1. Tạo Live App trên PayPal Dashboard
2. Cập nhật `.env`:
   ```env
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=live_client_id
   PAYPAL_CLIENT_SECRET=live_secret
   ```
3. Cập nhật return URLs thành production URLs
4. Test kỹ trước khi go-live

### Security Checklist
- ✅ Không commit credentials vào Git
- ✅ Sử dụng HTTPS cho production
- ✅ Validate webhook signatures
- ✅ Implement rate limiting
- ✅ Log tất cả transactions

## Tài liệu tham khảo
- [PayPal REST API](https://developer.paypal.com/api/rest/)
- [PayPal Checkout Integration](https://developer.paypal.com/docs/checkout/)
- [PayPal Sandbox Testing](https://developer.paypal.com/tools/sandbox/)
