const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { Paging } = require("../config/paging");
const { sequelize } = require("../config/connect");
const {
    DanhGia, DanhGiaChiTiet, Khoa, VitriType, VitriChiTiet, User, ChecklistItem, KhacPhuc
} = require("../model");

const getListDanhGia = async (data, authUser) => {
    const paging = data.page && data.limit ? Paging(data.page, data.limit) : {};
    let where = { active: 1 };
    if (data.khoa_id) where.khoa_id = data.khoa_id;
    if (data.vitri_type_id) where.vitri_type_id = data.vitri_type_id;
    if (data.nguoi_danh_gia_id) where.nguoi_danh_gia_id = data.nguoi_danh_gia_id;
    if (data.dot_danh_gia) where.dot_danh_gia = data.dot_danh_gia;
    if (data.tu_ngay || data.den_ngay) {
        where.ngay_danh_gia = {};
        if (data.tu_ngay) where.ngay_danh_gia[Op.gte] = data.tu_ngay;
        if (data.den_ngay) where.ngay_danh_gia[Op.lte] = data.den_ngay;
    }
    // Trưởng khoa / Nhân viên (không full scope) chỉ xem đánh giá của khoa mình,
    // bất kể client có truyền khoa_id khác hay không.
    if (authUser && !authUser.isFullScope) where.khoa_id = authUser.khoa_id;

    const res = await DanhGia.findAll({
        where: { ...where },
        ...paging,
        order: [['ngay_danh_gia', 'desc'], ['id', 'desc']],
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: VitriChiTiet, as: 'vitri_chi_tiet', attributes: ['id', 'ma_vitri'] },
            { model: User, as: 'nguoi_danh_gia', attributes: ['id', 'username', 'email'] },
        ]
    })

    const total = await DanhGia.count({ where: { ...where } })

    // Tính sẵn tỷ lệ đạt từng nhóm S1..S5 cho mỗi lượt (dùng cho tab Xu hướng,
    // Dashboard...) — 1 query duy nhất cho toàn bộ danh sách đang trả về, tránh N+1.
    const ids = res.map(r => r.id);
    const byDanhGia = {};
    if (ids.length) {
        const chiTiet = await DanhGiaChiTiet.findAll({
            where: { danh_gia_id: { [Op.in]: ids } },
            attributes: ['danh_gia_id', 'ket_qua', 'checklist_item_id'],
            include: [{ model: ChecklistItem, as: 'checklist_item', attributes: ['s_id', 's_name', 's_color', 's_lt'] }],
        });
        for (const row of chiTiet) {
            const ci = row.checklist_item;
            const sId = ci?.s_id || 'KHONG_RO';
            const dgId = row.danh_gia_id;
            if (!byDanhGia[dgId]) byDanhGia[dgId] = {};
            if (!byDanhGia[dgId][sId]) byDanhGia[dgId][sId] = { name: ci?.s_name, color: ci?.s_color, lt: ci?.s_lt, ok: 0, total: 0 };
            byDanhGia[dgId][sId].total++;
            if (row.ket_qua === 1) byDanhGia[dgId][sId].ok++;
        }
    }

    let rows = res.map(r => {
        const obj = r.toJSON();
        const groups = byDanhGia[r.id] || {};
        obj.sScores = Object.entries(groups).map(([id, v]) => ({
            id, name: v.name, color: v.color, lt: v.lt, ok: v.ok, total: v.total,
            pct: v.total ? Math.round((v.ok / v.total) * 100) : 0,
        }));
        return obj;
    });

    rows = await attachDongDanhGia(rows);

    return { rows, total }
}

// Gắn danh sách cán bộ ĐỒNG đánh giá (dong_danh_gia_ids, chuỗi id nối dấu phẩy)
// thành mảng object {id, username, email} — 1 query duy nhất cho cả danh sách,
// tránh N+1 khi mỗi lượt đánh giá có nhiều đồng đánh giá khác nhau.
async function attachDongDanhGia(rows) {
    const idSet = new Set();
    for (const r of rows) {
        (r.dong_danh_gia_ids || '').split(',').forEach(s => {
            const id = Number(s.trim());
            if (id) idSet.add(id);
        });
    }
    if (!idSet.size) return rows.map(r => ({ ...r, dong_danh_gia: [] }));

    const users = await User.findAll({
        where: { id: { [Op.in]: [...idSet] } },
        attributes: ['id', 'username', 'email'],
    });
    const userMap = new Map(users.map(u => [u.id, u.toJSON()]));

    return rows.map(r => ({
        ...r,
        dong_danh_gia: (r.dong_danh_gia_ids || '')
            .split(',')
            .map(s => userMap.get(Number(s.trim())))
            .filter(Boolean),
    }));
}

