# Galaxy AI - Visual AI Workflow Builder

A modern visual workflow builder for creating AI pipelines using a node-based editor.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: PostgreSQL with Prisma ORM
- **Flow Editor**: React Flow (@xyflow/react)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account (for authentication)

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/galaxy_ai?schema=public"
```

3. **Set up the database**

```bash
npm run db:generate
npm run db:push
```

4. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/          # Protected dashboard routes
│   │   ├── workflow/       # Workflow editor
│   │   ├── templates/      # Workflow templates
│   │   └── settings/       # User settings
│   ├── sign-in/            # Clerk sign-in page
│   ├── sign-up/            # Clerk sign-up page
│   └── page.tsx            # Landing page
├── components/
│   └── flow/               # React Flow components
│       ├── FlowCanvas.tsx  # Main canvas component
│       ├── NodeSidebar.tsx # Node palette sidebar
│       └── WorkflowEditor.tsx # Full editor layout
├── lib/
│   └── db.ts               # Prisma client instance
└── middleware.ts           # Clerk auth middleware

prisma/
└── schema.prisma           # Database schema
```

## Features (Phase 1 - Base Setup)

- [x] Next.js 15 App Router setup
- [x] Tailwind CSS styling
- [x] Clerk authentication
- [x] Prisma + PostgreSQL schema
- [x] React Flow basic canvas
- [x] Dashboard layout
- [x] Workflow editor skeleton

## Coming Soon

- Node drag-and-drop functionality
- Workflow save/load from database
- AI model integrations (OpenAI, Anthropic)
- Workflow execution engine
- Templates system

## License

MIT
