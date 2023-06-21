"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const configDb = async () => {
    try {
        mongoose_1.default.set("strictQuery", false);
        const mongoDB = process.env.MONGODB_URI;
        if (!mongoDB)
            throw new Error("MONGODB_URI is not defined");
        await mongoose_1.default.connect(mongoDB);
    }
    catch (err) {
        console.log(err);
    }
};
exports.default = configDb;
//# sourceMappingURL=database.js.map