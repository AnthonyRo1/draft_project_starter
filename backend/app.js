// Node Modules 
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');



// Local Modules 
const {environment} = require('./config');
const isProduction = environment === 'production';
const routes = require("./routes");
const { ValidationError } = require('sequelize');


// Middleware 
const app = express();
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());



// Security Middleware to enable cors only development 
if (!isProduction) {
  app.use(cors());
}

// helmet helps a variety of headers to better secure your app
app.use(
  helmet.crossOriginResourcePolicy({
    policy: "cross-origin"
  })
);

// Set the _csrfToken and create req.csrfToken method
app.use(
  csurf({
    cookie: {
      secure: isProduction,
      sameSite: isProduction && "Lax",
      httpOnly: true
    }
  })
)


app.use(routes);

// Catch unhandled requests and forward to error handler
// (resource-not-found middleware)
app.use((_req, _res, next) => {
  const err = new Error("The requested resource couldn't be found.");
  err.title = "Resource Not Found";
  err.errors = ["The requested resource couldn't be found"];
  err.status = 404;
  next(err);
});



// Process sequelize errors 

// If the error that caused this error-handler to be called is an instance of ValidationError from sequelize package, then the error was created from a Sequelize database validation error and the additional keys of [title] string and [errors] array will be added to the error and passed into the next error handling middleware. 
app.use((err, _req, _res, next) => {
  if (err instanceof ValidationError) {
    err.errors = err.errors.map((e) => e.message);
    err.title = 'Validation error';
  }
  next(err);
})



// Error Formatter Error-Handler 
// This error handler is for formatting all the errors before returning a JSON response. It will include the error message, the errors array, and the error stack trace (if the environment is in development) with the status code of the error message. 

app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  console.error(err);
  res.json({
    title: err.title || 'Server Error',
    message: err.message,
    errors: err.errors,
    stack: isProduction ? null : err.stack
  });
});
module.exports = app;