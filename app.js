var restify = require('restify');
var builder = require('botbuilder');

// Create bot and add dialogs
var bot = new builder.BotConnectorBot({ appId: 'db6c7eea-aac5-44ba-82b5-538c8827db30', appSecret: 'N2nZNmZ3mA4FCsygw15YSzi' });
bot.add('/', function (session) {
    session.send('Hello World');
	
	
});

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(process.env.port || 5000, function () {
    console.log('%s listening to %s', server.name, server.url); 
});