const multer = require('multer');
let fileObj = { images: [] };
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images');
    },
    filename: function (req, file, cb) {
        let fileName = Date.now() + '-' + file.originalname.replace(/ /g, '-');
        fileObj.images.push({
            url: process.env.FRONTEND_DOMAIN + '/images/' + fileName,
        });
        req.file = fileObj;
        cb(null, fileName);
    },
});
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
const uploadMiddleware = (req, res, next) => {
    fileObj.images = [];
    multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 5242880 },
    }).array('product_image', 5)(req, res, (err) => {
        if (err || err instanceof multer.MulterError) {
            const error = new Error(err.message);
            error.statusCode = 403;
            next(error);
        }
        next();
    });
};
module.exports = uploadMiddleware;