// Lấy 1 phiếu đánh giá kèm toàn bộ chi tiết từng tiêu chí, nhóm sẵn theo S
// (để hiển thị lại bảng kiểm giống lúc làm đánh giá, hoặc để in báo cáo).
const getDanhGiaById = async (id) => {
    const data = await DanhGia.findOne({
        where: { id },
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: VitriChiTiet, as: 'vitri_chi_tiet', attributes: ['id', 'ma_vitri'] },
            { model: User, as: 'nguoi_danh_gia', attributes: ['id', 'username', 'email'] },
        ]
    })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_DANH_GIA)
    }

    const chiTiet = await DanhGiaChiTiet.findAll({
        where: { danh_gia_id: id },
        include: [{ model: ChecklistItem, as: 'checklist_item' }]
    })

    // Nhóm theo S1..S5 + tính điểm từng nhóm động (không lưu sẵn trong DB)
    const grouped = {};
    for (const row of chiTiet) {
        const ci = row.checklist_item;
        const sId = ci?.s_id || 'KHONG_RO';
        if (!grouped[sId]) {
            grouped[sId] = {
                id: sId,
                name: ci?.s_name,
                color: ci?.s_color,
                lt: ci?.s_lt,
                ok: 0,
                total: 0,
                items: []
            };
        }
        grouped[sId].total++;
        if (row.ket_qua === 1) grouped[sId].ok++;
        grouped[sId].items.push({
            id: row.id,
            checklist_item_id: row.checklist_item_id,
            sub: ci?.sub,
            tc: ci?.tc,
            ket_qua: row.ket_qua,
            ghi_chu: row.ghi_chu,
        });
    }
    Object.values(grouped).forEach(g => { g.pct = g.total ? Math.round((g.ok / g.total) * 100) : 0; });

    const [withDongDanhGia] = await attachDongDanhGia([data.toJSON()]);
    return { ...withDongDanhGia, sScores: Object.values(grouped) }
}

// Tạo 1 phiếu đánh giá kèm toàn bộ chi tiết tiêu chí trong 1 transaction.
// payload: { khoa_id, vitri_type_id, vitri_chi_tiet_id, nguoi_danh_gia_id,
//   ngay_danh_gia, dot_danh_gia, chi_tiet: [{ checklist_item_id, ket_qua, ghi_chu }] }
const createDanhGia = async (data, authUser) => {
    const { chi_tiet, ...header } = data;

    if (!Array.isArray(chi_tiet) || chi_tiet.length === 0) {
        throw new Error(ERROR_MESSAGE.REQUIRED_PARAMS);
    }

    // Trưởng khoa / Nhân viên (không full scope) chỉ được tạo đánh giá cho khoa của chính mình.
    if (authUser && !authUser.isFullScope && Number(header.khoa_id) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
    }

    const so_tieu_chi_tong = chi_tiet.length;
    const so_tieu_chi_dat = chi_tiet.filter(c => c.ket_qua === 1).length;
    const pct = so_tieu_chi_tong ? Math.round((so_tieu_chi_dat / so_tieu_chi_tong) * 100) : 0;
    const xep_loai = pct >= 85 ? '✓ ĐẠT TỐT' : pct >= 70 ? '◎ ĐẠT' : '✗ CHƯA ĐẠT';

    return await sequelize.transaction(async (t) => {
        const danhGia = await DanhGia.create({
            ...header,
            so_tieu_chi_tong,
            so_tieu_chi_dat,
            pct,
            xep_loai,
            active: 1,
        }, { transaction: t });

        const rows = chi_tiet.map(c => ({
            danh_gia_id: danhGia.id,
            checklist_item_id: c.checklist_item_id,
            ket_qua: c.ket_qua,
            ghi_chu: c.ghi_chu || null,
        }));
        const chiTietRows = await DanhGiaChiTiet.bulkCreate(rows, { transaction: t });

        // Tự động tạo hành động khắc phục cho MỌI tiêu chí không đạt (ket_qua = 0)
        // — hạn xử lý mặc định +7 ngày kể từ ngày đánh giá, trạng thái "Chưa bắt đầu".
        // (Trước đây không có bước này nên tab Tiến độ khắc phục luôn trống trừ khi
        // ai đó tạo tay — không có UI tạo tay nào tồn tại.)
        const ngayDanhGia = header.ngay_danh_gia ? new Date(header.ngay_danh_gia) : new Date();
        const hanDate = new Date(ngayDanhGia);
        hanDate.setDate(hanDate.getDate() + 7);
        const han_xu_ly = hanDate.toISOString().slice(0, 10);
        const tuan = `Tuần ${Math.ceil(ngayDanhGia.getDate() / 7)} - ${ngayDanhGia.getMonth() + 1}/${ngayDanhGia.getFullYear()}`;

        const failedChiTiet = chiTietRows.filter(ct => ct.ket_qua === 0);
        // khoa_id/vitri_type_id/s_id giờ lưu trực tiếp trên khac_phuc (không chỉ
        // suy ra qua join) -- cần tra s_id của từng tiêu chí lỗi từ checklist_item.
        let sIdByChecklistItemId = {};
        if (failedChiTiet.length) {
            const items = await ChecklistItem.findAll({
                where: { id: failedChiTiet.map(ct => ct.checklist_item_id) },
                attributes: ['id', 's_id'],
                transaction: t,
            });
            sIdByChecklistItemId = Object.fromEntries(items.map(it => [it.id, it.s_id]));
        }
        const ngay_phat_hien = header.ngay_danh_gia || ngayDanhGia.toISOString().slice(0, 10);

        const khacPhucRows = failedChiTiet.map(ct => ({
            danh_gia_chi_tiet_id: ct.id,
            khoa_id: header.khoa_id,
            vitri_type_id: header.vitri_type_id,
            s_id: sIdByChecklistItemId[ct.checklist_item_id] || null,
            ngay_phat_hien,
            trang_thai: 'Chưa bắt đầu',
            han_xu_ly,
            tuan,
            active: 1,
        }));
        if (khacPhucRows.length) {
            await KhacPhuc.bulkCreate(khacPhucRows, { transaction: t });
        }

        return danhGia;
    });
}

