const express = require("express");
const querystring = require("querystring");
const url = require("url");
const request = require("request");
const app = express();
const requestOpenAI = require("./ai.js");
const resetMs = 3599980; //access token lifespan

app.use("/images", express.static("images"));
app.use("/scripts", express.static("scripts"));
app.use("/files", express.static("files"));
app.set("view engine", "ejs");
app.use("/style", express.static("style"));

//Landing page
app.get("/", (req, res) => res.render("pages/welcome", {}));

//Authenticate page
app.get("/authenticate", (req, res) =>
  res.render("pages/authenticate", {
    isHsEnabled: !hsAuthCode,
    isFnEnabled: !fnAuthCode,
  })
);

//Output page
app.get("/output", function (req, res) {
  if (openAItext == "") res.redirect("/authenticate");
  else
    res.render("pages/output", {
      dataInfo: openAItext,
      responses: JSON.stringify(jsonResponse),
    });
});

//TODO: this function fetches all the data and calls on the AI, it can be named better
var jsonResponse = "";
var openAItext = "";
app.get("/loading", function (req, res) {
  if (Date.now() - hsTimer > resetMs || Date.now() - fnTimer > resetMs) {
    fnAuthCode = fnAccessToken = hsAuthCode = hsAccessToken = null;
    res.redirect("/authenticate");
  } else {
    const hubspotContacts = {
      method: "GET",
      url: "https://api.hubspot.com/crm/v3/objects/contacts",
      headers: {
        Authorization: "Bearer " + hsAccessToken,
        "Content-Type": "application/json",
      },
    };

    const hubspotCompanies = {
      method: "GET",
      url: "https://api.hubspot.com/crm/v3/objects/companies",
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

    Promise.all([
      requestPromise(hubspotContacts),
      requestPromise(hubspotCompanies),
      requestPromise(fortnox),
    ])
      .then((responses) => {
        var jsonHubSpot1 = JSON.parse(responses[0]).results;
        var jsonHubSpot2 = JSON.parse(responses[1]).results;
        var jsonFortnox = JSON.parse(responses[2]);
        jsonResponse= {...jsonHubSpot1,...jsonHubSpot2,...jsonFortnox};

        requestOpenAI(jsonResponse,chunkSize=400).then((response) => {
          openAItext = response;
          res.redirect("/output");
        });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Ooops :^)");
      });
  }
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

app.get("/reloadAIResponse", function (req, res) {
  if (Date.now() - hsTimer > resetMs || Date.now() - fnTimer > resetMs) {
    fnAuthCode = fnAccessToken = hsAuthCode = hsAccessToken = null;
    res.redirect("/authenticate");
  } else {
    Promise.all([requestOpenAI(jsonResponse,400)])
      .then((response) => {
        openAItext = response;
        res.render("pages/output", {
          dataInfo: openAItext,
          responses: JSON.stringify(jsonResponse),
        });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error");
      });
  }
});

//Fortnox callback (exchange code for token)
var fnAuthCode, fnAccessToken, fnTimer;
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
        //console.log(body);
        const responseBody = JSON.parse(body);
        fnAccessToken = responseBody.access_token;
        fnTimer = Date.now();
      }
    });
  }
  res.redirect("/authenticate");
});

app.get("/fn-oauth", (req, res) =>
  res.redirect(
    "https://apps.fortnox.se/oauth-v1/auth" +
      "?client_id=22Fp35NiBGUD" +
      "&redirect_uri=http://localhost:3000/fn-callback" +
      "&scope=companyinformation" +
      "&state=somestate" +
      "&access_type=offline" +
      "&response_type=code" +
      "&account_type=service"
  )
);

//Hubspot callback (exchange code for token)
var hsAuthCode, hsAccessToken, hsTimer;
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
        //console.log(body);
        const responseBody = JSON.parse(body);
        hsAccessToken = responseBody.access_token;
        hsTimer = Date.now();
      }
    });
  }
  res.redirect("/authenticate");
});

//Hubspot OAuth
app.get("/hs-oauth", (req, res) => {
  const authUrl =
    "https://app-eu1.hubspot.com/oauth/authorize" +
    "?client_id=afd563db-c00e-4d47-b52d-d421800d6c01" +
    "&redirect_uri=http://localhost:3000/hs-callback" +
    "&scope=crm.objects.contacts.read%20crm.objects.companies.read";
  res.redirect(authUrl);
});

// Start server on port 3000
app.listen(3000, (req, res) =>
  console.log("Server started at http://localhost:3000")
);
