# Website Ôn tập Toán Lớp 5

Website ôn tập Toán lớp 5 theo chương trình giáo dục Việt Nam - một nền tảng học tập hiện đại, tối giản giúp học sinh lớp 5 rèn luyện tư duy toán học thông qua các chế độ luyện tập đa dạng.

## Tính năng

- **Tư duy**: Bài toán logic, tìm quy luật dãy số, suy luận
- **Tính nhanh**: Luyện tập phép tính với thời gian giới hạn
- **Toán giải**: Bài toán có lời văn với hướng dẫn từng bước
- **Toán cơ bản**: Ôn tập các phép tính cơ bản
- **Kiểm tra**: Đánh giá kiến thức với thang điểm 10
- **Theo dõi tiến độ**: Thống kê và đề xuất ôn tập

## Công nghệ sử dụng

- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- LocalStorage (lưu trữ tiến độ)

## Cài đặt Local

### Yêu cầu

- Node.js 18+ 
- npm hoặc yarn

### Các bước cài đặt

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd math-grade5-practice
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Chạy development server**
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại `http://localhost:5173`

4. **Build cho production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## Scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy development server |
| `npm run build` | Build cho production |
| `npm run preview` | Preview production build |
| `npm run lint` | Kiểm tra lỗi ESLint |
| `npm run test` | Chạy tests |
| `npm run test:watch` | Chạy tests ở chế độ watch |

## Deploy lên Railway

### Cách 1: Deploy từ GitHub (Khuyến nghị)

1. **Push code lên GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Tạo project trên Railway**
   - Truy cập [railway.app](https://railway.app)
   - Đăng nhập bằng GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Chọn repository của bạn

3. **Railway sẽ tự động**
   - Detect cấu hình từ `railway.json`
   - Build và deploy ứng dụng
   - Cung cấp URL public

4. **Cấu hình domain (tùy chọn)**
   - Vào Settings → Domains
   - Thêm custom domain hoặc sử dụng domain Railway cung cấp

### Cách 2: Deploy bằng Railway CLI

1. **Cài đặt Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Đăng nhập**
   ```bash
   railway login
   ```

3. **Khởi tạo project**
   ```bash
   cd math-grade5-practice
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Environment Variables

Railway tự động set biến `PORT`. Nếu cần thêm biến môi trường:

1. Vào Railway Dashboard → Project → Variables
2. Thêm các biến cần thiết

Xem file `.env.example` để biết các biến môi trường có thể cấu hình.

## Cấu trúc thư mục

```
src/
├── components/          # React components
│   ├── common/          # Shared components (Button, Card, Timer)
│   ├── layout/          # Layout components (Header, Footer)
│   ├── modes/           # Practice mode components
│   ├── progress/        # Progress tracking components
│   └── test/            # Test mode components
├── data/                # Question bank data
│   ├── semester1/       # Học kỳ 1 questions
│   └── semester2/       # Học kỳ 2 questions
├── hooks/               # Custom React hooks
├── services/            # Business logic services
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Nội dung theo học kỳ

### Học kỳ 1
- Ôn tập số tự nhiên
- Phân số
- Số thập phân (phần 1)
- Hình học cơ bản

### Học kỳ 2
- Số thập phân (phần 2)
- Tỉ số phần trăm
- Hình học nâng cao
- Ôn tập cuối năm

## License

MIT
