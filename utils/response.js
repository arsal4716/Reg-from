const successResponse = (res, message, data = {}) => {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  };
  
  const errorResponse = (res, message, code = 400) => {
    return res.status(code).json({
      success: false,
      message
    });
  };
  
  module.exports = { successResponse, errorResponse };
  