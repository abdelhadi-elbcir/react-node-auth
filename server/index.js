import express from "express";
import mysql from "mysql";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
const salt = 10;
const app = express();

app.use(express.json());

app.use(cors({
    origin: ["http://127.0.0.1:5173"] , 
    methods:["POST", "GET"],
    credentials : true
}));

app.use(cookieParser());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "auth"
});


const verifyUser = (req,res,next)=>{
    const token = req.cookies.token;
    if(!token){
       return res.json({Error : 'You are not authenticated'});
    }else{
        jwt.verify(token , "jwt-secret-key" , (err,decoded)=>{
            if(err){
                return res.json({Error : 'You are not authenticated'});
            }else{
                req.name = decoded.name ; 
                next();
            }
        })
    }
}

app.get('/' , verifyUser ,(req , res)=>{
   return res.json({Status : "Success" , name:req.name});
});

app.post('/register', (req, res) => {
    const query = "INSERT INTO `user`(`name`, `email`, `password`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
        if (err) return res.json({ Error: "Error for hashing password" });
        const user = [
            req.body.name,
            req.body.email,
            hash
        ];

        db.query(query, [user], (err, result) => {
            if (err) return res.json({ Error: "Error for hashing password" });
            return res.json({ Status: "Success" });
        });
    })
});

app.post('/login', (req, res) => {
    const query = "SELECT * FROM user WHERE email = ?";
    db.query(query, [req.body.email], (err, data) => {
        if (err) return res.json({ Error: "Login error in server" });
        if (data.length > 0) {
            bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
                if (err) return res.json({ Error: "Password compare error" });
                if (response) {
                    const name = data[0].name;
                    const token = jwt.sign({ name }, "jwt-secret-key", { expiresIn: '1d' });
                    res.cookie('token',token , {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                      });
                    return res.json({ Status: "Success" });
                } else {
                    return res.json({ Error: "Password not matched" });
                }
            })
        } else {
            return res.json({ Error: "No email existed" });
        }
    })
})


app.get('/logout' , (req , res)=>{
    res.clearCookie('token'); 
    return res.json({ Status: "Success" });
})

app.listen(8081, () => {
    console.log('Running on port 8081');
});

