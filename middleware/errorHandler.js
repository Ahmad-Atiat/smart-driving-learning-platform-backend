const ApiError = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    }

    console.error('Unhandled error:', err);
    return res.status(500).json({ message: 'Internal server error' });
};

module.exports = errorHandler;
