import type { Request, Response } from "express";
import { prompt } from "../utils/prompt";
import { createHash } from "crypto";
import { redisClient } from "../config/redis.config";


export const translate = async (req: Request, res: Response) => {
  try {
    const { to, from, input } = req.body;

    const cacheKey = `translation:${createHash("sha256")
      .update(JSON.stringify({ to, from, input }))
      .digest("hex")}`;

    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      console.log("Serving from cache");
      return res.status(200).json({
        data: cachedResult,
      });
    }

    console.log("Cache miss, calling Groq API");

    const payload = {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: prompt({
            targetLang: to,
            sourceLang: from,
            stringsToTranslate: input,
          }),
        },
      ],
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null,
    };

    const response = await fetch(process.env.GROQ_API_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY as string}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return res.status(500).json({
        err: "An unexpected error occurred.",
      });
    }

    const result: any = await response.json();

    if (
      result.choices &&
      result.choices[0] &&
      result.choices[0].message?.content
    ) {
      const textResponse = result.choices[0].message.content;
      const parsedResponse = JSON.parse(textResponse);
      const stringifiedResponse = JSON.stringify(parsedResponse);

      // 3. Store the result in Redis cache with an expiration time (e.g., 1 hour)
      await redisClient.set(cacheKey, stringifiedResponse, {
        EX: 3600, // a 1 hour expiration
      });

      console.log("Stored in cache");
      return res.status(200).json({
        data: stringifiedResponse,
      });
    } else {
      throw new Error("Invalid response format from translation API.");
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "An internal server error.", message:(e as any).message });
  }
};