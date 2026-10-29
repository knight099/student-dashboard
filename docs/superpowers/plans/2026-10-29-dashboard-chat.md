# Dashboard Chat Implementation Plan

> Implement inline using superpowers:executing-plans; verify before completion.

**Goal:** Deploy the attendance dashboard and working Ollama Cloud chat to Vercel.
**Architecture:** Static HTML with a Node API function. Server-derived summaries ground the chat in the same dataset as the charts.
**Tech Stack:** HTML/CSS/JavaScript, Node built-in test runner, Vercel Functions, Ollama Cloud.
**Spec:** docs/superpowers/specs/2026-10-29-dashboard-chat-design.md

## Global Constraints
- Preserve the current dashboard and filters.
- Never ship API keys in browser assets or source control.
- Use Ollama Cloud, as selected by the user.

## Review Focus
- Invalid filters and histories must fail before an upstream call.
- Empty filtered data must not produce NaN.
- Upstream errors must not disclose credentials or internal responses.
- Chat output is rendered as text to prevent injected HTML.
- Stop and retry must preserve a valid conversation.

## Tasks
- [x] Write and run failing Node tests for context calculations and API validation/errors.
- [x] Extract existing dataset, implement server context and chat handler; pass tests.
- [x] Preserve dashboard in public/index.html and add responsive chat UI.
- [x] Verify tests and browser interaction, deploy with server-only credentials, verify live chat.

## Verification record

10 Node tests pass. Ollama Cloud key verified. Vercel production assets return 200; credential and server source paths return 404. Production filtered chat returned 85.92% attendance, 50 students and 10 below 75%, matching DS-A Hybrid data. Browser visual inspection unavailable because computer-use permissions were not granted.
