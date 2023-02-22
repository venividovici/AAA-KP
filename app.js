const { Configuration, OpenAIApi } = require("openai");
const express = require("express");
const querystring = require("querystring");
const url = require("url");
const request = require("request");
const app = express();
const fs = require("fs");
app.use("/images", express.static("images"));

//Import of scripts
const fortnox = require("./scripts/fortnox");

//Set engine
app.set("view engine", "ejs");

/**
 * app.get defines the behaviour of the server when
 * a certain url is being called. ('/' is root = localhost:3000 in our case)
 *
 * sendFile serves HTML pages to the user.
 * res.redirect sends the user to a new url.
 */

//landing page
app.get("/", function (req, res) {
  res.render("pages/welcome", {});
});

//test users
const user = {
  firstName: "Frida",
};

var isTrue = false;

//welcome page
app.get("/welcome", function (req, res) {
  res.redirect("/");
});

//authenticate page
app.get("/authenticate", function (req, res) {
  res.render("pages/authenticate", {
    isHsEnabled: !hsAuthCode,
    isFnEnabled: !fnAuthCode,
  });
});

//output page
app.get("/output", function (req, res) {
  res.render("pages/output", {
    dataInfo: JSON.stringify(hsResponse + fnResponse),
    isLoading: false,
  });
});

//loading page
var hsResponse = "";
var fnResponse = "";

app.get("/loading", function (req, res) {
  const hubspot = {
    method: "GET",
    url: "https://api.hubspot.com/crm/v3/objects/contacts",
    headers: {
      Authorization: "Bearer " + hsAccessToken,
      "Content-Type": "application/json",
    },
  };
  const fortnox = {
    method: "GET",
    url: "https://api.fortnox.se/3/companyinformation",
    headers: {
      Authorization: "Bearer " + fnAccessToken,
    },
  };

  Promise.all([requestPromise(hubspot), requestPromise(fortnox)])
    .then((responses) => {
      hsResponse = responses[0];
      fnResponse = responses[1];

      res.redirect("/output");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error");
    });
});

// Wrap the request function in a promise for easier use with Promise.all
function requestPromise(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

/*app.get("/output", function (req, res) {
    const option1 = {
      method: "GET",
      url: "https://api.hubspot.com/crm/v3/objects/contacts",
      headers: {
        Authorization: "Bearer " + hsAccessToken,
        "Content-Type": "application/json",
      },
    };
    request(option1, (error, response, body) => {
      if (error) {
        console.error(error);
      } else {
        //TODO handle hubspot information
        console.log(body);
        dataInfo = JSON.stringify(body);
        isLoading=false; 
        res.render("pages/output", { dataInfo: dataInfo, isLoading: isLoading });
      
      }
    });
    const option2 = {
      method: "GET",
      url: "https://api.fortnox.se/3/companyinformation",
      headers: {
        Authorization: "Bearer " + fnAccessToken,
      },
    };
  
    request(option2, (error, response, body) => {
      if (error) {
        console.error(error);
      } else {
        //TODO handle fortnox information
        console.log(body);
        dataInfo += JSON.stringify(body);
        isLoading=false; 
        res.render("pages/output", { dataInfo: dataInfo, isLoading: isLoading });
      }
    });
  
   // res.render("pages/output", { dataInfo: dataInfo, isLoading: isLoading });
  }); */

app.get("/openai", async function (req, res) {
  const configuration = new Configuration({
    apiKey: "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",
  });

  const openai = new OpenAIApi(configuration);
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: "Write a haiku about insomnia.",
    });

    console.log(completion.data.choices[0].text);
  } catch (error) {
    console.log(error.response.status);
    console.log(error.response.data);
  }

  res.redirect("/");
});

/* //404 page (HAS TO BE THE LAST @app.get ROUTE IN THIS DOCUMENT)
  app.get("/*", function (req, res) {
    res.redirect("/");
  }); */

var fnAuthCode;
var fnAccessToken;

