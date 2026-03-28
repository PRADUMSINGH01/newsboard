import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, excerpt, content, tag, slug } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured in .env.local" },
        { status: 500 }
      );
    }

    const prompt = `You are an expert SEO analyst for a Hindi/Indian news website called "Hmar Duniya" (hmarduniya.in). Analyze the following news article and provide an SEO score out of 10 with detailed feedback.

Article Details:
- Title: ${title || "Not provided"}
- Slug/URL: ${slug || "Not provided"}
- Category: ${tag || "Not provided"}
- Excerpt/Meta Description: ${excerpt || "Not provided"}
- Content Length: ${content ? content.length : 0} characters
- Content Preview: ${content ? content.slice(0, 500) : "Not provided"}

Score the article on these SEO criteria (each out of 10, then average):
1. **Title Quality** - Is it compelling, keyword-rich, optimal length (50-60 chars)?
2. **Meta Description** (Excerpt) - Is the excerpt engaging, 150-160 chars, includes keywords?
3. **URL/Slug** - Is it clean, keyword-optimized, not too long?
4. **Content Quality** - Is the content long enough (300+ words), informative, unique?
5. **Category/Tags** - Is the article properly categorized?
6. **Headline Structure** - Does the title follow news headline best practices?

Respond ONLY in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "overallScore": <number 1-10>,
  "scores": {
    "titleQuality": { "score": <number>, "feedback": "<short feedback in English>" },
    "metaDescription": { "score": <number>, "feedback": "<short feedback>" },
    "urlSlug": { "score": <number>, "feedback": "<short feedback>" },
    "contentQuality": { "score": <number>, "feedback": "<short feedback>" },
    "categoryTags": { "score": <number>, "feedback": "<short feedback>" },
    "headlineStructure": { "score": <number>, "feedback": "<short feedback>" }
  },
  "topSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "summary": "<1-2 sentence overall assessment>"
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: `Gemini API error: ${geminiRes.status}` },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const seoResult = JSON.parse(jsonStr);
      return NextResponse.json(seoResult);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: rawText },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
