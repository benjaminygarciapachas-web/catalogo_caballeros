const UserModel = require('../models/userModel');
const { generateToken } = require('../middlewares/authMiddleware');

const AuthController = {
  // Proceso de Login con verificación flexible y segura de roles
  login(req, res) {
    try {
      let { username, password, mode } = req.body;

      username = (username || '').trim();
      password = (password || '').trim();
      mode = (mode || '').toLowerCase().trim();

      const adminUserEnv = (process.env.ADMIN_USER || 'PATTYps').trim();
      const adminPassEnv = (process.env.ADMIN_PASS || 'PATTYpschincha452416').trim();

      // Validación de contraseña de administrador:
      // Acepta la clave del .env (PATTYpschincha452416), insensible a mayúsculas/minúsculas, o 'admin'
      const isMasterPass = Boolean(
        password && (
          password === adminPassEnv || 
          password.toLowerCase() === adminPassEnv.toLowerCase() ||
          password === 'admin'
        )
      );

      // ==========================================
      // CASO 1: INTENTO O CLAVE DE ADMINISTRADOR
      // ==========================================
      // Si ingresó la clave maestra, SIEMPRE es Administrador (sin importar si estaba en pestaña cliente o admin)
      if (isMasterPass) {
        // Puede usar su propio nombre ingresado, o 'PATTYps' si no puso ninguno
        const finalUsername = username || adminUserEnv;
        let user = UserModel.findByUsername(finalUsername);
        const roleRecord = UserModel.getRoleByName('admin');
        const roleId = roleRecord ? roleRecord.id : 1;

        if (!user) {
          user = UserModel.create({
            username: finalUsername,
            password_hash: adminPassEnv,
            role_id: roleId
          });
        } else if (user.role_id !== roleId) {
          // Si el usuario ya existía como cliente, promoverlo de inmediato a admin
          user = UserModel.updateRole(user.id, roleId);
        }

        const token = generateToken({
          id: user.id,
          username: user.username,
          role: 'admin'
        });

        return res.status(200).json({
          success: true,
          message: '👑 ¡Acceso concedido como Administrador!',
          role: 'admin',
          user: {
            id: user.id,
            username: user.username,
            role: 'admin'
          },
          token
        });
      }

      // Si intentó ingresar en modo Administrador (por pestaña, por nombre PATTYps/admin, o ingresó contraseña)
      const isTryingAdmin = 
        mode === 'admin' || 
        username.toLowerCase() === adminUserEnv.toLowerCase() || 
        username.toLowerCase() === 'admin' ||
        Boolean(password);

      if (isTryingAdmin) {
        if (!password) {
          return res.status(401).json({
            success: false,
            error: 'Debes ingresar la contraseña de Administrador. (Clave autorizada: PATTYpschincha452416 o admin).'
          });
        }

        return res.status(401).json({
          success: false,
          error: 'Contraseña de Administrador incorrecta. Clave autorizada: PATTYpschincha452416 (o admin).'
        });
      }

      // ==========================================
      // CASO 2: INGRESO EN MODO CLIENTE / VISITANTE
      // ==========================================
      if (!username) {
        username = `Cliente_${Math.floor(100 + Math.random() * 900)}`;
      }

      // Prohibir que un cliente tome el nombre del Administrador sin su clave
      if (username.toLowerCase() === adminUserEnv.toLowerCase() || username.toLowerCase() === 'admin') {
        return res.status(400).json({
          success: false,
          error: `El nombre "${username}" está reservado para el Administrador. Ingresa la contraseña de administrador para acceder.`
        });
      }

      let user = UserModel.findByUsername(username);
      const roleRecord = UserModel.getRoleByName('cliente');
      const roleId = roleRecord ? roleRecord.id : 2;

      if (!user) {
        user = UserModel.create({
          username,
          password_hash: null,
          role_id: roleId
        });
      }

      const token = generateToken({
        id: user.id,
        username: user.username,
        role: 'cliente'
      });

      return res.status(200).json({
        success: true,
        message: '👋 Sesión iniciada como Cliente.',
        role: 'cliente',
        user: {
          id: user.id,
          username: user.username,
          role: 'cliente'
        },
        token
      });
    } catch (error) {
      console.error('[AUTH ERROR login]', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno al procesar el inicio de sesión.'
      });
    }
  },

  // Obtener perfil actual a partir del token
  me(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado.' });
      }
      return res.status(200).json({
        success: true,
        user: req.user
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Error al verificar sesión.' });
    }
  }
};

module.exports = AuthController;
