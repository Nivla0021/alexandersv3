import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin users
  const hashedPassword1 = await bcrypt.hash('johndoe123', 10);
  const hashedPassword2 = await bcrypt.hash('admin123', 10);

  // Test admin user (required for testing)
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword1,
      name: 'Admin User',
      role: 'admin',
    },
  });

  // Additional admin user
  await prisma.user.upsert({
    where: { email: 'admin@alexanderscuisine.com' },
    update: {},
    create: {
      email: 'admin@alexanderscuisine.com',
      password: hashedPassword2,
      name: 'Alexander Admin',
      role: 'admin',
    },
  });

  console.log('Admin users created');

  // Create products
  const products = [
    {
      name: 'Turon',
      description: 'Traditional Filipino banana spring roll with caramelized banana and jackfruit filling. Crispy, golden-brown perfection served with a sweet caramel drizzle. A beloved street food classic made fresh in our kitchen.',
      recipe: `## About Turon

Turon is one of the Philippines' most beloved street foods and snacks. This sweet treat consists of ripe saba bananas and jackfruit wrapped in a crispy spring roll wrapper, deep-fried to golden perfection, and coated with caramelized sugar.

## Our Special Recipe

At Alexander's Handcrafted Cuisine, we make our turon fresh daily using traditional methods passed down through generations. Each roll is carefully handcrafted to ensure the perfect balance of crispy exterior and sweet, tender filling.

### Key Ingredients:
- Premium saba bananas (cardaba bananas) - the authentic Filipino variety
- Sweet langka (jackfruit) strips for added tropical flavor
- Spring roll wrappers (lumpia wrapper)
- Brown sugar for caramelization
- Pure coconut oil for frying

### What Makes Ours Special:
✓ We use only ripe saba bananas for maximum sweetness
✓ Each turon is hand-rolled to order
✓ Double-fried technique for extra crispiness
✓ Signature caramel drizzle finish
✓ Made in small batches for freshness

### Perfect For:
- Afternoon merienda (snack time)
- Dessert after meals
- Party finger food
- Sweet cravings any time of day

### Storage & Serving:
Best enjoyed fresh and warm. Can be stored in an airtight container and reheated in an oven or air fryer to restore crispiness.

**Allergen Info:** Contains gluten (wheat wrapper). Vegan-friendly.`,
      price: 99,
      image: '/product_images/turon.png',
      category: 'Dessert',
      available: true,
    },
    {
      name: 'Calabasa Pansit',
      description: 'Filipino squash noodles stir-fried to perfection with fresh vegetables and aromatic spices. Our signature twist on traditional pancit features colorful squash, crisp vegetables, and savory flavors that celebrate authentic Filipino home cooking.',
      recipe: `## About Calabasa Pansit

Calabasa Pansit is our signature creation that celebrates Filipino cooking while embracing healthier, vegetable-forward options. This colorful dish features spiralized squash "noodles" as a nutritious alternative to traditional wheat noodles, combined with the classic flavors and cooking techniques of Filipino pancit.

## Our Signature Recipe

This dish represents the heart of Filipino home cooking - simple, flavorful, and made with love. We prepare each batch fresh to order, ensuring vibrant colors and optimal nutrition.

### Key Ingredients:
- Fresh kalabasa (Filipino squash/pumpkin) - spiralized into noodle shapes
- Mix of seasonal vegetables:
  - Carrots (julienned)
  - Cabbage (shredded)
  - Green beans (sitaw)
  - Snow peas
  - Bell peppers
- Aromatics: garlic, onions, and ginger
- Premium soy sauce and oyster sauce
- Vegetable stock
- Sesame oil
- Green onions and fried garlic for garnish

### Cooking Method:
Our chefs use the traditional "pancit" stir-fry method - high heat cooking in a wok to achieve that distinctive "wok hei" (breath of the wok) flavor while keeping vegetables crisp-tender.

### Nutritional Highlights:
✓ Lower in calories than traditional noodles
✓ Rich in beta-carotene from squash
✓ High in fiber and vitamins
✓ Gluten-free option available
✓ Can be made vegan upon request

### Perfect For:
- Health-conscious diners
- Those seeking vegetable-forward Filipino cuisine
- Lunch or dinner main course
- Party gatherings (serves 2-3 as appetizer)

### Serving Suggestions:
Enjoy with calamansi (Filipino lime) on the side for added citrus brightness. Pairs wonderfully with our Lemon Tea.

**Allergen Info:** Contains soy. Can be made gluten-free and vegan upon request.`,
      price: 149,
      image: '/product_images/pancit.png',
      category: 'Noodles',
      available: true,
    },
    {
      name: 'Lemon Tea',
      description: 'Refreshing homemade lemon tea made with fresh lemon slices and premium tea leaves. Served ice-cold with just the right balance of sweetness and citrus tang. Perfect complement to our Filipino snacks.',
      recipe: `## About Our Lemon Tea

Our Lemon Tea is a refreshing homemade beverage that perfectly complements the rich, savory flavors of Filipino cuisine. Brewed fresh throughout the day, it offers a clean, crisp taste that cleanses the palate and revitalizes the senses.

## Our Preparation Method

We believe that great iced tea starts with quality ingredients and proper brewing technique. Each batch is carefully prepared to ensure consistency and optimal flavor.

### Key Ingredients:
- Premium black tea leaves (Ceylon tea blend)
- Fresh lemons - sliced and juiced
- Pure cane sugar (adjustable to preference)
- Filtered water
- Fresh ice
- Optional: fresh mint leaves for garnish

### Brewing Process:
1. **Tea Brewing:** We brew our tea at the perfect temperature (195°F) to extract full flavor without bitterness
2. **Sweetening:** Sugar is added while tea is hot for complete dissolution
3. **Lemon Infusion:** Fresh lemon slices steep with the tea for natural citrus oils
4. **Chilling:** Cooled to perfection before serving over ice
5. **Fresh Squeeze:** Each glass gets an additional squeeze of fresh lemon juice

### What Makes It Special:
✓ Brewed fresh multiple times daily - never from concentrate
✓ Real lemons - we never use artificial flavoring
✓ Customizable sweetness levels
✓ No artificial colors or preservatives
✓ Generous serving size

### Sweetness Options:
- Regular Sweet (standard)
- Light Sweet (50% less sugar)
- No Sugar (unsweetened)
- Extra Sweet (for those with a sweet tooth)

### Perfect Pairing:
Our Lemon Tea is the ideal beverage to accompany:
- Turon or any fried snacks (cuts through richness)
- Calabasa Pansit (complements savory flavors)
- Hot, humid Manila days (ultimate refreshment)

### Health Benefits:
✓ Antioxidants from black tea
✓ Vitamin C from fresh lemons
✓ Natural energy boost from caffeine
✓ Aids digestion

**Allergen Info:** Naturally gluten-free, dairy-free, and vegan.`,
      price: 59,
      image: '/product_images/lemon.jpeg',
      category: 'Beverages',
      available: true,
    },
    {
      name: 'Banana Turon Pie',
      description: 'Our innovative fusion dessert combining the beloved turon with classic pie. Layers of caramelized banana and crispy turon filling encased in a buttery, flaky crust. Drizzled with homemade caramel sauce for an unforgettable Filipino-inspired treat.',
      recipe: `## About Banana Turon Pie

The Banana Turon Pie is Alexander's signature creation - a delightful fusion dessert that honors Filipino heritage while embracing innovative pastry techniques. This unique pie reimagines the classic turon in an elegant dessert format, perfect for special occasions or when you want to treat yourself to something extraordinary.

## Our Creative Process

This dessert was born from our love of traditional Filipino turon and the desire to elevate it into something new. After months of testing, we perfected a recipe that captures the essence of street-food turon while presenting it as a sophisticated dessert.

### Key Ingredients:

**For the Crust:**
- Premium all-purpose flour
- Cold butter (European-style for extra richness)
- A touch of brown sugar
- Ice water
- Pinch of salt

**For the Filling:**
- Multiple layers of ripe saba bananas (caramelized)
- Sweet langka (jackfruit) pieces
- Brown sugar and butter
- Cinnamon and nutmeg
- Crispy turon wrapper pieces (for texture)
- Secret spice blend

**For the Caramel Drizzle:**
- Dark brown sugar
- Heavy cream
- Butter
- Vanilla extract
- Sea salt

### The Making Process:

1. **Crust Preparation:** Hand-made buttery, flaky pie crust that's partially baked for maximum crispiness
2. **Banana Caramelization:** Saba bananas are slowly caramelized with brown sugar until golden
3. **Layering:** Alternating layers of caramelized banana, jackfruit, and crispy turon pieces
4. **Baking:** Baked until the crust is golden and filling is bubbling
5. **Finishing Touch:** Drizzled with homemade salted caramel sauce

### What Makes It Special:
✓ Handcrafted crust made fresh daily
✓ Uses authentic Filipino saba bananas
✓ Unique textural contrast - flaky, creamy, and crispy
✓ Beautiful caramel glaze finish
✓ Serves 6-8 people (perfect for sharing)
✓ Can be served warm or at room temperature

### Serving Suggestions:
- Best enjoyed slightly warm
- Pairs beautifully with vanilla ice cream
- Excellent with our Lemon Tea or coffee
- Perfect for celebrations, gatherings, or as a special treat

### Storage:
- Room temperature: Best consumed within 2 days
- Refrigerated: Keeps for up to 5 days
- Can be reheated in oven at 300°F for 10 minutes

### Awards & Recognition:
This fusion dessert has become our customer favorite and represents our philosophy of honoring tradition while embracing creativity.

**Allergen Info:** Contains gluten, dairy, and eggs. May contain traces of nuts.

**Special Orders:** Available for events and celebrations. Contact us for whole pie orders (24-hour notice required).`,
      price: 179,
      image: '/product_images/pie.jpeg',
      category: 'Desserts',
      available: true,
    },
  ];

  // Upsert products (update if exists, create if not)
  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
        available: product.available,
        recipe: product.recipe,
      },
      create: product,
    });
  }

  console.log('Products seeded successfully');
  console.log(`Upserted ${products.length} products`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
