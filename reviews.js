const request = require("request");
const apiKey =
    "i-pgWXjCGPHc5uwAyYjGbmxlQAn48ywovd5pAd8rFtEXNHFo-95XIcSQcTLZw-XthpkQv4DCconmEaihbO_okY9AlGP86auGJbolZIWDBDJCrD0gV77O3a1He3IHW3Yx";

 var getReviews = (id, callback) => {
    request({
        url: `https://api.yelp.com/v3/businesses/${id}/reviews`,
        json: true,
        headers: {
            "Authorization": `Bearer ${apiKey}`
        }
    }, (error, response, body) => {
        if (error) {
            return console.log(error);
        }

        callback(undefined, {review: body.reviews[0].text})
    });
};

module.exports = {getReviews};