import type { Category, MenuItem, Table, Customer, Order } from '@/types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Breakfast (Veg)', sortOrder: 1, isActive: true },
  { id: 'cat-2', name: 'Paratha & Roti', sortOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Veg Main Course (K2)', sortOrder: 3, isActive: true },
  { id: 'cat-4', name: 'Drinks & Beverages', sortOrder: 4, isActive: true },
  { id: 'cat-5', name: 'Breakfast (Egg & Non-Veg)', sortOrder: 5, isActive: true },
  { id: 'cat-6', name: 'Soup', sortOrder: 6, isActive: true },
  { id: 'cat-7', name: 'Chinese Starters', sortOrder: 7, isActive: true },
  { id: 'cat-8', name: 'Chinese Rice', sortOrder: 8, isActive: true },
  { id: 'cat-9', name: 'Chinese Noodles', sortOrder: 9, isActive: true },
  { id: 'cat-10', name: 'Veg Rice & Biryani', sortOrder: 10, isActive: true },
  { id: 'cat-11', name: 'Non-Veg Rice & Biryani', sortOrder: 11, isActive: true },
  { id: 'cat-12', name: 'Veg Main Course', sortOrder: 12, isActive: true },
  { id: 'cat-13', name: 'Non-Veg Main Course', sortOrder: 13, isActive: true },
  { id: 'cat-14', name: 'Bulk / Catering (1Kg)', sortOrder: 14, isActive: true },
];

