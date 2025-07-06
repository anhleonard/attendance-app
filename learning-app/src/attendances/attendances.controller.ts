import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permissions } from 'src/auth/decorators/permission.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { TokenPayload } from 'src/auth/token-payload/token-payload.auth';
import { Permission, Role, Status } from 'src/utils/enums';
import { CreateAttendance } from 'src/utils/interfaces';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueueService } from 'src/queue/queue.service';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';
import { UpdateBatchAttendanceDto } from './dto/update-batch-attendance.dto';
import { CreateBatchAttendanceDto } from './dto/create-batch-attendance.dto';
import { StudentsService } from 'src/students/students.service';

@Controller('attendances')
export class AttendancesController {
  constructor(
    private readonly attendancesService: AttendancesService,
    private readonly queueService: QueueService,
    private readonly studentsService: StudentsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_ATTENDANCE)
  @Post('/create')
  createAttendance(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.attendancesService.createAttendance(createAttendanceDto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_ATTENDANCE)
  @Post('/create-batch')
  async createBatchAttendances(
    @Body() createBatchAttendanceDto: CreateBatchAttendanceDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const {
      classId,
      sessionId,
      learningDate,
      isSelectedAll,
      selectedStudentIds,
      unselectedStudentIds,
    } = createBatchAttendanceDto;

    // Lấy tất cả students trong class
    const studentsResult = await this.studentsService.findStudents({
      classId,
      studentClassStatus: Status.ACTIVE,
      fetchAll: true,
    } as any);
    
    const allStudents = studentsResult.data;
    
    // Convert thành array của CreateAttendance cho tất cả students
    const attendances: CreateAttendance[] = allStudents.map(student => {
      let isAttend = true; // Mặc định là có mặt
      
      if (isSelectedAll) {
        // Nếu chọn tất cả, những student trong unselectedStudentIds sẽ có isAttend = false
        if (unselectedStudentIds?.includes(student.id)) {
          isAttend = false;
        }
      } else {
        // Nếu không chọn tất cả, chỉ những student trong selectedStudentIds mới có isAttend = true
        isAttend = selectedStudentIds?.includes(student.id) || false;
      }
      
      return {
        studentId: student.id,
        sessionId,
        classId,
        learningDate,
        isAttend,
        noteAttendance: '',
      };
    });

    // Use the new service method for batch processing
    return this.attendancesService.processBatchAttendances(attendances, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_ATTENDANCE)
  @Get('/batch-status/:batchId')
  getBatchStatus(@Param('batchId') batchId: string) {
    return this.attendancesService.getBatchStatus(batchId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_ATTENDANCE)
  @Post('/update')
  updateAttendance(
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.attendancesService.updateAttendance(updateAttendanceDto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_ATTENDANCE)
  @Post('/find-attendances')
  findAttendances(@Body() filterAttendanceDto: FilterAttendanceDto) {
    return this.attendancesService.findAttendances(filterAttendanceDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/update-batch')
  updateBatchAttendances(
    @Body() updateBatchAttendanceDto: UpdateBatchAttendanceDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.attendancesService.updateBatchAttendances(
      updateBatchAttendanceDto,
      user,
    );
  }
}
