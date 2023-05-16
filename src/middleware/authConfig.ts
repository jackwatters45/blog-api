import passport from "passport";
import passportLocal from "passport-local";
import passportJwt from "passport-jwt";
import { Request, Response, NextFunction, Application } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import session from "express-session";

const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy;

const cookieExtractor = (req: Request): string | null => {
	let token = null;
	if (req && req.cookies) {
		token = req.cookies["jwt"];
	}
	return token;
};

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

	passport.use(
		new JwtStrategy(
			{
				jwtFromRequest: cookieExtractor,
				secretOrKey: process.env.JWT_SECRET as string,
			},
			async (jwtPayload, done) => {
				try {
					const user = await User.findById(jwtPayload.id);
					if (user) return done(null, user);
					return done(null, false, { message: "User not found" });
				} catch (err) {
					return done(err);
				}
			},
		),
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
			cookie: { maxAge: 1000 * 60 * 60, secure: true, sameSite: "none" },
		}),
	);

	app.use(passport.initialize());
	app.use(passport.session());
};

export default configPassport;
