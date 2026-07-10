const { VitriTypeController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { CAU_HINH_PHONG_KHOA_KIEM_TRA } = require("../middleware/actionDefault");

const svRouter = new Router();

// Xem danh sách vị trí: mọi role đã đăng nhập (chọn vị trí khi làm đánh giá,
// phân công lịch...), chỉ cần có token hợp lệ.
svRouter.get("/get-list-vitri-type", isAuthAdmin, Response(VitriTypeController.getListVitriType));
svRouter.get("/get-vitri-type/:id", isAuthAdmin, Response(VitriTypeController.getVitriTypeById));

// Thêm/sửa/xoá loại vị trí: chỉ Admin
svRouter.post("/create-update-vitri-type", check_permission(CAU_HINH_PHONG_KHOA_KIEM_TRA), Response(VitriTypeController.createUpdateVitriType));
svRouter.post("/delete-vitri-type/:id", check_permission(CAU_HINH_PHONG_KHOA_KIEM_TRA), Response(VitriTypeController.deleteVitriType));

module.exports = svRouter;
