import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
