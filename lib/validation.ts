// Validation utilities for the application

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// User data validation
export const validateUser = (userData: { email: string; password: string }) => {
  const errors: string[] = [];

  if (!validateEmail(userData.email)) {
    errors.push('Please provide a valid email address');
  }

  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Task data validation
export const validateTask = (taskData: { title: string; description?: string }) => {
  const errors: string[] = [];

  if (!taskData.title || taskData.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (taskData.title && taskData.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }

  if (taskData.description && taskData.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};