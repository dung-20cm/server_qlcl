const { PhotoGalleryController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission } = require("../middleware/auth");
const { LAM_DANH_GIA, DANH_GIA_CAC_KHOA, QUAN_LY_BANG_KIEM_KHOA_MINH, QUAN_LY_ANH_5S_TAT_CA_KHOA, XEM_TOAN_QUYEN_BAO_CAO_LICH } = require("../middleware/actionDefault");

const svRouter = new Router();

// Bảng photo_gallery dùng cho 2 luồng khác nhau:
// 1) Ảnh đính kèm khi LÀM ĐÁNH GIÁ (BangKiem.tsx, danh_gia_id có giá trị) - ai
//    làm đánh giá được thì đính kèm ảnh được (Nhân viên/Trưởng khoa/QLCL/Admin).
// 2) Ảnh gửi độc lập theo dõi Nhóm Zalo 5S (Anh5S.tsx, khoa_id có giá trị,
//    danh_gia_id null) - chỉ Phòng QLCL/Admin (xem, sửa, xoá).
//
// Lưu ý: các route này nhận url_anh đã có sẵn (link ảnh đã upload). Chưa có
// route upload ảnh thật lên Cloudinary - sẽ bổ sung riêng khi làm phần đó.

// Xem/sửa/xoá: chỉ Anh5S.tsx (QLCL/Admin) dùng tới các route này. Riêng route
// XEM (GET) nhận thêm XEM_TOAN_QUYEN_BAO_CAO_LICH để Lãnh đạo xem được mà
// không cấp quyền sửa/xoá (2 route dưới vẫn chỉ nhận QUAN_LY_ANH_5S_TAT_CA_KHOA).
svRouter.get("/get-list-photo-gallery", check_permission([QUAN_LY_ANH_5S_TAT_CA_KHOA, XEM_TOAN_QUYEN_BAO_CAO_LICH]), Response(PhotoGalleryController.getListPhotoGallery));
svRouter.post("/update-photo-gallery", check_permission(QUAN_LY_ANH_5S_TAT_CA_KHOA), Response(PhotoGalleryController.updatePhotoGallery));
svRouter.post("/delete-photo-gallery/:id", check_permission(QUAN_LY_ANH_5S_TAT_CA_KHOA), Response(PhotoGalleryController.deletePhotoGallery));

// Tạo ảnh: dùng chung cho cả 2 luồng ở trên -> chấp nhận permission của luồng nào cũng được.
svRouter.post("/create-photo-gallery", check_permission([LAM_DANH_GIA, DANH_GIA_CAC_KHOA, QUAN_LY_BANG_KIEM_KHOA_MINH, QUAN_LY_ANH_5S_TAT_CA_KHOA]), Response(PhotoGalleryController.createPhotoGallery));
svRouter.post("/create-many-photo-gallery", check_permission([LAM_DANH_GIA, DANH_GIA_CAC_KHOA, QUAN_LY_BANG_KIEM_KHOA_MINH, QUAN_LY_ANH_5S_TAT_CA_KHOA]), Response(PhotoGalleryController.createManyPhotoGallery));

module.exports = svRouter;
