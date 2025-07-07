"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonValidations = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("./errorHandler");
const validate = (validations) => {
    return async (req, _res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        const errorMessages = errors.array().map(err => ({
            field: 'param' in err ? err.param : 'unknown',
            message: err.msg,
        }));
        throw new errorHandler_1.ApiError('VALIDATION_ERROR', 'Validation failed', JSON.stringify(errorMessages), true);
    };
};
exports.validate = validate;
// Common validation rules
exports.commonValidations = {
    email: (field = 'email') => (0, express_validator_1.body)(field)
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    password: (field = 'password') => (0, express_validator_1.body)(field)
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[0-9]/)
        .withMessage('Password must contain a number')
        .matches(/[a-z]/)
        .withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain an uppercase letter'),
    objectId: (field, message = 'Invalid ID format') => (0, express_validator_1.param)(field)
        .isMongoId()
        .withMessage(message),
    requiredString: (field, fieldName) => (0, express_validator_1.body)(field)
        .trim()
        .notEmpty()
        .withMessage(`${fieldName} is required`)
        .isString()
        .withMessage(`${fieldName} must be a string`),
    optionalString: (field, fieldName) => (0, express_validator_1.body)(field)
        .optional({ checkFalsy: true })
        .isString()
        .withMessage(`${fieldName} must be a string`)
        .trim(),
};
