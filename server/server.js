const express = require("express");
const app = express();
const path = require('path');
const routes = require("./routes")(express);

const serveConfig = configName => {
    return (req, res) => {
        res.sendFile(__dirname + "/config/" + configName);
    };
};
var serveMap = function (req, res) {
    res.sendFile(path.join(path.resolve('./public'), 'map.html'));
}
app.get('/map', serveMap);


app.use("/", routes);

app.use('/', express.static(path.resolve('./public')));
app.get("/index/config/online", serveConfig("fmonline.json"));

app.get('/map/config/ui', serveConfig('fmui.json'));
app.get('/map/config/online', serveConfig('fmonline.json'));
app.get('/map/config/tasks', serveConfig('tasks.json'));







app.listen(3000, () => console.log("Listening on port 3000!\n"));