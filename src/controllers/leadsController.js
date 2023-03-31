const Leads = require('../models/leadsModel');
const Users = require('../models/userModel')
const { isValid, isValidRequest, isValidName, isValidPhone, isValidEmail } = require('../utills/validation')


const allocateLeads = async (req, res) => {
    try {
        const clientLeads = req.body.task;
        console.log("req.body.task..", req.body.task);
        if (!isValidRequest(req.body)) {
            return res.status(422).send({ status: false, message: "Invalid! request" })
        }
        if (clientLeads.length === 0)
            return res.status(400).send({ status: false, message: "Leads are empty" });

        const validClientLeads = clientLeads.filter(
            (ele) => ele.name && ele.email && ele.contact
        );
        if (validClientLeads.length !== clientLeads.length)
            return res
                .status(400)
                .send({ status: false, message: "Client info is missing" });

        const arr = validClientLeads.map((ele) => ({
            name: ele.name,
            email: ele.email.toLowerCase(),
            contact: ele.contact,
            message: ele.message,
            assigned: false
        }));

        const employees = await Users.find();
        const numberOfEmployees = employees.length;
        const numberOfLeads = arr.length;
        const leadsPerEmployee = Math.floor(numberOfLeads / numberOfEmployees);
        var remainingLeads = numberOfLeads % numberOfEmployees;

        // Shuffle employees array to distribute leads fairly
        for (let i = employees.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [employees[i], employees[j]] = [employees[j], employees[i]];
        }

        let leadsAssigned = 0;
        const assignedLeads = [];
        let leadIndex = 0;
        for (let i = 0; i < numberOfEmployees; i++) {
            const employee = employees[i];
            const employeeLeads = await Leads.find({ employeeId: employee.employeeId });
            const numberOfEmployeeLeads = employeeLeads.length;
            let leadsToAssign = leadsPerEmployee;

            if (remainingLeads > 0) {
                leadsToAssign++;
                remainingLeads--;
            }

            for (let j = 0; j < leadsToAssign; j++) {
                if (leadIndex >= numberOfLeads) break;

                const leadToAssign = arr[leadIndex];

                leadToAssign.assigned = true;
                const assignedLead = await Leads.create({
                    employeeId: employee.employeeId,
                    email: employee.email,
                    userName: employee.userName,
                    assignTo: employee.name,
                    tasks: [leadToAssign],
                });
                assignedLeads.push(assignedLead);

                leadIndex++;
            }
        }

        return res.status(200).send({ status: true, leads: assignedLeads });
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}


const reAllocateLeads = async (req, res) => {
    try {
        //const employeeId = req.params.employeeId
        const { name, email, contact, employeeId, message } = req.body;
        console.log(req.body);
        if (isNaN(employeeId)) {
            return res.status(422).send({ status: false, message: "Invalid employee id" })
        } else if (!name || !email || !contact) {
            return res.status(400).send({ status: false, message: "Required fileds are missing" })
        } else if (!isValid(name) || !isValidName(name)) {
            return res.status(422).send({ status: false, message: "Invalid!  name" })
        } else if (!isValidEmail(email)) {
            return res.status(422).send({ status: false, message: "clients Email is invalid!" })
        } else if (!isValidPhone(contact)) {
            return res.status(422).send({ status: false, message: "Invalid! phone number" })
        }
        const employeeData = await Users.findOne({ employeeId: employeeId });
        if (!employeeData) return res.status(404).send({ status: false, message: "Employee not found for this id" })
        let newLeads = {
            employeeId: employeeId,
            userName: employeeData.userName,
            assignTo: employeeData.name,
            tasks: [{
                "name": name, "email": email.toLowerCase(), "contact": contact, "message": message
            }]
        }
        await Leads.create(newLeads);
        return res.status(201).send({ status: true, message: "Leads added successfully!" })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
};

// reassign leads to an employee
const reAssignLeads = async (req, res) => {

    try {
        const { assignTo, name, email, contact, message, userName } = req.body
        if (!assignTo || !name || !email || !contact || !message || !userName) {
            return res.status(400).send({ status: false, message: "leads information is missing!" })
        }
        if (!isValid(name) || !isValidName(name)) {
            return res.status(422).send({ status: false, message: "Invalid! Client name" })
        } else if (!isValidEmail(email)) {
            return res.status(422).send({ status: false, message: "Invalid! email" })
        } else if (!isValidPhone(contact)) {
            return res.status(422).send({ status: false, message: "Invalid phone number" })
        } else if (!isValid(userName)) {
            return res.status(422).send({ status: false, message: "Invalid userName" })
        }
        let verifyLeads = await Leads.findOne({ assignTo: assignTo, 'tasks.email': email })
        if (!verifyLeads) {
            return res.status(404).send({
                status: false, message: "This leads doesn't belongs to any employee"
            })

        }
        let empInfo = await Users.findOne({ userName: userName })

        if (!empInfo) {
            return res.status(422).send({ status: false, message: "Invalid! userName" })
        }
        let a = await Leads.create({
            employeeId: empInfo.employeeId,
            userName: empInfo.userName,
            assignTo: empInfo.name,
            tasks: [{
                "name": name,
                "email": email,
                "contact": contact,
                "message": message
            }]
        });
        await Leads.findOneAndUpdate({ employeeId: verifyLeads.employeeId, "tasks.email": email }, { isDeleted: true }, { new: true })

        res.status(200).send({ status: true, message: "Thank you! for leads reassigning" })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}
// get all leads
const getAllLeads = async (req, res) => {
    try {
        let data = await Leads.find({ status: "Allocated", isDeleted: false })
        let modifiedLeads = []
        data.map((ele) => {
            let newObj = {
                employeeId: ele.employeeId,
                assignTo: ele.assignTo,
                name: ele.tasks[0].name,
                email: ele.tasks[0].email,
                contact: ele.tasks[0].contact,
                message: ele.tasks[0].message,
                logs: ele.logs
            }
            modifiedLeads.push(newObj)
        })
        res.status(200).send({ status: true, leads: data })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}

// get lattest leads
const getLeads = async (req, res) => {
    try {
        var leadsData = await Leads.find({ isDeleted: false }).sort({ updatedAt: -1 })
        var arr = leadsData
        let result = []
        var map = new Map()
        for (let i = 0; i < arr.length; i++) {
            if (!map.has(arr[i].tasks[0].email)) {
                map.set(arr[i].tasks[0].email, arr[i])
                result.push(arr[i])

            } else {
                continue;
            }
        }
        res.status(200).send({ status: true, leads: result })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}
//  get leads by status
const getLeadsByStatus = async (req, res) => {
    try {
        let status = req.params.status
        console.log(status);
        if (!status) return res.status(400).send({ status: false, message: "Status is required" })
        if (!["Allocated", "Pending", "Not Intrested", "Completed"].includes(status) || !isValid(status)) {
            return res.status(422).send({ status: false, message: "Invalid! Status" })
        }
        const leadsStatus = await Leads.find({ status: status, isDeleted: false }).select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 });
        if (leadsStatus.length === 0) {
            return res.status(200).send({ status: false, message: 'There is no leads!' })
        }
        let filteredLeads = []
        leadsStatus.map((ele) => {
            let newObj = {
                employeeId: ele.employeeId,
                assignTo: ele.assignTo,
                name: ele.tasks[0].name,
                email: ele.tasks[0].email,
                contact: ele.tasks[0].contact,
                message: ele.tasks[0].message
            }
            filteredLeads.push(newObj)
        })

        return res.status(200).send({ status: true, leads: filteredLeads });
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
};


const updateLeadsStatus = async (req, res) => {
    try {
        const { employeeId, email, status } = req.body
        if (!employeeId && employeeId !== 0) return res.status(400).send({ status: false, message: "Employee id is required" })
        if (isNaN(employeeId)) return res.status(400).send({ status: false, message: "Id should be number only" })
        if (!email || !status) {
            return res.status(422).send({ status: false, message: "Email and status are required to update" })
        }
        if (!isValidEmail(email)) {
            return res.status(422).send({ status: false, message: "Invalid! email" })
        }
        if (!["Pending", "Not Intrested", "Completed"].includes(status) || !isValid(status)) {
            return res.status(422).send({ status: false, message: "Invalid! Status" })
        }
        const updatedStatus = await Leads.findOneAndUpdate({ employeeId: employeeId, 'tasks.email': email }, { $set: { status: status } })
        if (!updatedStatus) {
            return res.status(404).send({ status: false, message: "Leads not found" })
        }
        res.status(200).send({ status: true, message: "Status updated successfully", updatedStatus });
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
};
// Delete leads by admin
const deleteLeads = async (req, res) => {
    try {
        const { employeeId, email } = req.body
        if (!employeeId && employeeId !== 0 || !email) {
            return res.status(422).send({ status: false, message: "employee id and email are required!" })
        } else if (isNaN(employeeId)) {
            return res.status(422).send({ status: false, message: "Invalid! employee id" })
        } else if (!isValidEmail(email)) {
            return res.status(422).send({ status: false, message: "Invalid email" })
        }

        let deletedLeads = await Leads.findOneAndUpdate({ employeeId: employeeId, "tasks.email": email }, { isDeleted: true })
        if (!deletedLeads) {
            return res.status(404).send({ status: false, message: "Leads not found" })
        }
        res.status(200).send({ status: true, message: "Leads deleted successfully!" })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
};

const getCallLogs = async (req, res) => {
    let allLeads = await Leads.find()
    if (allLeads.length == 0) {
        return res.status(404).send({ status: false, message: "No call logs found" })
    }
    let arr = []
    allLeads.map((ele) => {
        let obj = {
            "userName": ele.userName,
            "assignTo": ele.assignTo,
            "logs": ele.logs,
            "name": ele.tasks[0].name,
            "contact": ele.tasks[0].contact,
            "work": ele.work,
            "createAt": ele.createdAt
        }
        arr.push(obj)
    })
    res.status(200).send({ status: true, callLogs: arr })
}



module.exports = { allocateLeads, reAllocateLeads, reAssignLeads, getAllLeads, getLeads, getLeadsByStatus, updateLeadsStatus, deleteLeads, getCallLogs }