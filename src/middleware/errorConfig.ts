import { Request, Response, ErrorRequestHandler, Application } from "express";
import createError from "http-errors";

const configErrorMiddleware = (app: Application) => {
	// catch 404 and forward to error handler
	app.use((req, _res, next) => {
		next(createError(404));
	});

	// Custom Error interface
	interface CustomError extends Error {
		status?: number;
	}

	// Error handler
	const errorHandler: ErrorRequestHandler = (
		err: CustomError,
		req: Request,
		res: Response,
	) => {
		// set locals, only providing error in development
		res.locals.message = err.message ?? "Internal Server Error";
		res.locals.error = req.app.get("env") === "development" ? err : {};

		// render the error page
		res.status(err.status || 500);
		res.send(err.message);
	};

	app.use(errorHandler);
};

export default configErrorMiddleware;
