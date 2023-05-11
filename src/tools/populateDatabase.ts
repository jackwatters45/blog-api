import dotenv from "dotenv";
import User, { IUser } from "../models/user";
import Post, { IPost } from "../models/post";
import Comment, { IComment } from "../models/comment";
import configDb from "../config/database";

dotenv.config();

configDb();

const sampleUsers: Partial<IUser>[] = [
	{
		firstName: "John",
		lastName: "Watters",
		email: "john@example.com",
		password: "password",
		userType: "admin",
	},
	{
		firstName: "Jane",
		lastName: "Doe",
		email: "jane@example.com",
		password: "password",
	},
	{
		firstName: "Alice",
		lastName: "Johnson",
		email: "alice@example.com",
		password: "password",
	},
	{
		firstName: "Bob",
		lastName: "Smith",
		email: "bob@example.com",
		password: "password",
	},
];

const samplePosts: Partial<IPost>[] = [
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

const sampleComments: Partial<IComment>[] = [
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

async function populateDbOld() {
	try {
		await User.deleteMany({});
		await Post.deleteMany({});
		await Comment.deleteMany({});

		const users = sampleUsers.map(async (userData) => {
			const user = new User(userData);
			await user.save();
			return user;
		});

		const comments = sampleComments.map(async (commentData, index) => {
			const comment = new Comment({ ...commentData, author: users[index] });
			await comment.save();
			return comment;
		});

		const posts = samplePosts.map(async (postData, index) => {
			const post = new Post({
				...postData,
				author: users[index],
				comments: [comments[index]],
			});
			await post.save();
			return post;
		});

		console.log("Created users: ", users);
		console.log("Created comments: ", comments);
		console.log("Created posts: ", posts);

		console.log("Database populated successfully.");
		process.exit(0);
	} catch (error) {
		console.error("Error populating the database: ", error);
		process.exit(1);
	}
}

// populateDbOld();

async function populateDb() {
	try {
		await User.deleteMany({});
		await Post.deleteMany({});
		await Comment.deleteMany({});

		const createdUsers = await Promise.all(
			sampleUsers.map(async (userData) => {
				const user = new User(userData);
				await user.save();
				return user;
			}),
		);

		const createdComments = await Promise.all(
			sampleComments.map(async (commentData, index) => {
				const comment = new Comment({
					...commentData,
					author: createdUsers[index % createdUsers.length]._id,
				});
				await comment.save();
				return comment;
			}),
		);

		const createdPosts = await Promise.all(
			samplePosts.map(async (postData, index) => {
				const post = new Post({
					...postData,
					author: createdUsers[index % createdUsers.length]._id,
					comments: [createdComments[index % createdComments.length]._id],
				});
				await post.save();
				return post;
			}),
		);

		console.log("Created users: ", createdUsers);
		console.log("Created comments: ", createdComments);
		console.log("Created posts: ", createdPosts);

		console.log("Database populated successfully.");
		process.exit(0);
	} catch (error) {
		console.error("Error populating the database: ", error);
		process.exit(1);
	}
}

populateDb();

// Path: src/tools/populateDatabase.ts
