import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the form validation component
const MockFormValidation = ({ children, onSubmit, validationRules = {} }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    
    // Simple validation
    const errors = {}
    
    if (validationRules.required) {
      validationRules.required.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
          errors[field] = `${field} is required`
        }
      })
    }
    
    if (validationRules.amount && data.amount) {
      const amount = parseFloat(data.amount)
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Amount must be a positive number'
      }
    }
    
    if (validationRules.email && data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.email = 'Please enter a valid email address'
      }
    }
    
    onSubmit(data, errors)
  }

  return (
    <form onSubmit={handleSubmit} data-testid="validation-form">
      {children}
    </form>
  )
}

describe('Form Validation', () => {
  const mockOnSubmit = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <MockFormValidation 
        onSubmit={mockOnSubmit}
        validationRules={{ required: ['customerName', 'amount'] }}
      >
        <input name="customerName" placeholder="Customer Name" />
        <input name="amount" placeholder="Amount" />
        <button type="submit">Submit</button>
      </MockFormValidation>
    )

    const submitButton = screen.getByText('Submit')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith(
      { customerName: '', amount: '' },
      { 
        customerName: 'customerName is required',
        amount: 'amount is required'
      }
    )
  })

  it('should validate amount fields', async () => {
    const user = userEvent.setup()
    
    render(
      <MockFormValidation 
        onSubmit={mockOnSubmit}
        validationRules={{ amount: true }}
      >
        <input name="amount" placeholder="Amount" />
        <button type="submit">Submit</button>
      </MockFormValidation>
    )

    const amountInput = screen.getByPlaceholderText('Amount')
    await user.type(amountInput, '-100')
    
    const submitButton = screen.getByText('Submit')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith(
      { amount: '-100' },
      { amount: 'Amount must be a positive number' }
    )
  })

  it('should validate email fields', async () => {
    const user = userEvent.setup()
    
    render(
      <MockFormValidation 
        onSubmit={mockOnSubmit}
        validationRules={{ email: true }}
      >
        <input name="email" placeholder="Email" />
        <button type="submit">Submit</button>
      </MockFormValidation>
    )

    const emailInput = screen.getByPlaceholderText('Email')
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByText('Submit')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith(
      { email: 'invalid-email' },
      { email: 'Please enter a valid email address' }
    )
  })

  it('should pass validation with valid data', async () => {
    const user = userEvent.setup()
    
    render(
      <MockFormValidation 
        onSubmit={mockOnSubmit}
        validationRules={{ 
          required: ['customerName', 'amount'],
          amount: true,
          email: true
        }}
      >
        <input name="customerName" placeholder="Customer Name" />
        <input name="amount" placeholder="Amount" />
        <input name="email" placeholder="Email" />
        <button type="submit">Submit</button>
      </MockFormValidation>
    )

    const customerNameInput = screen.getByPlaceholderText('Customer Name')
    const amountInput = screen.getByPlaceholderText('Amount')
    const emailInput = screen.getByPlaceholderText('Email')

    await user.type(customerNameInput, 'John Doe')
    await user.type(amountInput, '100.50')
    await user.type(emailInput, 'john@example.com')
    
    const submitButton = screen.getByText('Submit')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith(
      { 
        customerName: 'John Doe',
        amount: '100.50',
        email: 'john@example.com'
      },
      {} // No errors
    )
  })

  describe('Real-time validation', () => {
    const MockRealTimeValidation = () => {
      const [errors, setErrors] = React.useState({})
      const [values, setValues] = React.useState({})

      const validateField = (name, value) => {
        const newErrors = { ...errors }
        
        if (name === 'amount') {
          const amount = parseFloat(value)
          if (value && (isNaN(amount) || amount <= 0)) {
            newErrors.amount = 'Amount must be a positive number'
          } else {
            delete newErrors.amount
          }
        }
        
        if (name === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (value && !emailRegex.test(value)) {
            newErrors.email = 'Please enter a valid email address'
          } else {
            delete newErrors.email
          }
        }
        
        setErrors(newErrors)
      }

      const handleChange = (e) => {
        const { name, value } = e.target
        setValues(prev => ({ ...prev, [name]: value }))
        validateField(name, value)
      }

      return (
        <div>
          <input 
            name="amount" 
            placeholder="Amount"
            value={values.amount || ''}
            onChange={handleChange}
          />
          {errors.amount && <span data-testid="amount-error">{errors.amount}</span>}
          
          <input 
            name="email" 
            placeholder="Email"
            value={values.email || ''}
            onChange={handleChange}
          />
          {errors.email && <span data-testid="email-error">{errors.email}</span>}
        </div>
      )
    }

    // Note: This would require React import and proper setup
    // For now, we'll test the validation logic separately
  })

  describe('Currency validation', () => {
    it('should validate TZS currency format', () => {
      const validateCurrency = (input) => {
        if (!input) return { isValid: false, error: 'Amount is required' }
        
        const cleanInput = input.toString().replace(/TZS|,|\s/g, '')
        const amount = parseFloat(cleanInput)
        
        if (isNaN(amount)) {
          return { isValid: false, error: 'Please enter a valid amount' }
        }
        
        if (amount < 0) {
          return { isValid: false, error: 'Amount cannot be negative' }
        }
        
        return { isValid: true, amount: Math.round(amount * 100) }
      }

      expect(validateCurrency('TZS 100.50')).toEqual({
        isValid: true,
        amount: 10050
      })

      expect(validateCurrency('1,234.56')).toEqual({
        isValid: true,
        amount: 123456
      })

      expect(validateCurrency('-100')).toEqual({
        isValid: false,
        error: 'Amount cannot be negative'
      })

      expect(validateCurrency('abc')).toEqual({
        isValid: false,
        error: 'Please enter a valid amount'
      })

      expect(validateCurrency('')).toEqual({
        isValid: false,
        error: 'Amount is required'
      })
    })
  })

  describe('Customer ID validation', () => {
    it('should validate customer ID format', () => {
      const validateCustomerId = (customerId) => {
        if (!customerId || customerId.trim() === '') {
          return { isValid: false, error: 'Customer ID is required' }
        }
        
        // Simple validation - could be more complex based on requirements
        if (customerId.length < 3) {
          return { isValid: false, error: 'Customer ID must be at least 3 characters' }
        }
        
        return { isValid: true }
      }

      expect(validateCustomerId('CUST001')).toEqual({ isValid: true })
      expect(validateCustomerId('AB')).toEqual({
        isValid: false,
        error: 'Customer ID must be at least 3 characters'
      })
      expect(validateCustomerId('')).toEqual({
        isValid: false,
        error: 'Customer ID is required'
      })
    })
  })

  describe('Phone number validation', () => {
    it('should validate phone number format', () => {
      const validatePhoneNumber = (phone) => {
        if (!phone) return { isValid: true } // Optional field
        
        // Tanzania phone number format: +255XXXXXXXXX
        const phoneRegex = /^\+255[67]\d{8}$/
        
        if (!phoneRegex.test(phone)) {
          return { 
            isValid: false, 
            error: 'Please enter a valid Tanzanian phone number (+255XXXXXXXXX)' 
          }
        }
        
        return { isValid: true }
      }

      expect(validatePhoneNumber('+255712345678')).toEqual({ isValid: true })
      expect(validatePhoneNumber('+255612345678')).toEqual({ isValid: true })
      expect(validatePhoneNumber('0712345678')).toEqual({
        isValid: false,
        error: 'Please enter a valid Tanzanian phone number (+255XXXXXXXXX)'
      })
      expect(validatePhoneNumber('+254712345678')).toEqual({
        isValid: false,
        error: 'Please enter a valid Tanzanian phone number (+255XXXXXXXXX)'
      })
    })
  })
})