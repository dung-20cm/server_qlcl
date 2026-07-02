const { PhotoGalleryController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { isAuthAdmin } = require("../middleware/auth");

const svRouter = new Router();

// Lưu ý: các route này nhận url_anh đã có sẵn (link ảnh đã upload). Chưa có
// route upload ảnh thật lên Cloudinary - sẽ bổ sung riêng khi làm phần đó.
svRouter.get("/get-list-photo-gallery", isAuthAdmin, Response(PhotoGalleryController.getListPhotoGallery));
svRouter.post("/create-photo-gallery", isAuthAdmin, Response(PhotoGalleryController.createPhotoGallery));
svRouter.post("/create-many-photo-gallery", isAuthAdmin, Response(PhotoGalleryController.createManyPhotoGallery));
svRouter.post("/delete-photo-gallery/:id", isAuthAdmin, Response(PhotoGalleryController.deletePhotoGallery));

module.exports = svRouter;
