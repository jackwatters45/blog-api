import { Schema, model, Types, Document } from "mongoose";
import { IUser } from "./user.model";

export interface ILike {
	userId: Types.ObjectId;
	date: Date;
}
export interface IPost extends Document {
	_id: Types.ObjectId;
	title: string;
	content: string;
	author: Types.ObjectId | IUser;
	createdAt: Date;
	updatedAt: Date;
	published: boolean;
	topic?: Types.ObjectId;
	tags?: string[];
	likes: ILike[];
	comments: Types.ObjectId[];
}

const postSchema = new Schema<IPost>(
	{
		title: { type: String, required: true, trim: true, maxlength: 100 },
		content: { type: String, required: true, trim: true, minlength: 500 },
		author: { type: Types.ObjectId, ref: "User", required: true },
		published: { type: Boolean, required: true, default: false },
		topic: { type: Types.ObjectId, ref: "Topic" },
		tags: [{ type: String, trim: true }],
		likes: [
			{
				userId: { type: Types.ObjectId, ref: "User" },
				date: { type: Date, default: Date.now },
			},
		],
		comments: [{ type: Types.ObjectId, ref: "Comment" }],
	},
	{ timestamps: true },
);

// set default array
postSchema.path("likes").default([]);
postSchema.path("comments").default([]);

const toHyphenCase = (str: string) => {
	return str
		.split(" ")
		.map((word) => word.toLowerCase())
		.join("-");
};

postSchema.virtual("url").get(function (this: IPost) {
	return `https://.blogName.com/posts/${toHyphenCase(this.title)}`;
});

postSchema.index({
	title: "text",
	content: "text",
	author: "text",
	tags: "text",
});

export default model<IPost>("Post", postSchema);
