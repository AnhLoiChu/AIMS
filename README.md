# AIMS - Advanced Inventory Management System

## Giới thiệu

AIMS (Advanced Inventory Management System) là một hệ thống quản lý bán hàng trực tuyến toàn diện, được xây dựng với kiến trúc Full-stack hiện đại.

## Công nghệ sử dụng

### Frontend
- **Framework**: React + TypeScript + Vite
- **UI Library**: shadcn-ui
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT

## Phân công công việc

| Thành viên | MSSV | Phần việc |
|------------|------|-----------|
| **Phạm Công Sơn** | 20205220 | Pay Order (VietQR + PayPal), View Order History, Send Notification Email |
| **Nguyễn Hữu Mạnh** | 20205213 | Place Order, Search and Filter Product, View Product Details, All Product, Frontend Mainboard, Backend |
| **Chu Anh Lợi** | 20215280 | Add/Edit Product, Frontend (UI - giao diện) |
| **Phạm Trường Dương** | 20226105 | View Product Detail |

## Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js >= 18.x
- npm hoặc yarn
- PostgreSQL

### Backend

```bash
# Di chuyển vào thư mục Backend
cd Backend

# Cài đặt dependencies
npm install

# Chạy ở chế độ development
npm run start:dev

# Chạy ở chế độ production
npm run start:prod
```

### Frontend

```bash
# Di chuyển vào thư mục Frontend
cd Frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build
```

### Docker (Optional)

```bash
# Chạy postgres với Docker Compose
docker-compose up -d
```

## Cấu trúc dự án

```
AIMS/
├── Backend/           # NestJS Backend API
│   ├── src/
│   │   ├── modules/   # Feature modules
│   │   ├── config/    # Configuration files
│   │   └── database/  # Database migrations & seeders
│   └── package.json
├── Frontend/          # React Frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   └── package.json
└── docker-compose.yml
```

## Tính năng chính

### Quản lý sản phẩm
- ✅ Thêm/Sửa/Xóa sản phẩm (Book, CD, DVD, News)
- ✅ Xem chi tiết sản phẩm
- ✅ Tìm kiếm và lọc sản phẩm
- ✅ Quản lý danh mục sản phẩm

### Quản lý đơn hàng
- ✅ Đặt hàng
- ✅ Xem lịch sử đơn hàng
- ✅ Phê duyệt/Từ chối đơn hàng (Admin)

### Thanh toán
- ✅ Thanh toán qua VietQR
- ✅ Thanh toán qua PayPal
- ✅ Gửi email thông báo đơn hàng

### Quản lý người dùng
- ✅ Đăng nhập/Đăng ký
- ✅ Phân quyền (Admin, Product Manager, Customer)
- ✅ Quản lý thông tin cá nhân

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo Pull Request hoặc Issue nếu bạn phát hiện lỗi hoặc có đề xuất cải tiến.

## License

MIT License

## Liên hệ

- **Phạm Công Sơn**: phamcongson297@gmail.com
- **Nguyễn Hữu Mạnh**: hmanhng@icloud.com
- **Chu Anh Lợi**: chuanhloilee@gmail.com
- **Phạm Trường Dương**:
