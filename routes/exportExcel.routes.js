const { UserController } = require("../controllers");
const { Router } = require("express");
const { ResponseExportExcel } = require("../config/handle_response");
const { check_permission } = require("../middleware/auth");
const { TAO_TAI_KHOAN } = require("../middleware/actionDefault");

const svRouter = new Router();

svRouter.get("/list-user", check_permission(TAO_TAI_KHOAN), ResponseExportExcel(UserController.exportListUser));

module.exports = svRouter;