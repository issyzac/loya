#!/usr/bin/env node

/**
 * Wallet Component Test Runner
 * 
 * This script runs comprehensive tests for the wallet management system
 * and generates detailed reports on test coverage and results.
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runCommand(command, description) {
  log(`\n${description}`, 'cyan')
  log('─'.repeat(50), 'blue')
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit'
    })
    log(`✓ ${description} completed successfully`, 'green')
    return true
  } catch (error) {
    log(`✗ ${description} failed`, 'red')
    console.error(error.message)
    return false
  }
}

function generateTestReport() {
  const testSuites = [
    {
      name: 'Currency Utilities',
      path: 'src/utils/__tests__/currency.test.js',
      description: 'Tests for TZS currency formatting and validation functions'
    },
    {
      name: 'Wallet Service',
      path: 'src/api/__tests__/wallet-service.test.js',
      description: 'Unit tests for wallet API service methods'
    },
    {
      name: 'Wallet Service Integration',
      path: 'src/api/__tests__/wallet-service.integration.test.js',
      description: 'Integration tests for end-to-end wallet workflows'
    },
    {
      name: 'Wallet Summary Widget',
      path: 'src/pages/staff/wallet/components/__tests__/wallet-summary-widget.test.jsx',
      description: 'Tests for wallet overview dashboard widget'
    },
    {
      name: 'Wallet Activity Widget',
      path: 'src/pages/staff/wallet/components/__tests__/wallet-activity-widget.test.jsx',
      description: 'Tests for recent activity display widget'
    },
    {
      name: 'Form Validation',
      path: 'src/pages/staff/wallet/components/__tests__/form-validation.test.jsx',
      description: 'Tests for wallet form validation logic'
    },
    {
      name: 'Customer Search',
      path: 'src/pages/staff/wallet/__tests__/customer-search.test.jsx',
      description: 'Tests for customer search and balance display page'
    }
  ]

  log('\n📋 Test Suite Overview', 'magenta')
  log('═'.repeat(60), 'blue')
  
  testSuites.forEach((suite, index) => {
    const exists = fs.existsSync(suite.path)
    const status = exists ? '✓' : '✗'
    const statusColor = exists ? 'green' : 'red'
    
    log(`${index + 1}. ${suite.name}`, 'bright')
    log(`   ${colors[statusColor]}${status}${colors.reset} ${suite.path}`)
    log(`   ${suite.description}`, 'yellow')
    log('')
  })
}

function checkTestSetup() {
  log('\n🔧 Checking Test Setup', 'magenta')
  log('═'.repeat(30), 'blue')
  
  const requiredFiles = [
    'vite.config.js',
    'src/test/setup.js',
    'src/test/utils.jsx'
  ]
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file))
  
  if (missingFiles.length > 0) {
    log('Missing required test files:', 'red')
    missingFiles.forEach(file => log(`  ✗ ${file}`, 'red'))
    return false
  }
  
  log('✓ All test setup files present', 'green')
  return true
}

function runTestSuite() {
  log('\n🧪 Running Wallet Test Suite', 'magenta')
  log('═'.repeat(40), 'blue')
  
  const testCommands = [
    {
      command: 'npm run test -- --run --reporter=verbose src/utils/__tests__/currency.test.js',
      description: 'Currency Utilities Tests'
    },
    {
      command: 'npm run test -- --run --reporter=verbose src/api/__tests__/wallet-service.test.js',
      description: 'Wallet Service Unit Tests'
    },
    {
      command: 'npm run test -- --run --reporter=verbose src/api/__tests__/wallet-service.integration.test.js',
      description: 'Wallet Service Integration Tests'
    },
    {
      command: 'npm run test -- --run --reporter=verbose "src/pages/staff/wallet/**/*.test.jsx"',
      description: 'Wallet Component Tests'
    }
  ]
  
  let allPassed = true
  
  testCommands.forEach(({ command, description }) => {
    const success = runCommand(command, description)
    if (!success) allPassed = false
  })
  
  return allPassed
}

function generateCoverageReport() {
  log('\n📊 Generating Coverage Report', 'magenta')
  log('═'.repeat(35), 'blue')
  
  return runCommand(
    'npm run test:coverage -- --run --reporter=verbose',
    'Test Coverage Analysis'
  )
}

function displaySummary(testsPassed, coverageGenerated) {
  log('\n📈 Test Execution Summary', 'magenta')
  log('═'.repeat(40), 'blue')
  
  if (testsPassed) {
    log('✓ All wallet tests passed successfully', 'green')
  } else {
    log('✗ Some tests failed - check output above', 'red')
  }
  
  if (coverageGenerated) {
    log('✓ Coverage report generated', 'green')
    log('  View detailed report: coverage/index.html', 'cyan')
  } else {
    log('✗ Coverage report generation failed', 'red')
  }
  
  log('\n📁 Test Artifacts:', 'blue')
  log('  • Test results: Terminal output above')
  log('  • Coverage report: coverage/index.html')
  log('  • Coverage JSON: coverage/coverage-final.json')
  
  log('\n🎯 Next Steps:', 'blue')
  if (!testsPassed) {
    log('  1. Fix failing tests', 'yellow')
    log('  2. Re-run test suite', 'yellow')
  }
  log('  3. Review coverage report for gaps', 'yellow')
  log('  4. Add tests for uncovered code paths', 'yellow')
  log('  5. Update documentation if needed', 'yellow')
}

function main() {
  log('🚀 Wallet Component Test Suite Runner', 'bright')
  log('═'.repeat(50), 'blue')
  log('This script will run comprehensive tests for the wallet management system\n')
  
  // Check test setup
  if (!checkTestSetup()) {
    log('\n❌ Test setup incomplete. Please ensure all required files are present.', 'red')
    process.exit(1)
  }
  
  // Generate test report
  generateTestReport()
  
  // Run tests
  const testsPassed = runTestSuite()
  
  // Generate coverage
  const coverageGenerated = generateCoverageReport()
  
  // Display summary
  displaySummary(testsPassed, coverageGenerated)
  
  // Exit with appropriate code
  process.exit(testsPassed ? 0 : 1)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main, runTestSuite, generateCoverageReport }