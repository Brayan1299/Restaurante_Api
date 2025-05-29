const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { successResponse, errorResponse } = require('../utils/response');

class AuthController {
    async register(req, res) {
        try {
            const { name, email, password, phone, preferences } = req.body;

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return errorResponse(res, 'El email ya está registrado', 400);
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const userData = {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                phone: phone || null,
                preferences: preferences || {}
            };

            const userId = await User.create(userData);
            const newUser = await User.findById(userId);

            const token = jwt.sign(
                { 
                    id: newUser.id, 
                    email: newUser.email,
                    name: newUser.name
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000
            });

            return successResponse(res, {
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    preferences: newUser.preferences
                },
                token
            }, 'Usuario registrado exitosamente', 201);

        } catch (error) {
            console.error('Error en registro:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findByEmail(email.toLowerCase().trim());
            if (!user) {
                return errorResponse(res, 'Credenciales inválidas', 401);
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return errorResponse(res, 'Credenciales inválidas', 401);
            }

            await User.updateLastLogin(user.id);

            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email,
                    name: user.name
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000
            });

            return successResponse(res, {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    preferences: user.preferences
                },
                token
            }, 'Inicio de sesión exitoso');

        } catch (error) {
            console.error('Error en login:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async logout(req, res) {
        try {
            res.clearCookie('token');
            return successResponse(res, null, 'Sesión cerrada exitosamente');
        } catch (error) {
            console.error('Error en logout:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async profile(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            if (!user) {
                return errorResponse(res, 'Usuario no encontrado', 404);
            }

            return successResponse(res, {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    preferences: user.preferences,
                    created_at: user.created_at
                }
            }, 'Perfil obtenido exitosamente');

        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return errorResponse(res, 'Usuario no encontrado', 404);
            }

            const cleanData = {};
            if (updateData.name) cleanData.name = updateData.name.trim();
            if (updateData.phone !== undefined) cleanData.phone = updateData.phone;
            if (updateData.preferences) cleanData.preferences = updateData.preferences;

            if (updateData.email && updateData.email !== user.email) {
                const emailExists = await User.emailExists(updateData.email.toLowerCase().trim(), userId);
                if (emailExists) {
                    return errorResponse(res, 'El email ya está en uso', 400);
                }
                cleanData.email = updateData.email.toLowerCase().trim();
            }

            if (updateData.password) {
                if (updateData.password.length < 6) {
                    return errorResponse(res, 'La contraseña debe tener al menos 6 caracteres', 400);
                }
                cleanData.password = await bcrypt.hash(updateData.password, 12);
            }

            await User.update(userId, cleanData);
            const updatedUser = await User.findById(userId);

            return successResponse(res, {
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    preferences: updatedUser.preferences
                }
            }, 'Perfil actualizado exitosamente');

        } catch (error) {
            console.error('Error actualizando perfil:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = new AuthController();