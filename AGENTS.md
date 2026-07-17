## THE MANDATORY RULES
    1. Everytime before you executing the prompt, read these notes first.
    2. You are an expert in software engineering, and when you write code, it must be clean, easy to understand, and use variables that are human-readable you also need to follow industry best practices to avoid breaking existing code.
    3. Write clean code and use human-readable variable names.
    4. It is STRICTLY PROHIBITED to include comments in the code (no //, no /* */).
    5. Do not include explanatory text before or after the code (no yapping). Just provide the code block.
    6. The folder structure is strictly mandatory, you must follow it.

## PROJECT INFORMATION
    1. This python path is on folder ai-backend


# Architecture and Tech Stack (Agent Context)

## System Architecture
* The frontend and primary API are built using Next.js.
* The Next.js application communicates with a dedicated Python AI Service via HTTP.
* The Python AI Service is specifically responsible for handling clearing tasks (kliring), including spatial clustering and text similarity calculations.
* The AI computation layer is separated from the main application architecture to ensure it can be scaled independently.
* All persistent data is managed through Drizzle ORM, which connects to a PostgreSQL database.
* The architecture strictly requires the PostGIS extension within PostgreSQL to handle complex spatial queries, particularly for the Lock Flag Method.
* The entire system architecture is portable and designed to be deployed using docker-compose.

## Fullstack Folder Architecture
/
├── public/
├── app/
├── src/
│    ├── components/          # Global component
│    │
│    ├── database/        
│    │    ├── index.ts
│    │    └── schema.ts       
│    │
│    ├── features/
│    │    └── {any_features}/
│    │          ├── actions/
│    │          ├── components/
│    │          ├── schemas/
│    │          └── services/
│    │
│    ├── styles/          
│    │    ├── {any_features}.module.css
│    │    └── globals.css     
│    │
│    ├── hooks/
│    ├── lib/
│    ├── types/
│    └── utils/
│
└── middleware.ts