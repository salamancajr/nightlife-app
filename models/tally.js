var mongoose = require("mongoose");

var Tally = mongoose.model("Tally", {
    name: {
        type: "string",
        required: true,
        unique:true
    },
    count: {
        type: Number,
        default: 0
    },
    users: {
        type: Array
    }
})
module.exports = {Tally}