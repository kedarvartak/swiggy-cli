// ============================================================================
//  DEMO STORYBOARD  — this is the ONLY file you normally edit.
// ----------------------------------------------------------------------------
//  Each scene is pure data: the narration that will be spoken, and a list of
//  on-screen actions to perform while it is spoken. The recorder dwells on a
//  scene for exactly as long as its narration audio lasts (+ config.paddingSec),
//  so the video always stays in sync with the voiceover.
//
//  Action vocabulary (see record.mjs for the implementations):
//    { type: "goto",   hash: "#/workflows" }      navigate via the URL hash
//    { type: "click",  text: "Try Workflows" }    click an element by its text
//    { type: "scroll", to: "bottom" | "top" | <px> }
//    { type: "hover",  text: "..." }              hover an element by its text
//    { type: "wait",   ms: 800 }                  explicit pause mid-scene
//
//  The app uses HASH-based navigation (see frontend/src/App.tsx):
//    home              ->  #/        (Hero + HomeContinuation)
//    workflow studio   ->  #/workflows
//    workflow creation ->  #/workflow-creation?mode=author   (or mode=run)
// ============================================================================

export const config = {
  baseUrl: "http://localhost:5173",
  viewport: { width: 1440, height: 900 },
  // Seconds of quiet hold after each narration line finishes, before the next
  // scene begins. Gives the eye a beat to absorb the screen. Tune to taste.
  paddingSec: 0.8,
  // Words-per-minute used to ESTIMATE scene length when no TTS key is present.
  fallbackWpm: 155,
  voice: {
    provider: "elevenlabs",        // "elevenlabs" | "none"
    voiceId: "cgSgspJ2msm6clMCkdW9", // "Jessica" — playful, bright, warm; swap freely
    modelId: "eleven_turbo_v2_5",
    // API key is read from the ELEVENLABS_API_KEY environment variable.
  },
};

export const scenes = [
  // ----- Scene 1: filled in as a worked EXAMPLE of the shape -----------------
  {
    id: "intro",
    narration:
      "Meet the Swiggy Workflow Studio — where ordering food becomes an automated, AI-powered workflow.",
    actions: [
      { type: "goto", hash: "#/" },
      { type: "wait", ms: 600 },
    ],
  },

  // ----- Starter narration drafted for you — edit the tone/wording freely ----
  {
    id: "open-studio",
    narration:
      "From the home screen, a single click opens the studio — your command center for every automated ordering flow.",
    actions: [
      { type: "click", text: "Try Workflows" },
      { type: "goto", hash: "#/workflows" }, // fallback if the click selector drifts
      { type: "wait", ms: 500 },
    ],
  },
  {
    id: "browse-workflows",
    narration:
      "This is the marketplace — a catalog of ready-to-run workflows, like the Healthy Meal Finder. And there are really two kinds of people who use it.",
    actions: [
      { type: "scroll", to: "bottom" },
      { type: "wait", ms: 600 },
      { type: "scroll", to: "top" },
    ],
  },
  // ----- Persona 1: the consumer — one-tap adopt, no internals --------------
  {
    id: "consumer-adopt",
    narration:
      "If you just want results, you adopt a workflow straight from the marketplace — one tap adds it to your Swiggy app, ready to run. You never see the steps or the wiring underneath; it simply works.",
    actions: [
      { type: "goto", hash: "#/workflows" },
      { type: "wait", ms: 500 },
      { type: "hover", text: "Run" }, // the one-tap "use this" action on a card
    ],
  },
  // ----- Persona 2: the creator — full studio, nodes, run loop --------------
  //       (the run flow needs VITE_DEMO_MODE=true)
  {
    id: "run-configure",
    narration:
      "Creators get the full picture. Open a workflow in the studio, and you can configure every input — the budget, the delivery distance, the nutrition target that shapes each run.",
    actions: [
      { type: "goto", hash: "#/workflow-creation?workflow=swiggy.healthy-meal&mode=run" },
      { type: "wait", ms: 1300 }, // inputs modal renders
    ],
  },
  {
    id: "run-plan",
    narration:
      "For the creator, the workflow is laid out as a visual graph — six steps, each one a real tool call. This is the wiring a consumer never has to think about, but a creator can inspect and fine-tune.",
    actions: [
      { type: "click", text: "Create plan" }, // demo plan ~900ms, then closes the modal
      { type: "wait", ms: 1700 },
    ],
  },
  {
    id: "run-execute",
    narration:
      "Press start, and the workflow executes end to end — then pauses at an approval gate. Here's the cart it assembled: a grilled chicken bowl, three hundred forty-nine rupees, within budget and hitting the protein target. Nothing is ordered until you say so. That human-in-the-loop check is what makes the automation safe to trust.",
    actions: [
      { type: "click", text: "Start run" }, // demo run ~1300ms, then stops at approval gate
      { type: "wait", ms: 2200 },
    ],
  },
  {
    id: "run-approve",
    narration:
      "One click to approve, and the run completes — all six steps green, with a reviewable cart ready to go. What used to be ten minutes of searching and comparing is now a single, repeatable workflow.",
    actions: [
      { type: "click", text: "Approve" }, // demo approve ~550ms, then completes
      { type: "wait", ms: 1600 },
    ],
  },
  {
    id: "create-workflow",
    narration:
      "And creators can build entirely new workflows from a plain-language description — the AI structures it into steps, tools, and approval gates. Publish it to the marketplace, and anyone can adopt it in a single tap.",
    actions: [
      { type: "goto", hash: "#/workflow-creation?mode=author" },
      { type: "wait", ms: 700 },
    ],
  },
  {
    id: "outro",
    narration:
      "Creators build the workflows. Everyone else just adds them and goes. Design it, run it, Swiggy it.",
    actions: [
      { type: "goto", hash: "#/" },
      { type: "wait", ms: 600 },
    ],
  },
];
