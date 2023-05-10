import passport from "passport";
import passportLocal from "passport-local";
import { Request, Response, NextFunction, Application } from "express";
import User from "../models/user";
import bcrypt from "bcryptjs";
import session from "express-session";

const LocalStrategy = passportLocal.Strategy;

const configPassport = (app: Application) => {
	passport.use(
		new LocalStrategy(async (username, password, done) => {
			try {
				const user = await User.findOne({ email: username }).exec();
				if (!user) return done(null, false, { message: "Incorrect email" });

				const match = await bcrypt.compare(password, user.password);

				if (match) return done(null, user);
				return done(null, false, { message: "Incorrect password" });
			} catch (err) {
				return done(err);
			}
		}),
	);

	interface UserWithId {
		id?: number;
	}

	passport.serializeUser((user: UserWithId, done) => {
		done(null, user.id);
	});

	passport.deserializeUser(async function (id, done) {
		try {
			const user = await User.findById(id);
			done(null, user);
		} catch (err) {
			done(err);
		}
	});

	app.use(function (req: Request, res: Response, next: NextFunction) {
		res.locals.currentUser = req.user;
		next();
	});

	app.use(
		session({
			secret: process.env.SESSION_SECRET as string,
			resave: false,
			saveUninitialized: true,
			cookie: { maxAge: 1000 * 60 * 60 },
		}),
	);

	app.use(passport.initialize());
	app.use(passport.session());
};

export default configPassport;
