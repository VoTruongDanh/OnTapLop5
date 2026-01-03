# Hướng dẫn Setup Google Sheets để lưu kết quả học sinh

## Bước 1: Tạo Google Spreadsheet

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo một Spreadsheet mới
3. Đặt tên: "Kết quả học tập Toán lớp 5"
4. Tạo 2 sheet:
   - Sheet 1: Đổi tên thành `KetQuaKiemTra`
   - Sheet 2: Đổi tên thành `KetQuaLuyenTap`

### Cấu trúc Sheet "KetQuaKiemTra":
Thêm header ở hàng 1:
```
A1: Thời gian
B1: Họ tên
C1: Lớp
D1: Học kỳ
E1: Chủ đề
F1: Điểm
G1: Số câu đúng
H1: Tổng câu
I1: Tỉ lệ %
J1: Thời gian làm
K1: Test ID
```

### Cấu trúc Sheet "KetQuaLuyenTap":
Thêm header ở hàng 1:
```
A1: Thời gian
B1: Họ tên
C1: Lớp
D1: Chế độ
E1: Số câu
F1: Đúng
G1: Tỉ lệ %
H1: Thời gian
```

## Bước 2: Tạo Google Apps Script

1. Trong Google Sheets, vào menu **Extensions > Apps Script**
2. Xóa code mặc định và paste code sau:

```javascript
// Google Apps Script để nhận dữ liệu từ ứng dụng Math Grade 5

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.data;
    
    if (action === 'submitTest') {
      return submitTestResult(payload);
    } else if (action === 'submitPractice') {
      return submitPracticeResult(payload);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function submitTestResult(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('KetQuaKiemTra');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet KetQuaKiemTra not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Format date for Vietnam timezone
  const date = new Date(data.date);
  const vnDate = Utilities.formatDate(date, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
  
  // Append row
  sheet.appendRow([
    vnDate,
    data.studentName,
    data.studentClass,
    'HK' + data.semester,
    data.topics,
    data.score,
    data.correctAnswers,
    data.totalQuestions,
    data.accuracy + '%',
    data.timeSpentFormatted,
    data.testId
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true
  })).setMimeType(ContentService.MimeType.JSON);
}

function submitPracticeResult(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('KetQuaLuyenTap');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet KetQuaLuyenTap not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const date = new Date(data.date);
  const vnDate = Utilities.formatDate(date, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
  
  const modeLabels = {
    'tu-duy': 'Tư duy',
    'tinh-nhanh': 'Tính nhanh',
    'toan-giai': 'Toán giải',
    'toan-co-ban': 'Toán cơ bản'
  };
  
  sheet.appendRow([
    vnDate,
    data.studentName,
    data.studentClass,
    modeLabels[data.mode] || data.mode,
    data.questionsAttempted,
    data.correctAnswers,
    data.accuracy + '%',
    data.timeSpentFormatted
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true
  })).setMimeType(ContentService.MimeType.JSON);
}

// Test function
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'OK',
    message: 'Math Grade 5 API is running'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

3. Lưu file (Ctrl+S)
4. Đặt tên project: "Math Grade 5 API"

## Bước 3: Deploy Apps Script

1. Click **Deploy > New deployment**
2. Chọn type: **Web app**
3. Cấu hình:
   - Description: "Math Grade 5 Results API"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. **Authorize** khi được hỏi (chọn tài khoản Google của bạn)
6. Copy **Web app URL** (dạng: `https://script.google.com/macros/s/xxx/exec`)

## Bước 4: Cấu hình ứng dụng

### Cách 1: Dùng file .env (khuyến nghị cho development)

1. Tạo file `.env` trong thư mục `math-grade5-practice`:
```
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

2. Thay `YOUR_SCRIPT_ID` bằng URL bạn copy ở bước 3

### Cách 2: Cấu hình trên Railway (cho production)

1. Vào Railway dashboard
2. Chọn project của bạn
3. Vào tab **Variables**
4. Thêm biến:
   - Key: `VITE_GOOGLE_SCRIPT_URL`
   - Value: URL từ bước 3
5. Redeploy

## Bước 5: Test

1. Chạy ứng dụng: `npm run dev`
2. Vào trang Kiểm tra
3. Nhập tên học sinh
4. Làm bài và nộp
5. Kiểm tra Google Sheets - kết quả sẽ xuất hiện trong sheet

## Xem dữ liệu (Admin)

- Mở Google Sheets để xem tất cả kết quả
- Có thể lọc, sắp xếp, tạo biểu đồ
- Chia sẻ với giáo viên khác nếu cần

## Lưu ý

- Dữ liệu được gửi realtime khi học sinh nộp bài
- Nếu mất mạng, dữ liệu vẫn lưu local, nhưng không gửi lên Sheets
- Google Sheets miễn phí có giới hạn 10 triệu ô
- Nên backup định kỳ

## Troubleshooting

### Không thấy dữ liệu trong Sheets
1. Kiểm tra URL trong .env đúng chưa
2. Kiểm tra đã deploy Apps Script chưa
3. Mở Console (F12) xem có lỗi không

### Lỗi CORS
- Apps Script đã được cấu hình `no-cors`, không nên có lỗi này
- Nếu vẫn lỗi, kiểm tra lại cấu hình "Who has access" = "Anyone"

### Lỗi Authorization
1. Vào Apps Script
2. Run function `doGet` một lần để authorize
3. Deploy lại
