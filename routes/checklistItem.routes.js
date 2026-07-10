const { ChecklistItemController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { CAU_HINH_PHONG_KHOA_KIEM_TRA } = require("../middleware/actionDefault");

const svRouter = new Router();

// Xem bảng kiểm theo vị trí: mọi role đã đăng nhập cần (để làm đánh giá),
// chỉ cần có token hợp lệ.
svRouter.get("/get-by-vitri-type/:vitri_type_id", isAuthAdmin, Response(ChecklistItemController.getChecklistByVitriType));
svRouter.get("/get-list-checklist-item", isAuthAdmin, Response(ChecklistItemController.getListChecklistItem));
svRouter.get("/get-checklist-item/:id", isAuthAdmin, Response(ChecklistItemController.getChecklistItemById));

// Thêm/sửa/xoá tiêu chí: chỉ Admin (permission "Cấu hình phòng khoa nào cần kiểm tra phần nào")
svRouter.post("/create-update-checklist-item", check_permission(CAU_HINH_PHONG_KHOA_KIEM_TRA), Response(ChecklistItemController.createUpdateChecklistItem));
svRouter.post("/delete-checklist-item/:id", check_permission(CAU_HINH_PHONG_KHOA_KIEM_TRA), Response(ChecklistItemController.deleteChecklistItem));

module.exports = svRouter;
