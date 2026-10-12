# API documentation

## Overview

A production-grade real estate platform designed to demonstrate geospatial querying, complex state management, cross-platform parity, and 3rd-party API orchestration

# endpoints

```
POST /auth/register, /auth/login, /auth/refresh, /auth/otp
GET /properties?purpose=rent&beds=2&priceMax=...&polygon=...
GET /properties/:id
POST /properties (agent/landlord)
PATCH /properties/:id
POST /properties/:id/media
GET /properties/:id/price-history
GET /properties/:id/similar
POST /properties/:id/inquire
GET /search/suggest?q=...
POST /search/polygon (draw-area)
POST /search/commute (isochrone)
GET /saved-searches, POST, DELETE
GET /favorites, POST, DELETE
GET /conversations, /messages
WS /realtime (chat, notifications)
GET /areas/:id/insights
GET /buildings/:id/reviews
POST /reviews

```

# Data Model (Mongoose schemas)

```
User          { _id, email, phone, role, verified, locale, currency,
                passwordHash, refreshTokens[], createdAt }

Profile       { userId, name, avatar, agencyId?, bio }

Agency        { _id, name, logo, licenseNo, verified }

Property      { _id, title, description, type, purpose: 'rent'|'buy',
                price, currency, size, beds, baths, floor, furnished,
                amenities: [String],
                location: { type: 'Point', coordinates: [lng, lat] }, // 2dsphere
                address, buildingId?, ownerId, agentId,
                status, verifiedAt, availableFrom, createdAt }

PropertyMedia { _id, propertyId, type: 'image'|'video'|'floorplan'|'tour',
                url, publicId, blurhash, order }

PriceHistory  { _id, propertyId, oldPrice, newPrice, changedAt }

SavedSearch   { _id, userId, filters: Object, alertFrequency, lastRunAt }

Favorite      { userId, propertyId, createdAt }

Inquiry       { _id, propertyId, userId, agentId, message, status, createdAt }

Conversation  { _id, participants: [userId], propertyId?, lastMessageAt }

Message       { _id, conversationId, senderId, body, attachments, readAt }

Review        { _id, targetType: 'building'|'area'|'agent',
                targetId, rating, body, userId, createdAt }

Building      { _id, name, developer, yearBuilt, amenities,
                location: GeoJSON Point }

Area          { _id, name, city, boundary: GeoJSON Polygon }

Notification  { _id, userId, type, payload, readAt }
```

# high level architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Clients                                                    │
│  ├── React (Web)  — Vite + React Router + Leaflet/Mapbox    │
│  └── React Native — Expo + react-native-maps                │
│      Shared: TypeScript types, zod schemas, API client      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST (or tRPC)
┌──────────────────────▼──────────────────────────────────────┐
│  API — Node.js + Express + TypeScript                       │
│  - Auth (JWT + refresh), bcrypt                             │
│  - Rate limiting (express-rate-limit), zod validation       │
│  - REST endpoints                                           │
│  - Socket.IO for chat + notifications                       │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼──────┐
│ MongoDB    │ │  Upstash   │ │ Cloudinary │ │ Atlas       │
│ Atlas M0   │ │  Redis     │ │  (images)  │ │ Search      │
│ + 2dsphere │ │  cache +   │ │            │ │             │
│            │ │  queues    │ │            │ │             │
└────────────┘ └────────────┘ └────────────┘ └─────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Background Jobs — node-cron / BullMQ                       │
│  - Image processing (Cloudinary transforms)                 │
│  - Availability re-check pings (every 7 days)               │
│  - Price-drop alert fanout                                  │
│  - Saved-search match notifier                              │
│  - Commute-time / isochrone cache warmer                    │
└─────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Realtime: Socket.IO (chat + notifications)                 │
│  Push: Expo Push Notifications (FCM/APNs)                   │
│  Email: Resend / Brevo                                      │
└─────────────────────────────────────────────────────────────┘
```
