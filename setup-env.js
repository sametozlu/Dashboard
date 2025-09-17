#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const envContent = `# Environment variables for NetMon Dashboard

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/netmon_db

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here
SESSION_MAX_AGE=24*60*60*1000 # 24 hours

# WebSocket Configuration
WS_PORT=5001

# Hardware Interface Configuration
HARDWARE_SERIAL_PORT=COM3
HARDWARE_BAUD_RATE=9600

# STM32 Configuration
STM32_SERIAL_PORT=COM4
STM32_BAUD_RATE=115200

# Security
BCRYPT_ROUNDS=12
JWT_SECRET=your-jwt-secret-key-here

# Logging
LOG_LEVEL=info
LOG_FILE=logs/netmon.log
`;

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
  console.log('⚠️  Please update the .env file with your actual configuration values');
} else {
  console.log('ℹ️  .env file already exists');
}