// Xoá mềm: chỉ ẩn (active=0), giữ dữ liệu lịch sử (KP, ảnh đã liên kết đánh giá này)
const deleteDanhGia = async (id, authUser) => {
    const check = await DanhGia.findOne({ where: { id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_DANH_GIA)
    }

    // Trưởng khoa (không full scope) chỉ được xoá đánh giá của khoa mình.
    if (authUser && !authUser.isFullScope && Number(check.khoa_id) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
    }

    const del = await check.update({ active: 0 })
    return del
}

// Top 10 tiêu chí bị ✗ (không đạt) nhiều nhất, kèm breakdown theo khoa — dùng cho
// tab Xu hướng (giúp Phòng QLCL phát hiện nhanh lỗi lặp lại nhiều nơi).
const getTopTieuChiLoi = async (data, authUser) => {
    let dgWhere = { active: 1 };
    if (data.khoa_id) dgWhere.khoa_id = data.khoa_id;
    if (data.vitri_type_id) dgWhere.vitri_type_id = data.vitri_type_id;
    if (data.tu_ngay || data.den_ngay) {
        dgWhere.ngay_danh_gia = {};
        if (data.tu_ngay) dgWhere.ngay_danh_gia[Op.gte] = data.tu_ngay;
        if (data.den_ngay) dgWhere.ngay_danh_gia[Op.lte] = data.den_ngay;
    }
    if (authUser && !authUser.isFullScope) dgWhere.khoa_id = authUser.khoa_id;

    const dgList = await DanhGia.findAll({ where: dgWhere, attributes: ['id', 'khoa_id'] });
    const idToKhoa = new Map(dgList.map(d => [d.id, d.khoa_id]));
    const ids = dgList.map(d => d.id);
    if (!ids.length) return { data: [], totalLuot: 0 };

    const chiTiet = await DanhGiaChiTiet.findAll({
        where: { danh_gia_id: { [Op.in]: ids }, ket_qua: 0 },
        include: [{ model: ChecklistItem, as: 'checklist_item' }],
    });

    const khoaRows = await Khoa.findAll({ attributes: ['id', 'ten_khoa'] });
    const khoaNameMap = new Map(khoaRows.map(k => [k.id, k.ten_khoa]));

    const agg = new Map();
    for (const row of chiTiet) {
        const ci = row.checklist_item;
        if (!ci) continue;
        if (!agg.has(ci.id)) {
            agg.set(ci.id, { checklist_item_id: ci.id, s_id: ci.s_id, s_name: ci.s_name, sub: ci.sub, tc: ci.tc, count: 0, byKhoa: new Map() });
        }
        const a = agg.get(ci.id);
        a.count++;
        const khoaName = khoaNameMap.get(idToKhoa.get(row.danh_gia_id)) || 'N/A';
        a.byKhoa.set(khoaName, (a.byKhoa.get(khoaName) || 0) + 1);
    }

    const list = [...agg.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(a => ({
            checklist_item_id: a.checklist_item_id,
            s_id: a.s_id,
            s_name: a.s_name,
            sub: a.sub,
            tc: a.tc,
            fail_count: a.count,
            rate_pct: ids.length ? Math.round((a.count / ids.length) * 100) : 0,
            by_khoa: [...a.byKhoa.entries()]
                .map(([khoa, count]) => ({ khoa, count }))
                .sort((x, y) => y.count - x.count),
        }));

    return { data: list, totalLuot: ids.length };
}

module.exports = {
    getListDanhGia,
    getDanhGiaById,
    createDanhGia,
    deleteDanhGia,
    getTopTieuChiLoi,
}
