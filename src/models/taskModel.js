const mongoose = require('mongoose')

const taskSchema=new mongoose.Schema({
    name:{
        type:String
    },
    description:{
        type:String,
    },
    file:{
        type:String
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
    },
    status:{
        type:String
    }
})
module.exports = mongoose.model('task', taskSchema)