# Agent from Loom

A web application that enables users to automate web-based tasks by analyzing Loom videos.

## Project Overview

This project allows users to record repetitive online actions via Loom, then have AI understand and replicate those actions through browser automation, direct API integrations, or workflow platforms like Make.com and Zapier. The system creates reusable "agents" that streamline workflows and minimize manual effort.

## Current Features

- **Loom URL Input**: Submit and process Loom video URLs
- **User Authentication**: Login/signup with email/password or Google OAuth
- **Video Chunking**: Automatically divide Loom videos into logical segments
- **Chunk Management**: View and interact with video chunks
- **Visual Previews**: See visual representation of each chunk in the video
- **Basic Action Detection**: Automatically detect potential actions for each chunk
- **Agent Dashboard**: Create, view, edit, and delete automation agents
- **Integration Suggestions**: Identify potential workflow platform integrations
- **GitHub Export**: Export agents to GitHub repositories

## Development Status

The application implements:

- **Basic Loom URL Input and Display**: Process and display Loom videos
- **User Login/Signup with Supabase**: Authentication system with Google OAuth integration
- **Video Chunking and Display**: Break videos into manageable chunks with visual representation
- **Agent Creation and Management**: Save, retrieve, edit, and delete agents
- **Integration Suggestions**: Detect applications and suggest Make.com/Zapier integrations

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd agentfromloom
```

2. Install all dependencies:
```
npm run install-all
```

3. Configure Supabase:
   - Create a Supabase project
   - Update the Supabase credentials in `client/src/supabaseClient.ts`
   - Run the SQL in `fix_rls_policies.sql` to set up proper row-level security

4. Start the application:
```
npm start
```

5. Open your browser and navigate to http://localhost:3000

### Development

- Start server only: `npm run server`
- Start client only: `cd client && npm start`
- Run tests: `npm test`
- Build for production: `npm run build`

## Technologies Used

- **Frontend**: React, TypeScript
- **Backend**: Node.js, Express
- **Authentication**: Supabase
- **Browser Automation**: Playwright
- **Database**: Supabase (PostgreSQL)
- **Integration**: GitHub API, Make.com, Zapier

## Next Steps

- Enhance error handling and recovery mechanisms
- Implement full browser automation with Playwright
- Expand integration options with additional workflow platforms
- Develop advanced agent editing capabilities

## License

MIT