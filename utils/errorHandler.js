module.exports = (message, code) => {
    let error = new Error();
    error.message = message;
    error.statusCode = code;

    return error
}
