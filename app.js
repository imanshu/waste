var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');

choose_cat = function(gender, type){
	    if (gender == "Women" && type == "Athletic"){
		    category = "5438_1045804_1045806_1228540"
        }else if (gender == "Women" && type == "Casual"){
            category = "5438_1045804_1045806_1228545"
        }else if (gender == "Women" && ((type == "Formal")||(type == "Dres"))){
            category = "5438_1045804_1045806_1228546"
        }else if (gender == "Women" && type == ""){
            category = "5438_1045804_1045806"
        }else if (gender == "Men" && type == "Athletic"){
            category = "5438_1045804_1045807_1228548"
        }else if (gender == "Men" &&  type == "Casual"){
            category = "5438_1045804_1045807_1228552"
        }else if (gender == "Men" && ((type == "Formal")||(type == "Dres"))){
            category = "5438_1045804_1045807_1228553"
        }else if (gender == "Men" && type == ""){
            category = "5438_1045804_1045807"
        }else{
		    category = "5438_1045804"}
	return category;
}

capitalize = function(str) {
	if (str != null && str.length > 0 && (str.charAt(str.length-1)=='s')||(str.charAt(str.length-1)=='S')){
	str = str.substring(0, str.length-1);
	}
    str = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	return str;
}

function showoutput(session,items){
	if(!items){
		session.send("Try another search. No product exists.")
	}else {
	var i=0;
	while(items[i]) {
        var msg = new builder.Message(session)
                .attachments([
                    new builder.HeroCard(session)
                        .title(items[i].name)
                        .images([ builder.CardImage.create(session, items[i].thumbnailImage) ])
					    .buttons(builder.CardAction.openUrl(session, items[i].productUrl,"Buy Now"))
					    .tap(builder.CardAction.openUrl(session, items[i].productUrl))
                
                ]);
    session.send(msg);
	i++;
	}}
}

callingApi = function(path, callback){
	     var options = {
            host: 'api.walmartlabs.com',
            path: path,
			method: 'GET'		
         };
         //this is the call
         var request = http.request(options, function(res){
            var body = "";
            res.on('data', function(data1) {
               body += data1;
            });
            res.on('end', function() {
              callback(JSON.parse(body));
            })
            res.on('error', function(e) {
               console.log("Got error: " + e.message);
            });
	      }).end();
}

// Create bot and add dialogs
var connector = new builder.ChatConnector({appId:"c60ece39-e97b-4f50-ae77-d0ac24f07a4f", appPassword:"tYQdi0sEppKbFwaFUOOKbJ4"});
var bot = new builder.UniversalBot(connector);
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/c592677c-d9ec-435d-bada-77008d9fc147?subscription-key=412111898d6f49a0b22467676f123ecb&verbose=true&q=');
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

// Handling the Greeting intent. 
dialog.matches('ShoeSearch' , 
    function (session, args, next) {
	    console.log ('in shoesearch intent ');
	    var shoe = builder.EntityRecognizer.findEntity(args.entities, 'Shoe');
	    var gender = builder.EntityRecognizer.findEntity(args.entities, 'Gender');
	    var brand = builder.EntityRecognizer.findEntity(args.entities, 'Shoe::Shoe_brand');
	    var color = builder.EntityRecognizer.findEntity(args.entities, 'Color');
	    var type = builder.EntityRecognizer.findEntity(args.entities, 'Shoe::Shoe_type');
	    var size = builder.EntityRecognizer.findEntity(args.entities, 'Shoe::Shoe_size');
	    session.userData = {
	    	shoe: shoe ? shoe.entity : "",
	    	gender: gender ? capitalize(gender.entity) : "",
	    	brand: brand ? capitalize(brand.entity) : "",
	     	color: color ? capitalize(color.entity) : "",
	    	type: type ? capitalize(type.entity) : "",
	    	size: size ? size.entity : "",
	    	path: "",
	    	};
	    session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	    session.send('Hello there! I am the shoe search bot. You are looking for %s %s %s %s for %s of size %s',session.userData.brand,session.userData.type,session.userData.color,session.userData.shoe,session.userData.gender,session.userData.size);		
	    callingApi(session.userData.path, function(data){	
		showoutput(session,data.items);
		if(!data.items){
			session.endDialog();
		}else if(session.userData.gender==""){
		    session.beginDialog('/Gender');
		}else if(session.userData.type==""){
		    session.beginDialog('/Type');
		}else if(session.userData.brand==""){
		    session.beginDialog('/Brand');
		}else if(session.userData.color==""){
		    session.beginDialog('/Color');
		}else if(session.userData.size==""){
		    session.beginDialog('/Size');
		}	
	    })
        	
	})
