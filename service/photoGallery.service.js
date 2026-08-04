const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { PhotoGallery, DanhGia, ChecklistItem, Khoa, VitriType, User } = require("../model");
const { QUAN_LY_ANH_5S_TAT_CA_KHOA } = require("../middleware/actionDefault");

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

const getListPhotoGallery = async (data) => {
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

    const res = await PhotoGallery.findAll({
        where: { ...where },
        order: [['id', 'desc']],
        include: [
            {
                model: DanhGia, as: 'danh_gia',
                include: [
                    { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
                    { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
                    { model: User, as: 'nguoi_danh_gia', attributes: ['id', 'username', 'email'] },
                ]
            },
            { model: ChecklistItem, as: 'checklist_item', attributes: ['id', 'sub', 'tc'] },
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: User, as: 'nguoi_gui', attributes: ['id', 'username', 'email'] },
        ]
    })

    const total = await PhotoGallery.count({ where: { ...where } })

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
const updatePhotoGallery = async (data) => {
    const check = await PhotoGallery.findOne({ where: { id: data.id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_PHOTO_GALLERY)
    }

    const { id, danh_gia_id, checklist_item_id, ...rest } = data;
    const update = await check.update({ ...rest })
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

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListPhotoGallery,
    createPhotoGallery,
    updatePhotoGallery,
    createManyPhotoGallery,
    deletePhotoGallery
}
