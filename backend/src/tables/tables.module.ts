import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller.js';
import { TablesService } from './tables.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
