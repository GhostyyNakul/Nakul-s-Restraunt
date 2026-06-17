# Nakul's Restaurant

A premium, full-stack gourmet dining and digital ordering application designed for **Nakul's Restaurant**, specializing in gourmet burgers, artisanal pizzas, refreshing mojitos, and value combos in Yamuna Vihar, Delhi.

Built using React, Vite, TypeScript, and Tailwind CSS on the frontend, with an Express custom server powered by Node.js, this platform provides a seamless digital storefront coupled with robust order and account management controls.

---

## 🌟 Features

- **Gourmet Digital Storefront**: Rich, responsive, and dynamic food catalog containing categories (Burgers, Pizzas, Mojitos, Combos) with dietary tags, spice customizers, and real-time pricing.
- **Dynamic Shopping Cart**: Interactive slide-out cart drawer with item accumulation, real-time quantity controls, promo code engine, and delivery fee calculation.
- **Hardened User Authentication**: Pure cryptographic, salted **SHA-256 password hashing** on the client-side to ensure secure logins, registration, and credentials protection before they ever leave or hit local caches.
- **Admin Command Center**: Built-in Admin Panel allowing restaurant executives to manage orders in real-time, update catalog items, monitor server performance metrics, and review user analytics.
- **User Profile Management**: Customizable profiles allowing updates to names, emails, addresses, payment cards, and password reset flows safeguarded with preceding password verifications.
- **Modern Responsive Design**: Fully optimized for ultra-smooth layout animations via `motion` and interactive styles utilizing Tailwind utility colors (delivering an elegant dark/light theme experience).

---

## 🛠️ Technology Stack

- **Frontend**: [React 18](https://reactjs.org/) + [Vite](https://vite.dev/) (Client-side Bundler)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [lucide-react](https://lucide.dev/) (Aesthetic vector iconography)
- **Animations**: [motion/react](https://motion.dev/) (Smooth interactions & state-transitions)
- **Backend Server**: [Express](https://expressjs.com/) (Node.js API proxy and server-rendering integration)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
- **Configuration & Integration**: Firebase Auth references, custom authentication helpers, and automated environment declarations.

---

## 📂 Project Structure

```text
├── src/
│   ├── components/       # Interface modules (Login, Drawer, Admin Panel, Profile)
│   ├── utils/            # SHA-256 crypto helpers, OAuth, Google Mail APIs
│   ├── types.ts          # Core shared strict-type definitions
│   ├── App.tsx           # Main application engine and layout routing
│   ├── index.css         # Global Tailwind directives & typography variables
│   └── main.tsx          # Component tree mounting entry point
├── server.ts             # Custom Express integration server
├── metadata.json         # Platform capabilities and permissions layout
├── .gitignore            # Secret & artifact suppression lists
└── package.json          # Dependency manifest
```

---

## 🚀 Local Setup & Installation

To run the application locally on your computer:

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory (based on `.env.example` properties) to configure standard variables:
```env
# Example configuration variables (Do NOT commit real keys to GitHub!)
PORT=3000
```

### 4. Running the Development Server
To launch the combined Dev server (Express custom server proxies assets synchronously):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to preview it.

### 5. Production Build
To construct the compiled client bundle and production server output:
```bash
npm run build
npm start
```
