const errorHandler = (err, req, res, next) => {
    res.status(err.status || 500).json({message: err.message, stackTrace: err.stack});
}

export default errorHandler;