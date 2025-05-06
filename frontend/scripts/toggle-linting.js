#!/usr/bin/env node

/**
 * Simple script to toggle ESLint on/off globally
 * Usage:
 *   node scripts/toggle-linting.js --disable  # Turn off linting
 *   node scripts/toggle-linting.js --enable   # Turn on linting
 */

const fs = require('fs');
const path = require('path');

const ESLINT_CONFIG_PATH = path.join(__dirname, '..', '.eslintrc.json');
const NEXT_CONFIG_PATH = path.join(__dirname, '..', 'next.config.js');

// Parse command line arguments
const arg = process.argv[2]?.toLowerCase();

if (arg !== '--disable' && arg !== '--enable') {
  console.error('Please specify either --disable or --enable');
  process.exit(1);
}

const disableLinting = arg === '--disable';

// Update ESLint config
try {
  const eslintConfig = {
    extends: "next/core-web-vitals",
    rules: disableLinting ? {
      // Disable all rules when --disable is used
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off"
    } : {
      // Default rules when --enable is used
      // You can customize this based on your preferences
    }
  };

  fs.writeFileSync(
    ESLINT_CONFIG_PATH, 
    JSON.stringify(eslintConfig, null, 2), 
    'utf8'
  );
  console.log(`ESLint rules ${disableLinting ? 'disabled' : 'enabled'}`);
} catch (error) {
  console.error('Error updating ESLint config:', error);
}

// Update Next.js config
try {
  let nextConfig;
  
  if (fs.existsSync(NEXT_CONFIG_PATH)) {
    // Try to preserve the existing config structure
    const configContent = fs.readFileSync(NEXT_CONFIG_PATH, 'utf8');
    
    if (disableLinting) {
      // Add ESLint disable config
      if (configContent.includes('eslint: {')) {
        // Update existing ESLint config
        nextConfig = configContent.replace(
          /eslint: {[^}]*}/,
          `eslint: {\n  ignoreDuringBuilds: true\n}`
        );
      } else {
        // Add new ESLint config
        nextConfig = configContent.replace(
          /const nextConfig = {/,
          `const nextConfig = {\n  eslint: {\n    ignoreDuringBuilds: true\n  },`
        );
      }
    } else {
      // Remove ESLint disable config
      nextConfig = configContent.replace(
        /eslint: {\s*ignoreDuringBuilds: true\s*},?/,
        ''
      );
      // Clean up empty objects or trailing commas if necessary
      nextConfig = nextConfig.replace(/{\s*,/g, '{');
      nextConfig = nextConfig.replace(/,\s*}/g, '}');
    }
    
    fs.writeFileSync(NEXT_CONFIG_PATH, nextConfig, 'utf8');
    console.log(`Next.js ESLint config ${disableLinting ? 'disabled' : 'enabled'}`);
  } else {
    // Create a new Next.js config file
    nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true${disableLinting ? `,
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  }` : ''}
}

module.exports = nextConfig`;

    fs.writeFileSync(NEXT_CONFIG_PATH, nextConfig, 'utf8');
    console.log(`Created new Next.js config with ESLint ${disableLinting ? 'disabled' : 'enabled'}`);
  }
} catch (error) {
  console.error('Error updating Next.js config:', error);
}

console.log(`Linting is now globally ${disableLinting ? 'DISABLED' : 'ENABLED'}`);
console.log(`Restart your development server for changes to take effect.`); 