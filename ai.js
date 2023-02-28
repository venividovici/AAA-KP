const { Configuration, OpenAIApi } = require("openai");

async function requestOpenAI(iterableData) {
  const configuration = new Configuration({
    apiKey: "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",
  });
  var generations = iterableData.length;
  const openai = new OpenAIApi(configuration);
  try {
    var summarizedData = "";
    console.log("\n\n\n");
    for (var i = 0; i < generations; i++) {
      console.log(`batch ${i + 1} is being processed...\n`);
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        max_tokens: 1500,
        prompt: `You are going to receive some summarized data and a
                chunk of unsummarized data. Summarize/condense the databatch and 
                integrate it into the summarized data provided. The summary should
                be more or less a single sentence per databatch - if a pattern
                repeats itself over databatches, then they can be summarized together
                in a single sentence. If no summarized data is provided, then simply 
                summarize the databatch for itself.
                
                Do not prune data, and do not add data that does not exist! 
                The data in the summarized data section is to be preserved, if you 
                do decide to prune any data you must provide your reason for doing 
                so, on top of the summarized data.

                the purpose is to create a complete overview of a large quantity 
                of data. Your task is to summarize the provided databatch, append 
                and integrate it into the summarized data provided. If the Databatch 
                provided below is numbered ${generations} of ${generations}, it is the 
                final one to be sent to you and you should, at the end of the summary, 
                provide some further insights and analysis on you summarized data 
                beyond just the condensed summary. Don't make any assumptions about the
                data or its context, beyond what you can know for sure! identify patterns
                and correlations.
                
                \n\nSummarized Data:${summarizedData}\n\n
                Databatch( no. ${i + 1} of ${generations}):${iterableData[i]}
                
                \n\nNew version of Summarized Data that includes summarization of databatch ${i+1}:\n`,
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
