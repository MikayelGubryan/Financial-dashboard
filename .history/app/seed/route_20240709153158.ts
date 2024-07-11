import bcrypt from 'bcrypt';
import { Client } from '@vercel/postgres';
import { Response } from 'express'; // Assuming Response is imported for handling responses
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

// Create a PostgreSQL client instance
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Connect to the PostgreSQL database
client.connect();

// Function to seed users table
async function seedUsers() {
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

    // Insert users data
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return client.query(`
          INSERT INTO users (id, name, email, password)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING;
        `, [user.id, user.name, user.email, hashedPassword]);
      }),
    );

    return insertedUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error; // Propagate error for handling at a higher level
  }
}

// Function to seed invoices table
async function seedInvoices() {
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create invoices table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      )
    `);

    // Insert invoices data
    const insertedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        return client.query(`
          INSERT INTO invoices (id, customer_id, amount, status, date)
          VALUES (uuid_generate_v4(), $1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING;
        `, [invoice.customer_id, invoice.amount, invoice.status, invoice.date]);
      }),
    );

    return insertedInvoices;
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error; // Propagate error for handling at a higher level
  }
}

// Function to seed customers table
async function seedCustomers() {
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create customers table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      )
    `);

    // Insert customers data
    const insertedCustomers = await Promise.all(
      customers.map(async (customer) => {
        return client.query(`
          INSERT INTO customers (id, name, email, image_url)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING;
        `, [customer.id, customer.name, customer.email, customer.image_url]);
      }),
    );

    return insertedCustomers;
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error; // Propagate error for handling at a higher level
  }
}

// Function to seed revenue table
async function seedRevenue() {
  try {
    // Create revenue table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) PRIMARY KEY NOT NULL,
        revenue INT NOT NULL
      )
    `);

    // Insert revenue data
    const insertedRevenue = await Promise.all(
      revenue.map(async (rev) => {
        return client.query(`
          INSERT INTO revenue (month, revenue)
          VALUES ($1, $2)
          ON CONFLICT (month) DO NOTHING;
        `, [rev.month, rev.revenue]);
      }),
    );

    return insertedRevenue;
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error; // Propagate error for handling at a higher level
  }
}

// Seed endpoint handler
export async function GET(req, res) {
  try {
    await client.query('BEGIN'); // Start transaction

    // Call seeding functions
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    await client.query('COMMIT'); // Commit transaction

    // Return success response
    res.status(200).json({ message: 'Database seeded successfully' });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error('Error in database seeding:', error);
    res.status(500).json({ error: 'Database seeding failed' });
  }
}