// Handling unrecognized conversations.
dialog.matches('None', function (session, args) {
	console.log ('in none intent');	
	session.send("I am sorry! I am a bot, perhaps not programmed to understand this command");			
});

bot.dialog('/Gender', [
    function (session, args) {
		builder.Prompts.choice(session, "Please select the gender.",['Men','Women']);
	},
	function (session, results) {
		session.userData.gender = results.response.entity;
        session.send('Hello %s!', session.userData.gender);
		session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	    callingApi(session.userData.path, function(data){	
		showoutput(session,data.items);	
		if(!data.items){
			session.beginDialog('/Gender');
		}else if(session.userData.type==""){
		    session.beginDialog('/Type');
		}else if(session.userData.brand==""){
		    session.beginDialog('/Brand');
		}else if(session.userData.color==""){
		    session.beginDialog('/Color');
		}else if(session.userData.size==""){
		    session.beginDialog('/Size');
		}	
    })
	}
]);

bot.dialog('/Type', [
    function (session, args) {
		builder.Prompts.choice(session, "Please select the type of shoe.",['Formal','Casual','Athletic','Any Type']);
	},
	function (session, results) {
	    session.userData.type = results.response.entity;
        if(session.userData.type == "Any Type"){
			session.userData.type = "";
		}
		session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	    callingApi(session.userData.path, function(data){	
		showoutput(session,data.items);	
		if(!data.items){
			session.beginDialog('/Type');
		}else if(session.userData.brand==""){
		    session.beginDialog('/Brand');
		}else if(session.userData.color==""){
		    session.beginDialog('/Color');
		}else if(session.userData.size==""){
		    session.beginDialog('/Size');
		}	
    })
	}
]);

bot.dialog('/Brand', [
    function (session, args) {
		builder.Prompts.choice(session, "Please select the brand.",['Nike','SKECHERS','VANS','Faded-Glory','Avia','Any Brand']);
	},
	function (session, results) {
		session.userData.brand = results.response.entity;
		if(session.userData.brand == "Any Brand"){
			session.userData.brand = "";
		}
        session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	    callingApi(session.userData.path, function(data){	
		showoutput(session,data.items);
        if(!data.items){
			session.beginDialog('/Brand');
		}else if(session.userData.color==""){
		    session.beginDialog('/Color');
		}else if(session.userData.size==""){
		    session.beginDialog('/Size');
		}			
    })
	}
]);

bot.dialog('/Color', [
    function (session, args) {
		builder.Prompts.choice(session, "Please select the color.",['Black','White','Brown','Grey','Red','Blue','Any Color']);
	},
	function (session, results) {
		session.userData.color = results.response.entity;
		if(session.userData.color == "Any Color"){
			session.userData.color = "";
		}
		session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	    callingApi(session.userData.path, function(data){	
		showoutput(session,data.items);	
		if(!data.items){
			session.beginDialog('/Color');
		}else if(session.userData.size==""){
		    session.beginDialog('/Size');
		}
    })
	}
]);

bot.dialog('/Size', [
    function (session, args) {
		builder.Prompts.choice(session, "Please select your size.",['6','7','8','9','10','11','Any Size']);
	},
	function (session, results) {
		session.userData.size = results.response.entity;
		if(session.userData.size == "Any Size"){
			session.userData.size = "";
		}
        session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	    callingApi(session.userData.path, function(data){	
		showoutput(session,data.items);	
        if(!data.items){
			session.beginDialog('/Size');
		}		
    })
	}
]);

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(process.env.port || 5000, function () {
    console.log('%s listening to %s', server.name, server.url); 
});