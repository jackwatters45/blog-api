import { Schema, model, Types, Document } from "mongoose";
import { IPost } from "./post.model";
import { IComment } from "./comment.model";

export interface IUser extends Document {
	_id: Types.ObjectId;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	username: string;
	url: string;
	password: string;
	createdAt: Date;
	updatedAt: Date;
	userType: string;
	posts?: Types.Array<Types.ObjectId | IPost>;
	comments?: Types.Array<Types.ObjectId | IComment>;
}

const userSchema = new Schema<IUser>(
	{
		firstName: { type: String, required: true, trim: true, maxlength: 25 },
		lastName: { type: String, required: true, trim: true, maxlength: 25 },
		email: { type: String, required: true, trim: true, unique: true },
		username: { type: String, required: true, trim: true, unique: true },
		password: { type: String, required: true, trim: true, minlength: 8 },
		userType: { type: String, required: true, trim: true, default: "user" },
		posts: [{ type: Types.ObjectId, ref: "Post" }],
		comments: [{ type: Types.ObjectId, ref: "Comment" }],
	},
	{ timestamps: true },
);

userSchema.virtual("fullName").get(function (this: IUser) {
	return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("url").get(function (this: IUser) {
	return `https://.blogName.com/users/${this.username}`;
});

export default model<IUser>("User", userSchema);
