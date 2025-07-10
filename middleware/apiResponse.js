// Success Response
exports.successResponse = (res, msg) => {
  return res.status(200).json({
    success: true,
    message: msg
  });
};

// Success Response with Data
exports.successResponseWithData = (res, msg, data) => {
  return res.status(200).json({
    success: true,
    message: msg,
    data: data
  });
};

// Error Response
exports.errorResponse = (res, msg) => {
  return res.status(500).json({
    success: false,
    message: msg
  });
};

// Not Found Response
exports.notFoundResponse = (res, msg) => {
  return res.status(404).json({
    success: false,
    message: msg
  });
};

// Validation Error Response
exports.validationErrorResponse = (res, msg, data) => {
  return res.status(400).json({
    success: false,
    message: msg,
    data: data
  });
};

// Unauthorized Response
exports.unauthorizedResponse = (res, msg) => {
  return res.status(401).json({
    success: false,
    message: msg
  });
}; 