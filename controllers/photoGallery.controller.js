const { photoGalleryServices } = require("../service");

const getListPhotoGallery = async (req) => {
    return await photoGalleryServices.getListPhotoGallery(req.query);
}

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
    createPhotoGallery,
    updatePhotoGallery,
    createManyPhotoGallery,
    deletePhotoGallery
}
