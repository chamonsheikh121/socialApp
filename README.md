

# 🚀 NestJS PrismaORM Template (v7.0.1)

A fully configured **NestJS + Prisma ORM** starter template, designed for fast backend development.  
This repository is a **GitHub Template**, allowing you to quickly bootstrap a new project with a clean structure.

---

## 📦 Features

- ✅ NestJS (v7+) clean modular architecture  
- ✅ Prisma ORM integration  
- ✅ Auto-generated Prisma Client  
- ✅ Ready-to-use environment setup  
- ✅ Development / Production scripts  
- ✅ Perfect as a starter boilerplate or template repo  

---

## 📁 Project Setup

### **1. Install dependencies**
```bash
pnpm install
````

### **2. Setup environment variables**

Rename `.env.example` → `.env`

```bash
cp .env.example .env
```

Edit your database connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### **3. Generate Prisma Client**

```bash
npx prisma generate
```

### **4. Run the project**

```bash
npm run start
```

---

# 🏃‍♂️ Running Modes

### **Development**

```bash
pnpm run start
```

### **Watch Mode (Auto Reload)**

```bash
pnpm run start:dev
```

### **Production**

```bash
pnpm run start:prod
```

---

## 🗂 Folder Structure Overview

```
project-root/
 ┣ prisma/
 ┃ ┗ schema.prisma
 ┣ src/
 ┃ ┣ modules/
 ┃ ┣ common/
 ┃ ┣ app.module.ts
 ┃ ┗ main.ts
 ┣ .env.example
 ┣ package.json
 ┣ tsconfig.json
 ┗ README.md
```

---

## 🛠 Prisma Useful Commands

Generate Prisma Client:

```bash
npx prisma generate
```

Run Prisma Studio:

```bash
npx prisma studio
```

Run database migrations:

```bash
npx prisma migrate dev
```

---

## 📌 Notes

This repository is configured as a **GitHub Template**.
Click the **“Use this template”** button to create a new project instantly.

---

## 📄 License

This project is open-source and free to use.# socialApp
