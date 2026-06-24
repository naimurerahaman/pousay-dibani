/**
 * Maps a category to a local image (scraped from deliveryhobe.com and stored
 * in /public/categories). Keyed by the category name with all non-alphanumeric
 * characters removed and lowercased, so "Fruits & Vegetables" -> "fruitsvegetables".
 * Categories with no sensible match fall back to a lucide icon on the home page.
 */
const categoryImageMap: Record<string, string> = {
  attamaidasuji: "/categories/groceries.gif",
  babycorner: "/categories/baby.png",
  dairybreakfast: "/categories/groceries.gif",
  drinksandbeverages: "/categories/drinks.png",
  electronicsstore: "/categories/electronics.png",
  freshgroceries: "/categories/groceries.gif",
  fruitsvegetables: "/categories/fruitsveg.gif",
  householdessentials: "/categories/cleaning.png",
  icecream: "/categories/icecream.png",
  meatfish: "/categories/meatfish.png",
  newarrival: "/categories/newarrival.gif",
  partystore: "/categories/party.gif",
  petstore: "/categories/pet.png",
  pharmacy: "/categories/pharmacy.png",
  saucespickles: "/categories/groceries.gif",
  sexualwellness: "/categories/sexual.png",
  snacksdrinks: "/categories/munchies.gif",
  soup: "/categories/street.png",
  streetfoods: "/categories/street.png",
  studentcorner: "/categories/student.png",
  tongsmokestore: "/categories/tong.gif",
  toysandsports: "/categories/toys.png",
};

export function getCategoryImage(name: string): string | null {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return categoryImageMap[key] ?? null;
}
