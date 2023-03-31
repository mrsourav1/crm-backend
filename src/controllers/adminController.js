
/*------------------------------Task for 3 feb--------------------------------*/
const adminModel = require('../models/adminModel');
const employerIdModel = require('../models/userNameModel')
//////
// const employeeId = require('../models/userNameModel')
// const employerIdModel = require('../models/employerIdModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const cookie = require('cookie')

/*----------------------------------------adminRegister api------------------------------------------*/
const isValidPwd = function (Password) {
    return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(Password)
}

const isEmail = function (email) {
    var emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (email !== '' && email.match(emailFormat)) { return true; }

    return false;
}


function isNumberstring(str) {
    if (typeof str != "string") return false // we only process strings!
    if (typeof str == "string") {
        if ((str.match(/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/))) {
            return true
        }
        else {
            return false
        }
    }
    return false
}



const adminRegister = async (req, res) => {
    try {
        const adminInfo = req.body
        const { name, email, mobile, password } = adminInfo



        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "please enter a data in request body" })

        /*------------------------------Validation for name--------------------------------*/
        if (!name)
            return res.status(400).send({ status: false, message: "Name is missing" })

        if (!isNaN(name)) return res.status(400).send({ status: false, message: " Please enter Name as a String" });

        /*------------------------------Validation for Email--------------------------------*/
        if (typeof email !== "string") return res.status(400).send({ status: false, message: " Please enter  email as a String" });
        if (!isEmail(email)) { return res.status(400).send({ status: false, message: "Enter valid Email." }) }

        const emailUnique = await adminModel.findOne({ email: email })
        if (emailUnique) {
            return res.status(400).send({ status: false, message: "eamil is alreday exist" })
        }

        /*------------------------------Validation for Mobile--------------------------------*/

        if (!mobile)
            return res.status(400).send({ status: false, message: "mobile is missing" })

        if (!/^(\+\d{1,3}[- ]?)?\d{10}$/.test(mobile)) {
            return res.status(400).send({ status: false, message: " please enter Phone_number" })
        }
        /*------------------------------Validation for password--------------------------------*/

        if (!password)
            return res.status(400).send({ status: false, message: "password is missing" })
        if (!(password.length > 6 && password.length < 16)) return res.status(400).send({ status: false, message: "password should be greater than 6 and less then 16 " })


        if (!isValidPwd(password)) { return res.status(400).send({ status: false, message: "Enter valid password." }) }
        //-----------[Password encryption]
        // const bcryptPassword = await bcrypt.hash(password, 10)
        // adminInfo.password = bcryptPassword

        const savedAdminInfo = await adminModel.create(adminInfo)
        res.status(200).send({ status: true, savedAdminInfo })
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}


/*----------------------------------------adminLogin  api------------------------------------------*/

const adminLogin = async (req, res) => {
    try {

        let data = req.body
        let { email, password } = data

        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please Enter data" })

        /*------------------------------Validation for Email--------------------------------*/

        if (!email) return res.status(400).send({ status: false, message: 'Please enter email' })
        if (!isEmail(email)) { return res.status(400).send({ status: false, message: "Enter valid Email." }) }

        if (typeof email !== "string") return res.status(400).send({ status: false, message: " Please enter  email as a String" });


        if (!password) return res.status(400).send({ status: false, message: 'Please enter password' })

        const Login = await adminModel.findOne({ email })      /////store entire schema
        if (!Login) return res.status(400).send({ status: false, message: 'Enter a Valid Email Id' })

        //----------[Password Verification]
        // let PassDecode = await bcrypt.compare(password, Login.password)   ///////login entire schrema
        // if (!PassDecode) return res.status(401).send({ status: false, message: 'Password not match' })

        let PassDecode = await adminModel.findOne({ password })
        if (!PassDecode) return res.status(400).send({ status: false, message: "Enter a Valid Password" })

        //----------[JWT token generate]
        let token = jwt.sign({
            userId: Login._id.toString()       //to remove Object_id
        }, "admin panel", { expiresIn: '50d' })

        res.setHeader("x-api-key", token)
        res.cookie("Access_token", token)
        let tok = req.cookies.Access_token
        console.log(tok);

        return res.status(200).send({ status: true, message: 'Admin login successfull', data: token })

    }
    catch (err) { return res.status(500).send({ status: false, message: err.massage }) }
}


/*------------------------------Task for 4 feb--------------------------------*/


/*----------------------------------------adminreset api------------------------------------------*/
const adminreset = async (req, res) => {
    try {
        // let password=req.body.password;

        const { password, confirmPassword } = req.body;
        // Check that both passwords match
        if (password !== confirmPassword) {
            return res.status(400).send({ status: false, message: "New passwords do not match" })
        }
        // if (Object.keys(req.body).length == 0) {
        //     return res.status(400).send({ status: false, message: "All fields are required" })
        // }
        if (!password) {
            return res.status(400).send({ status: false, message: "All fields are required" })
        }
        if (!confirmPassword) {
            return res.status(400).send({ status: false, message: "All fields are required" })
        }
        let token = req.cookies.Access_token
        console.log(token)
        let decodedToken = jwt.verify(token, "admin panel")
        let adminId = decodedToken.userId
        // console.log(adminId);
        let updatepassword = await adminModel.findOneAndUpdate({ _id: adminId }, { password: password, confirmPassword: confirmPassword });
        console.log(updatepassword);
        res.status(200).send({ status: true, message: "Password Changed Successfully", data: updatepassword });
    }
    catch (err) { return res.status(500).send({ status: false, message: err.massage }) }
}

