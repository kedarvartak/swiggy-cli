# Roadmap

## Product Summary

Swiggy CLI is pivoting from a Swiggy-only command interface into a reusable workflow runtime for consumer software. The new product thesis is that apps should have shareable skills: reusable workflows that sit above raw MCP tools and can be published, discovered, and executed by others.

Swiggy remains the first target because food ordering is a strong example of multi-constraint intent. A user does not just want to call `search_restaurants`; they want outcomes such as:

- order a healthy meal under 7 km away
- ensure the meal has around 80 g of protein
- choose only restaurants with at least a 4-star rating
- stay under a budget or respect cuisine and dietary preferences

That is the layer this product now wants to own.

## What The CLI Does Today

The codebase already has the MCP-backed foundations needed for the pivot:

- discover restaurants
- inspect menus
- manage cart state
- place orders
- track active orders

It also includes a local workflow catalog and mock tooling for MCP development.

## What We Are Pivoting Toward

The product direction now has four parts:

### 1. App Tools Over MCP

Each app exposes concrete capabilities through MCP tools. In Swiggy, that means restaurant discovery, menu lookup, cart mutations, order placement, and tracking.

### 2. Workflow Skills

Reusable workflows capture the decision-making layer above those tools. A workflow skill can express filtering rules, ranking logic, fallback behavior, cart-building strategy, and execution sequencing.

### 3. Marketplace Distribution

Users should be able to reference workflows created by others instead of hand-authoring every automation themselves. That turns the CLI into an execution runtime for marketplace-hosted app skills.

### 4. Multi-App Generalization

Swiggy is the starting point, not the ceiling. The long-term category is workflows for everyday software, where apps expose tools and the community builds reusable skills on top.

## Why This Matters

This creates value for:

- end users who want outcome-based automation instead of manual app navigation
- teams who want to encode repeatable operational playbooks as reusable skills
- developers who want a standard way to package and distribute app workflows
- marketplaces that can monetize or curate high-quality workflow definitions

## Near-Term Milestones

### Workflow-Centric Documentation

Reframe the repository around skills, workflow execution, and marketplace distribution while clearly separating current implementation from target state.

### Workflow Packaging Model

Define what a workflow artifact looks like, including metadata, required inputs, tool dependencies, execution steps, and safety constraints.

### Workflow Execution Layer

Add a runtime layer that resolves a workflow reference, binds user inputs, plans tool calls, and executes against the Swiggy MCP surface.

### Workflow Discovery And Installation

Design a registry or marketplace interface that allows users to reference published workflows by name or identifier.

### Better Evaluation Scenarios

Use high-value examples such as macro-constrained healthy meals, team lunch planning, budget optimization, and repeat ordering to validate the workflow model.

## Deliberate Non-Scope For The Immediate Pivot

The immediate pivot does not yet require:

- a full public marketplace implementation
- live ranking models for nutrition or restaurant quality
- generalized support for every Swiggy product line
- cross-app workflow orchestration beyond the Swiggy proving ground
- production-grade hosting, billing, or creator monetization systems

## Long-Term Direction

The long-term direction is to make software use more like invoking a skill than clicking through screens. Swiggy CLI becomes the reference runtime where MCP tools provide app actions and marketplace workflows provide reusable intelligence.
