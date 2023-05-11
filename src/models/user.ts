import { Schema, model, Types, Document } from "mongoose";

export interface IUser extends Document {
	_id: Types.ObjectId;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	password: string;
	createdAt: Date;
	updatedAt: Date;
	userType: string;
	posts?: Types.Array<Types.ObjectId>;
	comments?: Types.Array<Types.ObjectId>;
}

const userSchema = new Schema<IUser>(
	{
		firstName: { type: String, required: true, trim: true, maxlength: 25 },
		lastName: { type: String, required: true, trim: true, maxlength: 25 },
		email: { type: String, required: true, trim: true, unique: true },
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

export default model<IUser>("User", userSchema);
