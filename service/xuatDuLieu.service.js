// Service riêng cho trang "Xuất dữ liệu" (CHỈ Admin, xem routes/xuatDuLieu.routes.js).
// Mỗi hàm get* trả về TOÀN BỘ dữ liệu (không phân trang) của 1 bảng, đã map
// sẵn sang object phẳng với field tiếng Việt dễ đọc -- Frontend chỉ việc đổ
// thẳng vào cột Excel, không cần tính toán/join gì thêm.
//
// Không tái dùng trực tiếp các hàm getList* ở service khác vì mục đích khác
// nhau: các hàm đó phục vụ UI phân trang/lọc theo khoa đang đăng nhập, còn ở
// đây luôn lấy full toàn viện (route đã gate riêng quyền XUAT_DU_LIEU chỉ cấp
// cho Admin) + trả field đầy đủ hơn (VD user cần thêm createdAt, role...).
const { Op } = require("sequelize");
const {
  User,
  Role,
  UserRole,
  Khoa,
  VitriType,
  VitriChiTiet,
  DotDanhGia,
  DanhGia,
  KhacPhuc,
  PhotoGallery,
  LichPhanCong,
  Anh5sTuan,
  Anh5sTuanVitri,
  ChecklistItem,
  DanhGiaChiTiet,
} = require("../model");

const THU_LABEL = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};

// Áp khoảng ngày [tu_ngay, den_ngay] ("YYYY-MM-DD") vào 1 cột DATEONLY -- thiếu
// biên nào thì không giới hạn biên đó. Trả về undefined nếu không lọc gì.
//
// LƯU Ý: Op.gte/Op.lte là SYMBOL, không phải string key -- Object.keys(cond)
// KHÔNG bao giờ thấy được key dạng Symbol (chỉ liệt kê string key), nên trước
// đây `Object.keys(cond).length` luôn = 0 dù cond đã có Op.gte/Op.lte, khiến
// hàm này LUÔN trả về undefined bất kể có truyền tu_ngay/den_ngay hay không --
// toàn bộ 6 bảng vì vậy chưa từng thực sự lọc theo ngày. Sửa bằng cách kiểm
// tra thẳng tham số đầu vào thay vì dò lại object đã tạo.
function dateRangeWhere(tu_ngay, den_ngay) {
  if (!tu_ngay && !den_ngay) return undefined;
  const cond = {};
  if (tu_ngay) cond[Op.gte] = tu_ngay;
  if (den_ngay) cond[Op.lte] = den_ngay;
  return cond;
}

// Giống dateRangeWhere nhưng dùng cho cột DATETIME (VD createdAt) -- so sánh
// "<=" thẳng với chuỗi "YYYY-MM-DD" sẽ ngầm hiểu là "YYYY-MM-DD 00:00:00",
// LOẠI MẤT toàn bộ bản ghi tạo trong đúng ngày den_ngay (từ sau 00:00:00).
// Chuyển biên trên thành "< ngày kế tiếp" để bao trọn hết ngày den_ngay.
function dateTimeRangeWhere(tu_ngay, den_ngay) {
  if (!tu_ngay && !den_ngay) return undefined;
  const cond = {};
  if (tu_ngay) cond[Op.gte] = `${tu_ngay} 00:00:00`;
  if (den_ngay) {
    const next = new Date(`${den_ngay}T00:00:00`);
    next.setDate(next.getDate() + 1);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, "0");
    const d = String(next.getDate()).padStart(2, "0");
    cond[Op.lt] = `${y}-${m}-${d} 00:00:00`;
  }
  return cond;
}

