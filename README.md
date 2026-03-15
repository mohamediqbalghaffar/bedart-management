# BedArt Group - Business Management System

A professional CRM and Inventory Management System specifically designed for mattress and bedding stores.

## Key Features

- **Advanced Dashboard**: Real-time tracking of sales, expenses, and net profit with interactive Area and Bar charts.
- **Sales & Receipts**: Professional sales form management with standard A4 portrait printable receipts and JPEG export functionality.
- **Inventory (Stock) Control**: Manage stock across multiple locations (Warehouse and Shop Showroom) with built-in transfer logic.
- **Purchase Management**: Track buying forms and stock arrivals with AI-powered Excel/CSV import tools.
- **Financial Tracking**: Comprehensive expense logging with support for multiple currencies (USD/IQD).
- **AI-Powered Insights**: Smart sales suggestions and automated product categorization using Google Genkit.
- **Role-Based Access (RBAC)**: Secure access control for Admin, Data Manager, Salesman, and Program Previewer roles.
- **Confidential Mode**: One-click blur for sensitive financial data, ideal for program demonstrations.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Custom Authentication)
- **AI Engine**: [Google Genkit](https://github.com/firebase/genkit)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Setup Firebase**: Configure your Firebase project in `src/firebase/config.ts`
4. **Run development server**: `npm run dev`

## Deployment

This project is configured for deployment on **Firebase App Hosting**.
