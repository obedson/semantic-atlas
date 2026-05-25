07:15:07.592 Running build in Washington, D.C., USA (East) – iad1
07:15:07.592 Build machine configuration: 2 cores, 8 GB
07:15:07.710 Cloning github.com/obedson/semantic-atlas (Branch: main, Commit: 0e358b2)
07:15:07.711 Previous build caches not available.
07:15:08.076 Cloning completed: 366.000ms
07:15:08.415 Running "vercel build"
07:15:08.447 Vercel CLI 54.4.1
07:15:08.709 Installing dependencies...
07:15:24.130 
07:15:24.131 added 407 packages in 15s
07:15:24.132 
07:15:24.133 159 packages are looking for funding
07:15:24.133   run `npm fund` for details
07:15:24.193 Detected Next.js version: 16.2.6
07:15:24.199 Running "npm run build"
07:15:24.318 
07:15:24.319 > semantic-atlas@1.0.0 build
07:15:24.319 > next build
07:15:24.319 
07:15:24.857   Applying modifyConfig from Vercel
07:15:24.862 Attention: Next.js now collects completely anonymous telemetry regarding usage.
07:15:24.863 This information is used to shape Next.js' roadmap and prioritize features.
07:15:24.863 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
07:15:24.864 https://nextjs.org/telemetry
07:15:24.864 
07:15:24.882 ▲ Next.js 16.2.6 (Turbopack)
07:15:24.883 
07:15:24.914   Creating an optimized production build ...
07:15:34.554 
07:15:34.554 > Build error occurred
07:15:34.558 Error: Turbopack build failed with 6 errors:
07:15:34.558 ./src/components/CreateExperience.tsx:173:10
07:15:34.559 the name `authority` is defined multiple times
07:15:34.559   171 |   const [interpreter, setInterpreter] = useState(DEMO_INTERPRETER);
07:15:34.559   172 |   const [context, setContext] = useState(DEMO_CONTEXT);
07:15:34.560 > 173 |   const [authority, setAuthority] = useState(DEMO_AUTHORITY);
07:15:34.560       |          ^^^^^^^^^
07:15:34.560   174 |
07:15:34.560   175 |   // Security mode computed state
07:15:34.561   176 |   const activeSecurityMode =
07:15:34.561 
07:15:34.561 Ecmascript file had an error
07:15:34.561 
07:15:34.562 Import trace:
07:15:34.562   Server Component:
07:15:34.562     ./src/components/CreateExperience.tsx
07:15:34.563     ./src/app/create/page.tsx
07:15:34.563 
07:15:34.563 
07:15:34.563 ./src/components/CreateExperience.tsx:172:10
07:15:34.564 the name `context` is defined multiple times
07:15:34.564   170 |   // Advanced states setup
07:15:34.564   171 |   const [interpreter, setInterpreter] = useState(DEMO_INTERPRETER);
07:15:34.564 > 172 |   const [context, setContext] = useState(DEMO_CONTEXT);
07:15:34.565       |          ^^^^^^^
07:15:34.565   173 |   const [authority, setAuthority] = useState(DEMO_AUTHORITY);
07:15:34.565   174 |
07:15:34.565   175 |   // Security mode computed state
07:15:34.566 
07:15:34.566 Ecmascript file had an error
07:15:34.566 
07:15:34.566 Import trace:
07:15:34.567   Server Component:
07:15:34.567     ./src/components/CreateExperience.tsx
07:15:34.567     ./src/app/create/page.tsx
07:15:34.567 
07:15:34.568 
07:15:34.568 ./src/components/CreateExperience.tsx:171:10
07:15:34.568 the name `interpreter` is defined multiple times
07:15:34.568   169 |
07:15:34.569   170 |   // Advanced states setup
07:15:34.569 > 171 |   const [interpreter, setInterpreter] = useState(DEMO_INTERPRETER);
07:15:34.569       |          ^^^^^^^^^^^
07:15:34.569   172 |   const [context, setContext] = useState(DEMO_CONTEXT);
07:15:34.569   173 |   const [authority, setAuthority] = useState(DEMO_AUTHORITY);
07:15:34.570   174 |
07:15:34.570 
07:15:34.570 Ecmascript file had an error
07:15:34.570 
07:15:34.571 Import trace:
07:15:34.571   Server Component:
07:15:34.571     ./src/components/CreateExperience.tsx
07:15:34.571     ./src/app/create/page.tsx
07:15:34.577 
07:15:34.577 
07:15:34.577 ./src/components/CreateExperience.tsx:173:21
07:15:34.578 the name `setAuthority` is defined multiple times
07:15:34.578   171 |   const [interpreter, setInterpreter] = useState(DEMO_INTERPRETER);
07:15:34.578   172 |   const [context, setContext] = useState(DEMO_CONTEXT);
07:15:34.578 > 173 |   const [authority, setAuthority] = useState(DEMO_AUTHORITY);
07:15:34.579       |                     ^^^^^^^^^^^^
07:15:34.579   174 |
07:15:34.579   175 |   // Security mode computed state
07:15:34.579   176 |   const activeSecurityMode =
07:15:34.580 
07:15:34.580 Ecmascript file had an error
07:15:34.580 
07:15:34.580 Import trace:
07:15:34.580   Server Component:
07:15:34.581     ./src/components/CreateExperience.tsx
07:15:34.581     ./src/app/create/page.tsx
07:15:34.581 
07:15:34.581 
07:15:34.582 ./src/components/CreateExperience.tsx:172:19
07:15:34.582 the name `setContext` is defined multiple times
07:15:34.583   170 |   // Advanced states setup
07:15:34.583   171 |   const [interpreter, setInterpreter] = useState(DEMO_INTERPRETER);
07:15:34.583 > 172 |   const [context, setContext] = useState(DEMO_CONTEXT);
07:15:34.583       |                   ^^^^^^^^^^
07:15:34.584   173 |   const [authority, setAuthority] = useState(DEMO_AUTHORITY);
07:15:34.584   174 |
07:15:34.584   175 |   // Security mode computed state
07:15:34.585 
07:15:34.585 Ecmascript file had an error
07:15:34.585 
07:15:34.585 Import trace:
07:15:34.586   Server Component:
07:15:34.586     ./src/components/CreateExperience.tsx
07:15:34.586     ./src/app/create/page.tsx
07:15:34.587 
07:15:34.587 
07:15:34.587 ./src/components/CreateExperience.tsx:171:23
07:15:34.587 the name `setInterpreter` is defined multiple times
07:15:34.587   169 |
07:15:34.588   170 |   // Advanced states setup
07:15:34.588 > 171 |   const [interpreter, setInterpreter] = useState(DEMO_INTERPRETER);
07:15:34.588       |                       ^^^^^^^^^^^^^^
07:15:34.588   172 |   const [context, setContext] = useState(DEMO_CONTEXT);
07:15:34.588   173 |   const [authority, setAuthority] = useState(DEMO_AUTHORITY);
07:15:34.588   174 |
07:15:34.588 
07:15:34.588 Ecmascript file had an error
07:15:34.588 
07:15:34.589 Import trace:
07:15:34.589   Server Component:
07:15:34.589     ./src/components/CreateExperience.tsx
07:15:34.589     ./src/app/create/page.tsx
07:15:34.589 
07:15:34.589 
07:15:34.589     at <unknown> (./src/components/CreateExperience.tsx:173:10)
07:15:34.589     at <unknown> (./src/components/CreateExperience.tsx:172:10)
07:15:34.589     at <unknown> (./src/components/CreateExperience.tsx:171:10)
07:15:34.589     at <unknown> (./src/components/CreateExperience.tsx:173:21)
07:15:34.589     at <unknown> (./src/components/CreateExperience.tsx:172:19)
07:15:34.589     at <unknown> (./src/components/CreateExperience.tsx:171:23)
07:15:34.636 Error: Command "npm run build" exited with 1