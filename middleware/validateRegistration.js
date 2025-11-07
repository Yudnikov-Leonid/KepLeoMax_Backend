import { body, validationResult } from 'express-validator';

export const validateRegistration = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  next();
}

export const registrationRules = [
  body('email')
    .isEmail()
    .withMessage('Email is incorrect'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
  // .matches(/[A-Z]/)
  // .withMessage('Password must contain at least one uppercase letter.')
  // .matches(/[a-z]/)
  // .withMessage('Password must contain at least one lowercase letter.')
  // .matches(/[0-9]/)
  // .withMessage('Password must contain at least one number.')
  // .matches(/[^A-Za-z0-9]/)
  // .withMessage('Password must contain at least one special character.'),
];