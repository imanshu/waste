var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var sess = require('client-sessions')
sess.maincart = [];
sess.number = 0;

WishMe = function(){
	var currentTime = new Date();
	var currentOffset = currentTime.getTimezoneOffset();
	var ISTOffset = 330;   // IST offset UTC +5:30 
	var myDate = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
    if (myDate.getHours()>4 && myDate.getHours() < 12 ){ 
    return "Good Morning!"
	} else if (myDate.getHours() >= 12 && myDate.getHours() < 16 ) { 
	return "Good Afternoon!"; 
	} else if ( myDate.getHours() >= 16 && myDate.getHours() <= 24 ) { 
	return "Good Evening!";
	}else {
		return "I guess it is very late now, Anyway"
	} 
};

promptThis = function(session){ 
        if(session.userData.gender==""){
			builder.Prompts.choice(session, "Please select the gender.",['Men','Women']);
		}else if(session.userData.type==""){
			builder.Prompts.choice(session, "It is very important to dress according to the occasion or the work you do. So what kind of shoe are you looking for?",['Dress','Casual','Athletic']);
		}else if(session.userData.brand==""){
			session.beginDialog('/Brand');
		}else if(session.userData.color==""){
			builder.Prompts.choice(session, "Please select the color.",session.userData.colors);
		}else if(session.userData.size==""){
			builder.Prompts.choice(session, "What is the size you are looking for?",session.userData.sizes);
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
	if(string !== undefined){
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
												"payload": data.salePrice + " remove item",
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
					   .subtitle(data.salePrice + '$, Customer Rating: '+data.customerRating+ ', Stock: '+data.stock )
				       .images([
					      builder.CardImage.create(session, data.largeImage),
				         ])
				       .buttons([
					       builder.CardAction.postBack(session, "add item "+ parseInt(data.itemId) +" to cart","Add to Cart"),
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
					       builder.CardAction.postBack(session, "show item "+ parseInt(data.items[i].itemId),"Show item"),
						   builder.CardAction.postBack(session, "add item "+ parseInt(data.items[i].itemId) +" to cart","Add to Cart")
				       ])
			    console.log("show item "+ parseInt(data.items[i].itemId));
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

weatherApi = function(place, callback){
    var options = {
		host: 'api.openweathermap.org',
		path: '/data/2.5/weather?q=' +place+ '&appid=13a673ce300c31edc72ac96ecbe062b4',
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
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/7728bcc7-ea06-471d-b189-0c09e796dc66?subscription-key=a544e8e344c947bbb85eb434961aea87&verbose=true&q=');
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

// Handling the Greeting intent. 
dialog.matches('Welcome', function (session, args, next) {
	console.log ('in welcome intent');	
	var username = session.message;
	session.send("Hello " +username.address.user.name+ ". " +WishMe());
	session.send("Can I help you in anything. Feel free to ask");
	if(session.userData.cartItem !== undefined){
	sess.maincart = session.userData.cartItem ;
	sess.number = session.userData.cartItem.length;
	}
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
		cartItem: [],
	    ocassion: ""
	};
	session.endDialog();
})

dialog.matches('Vacation', function (session, args, next) {
	console.log ('in vacation intent ');
	var vacation = builder.EntityRecognizer.findEntity(args.entities, 'Vacation');
	var place = builder.EntityRecognizer.findEntity(args.entities, 'Vacation::country'); 
	session.userData = {
		vacation: vacation ? vacation.entity : "",
		place: place ? place.entity : "",
		ocassion: "vacation"
    };
	if(session.userData.vacation == ""){
	if(session.userData.place != ""){ session.userData.vacation = "vacation"; }}
	if(session.userData.place == ""){
		session.beginDialog("/Ask Place");
	}else {
			session.send(session.userData.place + " is a beautiful place to go for a " +session.userData.vacation+ ".");
			session.beginDialog("/RecommendVac");
	}	
})
 
bot.dialog('/Ask Place', function (session, args) {
		console.log("in Ask place dialog");
	    session.send("A "+session.userData.ocassion);
		session.send("That's nice. Where are you going to?");
		session.endDialog();
});

bot.dialog('/RecommendVac', function (session, args) {
		console.log("in recommend dialog");
		weatherApi(session.userData.place, function(weather){
			var temp = parseInt(parseInt(weather.main.temp_max)-273);
			if(temp<=20){
				session.userData.temp = "cold";
				session.send(session.userData.place+ " is a very cold place. At this time in the year, there the temperature will be usually near to "+(parseInt(temp/10))*10 +'\xB0C');
			    session.send("Would you like me to recommend some necessary things you will be needing?")
		    }else if(temp>=25){
				session.userData.temp = "hot";
				session.send(session.userData.place+ " is a hot place. At this time in the year, there the temperature will be usually near to "+((parseInt((temp/10))*10)+10) +'\xB0C');
			    session.send("Would you like me to recommend some necessary things you will be needing?")
		    }
			
	    });
		session.endDialog();
});

dialog.matches('Office', function (session, args, next) {
	console.log ('in office intent ');
	var office = builder.EntityRecognizer.findEntity(args.entities, 'Office');
	var place = builder.EntityRecognizer.findEntity(args.entities, 'Vacation::country'); 
	session.userData = {
		office: office ? office.entity : "",
		place: place ? place.entity : "",
		ocassion: "office"
    };
	session.send("Cool, Dressing professionally is vital for success in an office. We will help you look formal in your " +session.userData.office+".");
	session.beginDialog("/Recommend");
})

dialog.matches('Sports', function (session, args, next) {
	console.log ('in sports intent ');
	var sports = builder.EntityRecognizer.findEntity(args.entities, 'Sports');
	var game = builder.EntityRecognizer.findEntity(args.entities, 'Sports::Games'); 
	session.userData = {
		sports: sports ? sports.entity : "",
		game: game ? game.entity : "",
		ocassion: "sports"
    };
	if(session.userData.sports == ""){
	if(session.userData.game != ""){ session.userData.sports = "sports"; }}
	if(session.userData.game == ""){
		session.beginDialog("/Ask Game");
	}else {
	session.send("We know what are the required things for the "+session.userData.game+" competition.");
	session.beginDialog("/Recommend");
	}
})

bot.dialog('/Ask Game', function (session, args) {
		console.log("in Ask game dialog");
		session.send("Which "+session.userData.sports+" or game, are you going to play?");
		session.endDialog();
});

dialog.matches('Gym', function (session, args, next) {
	console.log ('in gym intent ');
	var gym = builder.EntityRecognizer.findEntity(args.entities, 'Gym');
	session.userData = {
		gym: gym ? gym.entity : "",
		ocassion: "gym"
    };
	session.send(session.userData.gym+" is a must to live a healthy and a long life.");
	session.beginDialog("/Recommend");
})

bot.dialog('/Recommend', function (session, args) {
		console.log("in recommend dialog");
		session.send("Would you like me to recommend some necessary things you will be needing?")
		session.endDialog();
});

dialog.matches('Yes', function (session, args) {
	session.beginDialog('/' +session.userData.ocassion);
})

dialog.matches('No', function (session, args) {
	session.send('OK, What are you looking for?');
	session.endDialog();
})

bot.dialog('/vacation', function (session, args) {
	session.send("Make your vacation more memorable and safe by taking all the items that are shown below");
	if(session.userData.temp == "cold"){
		session.send("1. Base layer shirt with long-sleeves");
        session.send("2. Winter Coat/Jacket, should be water resistant");		
		session.send("3. Walking/Hiking Boots with Woollen Socks");   
		session.send("4. Other accessories like gloves, a scarf and a hat");
		if(session.userData.vacation == "treking"){session.send("5. A Treking shoe");}
		session.send("So, What do you want to look at?");
		session.endDialog();
	}else if(session.userData.temp == "hot"){
		session.send("1. Sun Glasses"); 
		session.send("2. Dress/Running Shoes and Sandals"); 
		session.send("3. Sun Hat with light/thin Scarf"); 
		session.send("4. Other accessories like Sunscreen, Insulated Water Bottle, A towel and Light material clothes");
		session.send("So, What do you want to look at?");
		session.endDialog();
	}
})

bot.dialog('/office', function (session, args) {
	if((session.userData.office == "office")||(session.userData.office =="work")){
		session.send("If your office does not have written dress code, 'Business Casuals' is a better option for work.  \nHave a look at these, just in case you might be needing");
		session.send("1.  Shirts that have collars");
		session.send("2. Dress pants/ Khakis/ Trousers"); 
		session.send("3. Dress shoes with dress socks"); 
		session.send("4. Pairing Sweater vest"); 
		session.send("5. Other accessories like tie, belt and a watch");
		session.send("So, What do you want to look at?");
		session.endDialog();
	}else if(session.userData.office == "conference"){
		session.send("Firstly Verify whether or not the conference you attend has any guidelines for dress.  \nHere is the list of few things we are thinking that you might need.");
		session.send("1. Blazer / Sports Jacket");
		session.send("2. Dress Pants / Khakis"); 
		session.send("3. Collared shirt or Polo shirt"); 
		session.send("4. Dress Shoes with matching socks"); 
		session.send("5. Other accessories like tie, belt and a watch");
		session.send("So, What do you want to look at?");
		session.endDialog();
	}
})

bot.dialog('/sports', function (session, args) {
		session.send("I wish Best of luck for the coming "+session.userData.game+" competiton.");
		session.send("1. Sports costume for "+session.userData.game);
		session.send("2. Sports Shoe with socks"); 
		session.send("3. Other accessories like towel, energy drink, water bottle.");
		session.send("So, What do you want to look at?");
		session.endDialog();
})

bot.dialog('/gym', function (session, args) {
	    session.send("“It’s dangerous to go alone ;) .  Take this.”");
		session.send("1. Light weight and supportive shoe and socks.  you may prefer lifting shoes to traditional cross-trainers or running shoes.");
		session.send("2. Any breathable, well-fitted clothing. Shorts and Tshirts"); 
		session.send("3. A gym bag"); 
		session.send("4. Music Headphones/ipod"); 
		session.send("5. Other accessories like water-bottle, Towel, Sweat bands etc., ");
		session.send("So, What do you want to look at?");
		session.endDialog();
})

// Handling the ShoeSearch intent. 
dialog.matches('ShoeSearch', function (session, args, next) {
	if(session.userData.shoe !== undefined){session.dialogData = session.userData;}
	else {
		session.dialogData = {
			shoe:  "",
			gender:"",
			brand: "",
			color: "",
			type:  "",
			size:  ""
		}
	}
	console.log ('in shoesearch intent ');
	var shoe = builder.EntityRecognizer.findEntity(args.entities, 'Shoe');
	var gender = builder.EntityRecognizer.findEntity(args.entities, 'Gender');
	var brand = builder.EntityRecognizer.findEntity(args.entities, 'Shoe::Shoe_brand');
	var color = builder.EntityRecognizer.findEntity(args.entities, 'Color');
	var type = builder.EntityRecognizer.findEntity(args.entities, 'Shoe::Shoe_type');
	var size = builder.EntityRecognizer.findEntity(args.entities, 'builtin.number');
	session.userData = {
		shoe  : shoe   ? shoe.entity               : session.dialogData.shoe ,
		gender: gender ? capitalize(gender.entity) : session.dialogData.gender,
		brand : brand  ? brand.entity              : session.dialogData.brand,
		color : color  ? capitalize(color.entity)  : session.dialogData.color,
		type  : type   ? capitalize(type.entity)   : session.dialogData.type,
		size  : size   ? size.entity               : session.dialogData.size,
    };
	if(session.userData.brand=="nike"){ session.userData.brand = "Nike"; }
	if(session.userData.brand=="puma"){session.userData.brand = "PUMA";}
	if(session.userData.brand=="reebok"){session.userData.brand = "Reebok";}
	if(session.userData.brand=="skechers"){session.userData.brand = "SKECHERS";}
	if(session.userData.brand=="vans"){session.userData.brand = "VANS";}
	if(session.userData.brand=="avia"){session.userData.brand = "Avia";}
	if(session.userData.brand=="asics"){session.userData.brand = "ASICS";}
	if((session.userData.brand=="danskin now")||(session.userData.brand== "now")){session.userData.brand = "Danskin Now";}
	if((session.userData.brand=="new balance")||(session.userData.brand=="balance")){session.userData.brand = "New Balance";}
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
	
	callingApi(session.userData.path, function(data){	
		showoutput(session,data);
		if((session.userData.gender != "")&&(session.userData.type != "")){
			if(session.userData.brand == ""){
				promptThis(session);
			}else {
				promptThis(session);
				session.endDialog();
			}
		}else {
				promptThis(session);
				session.endDialog();
		}
	})   	
})

dialog.matches('Property Show', function (session, args, next) {
	var property = builder.EntityRecognizer.findEntity(args.entities, 'Property');
	if((property.entity == "brand") || (property.entity == "brands")){
		session.send("Ok, Let me show you what all brands available ")
		session.beginDialog('/Brand');
	}else {
		session.send("We have a wide color range of shoes.");
		builder.Prompts.choice(session, "Please select the color.",session.userData.colors);
		session.endDialog();
	}	
})

dialog.matches('Color', function (session, args, results) {
	console.log("in color intent");
	var color = builder.EntityRecognizer.findEntity(args.entities, 'Color');
	var any =  builder.EntityRecognizer.findEntity(args.entities, 'Any');
	session.userData.color = color ? capitalize(color.entity) : "";
	session.userData.page = 0;
	session.send("Cool. You have got a good taste.")
	if(any){
			session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	}else {
	        session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	}
	callingApi(session.userData.path, function(data){	
	showoutput(session,data);
	promptThis(session);
	    session.endDialog();
	})
})

dialog.matches('Size', function (session, args, results) {
	console.log("in size intent");
	var size = builder.EntityRecognizer.findEntity(args.entities, 'builtin.number');
	var any =  builder.EntityRecognizer.findEntity(args.entities, 'Any');
	session.userData.size = size ? size.entity : "";
	session.userData.page = 0;
	session.send("Wow.. ok, I will show you what we have got");
	if(any){
			session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:&format=json&start=1&numItems=10";
	}else {
	        session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
	}
	callingApi(session.userData.path, function(data){	
	showoutput(session,data);
	promptThis(session);
	if(!data.items){
		session.endDialog();
	}else if(data.items[9] === undefined){
		session.send("End of Results");
		session.endDialog();
			    }
	session.endDialog();
	})
})

dialog.matches('Show Item', function (session, args, results) {
	console.log("in show item intent");
	var itemId = builder.EntityRecognizer.findEntity(args.entities, 'builtin.number');
	session.userData.itemId = itemId ? itemId.entity : "";
	session.userData.path = "/v1/items/" + session.userData.itemId + "?apiKey=ve94zk6wmtmkawhde7kvw9b3&format=json"
	callingApi(session.userData.path, function(data){	
	showItem(session,data);
	if(session.userData.cartItem !== undefined){
	sess.maincart = session.userData.cartItem ;
	sess.number = session.userData.cartItem.length;
	}
	session.endDialog();
	})
})

dialog.matches('Add Cart', function (session, args, results) {
	console.log("in add cart intent");
	var itemId = builder.EntityRecognizer.findEntity(args.entities, 'builtin.number');
	session.userData.itemId = itemId ? itemId.entity : "";
	session.userData.path = "/v1/items/" + session.userData.itemId + "?apiKey=ve94zk6wmtmkawhde7kvw9b3&format=json"
	if(itemId){
	if(session.userData.cartItem.length > 3){
		session.send("Maximum 3 items can be added in cart once");
		builder.Prompts.choice(session, "Check your cart",['Show cart']);
		session.endDailog();
	}else {
		callingApi(session.userData.path, function(data){	
		addCart(session,data);
		builder.Prompts.choice(session, "Select any one option",['Show cart','Continue Shopping']);
		session.endDialog();
		})
	}
	}else {
		session.send("Sorry, cannot add item to cart");
		session.endDialog();
	}
})

dialog.matches('Show Cart', function (session, args, results) {
	console.log("in show cart intent");
	if(session.userData.cartItem.length === 0){
		session.userData.cartItem = sess.maincart;
	}
	if(session.userData.cartItem.length == 0) { 
		var message = new builder.Message(session)
		             .attachments([
				      new builder.HeroCard(session)
		                 .title("Your shopping cart is empty")
					     .buttons([
					         builder.CardAction.postBack(session, "Hii","Continue shopping")
						  ])
					])
     	session.send(message);					
	}else {
		var tax = 0.0, tax1 = 0.0,total = 0.0, shipping = 0.0, subtotal = 0.0, subtotal1 = 0.0, i = 0;
		var str = "";
		while(session.userData.cartItem[i]){
			str = session.userData.cartItem[i].subtitle;
			str = str.substring(0, str.length-1);
			subtotal1 += parseFloat(str);
			i++;
			}
			subtotal = parseFloat(subtotal1).toFixed(2);
			if(subtotal <= 35){
				shipping = 5.99;
				}
			tax1 = 0.085 * subtotal;
			tax = parseFloat(0.085 * subtotal).toFixed(2);
			total = parseFloat(subtotal1+tax1+shipping).toFixed(2);
			session.userData = {
				subtotal: subtotal,
				shipping: shipping,
				tax: tax,
				total: total
				}
			sess.maincart[sess.number] = { "title"    : "Total: " +total.toString()+ "$",
					                       "subtitle" : "subtotal: " +subtotal.toString()+ "$ , shipping: " +shipping.toString()+ "$ , tax: " +tax.toString()+ "$",
	                                      }
            session.userData.cartItem = sess.maincart;
			if(session.userData.cartItem.length < 5){
				var message = new builder.Message(session)
                      .sourceEvent({
				        facebook: {
                          "attachment":{
                             "type":"template",
                             "payload":{
                                "template_type":"list",
								 "top_element_style": "compact",
                                "elements":JSON.stringify(session.userData.cartItem, null, 4),
								"buttons": [
                                               {
                                                "type":"postback",
                                                "title":"Check out all items",
                                                "payload":"Check out"
                                             } 
                                ]  
					         }
				         }
			          }
			       })
			    session.send(message);
				}
	}
    session.userData.cartItem.splice(-1,1);	
	session.endDialog();
})

dialog.matches('Remove Cart', function (session, args, results) {
	console.log("in remove item cart intent");
	var num = builder.EntityRecognizer.findEntity(args.entities, 'builtin.number');
	var arrayNum = num ? num.entity : "";
	var i = 0;
	if(session.userData.cartItem[0] == null){
		session.send("No item in your cart");
	}else{
        while(session.userData.cartItem){
			if(session.userData.cartItem[i].subtitle == (arrayNum+'$')){
				console.log("iffff");
				session.userData.cartItem.splice(i,1);
				sess.maincart.splice(i,1);
				sess.number -= 1;
				session.send("Item removed from the cart");
	            builder.Prompts.choice(session, "Check our cart.",['show cart']);
				break;
			}
			i++;
		}
	}
	session.endDialog();
})
	
dialog.matches('Show more', function (session, args) {
	session.userData.page += 1;
	session.send("Of course, These are some more similar kind of shoes");
	        if(session.userData.size == "any"){
				if(session.userData.color == "any"){
					session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:&format=json&start=" +session.userData.page+ "1&numItems=10";
			    }else {
			          session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:&format=json&start=" +session.userData.page+ "1&numItems=10";
			    }
			}else if(session.userData.color == "any"){
					session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=" +session.userData.page+ "1&numItems=10";
			}else {
			session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start="+ session.userData.page +"1&numItems=10";
			}
			callingApi(session.userData.path, function(data){
				showoutput(session,data);
				if(!data.items){
		            session.endDialog();
	            }else if(data.items[9] === undefined){
					session.send("End of Results");
					session.endDialog();
			    }
				promptThis(session);
				session.endDialog();
			})
})

dialog.matches('Buy', [
    function(session, args){
		console.log("in buy intent");
		session.send(" Here is your profile details: ");
		session.send("Name: Mr. Stephane Crozatier");
		session.send(" Email: coolstephane@abc.xyz ");
		session.send("Contact: 9876543210");
		builder.Prompts.choice(session, "Continue as Stephane",['Continue','Cancel']);
	},
	function(session, results){
		 if (results.response.entity != 'Cancel' ) {
			 session.send("OK, we found two saved addresses");
		     builder.Prompts.choice(session, "Please select one address",['Work address','Home address','Cancel']);
		}else {
			session.endDialog();
		}
	},
	function(session, results){
		 if (results.response.entity != 'Cancel') {
			 session.send("OK Stephane, we will ship it to your %s", results.response.entity);
			 builder.Prompts.choice(session, "select shipping method",["Normal shipping(6-7 days) - normal shipping cost", "Fedex(nextday delivery)- extra $5", "USPS(2-3 days delivery)- extra $3",'Cancel']);
		 }else {
			session.endDialog();
		}
	},
	function(session, results){
		if (results.response.entity != 'Cancel') {
			if(results.response.entity == "Fedex(nextday delivery)- extra $5"){session.userData.shipping += 5;}
			if(results.response.entity == "USPS(2-3 days delivery)- extra $3"){session.userData.shipping += 3;}
			builder.Prompts.choice(session, "Select card for payment",['VISA 1234','Cancel']);
		}else {
			session.endDialog();
		}
	},
	function(session, results){
		if (results.response.entity != 'Cancel') {
		builder.Prompts.number(session, "Give security number of your card VISA 1234");
		}else {
			session.endDialog();
		}
	},
	function(session, results){
		if (results.response) {
		var time = Math.floor(Date.now()/1000);
		var timeStamp = time.toString();
		var i = 0, j = 0;
		var receipt= [];
		var str = "";
		var subtotal = [];
		while(session.userData.cartItem[j]){
			str = session.userData.cartItem[j].subtitle;
			str = str.substring(0, str.length-1);
			subtotal[j] = parseFloat(str).toFixed(2);
			j++;
			}
		while(session.userData.cartItem[i]){
			receipt[i] = {
                            "title": session.userData.cartItem[i].title,
                            "quantity":1,
                            "price": subtotal[i],
                            "currency": "USD",
                            "image_url":session.userData.cartItem[i].image_url
                          }
			i++;
			}
		session.send("Payment successfull!!");
		session.send("Please check your reciept");
		var msg = new builder.Message(session)
            .sourceEvent({
                facebook: {
					"attachment":{
                      "type":"template",
                      "payload":{
                        "template_type":"receipt",
                        "recipient_name":"Stephane Crozatier",
                        "order_number":"12345678902",
                        "currency":"USD",
                        "payment_method":"Visa 1234", 
                        "merchant_name": "Walmart",		
                        "order_url":"http://petersapparel.parseapp.com/order?order_id=123456",
                        "timestamp": timeStamp, 
                        "elements": JSON.stringify(receipt, null, 4),
                        "address":{
                          "street_1":"1 Hacker Way",
                          "street_2":"",
                          "city":"Menlo Park",
                          "postal_code":"94025",
                          "state":"CA",
                          "country":"US"
                        },
                        "summary":{
                          "subtotal"      : session.userData.subtotal,
                          "shipping_cost" : session.userData.shipping,
                          "total_tax"     : session.userData.tax,
                          "total_cost"    : session.userData.total
                        },
                        "adjustments":[
                         {
                            "name"  : "New Customer Discount",
                            "amount": 20
                         },
                         {
                            "name"  : "$10 Off Coupon",
                            "amount": 10
                         }
					]
				}
			}
		  }
		});	
		session.send(msg);
		session.beginDialog("/Clear all");
		}
	}
])
 
bot.dialog('/Clear all', function(session, results){
		session.send("Thank you for shopping.");
		sess.maincart = [];
		session.userData.cartItem = [];
		session.endDialog();
})
	
bot.dialog('/Brand', [
	function (session, args) {
		console.log("in brand dialog");
		builder.Prompts.choice(session, "Please select the brand.",session.userData.brands);
	},
	function (session, results) {
		session.userData.brand = results.response.entity;
		session.send("Awesome. Have a look at these.")
		if(session.userData.brand == "Any Brand"){
			session.userData.brand = "";
		}
		session.userData.brand = removeSpace(session.userData.brand);
		session.userData.path = "/v1/search?apiKey=ve94zk6wmtmkawhde7kvw9b3&query=shoes&categoryId="+ choose_cat(session.userData.gender,session.userData.type) +"&facet=on&facet.filter=gender:"+ session.userData.gender +"&facet.filter=color:"+ session.userData.color +"&facet.filter=brand:"+ session.userData.brand +"&facet.filter=shoe_size:"+ session.userData.size +"&format=json&start=1&numItems=10";
		callingApi(session.userData.path, function(data){	
			showoutput(session,data);
			promptThis(session);
			session.endDialog();
		})
	}
]);

dialog.matches('End Conversation', function (session, args) {
	session.send("Thank you for checking in, Hope I helped you.");
	session.send("Come back again");
	session.userData = {
		shoe:  "",
		gender:"",
		brand: "",
		color: "",
		type:  "",
		size:  ""
	};
	session.endDialog();
})

// Handling unrecognized conversations.
dialog.matches('None', function (session, args) {
	console.log ('in none intent');	
	session.send("I am sorry! I am a bot, perhaps not programmed to understand this command");
    session.endDialog();	
});

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(process.env.port || 5000, function () {
    console.log('%s listening to %s', server.name, server.url); 
});