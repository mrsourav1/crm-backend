const mongoose=require("mongoose")
const NotificationModel=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    token:
    {
        type:String,
        required:true
    }
})

const NotifyToken=mongoose.model("NotifyToken",NotificationModel)
module.exports=NotifyToken;