const { UserController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { TAO_TAI_KHOAN, TAO_TAI_KHOAN_NHAN_VIEN } = require("../middleware/actionDefault");

const svRouter = new Router();

svRouter.post("/login", Response(UserController.login));
svRouter.post("/register", Response(UserController.register));
svRouter.get("/login-by-token", isAuthAdmin, Response(UserController.getProfile));

svRouter.post("/update_profile", isAuthAdmin, Response(UserController.updateProfile));
svRouter.post("/change_password", isAuthAdmin, Response(UserController.changePassword));

// Quản lý tài khoản: Admin (tất cả khoa - TAO_TAI_KHOAN) hoặc Trưởng khoa (chỉ
// khoa/phòng mình - TAO_TAI_KHOAN_NHAN_VIEN) - scoping thực hiện ở service layer.
svRouter.get("/api/user/get-list-user", check_permission([TAO_TAI_KHOAN, TAO_TAI_KHOAN_NHAN_VIEN]), Response(UserController.getListUser));
svRouter.post("/api/user/update_user", check_permission([TAO_TAI_KHOAN, TAO_TAI_KHOAN_NHAN_VIEN]), Response(UserController.updateUser));
svRouter.post("/api/user/delete_user", check_permission([TAO_TAI_KHOAN, TAO_TAI_KHOAN_NHAN_VIEN]), Response(UserController.deleteUser));

module.exports = svRouter;
