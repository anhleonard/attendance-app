# Session Schedule Management

## Tổng quan

Hệ thống đã được cập nhật để hỗ trợ thay đổi lịch học với việc lưu trữ lịch sử. Logic thay đổi lịch học đã được **tích hợp vào hàm `updateClass`** thay vì tạo API riêng biệt.

Khi một lớp thay đổi lịch học, hệ thống sẽ:

1. **Tự động detect** khi nào cần tạo session mới
2. **Tạo bản ghi mới** cho lịch học mới
3. **Cập nhật `validTo`** của lịch học cũ
4. **Giữ nguyên lịch sử** để có thể xem lại

## Các trường mới trong Session

- `validFrom`: Ngày bắt đầu có hiệu lực của lịch học
- `validTo`: Ngày kết thúc hiệu lực của lịch học (null = vô thời hạn)

## API Endpoint

### Cập nhật lớp (bao gồm thay đổi lịch học)

**Endpoint:** `POST /classes/update`

**Body:**
```json
{
  "id": 1,
  "name": "Lớp Toán 10A",
  "description": "Lớp học toán nâng cao",
  "status": "ACTIVE",
  "sessions": [
    {
      "sessionKey": "SESSION_2",
      "startTime": "15:00",
      "endTime": "17:00",
      "amount": 250000
    },
    {
      "sessionKey": "SESSION_4", 
      "startTime": "14:00",
      "endTime": "16:00",
      "amount": 200000
    }
  ]
}
```

## Logic hoạt động

### 1. **Kiểm tra thay đổi**
Hệ thống sẽ so sánh sessions hiện tại với sessions mới:

```typescript
const hasChanges = 
  existingSession.startTime !== session.startTime ||
  existingSession.endTime !== session.endTime ||
  existingSession.amount !== session.amount;
```

### 2. **Nếu không có thay đổi**
- Giữ nguyên session hiện tại
- Không tạo bản ghi mới

### 3. **Nếu có thay đổi**
- **Đóng session cũ**: Cập nhật `validTo = hôm nay - 1 ngày`
- **Tạo session mới**: Với `validFrom = hôm nay`, `validTo = null`

### 4. **Nếu session bị xóa**
- **Đóng session cũ**: Cập nhật `validTo = hôm nay - 1 ngày`

## Ví dụ thực tế

### **Trước khi update:**
```
Session 1: Thứ 2, 14:00-16:00, 200k, validFrom: 2024-01-01, validTo: null
Session 2: Thứ 4, 14:00-16:00, 200k, validFrom: 2024-01-01, validTo: null
```

### **Sau khi update (thay đổi thứ 2 → thứ 3, thêm thứ 6):**
```json
{
  "sessions": [
    {
      "sessionKey": "SESSION_2", // Thứ 3 thay vì thứ 2
      "startTime": "15:00",      // Thay đổi giờ
      "endTime": "17:00",
      "amount": 250000           // Thay đổi học phí
    },
    {
      "sessionKey": "SESSION_4", // Giữ nguyên thứ 4
      "startTime": "14:00",
      "endTime": "16:00", 
      "amount": 200000
    },
    {
      "sessionKey": "SESSION_5", // Thêm thứ 6
      "startTime": "16:00",
      "endTime": "18:00",
      "amount": 180000
    }
  ]
}
```

### **Kết quả:**
```
Session 1: Thứ 2, 14:00-16:00, 200k, validFrom: 2024-01-01, validTo: 2024-01-14 23:59:59
Session 2: Thứ 4, 14:00-16:00, 200k, validFrom: 2024-01-01, validTo: null (không đổi)
Session 3: Thứ 3, 15:00-17:00, 250k, validFrom: 2024-01-15, validTo: null (mới)
Session 4: Thứ 6, 16:00-18:00, 180k, validFrom: 2024-01-15, validTo: null (mới)
```

## Các hàm đã được cập nhật

### 1. `updateClass()`
- ✅ Tự động detect thay đổi lịch học
- ✅ Tạo session mới khi cần thiết
- ✅ Đóng session cũ với `validTo`
- ✅ Giữ nguyên session không thay đổi

### 2. `getCalendar()`
- ✅ Hiển thị lịch học đúng theo `validFrom` và `validTo`
- ✅ Có thể xem lịch sử lịch học trong tháng

### 3. `findClasses()`
- ✅ Tìm kiếm lớp theo lịch học hiện tại
- ✅ Hỗ trợ tìm kiếm theo ngày cụ thể

### 4. `createAttendance()`
- ✅ Tạo điểm danh theo session đúng thời điểm

### 5. `updateBatchAttendances()`
- ✅ Cập nhật điểm danh theo session đúng thời điểm

## Lưu ý quan trọng

1. **Tự động detect**: Không cần chỉ định khi nào tạo mới, hệ thống tự detect
2. **Không xóa session cũ**: Chỉ cập nhật `validTo` để giữ lịch sử
3. **Attendance records**: Vẫn link với session gốc, không bị ảnh hưởng
4. **Payment calculation**: Dựa trên session đúng thời điểm
5. **Permission**: Chỉ admin/TA tạo lớp mới có thể thay đổi lịch học
6. **Hiệu lực ngay lập tức**: Lịch mới có hiệu lực từ ngày update

## Ưu điểm của cách tiếp cận mới

1. **Đơn giản hóa API**: Chỉ cần 1 endpoint thay vì nhiều endpoint
2. **Tự động hóa**: Không cần quyết định khi nào tạo mới
3. **Nhất quán**: Logic thống nhất trong 1 hàm
4. **Dễ sử dụng**: Frontend chỉ cần gọi 1 API 