const authService = require('../services/auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const user = await authService.register({ name, email, password });
      res.status(201).json({
        success: true,
        message: 'Photographer registered successfully.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
