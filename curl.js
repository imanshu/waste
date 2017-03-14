var http = require("http");

var headers = {
    'Content-Type': 'application/json'
};

var dataString = {
 "setting_type" : "call_to_actions",
 "thread_state" : "existing_thread",
 "call_to_actions":[
 {
 "type":"postback",
 "title":"Help",
 "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_HELP"
 },
 {
 "type":"postback",
 "title":"Start a New Order",
 "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_START_ORDER"
 },
 {
 "type":"web_url",
 "title":"View Website",
 "url":"http://petersapparel.parseapp.com/"
 }
 ]
 };

var options = {
    url: 'https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAFMfPea36cBAGEXf1Fw2JayiWtJ40lvLCvZB8TlAVoboD8shkvzOOXsYJh22tdut8LapGwkXnZAKI1BtyZCpeJd66fUNEXMu0rtqcvqD6eJPw6IwBMpwZAQ5gViEPvE8XqzZCttAhzdT7l8j5pUEMpmzce5ZBooSJr8H8mtMBMwqzA2OsWBde',
    method: 'POST',
    headers: headers,
    body: dataString
};

var req = http.request(options, function(res) {
  console.log('Status: ' + res.statusCode);
  console.log('Headers: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (body) {
    console.log('Body: ' + body);
  });
  res.on('error', function(e) {
  console.log('problem with request: ' + e.message);
  });
  }).end()