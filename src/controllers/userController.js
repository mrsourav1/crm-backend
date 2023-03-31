
const { isValidRequest, isValidEmail, isValidPwd, isValidPhone, isValidName } = require('../utills/validation')
const Users = require('../models/userModel');
const Admin = require('../models/adminModel')
const bcrypt = require('bcrypt');
const cookie = require('cookie');
const generateToken = require("../utills/generateToken")
const Leads = require("../models/leadsModel")
const EmployeeId = require("../models/userNameModel")
const nodemailer = require("nodemailer");
const { reset } = require('nodemon');
// register Users
const userRegister = async (req, res) => {
    try {

        const employeeId = await Users.find().count()

        const newUser = req.body
        console.log("req.body", newUser);
        let { userName, name, email, mobile, password } = newUser
        if (!name || !email || !mobile || !password || !isValidRequest(newUser)) {
            return res.status(400).send({ status: false, Message: "All fields are required" })
        }
        const isUsed = await Users.findOne({ email: email })
        const alreadyUsedEmployeeId = await Users.findOne({ "userName": newUser.userName })
        const validEmployeeId = await EmployeeId.findOne({ "userName": newUser.userName })
        if (alreadyUsedEmployeeId) {
            return res.status(409).send({ status: false, Message: "This EmployeeId Already Used" })
        }
        if (!validEmployeeId) {
            return res.status(409).send({ status: false, Message: "This EmployeeId not valid" })
        }
        if (isUsed) {
            return res.status(409).send({ status: false, Message: "This email is already used" })
        }
        if (!isValidName(name)) {
            return res.status(400).send({ status: false, Message: `Invalid name ${name}` })
        }
        else if (!isValidPhone(mobile)) {
            return res.status(400).send({ status: false, Message: `Invalid mobile number ${mobile}` })
        }
        else if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, Message: `Invalid email ${email}` })
        } else if (!isValidPwd(password)) {
            return res.status(400).send({ status: false, Message: "Password should be 4 digit pin" })
        }
        password = await bcrypt.hashSync(newUser.password, 10)
        const savedUser = new Users({
            employeeId: employeeId + 1,
            userName: newUser.userName,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile,
            password: password
        })
        await savedUser.save()
        res.status(201).send({ status: true, Message: savedUser })

    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
};


// login employee

const userLogin = async (req, res) => {
    try {
        const registeredUser = req.body
        const { email, password } = registeredUser
        if (!email || !password) {
            return res.status(400).send({ status: false, message: "Email and Password is required" })
        }
        const isValidUser = await Users.findOne({ email: email })
        if (!isValidUser) {
            res.status(403).send({ status: false, message: "Invalid email or password" })
        }
        const validateUser = await bcrypt.compare(password, isValidUser.password);
        if (!validateUser) {
            return res
                .status(401)
                .send({ status: false, message: "Incorrect password" });
        } else {
            res.status(200).json({
                status: true, message:
                {
                    _id: isValidUser._id,
                    employeeId: isValidUser.employeeId,
                    name: isValidUser.name,
                    email: isValidUser.email,
                    mobile: isValidUser.mobile,
                    token: generateToken(isValidUser._id)
                }

            })

        }

    } catch (err) {
        console.log(err)
    }
}


// sendind opt through email
const codeSend = async (req, res) => {
    try {
        if (req.body.email == "" || req.body == undefined || req.body.email == undefined) {
            return res.status(400).send({ status: false, message: "Please fill the input box" })
        }
        const user = await Users.findOne({ "email": req.body.email })
        if (!user) {
            return res.status(400).send({ status: false, message: "Invalid Email" })

        }
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "pspkbabul@gmail.com",
                pass: "oibjumbrbeyjdqrc"
            }
        });
        let otpnum = Math.floor(Math.random() * 90000) + 10000;
        let addotp = await Users.findOneAndUpdate({ "email": req.body.email }, { $set: { otp: otpnum } })

        var mailOptions = {
            from: "pspkbabul@gmail.com",
            to: `${req.body.email}`,
            subject: `Sending Email by user `,
            text: `
Hello Sir/Madam
        
               Need to reset your password?
               Use your secret code!

               ${otpnum}
               copy the code and paste it there for re-set paswword
               If you did not forget your password, you can ignore this email.

        `
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }

        });
        const token = generateToken(user._id)
        res.status(200).json({ status: true, message: token })

    } catch (err) {
        res.status(500).json({ status: false, message: err })
    }
}

