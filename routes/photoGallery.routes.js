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

// Xem: mở rộng cho ai làm được đánh giá (Nhân viên/Trưởng khoa/QLCL/Admin)
// cũng xem được -- cần để Bảng kiểm tải lại ảnh minh chứng đã lưu khi bấm
// "Sửa" đánh giá. Cộng thêm QUAN_LY_ANH_5S_TAT_CA_KHOA/XEM_TOAN_QUYEN_BAO_CAO_LICH
// như cũ cho luồng Anh5S.tsx (ảnh gửi độc lập, QLCL/Admin/Lãnh đạo).
svRouter.get("/get-list-photo-gallery", check_permission([LAM_DANH_GIA, DANH_GIA_CAC_KHOA, QUAN_LY_BANG_KIEM_KHOA_MINH, QUAN_LY_ANH_5S_TAT_CA_KHOA, XEM_TOAN_QUYEN_BAO_CAO_LICH]), Response(PhotoGalleryController.getListPhotoGallery));
// Sửa: chỉ dùng cho ảnh gửi độc lập (Anh5S.tsx) -- giữ nguyên QUAN_LY_ANH_5S_TAT_CA_KHOA.
svRouter.post("/update-photo-gallery", check_permission(QUAN_LY_ANH_5S_TAT_CA_KHOA), Response(PhotoGalleryController.updatePhotoGallery));
// Xoá: nới permission GATE để ai tạo được ảnh (đánh giá) cũng vào được route,
// nhưng SERVICE (deletePhotoGallery) tự phân biệt 2 luồng để áp đúng quyền:
//  - Ảnh gắn 1 lượt đánh giá (danh_gia_id) -> chỉ CHÍNH người tạo lượt đánh giá đó
//  - Ảnh gửi độc lập (Anh5S.tsx) -> chỉ Phòng QLCL/Admin như cũ
svRouter.post("/delete-photo-gallery/:id", check_permission([LAM_DANH_GIA, DANH_GIA_CAC_KHOA, QUAN_LY_BANG_KIEM_KHOA_MINH, QUAN_LY_ANH_5S_TAT_CA_KHOA]), Response(PhotoGalleryController.deletePhotoGallery));

// Tạo ảnh: dùng chung cho cả 2 luồng ở trên -> chấp nhận permission của luồng nào cũng được.
// Service tự kiểm tra CHÍNH chủ đánh giá mới được gắn ảnh (nếu có danh_gia_id).
svRouter.post("/create-photo-gallery", check_permission([LAM_DANH_GIA, DANH_GIA_CAC_KHOA, QUAN_LY_BANG_KIEM_KHOA_MINH, QUAN_LY_ANH_5S_TAT_CA_KHOA]), Response(PhotoGalleryController.createPhotoGallery));
svRouter.post("/create-many-photo-gallery", check_permission([LAM_DANH_GIA, DANH_GIA_CAC_KHOA, QUAN_LY_BANG_KIEM_KHOA_MINH, QUAN_LY_ANH_5S_TAT_CA_KHOA]), Response(PhotoGalleryController.createManyPhotoGallery));

module.exports = svRouter;
