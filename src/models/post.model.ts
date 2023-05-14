import { Schema, model, Types, Document } from "mongoose";
import { IUser } from "./user.model";

export interface IPost extends Document {
	_id: Types.ObjectId;
	title: string;
	content: string;
	author: Types.ObjectId | IUser;
	createdAt: Date;
	updatedAt: Date;
	published: boolean;
	tags?: string[];
	likes?: Types.DocumentArray<Types.ObjectId | IUser>;
}

const postSchema = new Schema<IPost>(
	{
		title: { type: String, required: true, trim: true, maxlength: 100 },
		content: { type: String, required: true, trim: true },
		author: { type: Types.ObjectId, ref: "User", required: true },
		published: { type: Boolean, required: true, default: false },
		tags: [{ type: String, trim: true }],
		likes: [{ type: Types.ObjectId, ref: "User" }],
	},
	{ timestamps: true },
);

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
