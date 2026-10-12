const fs = require("fs");
const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { PhotoGallery, DanhGia, ChecklistItem, Khoa, VitriType, User } = require("../model");
const { QUAN_LY_ANH_5S_TAT_CA_KHOA } = require("../middleware/actionDefault");
const {
    resolveImagePath,
    renameImageFile,
    renameToDeletedMarker,
    extractPhotoIndex,
} = require("./localImageStorage.service");
const { buildPhotoBaseName } = require("./photoNaming.service");
const { ensureThumbFile } = require("./photoThumb.service");

// Ảnh gắn 1 lượt đánh giá (danh_gia_id có giá trị) -- chỉ CHÍNH tài khoản đã
// tạo lượt đánh giá đó mới được thêm/xoá ảnh (khớp đúng quyền sửa/xoá đánh giá
// ở danhGia.service.js, không xét vai trò/quyền). Ảnh gửi độc lập (Nhóm Zalo
// 5S, danh_gia_id NULL) thì vẫn chỉ Phòng QLCL/Admin như thiết kế cũ.
async function assertOwnerOfPhoto(danhGiaId, authUser) {
    const danhGia = await DanhGia.findOne({ where: { id: danhGiaId } });
    if (!danhGia || !authUser || Number(danhGia.nguoi_danh_gia_id) !== Number(authUser.id)) {
        throw new Error(ERROR_MESSAGE.ANH_MINH_CHUNG_NOT_OWNER);
    }
}
function assertCanManageAnh5S(authUser) {
    if (!authUser || !(authUser.permissions || []).includes(QUAN_LY_ANH_5S_TAT_CA_KHOA)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
    }
}

const getListPhotoGallery = async (data, authUser) => {
    let where = { active: 1 };
    if (data.danh_gia_id) where.danh_gia_id = data.danh_gia_id;
    if (data.checklist_item_id) where.checklist_item_id = data.checklist_item_id;
    // Lọc trực tiếp trên field của chính ảnh (áp dụng cho cả ảnh gửi độc lập lẫn ảnh
    // từ Bảng kiểm — vì khi tạo ảnh gắn danh_gia, FE cũng có thể gửi kèm khoa_id/vitri_type_id).
    if (data.khoa_id) where.khoa_id = data.khoa_id;
    if (data.vitri_type_id) where.vitri_type_id = data.vitri_type_id;
    if (data.ket_qua) where.ket_qua = data.ket_qua;
    if (data.tu_ngay || data.den_ngay) {
        where.ngay_chup = {};
        if (data.tu_ngay) where.ngay_chup[Op.gte] = data.tu_ngay;
        if (data.den_ngay) where.ngay_chup[Op.lte] = data.den_ngay;
    }
    if (data.active === 'all') delete where.active;

    // Trưởng khoa/Nhân viên (không full scope) chỉ xem ảnh của khoa mình --
    // trước đây hàm này chỉ lọc theo khoa_id do CLIENT tự gửi lên (không gửi thì
    // trả về ảnh của MỌI khoa), không hề tự khoá theo khoa của người đang đăng
    // nhập như mọi API danh sách khác. Ảnh có 2 nguồn khoa: khoa_id lưu trực
    // tiếp trên chính bản ghi (ảnh gửi độc lập, VD Zalo 5S) HOẶC khoa_id của
    // bản ghi danh_gia liên kết (ảnh minh chứng gắn 1 lượt đánh giá do nhân
    // viên khoa mình chấm) -- phải OR cả 2 nguồn mới đúng, không được chỉ lọc
    // 1 cột khoa_id của bảng photo_gallery.
    if (authUser && !authUser.isFullScope) {
        where[Op.and] = [
            {
                [Op.or]: [
                    { khoa_id: authUser.khoa_id },
                    { '$danh_gia.khoa_id$': authUser.khoa_id },
                ],
            },
        ];
    }

    const danhGiaInclude = {
        model: DanhGia, as: 'danh_gia', required: false,
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: User, as: 'nguoi_danh_gia', attributes: ['id', 'username', 'email'] },
        ]
    };

    const res = await PhotoGallery.findAll({
        where: { ...where },
        order: [['id', 'desc']],
        include: [
            danhGiaInclude,
            { model: ChecklistItem, as: 'checklist_item', attributes: ['id', 'sub', 'tc'] },
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: User, as: 'nguoi_gui', attributes: ['id', 'username', 'email'] },
        ]
    })

    // count() cần include cùng bảng danh_gia (attributes rỗng, chỉ để JOIN) vì
    // where ở trên tham chiếu tới cột $danh_gia.khoa_id$ khi lọc theo khoa.
    const total = await PhotoGallery.count({
        where: { ...where },
        include: [{ model: DanhGia, as: 'danh_gia', attributes: [], required: false }],
    })

    return { rows: res, total }
}

