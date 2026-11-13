// Client-side checks that mirror server/validation/authSchemas.js so users get
// instant feedback. The server still validates everything and has the final say.
// Each function returns an array of { field, message } (empty = valid).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin({ email, password }) {
  const problems = []
  if (!EMAIL_PATTERN.test(email.trim())) {
    problems.push({ field: 'email', message: 'Enter a valid email address' })
  }
  if (!password) problems.push({ field: 'password', message: 'Password is required' })
  return problems
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const problems = []
  const trimmedName = name.trim()

  if (trimmedName.length < 2 || trimmedName.length > 80) {
    problems.push({ field: 'name', message: 'Name must be 2 to 80 characters' })
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    problems.push({ field: 'email', message: 'Enter a valid email address' })
  }
  if (password.length < 8 || password.length > 72) {
    problems.push({ field: 'password', message: 'Password must be 8 to 72 characters' })
  }
  if (!/[a-z]/.test(password)) {
    problems.push({ field: 'password', message: 'Password must contain a lowercase letter' })
  }
  if (!/[A-Z]/.test(password)) {
    problems.push({ field: 'password', message: 'Password must contain an uppercase letter' })
  }
  if (!/[0-9]/.test(password)) {
    problems.push({ field: 'password', message: 'Password must contain a number' })
  }
  if (password !== confirmPassword) {
    problems.push({ field: 'confirmPassword', message: 'Passwords do not match' })
  }
  return problems
}

export function validateProfile({ name, email }) {
  const problems = []
  const trimmedName = name.trim()

  if (trimmedName.length < 2 || trimmedName.length > 80) {
    problems.push({ field: 'name', message: 'Name must be 2 to 80 characters' })
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    problems.push({ field: 'email', message: 'Enter a valid email address' })
  }
  return problems
}
