const { UserController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { TAO_TAI_KHOAN } = require("../middleware/actionDefault");

const svRouter = new Router();

svRouter.post("/login", Response(UserController.login));
svRouter.post("/register", Response(UserController.register));
svRouter.get("/login-by-token", isAuthAdmin, Response(UserController.getProfile));

svRouter.post("/update_profile", isAuthAdmin, Response(UserController.updateProfile));
svRouter.post("/change_password", isAuthAdmin, Response(UserController.changePassword));

// Quản lý tài khoản (Admin) - Tạo tài khoản / cập nhật / xoá / danh sách
svRouter.get("/api/user/get-list-user", check_permission(TAO_TAI_KHOAN), Response(UserController.getListUser));
svRouter.post("/api/user/update_user", check_permission(TAO_TAI_KHOAN), Response(UserController.updateUser));
svRouter.post("/api/user/delete_user", check_permission(TAO_TAI_KHOAN), Response(UserController.deleteUser));

module.exports = svRouter;
