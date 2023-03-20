const { Configuration, OpenAIApi } = require("openai");
/**
 * 
 * @param {*} jsonData json data to be stringified, split and preprocessed
 * @param {*} chunkSize the number of individual characters per chunk
 * @returns 
 */
async function requestOpenAI(jsonData, chunkSize) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  let n = 0;

  var dataString = jsonData;
  var dataChunks = [];
  var count = 0;

  for (var x = 0; x < dataString.length; x += chunkSize) {
    dataChunks[n++] = dataString.substring(x, x + chunkSize);
  }

  const openai = new OpenAIApi(configuration);
  try {
    var summarizedData = "";
    var temp = '';

    var chunkCount = dataChunks.length;

    function preprocessing_prompt(count) {
      return `
      Output är en lista av alla värden där det står "CustomerName": eller "name": innan ifrån JSON-data. När det står
      "Total" så följer en siffra, den tillhör det företag nämndes senast, lägg till den siffran efter företagsnamnet i listan.
      Om Samma företag dyker upp igen, lägg inte till det i listan igen men addera ihop summan av båda siffrorna. Om det står "Total" och en summa
      men inget företag nämns inann så tillhör summan det företag som står längst ner i den tidigare listan, lägg då till summan där.
      Output är en lista över CustomerName eller name från JSON-data + tidigare lista. 
      Output är alltså sammansatt lista som är längre än tidigare lista. 
  
      Exempel på JSON-data:
      #18:tps://api.fortnox.se/3/invoices/1692","Balance":0,"Booked":true,"Cancelled":false,"CostCenter":"","Currency":"SEK",
      "CurrencyRate":"1","CurrencyUnit":1,"CustomerName":"MalmbergGruppen Aktiebolag","CustomerNumber":"324","DocumentNumber":"1692",
      "DueDate":"2019-12-31","ExternalInvoiceReference1":"","ExternalInvoiceReference2":"","InvoiceDate":"2019-12-01","InvoiceType":"INVOICE",
      "NoxFinans":false,"OCR":"169268","VoucherNumber":30,"VoucherSeries":"B","VoucherYear":2,"WayOfDelivery":"","TermsOfPayment":"30",
      "Project":"","Sent":true,"Total":258500,"FinalPayDate":"2020-01-22"},{"@url":"https://api.fortnox.se/3/invoices/1607","Balance":0,"Booked":true,
      "Cancelled":false,"CostCenter":"","Currency":"SEK","CurrencyRate":"1","CurrencyUnit":1,"CustomerName":"HH Ferries AB PSZ3023",
      "CustomerNumber":"290","DocumentNumber":"1607","DueDate":"2018-12-01","ExternalInvoiceReference1":"","ExternalInvoiceReference2":"","InvoiceDate":"2018-11-01","InvoiceType":"INVOICE",
      "NoxFinans":false,"OCR":"160762","Vouche
      
       Exempel på Tidigare lista:
       IKEA Ämhult AB 51000
       Volvo AB 20000
       MalmbergGruppen Aktiebolag 258500

       Exempel på Output: (Dessa är bara exempel för att förstå mönstret, och är inte med i nästa output)
       IKEA Ämhult AB 51000
       Volvo AB 20000
       MalmbergGruppen Aktiebolag 517000
       HH Ferries AB PSZ3023
  
      Output är en lista av alla värden där det står "CustomerName": eller "name": innan ifrån JSON-data.
      Output är en lista över CustomerName eller name från JSON-data + tidigare lista. 
      Output är alltså sammansatt lista som är längre än tidigare lista. 
  
      JSON-data:
      ${dataChunks[count]}
      
       Tidigare lista:
       ${summarizedData}
      
       Output:`;
    }

    function analysis_prompt(summarizedData) {
      return `Nedan kommer en lista på olika företag som är kunder, bredvid kundnamnen står ett belopp som representerar summan av
      alla fakturor som betalats in från dem.
  
       Lista: ${summarizedData}
       
       Jag vill skapa en PowerBI-rapport av data som innehåller denna information, ge mig konkreta tips på hur jag gör det på bästa sätt.
       Ta intressanta rader från listan och använd som exempel i ditt svar. Redogör först vilka de fem mest lönsamma företagen är,
       och vilka summor de har.
       Svaret ska vara ett tydligt och konkret förslag på hur jag ska använda just den här informationen i en PowerBI-rapport.
      Använd exempel från listan i tipsen.
       
       Tips på hur man skapar en bra PowerBI-rapport utifrån listan:`
    };

    for (var i = 0; i < chunkCount; i++) {
      count++;
      console.log(summarizedData);
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        max_tokens: 1500,
        prompt: i == chunkCount - 1 ? analysis_prompt(summarizedData) : preprocessing_prompt(count),
      });
      summarizedData = temp + completion.data.choices[0].text;
      temp = completion.data.choices[0].text;
    }

    console.log(summarizedData);
    return temp
  } catch (error) {
    console.log(error.response);
  }
}

module.exports = requestOpenAI;