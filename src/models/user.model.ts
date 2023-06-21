import { Schema, model, Types, Document } from "mongoose";
// import bcrypt from "bcryptjs";

interface DeletedData {
	deletedBy: Types.ObjectId | null;
	deletedAt: Date;
	email: string;
	username: string;
	followerCount: number;
}
export interface IUser extends Document {
	_id: Types.ObjectId;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	username: string;
	password: string;
	createdAt: Date;
	updatedAt: Date;
	userType: string;
	followers: Types.ObjectId[];
	following: Types.ObjectId[];
	isDeleted: boolean;
	savedPosts: Types.ObjectId[];
	description: string;
	avatarUrl: string;
	deletedData?: DeletedData;
}

const UserSchema = new Schema<IUser>(
	{
		firstName: { type: String, required: true, trim: true, maxlength: 25 },
		lastName: { type: String, required: true, trim: true, maxlength: 25 },
		email: { type: String, required: true, trim: true, unique: true },
		username: { type: String, required: true, trim: true, unique: true },
		password: { type: String, required: true, trim: true, minlength: 8 },
		userType: {
			type: String,
			required: true,
			trim: true,
			default: "user",
			enum: ["user", "admin"],
		},
		followers: [{ type: Types.ObjectId, ref: "User", default: [] }],
		following: [{ type: Types.ObjectId, ref: "User", default: [] }],
		isDeleted: { type: Boolean, default: false },
		description: { type: String, trim: true, default: "" },
		avatarUrl: { type: String, trim: true, default: "" },
		savedPosts: [{ type: Types.ObjectId, ref: "Post", default: [] }],
		deletedData: {
			deletedBy: { type: Types.ObjectId, ref: "User" },
			deletedAt: { type: Date },
			email: { type: String, trim: true },
			username: { type: String, trim: true },
			followerCount: { type: Number },
		},
	},
	{ timestamps: true },
);

UserSchema.virtual("fullName").get(function (this: IUser) {
	return `${this.firstName} ${this.lastName}`;
});

// TODO
// UserSchema.pre("save", function (next) {
// 	if (this.isModified("password") || this.isNew) {
// 		this.password = bcrypt.hashSync(this.password, 10);
// 	}
// 	next();
// });

// UserSchema.methods.comparePassword = function (password: string) {
// 	return bcrypt.compareSync(password, this.password);
// };

UserSchema.index({
	firstName: "text",
	lastName: "text",
	email: "text",
	username: "text",
});

export default model<IUser>("User", UserSchema);
