/**
 * Tạo sẵn (làm "nóng") ảnh thu nhỏ cho TOÀN BỘ ảnh minh chứng đang hoạt động.
 *
 * Không bắt buộc: backend tự tạo thumbnail khi có người xin lần đầu (xem
 * service/photoThumb.service.js). Chạy script này khi muốn lần xuất Excel/Sheet
 * đầu tiên (đặc biệt với hàng chục nghìn ảnh) không phải chờ sinh thumbnail,
 * VD sau khi triển khai hoặc trước đợt xuất cuối năm.
 *
 * Chạy lại an toàn nhiều lần -- ảnh đã có thumbnail hợp lệ sẽ bị bỏ qua:
 *   node scripts/warmThumbnails.js
 */
require("dotenv").config();
const { PhotoGallery } = require("../model");
const { ensureThumbFile } = require("../service/photoThumb.service");

const CONCURRENCY = 4;

async function run() {
  const photos = await PhotoGallery.findAll({ where: { active: 1 }, attributes: ["id", "url_anh"], order: [["id", "asc"]] });
  console.log(`Tìm thấy ${photos.length} ảnh đang hoạt động.`);
  let next = 0, ok = 0, fail = 0;
  const started = Date.now();

  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= photos.length) return;
      const res = await ensureThumbFile(photos[i]);
      if (res) ok++; else { fail++; console.log(`  bỏ qua ảnh id=${photos[i].id} (thiếu file/không tải được)`); }
      if ((ok + fail) % 200 === 0) console.log(`  ... ${ok + fail}/${photos.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Xong: ${ok} thumbnail sẵn sàng, ${fail} lỗi, mất ${((Date.now() - started) / 1000).toFixed(1)}s.`);
  process.exit(0);
}

run().catch((err) => { console.error("Lỗi:", err); process.exit(1); });
