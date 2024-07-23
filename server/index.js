const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const connectDB = require('./config/database');
const connectCloudinary = require('./config/cloudinary');
const helmet = require("helmet");
const morgan = require("morgan");
const passport = require("passport");
const session = require("express-session");
const flash = require("express-flash");
const { initializePassport } = require('./config/passport');
const http = require('http');
const { Server } = require('socket.io');
const errorMiddleware = require('./middlewares/error');
const path = require("path");
const { StatusCodes } = require("http-status-codes");

// Configuration
dotenv.config();


// Database connection
connectDB();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true } // Ensure secure cookies in production
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(helmet());

// Customize CSP to allow images from specific domains
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com"],
            imgSrc: ["'self'", "data:", "https://img.youtube.com", "https://res.cloudinary.com", "https://rukminim1.flixcart.com"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://api.razorpay.com"],
            connectSrc: ["'self'", "https://lumberjack-cx.razorpay.com"]
        },
    })
);






// app.use(morgan("combined"));
app.use(flash());

// Initialize passport
initializePassport(passport);

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp",
    })
);

// Cloudinary connection
connectCloudinary();

// Importing routes
const auth = require("./routes/Auth");
const admin = require("./routes/Admin");
const customer = require("./routes/Customer");
const common = require("./routes/Common");
const paymentAndOrders = require("./routes/PaymentAndOrders");
const { ErrorResponse } = require('./middlewares/error');

app.use("/api/v1", auth);
app.use("/api/v1", admin);
app.use("/api/v1", customer);
app.use("/api/v1", common);
app.use("/api/v1", paymentAndOrders);

const NODE_ENV = "production";


// Serve frontend
if (NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
  
    app.get("*", (req, res) =>
        res.sendFile(
            path.resolve(__dirname, "../", "frontend", "dist", "index.html")
        )
    );
} else {
    app.get("/", (req, res) => res.send("Please set to production"));
}

app.use("*", (req, res, next) => {
    throw new ErrorResponse("Not found", StatusCodes.NOT_FOUND);
});

// Creating server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connect', (socket) => { // Change 'connection' to 'connect'
    console.log('New client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.set('io', io);

// Error middleware
app.use(errorMiddleware);

server.listen(process.env.PORT, () => {
    console.log(`Server is running on PORT: ${process.env.PORT}`);
});
