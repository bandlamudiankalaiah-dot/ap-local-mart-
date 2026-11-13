# AP Local Mart - Firestore Security Specification

## 1. Data Invariants
1. **Default Deny**: Any unmatched path is strictly denied (`allow read, write: if false`).
2. **PII Isolation**: User profiles (`/users/{userId}`), addresses (`/addresses/{addressId}`), orders (`/orders/{orderId}`), and payments (`/payments/{paymentId}`) are strictly restricted to their owner (`request.auth.uid == userId`) or verified Admin (`bandlamudiankalaiah@gmail.com`).
3. **Catalog Integrity**: Public catalog collections (`/products/{productId}`, `/categories/{categoryId}`, `/sellers/{sellerId}`) can be read by customers, but writes require verified authentication, valid ID format (`^[a-zA-Z0-9_\-]+$`), strict field whitelisting (`hasOnly`), and string length bounds.
4. **Temporal & Immutable Fields**: `createdAt` and `userId` cannot be mutated during updates.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated PII Read**: Unauthenticated `get` on `/users/user-1`. -> `PERMISSION_DENIED`
2. **Cross-User PII Read**: User `uid-A` attempts `get` on `/users/uid-B`. -> `PERMISSION_DENIED`
3. **Privilege Escalation**: User `uid-A` creates `/users/uid-A` with `role: "admin"`. -> `PERMISSION_DENIED`
4. **Shadow Field Injection**: User `uid-A` updates `/users/uid-A` with `{ isSuperAdmin: true }`. -> `PERMISSION_DENIED`
5. **Unverified Email Admin Spoof**: Token with `email == "bandlamudiankalaiah@gmail.com"` but `email_verified == false`. -> `PERMISSION_DENIED`
6. **ID Poisoning**: Document ID exceeding 128 chars or containing invalid symbols. -> `PERMISSION_DENIED`
7. **Oversized String DoS**: Creating product with 10,000-char `title`. -> `PERMISSION_DENIED`
8. **Negative Price Injection**: Creating product with `sellingPrice: -500`. -> `PERMISSION_DENIED`
9. **Cross-User Order Creation**: User `uid-A` creates `/orders/ord-1` with `userId: "uid-B"`. -> `PERMISSION_DENIED`
10. **Immutable Field Tampering**: Updating `createdAt` or `userId` on an existing `/orders/ord-1`. -> `PERMISSION_DENIED`
11. **Terminal Order Mutation**: Non-admin user attempts to modify an order already in `DELIVERED` or `CANCELLED` status. -> `PERMISSION_DENIED`
12. **Blanket List Scraping**: Listing `/orders` or `/addresses` without filtering `resource.data.userId == request.auth.uid`. -> `PERMISSION_DENIED`
