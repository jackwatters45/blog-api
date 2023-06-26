import { Schema, model, Types, Document } from "mongoose";
import { IUser } from "./user.model";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import autopopulate from "mongoose-autopopulate";

export interface ILike {
	userId: Types.ObjectId;
	date: Date;
}
export interface IPost extends Document {
	_id: Types.ObjectId;
	title: string;
	content?: string;
	author: Types.ObjectId | IUser;
	createdAt: Date;
	updatedAt: Date;
	published: boolean;
	topic?: Types.ObjectId;
	likes: ILike[];
	comments: Types.ObjectId[];
}

const postSchema = new Schema<IPost>(
	{
		title: { type: String, required: true, trim: true, maxlength: 100 },
		content: { type: String, trim: true, maxlength: 10000 },
		author: { type: Types.ObjectId, ref: "User", required: true },
		published: { type: Boolean, required: true, default: false },
		topic: { type: Types.ObjectId, ref: "Topic" },
		likes: [
			{
				userId: { type: Types.ObjectId, ref: "User" },
				date: { type: Date, default: Date.now },
			},
		],
		comments: [{ type: Types.ObjectId, ref: "Comment", autopopulate: true }],
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
	topic: "text",
});

export default model<IPost>("Post", postSchema);
