const express = require('express')
const router = express.Router()
const {
    userRegister, userLogin, leadCount, acceptLead, employeeLeads, singleLead, statusUpdate, workUpdate, notInterested, myProfile, labelUpdate, reminderUpdate, logUpdate, codeSend
    , varifyOtp, resetPassword, getAllUserId
} = require('../controllers/userController')
const { adminRegister, adminLogin, adminreset, admiemailsend, adminverfiypassword, adminchangepassword, adminlogout, adminIdgenereate } = require('../controllers/adminController')
const { authentication, authorisation, protect } = require('../middleware/auth')
// leads router
const { allocateLeads, reAllocateLeads, reAssignLeads, getAllLeads, getLeads, getLeadsByStatus, updateLeadsStatus, deleteLeads, getCallLogs } = require('../controllers/leadsController');





/*----------------------------------- Employee router --------------------------*/
// User
// user register 
router.post('/userRegister', userRegister);
//login user
router.post('/userLogin', userLogin);
//to see own profile details
router.get('/profile', protect, myProfile)
//employee show own all leada
router.get('/employee/leads/:status', protect, employeeLeads)
router.put('/accept/lead', protect, acceptLead)
// lead count
// router.get('cou',protect,leadCount)
router.get('/count/lead', protect, leadCount)

//employee see one particular lead
router.post('/singleLead', protect, singleLead)
//update status 
router.post('/status/update', protect, statusUpdate)
// update work status
router.post('/work/update', protect, workUpdate)
//employee update the lead as not interested
router.post('/notInterested', protect, notInterested)
// /employee update the leads
router.post('/labelUpdate', protect, labelUpdate)
// update reminder
router.post('/reminderUpdate', protect, reminderUpdate)
//update call logs
router.post('/logUpdate', protect, logUpdate)
// sending password forget otp
router.post('/sendcode', codeSend)
// varifying otp
router.post('/varify/otp', protect, varifyOtp)
// reset password
router.post('/reset/password', protect, resetPassword)
// get userId
router.get('/empid', getAllUserId);



/*----------------------------------- Admin router --------------------------*/
router.post('/adminRegister', adminRegister)
router.post('/adminLogin', adminLogin);
router.post('/adminreset', adminreset);
router.post('/adminIdgenereate', adminIdgenereate);

/*----------------------------------- Adminforget(admiemail,adminchangepassword,adminupdatepassword) --------------------------*/
router.post('/admiemail', admiemailsend)
router.post('/adminverfiypassword', adminverfiypassword);
router.post('/adminchangepassword', adminchangepassword);
// router.post('/generateId', generateEmployeeId)
router.post('/adminlogout', adminlogout)

// Leads Router
router.post('/leads', authentication, authorisation, allocateLeads);
router.post('/reAllocate', authentication, authorisation, reAllocateLeads);
router.post('/reAssignLeads', authentication, authorisation, reAssignLeads);
router.get('/getAllLeads', authentication, authorisation, getAllLeads)
router.get('/getLeads', authentication, authorisation, getLeads);
router.get('/leads/:status', authentication, authorisation, getLeadsByStatus);
router.put('/updateStatus', authentication, authorisation, updateLeadsStatus);
router.delete('/deleteLeads', authentication, authorisation, deleteLeads);
router.get('/callLogs', getCallLogs)
// Leads Router


module.exports = router;



