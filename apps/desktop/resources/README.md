# Bundled local AI resources

Packaging expects these files before running `npm run package -w @mail-agent/desktop`:

- `models/qwen3-4b-q4_k_m-00001-of-00002.gguf`
- `models/qwen3-4b-q4_k_m-00002-of-00002.gguf`
- `bin/win32-x64/llama-server.exe` plus its release DLL files
- `bin/darwin-arm64/llama-server`
- `bin/darwin-x64/llama-server`

Use a pinned llama.cpp release for reproducible beta builds. The Qwen3-4B Q4_K_M model is
distributed under Apache-2.0 by Qwen at `Qwen/Qwen3-4B-GGUF`.

Run `npm run prepare:assets -w @mail-agent/desktop` to download, checksum-verify and split the
model, and to install the current platform's pinned llama.cpp runtime.
