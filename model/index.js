const User = require("./user.model");
const Role = require("./role.model");
const UserRole = require("./userRole.model");
const RefreshToken = require("./refreshToken.model");
const Permission = require("./permission.model");
const RolePermission = require("./rolePermission.model");
const Khoa = require("./khoa.model");
const VitriType = require("./vitriType.model");
const ChecklistItem = require("./checklistItem.model");
const VitriChiTiet = require("./vitriChiTiet.model");
const DanhGia = require("./danhGia.model");
const DanhGiaChiTiet = require("./danhGiaChiTiet.model");
const KhacPhuc = require("./khacPhuc.model");
const PhotoGallery = require("./photoGallery.model");
const LichPhanCong = require("./lichPhanCong.model");
const Anh5sTuan = require("./anh5sTuan.model");
const Anh5sTuanVitri = require("./anh5sTuanVitri.model");
const DotDanhGia = require("./dotDanhGia.model");

const { sequelize } = require("../config/db.config"); //call connect

// Đăng ký association trước để Sequelize biết các khóa ngoại khi tạo bảng
for (const m in sequelize.models) {
  sequelize.models[m].association();
}

// Sync tuần tự theo đúng thứ tự phụ thuộc (bảng cha trước, bảng có khóa ngoại sau)
// Trước đây sync() chạy đồng thời không await nên hay lỗi
// "Failed to open the referenced table" do bảng cha chưa tạo xong.
(async () => {
  try {
    // Khoa phải sync trước User vì user.khoa_id tham chiếu khoa.id
    await Khoa.sync();
    await User.sync();
    await Role.sync();
    await Permission.sync();
    await RefreshToken.sync();
    await UserRole.sync();
    await RolePermission.sync();
    await VitriType.sync();
    await ChecklistItem.sync();
    await VitriChiTiet.sync();
    await DotDanhGia.sync();
    await DanhGia.sync();
    await DanhGiaChiTiet.sync();
    await KhacPhuc.sync();
    await PhotoGallery.sync();
    await LichPhanCong.sync();
    await Anh5sTuan.sync();
    await Anh5sTuanVitri.sync();
    // Bổ sung cột danh_gia.dot_danh_gia_id cho DB cũ (sync không tự ALTER bảng có sẵn)
    const qi = sequelize.getQueryInterface();
    const { DataTypes } = require("sequelize");
    const descDanhGia = await qi.describeTable("danh_gia");
    if (!descDanhGia.dot_danh_gia_id) {
      await qi.addColumn("danh_gia", "dot_danh_gia_id", {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: true,
      });
      console.log("Đã thêm cột danh_gia.dot_danh_gia_id");
    }

    // Bổ sung các cột cho phép ảnh 5S gửi độc lập (không gắn 1 lượt đánh giá) +
    // nới lỏng danh_gia_id thành NULL được (sync không tự ALTER bảng có sẵn).
    const descPhotoGallery = await qi.describeTable("photo_gallery");
    if (descPhotoGallery.danh_gia_id && descPhotoGallery.danh_gia_id.allowNull === false) {
      await qi.changeColumn("photo_gallery", "danh_gia_id", {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: true,
      });
      console.log("Đã nới lỏng photo_gallery.danh_gia_id thành NULL được");
    }
    const photoGalleryNewCols = {
      khoa_id: { type: DataTypes.INTEGER(10).UNSIGNED, allowNull: true },
      vitri_type_id: { type: DataTypes.INTEGER(10).UNSIGNED, allowNull: true },
      ngay_chup: { type: DataTypes.DATEONLY, allowNull: true },
      nguoi_gui_id: { type: DataTypes.INTEGER(10).UNSIGNED, allowNull: true },
      ket_qua: { type: DataTypes.STRING(20), allowNull: true },
      ghi_chu: { type: DataTypes.TEXT, allowNull: true },
    };
    for (const [col, def] of Object.entries(photoGalleryNewCols)) {
      if (!descPhotoGallery[col]) {
        await qi.addColumn("photo_gallery", col, def);
        console.log(`Đã thêm cột photo_gallery.${col}`);
      }
    }

    // Bổ sung cột user.khoa_id cho DB cũ (sync không tự ALTER bảng có sẵn)
    const descUser = await qi.describeTable("user");
    if (!descUser.khoa_id) {
      await qi.addColumn("user", "khoa_id", {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: true,
      });
      console.log("Đã thêm cột user.khoa_id");
    }

    // Bổ sung cột lich_phan_cong.dot_danh_gia_id cho DB cũ (sync không tự ALTER bảng có sẵn)
    const descLichPhanCong = await qi.describeTable("lich_phan_cong");
    if (!descLichPhanCong.dot_danh_gia_id) {
      await qi.addColumn("lich_phan_cong", "dot_danh_gia_id", {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: true,
      });
      console.log("Đã thêm cột lich_phan_cong.dot_danh_gia_id");
    }

    console.log("Đồng bộ bảng (sync) thành công.");
  } catch (err) {
    console.error("Lỗi đồng bộ bảng:", err.message);
  }
})();

module.exports = {
  User,
  Role,
  UserRole,
  RefreshToken,
  Permission,
  RolePermission,
  Khoa,
  VitriType,
  ChecklistItem,
  VitriChiTiet,
  DanhGia,
  DanhGiaChiTiet,
  KhacPhuc,
  PhotoGallery,
  LichPhanCong,
  Anh5sTuan,
  Anh5sTuanVitri,
  DotDanhGia,
};
