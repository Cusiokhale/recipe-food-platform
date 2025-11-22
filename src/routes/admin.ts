import { Router } from "express";
import {
  setUserClaims,
  getUserById,
  listUsers,
} from "../controllers/admin";
import authenticate from "../middleware/authenticate";

const router = Router();

/**
 * @swagger
 * /admin/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves detailed information about a specific user by their unique ID. Returns user profile including email, role, custom claims, and metadata.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *         example: user123abc
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               user:
 *                 uid: user123abc
 *                 email: user@example.com
 *                 role: user
 *                 customClaims:
 *                   role: user
 *                 metadata:
 *                   creationTime: "2024-01-10T08:00:00Z"
 *                   lastSignInTime: "2024-01-15T10:30:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/get-user/:userId",
  authenticate,
  getUserById
);

/**
 * @swagger
 * /admin/users/{userId}/claims:
 *   post:
 *     summary: Set custom claims for a user
 *     description: Assigns or updates custom claims (roles and permissions) for a specific user. Used to manage user authorization levels (user, officer, manager).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *         example: user123abc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetUserClaimsRequest'
 *           examples:
 *             setOfficer:
 *               summary: Set user as officer
 *               value:
 *                 role: officer
 *             setManager:
 *               summary: Set user as manager
 *               value:
 *                 role: manager
 *             setUserWithCustomClaims:
 *               summary: Set user with custom claims
 *               value:
 *                 role: user
 *                 customClaims:
 *                   department: finance
 *                   region: north
 *     responses:
 *       200:
 *         description: User claims updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User claims set successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                       example: user123abc
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     customClaims:
 *                       type: object
 *                       example:
 *                         role: officer
 *             example:
 *               message: User claims set successfully
 *               user:
 *                 uid: user123abc
 *                 email: user@example.com
 *                 customClaims:
 *                   role: officer
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/users/:userId/claims",
  authenticate,
  setUserClaims
);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users
 *     description: Retrieves a paginated list of all users in the system. Supports pagination with limit and pageToken parameters.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of users to return per page
 *         example: 50
 *       - in: query
 *         name: pageToken
 *         schema:
 *           type: string
 *         description: Token for retrieving the next page of results (returned from previous request)
 *         example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 count:
 *                   type: integer
 *                   description: Number of users in the current page
 *                   example: 50
 *                 pageToken:
 *                   type: string
 *                   description: Token to retrieve the next page of results (if more results exist)
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *             examples:
 *               firstPage:
 *                 summary: First page of users
 *                 value:
 *                   users:
 *                     - uid: user123abc
 *                       email: user1@example.com
 *                       role: user
 *                       customClaims:
 *                         role: user
 *                       metadata:
 *                         creationTime: "2024-01-10T08:00:00Z"
 *                         lastSignInTime: "2024-01-15T10:30:00Z"
 *                     - uid: user456def
 *                       email: officer@example.com
 *                       role: officer
 *                       customClaims:
 *                         role: officer
 *                       metadata:
 *                         creationTime: "2024-01-08T09:00:00Z"
 *                         lastSignInTime: "2024-01-15T14:20:00Z"
 *                     - uid: user789ghi
 *                       email: manager@example.com
 *                       role: manager
 *                       customClaims:
 *                         role: manager
 *                       metadata:
 *                         creationTime: "2024-01-05T07:00:00Z"
 *                         lastSignInTime: "2024-01-15T11:45:00Z"
 *                   count: 3
 *                   pageToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/users",
  authenticate,
  listUsers
);

export default router;