// Thêm 1 ảnh (url_anh phải là link đã upload sẵn - upload thật qua /api/upload/uploadImage).
// 2 cách dùng:
//  - Ảnh minh chứng gắn 1 lượt đánh giá: truyền danh_gia_id (+ checklist_item_id nếu cần).
//  - Ảnh gửi độc lập (không qua Bảng kiểm): truyền khoa_id (bắt buộc), kèm
//    vitri_type_id/ngay_chup/nguoi_gui_id/ket_qua/ghi_chu tuỳ chọn.
const createPhotoGallery = async (data, authUser) => {
    if (!data.danh_gia_id && !data.khoa_id) {
        throw new Error(ERROR_MESSAGE.REQUIRED_PARAMS);
    }
    if (data.danh_gia_id) {
        await assertOwnerOfPhoto(data.danh_gia_id, authUser);
    } else {
        assertCanManageAnh5S(authUser);
    }
    const create = await PhotoGallery.create({ ...data, active: 1 })
    return create
}

// Sửa thông tin 1 ảnh gửi độc lập (khoa, vị trí, ngày, người gửi, kết quả, ghi chú).
// Không cho sửa danh_gia_id/checklist_item_id (ảnh gắn lượt đánh giá thì cố định theo lượt đó).
//
// Nếu khoa/ngày/người gửi thực sự đổi VÀ ảnh đang lưu cục bộ (không phải link
// Cloudinary cũ) -- đổi luôn tên file vật lý theo ngữ cảnh mới (VD sửa từ
// khoa A sang khoa B thì tên file cũng phải đổi theo B), giữ nguyên số thứ tự
// "anhN" đã có để không xáo trộn thứ tự các ảnh khác trong cùng lượt.
const updatePhotoGallery = async (data) => {
    const check = await PhotoGallery.findOne({ where: { id: data.id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_PHOTO_GALLERY)
    }

    const { id, danh_gia_id, checklist_item_id, ...rest } = data;

    const khoaChanged = rest.khoa_id !== undefined && Number(rest.khoa_id) !== Number(check.khoa_id);
    const ngayChanged = rest.ngay_chup !== undefined && rest.ngay_chup !== check.ngay_chup;
    const nguoiChanged = rest.nguoi_gui_id !== undefined && Number(rest.nguoi_gui_id) !== Number(check.nguoi_gui_id);

    let newUrlAnh;
    if ((khoaChanged || ngayChanged || nguoiChanged) && check.url_anh) {
        const khoaId = rest.khoa_id ?? check.khoa_id;
        const nguoiGuiId = rest.nguoi_gui_id ?? check.nguoi_gui_id;
        const ngay = rest.ngay_chup ?? check.ngay_chup;
        const [khoa, nguoiGui] = await Promise.all([
            khoaId ? Khoa.findByPk(khoaId) : Promise.resolve(null),
            nguoiGuiId ? User.findByPk(nguoiGuiId) : Promise.resolve(null),
        ]);
        const baseName = buildPhotoBaseName({
            khoaTen: khoa?.ten_khoa,
            username: nguoiGui?.username,
            ngay,
            index: extractPhotoIndex(check.url_anh),
        });
        if (baseName) {
            const renamed = renameImageFile(check.url_anh, baseName);
            if (renamed) newUrlAnh = renamed;
        }
    }

    const update = await check.update({ ...rest, ...(newUrlAnh ? { url_anh: newUrlAnh } : {}) })
    return update
}

// Thêm nhiều ảnh cùng lúc cho 1 lần đánh giá
const createManyPhotoGallery = async (data, authUser) => {
    const { danh_gia_id, photos } = data;
    if (!danh_gia_id || !Array.isArray(photos) || photos.length === 0) {
        throw new Error(ERROR_MESSAGE.REQUIRED_PARAMS);
    }
    await assertOwnerOfPhoto(danh_gia_id, authUser);

    const rows = photos.map(p => ({
        danh_gia_id,
        checklist_item_id: p.checklist_item_id || null,
        url_anh: p.url_anh,
        ten_file: p.ten_file || null,
        mime_type: p.mime_type || null,
        active: 1,
    }));

    return await PhotoGallery.bulkCreate(rows);
}

const deletePhotoGallery = async (id, authUser) => {
    const check = await PhotoGallery.findOne({ where: { id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_PHOTO_GALLERY)
    }

    if (check.danh_gia_id) {
        await assertOwnerOfPhoto(check.danh_gia_id, authUser);
    } else {
        assertCanManageAnh5S(authUser);
    }

    // Đánh dấu ngay trên tên file vật lý (thêm hậu tố "_daxoa") để mở
    // UPLOAD_DIR bằng Explorer cũng nhận ra ảnh nào đã xoá, không cần mở app.
    const renamedKey = renameToDeletedMarker(check.url_anh);
    const del = await check.update({
        active: 0,
        ...(renamedKey ? { url_anh: renamedKey } : {}),
    })
    return del
}

// Lấy stream/redirect để phục vụ ảnh qua route CÓ XÁC THỰC (GET
// /api/photo-gallery/image/:id) -- áp ĐÚNG quy tắc khoá theo khoa như
// getListPhotoGallery (Trưởng khoa/Nhân viên chỉ xem ảnh khoa mình), KHÔNG
// phải express.static công khai -- đây chính là điểm phải làm đúng để không
// phá vỡ phần khoá theo khoa đã fix ở getListPhotoGallery.
//
// Ảnh cũ (upload trước khi chuyển sang lưu cục bộ) vẫn còn url_anh là link
// Cloudinary đầy đủ (http...) -- redirect thẳng sang đó SAU KHI đã qua bước
// kiểm tra khoa, không cố tìm file trên đĩa.
// variant: "full" (ảnh gốc, mặc định) | "thumb" (ảnh thu nhỏ ~240x180, vài KB --
// dùng cho xuất Excel/Sheet). Cùng 1 bước kiểm tra khoa cho cả 2 loại.
const getImageForServing = async (id, authUser, variant = "full") => {
    const photo = await PhotoGallery.findOne({
        where: { id },
        include: [{ model: DanhGia, as: 'danh_gia', attributes: ['khoa_id'] }],
    });

    if (!photo) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_PHOTO_GALLERY);
    }

    const khoaId = photo.khoa_id ?? photo.danh_gia?.khoa_id ?? null;
    if (authUser && !authUser.isFullScope && Number(khoaId) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
    }

    if (variant === "thumb") {
        const thumbPath = await ensureThumbFile(photo);
        if (!thumbPath) throw new Error(ERROR_MESSAGE.NOT_FOUND_PHOTO_GALLERY);
        return { stream: fs.createReadStream(thumbPath), mimeType: "image/jpeg" };
    }

    if (/^https?:\/\//i.test(photo.url_anh)) {
        return { redirectUrl: photo.url_anh };
    }

    const filePath = resolveImagePath(photo.url_anh);
    if (!fs.existsSync(filePath)) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_PHOTO_GALLERY);
    }

    return {
        stream: fs.createReadStream(filePath),
        mimeType: photo.mime_type || 'image/jpeg',
    };
}

module.exports = {
    getListPhotoGallery,
    getImageForServing,
    createPhotoGallery,
    updatePhotoGallery,
    createManyPhotoGallery,
    deletePhotoGallery
}
