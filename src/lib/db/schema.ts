import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const creado = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  usernameLower: text("username_lower").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  nickname: text("nickname"),
  avatar: text("avatar").notNull().default("pelirroja"),
  birthday: date("birthday"),
  bio: text("bio"),
  allergies: text("allergies"),
  giftSizes: text("gift_sizes"),
  giftColors: text("gift_colors"),
  craving: text("craving"),
  cravingDate: date("craving_date"),
  suppositions: text("suppositions", { enum: ["all", "selected", "off"] }).notNull().default("all"),
  suppositionsAllowed: uuid("suppositions_allowed").array().notNull().default(sql`'{}'::uuid[]`),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  bannedAt: timestamp("banned_at", { withTimezone: true }),
  createdAt: creado(),
});

export const sessions = pgTable(
  "sessions",
  {
    // Hash SHA-256 del token; el token en claro solo vive en la cookie
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: creado(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const recoveryCodes = pgTable(
  "recovery_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (t) => [index("recovery_user_idx").on(t.userId)],
);

export const friendships = pgTable(
  "friendships",
  {
    // user_a siempre es el id menor, así cada pareja tiene una sola fila
    userA: uuid("user_a").notNull().references(() => users.id, { onDelete: "cascade" }),
    userB: uuid("user_b").notNull().references(() => users.id, { onDelete: "cascade" }),
    requestedBy: uuid("requested_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted"] }).notNull().default("pending"),
    createdAt: creado(),
  },
  (t) => [primaryKey({ columns: [t.userA, t.userB] }), index("friendships_b_idx").on(t.userB)],
);

export const blocks = pgTable(
  "blocks",
  {
    blockerId: uuid("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: creado(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })],
);

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Código de invitación de un solo uso: se borra al usarse
  inviteCodeHash: text("invite_code_hash"),
  createdAt: creado(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] }), index("group_members_user_idx").on(t.userId)],
);

export const sectionVisibility = pgTable(
  "section_visibility",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    section: text("section", { enum: ["profile", "mood", "food", "likes", "gifts"] }).notNull(),
    level: text("level", { enum: ["private", "selected", "friends", "groups", "public"] }).notNull(),
    allowedUserIds: uuid("allowed_user_ids").array().notNull().default(sql`'{}'::uuid[]`),
  },
  (t) => [primaryKey({ columns: [t.userId, t.section] })],
);

export const moods = pgTable(
  "moods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    mood: integer("mood").notNull(),
    energy: integer("energy").notNull(),
    needs: text("needs").array().notNull().default(sql`'{}'::text[]`),
    note: text("note"),
    notePrivate: boolean("note_private").notNull().default(true),
    createdAt: creado(),
  },
  (t) => [uniqueIndex("moods_user_date_idx").on(t.userId, t.date)],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    category: text("category", {
      enum: ["food", "music", "series", "movie", "game", "book", "anime", "place", "hobby", "other"],
    }).notNull(),
    name: text("name").notNull(),
    detail: text("detail"),
    link: text("link"),
    intensity: text("intensity", { enum: ["love", "like", "paused", "no_longer"] }).notNull().default("like"),
    mode: text("mode", { enum: ["always", "season", "recurring", "disliked"] }).notNull().default("always"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    expectedEnd: date("expected_end"),
    recurringMonths: integer("recurring_months").array().notNull().default(sql`'{}'::integer[]`),
    status: text("status", { enum: ["confirmed", "pending", "partial", "rejected"] }).notNull().default("confirmed"),
    proposedBy: uuid("proposed_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: creado(),
  },
  (t) => [
    index("items_owner_idx").on(t.ownerId, t.category),
    index("items_proposed_idx").on(t.proposedBy, t.ownerId, t.status),
  ],
);

export const itemResponses = pgTable("item_responses", {
  itemId: uuid("item_id").primaryKey().references(() => items.id, { onDelete: "cascade" }),
  response: text("response", { enum: ["confirmed", "partial", "rejected"] }).notNull(),
  comment: text("comment"),
  respondedAt: timestamp("responded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["friend_request", "friend_accepted", "supposition", "supposition_answered", "group_joined"],
    }).notNull(),
    payload: jsonb("payload").$type<Record<string, string | number | null>>().notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: creado(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt)],
);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  targetType: text("target_type", { enum: ["user", "item"] }).notNull(),
  targetId: uuid("target_id").notNull(),
  reason: text("reason").notNull(),
  detail: text("detail"),
  status: text("status", { enum: ["open", "resolved", "dismissed"] }).notNull().default("open"),
  createdAt: creado(),
});

// Fase 7: lista de deseos con modo sorpresa.
// added_by null = lo añadió el dueño; si no, es una idea secreta de un amigo.
// claimed_by y las ideas secretas nunca se muestran al dueño.
export const wishes = pgTable(
  "wishes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    link: text("link"),
    note: text("note"),
    addedBy: uuid("added_by").references(() => users.id, { onDelete: "cascade" }),
    claimedBy: uuid("claimed_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: creado(),
  },
  (t) => [index("wishes_owner_idx").on(t.ownerId)],
);

export type User = typeof users.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Mood = typeof moods.$inferSelect;
export type Wish = typeof wishes.$inferSelect;
