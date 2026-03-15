# BedArt Group - Business Management System

A professional CRM and Inventory Management System specifically designed for mattress and bedding stores.

## Key Features

- **Advanced Dashboard**: Real-time tracking of sales, expenses, and net profit with interactive Area and Bar charts.
- **Sales & Receipts**: Professional sales form management with standard A4 portrait printable receipts and JPEG export functionality.
- **Inventory (Stock) Control**: Manage stock across multiple locations (Warehouse and Shop Showroom) with built-in transfer logic.
- **Purchase Management**: Track buying forms and stock arrivals with AI-powered tools.
- **Financial Tracking**: Comprehensive expense logging with support for multiple currencies (USD/IQD).
- **AI-Powered Insights**: Smart sales suggestions and automated product categorization using Google Genkit.
- **Role-Based Access (RBAC)**: Secure access control for Admin, Data Manager, Salesman, and Program Previewer roles.
- **Confidential Mode**: One-click blur for sensitive financial data, ideal for program demonstrations.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Firebase (Firestore & Custom Authentication)
- **AI Engine**: Google Genkit
- **Styling**: Tailwind CSS & ShadCN UI
- **Charts**: Recharts

---

## How to push this project to GitHub

Follow these steps to upload this project to your own GitHub account:

1. **Create a Repository on GitHub**
   - Go to [github.com/new](https://github.com/new).
   - Name your repository (e.g., `bedart-management`).
   - Keep it "Public" or "Private" as you prefer.
   - **Do not** check "Initialize this repository with a README".
   - Click "Create repository".

2. **Initialize Git in this Project**
   Open your terminal in this workspace and run:
   ```bash
   git init
   ```

3. **Add and Commit Files**
   ```bash
   git add .
   git commit -m "Initial commit of BedArt Management System"
   ```

4. **Connect to your GitHub Repo**
   - Copy the URL of your new GitHub repository (it looks like `https://github.com/username/repo.git`).
   - Run:
   ```bash
   git branch -M main
   git remote add origin YOUR_REPO_URL_HERE
   ```

5. **Push to GitHub**
   ```bash
   git push -u origin main
   ```

## Development

1. **Install dependencies**: `npm install`
2. **Setup Firebase**: Configure your project in `src/firebase/config.ts`
3. **Run development server**: `npm run dev`
