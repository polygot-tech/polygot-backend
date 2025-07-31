import type { Request, Response } from "express";
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { createHash } from "crypto";
import { redisClient } from "../config/redis.config";
import { z } from "zod";

// Enhanced input validation schema with optional from parameter
const TranslateRequestSchema = z.object({
  to: z.string().min(1, "Target language is required"),
  from: z.string().optional(), // Made optional for auto-detection
  input: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(),z.string())
  ]).refine(val => {
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    return false;
  }, "Input cannot be empty"),
  tone: z.enum([
    "professional",
    "casual",
    "formal",
    "friendly",
    "academic",
    "conversational",
    "business",
    "creative",
    "technical",
    "diplomatic",
    "neutral"
  ]).optional().default("neutral"),
  region: z.string().optional(),
  context: z.string().optional()
});

// Response schema for parsing
const TranslationResponseSchema = z.object({
  translated: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(),z.string())
  ])
});

interface TranslateRequest {
  to: string;
  from?: string; // Made optional
  input: string | string[] | Record<string, string>;
  tone?: "professional" | "casual" | "formal" | "friendly" | "academic" | "conversational" | "business" | "creative" | "technical" | "diplomatic" | "neutral";
  region?: string;
  context?: string;
}

interface TranslationResult {
  translated: string | string[] | Record<string, string>;
  cached: boolean;
  processingTime: number;
  tone: string;
  region?: string;
  detectedLanguage?: string; // Added for auto-detection
}

export class TranslationService {
  private llm: ChatGroq;
  private detectPrompt: PromptTemplate;
  private translatePrompt: PromptTemplate;
  private maxRetries: number = 3;

