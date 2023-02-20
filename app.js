const { Configuration, OpenAIApi } = require("openai");
const express = require('express');
const querystring = require('querystring');
const url = require('url');
const request = require('request');
const app = express();
const fs = require('fs');

/**
 * app.get defines the behaviour of the server when
 * a certain url is being called. ('/' is root = localhost:3000 in our case)
 *
 * sendFile serves HTML pages to the user.
 * res.redirect sends the user to a new url.
 */

//landing page
app.get('/', function(req,res){
	res.sendFile(__dirname+'/home.html');
});


app.get('/openai',async function(req,res){
	const configuration = new Configuration({
		apiKey: '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',
	});

	const openai = new OpenAIApi(configuration);
	try {
		const completion = await openai.createCompletion({
  			model: "text-davinci-003",
  			prompt: "Write a haiku about insomnia.",
		});
	
		console.log(completion.data.choices[0].text);
	}catch(error) {
		console.log(error.response.status);
		console.log(error.response.data);
	}

	res.redirect('/')
})



var fnAuthCode;
var fnAccessToken;

//fortnox callback
//(exchange code for token)
app.get('/fn-callback',function(req,res){	
	const {pathname, query} = url.parse(req.url);
	const queryParams = querystring.parse(query);
	if(queryParams.code){
		fnAuthCode=queryParams.code;
		
			const options = {
                                method: 'POST',
                                url: 'https://apps.fortnox.se/oauth-v1/token',
                                headers: {
                                        'Content-Type':'application/x-www-urlencoded',
                                        'Authorization':'Basic MjJGcDM1TmlCR1VEOnBtUkhkSmRsY2w='
                                },
                                form: {
                                        'grant_type':'authorization_code',
                                        'code': fnAuthCode,
                                        'redirect_uri':'http://localhost:3000/fn-callback'
                                }
                        }
        request(options, (error,response,body)=> {
                if(error){
                        console.error(error);
                }else {
                        console.log(body);
                        const responseBody = JSON.parse(body);
                        fnAccessToken = responseBody.access_token;
                }
        })

	}
		res.redirect('/');
})

//fortnox OAuth
app.get('/fn-oauth', function(req,res){
	//return to landing page after auth
	res.redirect('https://apps.fortnox.se/oauth-v1/auth?client_id=22Fp35NiBGUD&redirect_uri=http://localhost:3000/fn-callback&scope=companyinformation&state=somestate&access_type=offline&response_type=code&account_type=service');
});

//fortnox info
app.get('/fn-info', function(req,res){
const options = {
                method: 'GET',
                url: 'https://api.fortnox.se/3/companyinformation',
                headers: {
                        'Authorization':"Bearer "+fnAccessToken
                }
        }
        
        request(options, (error, response, body)=> {
                if(error){
                        console.error(error)
                } else {
			//TODO handle fortnox information
                        console.log(body);
                }
        })
	res.redirect('/');
});














var hsAuthCode;
var hsAccessToken;

//hubspot callback
//(exchange code for token)
app.get('/hs-callback',function(req,res){
        const {pathname, query} = url.parse(req.url);
        const queryParams = querystring.parse(query);
        if(queryParams.code){
                hsAuthCode=queryParams.code;

                        const options = {
                                method: 'POST',
                                url: 'https://api.hubapi.com/oauth/v1/token',
                                headers: {
                                        'Content-Type':'application/x-www-urlencoded'
                                },
                                form: {
                                        'grant_type':'authorization_code',
					'client_id': CLIENT_ID, //TODO replace
					'client_secret':CLIENT_SECRET, //TODO replace
                                        'code': hsAuthCode,
                                        'redirect_uri':'http://localhost:3000/hs-callback'
                                }
                        }
        request(options, (error,response,body)=> {
                if(error){
                        console.error(error);
                }else {
                        console.log(body);
                        const responseBody = JSON.parse(body);
                        hsAccessToken = responseBody.access_token;
                }
        })

        }
                res.redirect('/');
})


//hubspot OAuth
app.get('/hs-oauth',function(req,res){
	//build the authurl
	const authUrl =
  	'https://app.hubspot.com/oauth/authorize' +
  	`?client_id=${encodeURIComponent(CLIENT_ID)}` + 	//TODO replace
  	`&scope=${encodeURIComponent(SCOPES)}` +		//TODO replace
  	`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`; +	//TODO replace
 	`&state=${encodeURIComponent(STATE)}`;			//TODO replace

	// Redirect the user
	res.redirect(authUrl);
});

//hubspot info
app.get('/hs-info', function(req,res){
const options = {
                method: 'GET',
                url: 'https://api.hubspot.com/crm/v3/objects/contacts',
                headers: {
                        'Authorization':"Bearer "+hsAccessToken,
			'Content-Type':'application/json'
                }
        }

        request(options, (error, response, body)=> {
                if(error){
                        console.error(error)
                } else {
			//TODO handle hubspot information
                        console.log(body);
                }
        })
        res.redirect('/');
});













// Start server on port 3000
app.listen(3000,function(req,res){
	console.log('Server started at http://localhost:3000');
})
