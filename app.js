const { Configuration, OpenAIApi } = require("openai");
const express = require("express");
const querystring = require("querystring");
const url = require("url");
const request = require("request");
const app = express();
const fs = require("fs");
app.use("/images", express.static("images"));
app.use("/scripts", express.static("scripts"));
app.use("/files", express.static("files"));
app.set("view engine", "ejs");

module.exports = { hsResponse }
module.exports = { fnResponse }

//Landing page
app.get("/", function (req, res) {
  res.render("pages/welcome", {});
});

//Welcome page
app.get("/welcome", function (req, res) {
  res.redirect("/");
});

//Authenticate page
app.get("/authenticate", function (req, res) {
  res.render("pages/authenticate", {
    isHsEnabled: !hsAuthCode,
    isFnEnabled: !fnAuthCode,
  });
});

//Output page
app.get("/output", function (req, res) {
  res.render("pages/output", {
    dataInfo: openAItext,
    responses: hsResponse + fnResponse
  });
});

//Loading function
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

  Promise.all([
    requestPromise(hubspot),
    requestPromise(fortnox),
    requestOpenAI(),
  ])
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

// Promise for OpenAI
var openAItext = "";

async function requestOpenAI() {
  const configuration = new Configuration({
    apiKey: "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",
  });

  const openai = new OpenAIApi(configuration);
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      max_tokens: 1500,
      prompt: `Analysera denna data. Data: ${hsResponse + fnResponse}`,
    });
    console.log(completion.data.choices[0].text);
    openAItext = completion.data.choices[0].text;
  } catch (error) {
    console.log(error.response);
  }
}

app.get("/reload", function (req, res) {
  requestOpenAI();
  res.render("pages/output", {
    dataInfo: openAItext,
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

/* //404 page (HAS TO BE THE LAST @app.get ROUTE IN THIS DOCUMENT)
  app.get("/*", function (req, res) {
    res.redirect("/");
  }); */

var fnAuthCode;
var fnAccessToken;

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

var hsAuthCode;
var hsAccessToken;

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
      }
    });
  }
  res.redirect("/authenticate");
});

//Hubspot OAuth
app.get("/hs-oauth", function (req, res) {
  const authUrl =
    "https://app.hubspot.com/oauth/authorize" +
    `?client_id=afd563db-c00e-4d47-b52d-d421800d6c01` +
    `&scope=crm.objects.contacts.read` +
    `&redirect_uri=http://localhost:3000/hs-callback`;
  +`&state=hubspot`;

  res.redirect(authUrl);
});

// Start server on port 3000
app.listen(3000, function (req, res) {
  console.log("Server started at http://localhost:3000");
});
