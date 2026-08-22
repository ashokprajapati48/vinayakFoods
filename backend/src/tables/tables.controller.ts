import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TablesService } from './tables.service.js';
import { CreateTableDto, UpdateTableStatusDto } from './dto/table.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTableStatusDto) {
    return this.tablesService.updateStatus(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tablesService.delete(id);
  }
}
