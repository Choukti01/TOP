# T0PEYE Foundation

T0PEYE is TOP’s private intelligence space. It helps a person think, plan, code, research, and create without turning their attention into a product.

The first release is a foundation, not a claim that TOP has trained its own frontier model. TOP owns the interface, permissions, memory boundaries, artifacts, and project relationship. A configured model provider supplies the reasoning engine.

## Current capabilities

1. Private, authenticated T0PEYE spaces
2. Five work modes: Chat, Plan, Code, Research, and Create
3. Persistent conversation metadata and kept artifacts
4. Optional project context selected before the first message
5. Server-only model-provider connection
6. Per-user rate limits for generation and writing actions
7. Explicit library actions for keeping useful AI outputs
8. Conversation deletion controlled by the owner

## Privacy contract

1. A T0PEYE thread belongs to one TOP account.
2. A project can only be attached after TOP confirms the account owns it or belongs to its circle.
3. Only the selected project’s title, purpose, direction, status, and next action are offered to the model.
4. A project context is locked after the first message so conversation intent remains clear.
5. TOP does not send API keys to the browser.
6. The provider request sets `store: false`. TOP remains the system of record for the conversation it keeps.
7. T0PEYE cannot publish, invite, contact, delete, deploy, purchase, or change work outside its private conversation.

## Database records

`topeye_threads` stores a private space and optional project relationship.

`topeye_messages` stores user and assistant messages in chronological order.

`topeye_artifacts` stores work a person explicitly chooses to keep, such as a plan, code concept, research note, document, or design direction.

Future releases can add uploads, citations, tool runs, durable memory, model usage records, and explicit action approvals. Those features should remain separate tables with the same owner and project permission checks.

## Configure a model provider

The foundation deploys without a provider key, but live AI replies remain disabled until one is configured.

1. Create a provider API key in the account TOP will use for T0PEYE.
2. In Render, open the TOP API service.
3. Open Environment.
4. Add `OPENAI_API_KEY` with that secret value.
5. Optionally add `TOPEYE_MODEL` if you want to deliberately select a supported model. Leave it blank to use TOP’s default.
6. Save the variables and manually deploy the latest API commit.
7. Open `/topeye` while signed in. Its connection notice changes when the secure provider is ready.

Never add the provider key to GitHub, Netlify, frontend environment files, screenshots, or chat messages.

## Delivery path

1. Foundation: private spaces, modes, persistent artifacts, model boundary, project-aware context
2. Craft: streaming replies, artifact editor, code preview, document canvas, source citations
3. Memory: consent-based uploads, semantic retrieval, personal memory controls, deletion tools
4. Tools: project creation, milestone drafting, research actions, file work, controlled TOP actions
5. Intelligence: model routing, evaluation suites, cost controls, optional specialized fine-tuning

Every stage must preserve the same rule: the person decides what becomes real.