  // Language to region mapping for prioritization
  private languageRegionMap: Record<string, string[]> = {
  // Major World Languages
  'English': ['US', 'UK', 'CA', 'AU', 'NZ', 'IE', 'ZA', 'IN', 'SG', 'MY', 'PH', 'NG', 'KE', 'UG', 'TZ', 'ZW', 'BW', 'MW', 'ZM', 'GH', 'SL', 'LR', 'GM', 'BB', 'JM', 'TT', 'GY', 'BZ', 'AG', 'BS', 'DM', 'GD', 'KN', 'LC', 'VC', 'SR', 'FJ', 'PG', 'VU', 'WS', 'TO', 'TV', 'KI', 'NR', 'PW', 'MH', 'FM', 'MN'],
  'Mandarin Chinese': ['CN', 'TW', 'HK', 'MO', 'SG', 'MY'],
  'Hindi': ['IN', 'NP', 'FJ'],
  'Spanish': ['ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ', 'AD', 'BZ'],
  'French': ['FR', 'CA', 'BE', 'CH', 'LU', 'MC', 'CD', 'MG', 'CM', 'CI', 'NE', 'BF', 'ML', 'SN', 'TD', 'GN', 'RW', 'BI', 'TG', 'BJ', 'CF', 'GA', 'CG', 'DJ', 'KM', 'SC', 'VU', 'NC', 'PF', 'WF', 'RE', 'GP', 'MQ', 'GF', 'YT', 'PM', 'BL', 'MF'],
  'Arabic': ['SA', 'EG', 'AE', 'MA', 'DZ', 'TN', 'LY', 'SD', 'IQ', 'SY', 'JO', 'LB', 'KW', 'OM', 'QA', 'BH', 'YE', 'PS', 'MR', 'SO', 'DJ', 'KM', 'TD'],
  'Bengali': ['BD', 'IN'],
  'Portuguese': ['BR', 'PT', 'AO', 'MZ', 'GW', 'CV', 'ST', 'TL', 'MO'],
  'Russian': ['RU', 'BY', 'KZ', 'KG', 'TJ', 'UZ', 'TM', 'MD', 'GE', 'AM', 'AZ'],
  'Japanese': ['JP'],
  'German': ['DE', 'AT', 'CH', 'LI', 'LU', 'BE'],
  'Korean': ['KR', 'KP'],
  'Vietnamese': ['VN'],
  'Turkish': ['TR', 'CY'],
  'Italian': ['IT', 'CH', 'SM', 'VA', 'MT'],
  'Thai': ['TH'],
  'Dutch': ['NL', 'BE', 'SR', 'AW', 'CW', 'SX', 'BQ'],
  'Polish': ['PL'],
  'Ukrainian': ['UA'],
  'Romanian': ['RO', 'MD'],
  'Greek': ['GR', 'CY'],
  'Czech': ['CZ'],
  'Hungarian': ['HU'],
  'Swedish': ['SE', 'FI'],
  'Norwegian': ['NO'],
  'Danish': ['DK', 'FO', 'GL'],
  'Finnish': ['FI'],
  'Hebrew': ['IL'],
  'Malay': ['MY', 'BN', 'SG', 'ID'],
  'Indonesian': ['ID'],
  'Persian': ['IR', 'AF', 'TJ'],
  'Urdu': ['PK', 'IN'],
  'Gujarati': ['IN'],
  'Punjabi': ['IN', 'PK'],

  // African Languages
  'Swahili': ['TZ', 'KE', 'UG', 'RW', 'BI', 'CD', 'MZ', 'MW', 'ZM', 'KM'],
  'Hausa': ['NG', 'NE', 'GH', 'CM', 'TD', 'SD', 'BF'],
  'Yoruba': ['NG', 'BJ', 'TG'],
  'Igbo': ['NG'],
  'Amharic': ['ET'],
  'Oromo': ['ET'],
  'Tigrinya': ['ET', 'ER'],
  'Somali': ['SO', 'ET', 'DJ', 'KE'],
  'Zulu': ['ZA'],
  'Xhosa': ['ZA'],
  'Afrikaans': ['ZA', 'NA'],
  'Shona': ['ZW'],
  'Chichewa': ['MW', 'ZM'],
  'Sesotho': ['LS', 'ZA'],
  'Setswana': ['BW', 'ZA'],
  'Wolof': ['SN', 'GM'],
  'Fulani': ['NG', 'SN', 'GN', 'ML', 'BF', 'NE', 'GM', 'GW', 'SL', 'MR'],
  'Lingala': ['CD', 'CG'],
  'Kikongo': ['CD', 'CG', 'AO'],
  'Bambara': ['ML'],
  'Twi': ['GH'],
  'Ewe': ['GH', 'TG'],
  'Ga': ['GH'],
  'Mende': ['SL'],
  'Krio': ['SL'],
  'Kinyarwanda': ['RW'],
  'Kirundi': ['BI'],
  'Luganda': ['UG'],
  'Luo': ['KE', 'UG', 'TZ'],
  'Kikuyu': ['KE'],
  'Malagasy': ['MG'],

  // European Languages
  'Bulgarian': ['BG'],
  'Croatian': ['HR', 'BA'],
  'Serbian': ['RS', 'BA', 'ME'],
  'Bosnian': ['BA'],
  'Montenegrin': ['ME'],
  'Slovenian': ['SI'],
  'Slovak': ['SK'],
  'Lithuanian': ['LT'],
  'Latvian': ['LV'],
  'Estonian': ['EE'],
  'Albanian': ['AL', 'XK', 'MK', 'ME'],
  'Macedonian': ['MK'],
  'Maltese': ['MT'],
  'Irish': ['IE'],
  'Welsh': ['GB'],
  'Scottish Gaelic': ['GB'],
  'Breton': ['FR'],
  'Corsican': ['FR', 'IT'],
  'Sardinian': ['IT'],
  'Catalan': ['ES', 'AD', 'FR', 'IT'],
  'Basque': ['ES', 'FR'],
  'Galician': ['ES'],
  'Faroese': ['FO'],
  'Icelandic': ['IS'],
  'Luxembourgish': ['LU'],
  'Romansh': ['CH'],
  'Friulian': ['IT'],
  'Ladin': ['IT'],
  'Occitan': ['FR', 'ES', 'IT'],
  'Franco-Provençal': ['FR', 'CH', 'IT'],

  // Asian Languages
  'Cantonese': ['HK', 'MO', 'CN'],
  'Wu Chinese': ['CN'],
  'Min Chinese': ['CN', 'TW'],
  'Hakka': ['CN', 'TW', 'MY', 'SG'],
  'Mongolian': ['MN', 'CN'],
  'Tibetan': ['CN', 'IN', 'NP', 'BT'],
  'Uyghur': ['CN'],
  'Kazakh': ['KZ', 'CN', 'KG', 'MN'],
  'Kyrgyz': ['KG', 'CN'],
  'Turkmen': ['TM', 'AF', 'IR'],
  'Tajik': ['TJ', 'UZ', 'AF'],
  'Pashto': ['AF', 'PK'],
  'Dari': ['AF'],
  'Balochi': ['PK', 'IR', 'AF'],
  'Sindhi': ['PK', 'IN'],
  'Kashmiri': ['IN', 'PK'],
  'Nepali': ['NP', 'IN', 'BT'],
  'Sinhala': ['LK'],
  'Dzongkha': ['BT'],
  'Burmese': ['MM'],
  'Lao': ['LA'],
  'Khmer': ['KH'],
  'Tagalog': ['PH'],
  'Cebuano': ['PH'],
  'Ilocano': ['PH'],
  'Hiligaynon': ['PH'],
  'Waray': ['PH'],
  'Bikol': ['PH'],
  'Kapampangan': ['PH'],
  'Pangasinan': ['PH'],
  'Javanese': ['ID'],
  'Sundanese': ['ID'],
  'Batak': ['ID'],
  'Minangkabau': ['ID'],
  'Acehnese': ['ID'],
  'Balinese': ['ID'],
  'Buginese': ['ID'],
  'Tetum': ['TL'],

  // Middle Eastern Languages
  'Kurdish': ['TR', 'IQ', 'IR', 'SY'],
  'Assyrian': ['IQ', 'SY', 'TR', 'IR'],
  'Armenian': ['AM', 'TR', 'IR', 'SY', 'LB'],
  'Georgian': ['GE'],
  'Azerbaijani': ['AZ', 'IR'],
  'Chechen': ['RU'],
  'Ingush': ['RU'],
  'Ossetian': ['RU', 'GE'],
  'Abkhaz': ['GE'],
  'Circassian': ['RU', 'TR', 'SY', 'JO'],

  // Pacific Languages
  'Fijian': ['FJ'],
  'Samoan': ['WS', 'AS'],
  'Tongan': ['TO'],
  'Tahitian': ['PF'],
  'Hawaiian': ['US'],
  'Maori': ['NZ'],
  'Tok Pisin': ['PG'],
  'Hiri Motu': ['PG'],
  'Bislama': ['VU'],
  'Palauan': ['PW'],
  'Marshallese': ['MH'],
  'Chuukese': ['FM'],
  'Kosraean': ['FM'],
  'Pohnpeian': ['FM'],
  'Yapese': ['FM'],
  'I-Kiribati': ['KI'],
  'Tuvaluan': ['TV'],
  'Nauruan': ['NR'],

  // Native American Languages
  'Quechua': ['PE', 'BO', 'EC'],
  'Aymara': ['BO', 'PE'],
  'Guarani': ['PY', 'AR', 'BO', 'BR'],
  'Nahuatl': ['MX'],
  'Maya': ['MX', 'GT', 'BZ'],
  'Cherokee': ['US'],
  'Navajo': ['US'],
  'Inuktitut': ['CA', 'GL'],
  'Greenlandic': ['GL'],

  // Caribbean Languages
  'Haitian Creole': ['HT'],
  'Papiamento': ['AW', 'CW', 'BQ'],
  'Jamaican Patois': ['JM'],
  'Sranan Tongo': ['SR'],

  // South Asian Languages
  'Maldivian': ['MV'],

  // Central Asian Languages
  'Hazaragi': ['AF'],
  'Nuristani': ['AF'],
  'Balti': ['PK', 'IN'],

  // Sign Languages (Representative regions)
  'American Sign Language': ['US', 'CA'],
  'British Sign Language': ['UK'],
  'French Sign Language': ['FR'],
  'German Sign Language': ['DE'],
  'Japanese Sign Language': ['JP'],
  'Chinese Sign Language': ['CN'],
  'International Sign': ['GLOBAL'],

  // Constructed Languages
  'Esperanto': ['GLOBAL'],
  'Interlingua': ['GLOBAL'],
  'Ido': ['GLOBAL'],
  'Volapük': ['GLOBAL'],
  'Toki Pona': ['GLOBAL'],

  // Ancient/Classical Languages
  'Latin': ['VA', 'CLASSICAL'],
  'Ancient Greek': ['CLASSICAL'],
  'Classical Chinese': ['CLASSICAL'],
  'Coptic': ['EG', 'CLASSICAL'],
  'Ge\'ez': ['ET', 'ER', 'CLASSICAL'],

  // Regional/Minority Languages
  'Yiddish': ['IL', 'US', 'CA', 'AR', 'UA'],
  'Romani': ['RO', 'BG', 'HU', 'SK', 'CZ', 'RS', 'MK', 'TR'],
  'Ladino': ['IL', 'TR', 'ES', 'GR'],
  'Aromanian': ['RO', 'GR', 'AL', 'MK'],
  'Rusyn': ['UA', 'SK', 'PL', 'HU', 'RO', 'RS'],
  'Kashubian': ['PL'],
  'Sorbian': ['DE'],
  'Cornish': ['GB'],
  'Manx': ['IM'],

  // Additional African Languages
  'Akan': ['GH'],
  'Mossi': ['BF'],
  'Dagbani': ['GH'],
  'Gonja': ['GH'],
  'Dagaare': ['GH', 'BF'],
  'Kusaal': ['GH'],
  'Mampruli': ['GH'],
  'Kasem': ['GH', 'BF'],
  'Buli': ['GH'],
  'Frafra': ['GH'],
  'Safaliba': ['GH'],
  'Tampulma': ['GH'],
  'Vagla': ['GH'],
  'Mo': ['GH'],
  'Deg': ['GH'],
  'Nafaanra': ['GH'],
  'Wali': ['GH'],
  'Sissala': ['GH', 'BF'],
  'Chakali': ['GH'],

  // Additional Asian Languages
  'Rohingya': ['MM', 'BD'],
  'Karen': ['MM', 'TH'],
  'Shan': ['MM'],
  'Kachin': ['MM'],
  'Chin': ['MM'],
  'Mon': ['MM', 'TH'],
  'Rakhine': ['MM'],
  'Hmong': ['CN', 'VN', 'LA', 'TH', 'MM'],
  'Mien': ['CN', 'VN', 'LA', 'TH'],
  'Akha': ['CN', 'MM', 'LA', 'TH'],
  'Lisu': ['CN', 'MM', 'TH'],
  'Lahu': ['CN', 'MM', 'TH', 'LA'],
  'Wa': ['CN', 'MM'],
  'Yi': ['CN'],
  'Bai': ['CN'],
  'Hani': ['CN'],
  'Dai': ['CN'],
  'Dong': ['CN'],
  'Yao': ['CN'],
  'She': ['CN'],
  'Tujia': ['CN'],
  'Gelao': ['CN'],
  'Li': ['CN'],
  'Mulao': ['CN'],
  'Qiang': ['CN'],
  'Primi': ['CN'],
  'Nu': ['CN'],
  'Achang': ['CN'],
  'Pumi': ['CN'],
  'Bonan': ['CN'],
  'Dongxiang': ['CN'],
  'Monguor': ['CN'],
  'Salar': ['CN'],
  'Yugur': ['CN'],
  'Uzbek': ['UZ', 'AF', 'KG', 'KZ', 'TJ', 'TM', 'CN'],
  'Karakalpak': ['UZ'],
  'Nogai': ['RU'],
  'Karachay-Balkar': ['RU'],
  'Kumyk': ['RU'],
  'Avar': ['RU'],
  'Dargin': ['RU'],
  'Lezgian': ['RU', 'AZ'],
  'Tabasaran': ['RU'],
  'Lak': ['RU'],
  'Rutul': ['RU', 'AZ'],
  'Tsakhur': ['RU', 'AZ'],
  'Agul': ['RU'],
  'Udi': ['AZ', 'RU'],

  // Papuan Languages
  'Enga': ['PG'],
  'Melpa': ['PG'],
  'Dani': ['ID', 'PG'],
  'Asmat': ['ID'],
  'Fore': ['PG'],
  'Kalam': ['PG'],
  'Iatmul': ['PG'],
  'Chambri': ['PG'],
  'Sepik': ['PG'],
  'Telefol': ['PG'],
  'Oksapmin': ['PG'],

  // Additional European Minority Languages
  'Sami': ['NO', 'SE', 'FI', 'RU'],
  'Karelian': ['FI', 'RU'],
  'Veps': ['RU'],
  'Ingrian': ['RU'],
  'Livonian': ['LV'],
  'Meänkieli': ['SE', 'FI'],
  'Kven': ['NO'],
  'Wymysorys': ['PL'],
  'Vilamovian': ['PL'],
  'Silesian': ['PL', 'CZ'],
  'Moravian': ['CZ'],
  'Pannonian Rusyn': ['HU', 'RS', 'HR'],
  'Burgenland Croatian': ['AT', 'HU'],
  'Prekmurje Slovene': ['SI', 'HU', 'AT'],
  'Resian': ['IT'],
  'Istro-Romanian': ['HR'],
  'Megleno-Romanian': ['MK', 'GR'],

  // Australian Aboriginal Languages
  'Pitjantjatjara': ['AU'],
  'Arrernte': ['AU'],
  'Warlpiri': ['AU'],
  'Yolngu': ['AU'],
  'Kriol': ['AU'],
  'Torres Strait Creole': ['AU'],

  // Additional South American Indigenous Languages
  'Mapudungun': ['CL', 'AR'],
  'Wayuu': ['CO', 'VE'],
  'Embera': ['CO', 'PA'],
  'Tikuna': ['CO', 'PE', 'BR'],
  'Yanomami': ['BR', 'VE'],
  'Xingu': ['BR'],
  'Tupi': ['BR'],
  'Ge': ['BR'],
  'Carib': ['GY', 'SR', 'VE', 'BR'],
  'Arawakan': ['GY', 'SR', 'VE', 'CO', 'PE', 'BR'],

  // Creoles and Pidgins
  'Cape Verdean Creole': ['CV'],
  'Guinea-Bissau Creole': ['GW'],
  'São Tomé Creole': ['ST'],
  'Angolar': ['ST'],
  'Principense': ['ST'],
  'Palenquero': ['CO'],
  'Garifuna': ['HN', 'GT', 'BZ', 'NI'],
  'Chinook Jargon': ['US', 'CA'],
  'Michif': ['CA', 'US'],
  'Bungee': ['CA'],
  'Nigerian Pidgin': ['NG'],
  'Cameroon Pidgin': ['CM'],
  'Fanagalo': ['ZA'],
  'Kitchen Kaffir': ['ZA'],
  'Tsotsitaal': ['ZA'],
  'Sheng': ['KE'],
  'Engsh': ['UG'],
  'Camfranglais': ['CM'],
  'Nouchi': ['CI'],
  'Pular': ['GN', 'SN', 'GM'],
  'Mandinka': ['GM', 'SN', 'GN'],
  'Jola': ['SN', 'GM'],
  'Balanta': ['GW', 'SN'],
  'Bijago': ['GW'],
  'Papel': ['GW'],
  'Mankanya': ['GW', 'SN'],

  // Endangered Languages (examples)
  'Ainu': ['JP', 'RU'],
  'Nivkh': ['RU'],
  'Yukaghir': ['RU'],
  'Even': ['RU'],
  'Evenk': ['RU', 'CN', 'MN'],
  'Nanai': ['RU', 'CN'],
  'Udege': ['RU'],
  'Orok': ['RU'],
  'Negidal': ['RU'],
  'Ulch': ['RU'],
  'Oroch': ['RU'],
  'Manchu': ['CN'],
  'Xibe': ['CN'],
  'Hezhen': ['CN'],
  'Oroqen': ['CN'],
  'Daur': ['CN', 'MN', 'RU'],

  };


