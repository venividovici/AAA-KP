const express = require("express");
const querystring = require("querystring");
const url = require("url");
const request = require("request");
const app = express();
const requestOpenAI = require("./ai.js");

app.use("/images", express.static("images"));
app.use("/scripts", express.static("scripts"));
app.use("/files", express.static("files"));
app.set("view engine", "ejs");

//Landing page
app.get("/", (req, res) => res.render("pages/welcome", {}));

//Authenticate page
app.get("/authenticate", function (req, res) {
  res.render("pages/authenticate", {
    isHsEnabled: !hsAuthCode,
    isFnEnabled: !fnAuthCode,
  });
});

//Output page
app.get("/output", function (req, res) {
  if (openAItext == "") res.redirect("/authenticate");
  else
    res.render("pages/output", {
      dataInfo: openAItext,
      responses: hsResponse1 + hsResponse2 + fnResponse,
    });
});

//Loading function
var hsResponse1 = "";
var hsResponse2 = "";
var fnResponse = "";

app.get("/loading", function (req, res) {
  
  if (Date.now() - hsTimer > 3600000 || Date.now() - fnTimer > 3600000) {
    //TODO: 1 hour has passed, expire keys and redirect to authenticate!
  }

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
    requestOpenAI([
      "abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc,abc",
      "def,def,def,def,def,def,def,def,def,def,def,def,def,def,def,def,def,def,def,def,def",
      "ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi,ghi",
      "jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl,jkl",
      "mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno,mno",
    ]),
  ])
    .then((responses) => {
      hsResponse1 = responses[0];
      hsResponse2 = responses[1];
      fnResponse = responses[2];
      openAItext = responses[3];
      console.log("--------------------------------------------------------");
      console.log(hsResponse1, hsResponse2, fnResponse);

      res.redirect("/output");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error");
    });
});
// Promise for OpenAI
var openAItext = "";

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

var fnAuthCode, fnAccessToken, fnTimer;

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
        fnTimer = Date.now();
      }
    });
  }
  res.redirect("/authenticate");
});

app.get("/fn-oauth", function (req, res) {
  res.redirect(
    "https://apps.fortnox.se/oauth-v1/auth?client_id=22Fp35NiBGUD&redirect_uri=http://localhost:3000/fn-callback&scope=companyinformation&state=somestate&access_type=offline&response_type=code&account_type=service"
  );
});

var hsAuthCode, hsAccessToken, hsTimer;

//Hubspot callback (exchange code for token)
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
        hsTimer = Date.now();
      }
    });
  }
  res.redirect("/authenticate");
});

//Hubspot OAuth
app.get("/hs-oauth", function (req, res) {
  const authUrl =
    "https://app-eu1.hubspot.com/oauth/authorize" +
    "?client_id=afd563db-c00e-4d47-b52d-d421800d6c01" +
    "&redirect_uri=http://localhost:3000/hs-callback" +
    "&scope=crm.objects.contacts.read%20crm.objects.companies.read";
  res.redirect(authUrl);
});

// Start server on port 3000
app.listen(3000, function (req, res) {
  console.log("Server started at http://localhost:3000");
});
