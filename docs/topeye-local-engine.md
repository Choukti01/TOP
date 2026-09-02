# T0PEYE Local Engine

T0PEYE Core is TOP’s local-first AI profile. It is not a claim that TOP trained a frontier base model from zero. The base model supplies language capability; TOP supplies the product intelligence, privacy boundaries, project context, artifact system, and work philosophy.

## Local architecture

1. Ollama runs only on the person’s computer at `127.0.0.1:11434`.
2. TOP’s local Node API talks to that loopback address only.
3. The Vue app talks to the local TOP API, never directly to Ollama.
4. `ai/topeye/Modelfile` creates the `topeye-core` profile from the local `smollm:1.7b` base model.
5. T0PEYE receives only the conversation and the project context the person explicitly selected.

The production API deliberately disables this engine. A hosted web service must never attempt to reach a person’s laptop.

## Starter model choice

The first profile uses `smollm:1.7b`, a compact Apache-2.0 model that is appropriate for the current laptop’s 8 GB memory and integrated graphics. It is suitable for experiments, concise plans, structured drafts, and T0PEYE workflow testing. It is not a substitute for a larger cloud model on broad reasoning or difficult programming.

Do not install a large model on this laptop yet. The 7B and larger families increase memory pressure sharply; 19 GB to 23 GB agentic coding models are outside this machine’s practical range.

## Create T0PEYE Core locally

From the TOP repository after Ollama is running:

```bash
ollama pull smollm:1.7b
ollama create topeye-core -f ai/topeye/Modelfile
```

Then start TOP’s backend and frontend locally. In development, `TOPEYE_ENGINE=ollama` and `TOPEYE_MODEL=topeye-core` are the defaults shown in `backend/.env.example`.

## What makes T0PEYE its own intelligence system

1. Mode-specific work frames for chat, planning, coding, research, and creation.
2. Private project context with explicit user selection and locked conversation intent.
3. Kept artifacts rather than disposable answers.
4. Evidence and reflection systems that connect thinking to real movement.
5. Future consent-based memory, retrieval, tool approvals, evaluation tasks, and specialist routing.

## Training path

Do not train a foundation model from scratch. First collect a small, consented evaluation set of excellent TOP plans, project critiques, research structures, and artifact transformations. Then evaluate the local profile against that set. A future LoRA or other parameter-efficient adapter can teach a larger open base model TOP-specific patterns without retraining every parameter.

Never use private conversations, messages, profile data, or project material for training without an explicit opt-in and a deletion path.
