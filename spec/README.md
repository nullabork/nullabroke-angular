# Nullabroke Spec Driven Development (SDD)

This folder contains the **executable specifications** for the Nullabroke SEC Filing Research application, following the Spec Driven Development paradigm.

## What is Spec Driven Development?

SDD is an architectural paradigm where **specifications become the authoritative source of truth**, not code. This inverts the traditional relationship where code defines behavior—instead, specs define behavior and code is generated, validated, and continuously aligned to those specs.

> "Architecture is no longer advisory; it is executable and enforceable."  
> — [InfoQ: Spec Driven Development](https://www.infoq.com/articles/spec-driven-development/)

## The Five-Layer SDD Model

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SPECIFICATION LAYER  ─  Declarative Intent (this folder)    │
│    What the system IS, not how it's implemented                 │
├─────────────────────────────────────────────────────────────────┤
│ 2. GENERATION LAYER  ─  Code Generation                        │
│    Transform specs into code, types, validators, tests          │
├─────────────────────────────────────────────────────────────────┤
│ 3. ARTIFACT LAYER  ─  Generated Code                           │
│    Models, services, validators (regenerable, disposable)       │
├─────────────────────────────────────────────────────────────────┤
│ 4. VALIDATION LAYER  ─  Continuous Conformance                 │
│    Contract tests, schema validation, drift detection           │
├─────────────────────────────────────────────────────────────────┤
│ 5. RUNTIME LAYER  ─  The Running Application                   │
│    Behavior constrained by upstream specs                       │
└─────────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
spec/
├── README.md                    # This file
├── api/
│   └── openapi.spec.yaml        # API contracts (enhanced OpenAPI 3.1)
├── domain/
│   ├── company.spec.yaml        # Company domain model
│   ├── document.spec.yaml       # Document domain model
│   ├── filing.spec.yaml         # Filing domain model
│   └── query.spec.yaml          # Query language specification
├── ui/
│   └── components.spec.yaml     # UI component contracts
├── policies/
│   ├── security.spec.yaml       # Security boundaries & auth policies
│   └── compatibility.spec.yaml  # Versioning & evolution rules
└── validation/
    └── rules.spec.yaml          # Cross-cutting validation rules
```

## Key Principles

### 1. Specs Are the Source of Truth
- Implementation code is **derived** from specs
- When specs change, code is regenerated
- Drift between spec and implementation is a **defect**

### 2. Specs Are Machine-Executable
- Not documentation that drifts
- Used to generate: types, validators, mocks, tests, SDKs

### 3. Continuous Validation
- Contract tests run in CI/CD
- Schema validation at build time
- Drift detection prevents deployment of non-conforming code

### 4. Human-in-the-Loop for Intent
- Machines handle enforcement and generation
- Humans define intent, policy, and meaning
- Breaking changes require human approval

## How to Use These Specs

### Generate TypeScript Types
```bash
npm run spec:generate:types
```

### Generate API Client
```bash
npm run spec:generate:client
```

### Validate Implementation Against Specs
```bash
npm run spec:validate
```

### Run Contract Tests
```bash
npm run spec:test:contracts
```

## Workflow

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Edit Spec     │────▶│  Generate      │────▶│  Validate      │
│  (Human)       │     │  (Automated)   │     │  (Automated)   │
└────────────────┘     └────────────────┘     └────────────────┘
        │                      │                      │
        │                      ▼                      │
        │              ┌────────────────┐            │
        │              │  Implement     │            │
        │              │  (Human/AI)    │            │
        │              └────────────────┘            │
        │                      │                      │
        │                      ▼                      │
        └──────────────────────┴──────────────────────┘
                              │
                              ▼
                  ┌────────────────────┐
                  │  Deploy if Valid   │
                  └────────────────────┘
```

## Benefits

1. **Architectural Determinism**: Runtime behavior is predictable from specs
2. **Reduced Drift**: Continuous enforcement prevents silent divergence
3. **Multi-Language Parity**: Same spec generates consistent artifacts across platforms
4. **Self-Documenting**: Specs ARE the documentation (always current)
5. **Contract-First Development**: APIs designed before implementation

## Trade-offs to Consider

1. **Schema Complexity**: Specs become first-class infrastructure requiring maintenance
2. **Generator Trust**: Code generators become critical infrastructure
3. **Cognitive Shift**: Engineers must think in invariants, not just features
4. **Validation Cost**: Runtime contract validation has overhead

---

*This specification-driven approach ensures that what is declared is what is delivered.*
