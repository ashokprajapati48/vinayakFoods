import { PrismaClient, Kitchen } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/restaurant_db?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database with official restaurant menu...\n');

  // ──────────────────────────────────────────────
  // 1. Create default users
  // ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const cashierHash = await bcrypt.hash('Cashier@123', 10);
  const kitchen1Hash = await bcrypt.hash('Kitchen1@123', 10);
  const kitchen2Hash = await bcrypt.hash('Kitchen2@123', 10);
  const waiterHash = await bcrypt.hash('Waiter@123', 10);

  const users = [
    { username: 'admin', passwordHash, displayName: 'Administrator', role: 'ADMIN' as const },
    { username: 'cashier', passwordHash: cashierHash, displayName: 'Cashier', role: 'CASHIER' as const },
    { username: 'kitchen1', passwordHash: kitchen1Hash, displayName: 'Kitchen 1 (Non-Veg, Chinese, Gravies, Biryani)', role: 'KITCHEN1' as const },
    { username: 'kitchen2', passwordHash: kitchen2Hash, displayName: 'Kitchen 2 (Breakfast, Parathas, Veg Thali, Drinks)', role: 'KITCHEN2' as const },
    { username: 'waiter', passwordHash: waiterHash, displayName: 'Waiter', role: 'WAITER' as const },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: { displayName: user.displayName },
      create: user,
    });
    console.log(`  ✅ User: ${user.username} (${user.role})`);
  }

  // ──────────────────────────────────────────────
  // 2. Create tables (1-20)
  // ──────────────────────────────────────────────
  for (let i = 1; i <= 20; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        capacity: i <= 10 ? 4 : 6,
      },
    });
  }
  console.log('  ✅ Tables: 1-20 created');

  // ──────────────────────────────────────────────
  // 3. Clear existing Menu Items & Categories to rebuild clean
  // ──────────────────────────────────────────────
  await prisma.orderItem.deleteMany({});
  await prisma.kitchenOrder.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});

  // ──────────────────────────────────────────────
  // 4. Create Menu Categories
  // ──────────────────────────────────────────────
  const categories = [
    // KITCHEN 2 (K2) Categories
    { name: 'Breakfast (Veg)', sortOrder: 1 },
    { name: 'Paratha & Roti', sortOrder: 2 },
    { name: 'Veg Main Course (K2)', sortOrder: 3 },
    { name: 'Drinks & Beverages', sortOrder: 4 },

    // KITCHEN 1 (K1) Categories
    { name: 'Breakfast (Egg & Non-Veg)', sortOrder: 5 },
    { name: 'Soup', sortOrder: 6 },
    { name: 'Chinese Starters', sortOrder: 7 },
    { name: 'Chinese Rice', sortOrder: 8 },
    { name: 'Chinese Noodles', sortOrder: 9 },
    { name: 'Veg Rice & Biryani', sortOrder: 10 },
    { name: 'Non-Veg Rice & Biryani', sortOrder: 11 },
    { name: 'Veg Main Course', sortOrder: 12 },
    { name: 'Non-Veg Main Course', sortOrder: 13 },
    { name: 'Bulk / Catering (1Kg)', sortOrder: 14 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.create({
      data: cat,
    });
    categoryMap[cat.name] = created.id;
  }
  console.log('  ✅ 14 Menu categories created');

  // ──────────────────────────────────────────────
  // 5. Create Menu Items with exact Kitchen Routing & Pricing
  // ──────────────────────────────────────────────
  const menuItems = [
    // ==========================================
    // KITCHEN 2 (K2) ITEMS
    // ==========================================
    // 1. Breakfast (Veg)
    { name: 'Misal Pav', price: 50, kitchen: Kitchen.KITCHEN_2, category: 'Breakfast (Veg)', sortOrder: 1 },
    { name: 'Poha / Upma', price: 25, kitchen: Kitchen.KITCHEN_2, category: 'Breakfast (Veg)', sortOrder: 2 },
    { name: 'Puri Bhaji', price: 50, kitchen: Kitchen.KITCHEN_2, category: 'Breakfast (Veg)', sortOrder: 3 },
    { name: 'Sheera', price: 30, kitchen: Kitchen.KITCHEN_2, category: 'Breakfast (Veg)', sortOrder: 4 },

    // 2. Paratha & Roti
    { name: 'Sada Paratha', price: 25, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 1 },
    { name: 'Masala Paratha', price: 30, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 2 },
    { name: 'Aloo Paratha', price: 40, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 3 },
    { name: 'Onion Paratha', price: 40, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 4 },
    { name: 'Paneer Paratha', price: 50, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 5 },
    { name: 'Methi Paratha', price: 45, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 6 },
    { name: 'Cabbage Paratha', price: 45, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 7 },
    { name: 'Muli Paratha', price: 45, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 8 },
    { name: 'Chapati', price: 7, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 9 },
    { name: 'Puri', price: 7, kitchen: Kitchen.KITCHEN_2, category: 'Paratha & Roti', sortOrder: 10 },

    // 3. Veg Main Course (K2)
    { name: 'Veg Thali', price: 80, kitchen: Kitchen.KITCHEN_2, category: 'Veg Main Course (K2)', sortOrder: 1 },
    { name: 'Sev Bhaji', price: 110, kitchen: Kitchen.KITCHEN_2, category: 'Veg Main Course (K2)', sortOrder: 2 },
    { name: 'Aloo Jeera', price: 90, kitchen: Kitchen.KITCHEN_2, category: 'Veg Main Course (K2)', sortOrder: 3 },

    // 4. Drinks & Beverages
    { name: 'Tea', price: 15, kitchen: Kitchen.KITCHEN_2, category: 'Drinks & Beverages', sortOrder: 1 },
    { name: 'Coffee', price: 20, kitchen: Kitchen.KITCHEN_2, category: 'Drinks & Beverages', sortOrder: 2 },
    { name: 'Chaas', price: 15, kitchen: Kitchen.KITCHEN_2, category: 'Drinks & Beverages', sortOrder: 3 },
    { name: 'Lassi Sweet', price: 25, kitchen: Kitchen.KITCHEN_2, category: 'Drinks & Beverages', sortOrder: 4 },
    { name: 'Cold Drink', price: 20, kitchen: Kitchen.KITCHEN_2, category: 'Drinks & Beverages', sortOrder: 5 },

    // ==========================================
    // KITCHEN 1 (K1) ITEMS
    // ==========================================
    // 5. Breakfast (Egg & Non-Veg)
    { name: 'Bhurji Pav', price: 55, kitchen: Kitchen.KITCHEN_1, category: 'Breakfast (Egg & Non-Veg)', sortOrder: 1 },
    { name: 'Omlet Pav', price: 50, kitchen: Kitchen.KITCHEN_1, category: 'Breakfast (Egg & Non-Veg)', sortOrder: 2 },
    { name: 'Anda Pav', price: 40, kitchen: Kitchen.KITCHEN_1, category: 'Breakfast (Egg & Non-Veg)', sortOrder: 3 },
    { name: 'Kheema Pav', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Breakfast (Egg & Non-Veg)', sortOrder: 4 },

    // 6. Soup
    { name: 'Tomato Soup', price: 70, kitchen: Kitchen.KITCHEN_1, category: 'Soup', sortOrder: 1 },
    { name: 'Veg Clear Soup', price: 70, kitchen: Kitchen.KITCHEN_1, category: 'Soup', sortOrder: 2 },
    { name: 'Veg Manchow Soup', price: 70, kitchen: Kitchen.KITCHEN_1, category: 'Soup', sortOrder: 3 },
    { name: 'Veg Hot & Sour Soup', price: 70, kitchen: Kitchen.KITCHEN_1, category: 'Soup', sortOrder: 4 },
    { name: 'Chicken Clear Soup', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Soup', sortOrder: 5 },
    { name: 'Chicken Manchow Soup', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Soup', sortOrder: 6 },
    { name: 'Chicken Hot & Sour Soup', price: 90, kitchen: Kitchen.KITCHEN_1, category: 'Soup', sortOrder: 7 },
    { name: 'Egg Manchow Soup', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Soup', sortOrder: 8 },

    // 7. Chinese Starters
    { name: 'Veg Chilly', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 1 },
    { name: 'Veg Crispy', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 2 },
    { name: 'Veg Manchurian', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 3 },
    { name: 'Paneer Chilly', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 4 },
    { name: 'Paneer 65', price: 190, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 5 },
    { name: 'Paneer Crispy', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 6 },
    { name: 'Soyabean Dry', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 7 },
    { name: 'Chicken Manchurian', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 8 },
    { name: 'Chicken Lollypop', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 9 },
    { name: 'Chicken Chilly', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 10 },
    { name: 'Chicken 65', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 11 },
    { name: 'Chicken Schezwan Dry', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 12 },
    { name: 'Chicken Crispy', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Starters', sortOrder: 13 },

    // 8. Chinese Rice (Half & Full)
    { name: 'Veg Fried Rice (Half)', price: 75, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 1 },
    { name: 'Veg Fried Rice (Full)', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 2 },
    { name: 'Veg Schezwan Rice (Half)', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 3 },
    { name: 'Veg Schezwan Rice (Full)', price: 140, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 4 },
    { name: 'Veg Singapuri Rice (Half)', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 5 },
    { name: 'Veg Singapuri Rice (Full)', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 6 },
    { name: 'Veg Triple Schezwan Rice (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 7 },
    { name: 'Veg Triple Schezwan Rice (Full)', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 8 },
    { name: 'Veg Manchurian Rice (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 9 },
    { name: 'Veg Manchurian Rice (Full)', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 10 },
    { name: 'Paneer Fried Rice (Half)', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 11 },
    { name: 'Paneer Fried Rice (Full)', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 12 },
    { name: 'Paneer Schezwan Rice (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 13 },
    { name: 'Paneer Schezwan Rice (Full)', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 14 },
    { name: 'Paneer Triple Schezwan Rice (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 15 },
    { name: 'Paneer Triple Schezwan Rice (Full)', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 16 },
    { name: 'Combination Rice (Half)', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 17 },
    { name: 'Combination Rice (Full)', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 18 },
    { name: 'Egg Fried Rice (Half)', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 19 },
    { name: 'Egg Fried Rice (Full)', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 20 },
    { name: 'Chicken Fried Rice (Half)', price: 85, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 21 },
    { name: 'Chicken Fried Rice (Full)', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 22 },
    { name: 'Chicken Schezwan Rice (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 23 },
    { name: 'Chicken Schezwan Rice (Full)', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 24 },
    { name: 'Chicken Singapuri Rice (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 25 },
    { name: 'Chicken Singapuri Rice (Full)', price: 190, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 26 },
    { name: 'Chicken Manchurian Rice (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 27 },
    { name: 'Chicken Manchurian Rice (Full)', price: 200, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 28 },
    { name: 'Chicken Triple Schezwan Rice (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 29 },
    { name: 'Chicken Triple Schezwan Rice (Full)', price: 190, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 30 },
    { name: 'Chicken Chopper Rice (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 31 },
    { name: 'Chicken Chopper Rice (Full)', price: 190, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Rice', sortOrder: 32 },

    // 9. Chinese Noodles (Half & Full)
    { name: 'Veg Noodles (Half)', price: 70, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 1 },
    { name: 'Veg Noodles (Full)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 2 },
    { name: 'Veg Hakka Noodles (Half)', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 3 },
    { name: 'Veg Hakka Noodles (Full)', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 4 },
    { name: 'Veg Schezwan Noodles (Half)', price: 85, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 5 },
    { name: 'Veg Schezwan Noodles (Full)', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 6 },
    { name: 'Veg Singapore Noodles (Half)', price: 85, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 7 },
    { name: 'Veg Singapore Noodles (Full)', price: 130, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 8 },
    { name: 'Veg Triple Schezwan Noodles (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 9 },
    { name: 'Veg Triple Schezwan Noodles (Full)', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 10 },
    { name: 'Veg Manchurian Noodles (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 11 },
    { name: 'Veg Manchurian Noodles (Full)', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 12 },
    { name: 'Paneer Hakka Noodles (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 13 },
    { name: 'Paneer Hakka Noodles (Full)', price: 130, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 14 },
    { name: 'Chicken Hakka Noodles (Half)', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 15 },
    { name: 'Chicken Hakka Noodles (Full)', price: 140, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 16 },
    { name: 'Chicken Schezwan Noodles (Half)', price: 90, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 17 },
    { name: 'Chicken Schezwan Noodles (Full)', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 18 },
    { name: 'Chicken Singapore Noodles (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 19 },
    { name: 'Chicken Singapore Noodles (Full)', price: 130, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 20 },
    { name: 'Chicken Triple Schezwan Noodles (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 21 },
    { name: 'Chicken Triple Schezwan Noodles (Full)', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 22 },
    { name: 'Chicken Manchurian Noodles (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 23 },
    { name: 'Chicken Manchurian Noodles (Full)', price: 190, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 24 },
    { name: 'Egg Hakka Noodles (Half)', price: 80, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 25 },
    { name: 'Egg Hakka Noodles (Full)', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 26 },
    { name: 'Egg Schezwan Noodles (Half)', price: 90, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 27 },
    { name: 'Egg Schezwan Noodles (Full)', price: 130, kitchen: Kitchen.KITCHEN_1, category: 'Chinese Noodles', sortOrder: 28 },

    // 10. Veg Rice & Biryani
    { name: 'Veg Pulao (Half)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 1 },
    { name: 'Veg Pulao (Full)', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 2 },
    { name: 'Veg Biryani (Half)', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 3 },
    { name: 'Veg Biryani (Full)', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 4 },
    { name: 'Veg Dum Biryani (Half)', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 5 },
    { name: 'Veg Dum Biryani (Full)', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 6 },
    { name: 'Veg Hyderabadi Biryani (Half)', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 7 },
    { name: 'Veg Hyderabadi Biryani (Full)', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 8 },
    { name: 'Paneer Biryani (Half)', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 9 },
    { name: 'Paneer Biryani (Full)', price: 210, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 10 },
    { name: 'Paneer Dum Biryani (Half)', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 11 },
    { name: 'Paneer Dum Biryani (Full)', price: 220, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 12 },
    { name: 'Green Peas Pulao (Half)', price: 90, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 13 },
    { name: 'Green Peas Pulao (Full)', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 14 },
    { name: 'Steam Rice (Half)', price: 25, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 15 },
    { name: 'Steam Rice (Full)', price: 50, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 16 },
    { name: 'Jeera Rice (Half)', price: 65, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 17 },
    { name: 'Jeera Rice (Full)', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 18 },
    { name: 'Dal Khichdi', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 19 },
    { name: 'Dal Khichdi Tadka', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 20 },
    { name: 'Palak Dal Khichdi', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Veg Rice & Biryani', sortOrder: 21 },

    // 11. Non-Veg Rice & Biryani
    { name: 'Chicken Dum Biryani (Half)', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 1 },
    { name: 'Chicken Dum Biryani (Full)', price: 200, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 2 },
    { name: 'Chicken Tikka Biryani (Half)', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 3 },
    { name: 'Chicken Tikka Biryani (Full)', price: 220, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 4 },
    { name: 'Chicken Pulao (Half)', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 5 },
    { name: 'Chicken Pulao (Full)', price: 190, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 6 },
    { name: 'Chicken Hyderabadi Biryani (Half)', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 7 },
    { name: 'Chicken Hyderabadi Biryani (Full)', price: 230, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 8 },
    { name: 'Mutton Biryani (Half)', price: 200, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 9 },
    { name: 'Mutton Biryani (Full)', price: 300, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 10 },
    { name: 'Egg Biryani (Half)', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 11 },
    { name: 'Egg Biryani (Full)', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Rice & Biryani', sortOrder: 12 },

    // 12. Veg Main Course (K1)
    { name: 'Paneer Thali', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 1 },
    { name: 'Aloo Gobi', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 2 },
    { name: 'Aloo Palak', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 3 },
    { name: 'Veg Kolhapuri', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 4 },
    { name: 'Veg Kadai', price: 160, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 5 },
    { name: 'Green Peas Masala', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 6 },
    { name: 'Matar Paneer', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 7 },
    { name: 'Paneer Tikka Masala', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 8 },
    { name: 'Paneer Kadai', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 9 },
    { name: 'Paneer Handi', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 10 },
    { name: 'Palak Paneer', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 11 },
    { name: 'Soyabean Masala', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 12 },
    { name: 'Paneer Bhurji', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 13 },
    { name: 'Dal Fry', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 14 },
    { name: 'Dal Tadka', price: 110, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 15 },
    { name: 'Dal Palak', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Veg Main Course', sortOrder: 16 },

    // 13. Non-Veg Main Course
    { name: 'Chicken Thali', price: 150, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 1 },
    { name: 'Spl. Chicken Thali', price: 200, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 2 },
    { name: 'Mutton Thali', price: 250, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 3 },
    { name: 'Chicken Masala', price: 170, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 4 },
    { name: 'Chicken Curry', price: 120, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 5 },
    { name: 'Chicken Handi', price: 200, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 6 },
    { name: 'Chicken Sukka', price: 200, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 7 },
    { name: 'Chicken Tikka Masala', price: 200, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 8 },
    { name: 'Chicken Bhuna', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 9 },
    { name: 'Chicken Butter', price: 200, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 10 },
    { name: 'Malvani Chicken', price: 190, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 11 },
    { name: 'Chicken Kadai', price: 180, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 12 },
    { name: 'Egg Curry', price: 100, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 13 },
    { name: 'Egg Bhurji', price: 60, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 14 },
    { name: 'Egg Omlet', price: 55, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 15 },
    { name: 'Boiled Egg (2 Pcs)', price: 30, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 16 },
    { name: 'Egg Fry (2 Pcs)', price: 40, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 17 },
    { name: 'Bunty Da Spl. Chicken', price: 220, kitchen: Kitchen.KITCHEN_1, category: 'Non-Veg Main Course', sortOrder: 18 },

    // 14. Bulk / Catering Items (1Kg)
    { name: 'Veg Biryani (1Kg)', price: 1200, kitchen: Kitchen.KITCHEN_1, category: 'Bulk / Catering (1Kg)', sortOrder: 1 },
    { name: 'Paneer Biryani (1Kg)', price: 1500, kitchen: Kitchen.KITCHEN_1, category: 'Bulk / Catering (1Kg)', sortOrder: 2 },
    { name: 'Chicken Biryani (1Kg)', price: 1500, kitchen: Kitchen.KITCHEN_1, category: 'Bulk / Catering (1Kg)', sortOrder: 3 },
    { name: 'Chicken Tikka Biryani (1Kg)', price: 2000, kitchen: Kitchen.KITCHEN_1, category: 'Bulk / Catering (1Kg)', sortOrder: 4 },
    { name: 'Mutton Biryani (1Kg)', price: 2500, kitchen: Kitchen.KITCHEN_1, category: 'Bulk / Catering (1Kg)', sortOrder: 5 },
  ];

  for (const item of menuItems) {
    const categoryId = categoryMap[item.category];
    if (!categoryId) {
      console.warn(`  ⚠️ Category not found for item: ${item.name}`);
      continue;
    }

    await prisma.menuItem.create({
      data: {
        name: item.name,
        price: item.price,
        kitchen: item.kitchen,
        categoryId,
        sortOrder: item.sortOrder,
        isAvailable: true,
      },
    });
  }
  console.log(`  ✅ Menu items: ${menuItems.length} items created with exact kitchen routing`);

  // ──────────────────────────────────────────────
  // 6. Create Expense Categories
  // ──────────────────────────────────────────────
  const expenseCategories = [
    'Vegetables & Groceries',
    'Meat & Poultry',
    'Dairy & Eggs',
    'LPG Gas & Fuel',
    'Electricity & Utilities',
    'Packaging & Disposables',
    'Maintenance & Repairs',
    'Miscellaneous',
  ];

  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('  ✅ Expense categories created');

  // ──────────────────────────────────────────────
  // 7. Create Sample Customers
  // ──────────────────────────────────────────────
  const sampleCustomers = [
    { name: 'Rahul Sharma', mobile: '9876543210', address: 'Flat 402, Green Valley Apts', customerType: 'REGULAR', creditBalance: 0 },
    { name: 'Amit Patil', mobile: '9823456789', address: 'Shop 12, Main Market', customerType: 'VIP', creditBalance: 450 },
    { name: 'Sneha Deshmukh', mobile: '9765432100', address: 'Plot 15, Near City Hospital', customerType: 'REGULAR', creditBalance: 0 },
  ];

  for (const customer of sampleCustomers) {
    await prisma.customer.upsert({
      where: { mobile: customer.mobile },
      update: {},
      create: customer,
    });
  }
  console.log('  ✅ Sample customers created');

  console.log('\n🎉 Official Menu & Kitchen Routing Seed completed!\n');
  console.log(`📊 Statistics:`);
  console.log(`   - Kitchen 1 (K1) items: ${menuItems.filter(i => i.kitchen === Kitchen.KITCHEN_1).length}`);
  console.log(`   - Kitchen 2 (K2) items: ${menuItems.filter(i => i.kitchen === Kitchen.KITCHEN_2).length}`);
  console.log(`   - Total items: ${menuItems.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
