const User = require("./user.routes");
const Permission = require("./permission.routes");
const Role = require("./role.routes");
const ExportExcel = require("./exportExcel.routes");
const Khoa = require("./khoa.routes");
const VitriType = require("./vitriType.routes");
const ChecklistItem = require("./checklistItem.routes");
const VitriChiTiet = require("./vitriChiTiet.routes");
const DanhGia = require("./danhGia.routes");
const KhacPhuc = require("./khacPhuc.routes");
const PhotoGallery = require("./photoGallery.routes");
const LichPhanCong = require("./lichPhanCong.routes");
const Anh5sTuan = require("./anh5sTuan.routes");
const DotDanhGia = require("./dotDanhGia.routes");

const { Router } = require("express");
const routerApp = new Router();

//register,login profile
routerApp.use("", User);

//manement permission
routerApp.use("/api/permission", Permission);
routerApp.use("/api/role", Role);
routerApp.use("/api/exportExcel", ExportExcel);
routerApp.use("/api/khoa", Khoa);
routerApp.use("/api/vitri-type", VitriType);
routerApp.use("/api/checklist-item", ChecklistItem);
routerApp.use("/api/vitri-chi-tiet", VitriChiTiet);
routerApp.use("/api/danh-gia", DanhGia);
routerApp.use("/api/khac-phuc", KhacPhuc);
routerApp.use("/api/photo-gallery", PhotoGallery);
routerApp.use("/api/lich-phan-cong", LichPhanCong);
routerApp.use("/api/anh-5s-tuan", Anh5sTuan);
routerApp.use("/api/dot-danh-gia", DotDanhGia);

module.exports = routerApp;
