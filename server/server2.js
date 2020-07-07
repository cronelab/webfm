import express from "express";
import compression from "compression";
import routes from "./routes.js";
const app = express();
app.use(compression());
app.use(express.json());
import path from "path";
let __dirname = path.resolve(path.dirname(""));

const PORT = 8090

app.use("/", routes(express));

app.use(express.static(path.resolve(__dirname, "dist")));

app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname,'dist','index.html'));
});

app.listen(PORT, () => console.log(`Serving on port ${PORT}`));
