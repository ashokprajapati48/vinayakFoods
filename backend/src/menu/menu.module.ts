import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
