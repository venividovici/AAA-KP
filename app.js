const express = require("express");
const querystring = require("querystring");
const url = require("url");
const request = require("request");
const app = express();
const requestOpenAI = require("./ai.js");
require("dotenv").config();
const resetMs = 3599980; // Access token lifespan
app.use("/images", express.static("images"));
app.use("/scripts", express.static("scripts"));
app.use("/files", express.static("files"));
app.set("view engine", "ejs");
app.use("/style", express.static("style"));

// GLOBAL VARIABLES
var jsonResponse = "";
var openAItext = "";
var fnAuthCode, fnAccessToken, fnTimer;
var hsAuthCode, hsAccessToken, hsTimer;

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI;
const HUBSPOT_SCOPE = process.env.HUBSPOT_SCOPE;

const FORTNOX_CLIENT_ID = process.env.FORTNOX_CLIENT_ID;
const FORTNOX_CREDENTIALS = process.env.FORTNOX_CREDENTIALS;
const FORTNOX_REDIRECT_URI = process.env.FORTNOX_REDIRECT_URI;
const FORTNOX_SCOPE = process.env.FORTNOX_SCOPE;
const FORTNOX_STATE = process.env.FORTNOX_STATE;
const FORTNOX_ACCESS_TYPE = process.env.FORTNOX_ACCESS_TYPE;
const FORTNOX_RESPONSE_CODE = process.env.FORTNOX_RESPONSE_CODE;
const FORTNOX_ACCOUNT_TYPE = process.env.FORTNOX_ACCOUNT_TYPE;

// -----------------------------------PAGES-------------------------------------------
// Welcome page
app.get("/", (req, res) => res.render("pages/welcome", {}));

// Authenticate page
app.get("/authenticate", (req, res) =>
  res.render("pages/authenticate", {
    isHsEnabled: !hsAuthCode,
    isFnEnabled: !fnAuthCode,
  })
);

// Output page
app.get("/output", function (req, res) {
  if (openAItext == "") res.redirect("/authenticate");
  else
    res.render("pages/output", {
      dataInfo: openAItext,
      responses: JSON.stringify(jsonResponse),
    });
});

// Output page: Reload AI response
app.get("/reloadAIResponse", function (req, res) {
  if (Date.now() - hsTimer > resetMs || Date.now() - fnTimer > resetMs) {
    fnAuthCode = fnAccessToken = hsAuthCode = hsAccessToken = null;
    res.redirect("/authenticate");
  } else {
    Promise.all([requestOpenAI(jsonResponse, 1000)])
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

// -----------------------------------API LOGIC-------------------------------------------
app.get("/generate", function (req, res) {
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

    const hubspotDeals = {
      method: "GET",
      url: "https://api.hubspot.com/crm/v3/objects/deals",
      headers: {
        Authorization: "Bearer " + hsAccessToken,
        "Content-Type": "application/json",
      },
    };

    const fortnox = {
      method: "GET",
      url: "https://api.fortnox.se/3/invoice",
      headers: {
        Authorization: "Bearer " + fnAccessToken,
      },
    };

    Promise.all([
      requestPromise(hubspotContacts),
      requestPromise(hubspotCompanies),
      requestPromise(hubspotDeals),
      requestPromise(fortnox),
    ])
      .then((responses) => {
        var jsonHubSpot1 = JSON.stringify(JSON.parse(responses[0]).results);
        var jsonHubSpot2 = JSON.stringify(JSON.parse(responses[1]).results);
        var jsonHubSpot3 = JSON.stringify(JSON.parse(responses[2]).results);
        var jsonFortnox = JSON.stringify(JSON.parse(responses[3]));
        jsonResponse = jsonHubSpot1+jsonHubSpot2+jsonHubSpot3+jsonFortnox;

        requestOpenAI(jsonResponse, (chunkSize = 1000)).then((response) => {
          openAItext = response;
          res.redirect("/output");
        });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error");
      });
  }
});

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

//Fortnox callback (exchange code for token)
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
        Authorization: `Basic ${FORTNOX_CREDENTIALS}`,
      },
      form: {
        grant_type: "authorization_code",
        code: fnAuthCode,
        redirect_uri: `${FORTNOX_REDIRECT_URI}`,
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

// Fortnox OAuth authentication
app.get("/fn-oauth", (req, res) =>
  res.redirect(
    "https://apps.fortnox.se/oauth-v1/auth" +
      `?client_id=${FORTNOX_CLIENT_ID}` +
      `&redirect_uri=${FORTNOX_REDIRECT_URI}` +
      `&scope=${FORTNOX_SCOPE}` +
      `&state=${FORTNOX_STATE}` +
      `&access_type=${FORTNOX_ACCESS_TYPE}` +
      `&response_type=${FORTNOX_RESPONSE_CODE}` +
      `&account_type=${FORTNOX_ACCOUNT_TYPE}`
  )
);

// Hubspot callback (exchange code for token)
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
        client_id: `${HUBSPOT_CLIENT_ID}`,
        client_secret: `${HUBSPOT_CLIENT_SECRET}`,
        code: hsAuthCode,
        redirect_uri: `${HUBSPOT_REDIRECT_URI}`,
      },
    };
    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
      } else {
        const responseBody = JSON.parse(body);
        hsAccessToken = responseBody.access_token;
        hsTimer = Date.now();
      }
    });
  }
  res.redirect("/authenticate");
});

// Hubspot OAuth authentication
app.get("/hs-oauth", (req, res) => {
  const authUrl =
    "https://app-eu1.hubspot.com/oauth/authorize" +
    `?client_id=${HUBSPOT_CLIENT_ID}` +
    `&redirect_uri=${HUBSPOT_REDIRECT_URI}` +
    `&scope=${HUBSPOT_SCOPE}`;
  res.redirect(authUrl);
});

// Start server on port 3000
app.listen(3000, (req, res) =>
  console.log("Server started at http://localhost:3000")
);
