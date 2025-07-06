import { Body, Controller, Post } from '@nestjs/common';
import { HistoriesService } from './histories.service';
import { FilterHistoryDto } from './dto/filter-history.dto';

@Controller('histories')
export class HistoriesController {
  constructor(private readonly historiesService: HistoriesService) {}

  @Post('/find-histories')
  findHistories(@Body() filterHistoryDto: FilterHistoryDto) {
    return this.historiesService.findHistories(filterHistoryDto);
  }
}
