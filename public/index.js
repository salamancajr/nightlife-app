var socket = io();

var array = document.getElementsByName("tally")
for (var i = 0; i < array.length; i++) {
    $(array[i]).on("click", function (e) {
        var name = e.target.id
        var username = $("h7").text();

        if (document.getElementsByTagName("h7").length > 0) {
            socket.emit("clicked", {
                name,
                username
            })
        }
    })
}

socket.on("confirmToken", function (message) {
    if(message=="yes"){
    var array = document.getElementsByName("tally")
    for (var i = 0; i < array.length; i++) {
        $(array[i]).removeAttr("href")
        console.log('removed');
    }}
    else{
        var array = document.getElementsByName("tally")
        for (var i = 0; i < array.length; i++) {
            $(array[i]).attr("href", "/auth/twitter")
            console.log('added');
    }}
})
socket.on("connect", function () {
    console.log("Connected to server");
});

socket.on("aggregate", function (tally) {


    var parent = $("[name=" + tally.name + "]")
    console.log(parent);

    $(parent).text(tally.count)




})