const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("@middleware/auth");
const { organizationContext } = require("@middleware/organization");
const { validateSchema } = require("@middleware/validation");
const { apiLimiter } = require("@middleware/rateLimiter");
const Joi = require("joi");
const {
  createOrganization,
  getOrganizations,
  addMember,
  getMembers,
  removeMember,
} = require("@controllers/organizationController");

const createOrgSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
});

const addMemberSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  role: Joi.string().valid("admin", "auditor").required(),
});

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get user's organizations
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizations:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Organization'
 *                           - type: object
 *                             properties:
 *                               role:
 *                                 type: string
 *                                 enum: [admin, auitor]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: "My Organization"
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not an admin
 *       409:
 *         description: Organization name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  apiLimiter,
  authenticate,
  authorize(["admin"]),
  validateSchema(createOrgSchema),
  async (req, res, next) => {
    try {
      const result = await createOrganization(req);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get user's organizations
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizations:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Organization'
 *                           - type: object
 *                             properties:
 *                               role:
 *                                 type: string
 *                                 enum: [admin, auditor]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", apiLimiter, authenticate, async (req, res, next) => {
  try {
    const result = await getOrganizations(req);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /organizations/{id}/members:
 *   get:
 *     summary: Get organization members
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: List of organization members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                       role:
 *                         type: string
 *                         enum: [admin, auditor]
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not a member of the organization
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:id/members",
  apiLimiter,
  authenticate,
  validateSchema(
    Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
    { property: "params" }
  ),
  organizationContext,
  authorize(["admin"]),
  async (req, res, next) => {
    try {
      const result = await getMembers(req, parseInt(req.params.id));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /organizations/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Member removed successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not an admin of the organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization, member, or membership not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id/members/:userId",
  apiLimiter,
  authenticate,
  organizationContext,
  authorize(["admin"]),
  validateSchema(
    Joi.object({
      id: Joi.number().integer().positive().required(),
      userId: Joi.number().integer().positive().required(),
    }),
    { property: "params" }
  ),
  async (req, res, next) => {
    try {
      const result = await removeMember(req, req.params.id, req.params.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /organizations/{id}/members:
 *   post:
 *     summary: Add a member to organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 123
 *               role:
 *                 type: string
 *                 enum: [admin, auditor]
 *     responses:
 *       201:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     role:
 *                       type: string
 *                       enum: [admin, auditor]
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not an admin of the organization
 *       404:
 *         description: Organization or user not found
 *       409:
 *         description: User is already a member
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/members",
  apiLimiter,
  authenticate,
  organizationContext,
  authorize(["admin"]),
  validateSchema(addMemberSchema),
  async (req, res, next) => {
    try {
      const result = await addMember(req, parseInt(req.params.id));
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
