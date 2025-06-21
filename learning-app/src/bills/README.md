# Bills Module - Puppeteer + Handlebars Integration

Module này sử dụng Puppeteer và Handlebars để tạo hóa đơn học phí từ template HTML và trả về dưới dạng ảnh PNG.

## Cách sử dụng

### 1. API Endpoints

#### Tạo và download hóa đơn

```http
POST /bills/generate
Content-Type: application/json

{
  "studentName": "Nguyễn Văn A",
  "class": "12A1",
  "month": "06/2025",
  "amount": "3000000",
  "learningDates": [
    "01/06/2025",
    "03/06/2025"
  ],
  "sessionCount": "2",
  "amountPerSession": "1.500.000 VNĐ",
  "totalAmount": "3.000.000 VNĐ"
}
```

#### Xem preview hóa đơn (không download)

```http
POST /bills/preview
Content-Type: application/json

{
  "studentName": "Trần Thị B",
  "class": "11B2",
  "month": "07/2025",
  "amount": "2500000",
  "learningDates": [
    "02/07/2025"
  ],
  "sessionCount": "1",
  "amountPerSession": "2.500.000 VNĐ",
  "totalAmount": "2.500.000 VNĐ"
}
```

### 2. Dữ liệu đầu vào

#### Fields bắt buộc:

- `studentName`: Họ tên học sinh (string)
- `class`: Lớp học (string)
- `month`: Tháng học phí (string)
- `amount`: Số tiền học phí (string - chỉ chứa số)

#### Fields tùy chọn:

- `learningDates`: Array các ngày học (string[])
- `sessionCount`: Tổng số buổi học (string) - tự động tính từ learningDates nếu không cung cấp
- `amountPerSession`: Học phí mỗi buổi (string)
- `totalAmount`: Tổng tiền (string)

### 3. Kết quả

- Trả về ảnh PNG với thông tin hóa đơn chi tiết
- Ảnh được tạo từ Handlebars template với styling đẹp
- Hiển thị danh sách các buổi học
- Hiển thị thông tin tổng kết và thông tin ngân hàng

### 4. Cấu trúc file

```
src/bills/
├── bill-template.html     # Handlebars template cho hóa đơn
├── bills.controller.ts    # Controller xử lý request
├── bills.service.ts       # Service sử dụng Puppeteer + Handlebars
├── bills.module.ts        # Module configuration
├── dto/
│   └── create-bill.dto.ts # DTO validation chính
├── bills.controller.spec.ts # Unit tests
├── example-requests.http  # API test examples
└── README.md              # Hướng dẫn sử dụng
```

### 5. Tính năng

- ✅ Tạo hóa đơn từ Handlebars template
- ✅ Hỗ trợ loops và conditional rendering
- ✅ Validation dữ liệu đầu vào với array validation
- ✅ Tự động fallback cho missing fields
- ✅ Tự động tính sessionCount từ learningDates
- ✅ Trả về ảnh PNG chất lượng cao
- ✅ Error handling
- ✅ Download hoặc preview ảnh

### 6. Template Features

- **Handlebars syntax**: `{{#each}}`, `{{@indexPlus1}}`, `{{variable}}`
- **Responsive design**: CSS styling chuyên nghiệp
- **Dynamic content**: Danh sách buổi học, tổng kết
- **Banking info**: Thông tin chuyển khoản

### 7. Lưu ý

- Đảm bảo đã cài đặt: `npm install puppeteer handlebars @types/handlebars`
- Template sử dụng Handlebars syntax, không phải simple string replacement
- `learningDates` là array đơn giản của strings, dễ sử dụng hơn object array
- `sessionCount` tự động được tính từ `learningDates.length` nếu không cung cấp
- Chỉ cần `studentName` - không cần truyền cả `name` và `studentName`
- Có thể tùy chỉnh template theo nhu cầu
- Validation tự động cho string arrays
