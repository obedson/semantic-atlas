#!/usr/bin/env node

/**
 * Test script for coding AI integration
 * Run: node scripts/test-coding-ai.js
 */

const { generateCodeInsight } = require("../src/lib/coding-ai");

async function testCodingAI() {
  console.log("🧪 Testing Coding AI Integration\n");

  const testContext = {
    file_path: "src/components/UserProfile.tsx",
    language: "typescript",
    framework: "react",
    dependencies: ["react", "react-hook-form"],
    change_description: "Added user profile form with validation",
    code_snippet: `
export function UserProfile() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = async (data) => {
    await updateProfile(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name", { required: true })} />
      {errors.name && <span>Name is required</span>}
      
      <input {...register("email", { required: true, pattern: /^\\S+@\\S+$/i })} />
      {errors.email && <span>Valid email is required</span>}
      
      <button type="submit">Save</button>
    </form>
  );
}`,
  };

  try {
    console.log("📝 Analyzing code change...\n");
    console.log(`File: ${testContext.file_path}`);
    console.log(`Language: ${testContext.language}`);
    console.log(`Framework: ${testContext.framework}\n`);

    const provider = process.env.DEFAULT_CODE_AI_PROVIDER || "groq";
    console.log(`🤖 Using provider: ${provider}\n`);

    const insight = await generateCodeInsight(testContext, provider);

    console.log("✅ AI Analysis Complete!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    console.log("📊 Understanding:");
    console.log(insight.understanding);
    console.log("\n");

    if (insight.next_steps.length > 0) {
      console.log("🎯 Next Steps:");
      insight.next_steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
      console.log("\n");
    }

    if (insight.related_patterns.length > 0) {
      console.log("🔗 Related Patterns:");
      insight.related_patterns.forEach((pattern) => {
        console.log(`  • ${pattern}`);
      });
      console.log("\n");
    }

    if (insight.potential_issues.length > 0) {
      console.log("⚠️  Potential Issues:");
      insight.potential_issues.forEach((issue) => {
        console.log(`  • ${issue}`);
      });
      console.log("\n");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("✨ Test completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nMake sure you have set up your API keys in .env.local");
    process.exit(1);
  }
}

testCodingAI();
