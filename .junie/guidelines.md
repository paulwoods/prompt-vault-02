### Project Overview

`prompt-vault` is a full-stack application consisting of a Spring Boot backend and a React frontend.

### Build and Configuration

#### Backend

- **Technology Stack**: Java 25, Maven, Spring Boot 4.x.
- **Build**: Use Maven to build the project.
  ```bash
  cd backend
  ./mvnw clean install
  ```
- **Run**:
  ```bash
  cd backend
  ./mvnw spring-boot:run
  ```
- **Database**: The project is configured with H2 (in-memory) for development. H2 Console is available at `/h2-console`.

#### Frontend

- **Technology Stack**: React 19, Vite, TypeScript.
- **Build**:
  ```bash
  cd frontend
  npm install
  npm run build
  ```
- **Development Mode**:
  ```bash
  cd frontend
  npm run dev
  ```

### Testing Information

#### Backend Tests

- **Framework**: JUnit 5, AssertJ, Spring Boot Test.
- **Running Tests**:
  ```bash
  cd backend
  ./mvnw test
  ```
- **Adding New Tests**:
  Place new tests in `backend/src/test/java/com/mrpaulwoods/promptvault/backend/`.
  Example of a simple test:
  ```java
  package com.mrpaulwoods.promptvault.backend;

  import org.junit.jupiter.api.Test;
  import static org.junit.jupiter.api.Assertions.assertTrue;

  class SimpleTest {
      @Test
      void testSomething() {
          assertTrue(true);
      }
  }
  ```

#### Frontend Tests

- Currently, no automated testing framework (like Vitest or Jest) is configured for the frontend.

### Additional Development Information

#### Code Style

- **Backend**: Follow standard Spring Boot and Java coding conventions. Lombok is used to reduce boilerplate.
- **Frontend**: Functional components with Hooks are preferred. TypeScript is used for type safety.
- **Indentation**: 4 spaces for Java, 2 spaces for TypeScript/React (as per Vite default).

#### Architecture

- **Backend**: Standard layered architecture (Controllers -> Services -> Repositories).
- **Frontend**: Component-based architecture using Vite.

#### Tools

- **Project Structure**: Mono-repo with `backend` and `frontend` directories.
- **Junie**: Configuration and guidelines are stored in the `.junie/` directory.
