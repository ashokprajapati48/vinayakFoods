import { Module } from '@nestjs/common';
import { CreditController } from './credit.controller.js';
import { CreditService } from './credit.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
