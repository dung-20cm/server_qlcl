const { photoGalleryServices } = require("../service");

const getListPhotoGallery = async (req) => {
    return await photoGalleryServices.getListPhotoGallery(req.query, req.authUser);
}

// Phục vụ file ảnh vật lý qua route CÓ xác thực + kiểm tra khoa (không phải
// express.static). Dùng ResponseFile (không bọc JSON envelope) vì cần
// res.redirect/pipe stream trực tiếp -- xem routes/photoGallery.routes.js.
const serveImageVariant = async (req, res, variant) => {
    const id = req.params.id;
    const result = await photoGalleryServices.getImageForServing(id, req.authUser, variant);

    if (result.redirectUrl) {
        return res.redirect(302, result.redirectUrl);
    }

    res.setHeader('Content-Type', result.mimeType || 'image/jpeg');
    // private: chỉ trình duyệt của người xem được cache, không cache ở proxy/CDN
    // chung -- ảnh có phân quyền theo khoa nên không được cache công khai.
    res.setHeader('Cache-Control', 'private, max-age=86400');
    result.stream.on('error', () => {
        if (!res.headersSent) res.status(404);
        res.end();
    });
    result.stream.pipe(res);
}

const serveImage = (req, res) => serveImageVariant(req, res, "full");
const serveThumb = (req, res) => serveImageVariant(req, res, "thumb");

const createPhotoGallery = async (req) => {
    return await photoGalleryServices.createPhotoGallery(req.body, req.authUser);
}

const updatePhotoGallery = async (req) => {
    return await photoGalleryServices.updatePhotoGallery(req.body);
}

const createManyPhotoGallery = async (req) => {
    return await photoGalleryServices.createManyPhotoGallery(req.body, req.authUser);
}

const deletePhotoGallery = async (req) => {
    const id = req.params.id;
    return await photoGalleryServices.deletePhotoGallery(id, req.authUser);
}

module.exports = {
    getListPhotoGallery,
    serveImage,
    serveThumb,
    createPhotoGallery,
    updatePhotoGallery,
    createManyPhotoGallery,
    deletePhotoGallery
}
