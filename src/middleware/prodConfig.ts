import { Application } from "express";
import helmet from "helmet";
import RateLimit from "express-rate-limit";
import compression from "compression";

const configProdMiddleware = (app: Application) => {
	app.use(compression()); // Compress all routes
	// Add helmet to the middleware chain.
	// Set CSP headers to allow our Bootstrap and Jquery to be served
	app.use(
		helmet.contentSecurityPolicy({
			directives: {
				"script-src": ["self", "code.jquery.com", "cdn.jsdelivr.net"],
				"img-src": ["'self'", "https: data: blob:"],
			},
		}),
	);

	// Set up rate limiter: maximum of twenty requests per minute
	const limiter = RateLimit({
		windowMs: 1 * 60 * 1000, // 1 minute
		max: 20,
	});
	// Apply rate limiter to all requests
	app.use(limiter);
};

export default configProdMiddleware;
