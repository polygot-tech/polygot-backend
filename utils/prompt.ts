export interface LanguagePrompt{
    sourceLang:string,
    targetLang:string,
    stringsToTranslate:object
}

export const prompt = (input:LanguagePrompt)=> {
    return `Translate the following JSON array of strings from source language "${input.sourceLang}" to target language "${input.targetLang}". 
  Maintain the exact original JSON array structure and order in your response. 
  Only provide the final JSON array of translated strings as your output. 
  Do not include any extra text, explanations, or markdown formatting.

  JSON Array to Translate:
  ${JSON.stringify(input.stringsToTranslate, null, 2)}
  `}