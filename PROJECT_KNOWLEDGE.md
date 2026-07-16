# PROJECT_KNOWLEDGE.md — server_qlcl (backend)

Hệ thống Quản lý Chất lượng 5S cho Bệnh viện Đa khoa Thái Bình (chuyển đổi từ boilerplate bán hàng `server_nodejs_mysql` cũ). Backend Node.js/Express/Sequelize/MySQL.

## 1. Vị trí code — repo nào là repo đang code

| Nơi | Đường dẫn | Vai trò |
|---|---|---|
| **`D:\My-project\Hospital\server_qlcl`** | thư mục này | **Repo đang code chính hiện tại** — remote `origin` → `https://github.com/dung-20cm/server_qlcl` (private), là bản tiếp nối của `server_qlcl_push` bên dưới, hiện **mới hơn** (commit sau cùng đi thẳng từ đây) |
| `D:\My-project\Hospital\hospital_server` | sibling folder | Repo **cũ/song song**, remote khác (`dungdevtb/server_nodejs_mysql`) — cùng lịch sử code nghiệp vụ nhưng git history lộn xộn (nhánh mồ côi hỏng `server_qlcl_clean`, `.git/index.lock` kẹt). Không dùng làm nơi push chính nữa. |
| `hospital_server/server_qlcl_push` | subfolder trong `hospital_server` | Bản sạch từng dùng để push tạm sang GitHub `server_qlcl` khi `hospital_server/.git` bị khoá — cùng remote với thư mục này nhưng nay **cũ hơn** thư mục này |

**Kết luận thực hành:** code trực tiếp trong `server_qlcl` (thư mục này), push thẳng từ đây. Không cần qua `hospital_server/server_qlcl_push` nữa trừ khi đang cố tình đồng bộ ngược. Một số comment cũ trong code (kể cả phía frontend `CMS_Dashboard_QLCL`) còn trỏ đường dẫn `hospital_server` — đó là tàn dư, không phản ánh vị trí code hiện hành.

## 2. Stack & khởi động

- Node.js + Express, Sequelize (mysql2), JWT (`jsonwebtoken`), bcrypt/bcryptjs, Cloudinary (upload ảnh, lưu RAM qua `multer.memoryStorage()` rồi đẩy thẳng lên Cloudinary — không ghi file ra đĩa server), ExcelJS (export Excel).
- CSDL MySQL, cấu hình qua `.env` (không commit): `DB_HOST/PORT/USERNAME/PASSWORD/DATABASE`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `CLOUDINARY_*`, `API_SERVER`, `PORT` (mặc định `8080`).
- Chạy: `npm run dev` (nodemon `server.js`). `model/index.js` tự `.sync()` tất cả bảng **tuần tự** theo đúng thứ tự phụ thuộc khóa ngoại (trước đây chạy đồng thời không await hay lỗi "Failed to open the referenced table"), đồng thời tự `ALTER TABLE` thêm vài cột còn thiếu ở DB cũ (`danh_gia.dot_danh_gia_id`, `photo_gallery.*` các cột ảnh độc lập, `user.khoa_id`, `lich_phan_cong.dot_danh_gia_id`) — an toàn chạy lại nhiều lần, không tự sinh cột trùng.
- Seed: `npm run seed` (role/permission/role_permission), `npm run seed:khoa` (49 khoa), `npm run seed:vitri` (20 vị trí), `npm run seed:checklist` (420 tiêu chí). Migration tay: `npm run migrate:lich-dot-danh-gia`.

## 3. Kiến trúc code

