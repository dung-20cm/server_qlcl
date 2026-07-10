const { ERROR_MESSAGE } = require("../config/error");
const { LichPhanCong, Khoa, VitriType, User, DotDanhGia } = require("../model");

const getListLichPhanCong = async (data, authUser) => {
    let where = { active: 1 };
    if (data.khoa_id) where.khoa_id = data.khoa_id;
    if (data.vitri_type_id) where.vitri_type_id = data.vitri_type_id;
    if (data.nguoi_thuc_hien_id) where.nguoi_thuc_hien_id = data.nguoi_thuc_hien_id;
    if (data.loai_lich) where.loai_lich = data.loai_lich;
    if (data.dot_danh_gia_id) where.dot_danh_gia_id = data.dot_danh_gia_id;
    if (data.active === 'all') delete where.active;
    // Trưởng khoa / Nhân viên (không full scope) chỉ xem lịch của khoa mình.
    // Phòng QLCL/Admin (full scope) xem lịch của tất cả khoa.
    if (authUser && !authUser.isFullScope) where.khoa_id = authUser.khoa_id;

    const res = await LichPhanCong.findAll({
        where: { ...where },
        order: [['id', 'desc']],
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: User, as: 'nguoi_thuc_hien', attributes: ['id', 'username', 'email'] },
            { model: DotDanhGia, as: 'dot', attributes: ['id', 'ten_dot', 'trang_thai'] },
        ]
    })

    const total = await LichPhanCong.count({ where: { ...where } })

    return { rows: res, total }
}

const getLichPhanCongById = async (id) => {
    const data = await LichPhanCong.findOne({
        where: { id },
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: User, as: 'nguoi_thuc_hien', attributes: ['id', 'username', 'email'] },
            { model: DotDanhGia, as: 'dot', attributes: ['id', 'ten_dot', 'trang_thai'] },
        ]
    })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_LICH_PHAN_CONG)
    }

    return data
}

const createUpdateLichPhanCong = async (data, authUser) => {
    // dinh_ky (định kỳ theo thứ): vẫn giữ ngay_thuc_hien làm MỐC NGÀY BẮT ĐẦU áp
    // dụng (frontend tự tính thu_trong_tuan từ ngày này) — để lịch định kỳ chỉ
    // lặp lại từ ngày bắt đầu trở đi, KHÔNG hiển thị ngược về các tuần trước đó.
    // mot_lan/dot_xuat: không dùng thu_trong_tuan.
    if (data.loai_lich !== 'dinh_ky') {
        data.thu_trong_tuan = null;
    }

    if (data.id) {
        const check = await LichPhanCong.findOne({ where: { id: data.id } })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_LICH_PHAN_CONG)
        }

        // Trưởng khoa (không full scope) chỉ được sửa lịch của khoa mình, và không
        // được đổi khoa_id sang khoa khác (nếu có gửi lên).
        if (authUser && !authUser.isFullScope) {
            if (Number(check.khoa_id) !== Number(authUser.khoa_id)) {
                throw new Error(ERROR_MESSAGE.FORBIDDEN);
            }
            if (data.khoa_id && Number(data.khoa_id) !== Number(authUser.khoa_id)) {
                throw new Error(ERROR_MESSAGE.FORBIDDEN);
            }
        }

        const update = await check.update({ ...data })
        return update
    } else {
        // Trưởng khoa (không full scope) chỉ được tạo lịch cho khoa của chính mình.
        if (authUser && !authUser.isFullScope && Number(data.khoa_id) !== Number(authUser.khoa_id)) {
            throw new Error(ERROR_MESSAGE.FORBIDDEN);
        }
        const create = await LichPhanCong.create({ ...data, active: 1 })
        return create
    }
}

// Xoá mềm
const deleteLichPhanCong = async (id, authUser) => {
    const check = await LichPhanCong.findOne({ where: { id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_LICH_PHAN_CONG)
    }

    if (authUser && !authUser.isFullScope && Number(check.khoa_id) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListLichPhanCong,
    getLichPhanCongById,
    createUpdateLichPhanCong,
    deleteLichPhanCong
}