/*----------------------------------------adminforget api------------------------------------------*/


/*----------------------------------------admiemailsend  api------------------------------------------*/



const admiemailsend = async (req, res) => {
    let { email } = req.body
    console.log("req.body", req.body);
    let data = await adminModel.findOne({ email: email })
    console.log("data", data);
    res.cookie("email", req.body.email)
    if (!data) {
        return res.status(400).send({ status: false, message: "Plz enter valid email ID" })
    }

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "fugiganiyar14@gmail.com",
            pass: "bvdoaflxfkovyuev"
        }
    });
    let otpnum = Math.floor(1000 + (Math.random() * 9000))
    console.log("otpnum", otpnum);

    let addotp = await adminModel.findOneAndUpdate({ email: req.body.email }, { $set: { otp: otpnum } })
    console.log("addotp", addotp);

    var mailOptions = {
        from: "fugiganiyar14@gmail.com",
        // to: 'sandeepsharma@hminnovance.com',
        to: `${req.body.email}`,
        subject: `Sending Email by user `,
        text: `Hello Sir/Madam
               Need to reset your password?
               Use your secret code!${otpnum}
               copy the code and paste it there for re-set paswword
               If you did not forget your password, you can ignore this email.

        `
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            res.status(200).send(info)
        }
    });
}





/*----------------------------------------adminverfiypassword api------------------------------------------*/
///////////email from cookies
/// otp from database
const adminverfiypassword = async (req, res) => {
    try {
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "please enter a data in request body" })
        const { otp, email } = req.body
        console.log(email)
        if (!email || email.trim() === '') {
            return res.status(400).send({ status: false, message: "Please provide a valid email" });
        }
        if (!otp || otp.trim() === '') {
            return res.status(400).send({ status: false, message: "Please provide a valid OTP" });
        }
        let isAdmin = await adminModel.findOne({ email: email })
        // console.log(otp, isAdmin.otp);
        if (!isAdmin) return res.status(404).send({ status: false, message: "Account not found for this email" })
        if (Number(otp) !== isAdmin.otp) {
            return res.status(403).send({ status: false, message: "Invalid otp" })
        } else {
            res.cookie('admin_email', email);
            return res.send({ status: true, message: "OTP verified successfully" })
        }
    }
    catch (err) { return res.status(500).send({ status: false, message: err.massage }) }
}

/*----------------------------------------adminchangepassword api------------------------------------------*/


const adminchangepassword = async (req, res) => {

    try {

        /// Acessing email from cookies
        // let adminEmail = req.cookies.email
        // console.log(adminEmail)

        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "please enter a data in request body" })
        let { password, confirmPassword } = req.body
        console.log(req.body)
        // let password = req.body.password;
        // console.log(password)
        // const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
        // if (!passwordRegex.test(password)) {
        //     return res.status(400).json({ error: 'Password must contain at least 8 characters, including uppercase and lowercase letters, and numbers' });
        // }

        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{};:"\\|,.<>\/?)' });
        }

        if (!passwordRegex.test(confirmPassword)) {
            return res.status(400).json({ error: 'Password must contain at least 8 characters, including uppercase and lowercase letters, and numbers' });
        }
        const email = req.cookies.admin_email; // Decode email from cookie
        console.log(email)
        confirmPassword = req.body.confirmPassword
        if (password !== confirmPassword) {
            return res.status(422).send({ status: false, message: "password doesn't matched" })
        }


        if (!password)
            return res.status(400).send({ status: false, message: "password is missing" })
        if (!(password.length > 8 && password.length < 15)) return res.status(400).send({ status: false, message: "password should be greater than 6 and less then 16 " })
        //-----------[Password encryption]

        // const bcryptPassword = await bcrypt.hash(password, 10)
        let changepassword = await adminModel.findOneAndUpdate({ email: email },
            { $set: { password: password, confirmPassword: password } }

        )
        // res.clearCookie("email", adminEmail)
        console.log(changepassword);
        res.status(200).send({ status: true, data: changepassword });
    }
    catch (err) { return res.status(500).send({ status: false, message: err.massage }) }
}

const adminIdgenereate = async (req, res) => {
    try {
        let employerid = req.body.userName
        console.log(employerid);

        if (employerid.length < 4 || employerid.length > 10) {
            return res.status(400).send({ status: false, message: "Employer Id length should be between 4 and 10." })
        }
        if (!isNumberstring(employerid)) { return res.status(400).send({ status: false, message: "Enter valid employer Id it may consists number and string." }) }

        const uniqueemplyerId = await employerIdModel.findOne({ userName: employerid })
        if (uniqueemplyerId) {
            return res.status(400).send({ status: false, message: "This emplpyer Id is already Present " })
        }
        const savedEmplyerId = await employerIdModel.create({ userName: employerid })
        res.status(200).send({ status: true, message: "Add Employee Successfully: ", savedEmplyerId })


    }
    catch (err) { return res.status(500).send({ status: false, message: err.massage }) }
}

////////////////////////EmployerIdSchema/////////////////////////////////////////////


const adminlogout = async (req, res) => {
    try {
        let tokens = req.cookies.Access_token
        if (tokens) {
            res.clearCookie("Access_token")
            res.json({ success: true, message: 'Sign out successfully!' });
        } else {
            res.status(422).send({ status: false, message: "You are already logged out" })
        }
    }
    catch (err) { return res.status(500).send({ status: false, message: err.massage }) }
};

module.exports = { adminRegister, adminLogin, adminreset, admiemailsend, adminverfiypassword, adminchangepassword, adminIdgenereate, adminlogout };

























