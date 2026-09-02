# T0PEYE Foundation

T0PEYE is TOP’s private intelligence space. It helps a person think, plan, code, research, and create without turning their attention into a product.

The first release is a foundation, not a claim that TOP has trained a frontier base model from zero. TOP owns the interface, permissions, memory boundaries, artifacts, project relationship, and local intelligence profile. Ollama supplies the local base model runtime.

## Current capabilities

1. Private, authenticated T0PEYE spaces
2. Five work modes: Chat, Plan, Code, Research, and Create
3. Persistent conversation metadata and kept artifacts
4. Optional project context selected before the first message
5. Local-only model connection through the person’s own Ollama runtime
6. Per-user rate limits for generation and writing actions
7. Explicit library actions for keeping useful AI outputs
8. Conversation deletion controlled by the owner

## Privacy contract

1. A T0PEYE thread belongs to one TOP account.
2. A project can only be attached after TOP confirms the account owns it or belongs to its circle.
3. Only the selected project’s title, purpose, direction, status, and next action are offered to the model.
4. A project context is locked after the first message so conversation intent remains clear.
5. The Vue app never talks to Ollama directly. It communicates only with TOP’s local Node API.
6. TOP refuses non-loopback Ollama URLs, so a development configuration cannot silently send a person’s work to a remote endpoint.
7. T0PEYE cannot publish, invite, contact, delete, deploy, purchase, or change work outside its private conversation.

## Database records

`topeye_threads` stores a private space and optional project relationship.

`topeye_messages` stores user and assistant messages in chronological order.

`topeye_artifacts` stores work a person explicitly chooses to keep, such as a plan, code concept, research note, document, or design direction.

Future releases can add uploads, citations, tool runs, durable memory, model usage records, and explicit action approvals. Those features should remain separate tables with the same owner and project permission checks.

## Run T0PEYE Core locally

T0PEYE replies are intentionally enabled only in a local development copy of TOP. A public deployment cannot reach someone’s laptop, and it should not pretend that it can.

1. Install and start Ollama on the computer running the TOP backend.
2. From the TOP repository, run `ollama pull smollm:1.7b`.
3. Run `ollama create topeye-core -f ai/topeye/Modelfile`.
4. Keep the development defaults in `backend/.env`: `TOPEYE_ENGINE=ollama`, `OLLAMA_BASE_URL=http://127.0.0.1:11434`, and `TOPEYE_MODEL=topeye-core`.
5. Start TOP locally and open `/topeye` while signed in. The connection notice changes to Local Core Ready when the profile is available.

The hosted TOP site shows the rest of the T0PEYE foundation but leaves live inference disabled until TOP has a deliberately designed hosted-compute path.

## Delivery path

1. Foundation: private spaces, modes, persistent artifacts, local engine boundary, project-aware context
2. Craft: streaming replies, artifact editor, code preview, document canvas, source citations
3. Memory: consent-based uploads, semantic retrieval, personal memory controls, deletion tools
4. Tools: project creation, milestone drafting, research actions, file work, controlled TOP actions
5. Intelligence: model routing, evaluation suites, specialist adapters, and a deliberately funded hosted engine

Every stage must preserve the same rule: the person decides what becomes real.
