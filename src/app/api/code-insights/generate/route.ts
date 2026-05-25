import { NextRequest, NextResponse } from "next/server";
import { generateCodeInsight, type CodeContext } from "@/lib/coding-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { file_path, language, code_snippet, change_description, framework, dependencies, provider } = body;

    // Validate required fields
    if (!file_path || !language || !code_snippet || !change_description) {
      return NextResponse.json(
        { error: "Missing required fields: file_path, language, code_snippet, change_description" },
        { status: 400 }
      );
    }

    const context: CodeContext = {
      file_path,
      language,
      code_snippet,
      change_description,
      framework,
      dependencies,
    };

    const insight = await generateCodeInsight(context, provider || "groq");

    return NextResponse.json({
      success: true,
      insight,
      provider: provider || "groq",
    });
  } catch (error) {
    console.error("Code insight generation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate code insight",
      },
      { status: 500 }
    );
  }
}
