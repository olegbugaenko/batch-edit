const express = require('express');
const dotenv = require('dotenv').config();
require('module-alias/register');
const routes = require('@routes');

const app = express();
app.use(express.json());
routes(app);
app.listen(process.env.PORT || 80);
