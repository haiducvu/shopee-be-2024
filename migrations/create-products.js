const { faker } = require('@faker-js/faker');
const { Types } = require('mongoose');
const mongoose = require('mongoose');
const ProductFactory = require('../src/services/product-v2.service');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/dbTipJSDEV')
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

const SHOP_ID = new Types.ObjectId('66ef8e92e3459a1f99bed56e'); // Replace with actual shop ID if needed

const generateFakeElectronics = async () => {
    for (let i = 0; i < 10; i++) {
        await ProductFactory.createProduct('Electronics', {
            product_name: faker.commerce.productName(),
            product_thumb: faker.image.url(),
            product_description: faker.commerce.productDescription(),
            product_price: Number(faker.commerce.price()),
            product_quantity: faker.number.int({ min: 10, max: 100 }),
            product_type: 'Electronics',
            product_shop: SHOP_ID,
            product_attributes: {
                manufacturer: faker.company.name(),
                model: faker.vehicle.model(),
                color: faker.color.human(),
                type: faker.helpers.arrayElement(['Smartphone', 'Laptop', 'Tablet', 'TV']),
                product_shop: SHOP_ID
            },
            product_ratingAverage: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
            product_variations: [],
            isDraft: false,
            isPublished: true
        });
    }
}

const generateFakeClothing = async () => {
    for (let i = 0; i < 10; i++) {
        await ProductFactory.createProduct('Clothing', {
            product_name: faker.commerce.productName(),
            product_thumb: faker.image.url(),
            product_description: faker.commerce.productDescription(),
            product_price: Number(faker.commerce.price()),
            product_quantity: faker.number.int({ min: 10, max: 100 }),
            product_type: 'Clothing',
            product_shop: SHOP_ID,
            product_attributes: {
                brand: faker.company.name(),
                size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']),
                material: faker.helpers.arrayElement(['Cotton', 'Polyester', 'Wool', 'Silk']),
                type: faker.helpers.arrayElement(['Shirt', 'Pants', 'Dress', 'Jacket']),
                product_shop: SHOP_ID
            },
            product_ratingAverage: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
            product_variations: [],
            isDraft: false,
            isPublished: true
        });
    }
}

const generateFakeFurniture = async () => {
    for (let i = 0; i < 10; i++) {
        await ProductFactory.createProduct('Furniture', {
            product_name: faker.commerce.productName(),
            product_thumb: faker.image.url(),
            product_description: faker.commerce.productDescription(),
            product_price: Number(faker.commerce.price()),
            product_quantity: faker.number.int({ min: 5, max: 50 }),
            product_type: 'Furniture',
            product_shop: SHOP_ID,
            product_attributes: {
                brand: faker.company.name(),
                size: faker.helpers.arrayElement(['Small', 'Medium', 'Large']),
                material: faker.helpers.arrayElement(['Wood', 'Metal', 'Plastic', 'Glass']),
                type: faker.helpers.arrayElement(['Chair', 'Table', 'Bed', 'Sofa']),
                product_shop: SHOP_ID
            },
            product_ratingAverage: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
            product_variations: [],
            isDraft: false,
            isPublished: true
        });
    }
}

const generateAll = async () => {
    try {
        await generateFakeElectronics();
        console.log('Generated Electronics');
        await generateFakeClothing();
        console.log('Generated Clothing');
        await generateFakeFurniture();
        console.log('Generated Furniture');
        console.log('Successfully generated 30 fake products');
        process.exit(0);
    } catch (error) {
        console.error('Error generating products:', error);
        process.exit(1);
    }
}

generateAll();