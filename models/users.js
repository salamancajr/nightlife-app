var mongoose =require("mongoose");

var User = mongoose.model("User", {
    twitterId: {
        type:"string",
        minlength:1,
        required:true
    },
    username: {
        type:"string",
        minlength:1,
        required:true
    },
    displayName: {
        type:"string",
        minlength:1,
        required:true
    },
    photos: {
        type:"string"
    }

})

module.exports = {User}