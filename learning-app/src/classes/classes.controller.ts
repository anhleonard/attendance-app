import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ClassesService, CalendarResponse } from './classes.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Permission, Role } from 'src/utils/enums';
import { TokenPayload } from 'src/auth/token-payload/token-payload.auth';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { FilterClassDto } from './dto/filter-class.dto';
import { GetCalendarDto } from './dto/get-calendar.dto';
import { Permissions } from 'src/auth/decorators/permission.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_CLASS)
  @Post('/find')
  findStudent(@Body('id') id: number) {
    return this.classesService.findClass(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_CLASS)
  @Post('/create')
  createClass(
    @Body() createClassDto: CreateClassDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.classesService.createClass(createClassDto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_CLASS)
  @Post('/update')
  updateClass(@Body() updateClassDto: UpdateClassDto) {
    return this.classesService.updateClass(updateClassDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_CLASS)
  @Post('/find-classes')
  findClasses(@Body() filterClassDto: FilterClassDto) {
    return this.classesService.findClasses(filterClassDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.TA)
  @Permissions(Permission.CREATE_CLASS)
  @Post('/calendar')
  getCalendar(
    @Body() getCalendarDto: GetCalendarDto,
  ): Promise<CalendarResponse> {
    return this.classesService.getCalendar(
      getCalendarDto.year,
      getCalendarDto.month,
    );
  }
}
