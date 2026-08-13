// ============================================================================
// Dat ten file anh de quan ly thay vi uuid ngau nhien -- theo mau:
//   <KhoaVietTat>_<username>_<ngayThangNam>_anh<N>
// VD: danh gia "Phong To chuc hanh chinh", nguoi lam "dungpt" (username), ngay
// 12/8/2026, anh thu 1 -> "Ptchc_dungpt_12082026_anh1".
// Khi xoa anh, ten file duoc doi them hau to "_daxoa" (xem
// localImageStorage.service.js -> renameToDeletedMarker) de nhan ra ngay tu
// ngoai Explorer, khong can mo app moi biet anh nao da xoa.
// ============================================================================

// Bo dau tieng Viet -- dung NFD + regex unicode range cua dau ket hop, roi xu
// ly rieng "d/D" vi 2 ky tu nay khong tach duoc qua NFD.
function stripDiacritics(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d") // d
    .replace(/Đ/g, "D"); // D
}

// Viet tat ten khoa/phong: lay chu cai dau cua tung tu, VD "Phong To chuc
// hanh chinh" -> "Ptchc" (chi viet hoa chu dau tien, con lai viet thuong).
function abbreviateKhoa(tenKhoa) {
  if (!tenKhoa) return "Khoa";
  const clean = stripDiacritics(tenKhoa);
  const words = clean.split(/[\s\-–—/]+/).filter(Boolean);
  const letters = words
    .map((w) => w[0])
    .filter(Boolean)
    .join("");
  if (!letters) return "Khoa";
  return letters[0].toUpperCase() + letters.slice(1).toLowerCase();
}

// Chuan hoa 1 doan thanh slug an toan cho ten file (chi giu chu/so, bo dau,
// bo ky tu dac biet) -- dung cho username lan phan viet tat khoa.
function slugifyPart(str) {
  if (!str) return "";
  return stripDiacritics(str).replace(/[^a-zA-Z0-9]/g, "");
}

// "2026-08-12" -> "12082026" (ddMMyyyy, khong dau phan cach).
function formatDdMmYyyy(dateLike) {
  if (!dateLike) return null;
  const str = String(dateLike).slice(0, 10); // phong khi co kem gio ISO
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m) {
    const [, yyyy, mm, dd] = m;
    return `${dd}${mm}${yyyy}`;
  }
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}${mm}${d.getFullYear()}`;
}

// Ghep thanh ten file goc (chua gom duoi .jpg) -- tra ve null neu thieu du
// lieu bat buoc (luc do noi goi tu roi ve ten ngau nhien uuid nhu cu).
function buildPhotoBaseName({ khoaTen, username, ngay, index }) {
  const khoa = abbreviateKhoa(khoaTen);
  const user = slugifyPart(username);
  const ngayStr = formatDdMmYyyy(ngay);
  const idx = Number(index);
  const idxStr = Number.isFinite(idx) && idx > 0 ? Math.trunc(idx) : 1;

  if (!user || !ngayStr) return null;

  return `${khoa}_${user}_${ngayStr}_anh${idxStr}`;
}

module.exports = {
  stripDiacritics,
  abbreviateKhoa,
  slugifyPart,
  formatDdMmYyyy,
  buildPhotoBaseName,
};
