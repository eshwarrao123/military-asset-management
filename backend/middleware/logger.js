const logger = (req, res, next) => {
    try {
        console.log(`[API REQUEST] ${req.method} ${req.url}`);
        if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
            console.log("Body:", req.body);
        }
    } catch (err) {
        console.log("Logger error:", err.message);
    }
    next();
};

module.exports = logger;