  constructor() {
    this.llm = new ChatGroq({
      model: "moonshotai/kimi-k2-instruct",
      temperature: 0.2,
      maxTokens: 2048,
      topP: 1,
      apiKey: process.env.GROQ_API_KEY,
      maxRetries: 3,
      timeout: 45000,
    });

    // Language detection prompt
    this.detectPrompt = PromptTemplate.fromTemplate(`
You are a language detection expert. Analyze the following text and identify its language.

TEXT TO ANALYZE:
{input}

Return ONLY the language name in English (e.g., "English", "Spanish", "French", "Hindi", "Chinese", etc.).
Return only the language name, nothing else.
    `);

    // Translation prompt template
    this.translatePrompt = PromptTemplate.fromTemplate(`
You are an expert multilingual translator with deep knowledge of cultural nuances, local slang, and regional variations.

TRANSLATION TASK:
- Source Language: {sourceLang}
- Target Language: {targetLang}
- Tone: {tone}
{regionInstruction}
{contextInstruction}

INSTRUCTIONS:
1. LOCALIZATION & SLANG:
   - Use authentic local expressions and slang appropriate for the target language and region
   - Consider cultural context and regional variations
   - Adapt idioms and colloquialisms naturally
   - Use region-specific vocabulary when applicable

2. TONE ADAPTATION:
   {toneGuidance}

3. FORMATTING:
   - Maintain the original structure and format exactly
   - If input is JSON, return valid JSON with the same structure
   - If input is an array, return an array with same length
   - If input is a string, return a string
   - Preserve any markup, special characters, or formatting

4. QUALITY STANDARDS:
   - Ensure translation sounds natural to native speakers
   - Maintain the original meaning while adapting to target culture
   - Use appropriate honorifics and politeness levels
   - Consider gender neutrality where culturally appropriate

INPUT TO TRANSLATE:
{input}

CRITICAL: You MUST return ONLY valid JSON in this exact format with no additional text:
{{"translated": <translated_content>}}

The translated content must match the input type exactly:
- If input is a string, translated should be a string
- If input is an array, translated should be an array with same length
- If input is an object, translated should be an object with same keys
    `);
  }

