import { validationResult, body, param, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(err => ({
      field: 'param' in err ? err.param : 'unknown',
      message: err.msg,
    }));

    throw new ApiError('VALIDATION_ERROR', 'Validation failed', JSON.stringify(errorMessages), true);
  };
};

// Common validation rules
export const commonValidations = {
  email: (field = 'email') => 
    body(field)
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
  
  password: (field = 'password') => 
    body(field)
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[0-9]/)
      .withMessage('Password must contain a number')
      .matches(/[a-z]/)
      .withMessage('Password must contain a lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter'),
  
  objectId: (field: string, message = 'Invalid ID format') =>
    param(field)
      .isMongoId()
      .withMessage(message),
  
  requiredString: (field: string, fieldName: string) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isString()
      .withMessage(`${fieldName} must be a string`),
  
  optionalString: (field: string, fieldName: string) =>
    body(field)
      .optional({ checkFalsy: true })
      .isString()
      .withMessage(`${fieldName} must be a string`)
      .trim(),
};
