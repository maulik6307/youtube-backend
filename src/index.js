import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(
        ` Server started on port http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((err) => {
    console.log("MONGODB connection fail !!!", err);
  });

//THIS APPROACH IS ALSO WORK
/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Error :", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listining on ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR :", error);
  }
})();

*/