// JS Date -> "YYYY-MM-DD" THEO GIỜ ĐỊA PHƯƠNG (không dùng toISOString() vì quy
// đổi UTC dễ lệch ngày) -- dùng suy ra "ngày bắt đầu áp dụng" của lịch định kỳ
// cũ chưa có ngay_thuc_hien, khớp effectiveStartDate() ở FE (features/qlcl/lichUtils.ts).
function toDateOnlyLocal(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// So sánh chuỗi ngày nằm trong khoảng [tu_ngay, den_ngay] -- dùng lọc ở tầng
// JS (sau khi đã fetch) cho các bảng có "ngày hiệu lực" suy ra từ nhiều nguồn
// (VD ảnh minh chứng: ngay_chup của chính ảnh HOẶC ngày của lượt đánh giá gắn
// kèm) mà lọc thẳng ở DB (where cột NULL) sẽ vô tình loại bỏ nhầm.
function inRange(dateStr, tu_ngay, den_ngay) {
  if (!dateStr) return !tu_ngay && !den_ngay;
  if (tu_ngay && dateStr < tu_ngay) return false;
  if (den_ngay && dateStr > den_ngay) return false;
  return true;
}

// ===== 1. Tài khoản =====
const getTaiKhoan = async ({ tu_ngay, den_ngay } = {}) => {
  const where = { del: 0 };
  const createdAtRange = dateTimeRangeWhere(tu_ngay, den_ngay);
  if (createdAtRange) where.createdAt = createdAtRange;

  const rows = await User.findAll({
    where,
    attributes: [
      "id",
      "username",
      "email",
      "mobile",
      "address",
      "status",
      "createdAt",
    ],
    include: [
      { model: Khoa, as: "khoa", attributes: ["id", "ten_khoa"] },
      {
        model: UserRole,
        as: "user_role",
        required: false,
        where: { del: 0 },
        include: [
          {
            model: Role,
            as: "role",
            required: false,
            attributes: ["id", "name", "slug"],
          },
        ],
      },
    ],
    order: [["id", "desc"]],
  });

  return rows.map((u) => ({
    id: u.id,
    ten_dang_nhap: u.username,
    email: u.email || "",
    sdt: u.mobile || "",
    dia_chi: u.address || "",
    khoa_phong: u.khoa ? u.khoa.ten_khoa : "",
    vai_tro:
      u.user_role && u.user_role.role
        ? u.user_role.role.name
        : "Chưa gán quyền",
    trang_thai: u.status === 1 ? "Hoạt động" : "Đã khoá",
    ngay_tao: u.createdAt,
  }));
};

// ===== 2. Hành động khắc phục =====
const getHanhDongKp = async ({ tu_ngay, den_ngay } = {}) => {
  const where = { active: 1 };
  const range = dateRangeWhere(tu_ngay, den_ngay);
  if (range) where.ngay_phat_hien = range;

  const rows = await KhacPhuc.findAll({
    where,
    order: [
      ["ngay_phat_hien", "desc"],
      ["id", "desc"],
    ],
    include: [
      { model: Khoa, as: "khoa", attributes: ["id", "ten_khoa"] },
      { model: VitriType, as: "vitri_type", attributes: ["id", "ten_vitri"] },
      {
        model: DanhGiaChiTiet,
        as: "danh_gia_chi_tiet",
        required: false,
        include: [
          {
            model: ChecklistItem,
            as: "checklist_item",
            attributes: ["id", "tc"],
          },
        ],
      },
      {
        model: User,
        as: "nguoi_phu_trach",
        attributes: ["id", "username", "email"],
      },
    ],
  });

  return rows.map((k) => ({
    id: k.id,
    khoa_phong: k.khoa ? k.khoa.ten_khoa : "",
    vi_tri: k.vitri_type ? k.vitri_type.ten_vitri : "",
    nhom_s: k.s_id || "",
    mo_ta_loi:
      k.mo_ta_loi ||
      (k.danh_gia_chi_tiet && k.danh_gia_chi_tiet.checklist_item
        ? k.danh_gia_chi_tiet.checklist_item.tc
        : ""),
    ngay_phat_hien: k.ngay_phat_hien,
    nguoi_phu_trach: k.nguoi_phu_trach
      ? k.nguoi_phu_trach.email || k.nguoi_phu_trach.username
      : "",
    hanh_dong_khac_phuc: k.hanh_dong_khac_phuc || "",
    han_xu_ly: k.han_xu_ly,
    tuan: k.tuan || "",
    trang_thai: k.trang_thai,
    ghi_chu: k.ghi_chu || "",
  }));
};

// ===== 3. Nhóm Zalo 5S =====
const getNhomZalo = async ({ tu_ngay, den_ngay } = {}) => {
  const where = { active: 1 };
  const range = dateRangeWhere(tu_ngay, den_ngay);
  if (range) where.tuan = range;

  const rows = await Anh5sTuan.findAll({
    where,
    order: [
      ["tuan", "desc"],
      ["id", "desc"],
    ],
    include: [
      { model: Khoa, as: "khoa", attributes: ["id", "ten_khoa"] },
      {
        model: Anh5sTuanVitri,
        as: "vi_tri",
        include: [
          {
            model: VitriType,
            as: "vitri_type",
            attributes: ["id", "ten_vitri"],
          },
        ],
      },
    ],
  });

  return rows.map((a) => ({
    id: a.id,
    khoa_phong: a.khoa ? a.khoa.ten_khoa : "",
    tuan: a.tuan,
    vi_tri_chup: (a.vi_tri || [])
      .map((v) => (v.vitri_type ? v.vitri_type.ten_vitri : ""))
      .filter(Boolean)
      .join(", "),
    so_luong_anh: a.so_luong_anh,
    chat_luong: a.chat_luong || "",
    ghi_chu: a.ghi_chu || "",
  }));
};

// ===== 4. Lịch đánh giá =====
const getLichDanhGia = async ({ tu_ngay, den_ngay } = {}) => {
  let where = { active: 1 };
  // Lịch "dinh_ky" chỉ lưu 1 mốc ngày bắt đầu áp dụng (lặp lại hàng tuần) nên
  // không lọc where.ngay_thuc_hien trực tiếp như lịch 1 lần -- lấy các lịch đã
  // bắt đầu trước/trong khoảng đang xem, giữ đúng logic dùng ở lichPhanCong.service.js.
  // Hỗ trợ cả trường hợp chỉ truyền 1 trong 2 biên (trước đây BẮT BUỘC có cả
  // tu_ngay lẫn den_ngay mới lọc -- thiếu 1 biên là bỏ qua lọc hoàn toàn, khiến
  // bảng này luôn trả về TẤT CẢ dù người dùng đã chọn khoảng ngày).
  if (tu_ngay || den_ngay) {
    const motLanCond = {};
    if (tu_ngay) motLanCond[Op.gte] = tu_ngay;
    if (den_ngay) motLanCond[Op.lte] = den_ngay;

    const dinhKyOr = den_ngay
      ? {
          loai_lich: "dinh_ky",
          [Op.or]: [
            { ngay_thuc_hien: { [Op.lte]: den_ngay } },
            { ngay_thuc_hien: null, createdAt: { [Op.lte]: den_ngay } },
          ],
        }
      // Không giới hạn đến-ngày -> mọi lịch định kỳ đều thoả (tu_ngay không áp
      // dụng cho dinh_ky vì lịch định kỳ lặp lại vô thời hạn từ mốc bắt đầu).
      : { loai_lich: "dinh_ky" };

    where[Op.and] = [
      {
        [Op.or]: [
          { loai_lich: { [Op.ne]: "dinh_ky" }, ngay_thuc_hien: motLanCond },
          dinhKyOr,
        ],
      },
    ];
  }

  const rows = await LichPhanCong.findAll({
    where,
    order: [["id", "desc"]],
    include: [
      { model: Khoa, as: "khoa", attributes: ["id", "ten_khoa"] },
      { model: VitriType, as: "vitri_type", attributes: ["id", "ten_vitri"] },
      {
        model: User,
        as: "nguoi_thuc_hien",
        attributes: ["id", "username", "email"],
      },
      { model: DotDanhGia, as: "dot", attributes: ["id", "ten_dot"] },
    ],
  });

  return rows.map((l) => ({
    id: l.id,
    khoa_phong: l.khoa ? l.khoa.ten_khoa : "",
    vi_tri: l.vitri_type ? l.vitri_type.ten_vitri : "Tất cả vị trí",
    dot_danh_gia: l.dot ? l.dot.ten_dot : "",
    loai_lich: l.loai_lich === "dinh_ky" ? "Định kỳ hàng tuần" : "Một lần",
    thu_trong_tuan: l.thu_trong_tuan ? THU_LABEL[l.thu_trong_tuan] || "" : "",
    // Ngày bắt đầu lên lịch: ưu tiên ngay_thuc_hien (mốc do người dùng chọn);
    // lịch cũ tạo trước khi có cột này thì lấy NGÀY TẠO bản ghi làm mốc -- khớp
    // effectiveStartDate() ở FE (features/qlcl/lichUtils.ts) để 2 nơi hiển thị đồng nhất.
    ngay_bat_dau: l.ngay_thuc_hien || toDateOnlyLocal(l.createdAt),
    ngay_thuc_hien: l.ngay_thuc_hien,
    nguoi_thuc_hien: l.nguoi_thuc_hien
      ? l.nguoi_thuc_hien.email || l.nguoi_thuc_hien.username
      : "",
    ghi_chu: l.ghi_chu || "",
  }));
};

// ===== 5. Kết quả 5S (bảng kiểm / đánh giá) =====
const getKetQua5S = async ({ tu_ngay, den_ngay } = {}) => {
  const where = { active: 1 };
  const range = dateRangeWhere(tu_ngay, den_ngay);
  if (range) where.ngay_danh_gia = range;

  const rows = await DanhGia.findAll({
    where,
    order: [
      ["ngay_danh_gia", "desc"],
      ["id", "desc"],
    ],
    include: [
      { model: Khoa, as: "khoa", attributes: ["id", "ten_khoa"] },
      { model: VitriType, as: "vitri_type", attributes: ["id", "ten_vitri"] },
      {
        model: VitriChiTiet,
        as: "vitri_chi_tiet",
        attributes: ["id", "ma_vitri"],
      },
      {
        model: User,
        as: "nguoi_danh_gia",
        attributes: ["id", "username", "email"],
      },
      { model: DotDanhGia, as: "dot", attributes: ["id", "ten_dot"] },
    ],
  });

  return rows.map((d) => ({
    id: d.id,
    khoa_phong: d.khoa ? d.khoa.ten_khoa : "",
    vi_tri: d.vitri_type ? d.vitri_type.ten_vitri : "",
    vi_tri_chi_tiet: d.vitri_chi_tiet ? d.vitri_chi_tiet.ma_vitri : "",
    nguoi_danh_gia: d.nguoi_danh_gia
      ? d.nguoi_danh_gia.email || d.nguoi_danh_gia.username
      : "",
    ngay_danh_gia: d.ngay_danh_gia,
    dot_danh_gia: (d.dot && d.dot.ten_dot) || d.dot_danh_gia || "",
    so_tieu_chi_dat: d.so_tieu_chi_dat,
    so_tieu_chi_tong: d.so_tieu_chi_tong,
    ty_le_pct: d.pct,
    xep_loai: d.xep_loai || "",
  }));
};

// ===== 6. Ảnh 5S =====
const getAnh5S = async ({ tu_ngay, den_ngay } = {}) => {
  // Không lọc where.ngay_chup ở DB -- ảnh gắn 1 lượt đánh giá có ngay_chup NULL
  // (dùng ngày của đánh giá làm ngày hiệu lực), lọc where sẽ loại nhầm các dòng
  // này. Lọc bằng inRange() ở JS sau khi đã có đủ ngày hiệu lực của từng ảnh.
  const rows = await PhotoGallery.findAll({
    where: { active: 1 },
    order: [["id", "desc"]],
    include: [
      {
        model: DanhGia,
        as: "danh_gia",
        required: false,
        include: [
          { model: Khoa, as: "khoa", attributes: ["id", "ten_khoa"] },
          {
            model: VitriType,
            as: "vitri_type",
            attributes: ["id", "ten_vitri"],
          },
          {
            model: User,
            as: "nguoi_danh_gia",
            attributes: ["id", "username", "email"],
          },
        ],
      },
      { model: Khoa, as: "khoa", attributes: ["id", "ten_khoa"] },
      { model: VitriType, as: "vitri_type", attributes: ["id", "ten_vitri"] },
      {
        model: User,
        as: "nguoi_gui",
        attributes: ["id", "username", "email"],
      },
    ],
  });

  return rows
    .map((p) => {
      const ngayHieuLuc =
        p.ngay_chup || (p.danh_gia ? p.danh_gia.ngay_danh_gia : null);
      return {
        id: p.id,
        khoa_phong:
          (p.khoa && p.khoa.ten_khoa) ||
          (p.danh_gia && p.danh_gia.khoa ? p.danh_gia.khoa.ten_khoa : ""),
        vi_tri:
          (p.vitri_type && p.vitri_type.ten_vitri) ||
          (p.danh_gia && p.danh_gia.vitri_type
            ? p.danh_gia.vitri_type.ten_vitri
            : ""),
        ngay_chup: ngayHieuLuc,
        nguoi_gui:
          (p.nguoi_gui && (p.nguoi_gui.email || p.nguoi_gui.username)) ||
          (p.danh_gia && p.danh_gia.nguoi_danh_gia
            ? p.danh_gia.nguoi_danh_gia.email ||
              p.danh_gia.nguoi_danh_gia.username
            : ""),
        ket_qua: p.ket_qua || "",
        ten_file: p.ten_file || "",
        trang_thai_anh: /_daxoa(\.[a-zA-Z0-9]+)?$/.test(p.url_anh || "")
          ? "Đã xoá"
          : "Đang lưu",
        ghi_chu: p.ghi_chu || "",
        _ngayHieuLuc: ngayHieuLuc,
      };
    })
    .filter((p) => inRange(p._ngayHieuLuc, tu_ngay, den_ngay))
    .map(({ _ngayHieuLuc, ...rest }) => rest);
};

const BANG_MAP = {
  "tai-khoan": getTaiKhoan,
  "hanh-dong-kp": getHanhDongKp,
  "nhom-zalo": getNhomZalo,
  "lich-danh-gia": getLichDanhGia,
  "ket-qua-5s": getKetQua5S,
  "anh-5s": getAnh5S,
};

// bang: 1 trong 6 key ở BANG_MAP ở trên. tu_ngay/den_ngay: "YYYY-MM-DD" (tuỳ chọn).
const getBangDuLieu = async ({ bang, tu_ngay, den_ngay }) => {
  const fn = BANG_MAP[bang];
  if (!fn) {
    throw new Error("REQUIRED_PARAMS");
  }
  return fn({ tu_ngay, den_ngay });
};

module.exports = {
  getTaiKhoan,
  getHanhDongKp,
  getNhomZalo,
  getLichDanhGia,
  getKetQua5S,
  getAnh5S,
  getBangDuLieu,
};
