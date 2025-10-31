import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app=express();
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));


app.use(express.json({limit:'16kb'}));
app.use(express.urlencoded({extended:false}));
app.use(express.static("public"));
app.use(cookieParser());

//Import routes
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import problemRouter from './routes/problem.routes.js'
import runcodeRouter from './routes/runcode.route.js'
import submissionRouter from './routes/submission.routes.js'

//Routes Declaration
app.use('/api/v1/users',userRouter);
app.use('/api/v1/tweet',tweetRouter);
app.use('/api/v1/problem',problemRouter);
app.use('/api/v1/runcode',runcodeRouter);
app.use('/api/v1/submissions',submissionRouter);

export {app}