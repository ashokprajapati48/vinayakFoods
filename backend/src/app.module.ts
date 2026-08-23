import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { MenuModule } from './menu/menu.module.js';
import { TablesModule } from './tables/tables.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { CreditModule } from './credit/credit.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { StaffModule } from './staff/staff.module.js';
import { ReportsModule } from './reports/reports.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GatewayModule,
    MenuModule,
    TablesModule,
    CustomersModule,
    OrdersModule,
    PaymentsModule,
    CreditModule,
    ExpensesModule,
    StaffModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

