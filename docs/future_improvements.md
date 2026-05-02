# Future Improvements

## 1. React Server Components (RSC) & NestJS API Gateway

To further improve web app performance and simplify the rendering loop:

### **Next.js Server-to-Server Requests**
* Leverage React Server Components for initial page loading and data fetching.
* Pages (e.g., loading lists of models) fetch directly from the NestJS API Gateway via server-to-server requests without passing data through client-side React hooks.
* Reduces browser payload size, client-side JavaScript execution, and enhances security by abstracting private headers.
* Keep interactive modules like the drag-and-drop CAD uploader and the 3D Three.js viewer as client-side rendering components using `'use client'`.
