require("./config/config")
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const app = express();
const hbs = require("hbs");
const yelp = require('yelp-fusion');
const request = require("request");
const passport = require('passport');
const Strategy = require('passport-twitter').Strategy;
const mongoose = require("mongoose");
var server = http.createServer(app);
var io = socketIO(server);
const port = process.env.PORT;
const {
    User
} = require("./models/users");
const {
    Tally
} = require("./models/tally");
mongoose.connect(process.env.MONGODB_URI, (e) => {
    if (!e)
        ('Now connected to mongo server');
}).catch((e) => {
    console.log(e.message);
});
const apiKey =
    "i-pgWXjCGPHc5uwAyYjGbmxlQAn48ywovd5pAd8rFtEXNHFo-95XIcSQcTLZw-XthpkQv4DCconmEaihbO_okY9AlGP86auGJbolZIWDBDJCrD0gV77O3a1He3IHW3Yx";
const {
    getReviews
} = require("./reviews")
const client = yelp.client(apiKey);
passport.use(new Strategy({
        consumerKey: "i02sm71LaTQaQ4K7NIAhP98S6",
        consumerSecret: "xj8WqC4UdkLcdzrKNKvLDgNmGlf5qfBO7eB0omOVhOXvkezd1r",
        callbackURL: "https://hidden-sands-23770.herokuapp.com/auth/twitter/callback"
    },
    function (token, tokenSecret, profile, done) {
        var user = new User({
            twitterId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            photos: profile.photos[0].value
        })
        user.save().then(() => {
            done(null, user);
        }).catch((e) => {
            return done(e);
        })
    }
));
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({
    extended: true
}));
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: 'auto'
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + "/public"));
hbs.registerPartials(__dirname + "/views/partials")
app.set("view engine", "hbs");
hbs.registerHelper('list', function (items, options) {
    var out = "<ul class='collection'>"
    for (var i = 0; i < items.length; i++) {
        var noApostrophe = JSON.stringify(items[i].name.replace(/[' ]/g, ""))
        if (items[i].name.indexOf("'") > -1) {
            var replacement = items[i].name.replace("'", "&#8217")
        } else {
            var replacement = items[i].name
        }
        out = out + "<li class='collection-item avatar'><div class='row'><div class='col l11 col m10 col s9'>" + options.fn(items[i]) + "</div><div class='vertical-align:middle'style='text-align:center; margin:auto'class='col l1 col m2 col s3'><a href='/auth/twitter' id='" + noApostrophe + "' name='tally' style='z-index:0;font-size:10px; margin:auto'class='waves-effect waves-light btn'>Attending<br><span name=" + noApostrophe + "id='num-att'>" + items[i].count + "</span></a></div></div></li>";
    }
    return out + "</ul>";
});

io.on("connection", (socket) => {
    console.log("New user connected");
    socket.on("clicked", (message) => {
        Tally.findOneAndUpdate({
            name: message.name,
            users: {
                $nin: [message.username]
            }
        }, {
            $inc: {
                count: +1
            },
            $push: {
                users: message.username
            }
        }, {
            new: true
        }).then((tally) => {
            if (tally === null) {
                Tally.findOneAndUpdate({
                    name: message.name,

                }, {
                    $inc: {
                        count: -1
                    },
                    $pull: {
                        users: message.username
                    }
                }, {
                    new: true
                }).then((tally) => {
                    return socket.emit("aggregate", tally)
                })
            }

            return socket.emit("aggregate", tally)
        })
    });
});

app.get("/", (req, res) => {
    res.render("project.hbs", {
        carousel: true
    });
})

app.get("/search", (req, res) => {
    res.cookie("callback", req.query.place)
    if (req.user) {
        var photo = req.user.photos,
            username = req.user.username;
        io.on("connection", (socket) => {
            socket.emit("confirmToken", {user: "yes"})
        })
    }
    if (!req.user) {
        socket.emit("confirmToken", {user:"no"})
    }
    const searchRequest = {
        location: req.query.place,
        limit: 10
    };
    client.search(searchRequest).then(response => {
            var prettyJson = response.jsonBody.businesses;
            return prettyJson
        }).then((prettyJson) => {
            var i = 0;
            async function addReview(i) {
                var id = prettyJson[i].id;
                var name = JSON.stringify(prettyJson[i].name.replace(/[' ]/g, ""))
                getReviews(id, (err, reviewResults) => {
                    if (err) {
                        Promise.reject()
                    } else {
                        var tally = new Tally({
                            name,
                            count: 0
                        });
                        tally.save().then((tally) => {
                            var count = tally.count;
                            return prettyJson[i].count = count;
                        }).catch((e) => {
                            Tally.findOne({
                                name
                            }).then((tally) => {
                                var count = tally.count;
                                return prettyJson[i].count = count;
                            })
                        })
                        prettyJson[i].reviews = reviewResults.review;
                        console.log("outsideMongo", prettyJson[i].count);
                    }
                    setTimeout(function () {
                        if (i < prettyJson.length - 1) {
                            i++;
                            addReview(i)
                        } else {
                            res.render("project.hbs", {
                                businesses: prettyJson,
                                photo,
                                username
                            })
                        }
                    }, 300)
                })
            }
            addReview(i)
        })
        .catch(e => {

            console.log('hello');

            console.log(e);
            res.redirect(`/search?place=${req.cookies["callback"]}`)
        });
});

app.get('/auth/twitter',
    passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        failureRedirect: '/'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect(`/search?place=${req.cookies["callback"]}`);
    });

server.listen(port)