# 📱 BarberFlow App

App mobile do BarberFlow — React Native + Expo SDK 51

---

## 🚀 PASSO A PASSO PARA RODAR

### 1. Pré-requisitos
- Node.js 18+
- Expo CLI: `npm install -g expo-cli eas-cli`
- App **Expo Go** no seu celular (iOS ou Android)
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
  - iOS: https://apps.apple.com/app/expo-go/id982107779

---

### 2. Instalar dependências
```bash
cd BarberFlow-App
npm install
```

---

### 3. Configurar variáveis de ambiente
```bash
# Copie e edite o .env
cp .env .env.local
```

Para desenvolvimento local, edite o `.env` e coloque o IP da sua máquina:
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/api
```
> ⚠️ Em React Native não existe `localhost` — use o IP da sua máquina na rede local.
> Para descobrir o IP: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)

---

### 4. Adicionar as imagens
Coloque estas imagens na pasta `assets/images/`:
- `logo.png` — Logo do BarberFlow (mesmo do web `/public/Logo.png`)
- `icon.png` — Ícone do app (1024x1024px)
- `splash.png` — Tela de splash (1284x2778px)
- `adaptive-icon.png` — Ícone Android (1024x1024px)
- `favicon.png` — Favicon web

---

### 5. Rodar o projeto
```bash
npm start
# ou
npx expo start
```

Escaneie o QR Code com o Expo Go no celular.

---

### 6. Rodar em emulador
```bash
# Android (precisa do Android Studio)
npm run android

# iOS (precisa do Xcode — apenas Mac)
npm run ios
```

---

## 📁 Estrutura do Projeto

```
BarberFlow-App/
├── app/
│   ├── _layout.tsx          # Root layout + providers
│   ├── index.tsx            # Redirect logic (qual perfil?)
│   ├── (auth)/              # Login, Register, Forgot Password
│   ├── (barbeiro)/          # Dashboard do Barbeiro (FASE 2)
│   ├── (cliente)/           # Área do Cliente (FASE 4)
│   └── (admin)/             # Admin SaaS (FASE 6)
├── components/              # Componentes reutilizáveis (FASE 2+)
├── constants/
│   ├── colors.ts            # Design tokens
│   └── routes.ts            # Rotas centralizadas
├── lib/
│   ├── api.ts               # Axios para Barbeiro (SecureStore)
│   ├── client-api.ts        # Axios para Cliente (SecureStore)
│   └── plans.ts             # Planos do BarberFlow
├── stores/
│   └── authStore.ts         # Zustand — gerencia os 3 perfis
└── assets/
    └── images/              # Logo, ícones, splash
```

---

## 🔐 Como funciona a autenticação

| Perfil | Token salvo em | Chave |
|--------|---------------|-------|
| Barbeiro | SecureStore | `@barberFlow:token` |
| Cliente | SecureStore | `@barberFlow:client:token` |
| Super Admin | SecureStore | `@barberFlow:token` + `isSuperAdmin: true` |

---

## 📦 Dependências principais

| Lib | Função |
|-----|--------|
| `expo-router` | Navegação file-based (igual Next.js) |
| `expo-secure-store` | Armazenamento seguro (substitui localStorage) |
| `zustand` | Estado global (auth store) |
| `@tanstack/react-query` | Cache e sync de dados |
| `axios` | HTTP client (mesma lógica do web) |
| `victory-native` | Gráficos (substitui recharts) |
| `nativewind` | Tailwind CSS para RN |
| `react-native-reanimated` | Animações nativas |
| `@gorhom/bottom-sheet` | Bottom sheet (substitui ResponsiveModal) |

---

## 🗺️ Roadmap

- [x] **FASE 1** — Setup + Auth + Navegação base
- [ ] **FASE 2** — Dashboard Barbeiro + Agendamentos
- [ ] **FASE 3** — Financeiro (Transações, Comissões, Metas)
- [ ] **FASE 4** — Área do Cliente (Busca + Agendamento)
- [ ] **FASE 5** — Push Notifications
- [ ] **FASE 6** — Admin + Polimentos finais