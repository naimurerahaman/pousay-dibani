import { z } from "zod";

export const phoneRegex = /^01[0-9]{9}$/;

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer."),
  customerPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Phone must be 11 digits starting with 01."),
  deliveryAddress: z
    .string()
    .trim()
    .min(8, "Address must be at least 8 characters.")
    .max(240, "Address must be 240 characters or fewer."),
  deliveryArea: z
    .string()
    .trim()
    .min(1, "Please choose a delivery area."),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be 500 characters or fewer.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Add at least one product to your order."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderLookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(4, "Enter your order number.")
    .max(40, "Order number is too long."),
  customerPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Phone must be 11 digits starting with 01."),
});

export type OrderLookupInput = z.infer<typeof orderLookupSchema>;

export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const checkoutFormSchema = z.object({
  customerName: checkoutSchema.shape.customerName,
  customerPhone: checkoutSchema.shape.customerPhone,
  deliveryAddress: checkoutSchema.shape.deliveryAddress,
  deliveryArea: checkoutSchema.shape.deliveryArea,
  notes: checkoutSchema.shape.notes,
  items: z
    .array(orderItemInputSchema)
    .min(1, "Add at least one product to your order."),
});

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;

export function formatPhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}
