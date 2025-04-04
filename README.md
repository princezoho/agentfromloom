# Agent from Loom

A web application that enables users to automate web-based tasks by analyzing Loom videos.

## Project Overview

This project allows users to record repetitive online actions via Loom, then have AI understand and replicate those actions through browser automation, direct API integrations, or workflow platforms like Make.com and Zapier. The system creates reusable "agents" that streamline workflows and minimize manual effort.

## Current Features

- **Loom URL Input**: Submit and process Loom video URLs
- **User Authentication**: Login/signup with email/password or Google OAuth
- **Basic Video Display**: View embedded Loom videos
- **OAuth Integration**: Secure authentication using Google accounts

## Development Status

The application currently implements Milestones 1-2 from the Development Roadmap with a focus on:

- **Basic Loom URL Input and Display** (Milestone 1): Process and display Loom videos
- **User Login/Signup with Supabase** (Milestone 2): Complete authentication system with Google OAuth integration

We're now ready to begin work on Milestone 3: Basic Video Chunking and Display.

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd agentfromloom
```

2. Install dependencies:
```
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Configure Supabase:
   - Create a Supabase project
   - Update the Supabase credentials in `client/src/supabaseClient.ts`

4. Start the application:
```
# Start server (from server directory)
node server.js

# Start client (from client directory)
npm start
```

5. Open your browser and navigate to http://localhost:3000

## Technologies Used

- **Frontend**: React, TypeScript
- **Backend**: Node.js, Express
- **Authentication**: Supabase
- **Browser Automation**: Playwright
- **Database**: Supabase (PostgreSQL)

## Next Steps

- Complete Milestone 5: Mechanism for Manual User Takeover and Recording
- Implement Milestone 6: Saving and Loading Agents to Supabase
- Develop Milestone 7: Basic Agent Dashboard

## License

MIT