// varify otp of email and database



const varifyOtp = async (req, res) => {
    const varifyOtp = await Users.findOne({ "_id": req.user._id })

    if (!varifyOtp) {
        res.status(400).json({ status: false, message: "Time Limit Expiry" })
    }
    try {
        if (varifyOtp.otp == req.body.otp) {
            res.status(200).json({ status: true, message: "Success" })
        } else {
            res.status(400).json({ status: false, message: "Put valid OTP" })

        }
    } catch (error) {
        res.json(error)
    }
}

// reset password
const resetPassword = async (req, res) => {

    try {
        if (req.body.password == "" || req.body == undefined || req.body.password == undefined) {
            return res.status(400).send({ status: false, message: "Please fill the input box" })
        }
        else if (!isValidPwd(req.body.password)) {
            return res.status(400).send({ status: false, message: "Password should be 4 digit pin" })
        } else {
            let hashPass = await bcrypt.hashSync(req.body.password, 10)
            await Users.findByIdAndUpdate({ "_id": req.user._id }, { $set: { "password": hashPass } })
            res.status(200).json({ status: true, message: "Successful reset password" })
        }
    } catch (error) {
        res.status(400).json({ status: false, message: error })
    }
}



// getting own profile
const myProfile = async (req, res) => {
    try {
        let response = await Users.findOne({ "_id": req.user._id })
        res.status(200).json({
            employeeID: response.employeeId,
            name: response.name,
            email: response.email,
            mobile: response.mobile,
        })
    } catch (error) {
        res.status(500).json(error)
    }
}



const employeeLeads = async (req, res) => {
    try {
        let arr = []
        let responce = await Leads.find({ "userName": req.user.userName, "status": req.params.status, 'isDeleted': false }).select({ "tasks": 1 })
        responce.map((item) => {
            // arr.push(...item.tasks)
            arr.push(...item.tasks)
        })
        res.json(arr)
    } catch (error) {
        res.status(500).json(error)
    }
}


// lead count
const leadCount = async (req, res) => {
    try {
        let responce = await Leads.find({ "userName": req.user.userName, isDeleted: "false" })
        console.log(responce)
        let Allocated = responce.filter((item) => item.status == "Allocated")
        let Pending = responce.filter((item) => item.status == "Pending")
        let Complete = responce.filter((item) => item.status == "Completed")
        let NotIntersted = responce.filter((item) => item.status == "Not Intrested")
        let count = {

            Allocated: Allocated.length,
            Complete: Complete.length,
            Pending: Pending.length,
            NotInterested: NotIntersted.length,
        }
        res.status(200).json(count)
    } catch (error) {
        res.status(400).json("Not valid")
    }
}

// single leads of employee
const singleLead = async (req, res) => {
    if (req.body.email == "") {
        res.status(500).json("Please give lead email")
    }
    try {
        let response = await Leads.findOne({ "tasks.email": req.body.email, "userName": req.user.userName })
        // console.log(response.tasks[0].name)
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json(error)
    }
}

//accept leads status allocated change to pending

const acceptLead = async (req, res) => {
    try {
        let responce = await Leads.updateMany({ "userName": req.user.userName, "status": "Allocated" }, { $set: { "status": "Pending" } })
        res.json(responce)
    } catch (error) {
        res.json(err)
    }

}

//update status by employee pending
const statusUpdate = async (req, res) => {
    console.log(req.body)
    try {
        // if (req.body.email == undefined || req.body.email == "" || req.body.status == undefined || req.body.status == "") {
        //     return res.status(500).json({
        //         status: false,
        //         message: "Invalid Email Id"
        //     })
        // }
        // console.log(req.body.email,req.body.status)
        let responce = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName, status: "Pending" }, { $set: { "status": req.body.status } })
        console.log(responce)
        if (!responce.modifiedCount == 1) {
            res.json({
                status: false,
                message: "Invalid Email Id"
            })
        } else {
            res.status(200).json({
                status: true,
                message: "Update successfully"
            })
        }
    } catch (err) {
        res.status(500).json({ status: false, message: err })
    }
}


