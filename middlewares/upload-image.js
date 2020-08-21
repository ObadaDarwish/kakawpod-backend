const multer = require('multer');
let fileObj = {images: []};
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images')
    },
    filename: function (req, file, cb) {
        let fileName = Date.now() + '-' + file.originalname.replace(/ /g, '-');
        fileObj = {...fileObj, ...file};
        fileObj.images.push({url: process.env.FRONTEND_DOMAIN + "/images/" + fileName});
        cb(null, fileName)
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
const uploadMiddleware = (req, res, next) => {
    multer({storage: storage, fileFilter: fileFilter, limits: {fileSize: 1500000}})
        .array('product_image', 5)(req, res, err => {
            if (err || err instanceof multer.MulterError) {
                const error = new Error();
                error.error = err;
                error.statusCode = 403;
                err.maxSize = "1.5 Mb";
                next(error);
            }
            req.file = fileObj;
            next();
        })
}
module.exports = uploadMiddleware;
