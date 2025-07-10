const { validationResult } = require('express-validator');
const apiResponse = require('./apiResponse');

exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiResponse.validationErrorResponse(res, 'Validation Error', errors.array());
  }
  next();
};

exports.userValidationRules = {
  register: [
    {
      field: 'name',
      rules: 'required|string|min:3',
      message: 'Name must be at least 3 characters long'
    },
    {
      field: 'email',
      rules: 'required|email',
      message: 'Please provide a valid email address'
    },
    {
      field: 'password',
      rules: 'required|string|min:6',
      message: 'Password must be at least 6 characters long'
    }
  ],
  login: [
    {
      field: 'email',
      rules: 'required|email',
      message: 'Please provide a valid email address'
    },
    {
      field: 'password',
      rules: 'required',
      message: 'Password is required'
    }
  ]
};

exports.articleValidationRules = {
  create: [
    {
      field: 'title',
      rules: 'required|string|min:5',
      message: 'Title must be at least 5 characters long'
    },
    {
      field: 'abstract',
      rules: 'required|string|min:100',
      message: 'Abstract must be at least 100 characters long'
    },
    {
      field: 'authors',
      rules: 'required|array|min:1',
      message: 'At least one author is required'
    }
  ]
}; 