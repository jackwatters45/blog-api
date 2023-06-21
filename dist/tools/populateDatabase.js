"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = __importDefault(require("../models/user.model"));
const post_model_1 = __importDefault(require("../models/post.model"));
const comment_model_1 = __importDefault(require("../models/comment.model"));
const database_1 = __importDefault(require("../config/database"));
dotenv_1.default.config();
(0, database_1.default)();
const sampleUsers = [
    {
        firstName: "John",
        lastName: "Watters",
        email: "john@example.com",
        username: "johnwatters",
        password: "password",
        userType: "admin",
    },
    {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        username: "janedoe",
        password: "password",
    },
    {
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
        username: "alicejohnson",
        password: "password",
    },
    {
        firstName: "Bob",
        lastName: "Smith",
        email: "bob@example.com",
        username: "bobsmith",
        password: "password",
    },
];
const samplePosts = [
    {
        title: "Sample Post 1",
        content: "This is a sample post.",
    },
    {
        title: "Sample Post 2",
        content: "This is another sample post.",
    },
    {
        title: "Sample Post 3",
        content: "This is a third sample post.",
    },
    {
        title: "Sample Post 4",
        content: "This is a fourth sample post.",
    },
];
const sampleComments = [
    {
        content: "Sample comment 1",
    },
    {
        content: "Sample comment 2",
    },
    {
        content: "Sample comment 3",
    },
    {
        content: "Sample comment 4",
    },
];
async function populateDb() {
    try {
        await user_model_1.default.deleteMany({});
        await post_model_1.default.deleteMany({});
        await comment_model_1.default.deleteMany({});
        const createdUsers = await Promise.all(sampleUsers.map(async (userData) => {
            const user = new user_model_1.default(userData);
            await user.save();
            return user;
        }));
        const createdComments = await Promise.all(sampleComments.map(async (commentData, index) => {
            const comment = new comment_model_1.default({
                ...commentData,
                author: createdUsers[index % createdUsers.length]._id,
            });
            await comment.save();
            return comment;
        }));
        const createdPosts = await Promise.all(samplePosts.map(async (postData, index) => {
            const post = new post_model_1.default({
                ...postData,
                author: createdUsers[index % createdUsers.length]._id,
                comments: [createdComments[index % createdComments.length]._id],
            });
            await post.save();
            return post;
        }));
        console.log("Created users: ", createdUsers);
        console.log("Created comments: ", createdComments);
        console.log("Created posts: ", createdPosts);
        console.log("Database populated successfully.");
        process.exit(0);
    }
    catch (error) {
        console.error("Error populating the database: ", error);
        process.exit(1);
    }
}
populateDb();
//# sourceMappingURL=populateDatabase.js.map