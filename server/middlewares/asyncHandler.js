// asyncHandler.js
const asyncHandler = fn => (req, res, next) => {

    Promise.resolve(fn(req, res, next))
    .catch(err => {
        console.error(err); // Log the error for debugging purposes
        return res.status(500).json({
            message: `Internal Server Error`,
            success: false
        });
    });
    
};

module.exports = asyncHandler;
