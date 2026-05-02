# Feature-Based vs. Layered Architecture Comparison

This document details the trade-offs between organizing files by feature (Module-Specific Folders) versus organizing files by layer (Global Folders) in NestJS and enterprise microservices.

---

## 1. Feature-Based Architecture (Folder-by-Feature)
*Currently utilized in the Forgetwin-AI API Gateway.*

In a Feature-Based architecture, all files related to a specific domain concept are stored within a dedicated folder (e.g., `src/modules/users/`).

```text
src/modules/users/
├── controllers/
│   └── users.controller.ts
├── services/
│   └── users.service.ts
├── repositories/
│   └── users.repository.ts
└── users.module.ts
```

### **Pros**
* **High Cohesion**: All code related to the same business capability resides together. Deleting or refactoring a feature only affects that single folder.
* **Highly Scalable**: The codebase remains highly organized even as it scales to 50+ domain models.
* **Team Isolation**: Multiple teams can independently build separate domains without file/merge conflicts.
* **Microservice Ready**: Makes it incredibly straightforward to break off a module into its own standalone microservice later.

### **Cons**
* Code navigation might feel fragmented if a developer explicitly wants to browse all repositories or controllers across the codebase.

---

## 2. Layer-Based Architecture (Folder-by-Layer)

In a Layer-Based architecture, files are organized by their technical layer at the root of the source directory (e.g., `src/controllers/`, `src/services/`).

```text
src/
├── controllers/
│   ├── users.controller.ts
│   └── cad-models.controller.ts
├── services/
│   ├── users.service.ts
│   └── cad-models.service.ts
└── repositories/
    ├── users.repository.ts
    └── cad-models.repository.ts
```

### **Pros**
* **Strict Domain Layering**: Enforces technical boundaries at first glance.
* **Excellent for Smaller Apps**: Clear and approachable for simple applications with only 3 to 5 domain models.

### **Cons**
* **Low Cohesion**: To implement or modify a feature, a developer must jump across 3 or 4 entirely separate global directories.
* **Not Modular**: Difficult to extract or delete specific domain features without sifting through global directories.
* **Merge Conflicts**: Multiple developers updating technical layers will frequently encounter file and git conflicts.

---

## 3. Which Architecture is Best?

For enterprise products and distributed monorepos, **Feature-Based Architecture** is the industry standard because it optimizes maintainability, team agility, and technical separation.
