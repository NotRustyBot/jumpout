import express from "express";
import cors from "cors";

export function startContentServer() {

    const app = express();
    app.use(express.static('../client/static'))
    app.use(cors());

    app.listen(80);
    console.log("serving content");
}

