15:20:16.250 Running build in Washington, D.C., USA (East) – iad1
15:20:16.250 Build machine configuration: 2 cores, 8 GB
15:20:16.359 Cloning github.com/obedson/semantic-atlas (Branch: main, Commit: ffb6d67)
15:20:16.360 Previous build caches not available.
15:20:16.793 Cloning completed: 434.000ms
15:20:17.052 Running "vercel build"
15:20:17.071 Vercel CLI 54.4.1
15:20:17.248 Installing dependencies...
15:20:33.550 
15:20:33.551 added 407 packages in 16s
15:20:33.551 
15:20:33.552 159 packages are looking for funding
15:20:33.552   run `npm fund` for details
15:20:33.609 Detected Next.js version: 16.2.6
15:20:33.618 Running "npm run build"
15:20:33.722 
15:20:33.723 > semantic-atlas@1.0.0 build
15:20:33.723 > next build
15:20:33.723 
15:20:34.226   Applying modifyConfig from Vercel
15:20:34.231 Attention: Next.js now collects completely anonymous telemetry regarding usage.
15:20:34.231 This information is used to shape Next.js' roadmap and prioritize features.
15:20:34.232 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
15:20:34.232 https://nextjs.org/telemetry
15:20:34.232 
15:20:34.248 ▲ Next.js 16.2.6 (Turbopack)
15:20:34.248 
15:20:34.277   Creating an optimized production build ...
15:20:41.770 ✓ Compiled successfully in 7.2s
15:20:41.772   Running TypeScript ...
15:20:47.615 Failed to type check.
15:20:47.615 
15:20:47.616 ./src/components/MemoryExperience.tsx:456:9
15:20:47.616 Type error: Object literal may only specify known properties, and 'reflection' does not exist in type 'CreateAgentInsightInput'.
15:20:47.616 
15:20:47.616   454 |         memoryKey,
15:20:47.616   455 |         memoryContextKey: stackKey,
15:20:47.616 > 456 |         reflection: insightText.trim(),
15:20:47.616       |         ^
15:20:47.616   457 |         model: generatedModel || selectedModel,
15:20:47.616   458 |         interpreter: targetStack?.payload.interpreter,
15:20:47.616   459 |         context: targetStack?.payload.context,
15:20:47.652 Next.js build worker exited with code: 1 and signal: null
15:20:47.696 Error: Command "npm run build" exited with 1