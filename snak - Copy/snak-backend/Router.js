const router = require('express').Router();
const User = require('./userSchema');
const io = require("socket.io");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { find } = require('./userSchema');
require('dotenv').config()

const KEY = process.env.SECRETE_KEY


router.post('/signin',async (req, res) => {

    try {
        var emailexist = await User.findOne({ email: req.body.email });
        if (emailexist) {
            return res.status(400).json("email already exist");
        }
        //pasword encryption
        var hash = await bcrypt.hash(req.body.password, 10);
        //confirm password encryption
        var cphash = await bcrypt.hash(req.body.confirmPassword,10)

      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hash,
        confirmPassword: cphash,
      });
        const userName = user.name
        var data = await user.save()
        res.json(data);

        // var userToken =  jwt.sign(
        //   { email: req.body.email },
        //   "HeNi0IxIxJd7V1ttzfWIOb9hSzEpMgwGc6RS3xIm5wY="
        // );

        // res.send("auth", userToken).json(userToken);

    } catch (error) {
        res.sendStatus(400).res.json(error)
        return
    }
    
});

router.post('/login', async (req, res) => {
    try {
        var loginData = await User.findOne({ email: req.body.email });
        if (!loginData) {
            return res.status(400).json("email not found");
        }
        var validPassword = await bcrypt.compare(req.body.password, loginData.password)
        if (!validPassword) {
            return res.status(400).json('wrong password')
        }

        var userToken = await jwt.sign(
            { email: loginData.email },
            KEY
        );

        res.header('auth', userToken).json(userToken)

    } catch (error) {
        res.status(400).json(error);
    }
});



const validuser = (req, res, next) => {
    var token = req.header('auth');
    res.token = token;
    next();
}

router.get('/all', validuser,async(req, res)=> {
    jwt.verify(res.token, KEY, async (error) => {
        if (error) {
            res.sendStatus(400)
        } else {
            res.sendStatus(200)
        }
    });
})   ;





module.exports = router;