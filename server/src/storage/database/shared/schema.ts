import { sql } from "drizzle-orm"
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  text,
  index,
} from "drizzle-orm/pg-core"

// ========== 系统表（禁止修改） ==========
export const healthCheck = pgTable("health_check", {
  id: integer("id").primaryKey(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
})

// ========== 用户表 ==========
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    wechatId: varchar("wechat_id", { length: 128 }).unique(),
    nickname: varchar("nickname", { length: 128 }),
    avatarUrl: varchar("avatar_url", { length: 512 }),
    role: varchar("role", { length: 32 }).default('guest').notNull(), // head_chef, sous_chef, order_clerk, guest
    verified: boolean("verified").default(false).notNull(),
    verificationCode: varchar("verification_code", { length: 32 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    index("users_wechat_id_idx").on(table.wechatId),
    index("users_role_idx").on(table.role),
  ]
)

// ========== 验证码表 ==========
export const verificationCodes = pgTable(
  "verification_codes",
  {
    code: varchar("code", { length: 32 }).primaryKey(),
    description: varchar("description", { length: 256 }),
    usedBy: varchar("used_by", { length: 36 }),
    usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    createdBy: varchar("created_by", { length: 36 }),
  },
  (table) => [
    index("verification_codes_used_by_idx").on(table.usedBy),
  ]
)

// ========== 菜品表 ==========
export const dishes = pgTable(
  "dishes",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: varchar("name", { length: 128 }).notNull(),
    images: jsonb("images").notNull().default([]), // string[]
    category: varchar("category", { length: 64 }).notNull(), // chinese, western, etc.
    cuisine: varchar("cuisine", { length: 64 }), // tianba, jiangzhe, etc.
    calories: integer("calories").default(0).notNull(),
    protein: integer("protein").default(0),
    carbs: integer("carbs").default(0),
    fat: integer("fat").default(0),
    ingredients: jsonb("ingredients").notNull().default([]), // string[]
    seasoning: jsonb("seasoning").notNull().default([]), // string[]
    steps: jsonb("steps").notNull().default([]), // string[]
    tips: text("tips"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    index("dishes_name_idx").on(table.name),
    index("dishes_category_idx").on(table.category),
  ]
)

// ========== 订单表 ==========
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }),
    status: varchar("status", { length: 32 }).default('pending').notNull(), // pending, confirmed
    totalCalories: integer("total_calories").default(0).notNull(),
    mergedIngredients: jsonb("merged_ingredients").default([]), // string[]
    mergedSeasoning: jsonb("merged_seasoning").default([]), // string[]
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
  ]
)

// ========== 订单项表 ==========
export const orderItems = pgTable(
  "order_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    orderId: varchar("order_id", { length: 36 }).notNull(),
    dishId: varchar("dish_id", { length: 64 }).notNull(),
    dishName: varchar("dish_name", { length: 128 }).notNull(),
    dishImage: varchar("dish_image", { length: 512 }),
    quantity: integer("quantity").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_dish_id_idx").on(table.dishId),
  ]
)

// ========== 美味记录表 ==========
export const deliciousRecords = pgTable(
  "delicious_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    date: timestamp("date", { withTimezone: true, mode: 'string' }).notNull(),
    totalCalories: integer("total_calories").default(0).notNull(),
    dishIds: jsonb("dish_ids").notNull().default([]), // string[]
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("delicious_records_date_idx").on(table.date),
  ]
)

// ========== TypeScript 类型导出 ==========
export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert

export type VerificationCode = typeof verificationCodes.$inferSelect
export type InsertVerificationCode = typeof verificationCodes.$inferInsert

export type Dish = typeof dishes.$inferSelect
export type InsertDish = typeof dishes.$inferInsert

export type Order = typeof orders.$inferSelect
export type InsertOrder = typeof orders.$inferInsert

export type OrderItem = typeof orderItems.$inferSelect
export type InsertOrderItem = typeof orderItems.$inferInsert

export type DeliciousRecord = typeof deliciousRecords.$inferSelect
export type InsertDeliciousRecord = typeof deliciousRecords.$inferInsert
