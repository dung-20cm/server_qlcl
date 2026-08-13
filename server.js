const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const routes = require("./routes");
require("dotenv").config();
// const db = require("./model/dbconnect");
const path = require("path");
const pathFile = require("path");
const fs = require("fs");
const multer = require("multer");
const { Readable } = require("stream");
const { ERROR_MESSAGE } = require("./config/error");
const { isAuthAdmin } = require("./middleware/auth");
const { saveResizedImage } = require("./service/localImageStorage.service");
const { buildPhotoBaseName } = require("./service/photoNaming.service");

// ============================================================================
// CLOUDINARY (ĐANG TẮT — 2026-08-12) — đã chuyển sang lưu ảnh cục bộ trên đĩa
// server (xem service/localImageStorage.service.js + route "POST
// /api/upload/uploadImage" bên dưới). GIỮ NGUYÊN đoạn dưới để dễ bật lại sau
// này, xem CLOUDINARY_README.txt để biết đúng các bước cần làm.
// ============================================================================
// const cloudinary = require("cloudinary").v2;
//
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

const app = express();

var corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));

// db.sequelize.sync();
// db.sequelize.sync({ force: false }).then(() => {
//   console.log("Drop and re-sync db.");
// });

//simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to my application" });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//config static
app.use(express.static(path.join(__dirname, "./static")));

// --- (ĐANG TẮT) Lưu ảnh vào static/uploads trên đĩa server — xem
// UPLOAD_LOCAL_STORAGE_README.txt để bật lại (ghi file tạm ra đĩa trước khi đẩy Cloudinary).
// const storage = multer.diskStorage({
//   destination: pathFile.join(
//     __dirname,
//     process.env.DIST_DIR || "",
//     "static/uploads/",
//   ),
//   filename: (req, file, cb) => {
//     let uploadedFileName;
//     fs.stat(
//       pathFile.join(
//         __dirname,
//         process.env.DIST_DIR || "",
//         `static/uploads/${file.originalname.replace(/["'()\ ]/g, "")}`,
//       ),
//       (err) => {
//         if (err === null) {
//           uploadedFileName = `${Date.now()}-${file.originalname.replace(
//             /["'()\ ]/g,
//             "",
//           )}`;
//         } else if (err.code === "ENOENT") {
//           uploadedFileName = `${Date.now()}-${file.originalname.replace(
//             /["'()\ ]/g,
//             "",
//           )}`;
//         } else {
//           // logger.info('Some other error: ', err);
//           console.log("error", err);
//         }
//
//         cb(null, uploadedFileName);
//       },
//     );
//   },
// });

// Mac dinh: giu file trong RAM (khong ghi dia) roi day thang buffer len Cloudinary --
// tiet kiem dung luong o cung server. Bat lai luu dia: xem UPLOAD_LOCAL_STORAGE_README.txt
const storage = multer.memoryStorage();

const uploadImage = multer({
  storage,
  limits: { fileSize: 52428799 },
  fileFilter: function (req, file, callback) {
    var ext = pathFile.extname(file.originalname).toLowerCase();

    if (
      ext !== ".png" &&
      ext !== ".jpg" &&
      ext !== ".svg" &&
      ext !== ".webp" &&
      ext !== ".jpeg"
    ) {
      return callback(new Error("ERR_6006"));
    }
    callback(null, true);
  },
});

// app.post("/api/upload/uploadImage", async (req, res) => {
//   try {
//     uploadImage.any()(req, null, async (err) => {
//       // const code = err.message;
//       if (err) {
//         return res.send({
//           code: 400,
//           signal: 0,
//           // errorCode: code ? code : ERROR_MESSAGE.ERROR,
//           errorCode: ERROR_MESSAGE.ERROR,
//           message: "Upload failed!",
//         });
//       }

//       if (!req.files) {
//         return res.send({
//           code: 400,
//           signal: 0,
//           errorCode: ERROR_MESSAGE.REQUIRED_PARAMS,
//           message: "Upload failed!",
//         });
//       }

//       const filePaths = {};
//       let file = req.files[0];

//       filePaths[file.fieldname] = `${process.env.API_SERVER}/uploads/${file.filename}`
//       // req.files.forEach((file) => {
//       //   filePaths[file.fieldname] = `${process.env.API_SERVER
//       //     }/uploads/${file.filename.replace(/["'()\ ]/g, "")}`;
//       // });

//       return res.status(200).send({
//         code: 200,
//         signal: 1,
//         message: "Upload success!",
//         data: { filePaths },
//       });
//     });
//   } catch (error) {
//     return res.send({
//       code: 400,
//       signal: 0,
//       message: "Error Upload!",
//     });
//   }
// });