  private getToneGuidance(tone: string): string {
    const toneGuidelines = {
      professional: "Use formal, business-appropriate language. Avoid contractions and slang. Maintain respect and clarity.",
      casual: "Use relaxed, everyday language with contractions and informal expressions. Sound natural and approachable.",
      formal: "Use sophisticated, proper language with complete sentences. Maintain dignity and respect protocols.",
      friendly: "Use warm, welcoming language. Include friendly expressions and maintain a positive, approachable tone.",
      academic: "Use scholarly, precise language. Include technical terms when appropriate and maintain intellectual rigor.",
      conversational: "Use natural, spoken-like language with common expressions and everyday vocabulary.",
      business: "Use corporate-appropriate language. Be clear, direct, and professional while remaining personable.",
      creative: "Use expressive, imaginative language. Embrace literary devices and creative expressions when appropriate.",
      technical: "Use precise, technical language. Maintain accuracy for specialized terms and industry-specific vocabulary.",
      diplomatic: "Use careful, respectful language. Avoid potentially offensive content and maintain neutral, respectful tone.",
      neutral: "Use balanced, standard language that is neither too formal nor too casual. Aim for clear communication."
    };

    return toneGuidelines[tone as keyof typeof toneGuidelines] || toneGuidelines.neutral;
  }