- Mẫu `BaseModel` + `static association()` — mỗi model tự khai báo quan hệ (`belongsTo`/`hasMany`) trong hàm này, gọi tập trung từ `model/index.js` sau khi tất cả model đã `init`.
- Mỗi bảng nghiệp vụ có đủ 4 file: `model/*.model.js`, `service/*.service.js`, `controllers/*.controller.js`, `routes/*.routes.js` — controller mỏng (chỉ gọi service), service chứa logic + Sequelize query.
- Ghi nhiều bảng cùng lúc dùng `sequelize.transaction()` (vd `createDanhGia`, `createUpdateAnh5sTuan`).
- Bảng trung gian nhiều-nhiều (`anh_5s_tuan_vitri`) dùng pattern destroy-rồi-bulkCreate khi update, không lưu mảng trong 1 cột.
- Response chuẩn hoá qua `config/handle_response.js` (`Response(fn)` wrapper bọc quanh mọi hàm controller) → trả `{statusCode, message, data}`.
- Lỗi nghiệp vụ ném qua `throw new Error(ERROR_MESSAGE.X)`, danh sách message ở `config/error.js`.
- Route upload ảnh (`POST /api/upload/uploadImage`) định nghĩa trực tiếp trong `server.js` (không qua `routes/`), gắn `isAuthAdmin`, trả `{statusCode, message, data: {url, secure_url}}` — khớp đúng envelope chuẩn để FE (`axiosClient`) không cần xử lý riêng.

## 4. Sơ đồ CSDL — 18 bảng (`model/index.js`)

### Nhóm Auth/RBAC
- **user**: id, username, email(unique), mobile, address, password(hash), avatar, khoa_id(FK, nullable), status, del.
- **role**: id, name, slug, del. hasOne `user_role`, hasMany `role_permission`.
- **permission**: id, name, slug, del. hasMany `role_permission`.
- **user_role**: user_id, role_id, del — gán 1 user 1 role.
- **role_permission**: role_id, permission_id, del — ma trận quyền theo role.
- **refresh_token**: token làm mới phiên đăng nhập.

Danh sách 13 slug quyền theo 4 role (Admin / Phòng QLCL / Trưởng khoa / Nhân viên) nằm ở `middleware/actionDefault.js`, dùng làm tham số cho `check_permission(slug)`. Sơ đồ role/quyền tổng thể: xem `map.jpg`.

### Nhóm nghiệp vụ 5S (12 bảng)
- **khoa**: id, ten_khoa(unique), nhom (Khối phòng/ban, Hệ cận LS, Hệ ngoại, Hệ nội, Trung tâm), active. → hasMany vitri_chi_tiet, danh_gia, lich_phan_cong, anh_5s_tuan.
- **vitri_type**: id, ten_vitri(unique, vd "1. Buồng bệnh"), thu_tu, active. → hasMany checklist_item, vitri_chi_tiet, danh_gia, lich_phan_cong, anh_5s_tuan_vitri.
- **checklist_item**: id, vitri_type_id(FK), s_id/s_name/s_color/s_lt (nhóm 5S S1..S5), sub, tc (nội dung tiêu chí), thu_tu, active.
- **vitri_chi_tiet**: id, khoa_id(FK), vitri_type_id(FK), ma_vitri (vd "E203"), ghi_chu, active. → hasMany danh_gia.
- **dot_danh_gia** *(bổ sung sau bản tài liệu trước)*: id, ten_dot(unique), tu_ngay, den_ngay, mo_ta, trang_thai (`dang-mo`/`da-dong`), active. → hasMany danh_gia (qua `dot_danh_gia_id`). Cấu hình "đợt/chiến dịch đánh giá" ở FE `/cau-hinh/dot-danh-gia`.
- **danh_gia**: id, khoa_id, vitri_type_id, vitri_chi_tiet_id(nullable), nguoi_danh_gia_id(FK user), ngay_danh_gia, dot_danh_gia (text, cũ) + dot_danh_gia_id (FK, mới — 2 cột song song để tương thích ngược), so_tieu_chi_dat, so_tieu_chi_tong, pct, xep_loai, active. → hasMany danh_gia_chi_tiet, photo_gallery.
- **danh_gia_chi_tiet**: id, danh_gia_id(FK), checklist_item_id(FK), ket_qua (1 đạt/0 không đạt/NULL chưa đánh giá), ghi_chu. → hasMany khac_phuc.
- **khac_phuc**: id, danh_gia_chi_tiet_id(FK), nguoi_phu_trach_id(FK user, nullable), hanh_dong_khac_phuc, han_xu_ly, tuan, trang_thai (Chưa bắt đầu/Đang xử lý/Đã xong), ghi_chu, active.
- **photo_gallery**: id, danh_gia_id(FK, nullable), checklist_item_id(FK, nullable), url_anh (Cloudinary), ten_file, mime_type, cộng các cột cho ảnh gửi độc lập (không gắn 1 lượt đánh giá): khoa_id, vitri_type_id, ngay_chup, nguoi_gui_id, ket_qua, ghi_chu, active.
- **lich_phan_cong**: id, khoa_id(FK), vitri_type_id(FK, nullable="tất cả vị trí"), dot_danh_gia_id(FK, nullable), loai_lich(dinh_ky mặc định), thu_trong_tuan(1-7, nullable), ngay_thuc_hien(nullable), nguoi_thuc_hien_id(FK user) — quy ước 1 dòng = 1 người, phân công nhiều người thì tạo nhiều dòng, ghi_chu, active.
- **anh_5s_tuan**: id, khoa_id(FK), tuan (mốc thứ 2 đầu tuần), so_luong_anh, chat_luong, ghi_chu, active. → hasMany vi_tri (anh_5s_tuan_vitri).
- **anh_5s_tuan_vitri** (bảng trung gian, không có cột active): id, anh_5s_tuan_id(FK), vitri_type_id(FK).

## 5. RBAC — 2 kiểu middleware

- `check_permission(slug)` — dùng cho route chỉ 1 role cụ thể được vào (vd `TAO_TAI_KHOAN` chỉ Admin). Kiểm tra token → user → user_role → role_permission chứa đúng slug.
- `isAuthAdmin` — chỉ cần đăng nhập hợp lệ (bất kỳ role nào), dùng cho các route nghiệp vụ đa vai trò (danh_gia, khac_phuc, lich_phan_cong, anh_5s_tuan, dot_danh_gia, upload ảnh...) vì phân quyền chi tiết theo hành động chưa được yêu cầu ở mức route — xử lý ở tầng nghiệp vụ nếu cần sau này.
- Cả 2 middleware khi từ chối trả `{signal: 0, code, message}` với **HTTP status luôn 200** (không dùng chuẩn HTTP status cho lỗi) — FE (`axiosClient.ts`) tự parse field này, không dựa vào status code.
- Secret JWT lấy từ `.env` (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`), có fallback hardcode nếu thiếu env (nên bỏ fallback khi lên production thật — xem mục 8).

## 6. Danh sách endpoint chính (base `/api`, đăng ký ở `routes/index.js`)

`/khoa`, `/vitri-type`, `/checklist-item`, `/vitri-chi-tiet`, `/danh-gia`, `/khac-phuc`, `/photo-gallery`, `/lich-phan-cong`, `/anh-5s-tuan`, `/dot-danh-gia`, `/permission`, `/role`, `/exportExcel`, cộng route auth ở root (`/login`, `/register`, `/login-by-token`, `/update_profile`, `/change_password`) và quản lý user (`/api/user/get-list-user`, `update_user`, `delete_user`). Upload ảnh: `POST /api/upload/uploadImage` (gắn `isAuthAdmin`, upload thẳng lên Cloudinary từ RAM).

Quy ước đặt tên xuyên suốt: liệt kê `GET /api/{entity}/get-list-{entity}`, tạo/sửa gộp `POST /api/{entity}/create-update-{entity}` (có `id` thì sửa), xoá `POST /api/{entity}/delete-{entity}/:id`.

## 7. Bug đã tìm & đã sửa (đợt rà soát trước)

1. **Lỗ hổng phân quyền nghiêm trọng**: `check_permission` dùng `if (!list_permission && list_permission.length <= 0)` (AND sai logic) → sửa thành `||`. Đã verify bằng test Postman A/B (nhân viên bị chặn, admin được vào) trên cùng 1 endpoint.
2. Route upload ảnh không có middleware xác thực → đã thêm `isAuthAdmin`.
3. `service/user.service.js` → `updateUser`: check email trùng dùng `Op.like '%email%'` (dò lan, sai) → sửa thành so khớp chính xác `email: data.email` + `id: { [Op.ne]: data.id }`.
4. `config/auth.config.js` hardcode secret JWT → đọc từ `.env` với fallback.
5. Hàm `isAuth` chết (không bao giờ gọi `next()`, không dùng ở đâu) trong `middleware/auth.js` → đã xoá.
6. Export Excel danh sách user còn tiêu đề cũ "DỰ ÁN QUẢN LÝ BÁN HÀNG" (tàn dư dự án cũ) → đổi thành "HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG 5S - BỆNH VIỆN".

## 8. Trạng thái test

Test tay qua Postman (dùng `pm.globals.set` lưu token vì các request rời không nằm trong 1 collection): Auth, Khoa, Vitri Type, Checklist Item, Vitri Chi Tiet, Danh Gia, Khac Phuc, Photo Gallery, Lich Phan Cong, Anh 5S Tuan — CRUD + luồng nghiệp vụ chính đều pass, kể cả test phân quyền A/B. Chưa có test tự động (unit/integration).

## 9. Việc còn để ngỏ

- Bỏ fallback hardcode secret JWT trong `config/auth.config.js` trước khi deploy thật.
- `isAuthAdmin` dùng tràn lan cho route nghiệp vụ đa vai trò — nếu cần phân quyền chi tiết hơn theo hành động (vd nhân viên chỉ được xem khoa mình, trưởng khoa chỉ phân công trong khoa mình) thì phải bổ sung kiểm tra ở tầng service, hiện chưa có.
- Dọn `.git` gốc trong `hospital_server` (xoá nhánh mồ côi `server_qlcl_clean`, gỡ lock) hoặc đơn giản bỏ hẳn thư mục đó khi đã chắc `server_qlcl` là nguồn code duy nhất.
- Rà lại các comment trong code còn trỏ đường dẫn `hospital_server` (cả BE lẫn FE) cho khớp vị trí hiện tại (`server_qlcl`).
- Viết thêm test tự động (hiện chỉ test tay qua Postman).

## 10. Vấn đề kỹ thuật cần nhớ (môi trường làm việc Claude/Cowork)

- **Bug đọc file qua bash mount**: đọc file qua công cụ bash (kể cả `cat`/`wc -l`/`rsync`) đôi khi trả về nội dung **cũ/bị cắt cụt**, đặc biệt với file vừa sửa gần đây, dù `Read` tool (không qua bash) luôn chính xác. Cách khắc phục: đọc bằng `Read` tool → ghi lại bằng `Write` tool → `cp` đè vào chỗ cần trong bash nếu bắt buộc phải thao tác qua bash. Nếu debug thấy file "thiếu code" khó hiểu qua bash, nghi ngờ bug này trước.
- **Chỉ thư mục đã kết nối (`D:\My-project\Hospital`) mới đồng bộ 2 chiều với máy người dùng** — tạo file/thư mục mới phải nằm bên trong nhánh đã kết nối để người dùng thấy được.
- VS Code / Git Bash / mọi terminal đều ở tier "click" qua computer-use (không gõ phím được) — lệnh git/npm cần chạy phải nhờ người dùng gõ, hoặc dùng công cụ bash sandbox (không có credential thật của máy người dùng nên không tự push được).

## 11. Liên quan frontend

Frontend đang code cùng hệ thống là `../CMS_Dashboard_QLCL` (React + Vite + TS + Redux Toolkit) — xem `CMS_Dashboard_QLCL/CLAUDE.md`. File `PERMISSION.*` trong `CMS_Dashboard_QLCL/src/features/auth/permissions.ts` phải khớp tay với `middleware/actionDefault.js` ở đây, không tự động đồng bộ.
