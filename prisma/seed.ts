import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const menuItems = [
    // =========================
    // BURGERS
    // =========================
    {
        name: "Classic Chicken Burger",
        description: "Crispy chicken patty with fresh lettuce, tomato and creamy mayo.",
        price: 149,
        category: "Burger",
    },
    {
        name: "Crispy Chicken Burger",
        description: "Golden crispy chicken fillet with lettuce and signature sauce.",
        price: 179,
        category: "Burger",
    },
    {
        name: "Spicy Chicken Burger",
        description: "Crispy chicken patty with spicy sauce, lettuce and fresh onions.",
        price: 189,
        category: "Burger",
    },
    {
        name: "Double Chicken Burger",
        description: "Two juicy chicken patties layered with lettuce, cheese and special sauce.",
        price: 229,
        category: "Burger",
    },
    {
        name: "BBQ Chicken Burger",
        description: "Grilled chicken patty topped with smoky BBQ sauce and crunchy onions.",
        price: 199,
        category: "Burger",
    },
    {
        name: "Peri Peri Chicken Burger",
        description: "Crispy chicken patty tossed in peri peri seasoning with creamy sauce.",
        price: 209,
        category: "Burger",
    },
    {
        name: "Cheese Chicken Burger",
        description: "Juicy chicken patty topped with melted cheese, lettuce and mayo.",
        price: 199,
        category: "Burger",
    },
    {
        name: "Mexican Chicken Burger",
        description: "Spicy chicken patty with jalapenos, onions, salsa and Mexican sauce.",
        price: 219,
        category: "Burger",
    },
    {
        name: "Classic Veg Burger",
        description: "Crispy vegetable patty with lettuce, tomato and creamy mayo.",
        price: 119,
        category: "Burger",
    },
    {
        name: "Crispy Veg Burger",
        description: "Crunchy vegetable patty served with fresh vegetables and signature sauce.",
        price: 139,
        category: "Burger",
    },
    {
        name: "Cheese Veg Burger",
        description: "Crispy veg patty with melted cheese, lettuce and creamy sauce.",
        price: 149,
        category: "Burger",
    },
    {
        name: "Spicy Paneer Burger",
        description: "Crispy spicy paneer patty with lettuce, onions and chipotle sauce.",
        price: 169,
        category: "Burger",
    },
    {
        name: "Paneer Tikka Burger",
        description: "Tandoori paneer tikka with onions, lettuce and mint mayo.",
        price: 179,
        category: "Burger",
    },
    {
        name: "Double Cheese Burger",
        description: "Double vegetable patty with layers of melted cheese and signature sauce.",
        price: 189,
        category: "Burger",
    },
    {
        name: "Mushroom Swiss Burger",
        description: "Grilled mushroom patty topped with Swiss-style cheese and creamy sauce.",
        price: 199,
        category: "Burger",
    },

    // =========================
    // PIZZAS
    // =========================
    {
        name: "Margherita Pizza",
        description: "Classic pizza topped with tomato sauce, mozzarella and fresh herbs.",
        price: 199,
        category: "Pizza",
    },
    {
        name: "Classic Cheese Pizza",
        description: "Loaded with rich tomato sauce and a generous layer of mozzarella cheese.",
        price: 229,
        category: "Pizza",
    },
    {
        name: "Farmhouse Pizza",
        description: "Loaded with onions, capsicum, tomatoes, mushrooms and mozzarella.",
        price: 299,
        category: "Pizza",
    },
    {
        name: "Veggie Delight Pizza",
        description: "A colorful combination of fresh vegetables, herbs and melted cheese.",
        price: 279,
        category: "Pizza",
    },
    {
        name: "Paneer Tikka Pizza",
        description: "Tandoori paneer, onions, capsicum and mozzarella on a classic pizza base.",
        price: 299,
        category: "Pizza",
    },
    {
        name: "Spicy Paneer Pizza",
        description: "Spicy paneer, jalapenos, onions and chili sauce with melted cheese.",
        price: 309,
        category: "Pizza",
    },
    {
        name: "Chicken Tikka Pizza",
        description: "Tender chicken tikka with onions, capsicum and mozzarella cheese.",
        price: 329,
        category: "Pizza",
    },
    {
        name: "BBQ Chicken Pizza",
        description: "Grilled chicken, smoky BBQ sauce, onions and melted mozzarella.",
        price: 349,
        category: "Pizza",
    },
    {
        name: "Peri Peri Chicken Pizza",
        description: "Spicy peri peri chicken with capsicum, onions and mozzarella.",
        price: 349,
        category: "Pizza",
    },
    {
        name: "Chicken Pepperoni Pizza",
        description: "Savory chicken pepperoni with tomato sauce and melted mozzarella.",
        price: 369,
        category: "Pizza",
    },
    {
        name: "Double Cheese Chicken Pizza",
        description: "Chicken toppings with extra mozzarella and cheddar-style cheese.",
        price: 379,
        category: "Pizza",
    },
    {
        name: "Mexican Chicken Pizza",
        description: "Spiced chicken with jalapenos, onions, capsicum and Mexican sauce.",
        price: 359,
        category: "Pizza",
    },
    {
        name: "Chicken Supreme Pizza",
        description: "Loaded with chicken, onions, capsicum, mushrooms and extra cheese.",
        price: 399,
        category: "Pizza",
    },
    {
        name: "Veg Supreme Pizza",
        description: "Loaded with mushrooms, capsicum, onions, tomatoes and olives.",
        price: 349,
        category: "Pizza",
    },
    {
        name: "Four Cheese Pizza",
        description: "A rich blend of four cheeses baked over a classic pizza base.",
        price: 379,
        category: "Pizza",
    },

    // =========================
    // DRINKS
    // =========================
    {
        name: "Classic Cola",
        description: "Chilled fizzy cola served cold.",
        price: 59,
        category: "Drinks",
    },
    {
        name: "Diet Cola",
        description: "Refreshing chilled cola with a lighter taste.",
        price: 59,
        category: "Drinks",
    },
    {
        name: "Lemon Iced Tea",
        description: "Refreshing black tea blended with lemon and served chilled.",
        price: 79,
        category: "Drinks",
    },
    {
        name: "Peach Iced Tea",
        description: "Sweet and refreshing iced tea infused with peach flavor.",
        price: 89,
        category: "Drinks",
    },
    {
        name: "Fresh Lime Soda",
        description: "Refreshing lime drink with a fizzy soda finish.",
        price: 69,
        category: "Drinks",
    },
    {
        name: "Mint Lime Cooler",
        description: "Cool and refreshing blend of lime, mint and chilled soda.",
        price: 89,
        category: "Drinks",
    },
    {
        name: "Mango Smoothie",
        description: "Creamy smoothie made with ripe mangoes and chilled milk.",
        price: 129,
        category: "Drinks",
    },
    {
        name: "Strawberry Shake",
        description: "Creamy strawberry milkshake topped with a smooth fruity flavor.",
        price: 139,
        category: "Drinks",
    },
    {
        name: "Chocolate Shake",
        description: "Rich and creamy chocolate milkshake served chilled.",
        price: 149,
        category: "Drinks",
    },
    {
        name: "Vanilla Shake",
        description: "Classic creamy vanilla milkshake with a smooth finish.",
        price: 129,
        category: "Drinks",
    },
    {
        name: "Cold Coffee",
        description: "Chilled creamy coffee blended with milk and ice.",
        price: 139,
        category: "Drinks",
    },
    {
        name: "Chocolate Cold Coffee",
        description: "Creamy cold coffee blended with rich chocolate flavor.",
        price: 159,
        category: "Drinks",
    },
    {
        name: "Oreo Shake",
        description: "Creamy vanilla shake blended with crunchy chocolate cookie pieces.",
        price: 169,
        category: "Drinks",
    },
    {
        name: "Mango Lassi",
        description: "Traditional creamy yogurt drink blended with sweet mango.",
        price: 109,
        category: "Drinks",
    },
    {
        name: "Sweet Lassi",
        description: "Traditional chilled yogurt drink with a naturally sweet taste.",
        price: 99,
        category: "Drinks",
    },
    {
        name: "Masala Lemonade",
        description: "Refreshing lemonade with a light blend of Indian spices.",
        price: 79,
        category: "Drinks",
    },
    {
        name: "Water Bottle",
        description: "Chilled bottled drinking water.",
        price: 30,
        category: "Drinks",
    },
    {
        name: "Iced Americano",
        description: "Bold espresso served over ice with chilled water.",
        price: 119,
        category: "Drinks",
    },
    {
        name: "Classic Cappuccino",
        description: "Smooth espresso topped with steamed milk and creamy foam.",
        price: 129,
        category: "Drinks",
    },
    {
        name: "Mocha Coffee",
        description: "Rich espresso blended with chocolate and steamed milk.",
        price: 149,
        category: "Drinks",
    },
];

async function main() {

    console.log("🌱 Starting menu seed...");

    // await prisma.menuItem.deleteMany();

    await prisma.menuItem.createMany({
        data: menuItems,
    });

    console.log(`✅ ${menuItems.length} menu items inserted successfully.`);
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });