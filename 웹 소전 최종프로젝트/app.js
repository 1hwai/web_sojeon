const express = require("express");
const app = express();
const router = require("./route/router");
const port = 8080;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({extended : false}));

app.use('/img', express.static(__dirname + '/img'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));

app.use('/', router);

app.listen(port, ()=> {
    console.log(`Start listening on ${port}`);
})