app.post("/api/upload/uploadImage", isAuthAdmin, async (req, res) => {
  try {
    uploadImage.any()(req, null, async (err) => {
      if (err) {
        // fileFilter tra loi ERR_6006 khi sai duoi anh; multer tra code LIMIT_FILE_SIZE khi qua dung luong
        const isBadType = err.message === "ERR_6006";
        const isTooLarge = err.code === "LIMIT_FILE_SIZE";
        return res.send({
          code: 400,
          signal: 0,
          errorCode: ERROR_MESSAGE.ERROR,
          message: isBadType
            ? "Chỉ chấp nhận file ảnh định dạng .png, .jpg, .jpeg, .webp, .svg!"
            : isTooLarge
              ? "Ảnh vượt quá dung lượng cho phép (tối đa 50MB)!"
              : "Tải ảnh lên thất bại!",
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.send({
          code: 400,
          signal: 0,
          errorCode: ERROR_MESSAGE.REQUIRED_PARAMS,
          message: "Vui lòng chọn ít nhất 1 ảnh để tải lên!",
        });
      }

      const file = req.files[0]; // Lấy tệp đầu tiên (bạn có thể lặp qua tất cả các tệp nếu cần)

      // ========================================================================
      // CLOUDINARY (ĐANG TẮT) -- File chỉ nằm trong RAM (file.buffer,
      // multer.memoryStorage) rồi đẩy thẳng lên Cloudinary qua upload_stream.
      // Giữ nguyên để dễ bật lại, xem CLOUDINARY_README.txt.
      // ========================================================================
      // try {
      //   const result = await new Promise((resolve, reject) => {
      //     const uploadStream = cloudinary.uploader.upload_stream(
      //       { folder: "uploads" },
      //       (uploadError, uploadResult) => {
      //         if (uploadError) return reject(uploadError);
      //         resolve(uploadResult);
      //       },
      //     );
      //     Readable.from(file.buffer).pipe(uploadStream);
      //   });
      //   return res.status(200).send({
      //     statusCode: 200,
      //     message: "Tải ảnh lên thành công!",
      //     data: { url: result.secure_url, secure_url: result.secure_url },
      //   });
      // } catch (uploadError) {
      //   return res.status(500).send({
      //     code: 500,
      //     signal: 0,
      //     message: "Tải ảnh lên Cloudinary thất bại!",
      //     error: uploadError.message,
      //   });
      // }

      // Lưu ảnh CỤC BỘ trên server: resize cạnh dài <=1600px + nén JPEG 78%
      // (service/localImageStorage.service.js) rồi ghi ra UPLOAD_DIR (.env).
      // File chỉ nằm trong RAM (file.buffer) tới bước này, không ghi bản GỐC
      // chưa nén ra đĩa -- chỉ ghi đúng 1 bản đã xử lý.
      //
      // Đặt tên file dễ quản lý (VD "Ptchc_dungpt_12082026_anh1.jpg") nếu FE
      // gửi kèm ngữ cảnh khoa/người/ngày/thứ tự (multer .any() đưa field text
      // vào req.body cùng lúc với file) -- thiếu thì tự rơi về uuid như cũ.
      const baseName = buildPhotoBaseName({
        khoaTen: req.body.khoaTen,
        username: req.body.username,
        ngay: req.body.ngay,
        index: req.body.index,
      });

      try {
        const { relativeKey, mimeType } = await saveResizedImage(
          file.buffer,
          file.originalname,
          file.mimetype,
          baseName,
        );

        // FE (CMS_Dashboard_QLCL/src/features/qlcl/api.ts -> uploadImage()) đọc
        // data.url hoặc data.secure_url -- GIỮ ĐÚNG tên field cũ để không phải
        // sửa chỗ nào khác, chỉ đổi Ý NGHĨA giá trị: không còn là URL công khai
        // Cloudinary nữa mà là 1 KEY tương đối (VD "2026/08/12/<uuid>.jpg"),
        // dùng để tra file vật lý khi phục vụ qua GET /api/photo-gallery/image/:id
        // (route CÓ xác thực + kiểm tra khoa, KHÔNG phải link công khai).
        return res.status(200).send({
          statusCode: 200,
          message: "Tải ảnh lên thành công!",
          data: { url: relativeKey, secure_url: relativeKey, mimeType },
        });
      } catch (uploadError) {
        return res.status(500).send({
          code: 500,
          signal: 0,
          message: "Lưu ảnh lên server thất bại!",
          error: uploadError.message,
        });
      }
    });
  } catch (error) {
    return res.send({
      code: 400,
      signal: 0,
      message: "Có lỗi xảy ra khi tải ảnh lên!",
    });
  }
});

app.use(routes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
