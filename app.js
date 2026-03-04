var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

// var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var settingRouter = require('./routes/setting');
var postRouter = require('./routes/post');
var uploadRouter = require('./routes/upload');

var app = express();

// 啟用 CORS
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(process.env.uploadDir == '../public/uploads' ? path.join(__dirname, '../public/uploads') : process.env.uploadDir));

// app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/setting', settingRouter);
app.use('/post', postRouter);
app.use('/upload', uploadRouter);
module.exports = app;
