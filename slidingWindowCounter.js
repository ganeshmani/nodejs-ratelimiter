const redis = require('redis');
const moment = require('moment');
const redisClient = redis.createClient();

module.exports = (req,res,next) => {
    
    redisClient.exists(req.headers.user,(err,reply) => {
        if(err){
            console.log("problem with redis");
            system.exit(0);
        }

        if(reply === 1) {

            redisClient.get(req.headers.user,(err,redisResponse) => {
                let data = JSON.parse(redisResponse);
                
                let currentTime = moment().unix()
                let lessThanMinuteAgo = moment().subtract(1,'minute').unix();

                let RequestCountPerMinutes = data.filter((item) => {
                    return item.requestTime > lessThanMinuteAgo;
                })

                let thresHold = 0;

                RequestCountPerMinutes.forEach((item) => {
                    thresHold = thresHold + item.counter;
                })

                if(thresHold >= 5){

                    return res.json({ "error" : 1,"message" : "throttle limit exceeded" })

                }
                else{

                    let isFound = false;
                    data.forEach(element => {
                        if(element.requestTime) {
                            isFound = true;
                            element.counter++;
                        }
                    });
                    if(!isFound){
                        data.push({
                            requestTime : currentTime,
                            counter : 1
                        })
                    }
                  
                    redisClient.set(req.headers.user,JSON.stringify(data));

                    next();

                }
            })
        }
        else{
            let data = [];
            let requestData = {
                'requestTime' : moment().unix(),
                'counter' : 1
            }
            data.push(requestData);
            redisClient.set(req.headers.user,JSON.stringify(data));

            next();
        }
    })
}