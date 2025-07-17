import { Injectable, BadRequestException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as moment from 'moment';
import { CreateBillDto } from './dto/create-bill.dto';
import { DownloadBillsDto } from './dto/download-bills.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from 'src/utils/enums';
import { Prisma } from '@prisma/client';
import * as archiver from 'archiver';
import { formatCurrency } from 'src/utils/functions';

@Injectable()
export class BillsService {
  constructor(private readonly prismaService: PrismaService) {}

  async generateBillImage(data: CreateBillDto): Promise<Buffer> {
    try {
      // Đọc template HTML
      const templatePath = path.join(__dirname, 'bill-template.html');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      // Compile Handlebars template
      const template = Handlebars.compile(templateContent);

      // Đăng ký helper cho index
      Handlebars.registerHelper('add', function (a, b) {
        return a + b;
      });

      // Chuyển đổi learningDates thành attendances format cho template
      const attendances = (data.learningDates || []).map((date, index) => ({
        learningDate: date,
        index: index + 1,
      }));

      // Chuẩn bị dữ liệu cho template
      const templateData = {
        month: data.month,
        studentName: data.studentName,
        attendances: attendances,
        sessionCount: data.sessionCount || attendances.length.toString(),
        amountPerSession: data.amountPerSession || '0 VNĐ',
        totalAmount: data.totalAmount || `${data.amount} VNĐ`,
      };

      // Render template với dữ liệu
      const html = template(templateData);

      // Khởi tạo Puppeteer với fallback options
      let browser;
      try {
        // Thử với Chrome trước
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          executablePath:
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          ignoreDefaultArgs: ['--disable-extensions'],
        });
      } catch {
        try {
          // Fallback với Edge
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath:
              'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            ignoreDefaultArgs: ['--disable-extensions'],
          });
        } catch {
          // Cuối cùng thử với Puppeteer default
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });
        }
      }

      const page = await browser.newPage();

      // Set viewport để đảm bảo kích thước ảnh phù hợp
      await page.setViewport({
        width: 1000,
        height: 800,
        deviceScaleFactor: 2, // Tăng độ phân giải lên 2x (720p quality)
      });

      // Set content HTML
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Add export mode class to hide background and styling
      await page.evaluate(() => {
        document.body.classList.add('export-mode');
      });

      // Wait for .wrapper to be rendered
      await page.waitForSelector('.wrapper');
      const wrapper = await page.$('.wrapper');
      const boundingBox = await wrapper.boundingBox();
      await page.setViewport({
        width: Math.ceil(boundingBox.width) + 4,
        height: Math.ceil(boundingBox.height) - 1,
        deviceScaleFactor: 2, // Giữ độ phân giải cao
      });

      // Chụp ảnh vừa đúng nội dung với chất lượng cao
      const imageBuffer = (await page.screenshot({
        type: 'png',
        fullPage: false,
        captureBeyondViewport: false,
        omitBackground: false, // Đảm bảo background được render đầy đủ
      })) as Buffer;

      // Đóng browser
      await browser.close();

      return imageBuffer;
    } catch (error) {
      throw new Error(`Lỗi khi tạo hóa đơn: ${error.message}`);
    }
  }

  async downloadAllBills(downloadBillsDto: DownloadBillsDto): Promise<Buffer> {
    try {
      const { name, classId, status, learningMonth, learningYear } =
        downloadBillsDto;

      // Validate required filter parameters
      if (!learningMonth || !learningYear) {
        throw new BadRequestException('Learning month and year are required');
      }

      // Get current class students if classId is provided
      const currentClassStudents = classId
        ? await this.prismaService.studentClass.findMany({
            where: {
              classId: classId,
              status: Status.ACTIVE,
            },
            select: {
              studentId: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            distinct: ['studentId'],
          })
        : [];

      const where: Prisma.PaymentWhereInput = {
        student: {
          name: name ? { contains: name, mode: 'insensitive' } : undefined,
          id: classId
            ? { in: currentClassStudents.map((sc) => sc.studentId) }
            : undefined,
        },
        status: status || undefined,
        createdAt: {
          gte: new Date(learningYear, learningMonth - 1, 1),
          lt: new Date(learningYear, learningMonth, 1),
        },
      };

      // Fetch all payments matching the filter criteria
      const payments = await this.prismaService.payment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              classes: {
                where: {
                  status: Status.ACTIVE,
                },
                select: {
                  class: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  createdAt: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1,
              },
            },
          },
          attendances: {
            include: {
              session: true,
            },
            orderBy: {
              learningDate: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (payments.length === 0) {
        throw new BadRequestException(
          'No payments found matching the filter criteria',
        );
      }

      // Generate bills for each payment
      const billPromises = payments.map(async (payment) => {
        const currentClass = payment.student.classes[0]?.class;

        // Format learning dates as DD/MM/YYYY using moment, only for attended sessions
        const learningDates = payment.attendances
          .filter((attendance) => attendance.isAttend)
          .map((attendance) =>
            moment(attendance.learningDate).format('DD/MM/YYYY'),
          );

        const createBillDto: CreateBillDto = {
          studentName: payment.student.name,
          class: currentClass?.name || '',
          month: moment(payment.createdAt).format('MM/YYYY'),
          amount: payment.totalMonthAmount.toString(),
          learningDates: learningDates,
          sessionCount: payment.totalAttend.toString(),
          amountPerSession: `${formatCurrency(payment.totalMonthAmount / payment.totalAttend)} VNĐ`,
          totalAmount: `${formatCurrency(payment.totalPayment)} VNĐ`,
        };

        const imageBuffer = await this.generateBillImage(createBillDto);

        // Create filename for this bill - preserve Vietnamese characters
        const filename = `${payment.student.name}_${learningMonth}_${learningYear}.png`;

        return {
          filename,
          buffer: imageBuffer,
        };
      });

      const bills = await Promise.all(billPromises);

      // Create ZIP file containing all bills
      return new Promise((resolve, reject) => {
        const archive = archiver('zip', {
          zlib: { level: 9 }, // Sets the compression level
        });

        const chunks: Buffer[] = [];

        archive.on('data', (chunk) => {
          chunks.push(chunk);
        });

        archive.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });

        archive.on('error', (err) => {
          reject(err);
        });

        // Add each bill to the ZIP
        bills.forEach((bill) => {
          archive.append(bill.buffer, { name: bill.filename });
        });

        archive.finalize();
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
