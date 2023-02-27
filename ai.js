const { Configuration, OpenAIApi } = require("openai");


async function requestOpenAI(iterableData) {
    const configuration = new Configuration({
      apiKey: "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",
    });
    var i, generations = 10;
    const openai = new OpenAIApi(configuration);
    try {
        var summarizedData="";
        console.log("\n\n\n");
        for(i=0;i<generations;i++){
            console.log(`step ${i} in progress...\n\n`);
            const completion = await openai.createCompletion({
                model: "text-davinci-003",
                max_tokens: 1500,
                prompt: `You are going to receive some summarized data and a
                chunk of unsummarized data. Summarize the databatch and integrate 
                it into the summarized data provided. If no summarized data is
                provided, then simply summarize the databatch for itself.
                
                \n\nSummarized Data:${summarizedData}\n\n
                Databatch:${iterableData[i]}`,
              });
            summarizedData = completion.data.choices[0].text;
        }

      console.log(summarizedData);
      return summarizedData;
    } catch (error) {
      console.log(error.response);
    }
  }
  module.exports = requestOpenAI;