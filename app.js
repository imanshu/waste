var restify = require('restify');
var builder = require('botbuilder');


var dialog = new builder.LuisDialog('https://api.projectoxford.ai/luis/v2.0/apps/56cb79d3-1f50-45fe-bee6-a7820ffe67ff?subscription-key=412111898d6f49a0b22467676f123ecb&q=hello&verbose=true');
// Create bot and add dialogs
var bot = new builder.BotConnectorBot({ appId: '0ff6befd-526d-4bd1-a8d4-ba2351d4fabe', appSecret: 'jGuCQczXEi34Pb51DwdLpMy' });
bot.add('/', dialog);
// Handling the Greeting intent. 
dialog.on('Greeting', function (session, args) {
	console.log ('in greeting ');
	session.send('Hello there! I am the notification bot. I can notify about the urgent orders');		
});
// Handling unrecognized conversations.
dialog.on('None', function (session, args) {
	console.log ('in none intent');	
	session.send("I am sorry! I am a bot, perhaps not programmed to understand this command");			
});
dialog.on('Notify', function (session, args) {
	console.log ('in notify ');
	session.send('we just got an urgent order. Want to review it?');		
});

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(process.env.port || 5000, function () {
    console.log('%s listening to %s', server.name, server.url); 
});