#!/usr/bin/env node
/**
 * Database Connection Tester
 * Run this to verify MongoDB connection before starting the server
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pem-energy';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║           Database Connection Tester                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`🔍 Attempting to connect to: ${MONGODB_URI}\n`);

const testConnection = async () => {
  try {
    // Set a timeout for the connection attempt
    const connectionTimeout = setTimeout(() => {
      console.error('\n⏱️  Connection timeout! MongoDB is not responding.\n');
      console.log('📋 Troubleshooting steps:');
      console.log('   1. Check if MongoDB is installed: mongod --version');
      console.log('   2. Start MongoDB service');
      console.log('   3. Verify connection: mongosh');
      console.log('   4. Check if port 27017 is open\n');
      process.exit(1);
    }, 5000);

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    clearTimeout(connectionTimeout);

    console.log('✅ Successfully connected to MongoDB!\n');
    console.log('Connection Details:');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}\n`);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    if (collections.length === 0) {
      console.log('   (No collections yet - they will be created when you add data)\n');
    } else {
      collections.forEach(coll => console.log(`   - ${coll.name}`));
      console.log();
    }

    console.log('📊 Document counts:');
    try {
      const Meter = mongoose.model('Meter', new mongoose.Schema({}), 'meters');
      const User = mongoose.model('User', new mongoose.Schema({}), 'users');
      const Reading = mongoose.model('Reading', new mongoose.Schema({}), 'meterreadings');

      const meterCount = await Meter.estimatedDocumentCount().catch(() => 0);
      const userCount = await User.estimatedDocumentCount().catch(() => 0);
      const readingCount = await Reading.estimatedDocumentCount().catch(() => 0);

      console.log(`   - Meters: ${meterCount}`);
      console.log(`   - Users: ${userCount}`);
      console.log(`   - Readings: ${readingCount}\n`);
    } catch (err) {
      console.log('   (Unable to count documents)\n');
    }

    console.log('✅ All checks passed! You can start the server.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.error('\n📋 Possible solutions:');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   1. MongoDB is not running. Start it with: mongod');
      console.error('   2. Check if MongoDB is installed on your system');
      console.error('   3. Verify port 27017 is not blocked by firewall');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('   1. Check your MONGODB_URI in .env file');
      console.error('   2. Verify the hostname/IP is correct');
    } else if (error.message.includes('authentication')) {
      console.error('   1. Check username/password in MONGODB_URI');
      console.error('   2. Verify user has access to the database');
    }
    
    console.error('\n💡 Current configuration:');
    console.error(`   MONGODB_URI: ${MONGODB_URI}`);
    console.error(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);
    
    process.exit(1);
  }
};

testConnection();