  private validateRegionForLanguage(targetLanguage: string, region?: string): string | undefined {
    if (!region) return undefined;

    const validRegions = this.languageRegionMap[targetLanguage];
    if (!validRegions) {
      console.warn(`No region mapping found for language: ${targetLanguage}, ignoring region: ${region}`);
      return undefined;
    }

    if (!validRegions.includes(region.toUpperCase())) {
      console.warn(`Region ${region} is not valid for ${targetLanguage}. Valid regions: ${validRegions.join(', ')}. Ignoring region.`);
      return undefined;
    }

    return region;
  }

  private async detectLanguage(input: string | string[] | Record<string, string>): Promise<string> {
    try {
      // Convert input to string for detection
      let textToDetect: string;
      if (typeof input === 'string') {
        textToDetect = input;
      } else if (Array.isArray(input)) {
        textToDetect = input.join(' ');
      } else {
        textToDetect = Object.values(input).join(' ');
      }

      const detectionChain = RunnableSequence.from([
        this.detectPrompt,
        this.llm,
        new StringOutputParser()
      ]);

      const detectedLanguage = await detectionChain.invoke({ input: textToDetect.slice(0, 500) }); // Limit text for detection
      return detectedLanguage.trim();
    } catch (error) {
      console.warn("Language detection failed, defaulting to 'Auto-detected':", error);
      return "Auto-detected";
    }
  }

