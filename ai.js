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

  var dataString = JSON.stringify(jsonData);
  var dataChunks = [];

  for (let x = 0; x < dataString.length; x += chunkSize) {
    dataChunks[n++] = dataString.substring(x, x + chunkSize);
    console.log(`\n\n#${n}:${dataChunks[n - 1]}`);
  }

  const openai = new OpenAIApi(configuration);
  try {
    var summarizedData = "";
    var temp;
    console.log("\n\n\n");

    let chunkCount = dataChunks.length;

    let preprocessing_prompt = `
    We are using GPT-3 to analyze large amounts of data from a business development 
    consulting firm. The data includes information about invoices (from their ERP 
    system) and clients (from their CRM system). Our goal is to generate 
    interesting insights about the data in a final GPT-3 prompt, which will be used 
    for writing a Power BI report.

    However, due to the 4000-token limit of GPT-3, we need to preprocess the data in 
    chunks to make it more manageable. To do this, we will iterate through the 
    dataset in smaller portions, feeding them into GPT-3 that will preprocess each 
    chunk before feeding it into the final prompt as input data.
    
    For each iteration, we will receive an unsorted, merged dataset that contains 
    both invoice data and client data. Our first step will be to preprocess the data
    using GPT-3 by summarizing it into its essential components, while retaining as 
    much meaningful information as possible. We will also look for trends and patterns in the data to identify key insights that can 
    be used in the final prompt.
    
    Once we have preprocessed the data, we will compare it to previous iterations to 
    ensure consistency and identify any changes in trends or patterns. If necessary, 
    we will adjust our preprocessing methods to account for these changes.
    
    Finally, we will feed the preprocessed data into the final GPT-3 prompt to 
    generate interesting insights and analysis. The output will be used to create a 
    Power BI report that presents the findings in a clear and concise manner.
    
    Previous processed data:
    ${summarizedData}
    
    Unprocessed data chunk:
    ${dataChunks[i]}
    
    Data preprocessing result:`;

    let analysis_prompt = `
    Given the preprocessed data, generate insights about the business development 
    consulting firm's clients and invoices:

    Identify the top clients by revenue and provide insights into their spending 
    patterns.
    Determine the most common invoice categories and their associated revenue.
    Identify any trends or patterns in the invoice data, such as fluctuations in 
    revenue or an increase in certain types of invoices.
    Provide recommendations for increasing revenue, reducing costs, or improving 
    client retention based on the analysis of the data.

    Please provide detailed insights for each of the above questions, supported by 
    relevant data and examples. Keep in mind that the generated insights should be 
    accurate, coherent, and valuable for the business development consulting firm's 
    future decisions.

    Preprocessed data: ${summarizedData}
    Business Intelligence Report:`;

    for (let i = 0; i < chunkCount; i++) {
      console.log(`batch ${i + 1} is being processed...\n`);
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
