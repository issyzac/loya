import { describe, it, expect } from 'vitest'
import {
  formatTZS,
  formatTZSWithStyle,
  parseTZSToCents,
  formatTZSForInput,
  validateTZSInput,
  formatBalanceDisplay,
  calculatePercentage,
  addAmounts,
  subtractAmounts,
  formatTransactionAmount
} from '../currency.js'

describe('Currency Utilities', () => {
  describe('formatTZS', () => {
    it('should format cents to TZS correctly', () => {
      expect(formatTZS(100)).toBe('TZS 1')
      expect(formatTZS(1000)).toBe('TZS 10')
      expect(formatTZS(12345)).toBe('TZS 123.45')
      expect(formatTZS(1234567)).toBe('TZS 12,345.67')
    })

    it('should handle zero and negative values', () => {
      expect(formatTZS(0)).toBe('TZS 0')
      expect(formatTZS(-1000)).toBe('TZS -10')
      expect(formatTZS(-12345)).toBe('TZS -123.45')
    })

    it('should handle null and undefined values', () => {
      expect(formatTZS(null)).toBe('TZS 0')
      expect(formatTZS(undefined)).toBe('TZS 0')
      expect(formatTZS(NaN)).toBe('TZS 0')
    })

    it('should format without currency symbol when requested', () => {
      expect(formatTZS(12345, false)).toBe('123.45')
      expect(formatTZS(1234567, false)).toBe('12,345.67')
    })

    it('should handle compact formatting for large numbers', () => {
      expect(formatTZS(100000000, true, { compact: true })).toBe('TZS 1.0M')
      expect(formatTZS(150000000, true, { compact: true })).toBe('TZS 1.5M')
      expect(formatTZS(500000, true, { compact: true })).toBe('TZS 5.0K')
      expect(formatTZS(75000, true, { compact: true })).toBe('TZS 750')
    })

    it('should respect formatting options', () => {
      expect(formatTZS(12345, true, { minimumFractionDigits: 2 })).toBe('TZS 123.45')
      expect(formatTZS(12300, true, { maximumFractionDigits: 0 })).toBe('TZS 123')
      expect(formatTZS(1234567, true, { useGrouping: false })).toBe('TZS 12345.67')
    })
  })

  describe('formatTZSWithStyle', () => {
    it('should return formatted currency with styling info', () => {
      const result = formatTZSWithStyle(12345, { colorCode: true, highlightLarge: true })
      
      expect(result.formatted).toBe('TZS 123.45')
      expect(result.amount).toBe(123.45)
      expect(result.isPositive).toBe(true)
      expect(result.isNegative).toBe(false)
      expect(result.isZero).toBe(false)
    })

    it('should apply color coding correctly', () => {
      const positive = formatTZSWithStyle(1000, { colorCode: true })
      expect(positive.color).toBe('positive')
      expect(positive.className).toBe('text-green-600')

      const negative = formatTZSWithStyle(-1000, { colorCode: true })
      expect(negative.color).toBe('negative')
      expect(negative.className).toBe('text-red-600')

      const zero = formatTZSWithStyle(0, { colorCode: true })
      expect(zero.color).toBe('neutral')
      expect(zero.className).toBe('text-gray-600')
    })

    it('should highlight large amounts', () => {
      const large = formatTZSWithStyle(10000000, { highlightLarge: true }) // 100K TZS
      expect(large.size).toBe('large')
      expect(large.isLarge).toBe(true)
      expect(large.className).toContain('font-bold text-lg')

      const medium = formatTZSWithStyle(1500000, { highlightLarge: true }) // 15K TZS
      expect(medium.size).toBe('medium')
      expect(medium.isMedium).toBe(true)
      expect(medium.className).toContain('font-semibold')

      const small = formatTZSWithStyle(500000, { highlightLarge: true }) // 5K TZS
      expect(small.size).toBe('normal')
      expect(small.isLarge).toBe(false)
      expect(small.isMedium).toBe(false)
    })
  })

  describe('parseTZSToCents', () => {
    it('should parse TZS strings to cents', () => {
      expect(parseTZSToCents('123.45')).toBe(12345)
      expect(parseTZSToCents('TZS 123.45')).toBe(12345)
      expect(parseTZSToCents('1,234.56')).toBe(123456)
      expect(parseTZSToCents('TZS 1,234.56')).toBe(123456)
    })

    it('should handle numbers', () => {
      expect(parseTZSToCents(123.45)).toBe(12345)
      expect(parseTZSToCents(1234.56)).toBe(123456)
    })

    it('should handle edge cases', () => {
      expect(parseTZSToCents('')).toBe(0)
      expect(parseTZSToCents(null)).toBe(0)
      expect(parseTZSToCents(undefined)).toBe(0)
      expect(parseTZSToCents('invalid')).toBe(0)
    })

    it('should round to nearest cent', () => {
      expect(parseTZSToCents('123.456')).toBe(12346) // Rounds up
      expect(parseTZSToCents('123.454')).toBe(12345) // Rounds down
    })
  })

  describe('formatTZSForInput', () => {
    it('should format for input fields without currency symbol', () => {
      expect(formatTZSForInput(12345)).toBe('123.45')
      expect(formatTZSForInput(1234567)).toBe('12,345.67')
      expect(formatTZSForInput(0)).toBe('0')
    })
  })

  describe('validateTZSInput', () => {
    it('should validate valid inputs', () => {
      const result = validateTZSInput('123.45')
      expect(result.isValid).toBe(true)
      expect(result.amount).toBe(12345)
    })

    it('should handle currency symbols and formatting', () => {
      expect(validateTZSInput('TZS 123.45').isValid).toBe(true)
      expect(validateTZSInput('1,234.56').isValid).toBe(true)
      expect(validateTZSInput('TZS 1,234.56').isValid).toBe(true)
    })

    it('should reject invalid inputs', () => {
      expect(validateTZSInput('').isValid).toBe(false)
      expect(validateTZSInput('   ').isValid).toBe(false)
      expect(validateTZSInput('abc').isValid).toBe(false)
      expect(validateTZSInput('123.456').isValid).toBe(false) // Too many decimals
    })

    it('should reject negative amounts', () => {
      const result = validateTZSInput('-123.45')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Amount cannot be negative')
    })

    it('should reject amounts that are too large', () => {
      const result = validateTZSInput('9999999999')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Amount is too large')
    })

    it('should provide appropriate error messages', () => {
      expect(validateTZSInput('').error).toBe('Amount is required')
      expect(validateTZSInput('abc').error).toBe('Please enter a valid amount')
      expect(validateTZSInput('123.456').error).toBe('Maximum 2 decimal places allowed')
    })
  })

  describe('formatBalanceDisplay', () => {
    it('should format positive balances', () => {
      const result = formatBalanceDisplay(12345)
      expect(result.amount).toBe('TZS 123.45')
      expect(result.isPositive).toBe(true)
      expect(result.className).toBe('text-green-600')
      expect(result.prefix).toBe('')
    })

    it('should format negative balances', () => {
      const result = formatBalanceDisplay(-12345)
      expect(result.amount).toBe('TZS 123.45') // Absolute value
      expect(result.isPositive).toBe(false)
      expect(result.className).toBe('text-red-600')
      expect(result.prefix).toBe('-')
    })

    it('should handle zero balance', () => {
      const result = formatBalanceDisplay(0)
      expect(result.amount).toBe('TZS 0')
      expect(result.isPositive).toBe(true)
      expect(result.className).toBe('text-green-600')
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentages correctly', () => {
      expect(calculatePercentage(10000, 10)).toBe(1000) // 10% of 100 TZS
      expect(calculatePercentage(50000, 20)).toBe(10000) // 20% of 500 TZS
      expect(calculatePercentage(12345, 15)).toBe(1852) // 15% of 123.45 TZS
    })

    it('should handle edge cases', () => {
      expect(calculatePercentage(0, 10)).toBe(0)
      expect(calculatePercentage(10000, 0)).toBe(0)
      expect(calculatePercentage(10000, 100)).toBe(10000)
    })

    it('should round to nearest cent', () => {
      expect(calculatePercentage(10001, 10)).toBe(1000) // Rounds down
      expect(calculatePercentage(10005, 10)).toBe(1001) // Rounds up
    })
  })

  describe('addAmounts', () => {
    it('should add amounts correctly', () => {
      expect(addAmounts(1000, 2000)).toBe(3000)
      expect(addAmounts(12345, 67890)).toBe(80235)
    })

    it('should handle null and undefined values', () => {
      expect(addAmounts(null, 1000)).toBe(1000)
      expect(addAmounts(1000, null)).toBe(1000)
      expect(addAmounts(undefined, 1000)).toBe(1000)
      expect(addAmounts(1000, undefined)).toBe(1000)
      expect(addAmounts(null, null)).toBe(0)
    })
  })

  describe('subtractAmounts', () => {
    it('should subtract amounts correctly', () => {
      expect(subtractAmounts(3000, 1000)).toBe(2000)
      expect(subtractAmounts(67890, 12345)).toBe(55545)
    })

    it('should handle null and undefined values', () => {
      expect(subtractAmounts(null, 1000)).toBe(-1000)
      expect(subtractAmounts(1000, null)).toBe(1000)
      expect(subtractAmounts(undefined, 1000)).toBe(-1000)
      expect(subtractAmounts(1000, undefined)).toBe(1000)
      expect(subtractAmounts(null, null)).toBe(0)
    })

    it('should handle negative results', () => {
      expect(subtractAmounts(1000, 2000)).toBe(-1000)
    })
  })

  describe('formatTransactionAmount', () => {
    it('should format credit transactions', () => {
      const result = formatTransactionAmount(12345, 'CREDIT')
      expect(result.amount).toBe('TZS 123.45')
      expect(result.direction).toBe('CREDIT')
      expect(result.isCredit).toBe(true)
      expect(result.className).toBe('text-green-600')
      expect(result.prefix).toBe('+')
      expect(result.displayAmount).toBe('+TZS 123.45')
    })

    it('should format debit transactions', () => {
      const result = formatTransactionAmount(12345, 'DEBIT')
      expect(result.amount).toBe('TZS 123.45')
      expect(result.direction).toBe('DEBIT')
      expect(result.isCredit).toBe(false)
      expect(result.className).toBe('text-red-600')
      expect(result.prefix).toBe('-')
      expect(result.displayAmount).toBe('-TZS 123.45')
    })
  })
})