var restify = require('restify');
var builder = require('botbuilder');

// Create bot and add dialogs
var connector = new builder.ChatConnector({appId:"c60ece39-e97b-4f50-ae77-d0ac24f07a4f", appPassword:"tYQdi0sEppKbFwaFUOOKbJ4"});
var bot = new builder.UniversalBot(connector);
var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v2.0/apps/56cb79d3-1f50-45fe-bee6-a7820ffe67ff?subscription-key=412111898d6f49a0b22467676f123ecb&verbose=true&q=');
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

// Handling the Greeting intent. 
dialog.matches('Greeting', [function (session, args) {
	console.log ('in greeting ');
	session.send('Hello there! I am the notification bot. I can notify about the urgent orders');
	if(session.userData.name)
    {builder.Prompts.text(session, "What is your name?");}	
    },
	function (session, args, results){
		if(results.response){
		session.userData.name = results.response;
		session.send("Hello %s", session.userData.name);
		}
    }
]);
// Handling unrecognized conversations.
dialog.matches('None', function (session, args) {
	console.log ('in none intent');	
	session.send("I am sorry! I am a bot, perhaps not programmed to understand this command");			
});
dialog.matches('Notify', function (session, args) {
	console.log ('in notify ');
	session.send('we just got an urgent order. Want to review it?');		
});

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(process.env.port || 5000, function () {
    console.log('%s listening to %s', server.name, server.url); 
});