  private async parseOutputWithRetry(output: string, expectedType: 'string' | 'array' | 'object', attempt: number = 1): Promise<any> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const validated = TranslationResponseSchema.parse(parsed);
        
        // Additional type validation
        const translated = validated.translated;
        if (expectedType === 'string' && typeof translated !== 'string') {
          throw new Error(`Expected string but got ${typeof translated}`);
        }
        if (expectedType === 'array' && !Array.isArray(translated)) {
          throw new Error(`Expected array but got ${typeof translated}`);
        }
        if (expectedType === 'object' && (Array.isArray(translated) || typeof translated !== 'object')) {
          throw new Error(`Expected object but got ${Array.isArray(translated) ? 'array' : typeof translated}`);
        }
        
        return validated;
      }
      throw new Error("No valid JSON found in response");
    } catch (error) {
      if (attempt >= this.maxRetries) {
        console.warn(`Failed to parse after ${this.maxRetries} attempts, using fallback`);
        const cleanOutput = output.trim();
        if (cleanOutput.startsWith('"') && cleanOutput.endsWith('"')) {
          return { translated: cleanOutput.slice(1, -1) };
        }
        return { translated: cleanOutput };
      }
      
      console.warn(`Parse attempt ${attempt} failed:`, error);
      throw error; // Re-throw to trigger retry
    }
  }

  private getInputType(input: string | string[] | Record<string, string>): 'string' | 'array' | 'object' {
    if (typeof input === 'string') return 'string';
    if (Array.isArray(input)) return 'array';
    return 'object';
  }

  private generateCacheKey(params: TranslateRequest & { detectedLanguage?: string }): string {
    const cacheParams = {
      to: params.to,
      from: params.from || params.detectedLanguage || 'auto',
      input: params.input,
      tone: params.tone || 'neutral',
      region: params.region || 'default',
      context: params.context || ''
    };
    
    return `translation:${createHash("sha256")
      .update(JSON.stringify(cacheParams))
      .digest("hex")}`;
  }

  private async getCachedTranslation(cacheKey: string): Promise<any | null> {
    try {
      const cached = await redisClient.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Cache retrieval error:", error);
      return null;
    }
  }

  private async setCachedTranslation(cacheKey: string, data: any, ttl: number = 7200): Promise<void> {
    try {
      await redisClient.set(cacheKey, JSON.stringify(data), { EX: ttl });
    } catch (error) {
      console.warn("Cache storage error:", error);
    }
  }

  async translate(params: TranslateRequest): Promise<TranslationResult> {
    const startTime = Date.now();
    let detectedLanguage: string | undefined;

    try {
      // Auto-detect language if not provided
      if (!params.from) {
        console.log("Auto-detecting source language...");
        detectedLanguage = await this.detectLanguage(params.input);
        console.log(`Detected language: ${detectedLanguage}`);
      }

      const sourceLanguage = params.from || detectedLanguage || "Auto-detected";
      
      // Validate and prioritize region based on target language
      const validatedRegion = this.validateRegionForLanguage(params.to, params.region);
      if (params.region && !validatedRegion) {
        console.log(`Prioritizing target language '${params.to}' over invalid region '${params.region}'`);
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey({ ...params, detectedLanguage });

      // Try cache first
      const cachedResult = await this.getCachedTranslation(cacheKey);
      if (cachedResult) {
        console.log(`Serving from cache - Source: ${sourceLanguage}, Target: ${params.to}, Tone: ${params.tone}, Region: ${validatedRegion}`);
        return {
          translated: cachedResult.translated,
          cached: true,
          processingTime: Date.now() - startTime,
          tone: params.tone || 'neutral',
          region: validatedRegion,
          detectedLanguage: !params.from ? detectedLanguage : undefined
        };
      }

      console.log(`Cache miss - Source: ${sourceLanguage}, Target: ${params.to}, Tone: ${params.tone}, Region: ${validatedRegion}, calling LLM`);

      // Prepare translation parameters
      const inputType = this.getInputType(params.input);
      const translationParams = {
        sourceLang: sourceLanguage,
        targetLang: params.to,
        input: typeof params.input === 'string' ? params.input : JSON.stringify(params.input),
        tone: params.tone || 'neutral',
        regionInstruction: validatedRegion ? `- Region: Focus on ${validatedRegion} variant of ${params.to}` : '',
        contextInstruction: params.context ? `- Context: ${params.context}` : '',
        toneGuidance: this.getToneGuidance(params.tone || 'neutral')
      };

      // Create translation chain
      const translationChain = RunnableSequence.from([
        this.translatePrompt,
        this.llm,
        new StringOutputParser()
      ]);

      let result: any;
      let lastError: Error | null = null;

      // Retry loop for output format validation
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          console.log(`Translation attempt ${attempt}/${this.maxRetries}`);
          
          const rawOutput = await translationChain.invoke(translationParams);
          console.log(`Raw LLM output (attempt ${attempt}):`, rawOutput.slice(0, 200) + '...');
          
          result = await this.parseOutputWithRetry(rawOutput, inputType, attempt);
          
          console.log(`Successfully parsed output on attempt ${attempt}`);
          break;
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown parsing error');
          console.warn(`Attempt ${attempt} failed:`, lastError.message);
          
          if (attempt === this.maxRetries) {
            throw new Error(`Failed to get valid output format after ${this.maxRetries} attempts. Last error: ${lastError.message}`);
          }
          
          // Add slight delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (!result) {
        throw lastError || new Error('Translation failed without specific error');
      }

      // Cache the result
      await this.setCachedTranslation(cacheKey, result);
      console.log("Stored in cache with validated format");

      return {
        translated: result.translated,
        cached: false,
        processingTime: Date.now() - startTime,
        tone: params.tone || 'neutral',
        region: validatedRegion,
        detectedLanguage: !params.from ? detectedLanguage : undefined
      };

    } catch (error) {
      console.error("Translation error:", error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Initialize the service
const translationService = new TranslationService();

export const translate = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = TranslateRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validationResult.error.issues,
        availableTones: [
          "professional", "casual", "formal", "friendly", "academic",
          "conversational", "business", "creative", "technical", "diplomatic", "neutral"
        ]
      });
    }

    const { to, from, input, tone, region, context } = validationResult.data;

    // Perform translation
    const result = await translationService.translate({ 
      to, 
      from, 
      input, 
      tone, 
      region, 
      context 
    });

    return res.status(200).json({
      success: true,
      data: result.translated,
      metadata: {
        cached: result.cached,
        processingTime: result.processingTime,
        sourceLanguage: from || result.detectedLanguage || 'Auto-detected',
        targetLanguage: to,
        tone: result.tone,
        region: result.region,
        autoDetected: !from,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Translation endpoint error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.issues
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString()
    });
  }
};

