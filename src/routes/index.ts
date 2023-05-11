import type { Application } from "express";
import comment from "./comment";
import post from "./post";
import user from "./user";

const configRoutes = (app: Application) => {
	app.use("/users", user);
	app.use("/posts", post);
	app.use("/comments", comment);

	app.use("/", (req, res) => {
		res.json(req.query);
	});
};

export default configRoutes;

// app.get('/api/posts', async (req, res) => {
//   const userId = req.query.userId;

//   if (!userId) {
//     return res.status(400).send('Missing userId query parameter');
//   }

//   // Fetch posts from your database
//   const posts = await getPostsByUserId(userId);

//   res.json(posts);
// });

// add index route with api/v1 !!!!!!!!!
