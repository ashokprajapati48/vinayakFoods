'use client';

import KitchenDisplay from '@/components/KitchenDisplay';

export default function Kitchen1Page() {
  return (
    <KitchenDisplay
      kitchen="KITCHEN_1"
      label="Kitchen 1"
      subtitle="Non-Veg, Chinese, Soups, Biryanis & Gravies"
      accent="amber"
    />
  );
}
