# AI Technology Radar - May 2026

**Date:** 2026-05-04
**Status:** ACTIVE
**Review Cycle:** Quarterly

---

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                    REZ AI TECHNOLOGY RADAR                                    ║
║                                                                               ║
║              Strategic Technology Assessment for REZ Ecosystem                  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## How to Read This Radar

| Ring | Meaning | Action |
|------|---------|--------|
| **ADOPT** | Ready for production use | Implement now |
| **TRIAL** | Proven in POC, validate in production | Run pilots |
| **ASSESS** | Exploring for future value | Investigate |
| **HOLD** | Not relevant or deprecated | Avoid |

---

## ADOPT - Ready for Production

### Transformer-based NLU

**What:** Large language models for natural language understanding
**Why:** Foundation of modern AI assistants
**REZ Status:** Pattern matching + keyword analysis (legacy)
**Action:** Upgrade to transformer-based NLU via Claude API

```
Current: Pattern matching rules
Target:  Claude Haiku for intent + Claude Sonnet for complex reasoning
Timeline: Q2 2026
```

### Diffusion Models for Images

**What:** AI image generation and editing
**Why:** Product visualization, marketing content
**REZ Status:** Static image serving
**Action:** Integrate for dynamic product imagery

```
Use Cases:
- Auto-generate product variations
- Personalized marketing visuals
- AR try-on foundation
```

### Graph Neural Networks

**What:** Network analysis for relationship modeling
**Why:** User behavior, merchant relationships, recommendation graphs
**REZ Status:** Basic recommendation engine
**Action:** Implement GNN for complex relationship modeling

```
Applications:
- User-merchant affinity graphs
- Social commerce recommendations
- Fraud ring detection
```

### RLHF for Alignment

**What:** Reinforcement Learning from Human Feedback
**Why:** Ensure AI responses align with brand voice
**REZ Status:** Rule-based response generation
**Action:** Start collecting feedback for RLHF pipeline

```
Priority: HIGH
Data Needed: Response ratings, corrections
```

---

## TRIAL - Proof of Concept Stage

### Multimodal Models (GPT-4V, Claude with Vision)

**What:** Process images, charts, documents alongside text
**Why:** Receipt scanning, menu OCR, visual search
**REZ Status:** CV Lead has scope defined
**Pilot Required:** Receipt → expense tracking

```typescript
// POC Scope
interface MultimodalPOC {
  input: Image | PDF | Screenshot;
  output: StructuredData | Analysis;
  useCases: [
    'Receipt parsing for expense tracking',
    'Menu OCR for restaurant onboarding',
    'Product image search',
    'Invoice verification'
  ];
}
```

**Timeline:** 4 weeks POC
**Success Metric:** 90% accuracy on receipt parsing

### Autonomous Agents

**What:** AI agents that execute multi-step tasks
**Why:** Automate complex workflows (order management, customer resolution)
**REZ Status:** 8 demand-signal agents exist
**Pilot Required:** Merchant onboarding agent

```typescript
// Agent Architecture
interface MerchantOnboardingAgent {
  capabilities: [
    'Create merchant profile',
    'Configure menu/services',
    'Set pricing and offers',
    'Enable payment processing',
    'Launch storefront'
  ];
  tools: ['Rez API', 'LLM reasoning', 'Human handoff'];
  maxIterations: 10;
}
```

**Timeline:** 6 weeks POC
**Success Metric:** Reduce onboarding time by 70%

### RAG Systems

**What:** Retrieval Augmented Generation for grounded responses
**Why:** Reduce hallucinations, access real-time data
**REZ Status:** Knowledge base exists (MongoDB)
**Pilot Required:** Enhanced support copilot with RAG

```typescript
// RAG Architecture
interface RAGSystem {
  vectorStore: 'Pinecone | Weaviate | ChromaDB';
  chunkStrategy: 'Semantic | Recursive';
  retrievalTopK: 5;
  reranking: true;
  freshnessFilter: 'Real-time sync';
}
```

**Timeline:** 3 weeks POC
**Success Metric:** 95% factual accuracy

### Vector Databases

**What:** Specialized storage for embeddings
**Why:** Semantic search, similarity matching, RAG
**REZ Status:** Not deployed
**Pilot Required:** Evaluate Pinecone vs Weaviate

```typescript
// Evaluation Criteria
const vectorDbComparison = {
  pinecone: { pros: ['Managed', 'Scalable'], cons: ['Cost', 'Vendor lock-in'] },
  weaviate: { pros: ['Open source', 'Hybrid search'], cons: ['Self-hosted'] },
  chromadb: { pros: ['Simple', 'Local'], cons: ['Scale limitations'] }
};
```

