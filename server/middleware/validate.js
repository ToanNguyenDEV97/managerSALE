// server/middleware/validate.js
const Joi = require('joi');

const registerRequest = {
  body: Joi.object().keys({
    email: Joi.string().required().email().messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ'
    }),
  }),
};

const validate = (schema) => (req, res, next) => {
    // Pick: Chỉ lấy những trường được định nghĩa trong schema từ req.body
    // (Tránh việc user gửi thừa trường rác lên server)
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));
    
    const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate(object);

    if (error) {
        // Lấy thông báo lỗi đầu tiên để trả về cho gọn
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return res.status(400).json({ message: errorMessage });
    }
    
    // Gán lại dữ liệu đã được làm sạch vào req
    Object.assign(req, value);
    return next();
};

// Hàm hỗ trợ lấy object con
const pick = (object, keys) => {
    return keys.reduce((obj, key) => {
        if (object && Object.prototype.hasOwnProperty.call(object, key)) {
            obj[key] = object[key];
        }
        return obj;
    }, {});
};

module.exports = registerRequest, validate;