//fortnox callback
//(exchange code for token)
app.get("/fn-callback", function (req, res) {
  const { pathname, query } = url.parse(req.url);
  const queryParams = querystring.parse(query);
  if (queryParams.code) {
    fnAuthCode = queryParams.code;

    const options = {
      method: "POST",
      url: "https://apps.fortnox.se/oauth-v1/token",
      headers: {
        "Content-Type": "application/x-www-urlencoded",
        Authorization: "Basic MjJGcDM1TmlCR1VEOnBtUkhkSmRsY2w=",
      },
      form: {
        grant_type: "authorization_code",
        code: fnAuthCode,
        redirect_uri: "http://localhost:3000/fn-callback",
      },
    };
    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
      } else {
        console.log(body);
        const responseBody = JSON.parse(body);
        fnAccessToken = responseBody.access_token;
        /* var fortnoxButton = document.getElementById('fortnoxButton'); //Funkar detta??
                                  fortnoxButton.disabled = true;*/
      }
    });
  }
  res.redirect("/authenticate");
});

//fortnox OAuth
app.get("/fn-oauth", function (req, res) {
  //return to landing page after auth
  res.redirect(
    "https://apps.fortnox.se/oauth-v1/auth?client_id=22Fp35NiBGUD&redirect_uri=http://localhost:3000/fn-callback&scope=companyinformation&state=somestate&access_type=offline&response_type=code&account_type=service"
  );
});

var hsAuthCode;
var hsAccessToken;

//hubspot callback
//(exchange code for token)
app.get("/hs-callback", function (req, res) {
  const { pathname, query } = url.parse(req.url);
  const queryParams = querystring.parse(query);
  if (queryParams.code) {
    hsAuthCode = queryParams.code;

    const options = {
      method: "POST",
      url: "https://api.hubapi.com/oauth/v1/token",
      headers: {
        "Content-Type": "application/x-www-urlencoded",
      },
      form: {
        grant_type: "authorization_code",
        client_id: "afd563db-c00e-4d47-b52d-d421800d6c01",
        client_secret: "998b8f49-1167-4125-8961-85452c927589",
        code: hsAuthCode,
        redirect_uri: "http://localhost:3000/hs-callback",
      },
    };
    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
      } else {
        console.log(body);
        const responseBody = JSON.parse(body);
        hsAccessToken = responseBody.access_token;
      }
    });
  }
  res.redirect("/authenticate");
});

//hubspot OAuth
app.get("/hs-oauth", function (req, res) {
  //build the authurl
  const authUrl =
    "https://app.hubspot.com/oauth/authorize" +
    `?client_id=afd563db-c00e-4d47-b52d-d421800d6c01` +
    `&scope=crm.objects.contacts.read` +
    `&redirect_uri=http://localhost:3000/hs-callback`;
  +`&state=hubspot`;

  // Redirect the user
  res.redirect(authUrl);
});

/*
  app.get('/fn-info', function (req, res) {
          const options = {
                  method: 'GET',
                  url: 'https://api.fortnox.se/3/companyinformation',
                  headers: {
                          'Authorization': "Bearer " + fnAccessToken
                  }
          }
  
          request(options, (error, response, body) => {
                  if (error) {
                          console.error(error)
                  } else {
                          //TODO handle fortnox information
                          console.log(body);
                  }
          })
          res.redirect('/');
  });*/

//info from hubspot and fortnox
/* app.get("/info", function (req, res) {
    const option1 = {
      method: "GET",
      url: "https://api.hubspot.com/crm/v3/objects/contacts",
      headers: {
        Authorization: "Bearer " + hsAccessToken,
        "Content-Type": "application/json",
      },
    };
    request(option1, (error, response, body) => {
      if (error) {
        console.error(error);
      } else {
        //TODO handle hubspot information
        console.log(body);
      }
    });
    const option2 = {
      method: "GET",
      url: "https://api.fortnox.se/3/companyinformation",
      headers: {
        Authorization: "Bearer " + fnAccessToken,
      },
    };
  
    request(option2, (error, response, body) => {
      if (error) {
        console.error(error);
      } else {
        //TODO handle fortnox information
        console.log(body);
      }
    });
    res.redirect("/output");
  }); */

// Start server on port 3000
app.listen(3000, function (req, res) {
  console.log("Server started at http://localhost:3000");
});
