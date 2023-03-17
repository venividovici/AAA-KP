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
    console.log(`\n\n#${n}:${dataChunks[n - 1]}`);
  }

  const openai = new OpenAIApi(configuration);
  try {
    var summarizedData = "";
    var temp;
    console.log("\n\n\n");

    var chunkCount = dataChunks.length;

    var preprocessing_prompt = `
    Vi använder GPT-3 för att analysera stora mängder data från ett 
     konsultföretag. Uppgifterna innehåller information om fakturor (från deras bokföringssystem)
      och klienter (från deras CRM-system). Vårt mål är att generera
     intressanta insikter om data i en sista GPT-3-prompt, som kommer att användas
     för att skriva en Power BI-rapport.

     Men på grund av gränsen på 4000 token för GPT-3 måste vi förbehandla data i
     bitar för att göra det mer hanterbart. För att göra detta kommer vi att iterera igenom
     dataset i mindre portioner, matar in dem i GPT-3 som kommer att förbehandla var och en
     bit innan den matas in i den sista prompten som indata.
    
     För varje iteration kommer vi att få en osorterad, sammanslagen datauppsättning som innehåller
     både fakturadata och kunddata. Vårt första steg blir att förbehandla data
     använder GPT-3 genom att sammanfatta den i dess väsentliga komponenter, samtidigt som den behålls som
     så mycket meningsfull information som möjligt. Vi kommer också att leta efter trender och mönster i data för att identifiera viktiga insikter som kan
     användas i den sista prompten.
    
     När vi har förbehandlat datan kommer vi att jämföra det med tidigare iterationer till
     säkerställa konsekvens och identifiera eventuella förändringar i trender eller mönster.
    
     Slutligen kommer vi att mata in den förbehandlade informationen i den slutliga GPT-3-prompten till
     generera intressanta insikter och analyser. Utdata kommer att användas för att skapa en
     Power BI-rapport som presenterar resultaten på ett tydligt och kortfattat sätt. Det är viktigt att alla relevanta variabler
     och intressanta datapunkter är med.
    
     Tidigare bearbetade data:
     ${summarizedData}
    
     Obearbetad data:
     ${dataChunks[count]}
    
     Resultat från förbearbetning av data:`;
    var analysis_prompt = `
    Givet den förbearbetade datan, svara med konkreta tips på hur man kan använda denna data för att skapa
    en bra Power-BI rapport, gärna stegvis. Svaret bör vara omkring 150 ord långt. 

     Förslag på insikter som kan vara bra att få med i sin rapport skulle kunna vara till exempel ett
     cirkeldiagram över de bästa kunderna efter intäkter. Ett annat exempel är att identifiera eventuella trender
     eller mönster i fakturadata, till exempel fluktuationer i intäkter eller en ökning av vissa typer av fakturor.
     
     Vänligen ge detaljerade insikter för var och en av ovanstående frågor, med stöd av
     relevanta data och exempel. Tänk på att de genererade insikterna bör vara det
     korrekt, sammanhängande och värdefullt för konsultföretaget för affärsutveckling
     framtida beslut. Föreslå ingenting som inte framgår i datan, det vill säga, hitta inte på någonting nytt.

     Vänligen ge några exempel på företag och dess fakturor. Företag hittar du efter "CustomerName": och för att hitta vad en faktura tillhör för företag
     leta efter "name": 

     Förbearbetad data: ${summarizedData}
     Tips för skapande av en Business Intelligence-rapport:`;

    for (var i = 0; i < chunkCount; i++) {
      console.log(`batch ${i + 1} is being processed...\n`);
      count++; 
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        max_tokens: 1500,
        prompt: i == chunkCount - 1 ? analysis_prompt : preprocessing_prompt,
      });
      summarizedData = temp + completion.data.choices[0].text;
      temp = completion.data.choices[0].text;
    }

    console.log(summarizedData);
    return summarizedData;
  } catch (error) {
    console.log(error.response);
  }
}

module.exports = requestOpenAI;
