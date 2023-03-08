const { Configuration, OpenAIApi } = require("openai");

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
    console.log("\n\n\n");

    let chunkCount = dataChunks.length;

    let preprocessing_prompt = `We are preprocessing large amounts of data using GPT-3 for 
	the purpose of fitting it into a final <4000 token GPT-3 prompt that will
	generate some interesting insights about the summarized data.

	The data comes from a business development consulting firm, and contains 
	information about invoices (from their ERP system), and clients (from 
	their CRM system).
	
	the generated content from the final GPT-3 prompt will be used for writing a
	powerBI report.
	
	The data needs to be preprocessed so that it can be used by the final GPT-3 
	generation to create an accurate and coherent analysis.
	
	To get around the 4000-token limit that prevents us from prompting the entire
	dataset at once, we will iterate through chunks of the dataset at a time.

	We will receive small portions at a time of a large, unsorted, merged dataset 
	containing both the invoice data and the client data.

	For each step, we receive both the preprocessed summarized data, and the
	unsummarized data that we need to preprocess in the same way.

	We look at that unsummarized data chunk and determine whether its information and
	trends align with the summarization of previous data chunks; if it does not, we 
	need to consider how this new data chunks changes the summarization of previous data chunks.
	Then we simply write out the data preprocessing result that combines old (and possibly amended)
	preprocessed data with the newly preprocessed data chunk.

	Previously preprocessed data:
	unprocessed data chunk:
	Data preprocessing result:

	Previously preprocessed data:${summarizedData}
	unprocessed data chunk: ${dataChunks[i]}
	Data preprocessing result:`;

    let analysis_prompt = "";

    for (let i = 0; i < chunkCount; i++) {
      console.log(`batch ${i + 1} is being processed...\n`);
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        max_tokens: 1500,
        prompt: i == chunkCount - 1 ? analysis_prompt : preprocessing_prompt,
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