**Timeline:** 2 weeks evaluation
**Recommendation:** Weaviate for hybrid search, scale to Pinecone if needed

---

## ASSESS - Exploring

### Edge AI

**What:** Run AI inference on-device (mobile, IoT)
**Why:** Offline capability, reduced latency, privacy
**REZ Status:** Not assessed
**Research:** TensorFlow Lite, CoreML integration

```
Potential Uses:
- Offline receipt scanning
- Local fraud detection
- On-device personalization
```

### Federated Learning

**What:** Train models without centralizing data
**Why:** Privacy-preserving ML, regulatory compliance
**REZ Status:** Not assessed
**Research:** Apply when we have multi-tenant data at scale

```
Use Cases:
- Cross-merchant recommendations without sharing data
- Privacy-compliant user modeling
```

### Neuromorphic Computing

**What:** Brain-inspired chips for ultra-efficient inference
**Why:** Battery-powered devices, real-time processing
**REZ Status:** Monitoring only
**Timeline:** 3-5 years before enterprise-ready

```
Status: CES 2026 demos (Innatera), not production-ready
```

### Quantum ML

**What:** Quantum computing for optimization problems
**Why:** Route optimization, portfolio optimization
**REZ Status:** Not assessed
**Timeline:** 5+ years for practical applications

```
Use Cases (Future):
- Dynamic pricing optimization
- Logistics routing
```

---

## HOLD - Not Relevant

### Traditional ML (Deprecated)

**What:** Logistic regression, decision trees, SVMs
**Why:** Superseded by deep learning for our use cases
**REZ Status:** Existing analytics may use
**Action:** Migrate to neural approaches

```
Exception: Explainability requirements may justify simpler models
```

### Rule-based Chatbots

**What:** Flow-based conversation trees
**Why:** Outdated, poor UX
**REZ Status:** Legacy systems only
**Action:** Deprecate in favor of LLM-based

---

## Technology Priority Matrix

| Technology | Impact | Effort | Priority | Timeline |
|------------|--------|--------|----------|----------|
| Transformer NLU | HIGH | MEDIUM | **P0** | Q2 2026 |
| RAG Systems | HIGH | LOW | **P0** | Q2 2026 |
| Multimodal | HIGH | HIGH | **P1** | Q3 2026 |
| Vector DBs | HIGH | LOW | **P1** | Q2 2026 |
| Autonomous Agents | MEDIUM | HIGH | **P2** | Q3 2026 |
| Edge AI | MEDIUM | HIGH | **P3** | Q4 2026 |
| Federated Learning | LOW | HIGH | **P4** | 2027+ |

---

## Recommended Actions

### Immediate (This Quarter)

1. **Upgrade NLU** - Integrate Claude API for intent detection
2. **Deploy RAG** - Add vector DB to support copilot
3. **Launch Multimodal POC** - Receipt scanning use case

### Next Quarter

4. **Autonomous Agent Pilot** - Merchant onboarding
5. **Evaluate Edge AI** - TensorFlow Lite POC

### Future Planning

6. **Federated Learning Research** - Privacy-preserving ML
7. **Neuromorphic Monitoring** - Track hardware developments

---

## Appendix: Vendor Landscape

### LLM Providers

| Provider | Model | Best For | Cost |
|----------|-------|----------|------|
| Anthropic | Claude 3.5 Sonnet | Complex reasoning, safety | Medium |
| Anthropic | Claude 3 Haiku | Fast inference, cost-sensitive | Low |
| OpenAI | GPT-4o | Multimodal, function calling | Medium |
| Google | Gemini 1.5 | Long context, multimodal | Medium |

### Vector DBs

| Database | Type | Best For | Scale |
|----------|------|----------|-------|
| Weaviate | Open Source | Hybrid search, real-time | 10M vectors |
| Pinecone | Managed | Production scale | 1B+ vectors |
| ChromaDB | Local | Prototyping | 100K vectors |
| Qdrant | Open Source | High performance | 100M vectors |

### MLOps Platforms

| Platform | Use Case |
|----------|----------|
| Weights & Biases | Experiment tracking |
| MLflow | Model registry |
| Seldon | Model serving |
| Vertex AI | End-to-end GCP |

---

**Next Review:** August 2026
**Owner:** Research Lead (Agent-8)

---
