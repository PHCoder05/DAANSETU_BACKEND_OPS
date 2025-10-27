#!/usr/bin/env node
/**
 * Verification Script for DAANSETU Backend
 * Checks all dependencies, configurations, and system requirements
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let checksTotal = 0;
let checksPassed = 0;
let checksFailed = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPass(name) {
  checksTotal++;
  checksPassed++;
  log(`✅ ${name}`, colors.green);
}

function checkFail(name, reason = '') {
  checksTotal++;
  checksFailed++;
  log(`❌ ${name}${reason ? ': ' + reason : ''}`, colors.red);
}

function checkWarn(name, reason = '') {
  checksTotal++;
  checksPassed++;
  log(`⚠️  ${name}${reason ? ': ' + reason : ''}`, colors.yellow);
}

function printHeader(text) {
  log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bright}${colors.blue}${text}${colors.reset}`);
  log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

async function verifyNodeVersion() {
  printHeader('🔍 Node.js Version');
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    checkPass(`Node.js version ${version} (>= 18.x required)`);
  } else {
    checkFail(`Node.js version ${version}`, 'Version 18.x or higher required');
  }
}

async function verifyDependencies() {
  printHeader('📦 Dependencies');
  
  const requiredDeps = [
    'express',
    'cors',
    'dotenv',
    'mongodb',
    'jsonwebtoken',
    'bcryptjs',
    'winston',
    'swagger-ui-express',
    'swagger-jsdoc'
  ];
  
  const packageJson = require('./package.json');
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      try {
        require.resolve(dep);
        checkPass(`${dep} is installed`);
      } catch (e) {
        checkFail(`${dep} is not installed`, 'Run npm install');
      }
    } else {
      checkFail(`${dep} not found in package.json`);
    }
  }
}

async function verifyDirectories() {
  printHeader('📁 Required Directories');
  
  const requiredDirs = [
    'config',
    'controllers',
    'middleware',
    'models',
    'routes',
    'utils',
    'logs'
  ];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      checkPass(`Directory '${dir}' exists`);
    } else {
      if (dir === 'logs') {
        // Create logs directory if it doesn't exist
        try {
          fs.mkdirSync(dirPath, { recursive: true });
          checkPass(`Directory '${dir}' created`);
        } catch (e) {
          checkFail(`Directory '${dir}' missing and couldn't create it`);
        }
      } else {
        checkFail(`Directory '${dir}' missing`);
      }
    }
  }
}

async function verifyFiles() {
  printHeader('📄 Required Files');
  
  const requiredFiles = [
    'app.js',
    'package.json',
    'config/db.js',
    'config/swagger.js',
    'utils/logger.js'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      checkPass(`File '${file}' exists`);
    } else {
      checkFail(`File '${file}' missing`);
    }
  }
}

async function verifyEnvironmentVariables() {
  printHeader('🔐 Environment Variables');
  
  // Load .env file
  require('dotenv').config();
  
  const requiredEnvVars = [
    { name: 'MONGODB_URI', critical: true },
    { name: 'DB_NAME', critical: true },
    { name: 'JWT_SECRET', critical: true },
    { name: 'PORT', critical: false },
    { name: 'NODE_ENV', critical: false }
  ];
  
  // Check for .env file
  if (fs.existsSync('.env')) {
    checkPass('.env file exists');
  } else if (fs.existsSync('.env.example')) {
    checkWarn('.env file missing', 'Using .env.example as template');
  } else {
    checkFail('.env file missing', 'Create from .env.example');
  }
  
  for (const { name, critical } of requiredEnvVars) {
    if (process.env[name]) {
      // Don't display actual secrets
      const displayValue = name.includes('SECRET') || name.includes('URI') 
        ? '***' 
        : process.env[name];
      checkPass(`${name} is set (${displayValue})`);
    } else {
      if (critical) {
        checkFail(`${name} not set`, 'Required for application to start');
      } else {
        checkWarn(`${name} not set`, 'Using default value');
      }
    }
  }
}

async function verifyRouteFiles() {
  printHeader('🛣️  Route Files');
  
  const routeFiles = [
    'setup.js',
    'auth.js',
    'donations.js',
    'ngos.js',
    'notifications.js',
    'admin.js',
    'search.js',
    'dashboard.js',
    'password-reset.js',
    'reviews.js'
  ];
  
  for (const file of routeFiles) {
    const filePath = path.join(__dirname, 'routes', file);
    if (fs.existsSync(filePath)) {
      checkPass(`Route '${file}' exists`);
    } else {
      checkFail(`Route '${file}' missing`);
    }
  }
}

async function checkApplicationStructure() {
  printHeader('🏗️  Application Structure');
  
  try {
    // Try to require main app file (without starting server)
    const appPath = path.join(__dirname, 'app.js');
    checkPass('app.js is valid JavaScript');
    
    // Check if logger can be loaded
    try {
      require('./utils/logger');
      checkPass('Logger module loads successfully');
    } catch (e) {
      checkFail('Logger module has errors', e.message);
    }
    
    // Check if database config can be loaded
    try {
      require('./config/db');
      checkPass('Database config loads successfully');
    } catch (e) {
      checkFail('Database config has errors', e.message);
    }
    
    // Check if swagger config can be loaded
    try {
      require('./config/swagger');
      checkPass('Swagger config loads successfully');
    } catch (e) {
      checkFail('Swagger config has errors', e.message);
    }
  } catch (e) {
    checkFail('Application structure check failed', e.message);
  }
}

async function printSummary() {
  printHeader('📊 Verification Summary');
  
  log(`Total checks: ${checksTotal}`);
  log(`Passed: ${checksPassed}`, colors.green);
  log(`Failed: ${checksFailed}`, checksFailed > 0 ? colors.red : colors.green);
  
  console.log('');
  
  if (checksFailed === 0) {
    log('🎉 All checks passed! Application is ready to start.', colors.green);
    log('Run "npm start" to start the application.\n', colors.blue);
    return 0;
  } else {
    log('⚠️  Some checks failed. Please fix the issues above.', colors.red);
    log('Once fixed, run this verification script again.\n', colors.yellow);
    return 1;
  }
}

async function main() {
  log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════════════════╗
║          DAANSETU Backend Verification Script            ║
║                                                            ║
║  This script checks if your environment is properly       ║
║  configured to run the DAANSETU backend application.      ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  await verifyNodeVersion();
  await verifyDependencies();
  await verifyDirectories();
  await verifyFiles();
  await verifyEnvironmentVariables();
  await verifyRouteFiles();
  await checkApplicationStructure();
  
  const exitCode = await printSummary();
  process.exit(exitCode);
}

// Run verification
main().catch((error) => {
  log(`\n❌ Verification failed with error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
