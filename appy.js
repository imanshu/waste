var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var sess = require('client-sessions')
sess.maincart = [];
sess.number = 0;

var FRONTEND_URL = 'https://helloworldbot12.azurewebsites.net' || 'https://localhost:5000';

WishMe = function(){
	var currentTime = new Date();
	var currentOffset = currentTime.getTimezoneOffset();
	var ISTOffset = 330;   // IST offset UTC +5:30 
	var myDate = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
    if (myDate.getHours()>4 && myDate.getHours() < 12 ){ 
    return "Good Morning!"
	} else if (myDate.getHours() >= 12 && myDate.getHours() <= 17 ) { 
	return "Good Afternoon!"; 
	} else if ( myDate.getHours() > 17 && myDate.getHours() <= 24 ) { 
	return "Good Evening!";
	}else {
		return "I guess it is very late now, Anyway"
	} 
};

promptThis = function(session){ 
        if(session.userData.gender==""){
			builder.Prompts.choice(session, "Please select the gender.",['Men','Women']);
		}else if(session.userData.type==""){
			builder.Prompts.choice(session, "Please select the type of shoe.",['Dress','Casual','Athletic']);
		}else if(session.userData.brand==""){
			session.beginDialog('/Brand');
		}else if(session.userData.color==""){
			builder.Prompts.choice(session, "Please select the color.",session.userData.colors);
		}else if(session.userData.size==""){
			builder.Prompts.choice(session, "Please select the size.",session.userData.sizes);
		}
}

deleteSpace = function(string){
	var i = 1;
	while(i>0){
    i = string.indexOf(' ');
    if(i>0){
    string = string.substring(0, i) + string.substring(i+1, string.length);
    }
	}
	return string
}

removeSpace = function(string){
    var i = string.indexOf(' ');
    if(i>0){
    string = string.substring(0, i) + "%20" + string.substring(i+1, string.length);
    }
    var j = string.indexOf('\'');
	if(j>0){
		string = string.substring(0, j) + "%27" + string.substring(j+1, string.length);
	}
    return string;
}

choose_cat = function(gender, type){
	    if (gender == "Women" && type == "Athletic"){
		    category = "5438_1045804_1045806_1228540"
	    }else if (gender == "Women" && type == "Casual"){
		    category = "5438_1045804_1045806_1228545"
	    }else if (gender == "Women" && ((type == "Formal")||(type == "Dress"))){
		    category = "5438_1045804_1045806_1228546"
	    }else if (gender == "Women" && type == ""){
		    category = "5438_1045804_1045806"
	    }else if (gender == "Men" && type == "Athletic"){
		    category = "5438_1045804_1045807_1228548"
	    }else if (gender == "Men" &&  type == "Casual"){
		    category = "5438_1045804_1045807_1228552"
	    }else if (gender == "Men" && ((type == "Formal")||(type == "Dress"))){
		    category = "5438_1045804_1045807_1228553"
	    }else if (gender == "Men" && type == ""){
		    category = "5438_1045804_1045807"
	    }else{
		    category = "5438_1045804"}
	return category;
}

capitalize = function(str) {
    if(str != "dress"){
	if (str !== null && str.length > 0 && (str.charAt(str.length-1)=='s')||(str.charAt(str.length-1)=='S')){
	str = str.substring(0, str.length-1);
	}}
	str = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	return str;
}

addCart = function(session, data){	
	sess.maincart[sess.number] = { "title"    : data.name,
					               "subtitle" : data.salePrice + '$',
					               "image_url": data.thumbnailImage ,
								   "buttons":[
                                             {
                                                "type":"postback",
												"payload": data.salePrice + " removeitem",
                                                "title":"Remove item"
                                             }  ]
	               }
  	session.userData.cartItem = sess.maincart;
	sess.number += 1;
	session.send("This item is been added to cart");
}

showItem = function(session, data){
	session.send("Sure, Have a look here");
	var item = new builder.Message(session)
				.attachments([
				new builder.HeroCard(session)
		               .title(data.name)
					   .subtitle(data.salePrice + '$' )
				       .images([
					      builder.CardImage.create(session, data.largeImage),
				         ])
				       .buttons([
					       builder.CardAction.postBack(session, "additem "+ parseInt(data.itemId) +" to cart","Add to Cart"),
						   builder.CardAction.postBack(session, "Show more", "Show more"),
						])
				       ]);
	session.send(item);
}

showoutput = function(session,data){
	session.sendTyping();
	var i=0;
	var card = [];
	if(!data.items){
		session.send("Try another search. No product exists.")
		session.endDialog();
	}else{
		while(data.items[i]){
		card[i] =  new builder.HeroCard(session)
		               .title(data.items[i].name)
					   .subtitle(data.items[i].salePrice + '$')
				       .images([
					       builder.CardImage.create(session, data.items[i].thumbnailImage) 
				       ])
				       .buttons([
					       builder.CardAction.postBack(session, "showitem  "+ parseInt(data.items[i].itemId),"Show item"),
				       ])
				i++;
				}
		if(data.items[9] !== undefined){	
		card[i] = new builder.HeroCard(session)
                      .subtitle('Want to see Similar kind of shoes? Click below')
                      .buttons([
					       builder.CardAction.imBack(session, "Show more", "Show more"),
				       ])
		}
		session.userData.colors = colorsArray(session, data);
		session.userData.brands = brandsArray(session, data);
		session.userData.sizes = sizesArray(session, data);
		var msg = new builder.Message(session)
				.attachmentLayout(builder.AttachmentLayout.carousel)
				.attachments(card);
				session.send(msg);
	}			
}

