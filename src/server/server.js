import express from "express";
import dotenv from "dotenv";
import handlebars from "express-handlebars";
import { connectDB } from "./mongo/mongo.js";
import { config } from "../config/config.js";
import __dirname from "../dirname.js";
import bodyParser from "body-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import auth from "../utils/auth.js";
import sessionRouter from "../users/routes/sessions.routes.js";
import passport from "passport";
import cookieParser from "cookie-parser";
import initializePassport from "../config/passport.config.js";
import productsRouter from "../products/router/products.routes.js";
import cartsRouter from "../carts/router/carts.routes.js";
import { Server } from "socket.io";
import socket from "./socket.js";
import chatRouter from "../messages/routes/messages.router.js";

import { viewsRouter } from "../routes/index.js";

import authRouter from "../users/routes/users.routes.js";

const app = express();

//mongo connect
connectDB();

//public folder config and middlewares
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: config.mongoose_uri,
      dbName: "ecommerce",
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      ttl: 200, // tiempo de visa de la sesión
    }),
    secret: config.client_secret,
    resave: true,
    saveUninitialized: true,
  })
);

//handlebars config
app.engine("handlebars", handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

initializePassport();
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use("/", authRouter);
// app.use("/home", auth, viewsRouter);
app.use("/", viewsRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/chat", chatRouter);
app.use("/create", productsRouter);

//server
const httpServer = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}!`);
});

//socket
const io = new Server(httpServer);
socket(io);
