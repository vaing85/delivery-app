import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Generate JWT tokens
const generateTokens = (userId: string) => {
	const jwtSecret = (process.env.JWT_SECRET || 'fallback-secret-key') as unknown as jwt.Secret;
	const jwtRefreshSecret = (process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key') as unknown as jwt.Secret;

	// Use numeric seconds to satisfy strict typings
	const accessExpiresInSeconds = Number(process.env.JWT_EXPIRES_IN_SEC || 900); // 15 minutes
	const refreshExpiresInSeconds = Number(process.env.JWT_REFRESH_EXPIRES_IN_SEC || 604800); // 7 days

	const accessToken = jwt.sign(
		{ userId },
		jwtSecret,
		{ expiresIn: accessExpiresInSeconds }
	);

	const refreshToken = jwt.sign(
		{ userId },
		jwtRefreshSecret,
		{ expiresIn: refreshExpiresInSeconds }
	);

	return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
	body('email').isEmail().normalizeEmail(),
	body('password').isLength({ min: 6 }),
	body('firstName').trim().notEmpty(),
	body('lastName').trim().notEmpty(),
	body('phone').optional().isMobilePhone('any'),
	body('role').optional().isIn(['CUSTOMER', 'DRIVER', 'BUSINESS', 'ADMIN', 'DISPATCHER'])
], async (req: Request, res: Response) => {
	try {
		// Check validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				error: {
					message: 'Validation failed',
					details: errors.array()
				}
			});
		}

		const { email, password, firstName, lastName, phone, role = 'CUSTOMER' } = req.body;

		// Check if user already exists
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [
					{ email },
					...(phone ? [{ phone }] : [])
				]
			}
		});

		if (existingUser) {
			return res.status(400).json({
				success: false,
				error: {
					message: 'User with this email or phone already exists'
				}
			});
		}

		// Hash password
		const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create user
		const user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				firstName,
				lastName,
				phone,
				role: role as any,
				isActive: true,
				isVerified: false
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				isActive: true,
				isVerified: true,
				createdAt: true
			}
		});

		// Create profile based on role
		if (role === 'DRIVER') {
			await prisma.driverProfile.create({
				data: {
					userId: user.id,
					licenseNumber: `LIC-${Date.now()}`, // Temporary, should be provided during registration
					vehicleType: 'CAR', // Default, should be provided during registration
					isAvailable: false,
					backgroundCheck: false
				}
			});
		} else if (role === 'CUSTOMER') {
			await prisma.customerProfile.create({
				data: {
					userId: user.id,
					totalOrders: 0,
					totalSpent: 0.0,
					loyaltyPoints: 0
				}
			});
		} else if (role === 'BUSINESS') {
			await prisma.customerProfile.create({
				data: {
					userId: user.id,
					totalOrders: 0,
					totalSpent: 0.0,
					loyaltyPoints: 0
				}
			});
		}

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user.id);

		return res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: {
				user,
				tokens: {
					accessToken,
					refreshToken
				}
			}
		});
	} catch (error) {
		console.error('Registration error:', error);
		return res.status(500).json({
			success: false,
			error: {
				message: 'Registration failed'
			}
		});
	}
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
	body('email').isEmail().normalizeEmail(),
	body('password').notEmpty()
], async (req: Request, res: Response) => {
	try {
		// Check validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				error: {
					message: 'Validation failed',
					details: errors.array()
				}
			});
		}

		const { email, password } = req.body;

		// Find user
		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				driverProfile: true,
				customerProfile: true,
				address: true
			}
		});

		if (!user || !user.isActive) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Invalid credentials or user inactive'
				}
			});
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Invalid credentials'
				}
			});
		}

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user.id);

		// Update last active for drivers
		if (user.role === 'DRIVER' && user.driverProfile) {
			await prisma.driverProfile.update({
				where: { userId: user.id },
				data: { lastActive: new Date() }
			});
		}

		// Remove password from response
		const { password: _, ...userWithoutPassword } = user;

		return res.json({
			success: true,
			message: 'Login successful',
			data: {
				user: userWithoutPassword,
				tokens: {
					accessToken,
					refreshToken
				}
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({
			success: false,
			error: {
				message: 'Login failed'
			}
		});
	}
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', [
	body('refreshToken').notEmpty()
], async (req: Request, res: Response) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(400).json({
				success: false,
				error: {
					message: 'Refresh token is required'
				}
			});
		}

		// Verify refresh token
		const jwtRefreshSecret = (process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key') as unknown as jwt.Secret;
		const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as any;
		
		// Check if user exists and is active
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: { id: true, isActive: true }
		});

		if (!user || !user.isActive) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Invalid refresh token'
				}
			});
		}

		// Generate new tokens
		const tokens = generateTokens(user.id);

		return res.json({
			success: true,
			message: 'Token refreshed successfully',
			data: {
				tokens
			}
		});
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Invalid refresh token'
				}
			});
		}

		if (error instanceof jwt.TokenExpiredError) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Refresh token expired'
				}
			});
		}

		console.error('Token refresh error:', error);
		return res.status(500).json({
			success: false,
			error: {
				message: 'Token refresh failed'
			}
		});
	}
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post('/logout', async (req: Request, res: Response) => {
	try {
		// In a real application, you might want to add the refresh token to a blacklist
		// For now, we'll just return a success response
		// The client should remove the tokens from storage

		return res.json({
			success: true,
			message: 'Logout successful'
		});
	} catch (error) {
		console.error('Logout error:', error);
		return res.status(500).json({
			success: false,
			error: {
				message: 'Logout failed'
			}
		});
	}
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', async (req: Request, res: Response) => {
	try {
		const userId = (req as any).user?.id;

		if (!userId) {
			return res.status(401).json({
				success: false,
				error: {
					message: 'Not authenticated'
				}
			});
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				driverProfile: true,
				customerProfile: true,
				address: true
			}
		});

		if (!user) {
			return res.status(404).json({
				success: false,
				error: {
					message: 'User not found'
				}
			});
		}

		// Remove password from response
		const { password: _, ...userWithoutPassword } = user;

		return res.json({
			success: true,
			data: { user: userWithoutPassword }
		});
	} catch (error) {
		console.error('Get profile error:', error);
		return res.status(500).json({
			success: false,
			error: {
				message: 'Failed to get profile'
			}
		});
	}
});

export default router;
