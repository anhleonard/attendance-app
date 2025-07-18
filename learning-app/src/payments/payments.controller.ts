import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/utils/enums';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import { FindDetailPaymentDto } from './dto/find-detail-payment.dto';
import { UpdateBatchPaymentsDto } from './dto/update-batch-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/update')
  updatePayment(@Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.updatePayment(updatePaymentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/find-detail')
  findDetailPayment(@Body() findDetailPaymentDto: FindDetailPaymentDto) {
    return this.paymentsService.findDetailPayment(findDetailPaymentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/find-payments')
  findPayments(@Body() filterPaymentDto: FilterPaymentDto) {
    return this.paymentsService.findPayments(filterPaymentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/update-batch')
  updateBatchPayments(@Body() updateBatchPaymentsDto: UpdateBatchPaymentsDto) {
    return this.paymentsService.updateBatchPayments(updateBatchPaymentsDto);
  }
}
