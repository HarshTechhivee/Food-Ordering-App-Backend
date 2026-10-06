import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const imageMap: Record<string, string> = {
    // =========================
    // BURGERS
    // =========================
    "Classic Chicken Burger": "classic-chicken-burger.jpg",
    "Crispy Chicken Burger": "crispy-chicken-burger.jpg",
    "Spicy Chicken Burger": "spicy-chicken-burger.jpg",
    "Double Chicken Burger": "double-chicken-burger.jpg",
    "BBQ Chicken Burger": "bbq-chicken-burger.jpg",
    "Peri Peri Chicken Burger": "peri-peri-chicken-burger.jpg",
    "Cheese Chicken Burger": "cheese-chicken-burger.jpg",
    "Mexican Chicken Burger": "mexican-chicken-burger.jpg",
    "Classic Veg Burger": "classic-veg-burger.jpg",
    "Crispy Veg Burger": "crispy-veg-burger.jpg",
    "Cheese Veg Burger": "cheese-veg-burger.jpg",
    "Spicy Paneer Burger": "spicy-paneer-burger.jpg",
    "Paneer Tikka Burger": "paneer-tikka-burger.jpg",
    "Double Cheese Burger": "double-cheese-burger.jpg",
    "Mushroom Swiss Burger": "mushroom-swiss-burger.jpg",

    // =========================
    // PIZZAS
    // =========================
    "Margherita Pizza": "margherita-pizza.jpg",
    "Classic Cheese Pizza": "classic-cheese-pizza.jpg",
    "Farmhouse Pizza": "farmhouse-pizza.jpg",
    "Veggie Delight Pizza": "veggie-delight-pizza.jpg",
    "Paneer Tikka Pizza": "paneer-tikka-pizza.jpg",
    "Spicy Paneer Pizza": "spicy-paneer-pizza.jpg",
    "Chicken Tikka Pizza": "chicken-tikka-pizza.jpg",
    "BBQ Chicken Pizza": "bbq-chicken-pizza.jpg",
    "Peri Peri Chicken Pizza": "peri-peri-chicken-pizza.jpg",
    "Chicken Pepperoni Pizza": "chicken-pepperoni-pizza.jpg",
    "Double Cheese Chicken Pizza": "double-cheese-chicken-pizza.jpg",
    "Mexican Chicken Pizza": "mexican-chicken-pizza.jpg",
    "Chicken Supreme Pizza": "chicken-supreme-pizza.jpg",
    "Veg Supreme Pizza": "veg-supreme-pizza.jpg",
    "Four Cheese Pizza": "four-cheese-pizza.jpg",

    // =========================
    // DRINKS
    // =========================
    "Classic Cola": "classic-cola.jpg",
    "Diet Cola": "diet-cola.jpg",
    "Lemon Iced Tea": "lemon-iced-tea.jpg",
    "Peach Iced Tea": "peach-iced-tea.jpg",
    "Fresh Lime Soda": "fresh-lime-soda.jpg",
    "Mint Lime Cooler": "mint-lime-cooler.jpg",
    "Mango Smoothie": "mango-smoothie.jpg",
    "Strawberry Shake": "strawberry-shake.jpg",
    "Chocolate Shake": "chocolate-shake.jpg",
    "Vanilla Shake": "vanilla-shake.jpg",
    "Cold Coffee": "cold-coffee.jpg",
    "Chocolate Cold Coffee": "chocolate-cold-coffee.jpg",
    "Oreo Shake": "oreo-shake.jpg",
    "Mango Lassi": "mango-lassi.jpg",
    "Sweet Lassi": "sweet-lassi.jpg",
    "Masala Lemonade": "masala-lemonade.jpg",
    "Water Bottle": "water-bottle.jpg",
    "Iced Americano": "iced-americano.jpg",
    "Classic Cappuccino": "classic-cappuccino.jpg",
    "Mocha Coffee": "mocha-coffee.jpg",
};

async function main() {
    console.log("🖼️ Updating menu images...\n");

    let updated = 0;

    for (const [name, filename] of Object.entries(imageMap)) {
        const result = await prisma.menuItem.updateMany({
            where: {
                name,
            },
            data: {
                image: `/uploads/menu/${filename}`,
            },
        });

        if (result.count === 1) {
            console.log(`✅ ${name}`);
            updated++;
        } else {
            console.log(`⚠️ Not found: ${name}`);
        }
    }

    console.log(`\n🎉 Updated ${updated}/${Object.keys(imageMap).length} menu items.`);
}

main()
    .catch((error) => {
        console.error("❌ Failed to update menu images:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });