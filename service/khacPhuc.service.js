const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { Paging } = require("../config/paging");
const {
    KhacPhuc, DanhGiaChiTiet, DanhGia, ChecklistItem, Khoa, VitriType, User
} = require("../model");

const getListKhacPhuc = async (data, authUser) => {
    const paging = data.page && data.limit ? Paging(data.page, data.limit) : {};
    let where = { active: 1 };
    if (data.nguoi_phu_trach_id) where.nguoi_phu_trach_id = data.nguoi_phu_trach_id;
    if (data.trang_thai) where.trang_thai = data.trang_thai;
    // khoa_id giờ là cột trực tiếp trên khac_phuc (luôn được set khi tạo, kể cả
    // tạo tay không gắn danh_gia_chi_tiet) -- lọc thẳng, không cần join.
    if (data.khoa_id) where.khoa_id = data.khoa_id;
    // Trưởng khoa / Nhân viên (không full scope) chỉ xem khắc phục của khoa mình
    if (authUser && !authUser.isFullScope) where.khoa_id = authUser.khoa_id;

    // Lọc theo khoảng ngày phát hiện lỗi (VD: đúng 1 tuần đang xem trên UI) --
    // giống cách lich_phan_cong lọc theo tu_ngay/den_ngay -- tránh tải toàn bộ
    // bảng khac_phuc mỗi lần mở trang.
    if (data.tu_ngay && data.den_ngay) {
        where.ngay_phat_hien = { [Op.between]: [data.tu_ngay, data.den_ngay] };
    }

    const res = await KhacPhuc.findAll({
        where: { ...where },
        ...paging,
        // Bản ghi vừa tạo hoặc vừa sửa (cập nhật hành động khắc phục, trạng thái...)
        // luôn nổi lên đầu danh sách -- updatedAt tự đổi mỗi lần sửa.
        order: [['updatedAt', 'desc'], ['id', 'desc']],
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            {
                // required: false -- hành động tạo tay không có danh_gia_chi_tiet
                model: DanhGiaChiTiet, as: 'danh_gia_chi_tiet', required: false,
                include: [
                    { model: ChecklistItem, as: 'checklist_item', attributes: ['id', 's_id', 's_name', 's_color', 's_lt', 'sub', 'tc'] },
                    { model: DanhGia, as: 'danh_gia', attributes: ['id', 'ngay_danh_gia'] },
                ]
            },
            { model: User, as: 'nguoi_phu_trach', attributes: ['id', 'username', 'email'] },
        ]
    })

    const total = await KhacPhuc.count({ where: { ...where } })

    return { rows: res, total }
}

const getKhacPhucById = async (id) => {
    const data = await KhacPhuc.findOne({
        where: { id },
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            {
                model: DanhGiaChiTiet, as: 'danh_gia_chi_tiet', required: false,
                include: [
                    { model: ChecklistItem, as: 'checklist_item' },
                    { model: DanhGia, as: 'danh_gia', attributes: ['id', 'ngay_danh_gia'] },
                ]
            },
            { model: User, as: 'nguoi_phu_trach', attributes: ['id', 'username', 'email'] },
        ]
    })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_KHAC_PHUC)
    }

    return data
}

// Lấy khoa_id của bản ghi khắc phục thông qua danh_gia_chi_tiet -> danh_gia --
// chỉ dùng để dự phòng cho dữ liệu cũ chưa kịp backfill cột khoa_id trực tiếp
// (bình thường khoa_id đã có sẵn trên chính bản ghi khac_phuc).
const getKhoaIdOfKhacPhuc = async (danh_gia_chi_tiet_id) => {
    if (!danh_gia_chi_tiet_id) return null;
    const cttiet = await DanhGiaChiTiet.findOne({
        where: { id: danh_gia_chi_tiet_id },
        include: [{ model: DanhGia, as: 'danh_gia', attributes: ['khoa_id'] }],
    });
    return cttiet && cttiet.danh_gia ? cttiet.danh_gia.khoa_id : null;
}

const createUpdateKhacPhuc = async (data, authUser) => {
    if (data.id) {
        const check = await KhacPhuc.findOne({ where: { id: data.id } })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_KHAC_PHUC)
        }

        const khoaId = check.khoa_id ?? await getKhoaIdOfKhacPhuc(check.danh_gia_chi_tiet_id);
        if (authUser && !authUser.isFullScope && Number(khoaId) !== Number(authUser.khoa_id)) {
            throw new Error(ERROR_MESSAGE.FORBIDDEN);
        }
        // Trưởng khoa/Nhân viên không được đổi khắc phục sang khoa khác của mình
        if (authUser && !authUser.isFullScope && data.khoa_id != null && Number(data.khoa_id) !== Number(authUser.khoa_id)) {
            throw new Error(ERROR_MESSAGE.FORBIDDEN);
        }

        const update = await check.update({ ...data })
        return update
    } else {
        if (!data.danh_gia_chi_tiet_id && !data.khoa_id) {
            throw new Error(ERROR_MESSAGE.REQUIRED_PARAMS);
        }
        const khoaId = data.khoa_id ?? await getKhoaIdOfKhacPhuc(data.danh_gia_chi_tiet_id);
        if (authUser && !authUser.isFullScope && Number(khoaId) !== Number(authUser.khoa_id)) {
            throw new Error(ERROR_MESSAGE.FORBIDDEN);
        }
        const create = await KhacPhuc.create({ ...data, khoa_id: khoaId, active: 1 })
        return create
    }
}

// Xoá mềm
const deleteKhacPhuc = async (id, authUser) => {
    const check = await KhacPhuc.findOne({ where: { id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_KHAC_PHUC)
    }

    const khoaId = check.khoa_id ?? await getKhoaIdOfKhacPhuc(check.danh_gia_chi_tiet_id);
    if (authUser && !authUser.isFullScope && Number(khoaId) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListKhacPhuc,
    getKhacPhucById,
    createUpdateKhacPhuc,
    deleteKhacPhuc
}
