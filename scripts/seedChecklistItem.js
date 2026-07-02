/**
 * Seed dữ liệu tiêu chí bảng kiểm (bảng "checklist_item") lấy từ BANGKIEM_VITRI
 * trong 5S_Dashboard_BVTB_v4.html (20 vị trí x 5 nhóm S x tiêu chí con = 420 dòng).
 *
 * Dữ liệu thô nằm ở scripts/data/checklistItem.data.json (tách riêng khỏi logic
 * seed cho dễ xem/sửa). Mỗi dòng có vitri_ten để tra ra vitri_type_id tương ứng
 * (bảng vitri_type phải seed trước - chạy `npm run seed:vitri` trước script này).
 *
 * Chạy 1 lần (idempotent, chạy lại nhiều lần không bị trùng dữ liệu):
 *   node scripts/seedChecklistItem.js
 *
 * Yêu cầu: MySQL local đang chạy, đúng cấu hình .env, và đã seed xong vitri_type.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { VitriType, ChecklistItem } = require("../model");

const DATA_PATH = path.join(__dirname, "data", "checklistItem.data.json");

async function run() {
  console.log("== Seed checklist_item ==");
  const rows = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

  // Tra map ten_vitri -> id từ bảng vitri_type
  const vitriRows = await VitriType.findAll();
  const vitriMap = {};
  vitriRows.forEach((v) => { vitriMap[v.ten_vitri] = v.id; });

  let count = 0;
  let skipped = 0;
  for (const r of rows) {
    const vitri_type_id = vitriMap[r.vitri_ten];
    if (!vitri_type_id) {
      console.warn(`  BỎ QUA (không tìm thấy vị trí "${r.vitri_ten}"): ${r.s_id} - ${r.sub}`);
      skipped++;
      continue;
    }

    const [item, created] = await ChecklistItem.findOrCreate({
      where: {
        vitri_type_id,
        s_id: r.s_id,
        sub: r.sub,
        tc: r.tc,
      },
      defaults: {
        s_name: r.s_name,
        s_color: r.s_color,
        s_lt: r.s_lt,
        thu_tu: r.thu_tu,
        active: 1,
      },
    });
    count++;
    if (count % 50 === 0) {
      console.log(`  ... đã xử lý ${count}/${rows.length}`);
    }
  }

  console.log(`Seed xong. Tổng: ${count} tiêu chí (bỏ qua: ${skipped}).`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed lỗi:", err);
  process.exit(1);
});