brandsArray = function(session,data){
    brands = [];	
	var j=0;
	var k=0;
	while(data.facets[j]){
	if(data.facets[j].name == "brand"){
		while((data.facets[j].facetValues[k])&&(k<9)){
			brands[k] = data.facets[j].facetValues[k].name;
			k++;						
			}
		break;
	}
	j++;
	}
	brands.push("Any Brand");
	return brands;
}

sizesArray = function(session,data){
    sizes = [];	
	var j=0;
	var k=0;
	while(data.facets[j]){
	if(data.facets[j].name == "shoe_size"){
		while((data.facets[j].facetValues[k])&&(k<9)){
			sizes[k] = data.facets[j].facetValues[k].name;
			k++;						
			}
		break;
	}
	j++;
	}
	sizes.push("Any Size");
	return sizes;
}

colorsArray = function(session,data){
    colors = [];	
	var j=0;
	var k=0;
	while(data.facets[j]){
	if(data.facets[j].name == "color"){
		while((data.facets[j].facetValues[k])&&(k<9)){
			colors[k] = data.facets[j].facetValues[k].name;
			k++;						
			}
		break;
	}
	j++;
	}
	colors.push("Any Color");
	return colors;
}

callingApi = function(path, callback){
	console.log(path);
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
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/42a438e9-722e-4f2b-933b-02f3f862f57c?subscription-key=ef7d814726e342358583d833f37aaf9a&verbose=true&q=');
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

// Handling Greeting intent.
dialog.matches('Greeting', function (session, args) {
	console.log ('in greeting intent');	
	var username = session.message;
	session.send("Hello " +username.address.user.name+ ". " +WishMe());
	if(session.userData.cartItem !== undefined){
	sess.maincart = session.userData.cartItem ;
	sess.number = session.userData.cartItem.length;
	}
	session.send("Welcome to the Walmart Digital Shoe Bot!!!. What are you looking for today?");
	session.userData = {
		shoe:  "",
		gender:"",
		brand: "",
		color: "",
		type:  "",
		size:  "",
		path:  "",
		num:   0,
		subtotal: 0.0,
		shipping: 0.0,
		tax: 0.0,
		total: 0.0,
		brands: [],
		colors: [],
		sizes: [],
		cartItem: []
	};
	session.endDialog();
});

// Handling the ShoeSearch intent. 
dialog.matches('ShoeSearch', function (session, args, next) {
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
		brand: brand ? brand.entity : "",
		color: color ? capitalize(color.entity) : "",
		type: type ? capitalize(type.entity) : "",
		size: size ? size.entity : "",
    };
	if(session.userData.brand=="nike"){ session.userData.brand = "Nike"; }
	if(session.userData.brand=="puma"){session.userData.brand = "PUMA";}
	if(session.userData.brand=="reebok"){session.userData.brand = "Reebok";}
	if(session.userData.brand=="skechers"){session.userData.brand = "SKECHERS";}
	if(session.userData.brand=="vans"){session.userData.brand = "VANS";}
	if(session.userData.brand=="avia"){session.userData.brand = "Avia";}
	if(session.userData.brand=="asics"){session.userData.brand = "ASICS";}
	if((session.userData.brand=="danskin")||(session.userData.brand== "now")){session.userData.brand = "Danskin Now";}
	if((session.userData.brand=="new")||(session.userData.brand=="balance")){session.userData.brand = "New Balance";}
	if(session.userData.brand=="puma"){session.userData.brand = "PUMA";}
	if(session.userData.cartItem !== undefined){
	sess.maincart = session.userData.cartItem;
	sess.number = session.userData.cartItem.length;
	}
	if(session.userData.cartItem === undefined){
	session.userData.cartItem = sess.maincart;
	}
    removeSpace(session.userData.brand);
	session.userData.page = 0;
	if(session.userData.gender == ''){
		session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query="+ session.userData.type+ "shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	}else{
	    session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	}
	
	//session.send('Hello there! I am the shoe search bot. You are looking for %s %s %s %s for %s of size %s',session.userData.brand,session.userData.type,session.userData.color,session.userData.shoe,session.userData.gender,session.userData.size);		
	callingApi(session.userData.path, function(data){	
		showoutput(session,data);
		promptThis(session);
		if((session.userData.gender == "")|| (session.userData.type == "")){
		     session.endDialog();
		}else if(session.userData.brand != ""){
		session.endDialog();
	    }	
	})   	
})

