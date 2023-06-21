"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const readableStream = stream_1.Readable.from(buffer);
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
            if (error || !result)
                reject(error);
            else
                resolve(result.secure_url);
        });
        readableStream.pipe(uploadStream);
    });
};
exports.default = uploadToCloudinary;
//# sourceMappingURL=uploadToCloudinary.js.map