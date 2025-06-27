import { config } from "dotenv";
import type { Request, Response } from "express";
import { prompt } from "../utils/prompt";

config()

export const translate=async(req:Request,res:Response)=>{
    try{
        const {to, from, input} = req.body
        console.log(input)
        const payload = {
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
            {
                role: "user",
                content: prompt({
                    targetLang:to,
                    sourceLang:from,
                    stringsToTranslate:input
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
        "Authorization": `Bearer ${process.env.GROQ_API_KEY as string}`,
        },
        body: JSON.stringify(payload),
        });

        if (!response.ok) {
            res.status(500).json({
                err:"An unexpected error occured."
            })
            return
        }

        const result:any = await response.json();

        if (result.choices && result.choices[0] && result.choices[0].message?.content) {
            const textResponse = result.choices[0].message.content;
            const parsedResponse = JSON.parse(textResponse);
            console.log(parsedResponse)
            res.status(200).json({
                data:JSON.stringify(parsedResponse)
            })
            return 
        } else {
            throw new Error("Invalid response format from translation API.");
        }
    }
    catch{
        res.status(500).json({error:"An internal server error."})
    }

}