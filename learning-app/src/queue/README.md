# Queue System for Attendance Processing

## Overview

This queue system handles batch attendance processing with Redis-based locking to prevent duplicate processing and ensure data consistency.

## Features

### 🚀 Batch Processing with Redis Locks
- **Unique Batch IDs**: Each batch gets a unique ID based on class, session, and date
- **Redis Locks**: Prevents duplicate batch processing
- **Atomic Operations**: Uses Redis transactions for thread-safe counter management
- **Automatic Cleanup**: Locks are automatically released when all jobs complete

### 🔄 Job Management
- **Duplicate Prevention**: Unique job IDs prevent duplicate attendance records
- **Error Handling**: Failed jobs don't block the entire batch
- **Progress Tracking**: Real-time monitoring of batch completion status

## Architecture

### QueueService
- Manages batch creation and Redis locks
- Generates unique batch IDs
- Handles job queuing with duplicate prevention

### AttendanceProcessor
- Processes individual attendance jobs
- Manages Redis counters atomically
- Handles batch completion and cleanup

## API Endpoints

### Create Batch Attendance
```http
POST /attendances/create-batch
```

**Request Body:**
```json
{
  "classId": 123,
  "sessionId": 456,
  "learningDate": "2024-12-25T00:00:00.000Z",
  "isSelectedAll": true,
  "selectedStudentIds": [1, 2, 3],
  "unselectedStudentIds": [4, 5]
}
```

**Response:**
```json
{
  "batchId": "class-123-session-456-date-25122024",
  "totalJobs": 30,
  "addedJobs": 30,
  "skippedJobs": 0,
  "lockKey": "attendance-batch-lock:class-123-session-456-date-25122024",
  "message": "Batch processing initiated for 30 attendances"
}
```

### Check Batch Status
```http
GET /attendances/batch-status/:batchId
```

**Response:**
```json
{
  "batchId": "class-123-session-456-date-25122024",
  "isLocked": true,
  "lockStatus": "processing",
  "remainingJobs": 15,
  "isCompleted": false
}
```

## Redis Keys

### Lock Keys
- `attendance-batch-lock:{batchId}` - Batch processing lock
- `attendance-batch-counter:{batchId}` - Remaining jobs counter
- `batch-completed:{batchId}` - Completion status (24h TTL)

### Job Keys
- `student-{studentId}-session-{sessionId}-date-{formattedDate}` - Unique job IDs

## Batch ID Format

```
class-{classId}-session-{sessionId}-date-{DDMMYYYY}
```

Example: `class-123-session-456-date-25122024`

## Error Handling

### Duplicate Batch Prevention
- If a batch is already being processed, returns `isSkipped: true`
- Lock expires after 1 hour to prevent deadlocks

### Job Failure Handling
- Failed jobs decrement the counter but don't block the batch
- Batch is marked complete when all jobs are processed (success or failure)

### Redis Transaction Safety
- Uses Redis MULTI/EXEC for atomic counter operations
- Prevents race conditions in concurrent job processing

## Monitoring

### Console Logs
- 🔐 Lock creation and management
- 🔄 Job processing status
- 📊 Counter updates
- 🎉 Batch completion
- ❌ Error handling

### Batch Statistics
- Real-time remaining job count
- Lock status monitoring
- Completion tracking with timestamps

## Usage Example

```typescript
// Create batch attendance
const result = await attendancesService.processBatchAttendances(
  attendances,
  user
);

// Monitor progress
const status = await attendancesService.getBatchStatus(result.batchId);
console.log(`Remaining jobs: ${status.remainingJobs}`);
```

## Configuration

### Redis Connection
```typescript
RedisModule.forRoot({
  type: 'single',
  url: 'redis://localhost:6379',
})
```

### BullMQ Configuration
```typescript
BullModule.forRoot({
  connection: {
    host: 'localhost',
    port: 6379,
  },
})
```

## Security

- All endpoints require authentication and proper permissions
- Batch IDs are validated to ensure same class, session, and date
- Redis keys have TTL to prevent memory leaks
- Atomic operations prevent race conditions 