import { PrismaClient, ProductType } from '@prisma/client';
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

  // Create sample customers with discount approvals (for testing)
  const customerPassword = await bcrypt.hash('customer123', 10);

  // Sample customer with approved PWD discount
  await prisma.user.upsert({
    where: { email: 'pwd.customer@example.com' },
    update: {},
    create: {
      email: 'pwd.customer@example.com',
      password: customerPassword,
      name: 'Juan Dela Cruz',
      phone: '09123456789',
      address: '123 PWD Street, Barangay Pinagbuhatan, Pasig City, 1602',
      role: 'customer',
      discountApproved: true,
      discountType: 'PWD',
      discountApprovedAt: new Date('2024-01-15'),
    },
  });

  // Sample customer with approved Senior discount
  await prisma.user.upsert({
    where: { email: 'senior.customer@example.com' },
    update: {},
    create: {
      email: 'senior.customer@example.com',
      password: customerPassword,
      name: 'Maria Santos',
      phone: '09876543210',
      address: '456 Senior Lane, Barangay Kapitolyo, Pasig City, 1603',
      role: 'customer',
      discountApproved: true,
      discountType: 'SENIOR',
      discountApprovedAt: new Date('2024-02-20'),
    },
  });

  // Sample customer with pending discount application
  await prisma.user.upsert({
    where: { email: 'pending.customer@example.com' },
    update: {},
    create: {
      email: 'pending.customer@example.com',
      password: customerPassword,
      name: 'Pedro Reyes',
      phone: '09187654321',
      address: '789 Pending Avenue, Barangay San Miguel, Pasig City, 1605',
      role: 'customer',
      discountApproved: false,
    },
  });

  // Sample customer without discount
  await prisma.user.upsert({
    where: { email: 'regular.customer@example.com' },
    update: {},
    create: {
      email: 'regular.customer@example.com',
      password: customerPassword,
      name: 'Ana Gonzales',
      phone: '09234567890',
      address: '321 Regular Street, Barangay Rosario, Pasig City, 1604',
      role: 'customer',
      discountApproved: false,
    },
  });

  console.log('Sample customers created');

  // Create discount approval records for testing
  const pwdUser = await prisma.user.findUnique({
    where: { email: 'pwd.customer@example.com' }
  });
  const seniorUser = await prisma.user.findUnique({
    where: { email: 'senior.customer@example.com' }
  });
  const pendingUser = await prisma.user.findUnique({
    where: { email: 'pending.customer@example.com' }
  });

  if (pwdUser) {
    await prisma.discountApproval.upsert({
      where: { id: 'pwd-approval-test' },
      update: {},
      create: {
        id: 'pwd-approval-test',
        userId: pwdUser.id,
        discountType: 'PWD',
        birthday: new Date('1990-05-15'),
        idNumber: 'PWD-2024-00123',
        idImageUrl: '/uploads/discount-ids/pwd-sample.jpg',
        status: 'APPROVED',
        isApproved: true,
        reviewedBy: 'admin-user',
        reviewedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-10'),
      },
    });
  }

  if (seniorUser) {
    await prisma.discountApproval.upsert({
      where: { id: 'senior-approval-test' },
      update: {},
      create: {
        id: 'senior-approval-test',
        userId: seniorUser.id,
        discountType: 'SENIOR',
        birthday: new Date('1960-03-20'),
        idNumber: 'SENIOR-2024-00456',
        idImageUrl: '/uploads/discount-ids/senior-sample.jpg',
        status: 'APPROVED',
        isApproved: true,
        reviewedBy: 'admin-user',
        reviewedAt: new Date('2024-02-20'),
        createdAt: new Date('2024-02-15'),
      },
    });
  }

  if (pendingUser) {
    await prisma.discountApproval.upsert({
      where: { id: 'pending-approval-test' },
      update: {},
      create: {
        id: 'pending-approval-test',
        userId: pendingUser.id,
        discountType: 'PWD',
        birthday: new Date('1985-08-10'),
        idNumber: 'PWD-2024-00789',
        idImageUrl: '/uploads/discount-ids/pending-sample.jpg',
        status: 'PENDING',
        isApproved: false,
        createdAt: new Date('2024-03-01'),
      },
    });
  }

  console.log('Discount approval records created');

  // Create products with variants - UPDATED with productType and split pricing
  const products = [
    { 
      name: 'Kikiam', 
      description: 'Experience a symphony of textures in every bite! Our Signature Beef & Pork Kikiam brings you the ultimate crunch on the outside, with a succulent, herb-infused center that melts in your mouth. It’s the classic street food you love, redefined with premium meats for a gourmet twist.',
      recipe: `Helps improve oxygen circulation, boost immunity, and support overall energy levels.

              Key Nutrients

              Essential for muscle repair and growth, sourced from beef and pork.
              Significant amounts from the beef component support blood health and immune function.
              Provides a sustained energy boost.`,
      image: 'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1768493862413-kikiam.png',
      category: 'Appetizers',
      available: true,
      featured: true,
      productType: ProductType.both, // Available both in-store and online
      variants: [
        { label: 'Regular (3 pcs)', inStorePrice: 99, onlinePrice: 109 }, // Online slightly higher
        { label: 'Family Pack (6 pcs)', inStorePrice: 179, onlinePrice: 189 },
        { label: 'Party Pack (12 pcs)', inStorePrice: 329, onlinePrice: 339 },
      ],
    },
    { 
      name: 'Kalabasa Pansit', 
      description: `Golden noodles made from real kalabasa—comfort food, naturally nourished.

                    A plant-based noodle made with kalabasa and spices, offering natural color, flavor, and everyday nourishment.
                    Made with real kalabasa, not artificial coloring or flavoring, get-friendly.`,
      recipe: `Key Nutrients

              Naturally rich in beta-carotene, which the body converts to Vitamin A
              Supports eye health, skin nourishment, and immune support
              Provides dietary fiber that supports digestion and fullness`,
      image: 'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1768493138877-kalabasa-pansit.png',
      category: 'Noodles',
      available: true,
      featured: true,
      productType: ProductType.both,
      variants: [
        { label: 'Single Serving', inStorePrice: 149, onlinePrice: 159 },
        { label: 'Family Size (Serves 3-4)', inStorePrice: 399, onlinePrice: 419 },
        { label: 'Party Size (Serves 6-8)', inStorePrice: 699, onlinePrice: 729 },
      ],
    },
    { 
      name: 'Lemon Tea', 
      description: `Refreshing • Healthy • Budget-Friendly

                    “A refreshing fusion of citrus vitality and tea antioxidants—crafted for everyday wellness.”

                    All-natural, Home-crafted wellness drinks!`,
      recipe: `Key Nutrients

              Rich in Vitamin C
              Natural antioxidants
              Natural energy lift
              Supports immune health`,
      image: 'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1768538230642-lemon-tea.png',
      category: 'Beverages',
      available: true,
      featured: true,
      productType: ProductType.both,
      variants: [
        { label: 'Regular (16oz)', inStorePrice: 59, onlinePrice: 65 }, // Same price
        { label: 'Large (22oz)', inStorePrice: 79, onlinePrice: 85 },
        { label: 'Pitcher (Serves 4-5)', inStorePrice: 199, onlinePrice: 205 },
      ],
    },
    { 
      name: 'Turon Bites', 
      description: `Naturally sweet banana rolls—simple, satisfying, and just right.

                    A classic banana roll made from real saba bananas, lightly sweetened and served with an optional dip for added indulgence.`,
      recipe: `Key Nutrients

              Provides potassium, which supports muscle and heart function
              Naturally rich in dietary fiber
              Contains natural carbohydrates for sustained energy
              Balanced sweetness
              Lightly sweetened to highlight the natural flavor of banana
              Helps avoid sugar overload while remaining satisfying`,
      image: 'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1768493121701-turon.png',
      category: 'Desserts',
      available: true,
      featured: true,
      productType: ProductType.both,
      variants: [
        { label: 'Regular (6 pcs)', inStorePrice: 90, onlinePrice: 100 },
        { label: 'Friends Pack (12 pcs)', inStorePrice: 170, onlinePrice: 180 },
      ],
    },
    { 
      name: 'Moringa Pansit', 
      description: `Real moringa. Real nourishment. A modern take on classic pansit.

                    A plant-powered noodle dish made with moringa leaves, spices, and care—designed to nourish the body naturally.`,
      recipe: `Naturally colored and flavored—no artificial enhancers. Crafted in-house to ensure quality, authenticity, and traceability


                Key Nutrients

                Naturally rich in plant protein, dietary fiber, and essential minerals
                Good source of iron, potassium, and magnesium`,
      image: 'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1768493104121-moringa-pansit.png',
      category: 'Noodles',
      available: true,
      featured: false,
      productType: ProductType.both,
      variants: [
        { label: 'Regular', inStorePrice: 140, onlinePrice: 160 }, 
      ],
    },
    
    { 
      name: 'Lumpiang Shanghai', 
      description: `Hand-prepared lumpia made from pork, beef, vegetables, and spices—crafted for balanced flavor and nourishment.

      A classic lumpia made richer with real meat, vegetables, and purposeful ingredients.`,
      recipe: `Balanced blend of meat and vegetables

              Key Nutrients

              Gives you high-quality protein essential for muscle repair and energy
              Source of Iron and B Vitamins
              Rich in dietary fiber
              Provides Vitamin A and C`,
      image: 'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1768493179655-lumpia.png',
      category: 'Desserts',
      available: true,
      featured: true,
      productType: ProductType.both, 
      variants: [
        { label: 'Regular (6 pcs)', inStorePrice: 140, onlinePrice: 160 },
        { label: 'Friends Pack (12 pcs)', inStorePrice: 270, onlinePrice: 290 },
      ],
    },
    { 
      name: 'Meatballs', 
      description: `Handcrafted meatballs made with pork, beef, vegetables, milk, and spices—designed for balanced flavor and nourishment.

                    Hearty meatballs made from real meat, vegetables, and purposeful ingredients.`,
      recipe: `Balanced mix of meat, vegetables, and dairy

                Key Nutrients

                Good source of high-quality protein for muscle strength
                Source of iron and vitamin B-complex for stamina
                Provides vitamin A and C
                Contributes calcium and protein`,
      image: 'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1768493154138-meatballs.png',
      category: 'Appetizers',
      available: true,
      featured: false,
      productType: ProductType.both,
      variants: [
        { label: 'Regular (6pcs)', inStorePrice: 150, onlinePrice: 160 }, 
        { label: 'Sakto Pack (12 pcs)', inStorePrice: 280, onlinePrice: 290 },
      ],
    },
    
    { 
      name: `Valentine's Feast Bundles`, 
      description: `Celebrate Love with a Delicious & Healthy Feast!

                    Make this Valentine’s Day extra special with our Valentine’s Bundle, packed with tasty, premium-quality snacks and meals. Perfect for sharing with your loved one—or treating yourself! Every item is carefully prepared to be flavorful, satisfying, and budget-friendly.`,
      recipe: `✨ Premium ingredients at an affordable price
                ✨ Fresh, hygienically packed, and ready to enjoy
                ✨ Balanced flavors, naturally wholesome
                ✨ Ideal for a romantic meal or cozy celebration

                Bundle Includes: 

                10 pcs Juicy Meatballs: Protein-rich, savory, and satisfying
                10 pcs Crispy Lumpia Shanghai: Golden, crispy, and perfectly seasoned
                2 pcs Refreshing Lemon Tea: Light, antioxidant-rich, and naturally refreshing 
                1–3 servings Kalabasa Pancit: Nutrient-packed, flavorful, and lightly sweet

                 

                Health & Lifestyle Benefits: 

                Balanced & Filling: Combines protein, vegetables, and light drinks
                Naturally Flavorful: Minimal additives, highlighting fresh ingredients
                Mindful Snacking: Perfect portions to enjoy without overindulging
                Convenient & Ready-to-Serve: Quick, easy, and hassle-free for your celebration`,
      image: 'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1767537950346-promo-products-03_ver_2.0.png',
      category: 'Main-dishes',
      available: true,
      featured: true,
      productType: ProductType.both, 
      variants: [
        { label: 'Regular', inStorePrice: 500, onlinePrice: 550  },
      ],
    },
  ];

  // Upsert products with variants
  for (const product of products) {
    const { variants, ...productData } = product;
    
    const existingProduct = await prisma.product.findUnique({
      where: { name: product.name },
      include: { variants: true },
    });

    if (existingProduct) {
      // Update product
      await prisma.product.update({
        where: { name: product.name },
        data: {
          description: product.description,
          recipe: product.recipe,
          image: product.image,
          category: product.category,
          available: product.available,
          featured: product.featured,
          productType: product.productType,
        },
      });

      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId: existingProduct.id },
      });

      // Create new variants with split pricing
      for (const variant of variants) {
        await prisma.productVariant.create({
          data: {
            label: variant.label,
            inStorePrice: variant.inStorePrice,
            onlinePrice: variant.onlinePrice,
            productId: existingProduct.id,
          },
        });
      }
      console.log(`Updated product: ${product.name}`);
    } else {
      // Create new product with variants
      await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          recipe: product.recipe,
          image: product.image,
          category: product.category,
          available: product.available,
          featured: product.featured,
          productType: product.productType,
          variants: {
            create: variants.map(v => ({
              label: v.label,
              inStorePrice: v.inStorePrice,
              onlinePrice: v.onlinePrice,
            })),
          },
        },
      });
      console.log(`Created product: ${product.name}`);
    }
  }

  console.log(`Products seeded successfully`);
  console.log(`Upserted ${products.length} products with variants`);

  // Create sample settings
  await prisma.setting.upsert({
    where: { key: 'store_info' },
    update: {},
    create: {
      key: 'store_info',
      value: {
        name: "Alexander's Handcrafted Cuisine",
        address: 'Pinagbuhatan, Pasig City, Metro Manila, Philippines 1602',
        phone: '+63 (2) 1234 5678',
        email: 'info@alexanderscuisine.com',
        gcashNumber: '09171234567',
        gcashName: "Alexander's Cuisine",
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: 'delivery_fees' },
    update: {},
    create: {
      key: 'delivery_fees',
      value: {
        sameArea: 50,
        sameCity: 80,
        adjacentCity: 100,
        centralManila: 120,
        southernManila: 150,
        northernManila: 180,
        rizal: 200,
        antipolo: 220,
        default: 250,
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: 'discount_settings' },
    update: {},
    create: {
      key: 'discount_settings',
      value: {
        pwdDiscount: 20,
        seniorDiscount: 20,
        requiresApproval: true,
        maxFileSize: 5, // MB
        allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png'],
      },
    },
  });

  console.log('Settings seeded successfully');

  /* =========================
   FAQ SEED (SAFE UPSERT)
========================= */

const faqs = [
  {
    question: 'How do I apply for a PWD or Senior discount?',
    answer:
      'Go to your profile page and upload your valid government ID for admin approval.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept Cash on Delivery (COD) and GCash payments.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Delivery within Pasig City typically takes 30–60 minutes depending on traffic.',
  },
];

for (const faq of faqs) {
  const existing = await prisma.fAQ.findFirst({
    where: { question: faq.question },
  });

  if (!existing) {
    await prisma.fAQ.create({
      data: faq,
    });
  }
}

console.log('FAQ seeded successfully');

/* =========================
   TESTIMONIAL SEED (SAFE)
========================= */

const testimonials = [
  {
    customerName: 'Walter Toledo',
    message:
      'What makes this kikiam truly special is how hearty yet light it feels. Unlike typical fried snacks, it has a clean, savory finish that pairs perfectly with rice or even on its own. Knowing it’s made with wholesome herbs and quality meat makes it even more enjoyable.',
  },
  {
    customerName: 'Janabeth Marie Adonis',
    message:
      `The turon has a distinct flavor from the others. It's not your typical turon from other stores. A hint of sourness balances the sweetness and makes you crave for more. If you like a sweeter and different flavor, you can also dip the turon in a caramel dip sauce.`,
  },
  {
    customerName: 'Angela Cruz',
    message:
      'Fast delivery and excellent customer service.',
  },
];

for (const testimonial of testimonials) {
  const exists = await prisma.testimonial.findFirst({
    where: {
      customerName: testimonial.customerName,
      message: testimonial.message,
    },
  });

  if (!exists) {
    await prisma.testimonial.create({
      data: testimonial,
    });
  }
}

console.log('Testimonials seeded successfully');

/* =========================
   SLIDER IMAGES (UPSERT SAFE)
========================= */

const sliderImages = [
  {
    name: 'Lumpiang Shanghai',
    image:
      'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1771399460315-Lumpia__2_.png',
  },
  {
    name: 'Kalabasa pansit',
    image:
      'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1771399367790-pancit__1___1_.png',
  },
  {
    name: 'Moringa Pansit',
    image:
      'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1771399345130-Moringa_pancit__2_.png',
  },
  {
    name: 'Turon Banner',
    image:
      'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1769511130463-Turon__1_.png',
  },
  {
    name: 'Lemon Tea Banner',
    image:
      'https://abacusai-apps-732b0d8cf56a8f4156d10568-us-west-2.s3.us-west-2.amazonaws.com/17515/public/uploads/1769511295604-Lemon__2_.png',
  },
  
];

for (const slider of sliderImages) {
  await prisma.sliderImage.upsert({
    where: { name: slider.name },
    update: {
      image: slider.image,
    },
    create: slider,
  });
}

  console.log('Slider images seeded successfully');
  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });