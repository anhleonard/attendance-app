import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { DownloadBillsDto } from './dto/download-bills.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/utils/enums';

@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post('generate')
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateBill(
    @Body() createBillDto: CreateBillDto,
    @Res() res: Response,
  ) {
    try {
      const imageBuffer =
        await this.billsService.generateBillImage(createBillDto);

      // Tạo tên file từ tên học sinh
      const studentName = createBillDto.studentName || 'bill_payment';
      const month = createBillDto.month || 'unknown';
      
      // Format tên file: "Tên học sinh - Tháng/Năm"
      const fileName = `${studentName} - ${month}.png`;

      // Set headers để trả về ảnh với encoding UTF-8
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.setHeader('Content-Length', imageBuffer.length);

      // Trả về ảnh
      res.status(HttpStatus.OK).send(imageBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('download-all')
  @UsePipes(new ValidationPipe({ transform: true }))
  async downloadAllBills(
    @Body() downloadBillsDto: DownloadBillsDto,
    @Res() res: Response,
  ) {
    try {
      const zipBuffer = await this.billsService.downloadAllBills(downloadBillsDto);

      // Create filename based on filter criteria
      const fileName = 'bill-payments.zip';

      // Set headers for ZIP file download with UTF-8 encoding
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.setHeader('Content-Length', zipBuffer.length);

      // Return the ZIP file
      res.status(HttpStatus.OK).send(zipBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