const RAW_ITEMS = [
  // KITCHEN 2
  { name: 'Misal Pav', price: 50, kitchen: 'KITCHEN_2', category: 'Breakfast (Veg)', sortOrder: 1 },
  { name: 'Poha / Upma', price: 25, kitchen: 'KITCHEN_2', category: 'Breakfast (Veg)', sortOrder: 2 },
  { name: 'Puri Bhaji', price: 50, kitchen: 'KITCHEN_2', category: 'Breakfast (Veg)', sortOrder: 3 },
  { name: 'Sheera', price: 30, kitchen: 'KITCHEN_2', category: 'Breakfast (Veg)', sortOrder: 4 },

  { name: 'Sada Paratha', price: 25, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 1 },
  { name: 'Masala Paratha', price: 30, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 2 },
  { name: 'Aloo Paratha', price: 40, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 3 },
  { name: 'Onion Paratha', price: 40, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 4 },
  { name: 'Paneer Paratha', price: 50, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 5 },
  { name: 'Methi Paratha', price: 45, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 6 },
  { name: 'Cabbage Paratha', price: 45, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 7 },
  { name: 'Muli Paratha', price: 45, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 8 },
  { name: 'Chapati', price: 7, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 9 },
  { name: 'Puri', price: 7, kitchen: 'KITCHEN_2', category: 'Paratha & Roti', sortOrder: 10 },

  { name: 'Veg Thali', price: 80, kitchen: 'KITCHEN_2', category: 'Veg Main Course (K2)', sortOrder: 1 },
  { name: 'Sev Bhaji', price: 110, kitchen: 'KITCHEN_2', category: 'Veg Main Course (K2)', sortOrder: 2 },
  { name: 'Aloo Jeera', price: 90, kitchen: 'KITCHEN_2', category: 'Veg Main Course (K2)', sortOrder: 3 },

  { name: 'Tea', price: 15, kitchen: 'KITCHEN_2', category: 'Drinks & Beverages', sortOrder: 1 },
  { name: 'Coffee', price: 20, kitchen: 'KITCHEN_2', category: 'Drinks & Beverages', sortOrder: 2 },
  { name: 'Chaas', price: 15, kitchen: 'KITCHEN_2', category: 'Drinks & Beverages', sortOrder: 3 },
  { name: 'Lassi Sweet', price: 25, kitchen: 'KITCHEN_2', category: 'Drinks & Beverages', sortOrder: 4 },
  { name: 'Cold Drink', price: 20, kitchen: 'KITCHEN_2', category: 'Drinks & Beverages', sortOrder: 5 },

  // KITCHEN 1
  { name: 'Bhurji Pav', price: 55, kitchen: 'KITCHEN_1', category: 'Breakfast (Egg & Non-Veg)', sortOrder: 1 },
  { name: 'Omlet Pav', price: 50, kitchen: 'KITCHEN_1', category: 'Breakfast (Egg & Non-Veg)', sortOrder: 2 },
  { name: 'Anda Pav', price: 40, kitchen: 'KITCHEN_1', category: 'Breakfast (Egg & Non-Veg)', sortOrder: 3 },
  { name: 'Kheema Pav', price: 80, kitchen: 'KITCHEN_1', category: 'Breakfast (Egg & Non-Veg)', sortOrder: 4 },

  { name: 'Tomato Soup', price: 70, kitchen: 'KITCHEN_1', category: 'Soup', sortOrder: 1 },
  { name: 'Veg Clear Soup', price: 70, kitchen: 'KITCHEN_1', category: 'Soup', sortOrder: 2 },
  { name: 'Veg Manchow Soup', price: 70, kitchen: 'KITCHEN_1', category: 'Soup', sortOrder: 3 },
  { name: 'Veg Hot & Sour Soup', price: 70, kitchen: 'KITCHEN_1', category: 'Soup', sortOrder: 4 },
  { name: 'Chicken Clear Soup', price: 80, kitchen: 'KITCHEN_1', category: 'Soup', sortOrder: 5 },
  { name: 'Chicken Manchow Soup', price: 100, kitchen: 'KITCHEN_1', category: 'Soup', sortOrder: 6 },
  { name: 'Chicken Hot & Sour Soup', price: 90, kitchen: 'KITCHEN_1', category: 'Soup', sortOrder: 7 },
  { name: 'Egg Manchow Soup', price: 80, kitchen: 'KITCHEN_1', category: 'Soup', sortOrder: 8 },

  { name: 'Veg Chilly', price: 150, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 1 },
  { name: 'Veg Crispy', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 2 },
  { name: 'Veg Manchurian', price: 170, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 3 },
  { name: 'Paneer Chilly', price: 180, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 4 },
  { name: 'Paneer 65', price: 190, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 5 },
  { name: 'Paneer Crispy', price: 170, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 6 },
  { name: 'Soyabean Dry', price: 120, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 7 },
  { name: 'Chicken Manchurian', price: 180, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 8 },
  { name: 'Chicken Lollypop', price: 150, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 9 },
  { name: 'Chicken Chilly', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 10 },
  { name: 'Chicken 65', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 11 },
  { name: 'Chicken Schezwan Dry', price: 150, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 12 },
  { name: 'Chicken Crispy', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Starters', sortOrder: 13 },

  { name: 'Veg Fried Rice (Half)', price: 75, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 1 },
  { name: 'Veg Fried Rice (Full)', price: 150, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 2 },
  { name: 'Veg Schezwan Rice (Half)', price: 80, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 3 },
  { name: 'Veg Schezwan Rice (Full)', price: 140, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 4 },
  { name: 'Veg Singapuri Rice (Half)', price: 80, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 5 },
  { name: 'Veg Singapuri Rice (Full)', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 6 },
  { name: 'Veg Triple Schezwan Rice (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 7 },
  { name: 'Veg Triple Schezwan Rice (Full)', price: 170, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 8 },
  { name: 'Veg Manchurian Rice (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 9 },
  { name: 'Veg Manchurian Rice (Full)', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 10 },
  { name: 'Paneer Fried Rice (Half)', price: 80, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 11 },
  { name: 'Paneer Fried Rice (Full)', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 12 },
  { name: 'Paneer Schezwan Rice (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 13 },
  { name: 'Paneer Schezwan Rice (Full)', price: 170, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 14 },
  { name: 'Paneer Triple Schezwan Rice (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 15 },
  { name: 'Paneer Triple Schezwan Rice (Full)', price: 150, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 16 },
  { name: 'Combination Rice (Half)', price: 80, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 17 },
  { name: 'Combination Rice (Full)', price: 150, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 18 },
  { name: 'Egg Fried Rice (Half)', price: 80, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 19 },
  { name: 'Egg Fried Rice (Full)', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 20 },
  { name: 'Chicken Fried Rice (Half)', price: 85, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 21 },
  { name: 'Chicken Fried Rice (Full)', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 22 },
  { name: 'Chicken Schezwan Rice (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 23 },
  { name: 'Chicken Schezwan Rice (Full)', price: 170, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 24 },
  { name: 'Chicken Singapuri Rice (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 25 },
  { name: 'Chicken Singapuri Rice (Full)', price: 190, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 26 },
  { name: 'Chicken Manchurian Rice (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 27 },
  { name: 'Chicken Manchurian Rice (Full)', price: 200, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 28 },
  { name: 'Chicken Triple Schezwan Rice (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 29 },
  { name: 'Chicken Triple Schezwan Rice (Full)', price: 190, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 30 },
  { name: 'Chicken Chopper Rice (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 31 },
  { name: 'Chicken Chopper Rice (Full)', price: 190, kitchen: 'KITCHEN_1', category: 'Chinese Rice', sortOrder: 32 },

  { name: 'Veg Noodles (Half)', price: 70, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 1 },
  { name: 'Veg Noodles (Full)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 2 },
  { name: 'Veg Hakka Noodles (Half)', price: 80, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 3 },
  { name: 'Veg Hakka Noodles (Full)', price: 120, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 4 },
  { name: 'Veg Schezwan Noodles (Half)', price: 85, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 5 },
  { name: 'Veg Schezwan Noodles (Full)', price: 120, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 6 },
  { name: 'Veg Singapore Noodles (Half)', price: 85, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 7 },
  { name: 'Veg Singapore Noodles (Full)', price: 130, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 8 },
  { name: 'Veg Triple Schezwan Noodles (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 9 },
  { name: 'Veg Triple Schezwan Noodles (Full)', price: 160, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 10 },
  { name: 'Veg Manchurian Noodles (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 11 },
  { name: 'Veg Manchurian Noodles (Full)', price: 170, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 12 },
  { name: 'Paneer Hakka Noodles (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 13 },
  { name: 'Paneer Hakka Noodles (Full)', price: 130, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 14 },
  { name: 'Chicken Hakka Noodles (Half)', price: 80, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 15 },
  { name: 'Chicken Hakka Noodles (Full)', price: 140, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 16 },
  { name: 'Chicken Schezwan Noodles (Half)', price: 90, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 17 },
  { name: 'Chicken Schezwan Noodles (Full)', price: 150, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 18 },
  { name: 'Chicken Singapore Noodles (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 19 },
  { name: 'Chicken Singapore Noodles (Full)', price: 130, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 20 },
  { name: 'Chicken Triple Schezwan Noodles (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 21 },
  { name: 'Chicken Triple Schezwan Noodles (Full)', price: 180, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 22 },
  { name: 'Chicken Manchurian Noodles (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 23 },
  { name: 'Chicken Manchurian Noodles (Full)', price: 190, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 24 },
  { name: 'Egg Hakka Noodles (Half)', price: 80, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 25 },
  { name: 'Egg Hakka Noodles (Full)', price: 120, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 26 },
  { name: 'Egg Schezwan Noodles (Half)', price: 90, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 27 },
  { name: 'Egg Schezwan Noodles (Full)', price: 130, kitchen: 'KITCHEN_1', category: 'Chinese Noodles', sortOrder: 28 },

  { name: 'Veg Pulao (Half)', price: 100, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 1 },
  { name: 'Veg Pulao (Full)', price: 160, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 2 },
  { name: 'Veg Biryani (Half)', price: 110, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 3 },
  { name: 'Veg Biryani (Full)', price: 170, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 4 },
  { name: 'Veg Dum Biryani (Half)', price: 120, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 5 },
  { name: 'Veg Dum Biryani (Full)', price: 180, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 6 },
  { name: 'Veg Hyderabadi Biryani (Half)', price: 110, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 7 },
  { name: 'Veg Hyderabadi Biryani (Full)', price: 180, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 8 },
  { name: 'Paneer Biryani (Half)', price: 110, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 9 },
  { name: 'Paneer Biryani (Full)', price: 210, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 10 },
  { name: 'Paneer Dum Biryani (Half)', price: 120, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 11 },
  { name: 'Paneer Dum Biryani (Full)', price: 220, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 12 },
  { name: 'Green Peas Pulao (Half)', price: 90, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 13 },
  { name: 'Green Peas Pulao (Full)', price: 160, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 14 },
  { name: 'Steam Rice (Half)', price: 25, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 15 },
  { name: 'Steam Rice (Full)', price: 50, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 16 },
  { name: 'Jeera Rice (Half)', price: 65, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 17 },
  { name: 'Jeera Rice (Full)', price: 100, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 18 },
  { name: 'Dal Khichdi', price: 110, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 19 },
  { name: 'Dal Khichdi Tadka', price: 120, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 20 },
  { name: 'Palak Dal Khichdi', price: 110, kitchen: 'KITCHEN_1', category: 'Veg Rice & Biryani', sortOrder: 21 },

  { name: 'Chicken Dum Biryani (Half)', price: 110, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 1 },
  { name: 'Chicken Dum Biryani (Full)', price: 200, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 2 },
  { name: 'Chicken Tikka Biryani (Half)', price: 110, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 3 },
  { name: 'Chicken Tikka Biryani (Full)', price: 220, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 4 },
  { name: 'Chicken Pulao (Half)', price: 110, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 5 },
  { name: 'Chicken Pulao (Full)', price: 190, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 6 },
  { name: 'Chicken Hyderabadi Biryani (Half)', price: 120, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 7 },
  { name: 'Chicken Hyderabadi Biryani (Full)', price: 230, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 8 },
  { name: 'Mutton Biryani (Half)', price: 200, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 9 },
  { name: 'Mutton Biryani (Full)', price: 300, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 10 },
  { name: 'Egg Biryani (Half)', price: 110, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 11 },
  { name: 'Egg Biryani (Full)', price: 150, kitchen: 'KITCHEN_1', category: 'Non-Veg Rice & Biryani', sortOrder: 12 },

  { name: 'Paneer Thali', price: 150, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 1 },
  { name: 'Aloo Gobi', price: 100, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 2 },
  { name: 'Aloo Palak', price: 100, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 3 },
  { name: 'Veg Kolhapuri', price: 150, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 4 },
  { name: 'Veg Kadai', price: 160, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 5 },
  { name: 'Green Peas Masala', price: 170, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 6 },
  { name: 'Matar Paneer', price: 180, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 7 },
  { name: 'Paneer Tikka Masala', price: 180, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 8 },
  { name: 'Paneer Kadai', price: 180, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 9 },
  { name: 'Paneer Handi', price: 180, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 10 },
  { name: 'Palak Paneer', price: 170, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 11 },
  { name: 'Soyabean Masala', price: 110, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 12 },
  { name: 'Paneer Bhurji', price: 120, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 13 },
  { name: 'Dal Fry', price: 100, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 14 },
  { name: 'Dal Tadka', price: 110, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 15 },
  { name: 'Dal Palak', price: 100, kitchen: 'KITCHEN_1', category: 'Veg Main Course', sortOrder: 16 },

  { name: 'Chicken Thali', price: 150, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 1 },
  { name: 'Spl. Chicken Thali', price: 200, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 2 },
  { name: 'Mutton Thali', price: 250, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 3 },
  { name: 'Chicken Masala', price: 170, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 4 },
  { name: 'Chicken Curry', price: 120, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 5 },
  { name: 'Chicken Handi', price: 200, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 6 },
  { name: 'Chicken Sukka', price: 200, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 7 },
  { name: 'Chicken Tikka Masala', price: 200, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 8 },
  { name: 'Chicken Bhuna', price: 180, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 9 },
  { name: 'Chicken Butter', price: 200, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 10 },
  { name: 'Malvani Chicken', price: 190, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 11 },
  { name: 'Chicken Kadai', price: 180, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 12 },
  { name: 'Egg Curry', price: 100, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 13 },
  { name: 'Egg Bhurji', price: 60, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 14 },
  { name: 'Egg Omlet', price: 55, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 15 },
  { name: 'Boiled Egg (2 Pcs)', price: 30, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 16 },
  { name: 'Egg Fry (2 Pcs)', price: 40, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 17 },
  { name: 'Bunty Da Spl. Chicken', price: 220, kitchen: 'KITCHEN_1', category: 'Non-Veg Main Course', sortOrder: 18 },

  { name: 'Veg Biryani (1Kg)', price: 1200, kitchen: 'KITCHEN_1', category: 'Bulk / Catering (1Kg)', sortOrder: 1 },
  { name: 'Paneer Biryani (1Kg)', price: 1500, kitchen: 'KITCHEN_1', category: 'Bulk / Catering (1Kg)', sortOrder: 2 },
  { name: 'Chicken Biryani (1Kg)', price: 1500, kitchen: 'KITCHEN_1', category: 'Bulk / Catering (1Kg)', sortOrder: 3 },
  { name: 'Chicken Tikka Biryani (1Kg)', price: 2000, kitchen: 'KITCHEN_1', category: 'Bulk / Catering (1Kg)', sortOrder: 4 },
  { name: 'Mutton Biryani (1Kg)', price: 2500, kitchen: 'KITCHEN_1', category: 'Bulk / Catering (1Kg)', sortOrder: 5 },
];

export const MOCK_MENU_ITEMS: MenuItem[] = RAW_ITEMS.map((item, idx) => {
  const cat = MOCK_CATEGORIES.find((c) => c.name === item.category);
  const categoryId = cat ? cat.id : 'cat-1';
  return {
    id: `item-${idx + 1}`,
    name: item.name,
    price: item.price,
    kitchen: item.kitchen as 'KITCHEN_1' | 'KITCHEN_2',
    categoryId,
    category: cat,
    isAvailable: true,
    sortOrder: item.sortOrder,
  };
});

// Link items to categories
MOCK_CATEGORIES.forEach((cat) => {
  cat.menuItems = MOCK_MENU_ITEMS.filter((i) => i.categoryId === cat.id);
});

export const MOCK_TABLES: Table[] = Array.from({ length: 20 }, (_, i) => ({
  id: `table-${i + 1}`,
  number: i + 1,
  capacity: i < 10 ? 4 : 6,
  status: i === 2 || i === 5 ? 'OCCUPIED' : i === 7 ? 'RESERVED' : 'AVAILABLE',
}));

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Rahul Sharma', mobile: '9876543210', address: 'Flat 402, Green Valley Apts', customerType: 'REGULAR', creditBalance: 0, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cust-2', name: 'Amit Patil', mobile: '9823456789', address: 'Shop 12, Main Market', customerType: 'VIP', creditBalance: 450, isActive: true, createdAt: new Date().toISOString() },
  { id: 'cust-3', name: 'Sneha Deshmukh', mobile: '9765432100', address: 'Plot 15, City Center', customerType: 'REGULAR', creditBalance: 0, isActive: true, createdAt: new Date().toISOString() },
];

export const MOCK_INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 101,
    type: 'DINE_IN',
    status: 'PREPARING',
    tableId: 'table-3',
    table: { id: 'table-3', number: 3, capacity: 4, status: 'OCCUPIED' },
    subtotal: 350,
    total: 350,
    createdBy: 'demo-cashier-id',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    orderItems: [
      {
        id: 'oi-1',
        orderId: 'ord-101',
        menuItemId: 'item-1',
        menuItem: MOCK_MENU_ITEMS[0], // Misal Pav
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
        kitchen: 'KITCHEN_2',
        kitchenStatus: 'READY',
      },
      {
        id: 'oi-2',
        orderId: 'ord-101',
        menuItemId: 'item-55',
        menuItem: MOCK_MENU_ITEMS.find((i) => i.name === 'Veg Hakka Noodles (Full)'),
        quantity: 2,
        unitPrice: 120,
        totalPrice: 240,
        kitchen: 'KITCHEN_1',
        kitchenStatus: 'PREPARING',
      },
    ],
    kitchenOrders: [
      { id: 'ko-1', orderId: 'ord-101', kitchen: 'KITCHEN_2', status: 'READY' },
      { id: 'ko-2', orderId: 'ord-101', kitchen: 'KITCHEN_1', status: 'PREPARING' },
    ],
  },
  {
    id: 'ord-102',
    orderNumber: 102,
    type: 'DINE_IN',
    status: 'READY',
    tableId: 'table-6',
    table: { id: 'table-6', number: 6, capacity: 4, status: 'OCCUPIED' },
    subtotal: 200,
    total: 200,
    createdBy: 'demo-cashier-id',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    orderItems: [
      {
        id: 'oi-3',
        orderId: 'ord-102',
        menuItemId: 'item-10',
        menuItem: MOCK_MENU_ITEMS.find((i) => i.name === 'Aloo Paratha'),
        quantity: 2,
        unitPrice: 40,
        totalPrice: 80,
        kitchen: 'KITCHEN_2',
        kitchenStatus: 'READY',
      },
      {
        id: 'oi-4',
        orderId: 'ord-102',
        menuItemId: 'item-18',
        menuItem: MOCK_MENU_ITEMS.find((i) => i.name === 'Tea'),
        quantity: 2,
        unitPrice: 15,
        totalPrice: 30,
        kitchen: 'KITCHEN_2',
        kitchenStatus: 'READY',
      },
    ],
    kitchenOrders: [
      { id: 'ko-3', orderId: 'ord-102', kitchen: 'KITCHEN_2', status: 'READY' },
    ],
  },
];

// Helper to get or initialize local storage orders for full interactive demo
export function getDemoOrders(): Order[] {
  if (typeof window === 'undefined') return MOCK_INITIAL_ORDERS;
  const stored = localStorage.getItem('demo_orders');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as Order[];
    } catch {
      // Corrupt payload — start over from the seed data.
    }
  }
  localStorage.setItem('demo_orders', JSON.stringify(MOCK_INITIAL_ORDERS));
  return MOCK_INITIAL_ORDERS;
}

export function saveDemoOrders(orders: Order[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_orders', JSON.stringify(orders));
  }
}

export interface DemoOrderInput {
  type: 'DINE_IN' | 'DELIVERY';
  items: { menuItem: MenuItem; quantity: number; notes?: string }[];
  table?: Table;
  customer?: Customer;
  notes?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  createdBy?: string;
}

/**
 * Builds an offline order that behaves like a real one: only the kitchens that
 * actually have items get a ticket, and everything starts at NEW so the kitchen
 * screens can walk it through NEW → PREPARING → READY.
 */
export function buildDemoOrder(input: DemoOrderInput): Order {
  const existing = getDemoOrders();
  const orderId = `ord-demo-${Date.now()}`;
  const stamp = new Date().toISOString();
  const subtotal = input.items.reduce(
    (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
    0,
  );

  const orderItems = input.items.map((item, index) => ({
    id: `${orderId}-item-${index + 1}`,
    orderId,
    menuItemId: item.menuItem.id,
    menuItem: item.menuItem,
    quantity: item.quantity,
    unitPrice: Number(item.menuItem.price),
    totalPrice: Number(item.menuItem.price) * item.quantity,
    kitchen: item.menuItem.kitchen,
    kitchenStatus: 'NEW' as const,
    notes: item.notes || undefined,
  }));

  const kitchens = [...new Set(orderItems.map((item) => item.kitchen))];

  return {
    id: orderId,
    orderNumber:
      existing.reduce((max, order) => Math.max(max, order.orderNumber), 100) + 1,
    type: input.type,
    status: 'NEW',
    tableId: input.table?.id,
    table: input.table,
    customerId: input.customer?.id,
    customer: input.customer,
    subtotal,
    total: subtotal,
    notes: input.notes || undefined,
    createdBy: input.createdBy || 'demo-cashier-id',
    createdAt: stamp,
    updatedAt: stamp,
    orderItems,
    kitchenOrders: kitchens.map((kitchen, index) => ({
      id: `${orderId}-ko-${index + 1}`,
      orderId,
      kitchen,
      status: 'NEW' as const,
    })),
    deliveryInfo:
      input.type === 'DELIVERY' && input.deliveryAddress
        ? {
            id: `${orderId}-delivery`,
            orderId,
            customerId: input.customer?.id || '',
            address: input.deliveryAddress,
            phone: input.deliveryPhone,
            status: 'PENDING' as const,
          }
        : undefined,
  };
}

/** Offline stand-in for `GET /customers?search=` */
export function searchDemoCustomers(query: string): Customer[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return MOCK_CUSTOMERS.filter(
    (customer) =>
      customer.name.toLowerCase().includes(term) ||
      (customer.mobile || '').includes(term),
  ).slice(0, 5);
}
