const express = require('express');

const app = express();

app.use(express.static('public'));

const port = 8000;

app.listen(port);
console.log(`Listening on port ${port}`)