//update work by employee pending
const workUpdate = async (req, res) => {

    try {
        if (req.body.email == undefined || req.body.email == "" || req.body.work == undefined || req.body.work == "") {
            return res.status(500).json({ status: false, message: "Please  give valid lead email and update work" })
        }
        let response = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName }, { $set: { "work": req.body.work } })
        if (!response.modifiedCount == 1) {
            res.status(400).json({ status: false, message: "Put valid input" })
        } else {
            res.status(200).json({ status: true, message: "Updated successful" })
        }
    } catch (err) {
        res.status(500).json({ status: false, message: err })
    }
}
//label update
const labelUpdate = async (req, res) => {

    try {
        if (req.body.email == undefined || req.body.email == "" || req.body.label == undefined || req.body.label == "") {
            return res.status(500).json("Please  give valid lead email and update label")
        }
        let response = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName }, { $set: { "label": req.body.label } })
        if (!response.modifiedCount == 1) {
            res.json("put valid input")
        } else {
            res.status(200).json("Updated successful")
        }
    } catch (err) {
        res.status(500).json(err)
    }
}
//reminder update
const reminderUpdate = async (req, res) => {

    try {
        if (req.body.email == undefined || req.body.email == "" || req.body.reminder == undefined || req.body.reminder == "") {
            return res.status(500).json("Please  give valid lead email and update reminder")
        }
        await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName }, { $set: { "reminder": req.body.reminder } })
        if (!responce.modifiedCount == 1) {
            res.json("put valid input")
        } else {
            res.status(200).json("Updated successful")
        }
    } catch (err) {
        res.status(500).json(err)
    }
}
//update to reminder
const logUpdate = async (req, res) => {


    try {
        if (req.body.email == undefined || req.body.email == "" || req.body.logs == undefined || req.body.logs == "") {
            return res.status(500).json("Please  give valid lead email and update logs")
        }
        let response = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName }, { $set: { "logs": req.body.logs } })
        if (!response.modifiedCount == 1) {
            res.json("put valid input")
        } else {
            res.status(200).json("Updated successful")
        }
    } catch (err) {
        res.status(500).json(err)
        console.log(err)
    }
}
//employee add status notinterested

const notInterested = async (req, res) => {
    console.log(req.body)
    try {
        if (req.body.email == "" || req.body.email == undefined) {
            res.status(500).json("Please give lead email ")
        }
        let response = await Leads.updateOne({ "tasks.email": req.body.email, "userName": req.user.userName, status: "Pending" }, { $set: { "status": "Not Intrested" } })
        console.log(response)
        setTimeout(async () => {
            let data = await Leads.findOne({ "tasks.email": req.body.email })
            if (data.status == "Allocated") {
                res.json({ status: false, message: "Admin send the lead to other employee" })
                return;
            } else {
                let allUser = await Users.find()
                console.log(allUser)
                let data = await Leads.findOne({ "tasks.email": req.body.email })
                let random = Math.floor((Math.random() * allUser.length))
                await Leads.updateOne({ "userName": req.user.userName, "tasks.email": req.body.email }, { $set: { "status": "Not Intrested" } })
                console.log(random)
                console.log(allUser[random].id)
                let assignUser = new Leads({
                    employeeId: allUser[random].employeeId,
                    userName: allUser[random].userName,
                    assignTo: allUser[random].name,
                    tasks: data.tasks[0]
                })
                await assignUser.save()
                res.json({ status: true, message: assignUser })
            }

        }, 10000)
        //    res.status(200).json({
        //     status:true,
        //     message:"status update"
        //    })
    } catch (err) {
        res.status(500).json(err)
    }
}

// get users from id
const getAllUserId = async (req, res) => {
    try {
        const data = await Users.find().select({ userName: 1, _id: 0, email: 1, employeeId: 1 })
        console.log(data);
        if (data.length == 0) {
            return res.status(404).send({ status: false, message: "user Id not found" })
        }
        res.status(200).send({ status: true, id: data })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = {
    userRegister, userLogin, leadCount, acceptLead, employeeLeads, singleLead, statusUpdate, workUpdate, notInterested, myProfile, labelUpdate, reminderUpdate, logUpdate, codeSend
    , varifyOtp, resetPassword, getAllUserId
};