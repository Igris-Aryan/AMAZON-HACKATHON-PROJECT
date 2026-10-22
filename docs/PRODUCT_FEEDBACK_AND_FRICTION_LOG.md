# Hackathon Product Feedback & Friction Log

## 1. Developer Product Feedback

### A. Google Gemini 3.8 Flash SDK (`@google/genai`)
- **Developer Tool / SDK Used:** `@google/genai` v2.4.0 TypeScript SDK with model `gemini-3.8-flash`.
- **Purpose of Integration:** Structured planning and decomposition of natural language smart-home instructions into validated JSON action plans.
- **What Worked Well:**
  - Fast response latency and reliable compliance with `responseSchema` and `Type.OBJECT` specifications.
  - Seamless server-side authentication via `process.env.GEMINI_API_KEY`.
- **What Needs Improvement:**
  - Clearer TypeScript typing for optional nested object definitions in `responseSchema`.
- **Onboarding Experience:** Highly intuitive; modern `ai.models.generateContent` API is cleaner than legacy syntax.
- **Would You Use Again:** Yes, for reliable structured tool calling and intent decomposition.

### B. Amazon Bedrock Runtime API (AWS Builder Mini Challenge)
- **Developer Tool / SDK Used:** Amazon Bedrock Runtime API with model `anthropic.claude-3-haiku-20240307-v1:0`.
- **Purpose of Integration:** Alternative enterprise AI planning provider for structured smart home action plans.
- **What Worked Well:**
  - Decoupled server-side credential detection allowing graceful reporting when AWS keys are absent.
- **What Needs Improvement:**
  - Cross-region model availability and quota restrictions during hackathon periods.
- **Would You Use Again:** Yes, especially for multi-cloud enterprise redundancy.

---

## 2. Developer Friction Log

### Entry 1: Independent State Verification vs Tool Execution Acknowledgments
- **Task Attempted:** Distinguishing between a smart device network ACK (e.g. HTTP 200 from a bridge) and actual physical actuator state.
- **Steps Taken:** Implemented a separate verification query that reads hardware state directly after mutation rather than inferring success from the execution response.
- **Expected Behavior:** An ACK should never be marked as "Verified" without an explicit telemetry check.
- **Actual Behavior:** Conventional assistants mark the entire action as successful the moment the tool invocation returns without throwing an exception.
- **Severity:** High (integrity issue in smart-home automation).
- **Workaround / Solution:** Created the `IndependentVerificationEngine` with explicit `VERIFIED`, `FAILED`, and `UNVERIFIED` postcondition checks.
- **Actionable Recommendation:** Future agent protocols (including MCP) should formally separate tool execution responses from postcondition assertion telemetry.

### Entry 2: High-Risk Permission Boundaries for Physical Entry (Door Locks)
- **Task Attempted:** Preventing autonomous AI agents from unlocking exterior doors during routine sleep commands.
- **Steps Taken:** Established a 3-tier risk policy (`LOW`, `MEDIUM`, `HIGH`).
- **Expected Behavior:** Commands like *"Prepare house for sleep"* should audit door lock state without disengaging perimeter locks.
- **Actual Behavior:** Unconstrained LLMs sometimes execute `unlock_door` when trying to ensure a door is accessible.
- **Severity:** Critical (physical security vulnerability).
- **Workaround / Solution:** High-risk actions strictly halt execution and require cryptographic/session binding of user approval to the exact action arguments.
- **Actionable Recommendation:** AI agent frameworks must enforce policy gates on the server side prior to tool dispatch.
